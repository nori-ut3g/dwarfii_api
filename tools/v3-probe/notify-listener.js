#!/usr/bin/env node
// Long-running notification listener for DWARF mini.
// Opens camera, then collects all notifications to understand
// what the device pushes automatically.

import WebSocket from "ws";
import protobuf from "protobufjs";
import path from "path";
import { fileURLToPath } from "url";
import {
  parseArgs,
  log,
  timestamp,
  hexPreview,
  DEFAULT_CLIENT_ID,
  MODULE,
  MSG_TYPE,
} from "./common.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_DIR = path.resolve(__dirname, "../../src/proto");

let DEVICE_ID = 4;
const MAJOR_VERSION = 1;
const MINOR_VERSION = 8;

async function loadProtoRoot() {
  const root = new protobuf.Root();
  const protoFiles = [
    "base.proto", "protocol.proto", "camera.proto", "astro.proto",
    "system.proto", "motor_control.proto", "notify.proto", "track.proto",
    "focus.proto", "panorama.proto", "rgb.proto", "ble.proto",
    "shooting_schedule.proto",
  ];
  for (const file of protoFiles) {
    try { await root.load(path.join(PROTO_DIR, file)); } catch {}
  }
  return root;
}

function buildPacket(root, mod, cmd, msgTypeName, data) {
  const WsPacket = root.lookupType("WsPacket");
  let innerBuf = new Uint8Array(0);
  if (msgTypeName) {
    try {
      const MsgType = root.lookupType(msgTypeName);
      innerBuf = MsgType.encode(MsgType.create(data || {})).finish();
    } catch {}
  }
  return WsPacket.encode(WsPacket.create({
    majorVersion: MAJOR_VERSION,
    minorVersion: MINOR_VERSION,
    deviceId: DEVICE_ID,
    moduleId: mod,
    cmd,
    type: MSG_TYPE.REQUEST,
    data: innerBuf,
    clientId: DEFAULT_CLIENT_ID,
  })).finish();
}

// All known notify message types
const NOTIFY_MAP = {
  15200: "ResNotifyWidiPictureMatching",
  15201: "ResNotifyEle",
  15202: "ResNotifyCharge",
  15203: "ResNotifySDcardInfo",
  15204: "ResNotifyTeleRecordTime",
  15205: "ResNotifyTeleTimelaseOutTime",
  15206: "ResNotifyStateCaptureRawDark",
  15207: "ResNotifyPrographCaptureRawDark",
  15208: "ResNotifyStateCaptureRawLiveStacking",
  15209: "ResNotifyPrographCaptureRawLiveStacking",
  15210: "ResNotifyStateAstroCalibration",
  15211: "ResNotifyStateAstroGoto",
  15212: "ResNotifyStateAstroTracking",
  15213: "ResNotifyTeleSetParam",
  15214: "ResNotifyWideSetParam",
  15215: "ResNotifyTeleFunctionState",
  15216: "ResNotifyWideFunctionState",
  15217: "ResNotifySetFeatureParam",
  15218: "ResNotifyTeleBurstProgress",
  15219: "ResNotifyPanoramaProgress",
  15220: "ResNotifyWideBurstProgress",
  15221: "ResNotifyRGBState",
  15222: "ResNotifyPowerIndState",
  15223: "ResNotifyWsHostSlaveMode",
  15224: "ResNotifyMtpState",
  15225: "ResNotifyTrackResult",
  15226: "ResNotifyWideTimelaseOutTime",
  15227: "ResNotifyCpuMode",
  15228: "ResNotifyStateAstroTrackingSpecial",
  15229: "ResNotifyPowerOff",
  15230: "ResNotifyAlbumUpdate",
  15231: "ResNotifySentryModeState",
  15234: "ResNotifyStreamType",
  15235: "ResNotifyWideRecordTime",
  15236: "ResNotifyStateWideCaptureRawLiveStacking",
  15237: "ResNotifyPrographWideCaptureRawLiveStacking",
  15238: "ResNotifyMultiTrackResult",
  15239: "ResNotifyEqSolvingState",
  15240: "ResNotifyUfoModeState",
  15241: "ResNotifyTeleLongExpProgress",
  15242: "ResNotifyWideLongExpProgress",
  15243: "ResNotifyTemperature",
  15247: "ResNotifyStateCaptureWideDark",
  15248: "ResNotifyShootingScheduleResultAndState",
  15249: "ResNotifyShootingTaskState",
  15250: "ResNotifySkySearchState",
  15257: "ResNotifyFocus",
};

// Response type mapping
const RESP_MAP = {
  10000: "ResOpenCamera",
  10001: "ResCloseCamera",
  12000: "ResOpenCamera",
  12001: "ResCloseCamera",
  13004: "ResSetMasterLock",
  14011: "ResGetPosition",
};

