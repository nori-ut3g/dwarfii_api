/** @module v3_astro */
// Import the generated protobuf module
import $root from "./protobuf/protobuf.js";
const Dwarfii_Api = $root;
import { createPacket } from "./api_utils.js";
import { cmdMapping } from "./cmd_mapping.js";
/*** --------------------------------------------------------- ***/
/*** ------------- V3 MODULE ASTRO (11xxx) ------------------- ***/
/*** --------------------------------------------------------- ***/
/**
 * V3: Start stacking with frame count
 * Create Encoded Packet for the command CMD_ASTRO_START_CAPTURE_RAW_LIVE_STACKING
 * @param {number} frameCount - Number of frames (-1 for infinite)
 * @returns {Uint8Array}
 */
export function messageV3AstroStartStacking(frameCount = -1) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_ASTRO_START_CAPTURE_RAW_LIVE_STACKING;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({ frameCount: frameCount });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Stop stacking
 * Create Encoded Packet for the command CMD_ASTRO_STOP_CAPTURE_RAW_LIVE_STACKING
 * @returns {Uint8Array}
 */
export function messageV3AstroStopStacking() {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_ASTRO_STOP_CAPTURE_RAW_LIVE_STACKING;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({});
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Start tracking (after stacking)
 * Create Encoded Packet for the command CMD_ASTRO_GO_LIVE
 * @returns {Uint8Array}
 */
export function messageV3AstroStartTracking() {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_ASTRO_GO_LIVE;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({});
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: One-click GOTO DSO with lon/lat/mode
 * Create Encoded Packet for the command CMD_ASTRO_START_ONE_CLICK_GOTO_DSO
 * @param {number} ra - Right Ascension (degrees)
 * @param {number} dec - Declination (degrees)
 * @param {string} targetName - Target name
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @param {number} mode - Mode (default 2)
 * @returns {Uint8Array}
 */
export function messageV3AstroGotoDSO(ra, dec, targetName, lon, lat, mode = 2) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_ASTRO_START_ONE_CLICK_GOTO_DSO;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({
        ra: ra,
        dec: dec,
        targetName: targetName,
        lon: lon,
        lat: lat,
        mode: mode,
    });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: One-click GOTO Solar System target with mode
 * Create Encoded Packet for the command CMD_ASTRO_START_ONE_CLICK_GOTO_SOLAR_SYSTEM
 * @param {number} index - Solar system target ID (9=Sun, 8=Moon, etc.)
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @param {string} targetName - Target name
 * @param {number} mode - Mode (default 8)
 * @returns {Uint8Array}
 */
export function messageV3AstroGotoSolar(index, lon, lat, targetName, mode = 8) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_ASTRO_START_ONE_CLICK_GOTO_SOLAR_SYSTEM;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({
        index: index,
        lon: lon,
        lat: lat,
        targetName: targetName,
        mode: mode,
    });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: GOTO done / acknowledge
 * Create Encoded Packet for the command CMD_ASTRO_STOP_ONE_CLICK_GOTO
 * @returns {Uint8Array}
 */
export function messageV3AstroGotoDone() {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_ASTRO_STOP_ONE_CLICK_GOTO;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({});
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Save stacked image
 * Create Encoded Packet for the command CMD_V3_ASTRO_SAVE_STACKED_IMAGE
 * @param {string} path - Save path on device
 * @returns {Uint8Array}
 */
export function messageV3AstroSaveImage(path) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_SAVE_STACKED_IMAGE;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({ path: path });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: List saved images
 * Create Encoded Packet for the command CMD_V3_ASTRO_LIST_SAVED_IMAGES
 * @returns {Uint8Array}
 */
export function messageV3AstroListImages() {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_LIST_SAVED_IMAGES;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({});
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Status polling
 * Create Encoded Packet for the command CMD_V3_ASTRO_STATUS_POLLING
 * @param {number} f1 - Field 1 (default -1)
 * @param {number} f2 - Field 2 (default 100)
 * @param {number} f3 - Field 3 (default 100)
 * @param {number} f4 - Field 4 (default -1)
 * @returns {Uint8Array}
 */
export function messageV3AstroStatusPolling(f1 = -1, f2 = 100, f3 = 100, f4 = -1) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_STATUS_POLLING;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({
        field1: f1,
        field2: f2,
        field3: f3,
        field4: f4,
    });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Get astro parameters
 * Create Encoded Packet for the command CMD_V3_ASTRO_GET_PARAMS
 * @param {number} mode - Mode (0 or 1)
 * @returns {Uint8Array}
 */
export function messageV3AstroGetParams(mode = 0) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_GET_PARAMS;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({ mode: mode });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Set astro parameters
 * Create Encoded Packet for the command CMD_V3_ASTRO_SET_PARAMS
 * @param {string} params - Pipe-delimited parameter string e.g. "0|0|60|60|1|null"
 * @returns {Uint8Array}
 */
export function messageV3AstroSetParams(params) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_SET_PARAMS;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({ params: params });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Get exposure presets
 * Create Encoded Packet for the command CMD_V3_ASTRO_GET_PRESETS
 * @returns {Uint8Array}
 */
export function messageV3AstroGetPresets() {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_GET_PRESETS;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({});
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Set observation location
 * Create Encoded Packet for the command CMD_V3_ASTRO_SET_LOCATION
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @returns {Uint8Array}
 */
export function messageV3AstroSetLocation(lon, lat) {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_SET_LOCATION;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({ lon: lon, lat: lat });
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
/**
 * V3: Confirm observation
 * Create Encoded Packet for the command CMD_V3_ASTRO_CONFIRM
 * @returns {Uint8Array}
 */
export function messageV3AstroConfirm() {
    let module_id = Dwarfii_Api.ModuleId.MODULE_ASTRO;
    let interface_id = Dwarfii_Api.DwarfCMD.CMD_V3_ASTRO_CONFIRM;
    let type_id = Dwarfii_Api.MessageTypeId.TYPE_REQUEST;
    const cmdClass = cmdMapping[interface_id];
    let class_message = Dwarfii_Api[cmdClass];
    let message = class_message.create({});
    console.log(`class Message = ${cmdClass} created message = ${JSON.stringify(message)}`);
    return createPacket(message, class_message, module_id, interface_id, type_id);
}
