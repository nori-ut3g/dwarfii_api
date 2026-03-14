/*** --------------------------------------------------------- ***/
/*** -------- V3 MODULE CAMERA PARAMS (16700+) --------------- ***/
/*** --------------------------------------------------------- ***/
/**
 * V3: Set camera parameter (general)
 * Create Encoded Packet for the command CMD_V3_CAMERA_PARAMS_SET_PARAM (16700)
 * @param {number|string} paramId - Parameter ID (encoded via encodeParamId)
 * @param {number} value - Parameter value
 * @param {number} [flag=0] - Flag (0 = auto, 1 = manual; used for some params)
 * @returns {Uint8Array}
 */
export function messageV3CameraParamSet(paramId: number | string, value: number, flag?: number): Uint8Array;
/**
 * V3: Set exposure/gain parameter
 * Create Encoded Packet for the command CMD_V3_CAMERA_PARAMS_SET_EXP_GAIN (16701)
 * @param {number|string} paramId - Parameter ID (encoded via encodeParamId)
 * @param {number} value - Exposure or gain value
 * @param {number} [flag=1] - Flag (1 = manual mode)
 * @returns {Uint8Array}
 */
export function messageV3CameraParamSetExpGain(paramId: number | string, value: number, flag?: number): Uint8Array;
/**
 * V3: Adjust camera parameter (relative adjustment)
 * Create Encoded Packet for the command CMD_V3_CAMERA_PARAMS_ADJUST (16703)
 * @param {number|string} paramId - Parameter ID (encoded via encodeParamId)
 * @param {number} value - Adjustment value (positive = increase, negative = decrease)
 * @returns {Uint8Array}
 */
export function messageV3CameraParamsAdjust(paramId: number | string, value: number): Uint8Array;
/**
 * Encode a paramId from its constituent parts.
 *
 * paramId layout (64-bit, big-endian byte order):
 *   byte[7] (bits 63..56) = shootingMode  (e.g. 0=photo, 1=video, 2=astro)
 *   byte[6] (bits 55..48) = category      (parameter group)
 *   byte[5..2]            = reserved (0)
 *   byte[1] (bits 15..8)  = cameraId      (0=tele, 1=wide)
 *   byte[0] (bits 7..0)   = paramIndex    (parameter index within the category)
 *
 * Returns a decimal string suitable for protobuf.js int64 fields.
 *
 * @param {number} shootingMode - Shooting mode (0=photo, 1=video, 2=astro)
 * @param {number} category - Parameter category
 * @param {number} cameraId - Camera ID (0=tele, 1=wide)
 * @param {number} paramIndex - Parameter index within the category
 * @returns {string} Encoded paramId as decimal string
 */
export function encodeParamId(shootingMode: number, category: number, cameraId: number, paramIndex: number): string;
/**
 * Decode a paramId into its constituent parts.
 *
 * Accepts number, string (decimal), BigInt, or protobuf.js Long object.
 *
 * @param {number|string|BigInt|{low: number, high: number}} paramId - Encoded parameter ID
 * @returns {{ shootingMode: number, category: number, cameraId: number, paramIndex: number }}
 */
export function decodeParamId(paramId: number | string | BigInt | {
    low: number;
    high: number;
}): {
    shootingMode: number;
    category: number;
    cameraId: number;
    paramIndex: number;
};
//# sourceMappingURL=v3_camera_params.d.ts.map