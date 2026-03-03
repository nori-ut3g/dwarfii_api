/** @module v3_camera_params */
// Import the generated protobuf module
import $root from "./protobuf/protobuf.js";
const Dwarfii_Api = $root;
import { createPacket } from "./api_utils.js";
import { cmdMapping } from "./cmd_mapping.js";

/*** --------------------------------------------------------- ***/
/*** -------- V3 MODULE CAMERA PARAMS (16700+) --------------- ***/
/*** --------------------------------------------------------- ***/
/**
 * V3: Set camera parameter (general)
 * Create Encoded Packet for the command CMD_V3_CAMERA_PARAMS_SET_PARAM (16700)
 * @param {number} paramId - Parameter ID (encoded via encodeParamId)
 * @param {number} value - Parameter value
 * @param {number} [flag=0] - Flag (0 = auto, 1 = manual; used for some params)
 * @returns {Uint8Array}
 */
export function messageV3CameraParamSet(paramId, value, flag = 0) {
  let module_id = Dwarfii_Api.ModuleId.MODULE_CAMERA_PARAMS;
  let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_CAMERA_PARAMS_SET_PARAM;
  let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
  const cmdClass = cmdMapping[interface_id];
  let class_message = Dwarfii_Api[cmdClass];
  let message = class_message.create({
    paramId: paramId,
    flag: flag,
    value: value,
  });
  console.log(
    `class Message = ${cmdClass} created message = ${JSON.stringify(message)}`
  );
  return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Set exposure/gain parameter
 * Create Encoded Packet for the command CMD_V3_CAMERA_PARAMS_SET_EXP_GAIN (16701)
 * @param {number} paramId - Parameter ID (encoded via encodeParamId)
 * @param {number} value - Exposure or gain value
 * @param {number} [flag=1] - Flag (1 = manual mode)
 * @returns {Uint8Array}
 */
export function messageV3CameraParamSetExpGain(paramId, value, flag = 1) {
  let module_id = Dwarfii_Api.ModuleId.MODULE_CAMERA_PARAMS;
  let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_CAMERA_PARAMS_SET_EXP_GAIN;
  let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
  const cmdClass = cmdMapping[interface_id];
  let class_message = Dwarfii_Api[cmdClass];
  let message = class_message.create({
    paramId: paramId,
    flag: flag,
    value: value,
  });
  console.log(
    `class Message = ${cmdClass} created message = ${JSON.stringify(message)}`
  );
  return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Adjust camera parameter (relative adjustment)
 * Create Encoded Packet for the command CMD_V3_CAMERA_PARAMS_ADJUST (16703)
 * @param {number} paramId - Parameter ID (encoded via encodeParamId)
 * @param {number} value - Adjustment value (positive = increase, negative = decrease)
 * @returns {Uint8Array}
 */
export function messageV3CameraParamsAdjust(paramId, value) {
  let module_id = Dwarfii_Api.ModuleId.MODULE_CAMERA_PARAMS;
  let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_CAMERA_PARAMS_ADJUST;
  let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
  const cmdClass = cmdMapping[interface_id];
  let class_message = Dwarfii_Api[cmdClass];
  let message = class_message.create({ paramId: paramId, value: value });
  console.log(
    `class Message = ${cmdClass} created message = ${JSON.stringify(message)}`
  );
  return createPacket(message, class_message, module_id, interface_id, type_id);
}

/**
 * Encode a paramId from its constituent parts.
 *
 * paramId layout (unsigned 32-bit packed into int64 proto field):
 *   bits [31..24] = shootingMode  (e.g. 0=photo, 1=video, 2=astro)
 *   bits [23..16] = category      (parameter group)
 *   bits [15..8]  = cameraId      (0=tele, 1=wide)
 *   bits [7..0]   = paramIndex    (parameter index within the category)
 *
 * @param {number} shootingMode - Shooting mode (0=photo, 1=video, 2=astro)
 * @param {number} category - Parameter category
 * @param {number} cameraId - Camera ID (0=tele, 1=wide)
 * @param {number} paramIndex - Parameter index within the category
 * @returns {number} Encoded paramId
 */
export function encodeParamId(shootingMode, category, cameraId, paramIndex) {
  return (
    (((shootingMode & 0xff) << 24) |
      ((category & 0xff) << 16) |
      ((cameraId & 0xff) << 8) |
      (paramIndex & 0xff)) >>>
    0
  );
}

/**
 * Decode a paramId into its constituent parts.
 *
 * @param {number} paramId - Encoded parameter ID
 * @returns {{ shootingMode: number, category: number, cameraId: number, paramIndex: number }}
 */
export function decodeParamId(paramId) {
  const id = paramId >>> 0; // normalize to unsigned 32-bit
  return {
    shootingMode: (id >>> 24) & 0xff,
    category: (id >>> 16) & 0xff,
    cameraId: (id >>> 8) & 0xff,
    paramIndex: id & 0xff,
  };
}
