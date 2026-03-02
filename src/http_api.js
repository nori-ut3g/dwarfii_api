/** @module http_api */
// HTTP API wrapper for DWARF mini / II / 3 file download and album management.
// All endpoints are served on port 8082 of the device.

const DEFAULT_HTTP_PORT = 8082;

/*** --------------------------------------------------------- ***/
/*** ------------- URL BUILDERS ------------------------------ ***/
/*** --------------------------------------------------------- ***/

/**
 * Build the base URL for the HTTP API.
 * @param {string} IP - Device IP address
 * @param {number} [port=8082] - HTTP port
 * @returns {string}
 */
function baseUrl(IP, port = DEFAULT_HTTP_PORT) {
  return `http://${IP}:${port}`;
}

/*** --------------------------------------------------------- ***/
/*** ------------- STREAMING URLs ---------------------------- ***/
/*** --------------------------------------------------------- ***/

/**
 * Get the mainstream (telephoto) MJPEG stream URL.
 * @param {string} IP - Device IP address
 * @returns {string}
 */
export function mainstreamUrl(IP) {
  return `${baseUrl(IP)}/mainstream`;
}

/**
 * Get the second stream (wide-angle) MJPEG stream URL.
 * @param {string} IP - Device IP address
 * @returns {string}
 */
export function secondstreamUrl(IP) {
  return `${baseUrl(IP)}/secondstream`;
}

/*** --------------------------------------------------------- ***/
/*** ------------- FILE DOWNLOAD ----------------------------- ***/
/*** --------------------------------------------------------- ***/

/**
 * Build the full download URL for a file on the device.
 * Files are served as static assets — just GET the returned URL.
 * @param {string} IP - Device IP address
 * @param {string} filePath - Absolute file path on device (e.g. "/DWARF_mini/Astronomy/.../xxx.fits")
 * @returns {string}
 */
export function fileDownloadUrl(IP, filePath) {
  return `${baseUrl(IP)}${filePath}`;
}

/**
 * Download a file from the device.
 * @param {string} IP - Device IP address
 * @param {string} filePath - Absolute file path on device
 * @returns {Promise<Response>}
 */
export async function downloadFile(IP, filePath) {
  const url = fileDownloadUrl(IP, filePath);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `downloadFile failed: ${response.status} ${response.statusText} for ${url}`
    );
  }
  return response;
}

/*** --------------------------------------------------------- ***/
/*** ------------- DEVICE INFO ------------------------------- ***/
/*** --------------------------------------------------------- ***/

/**
 * Get device information.
 * POST /deviceInfo with empty body.
 * Returns { code, data: { deviceID, deviceName, ... } }
 * @param {string} IP - Device IP address
 * @returns {Promise<Object>}
 */
export async function getDeviceInfo(IP) {
  const url = `${baseUrl(IP)}/deviceInfo`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error(
      `getDeviceInfo failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Get device activation information.
 * POST /getDeviceActivateInfo with empty body.
 * @param {string} IP - Device IP address
 * @returns {Promise<Object>}
 */
export async function getDeviceActivateInfo(IP) {
  const url = `${baseUrl(IP)}/getDeviceActivateInfo`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error(
      `getDeviceActivateInfo failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Fetch default parameter configuration.
 * GET /getDefaultParamsConfig
 * Note: Named fetchDefaultParamsConfig to avoid conflict with the URL builder
 * in api_codes.js which exports getDefaultParamsConfig.
 * @param {string} IP - Device IP address
 * @returns {Promise<Object>}
 */
export async function fetchDefaultParamsConfig(IP) {
  const url = `${baseUrl(IP)}/getDefaultParamsConfig`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `getDefaultParamsConfig failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Get firmware version.
 * GET /firmwareVersion
 * @param {string} IP - Device IP address
 * @returns {Promise<Object>}
 */
export async function getFirmwareVersion(IP) {
  const url = `${baseUrl(IP)}/firmwareVersion`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `getFirmwareVersion failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/*** --------------------------------------------------------- ***/
/*** ------------- SHOOTING MODE ----------------------------- ***/
/*** --------------------------------------------------------- ***/

/**
 * Get supported shooting modes.
 * GET /shootingMode/getSupportedShootingModes
 * @param {string} IP - Device IP address
 * @returns {Promise<Object>}
 */
export async function getSupportedShootingModes(IP) {
  const url = `${baseUrl(IP)}/shootingMode/getSupportedShootingModes`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `getSupportedShootingModes failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Get current shooting parameters and settings.
 * POST /shootingMode/getParamAndSetting with empty body.
 * @param {string} IP - Device IP address
 * @returns {Promise<Object>}
 */
export async function getParamAndSetting(IP) {
  const url = `${baseUrl(IP)}/shootingMode/getParamAndSetting`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error(
      `getParamAndSetting failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/*** --------------------------------------------------------- ***/
/*** ------------- ALBUM MANAGEMENT -------------------------- ***/
/*** --------------------------------------------------------- ***/

/**
 * Get media counts per media type.
 * POST /album/list/mediaCounts with empty body.
 * Returns { code: 0, data: [{ count, mediaType }] }
 * @param {string} IP - Device IP address
 * @returns {Promise<Object>}
 */
export async function albumListMediaCounts(IP) {
  const url = `${baseUrl(IP)}/album/list/mediaCounts`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    throw new Error(
      `albumListMediaCounts failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Get detailed media information for given media types.
 * POST /album/list/mediaInfos with mediaTypeList.
 * Returns array of session objects with astroImageDetails (RA/DEC, target, params, etc.)
 * @param {string} IP - Device IP address
 * @param {number[]} [mediaTypeList=[0,1,2,3,4,5,6,7,8,9]] - Array of media type IDs to query
 * @returns {Promise<Object>}
 */
export async function albumListMediaInfos(
  IP,
  mediaTypeList = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
) {
  const url = `${baseUrl(IP)}/album/list/mediaInfos`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mediaTypeList }),
  });
  if (!response.ok) {
    throw new Error(
      `albumListMediaInfos failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Get the list of FITS files for an astro session directory.
 * POST /album/astro/fitsList with srcDir.
 * Returns { code: 0, data: { fitsInfo: [{ filePath, isFailed, url }] } }
 * @param {string} IP - Device IP address
 * @param {string} srcDir - Session directory path (e.g. "/DWARF_mini/Astronomy/{session}/")
 * @returns {Promise<Object>}
 */
export async function albumAstroFitsList(IP, srcDir) {
  const url = `${baseUrl(IP)}/album/astro/fitsList`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ srcDir }),
  });
  if (!response.ok) {
    throw new Error(
      `albumAstroFitsList failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

/**
 * Delete media files from the device.
 * POST /album/delete with array of file descriptors.
 * @param {string} IP - Device IP address
 * @param {Array<{mediaType: number, fileName: string, subType: number, filePath: string}>} datas - Array of file descriptors to delete
 * @returns {Promise<Object>}
 */
export async function albumDelete(IP, datas) {
  const url = `${baseUrl(IP)}/album/delete`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datas }),
  });
  if (!response.ok) {
    throw new Error(
      `albumDelete failed: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}
