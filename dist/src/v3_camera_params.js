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
 * V3: Adjust camera parameter
 * Create Encoded Packet for the command CMD_V3_CAMERA_PARAMS_ADJUST
 * @param {number} paramId - Parameter ID (large varint from HTTP API)
 * @param {number} value - Parameter value
 * @returns {Uint8Array}
 */
export function messageV3CameraParamsAdjust(paramId, value) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_CAMERA_PARAMS;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_CAMERA_PARAMS_ADJUST;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({ paramId: paramId, value: value });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
