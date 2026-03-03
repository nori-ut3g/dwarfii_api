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
export function messageV3CameraParamsAdjust(paramId: number, value: number): Uint8Array;
//# sourceMappingURL=v3_camera_params.d.ts.map