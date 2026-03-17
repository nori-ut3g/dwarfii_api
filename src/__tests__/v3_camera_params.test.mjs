#!/usr/bin/env node
// Verification script for v3_camera_params encode/decode and filter wheel constants.
// Run: node src/__tests__/v3_camera_params.test.mjs

import {
  encodeParamId,
  decodeParamId,
  V3_SHOOTING_MODE,
  V3_PARAM_CATEGORY,
  V3_CAMERA_ID,
  V3_PARAM_INDEX,
} from "../v3_camera_params.js";

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

console.log("\n=== encodeParamId / decodeParamId roundtrip ===\n");

// ASTRO/OPTICAL/TELE/FILTER_WHEEL → matches pcap value
const astroFilter = encodeParamId(
  V3_SHOOTING_MODE.ASTRO,
  V3_PARAM_CATEGORY.OPTICAL,
  V3_CAMERA_ID.TELE,
  V3_PARAM_INDEX.FILTER_WHEEL
);
assert(astroFilter === "144396663052566541", `ASTRO filter wheel encodes to 144396663052566541 (got ${astroFilter})`);

const decoded1 = decodeParamId(astroFilter);
assert(
  deepEqual(decoded1, { shootingMode: 2, category: 1, cameraId: 0, paramIndex: 13 }),
  `decodes back to {shootingMode:2, category:1, cameraId:0, paramIndex:13}`
);

// PHOTO/OPTICAL/TELE/FILTER_WHEEL → matches pcap notification value
const photoFilter = encodeParamId(
  V3_SHOOTING_MODE.PHOTO,
  V3_PARAM_CATEGORY.OPTICAL,
  V3_CAMERA_ID.TELE,
  V3_PARAM_INDEX.FILTER_WHEEL
);
assert(photoFilter === "281474976710669", `PHOTO filter wheel encodes to 281474976710669 (got ${photoFilter})`);

const decoded2 = decodeParamId(photoFilter);
assert(
  deepEqual(decoded2, { shootingMode: 0, category: 1, cameraId: 0, paramIndex: 13 }),
  `decodes back to {shootingMode:0, category:1, cameraId:0, paramIndex:13}`
);

// Arbitrary roundtrip
const encoded3 = encodeParamId(1, 3, 1, 7);
const decoded3 = decodeParamId(encoded3);
assert(
  deepEqual(decoded3, { shootingMode: 1, category: 3, cameraId: 1, paramIndex: 7 }),
  `roundtrip (1,3,1,7) works`
);

console.log("\n=== decodeParamId input types ===\n");

// BigInt input
const fromBigInt = decodeParamId(144396663052566541n);
assert(fromBigInt.shootingMode === 2 && fromBigInt.paramIndex === 13, "accepts BigInt input");

// protobuf.js Long object
// 144396663052566541 = 0x020100000000000D → high=0x02010000=33619968, low=0x0000000D=13
const fromLong = decodeParamId({ low: 13, high: 33619968 });
assert(
  deepEqual(fromLong, { shootingMode: 2, category: 1, cameraId: 0, paramIndex: 13 }),
  "accepts protobuf Long object"
);

// Unsafe number should throw
let threw = false;
try {
  decodeParamId(144396663052566541);
} catch (e) {
  threw = e instanceof RangeError;
}
assert(threw, "throws RangeError on unsafe number");

console.log("\n=== Constants ===\n");
assert(V3_SHOOTING_MODE.ASTRO === 2, "V3_SHOOTING_MODE.ASTRO = 2");
assert(V3_PARAM_CATEGORY.OPTICAL === 1, "V3_PARAM_CATEGORY.OPTICAL = 1");
assert(V3_CAMERA_ID.TELE === 0, "V3_CAMERA_ID.TELE = 0");
assert(V3_PARAM_INDEX.FILTER_WHEEL === 0x0d, "V3_PARAM_INDEX.FILTER_WHEEL = 0x0D");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
