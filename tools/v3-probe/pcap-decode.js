#!/usr/bin/env node
// Decode WsPacket protobuf data extracted from pcap via tshark.
// Reads hex data from stdin (one packet per line) and decodes each.

import protobuf from "protobufjs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { log, hexPreview } from "./common.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROTO_DIR = path.resolve(__dirname, "../../src/proto");

// Known command names
const CMD_NAMES = {
  10000: "OpenCamera(tele)", 10001: "CloseCamera(tele)",
  10007: "SetExpMode(tele)", 10008: "GetExpMode(tele)",
  10009: "SetExp(tele)", 10010: "GetExp(tele)",
  10013: "SetGain(tele)", 10014: "GetGain(tele)",
  10031: "SetIrcut", 10032: "GetIrcut",
  10035: "SetAllParams(tele)", 10036: "GetAllParams(tele)",
  10037: "SetFeatureParam", 10038: "GetAllFeatureParams",
  10039: "GetSystemWorkingState",
  11000: "StartCalibration", 11002: "StartGotoDSO",
  12000: "OpenCamera(wide)", 12001: "CloseCamera(wide)",
  12027: "GetAllParams(wide)", 12028: "SetAllParams(wide)",
  13000: "SetTime", 13001: "SetTimeZone", 13004: "SetMasterLock",
  13500: "OpenRGB", 13501: "CloseRGB",
  14000: "MotorRun", 14011: "MotorGetPosition",
  15000: "AutoFocus",
  15200: "N:WidiMatch", 15201: "N:Battery", 15202: "N:Charge",
  15203: "N:SDCard", 15213: "N:TeleParam", 15214: "N:WideParam",
  15215: "N:TeleFuncState", 15216: "N:WideFuncState",
  15217: "N:SetFeatureParam",
  15221: "N:RGB", 15223: "N:HostSlave", 15234: "N:StreamType",
  15243: "N:Temperature", 15257: "N:Focus",
  15264: "N:V3CameraParam",
  16700: "V3:SetCameraParam", 16701: "V3:SetExpGain", 16703: "V3:AdjustParam",
};

// Response/Notify inner message types
const INNER_TYPES = {
  // type=1 (RESP)
  "10000:1": "ResOpenCamera", "10001:1": "ResCloseCamera",
  "12000:1": "ResOpenCamera", "12001:1": "ResCloseCamera",
  "10036:1": "ResGetAllParams", "10038:1": "ResGetAllFeatureParams",
  "10039:1": "ResGetSystemWorkingState",
  "12027:1": "ResGetAllParams",
  "13000:1": "ResSetTime", "13004:1": "ResSetMasterLock",
  // type=2 (NOTIFY)
  "15201:2": "ResNotifyEle", "15202:2": "ResNotifyCharge",
  "15203:2": "ResNotifySDcardInfo",
  "15213:2": "ResNotifyTeleSetParam", "15214:2": "ResNotifyWideSetParam",
  "15215:2": "ResNotifyTeleFunctionState", "15216:2": "ResNotifyWideFunctionState",
  "15217:2": "ResNotifySetFeatureParam",
  "15221:2": "ResNotifyRGBState", "15223:2": "ResNotifyWsHostSlaveMode",
  "15234:2": "ResNotifyStreamType",
  "15264:2": "V3ResNotifyCameraParamState",
  // type=0 (REQ)
  "16700:0": "V3ReqSetCameraParam", "16701:0": "V3ReqSetExposureGain",
  "16703:0": "V3ReqAdjustParam",
  // type=1 (RESP) — V3 camera params use ComResponse
  "16700:1": "ComResponse", "16701:1": "ComResponse", "16703:1": "ComResponse",
  // type=3 (NRESP)
  "10000:3": "ResOpenCamera", "12000:3": "ResOpenCamera",
  "10001:3": "ResCloseCamera", "12001:3": "ResCloseCamera",
  "10039:3": "ResGetSystemWorkingState",
  "14011:3": "ResGetPosition",
  "13004:3": "ResSetMasterLock",
};

async function loadProtoRoot() {
  const root = new protobuf.Root();
  const protoFiles = [
    "base.proto", "protocol.proto", "camera.proto", "astro.proto",
    "system.proto", "motor_control.proto", "notify.proto", "track.proto",
    "focus.proto", "panorama.proto", "rgb.proto", "ble.proto",
    "shooting_schedule.proto",
    "v3_camera.proto", "v3_notify.proto", "v3_astro.proto",
    "v3_system.proto", "v3_focus.proto",
  ];
  for (const file of protoFiles) {
    try { await root.load(path.join(PROTO_DIR, file)); } catch {}
  }
  return root;
}