function decodePacket(root, buf) {
  const WsPacket = root.lookupType("WsPacket");
  const pkt = WsPacket.toObject(WsPacket.decode(buf), {
    longs: String, enums: String, bytes: String, defaults: true,
  });

  // Try decode inner data
  const innerBytes = pkt.data
    ? (typeof pkt.data === "string" ? Buffer.from(pkt.data, "base64") : pkt.data)
    : null;

  if (innerBytes && innerBytes.length > 0) {
    // Pick type based on message type
    let typeName;
    if (pkt.type === 2) typeName = NOTIFY_MAP[pkt.cmd];
    else if (pkt.type === 1 || pkt.type === 3) typeName = RESP_MAP[pkt.cmd];

    if (typeName) {
      try {
        const T = root.lookupType(typeName);
        pkt._inner = T.toObject(T.decode(innerBytes), {
          longs: String, enums: String, bytes: String, defaults: true,
        });
        pkt._innerType = typeName;
      } catch {
        pkt._innerHex = hexPreview(innerBytes, 128);
        pkt._innerType = typeName + " (failed)";
      }
    } else {
      // Try blind wire-format decode
      pkt._innerHex = hexPreview(innerBytes, 128);
    }
  }

  return pkt;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function main() {
  const args = parseArgs(process.argv);
  let listenDuration = 30; // seconds
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === "--duration") listenDuration = parseInt(process.argv[++i], 10);
    if (process.argv[i] === "--device-id") DEVICE_ID = parseInt(process.argv[++i], 10);
  }

  if (args.help) {
    console.log("Usage: node notify-listener.js --ip <addr> [--duration <secs>] [--verbose]");
    process.exit(0);
  }

  const root = await loadProtoRoot();
  const allMessages = [];
  const cmdSeen = new Map();

  log.section(`NOTIFICATION LISTENER: ${args.ip}:${args.port}`);
  log.info(`Listen duration: ${listenDuration}s after camera open`);

  // Connect
  const ws = await new Promise((resolve, reject) => {
    const s = new WebSocket(`ws://${args.ip}:${args.port}`, {
      handshakeTimeout: 5000, perMessageDeflate: false,
    });
    s.on("open", () => resolve(s));
    s.on("error", reject);
  });
  log.ok("Connected");

  // Global message handler
  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      log.data(`  [TEXT] ${data.toString().substring(0, 100)}`);
      return;
    }
    try {
      const pkt = decodePacket(root, new Uint8Array(data));
      const typeNames = { 0: "REQ", 1: "RESP", 2: "NOTIFY", 3: "NRESP" };
      const tn = typeNames[pkt.type] || `type=${pkt.type}`;

      allMessages.push(pkt);
      const key = `${pkt.cmd}:${pkt.type}`;
      cmdSeen.set(key, (cmdSeen.get(key) || 0) + 1);

      let line = `[${tn}] mod=${pkt.moduleId} cmd=${pkt.cmd}`;
      if (pkt._innerType) line += ` → ${pkt._innerType}`;
      log.data(`  ${line}`);

      if (pkt._inner) {
        const nz = Object.entries(pkt._inner).filter(([, v]) =>
          v !== 0 && v !== "" && v !== false && v !== null
        );
        if (nz.length > 0) {
          log.data(`    ${JSON.stringify(Object.fromEntries(nz))}`);
        }
      } else if (pkt._innerHex) {
        log.data(`    Raw: ${pkt._innerHex}`);
      }
    } catch (e) {
      log.warn(`  Decode error: ${e.message}`);
      log.data(`  Hex: ${hexPreview(data, 64)}`);
    }
  });

  // Phase 1: Initial 5s before camera open
  log.info("\n--- Phase 1: Passive listen (5s before camera) ---");
  await sleep(5000);

  // Phase 2: HOST + Open wide camera
  log.info("\n--- Phase 2: SetMasterLock(HOST) ---");
  ws.send(buildPacket(root, MODULE.SYSTEM, 13004, "ReqsetMasterLock", { lock: true }));
  await sleep(2000);

  log.info("\n--- Phase 3: OpenCamera(wide) ---");
  ws.send(buildPacket(root, MODULE.CAMERA_WIDE, 12000, "ReqOpenCamera", { binning: true }));
  await sleep(3000);

  log.info("\n--- Phase 4: OpenCamera(tele) ---");
  ws.send(buildPacket(root, MODULE.CAMERA_TELE, 10000, "ReqOpenCamera", { binning: false, rtspEncodeType: 0 }));
  await sleep(3000);

  // Phase 5: Long listen
  log.info(`\n--- Phase 5: Listening for ${listenDuration}s ---`);
  for (let i = 0; i < listenDuration; i += 5) {
    await sleep(5000);
    log.info(`  ... ${i + 5}s elapsed, ${allMessages.length} messages total`);
  }

  // Close cameras
  log.info("\n--- Phase 6: Close cameras ---");
  ws.send(buildPacket(root, MODULE.CAMERA_WIDE, 12001, "ReqCloseCamera", {}));
  await sleep(1000);
  ws.send(buildPacket(root, MODULE.CAMERA_TELE, 10001, "ReqCloseCamera", {}));
  await sleep(1000);

  ws.close(1000, "listen-complete");

  // Summary
  log.section("NOTIFICATION SUMMARY");
  log.info(`Total messages received: ${allMessages.length}`);
  log.info("\nMessage types seen:");

  const sorted = [...cmdSeen.entries()].sort((a, b) => {
    const [cmdA] = a[0].split(":");
    const [cmdB] = b[0].split(":");
    return parseInt(cmdA) - parseInt(cmdB);
  });

  for (const [key, count] of sorted) {
    const [cmd, type] = key.split(":");
    const typeNames = { "0": "REQ", "1": "RESP", "2": "NOTIFY", "3": "NRESP" };
    const tn = typeNames[type] || `type=${type}`;
    const notifyName = NOTIFY_MAP[parseInt(cmd)] || RESP_MAP[parseInt(cmd)] || "";
    console.log(`  CMD ${cmd.padStart(5)} [${tn.padEnd(6)}] × ${count}  ${notifyName}`);
  }

  log.info(`\nCompleted at ${timestamp()}`);
}

main().catch(e => {
  log.fail(`Error: ${e.message}`);
  process.exit(1);
});
