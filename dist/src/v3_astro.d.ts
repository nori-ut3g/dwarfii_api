/*** --------------------------------------------------------- ***/
/*** ------------- V3 MODULE ASTRO (11xxx) ------------------- ***/
/*** --------------------------------------------------------- ***/
/**
 * V3: Start stacking with frame count
 * Create Encoded Packet for the command CMD_ASTRO_START_CAPTURE_RAW_LIVE_STACKING
 * @param {number} frameCount - Number of frames (-1 for infinite)
 * @returns {Uint8Array}
 */
export function messageV3AstroStartStacking(frameCount?: number): Uint8Array;
/**
 * V3: Stop stacking
 * Create Encoded Packet for the command CMD_ASTRO_STOP_CAPTURE_RAW_LIVE_STACKING
 * @returns {Uint8Array}
 */
export function messageV3AstroStopStacking(): Uint8Array;
/**
 * V3: Start tracking (after stacking)
 * Create Encoded Packet for the command CMD_ASTRO_GO_LIVE
 * @returns {Uint8Array}
 */
export function messageV3AstroStartTracking(): Uint8Array;
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
export function messageV3AstroGotoDSO(ra: number, dec: number, targetName: string, lon: number, lat: number, mode?: number): Uint8Array;
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
export function messageV3AstroGotoSolar(index: number, lon: number, lat: number, targetName: string, mode?: number): Uint8Array;
/**
 * V3: GOTO done / acknowledge
 * Create Encoded Packet for the command CMD_ASTRO_STOP_ONE_CLICK_GOTO
 * @returns {Uint8Array}
 */
export function messageV3AstroGotoDone(): Uint8Array;
/**
 * V3: Save stacked image
 * Create Encoded Packet for the command CMD_V3_ASTRO_SAVE_STACKED_IMAGE
 * @param {string} path - Save path on device
 * @returns {Uint8Array}
 */
export function messageV3AstroSaveImage(path: string): Uint8Array;
/**
 * V3: List saved images
 * Create Encoded Packet for the command CMD_V3_ASTRO_LIST_SAVED_IMAGES
 * @returns {Uint8Array}
 */
export function messageV3AstroListImages(): Uint8Array;
/**
 * V3: Status polling
 * Create Encoded Packet for the command CMD_V3_ASTRO_STATUS_POLLING
 * @param {number} f1 - Field 1 (default -1)
 * @param {number} f2 - Field 2 (default 100)
 * @param {number} f3 - Field 3 (default 100)
 * @param {number} f4 - Field 4 (default -1)
 * @returns {Uint8Array}
 */
export function messageV3AstroStatusPolling(f1?: number, f2?: number, f3?: number, f4?: number): Uint8Array;
/**
 * V3: Get astro parameters
 * Create Encoded Packet for the command CMD_V3_ASTRO_GET_PARAMS
 * @param {number} mode - Mode (0 or 1)
 * @returns {Uint8Array}
 */
export function messageV3AstroGetParams(mode?: number): Uint8Array;
/**
 * V3: Set astro parameters
 * Create Encoded Packet for the command CMD_V3_ASTRO_SET_PARAMS
 * @param {string} params - Pipe-delimited parameter string e.g. "0|0|60|60|1|null"
 * @returns {Uint8Array}
 */
export function messageV3AstroSetParams(params: string): Uint8Array;
/**
 * V3: Get exposure presets
 * Create Encoded Packet for the command CMD_V3_ASTRO_GET_PRESETS
 * @returns {Uint8Array}
 */
export function messageV3AstroGetPresets(): Uint8Array;
/**
 * V3: Set observation location
 * Create Encoded Packet for the command CMD_V3_ASTRO_SET_LOCATION
 * @param {number} lon - Longitude
 * @param {number} lat - Latitude
 * @returns {Uint8Array}
 */
export function messageV3AstroSetLocation(lon: number, lat: number): Uint8Array;
/**
 * V3: Confirm observation
 * Create Encoded Packet for the command CMD_V3_ASTRO_CONFIRM
 * @returns {Uint8Array}
 */
export function messageV3AstroConfirm(): Uint8Array;
//# sourceMappingURL=v3_astro.d.ts.map