function parseHex(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Extract WebSocket payload from a raw TCP payload containing a WS frame.
 * Handles masking (client→server frames are XOR-masked per RFC 6455).
 */
function extractWsPayload(buf) {
  if (buf.length < 2) return null;

  const byte0 = buf[0];
  const byte1 = buf[1];
  const opcode = byte0 & 0x0f;
  const masked = (byte1 & 0x80) !== 0;
  let payloadLen = byte1 & 0x7f;
  let offset = 2;

  // Text (1) or Binary (2) frames only; skip close/ping/pong
  if (opcode !== 1 && opcode !== 2) return null;

  if (payloadLen === 126) {
    if (buf.length < 4) return null;
    payloadLen = (buf[2] << 8) | buf[3];
    offset = 4;
  } else if (payloadLen === 127) {
    if (buf.length < 10) return null;
    // 64-bit length, but we only handle up to 32-bit
    payloadLen = (buf[6] << 24) | (buf[7] << 16) | (buf[8] << 8) | buf[9];
    offset = 10;
  }

  let maskKey;
  if (masked) {
    if (buf.length < offset + 4) return null;
    maskKey = buf.subarray(offset, offset + 4);
    offset += 4;
  }

  const end = Math.min(offset + payloadLen, buf.length);
  const payload = new Uint8Array(buf.subarray(offset, end));

  // Unmask if needed
  if (masked && maskKey) {
    for (let i = 0; i < payload.length; i++) {
      payload[i] ^= maskKey[i % 4];
    }
  }

  return payload;
}

async function main() {
  const pcapFile = process.argv[2] || `${process.env.HOME}/iphone-capture.pcap`;
  const root = await loadProtoRoot();
  const WsPacket = root.lookupType("WsPacket");

  log.section("PCAP DECODE — DwarfLab App Traffic");

  // Extract WebSocket data using tshark
  // Filter for port 9900, get raw TCP payload (includes WebSocket framing)
  const tsharkCmd = `tshark -r "${pcapFile}" -Y "tcp.port == 9900 && tcp.len > 0" -T fields -e frame.number -e frame.time_relative -e ip.src -e ip.dst -e tcp.payload 2>&1`;

  let output;
  try {
    output = execSync(tsharkCmd, { encoding: "utf-8", maxBuffer: 50 * 1024 * 1024 });
  } catch (e) {
    // tshark may exit non-zero for truncated pcap but still produce output
    if (e.stdout) {
      output = e.stdout;
    } else {
      log.fail(`tshark error: ${e.message}`);
      process.exit(1);
    }
  }

  const lines = output.trim().split("\n").filter(l => l.trim());
  log.info(`Extracted ${lines.length} data packets from pcap`);

  const DWARF_IP = "192.168.11.31";
  let packetNum = 0;

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length < 5) continue;

    const [frameNo, timeRel, srcIp, dstIp, hexData] = parts;
    if (!hexData || hexData.length < 4) continue;

    const dir = srcIp === DWARF_IP ? "DWARF→App" : "App→DWARF";
    const dirColor = srcIp === DWARF_IP ? "\x1b[36m" : "\x1b[33m";

    // hexData may contain multiple WsPackets concatenated (comma-separated by tshark)
    const hexChunks = hexData.split(",");

    for (const chunk of hexChunks) {
      packetNum++;

      // Skip WebSocket handshake (HTTP upgrade)
      if (chunk.startsWith("474554") || chunk.startsWith("48545450")) continue; // GET or HTTP
      if (chunk.length <= 8) continue;

      const rawBytes = parseHex(chunk);

      // Parse WebSocket frame to extract payload
      const wsPayload = extractWsPayload(rawBytes);
      if (!wsPayload || wsPayload.length < 4) continue;

      // Try to decode as WsPacket
      let pkt;
      try {
        pkt = WsPacket.decode(wsPayload);
      } catch {
        // Fallback: try raw bytes (maybe not WS-framed)
        try {
          pkt = WsPacket.decode(rawBytes);
        } catch {
          continue;
        }
      }

      const obj = WsPacket.toObject(pkt, {
        longs: String, enums: String, bytes: String, defaults: true,
      });

      // Validate - must have reasonable version
      if (obj.majorVersion < 1 || obj.majorVersion > 3) continue;
      if (obj.minorVersion > 30) continue;

      const typeNames = { 0: "REQ", 1: "RESP", 2: "NOTIFY", 3: "NRESP" };
      const tn = typeNames[obj.type] || `type=${obj.type}`;
      const cmdName = CMD_NAMES[obj.cmd] || `CMD_${obj.cmd}`;

      // Decode inner data
      let innerStr = "";
      if (obj.data && obj.data.length > 0) {
        const innerBytes = typeof obj.data === "string"
          ? Buffer.from(obj.data, "base64") : obj.data;

        if (innerBytes.length > 0) {
          const innerTypeName = INNER_TYPES[`${obj.cmd}:${obj.type}`];
          if (innerTypeName) {
            try {
              const InnerType = root.lookupType(innerTypeName);
              const inner = InnerType.toObject(InnerType.decode(innerBytes), {
                longs: String, enums: String, bytes: String, defaults: true,
              });
              // Filter out zero/empty values for compact display
              const nz = Object.entries(inner).filter(([, v]) =>
                v !== 0 && v !== "" && v !== false && v !== null
              );
              if (nz.length > 0) {
                innerStr = ` → ${innerTypeName}: ${JSON.stringify(Object.fromEntries(nz))}`;
              } else {
                innerStr = ` → ${innerTypeName}: {}`;
              }
            } catch {
              innerStr = ` → ${innerTypeName}(fail) raw=${hexPreview(innerBytes, 32)}`;
            }
          } else {
            innerStr = ` raw=${hexPreview(innerBytes, 32)}`;
          }
        }
      }

      // Truncate clientId for display
      const shortClient = obj.clientId ? obj.clientId.substring(0, 8) + "..." : "";

      console.log(
        `${dirColor}#${packetNum.toString().padStart(3)} ${dir.padEnd(10)}\x1b[0m` +
        ` [${tn.padEnd(6)}] v${obj.majorVersion}.${obj.minorVersion.toString().padEnd(2)}` +
        ` dev=${obj.deviceId} mod=${obj.moduleId} cmd=${obj.cmd.toString().padEnd(5)}` +
        ` ${cmdName}${innerStr}`
      );
    }
  }

  log.section("DONE");
  log.info(`Decoded ${packetNum} packets`);
}

main().catch(e => {
  log.fail(`Error: ${e.message}`);
  process.exit(1);
});
