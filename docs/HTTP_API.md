# HTTP API リファレンス

DWARF mini / II / 3 が提供する HTTP API (ポート 8082) のリファレンスです。
pcap 解析により発見されたエンドポイントを網羅しています。

## 目次

- [概要](#概要)
- [MediaType 一覧](#mediatype-一覧)
- [デバイス情報](#デバイス情報)
- [撮影モード](#撮影モード)
- [アルバム管理](#アルバム管理)
- [ファイルダウンロード](#ファイルダウンロード)
- [ストリーミング](#ストリーミング)

---

## 概要

- ベース URL: `http://<DEVICE_IP>:8082`
- POST リクエストは `Content-Type: application/json`
- レスポンスは JSON 形式、成功時 `code: 0`

```javascript
import {
  getDeviceInfo,
  albumListMediaInfos,
  fileDownloadUrl,
} from "dwarfii_api/src/http_api.js";

const IP = "192.168.88.1";

// デバイス情報を取得
const info = await getDeviceInfo(IP);
console.log(info);

// アルバム一覧を取得してFITSファイルをダウンロード
const mediaInfos = await albumListMediaInfos(IP, [4]); // astro のみ
const url = fileDownloadUrl(IP, mediaInfos.data[0].filePath);
```

---

## MediaType 一覧

| 値 | 種別 | 説明 |
|----|------|------|
| 0 | PHOTO | 通常写真 |
| 1 | VIDEO | 動画 |
| 2 | PANORAMA | パノラマ |
| 3 | TIMELAPSE | タイムラプス |
| 4 | ASTRO | 天体 (ディープスカイ スタック画像) |
| 5 | BURST | 連写 |
| 6 | CONTINUOUS | 連続撮影 |
| 7 | DARK_FRAME | ダークフレーム |
| 8 | (不明) | 予約 |
| 9 | (不明) | 予約 |

---

## デバイス情報

### POST /deviceInfo

デバイスの基本情報を取得します。

**リクエスト:**
```bash
curl -X POST http://192.168.88.1:8082/deviceInfo \
  -H "Content-Type: application/json" \
  -d '{}'
```

**レスポンス例:**
```json
{
  "code": 0,
  "data": {
    "deviceID": 4,
    "deviceName": "DWARF_mini_XXXXXX"
  }
}
```

**JavaScript:**
```javascript
const result = await getDeviceInfo("192.168.88.1");
```

---

### POST /getDeviceActivateInfo

デバイスのアクティベーション情報を取得します。

**リクエスト:**
```bash
curl -X POST http://192.168.88.1:8082/getDeviceActivateInfo \
  -H "Content-Type: application/json" \
  -d '{}'
```

**JavaScript:**
```javascript
const result = await getDeviceActivateInfo("192.168.88.1");
```

---

### GET /getDefaultParamsConfig

デフォルトのパラメータ設定を取得します。

**リクエスト:**
```bash
curl http://192.168.88.1:8082/getDefaultParamsConfig
```

**JavaScript:**
```javascript
const result = await fetchDefaultParamsConfig("192.168.88.1");
```

---

### GET /firmwareVersion

ファームウェアバージョンを取得します。

**リクエスト:**
```bash
curl http://192.168.88.1:8082/firmwareVersion
```

**JavaScript:**
```javascript
const result = await getFirmwareVersion("192.168.88.1");
```

---

## 撮影モード

### GET /shootingMode/getSupportedShootingModes

対応している撮影モードの一覧を取得します。

**リクエスト:**
```bash
curl http://192.168.88.1:8082/shootingMode/getSupportedShootingModes
```

**JavaScript:**
```javascript
const result = await getSupportedShootingModes("192.168.88.1");
```

---

### POST /shootingMode/getParamAndSetting

現在の撮影パラメータと設定を取得します。

**リクエスト:**
```bash
curl -X POST http://192.168.88.1:8082/shootingMode/getParamAndSetting \
  -H "Content-Type: application/json" \
  -d '{}'
```

**JavaScript:**
```javascript
const result = await getParamAndSetting("192.168.88.1");
```

---

## アルバム管理

### POST /album/list/mediaCounts

メディアタイプ別のファイル数を取得します。

**リクエスト:**
```bash
curl -X POST http://192.168.88.1:8082/album/list/mediaCounts \
  -H "Content-Type: application/json" \
  -d '{}'
```

**レスポンス例:**
```json
{
  "code": 0,
  "data": [
    { "count": 5, "mediaType": 0 },
    { "count": 12, "mediaType": 4 }
  ]
}
```

**JavaScript:**
```javascript
const result = await albumListMediaCounts("192.168.88.1");
for (const item of result.data) {
  console.log(`mediaType=${item.mediaType}: ${item.count} 件`);
}
```

---

### POST /album/list/mediaInfos

指定したメディアタイプの詳細情報を取得します。
天体撮影の場合、`astroImageDetails` にRA/DEC、ターゲット名、撮影パラメータ等が含まれます。

**リクエスト:**
```bash
curl -X POST http://192.168.88.1:8082/album/list/mediaInfos \
  -H "Content-Type: application/json" \
  -d '{"mediaTypeList": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}'
```

**レスポンス例 (天体画像):**
```json
{
  "code": 0,
  "data": [
    {
      "mediaType": 4,
      "fileName": "stacked_M31.jpg",
      "filePath": "/DWARF_mini/Astronomy/2026-03-01_M31/stacked_M31.jpg",
      "fileSize": 2048000,
      "fileState": 0,
      "thumbnailPath": "/DWARF_mini/Astronomy/2026-03-01_M31/thumb.jpg",
      "modificationTime": 1740000000,
      "camId": 1,
      "astroTargetName": "M31",
      "astroSubType": 0,
      "astroImageDetails": {
        "target": "M31",
        "floatHourRa": 0.7123,
        "floatDegreeDec": 41.2689,
        "params": {
          "binning": 0,
          "exp": 15,
          "filter": 0,
          "format": 0,
          "gain": 80,
          "width": 1920,
          "height": 1080
        },
        "shotsStacked": 120,
        "shotsTaken": 130,
        "shotsToTake": -1,
        "srcDir": "/DWARF_mini/Astronomy/2026-03-01_M31/",
        "totalExp": 1800,
        "latitude": 35.6762,
        "longitude": 139.6503,
        "maxTemp": 25.3,
        "minTemp": 22.1,
        "folderSize": 5120000,
        "annoInfo": null
      }
    }
  ]
}
```

**JavaScript:**
```javascript
// 天体画像のみ取得
const result = await albumListMediaInfos("192.168.88.1", [4]);

for (const media of result.data) {
  const details = media.astroImageDetails;
  if (details) {
    console.log(`${details.target}: ${details.shotsStacked} フレーム積算`);
    console.log(`  RA=${details.floatHourRa}h, DEC=${details.floatDegreeDec}°`);
    console.log(`  露出=${details.params.exp}s, Gain=${details.params.gain}`);
  }
}
```

---

### POST /album/astro/fitsList

天体撮影セッションの FITS ファイル一覧を取得します。

**リクエスト:**
```bash
curl -X POST http://192.168.88.1:8082/album/astro/fitsList \
  -H "Content-Type: application/json" \
  -d '{"srcDir": "/DWARF_mini/Astronomy/2026-03-01_M31/"}'
```

**レスポンス例:**
```json
{
  "code": 0,
  "data": {
    "fitsInfo": [
      {
        "filePath": "/DWARF_mini/Astronomy/2026-03-01_M31/frame_001.fits",
        "isFailed": false,
        "url": "/DWARF_mini/Astronomy/2026-03-01_M31/frame_001.fits"
      },
      {
        "filePath": "/DWARF_mini/Astronomy/2026-03-01_M31/frame_002.fits",
        "isFailed": true,
        "url": "/DWARF_mini/Astronomy/2026-03-01_M31/frame_002.fits"
      }
    ]
  }
}
```

**JavaScript:**
```javascript
const result = await albumAstroFitsList(
  "192.168.88.1",
  "/DWARF_mini/Astronomy/2026-03-01_M31/"
);

for (const fits of result.data.fitsInfo) {
  const status = fits.isFailed ? "失敗" : "成功";
  console.log(`${fits.filePath} [${status}]`);
}
```

---

### POST /album/delete

メディアファイルを削除します。

**リクエスト:**
```bash
curl -X POST http://192.168.88.1:8082/album/delete \
  -H "Content-Type: application/json" \
  -d '{
    "datas": [
      {
        "mediaType": 4,
        "fileName": "stacked_M31.jpg",
        "subType": 0,
        "filePath": "/DWARF_mini/Astronomy/2026-03-01_M31/stacked_M31.jpg"
      }
    ]
  }'
```

**JavaScript:**
```javascript
await albumDelete("192.168.88.1", [
  {
    mediaType: 4,
    fileName: "stacked_M31.jpg",
    subType: 0,
    filePath: "/DWARF_mini/Astronomy/2026-03-01_M31/stacked_M31.jpg",
  },
]);
```

---

## ファイルダウンロード

デバイス上のファイルは静的アセットとして配信されます。
ファイルパスを直接 GET するだけでダウンロードできます。

### URL の組み立て

```javascript
import { fileDownloadUrl, downloadFile } from "dwarfii_api/src/http_api.js";

// URL を取得 (ブラウザで開く場合など)
const url = fileDownloadUrl("192.168.88.1", "/DWARF_mini/Astronomy/2026-03-01_M31/frame_001.fits");
// => "http://192.168.88.1:8082/DWARF_mini/Astronomy/2026-03-01_M31/frame_001.fits"
```

### curl でダウンロード

```bash
# FITS ファイルをダウンロード
curl -o frame_001.fits \
  http://192.168.88.1:8082/DWARF_mini/Astronomy/2026-03-01_M31/frame_001.fits

# サムネイルをダウンロード
curl -o thumb.jpg \
  http://192.168.88.1:8082/DWARF_mini/Astronomy/2026-03-01_M31/thumb.jpg
```

### JavaScript でダウンロード

```javascript
// Response オブジェクトを取得
const response = await downloadFile(
  "192.168.88.1",
  "/DWARF_mini/Astronomy/2026-03-01_M31/frame_001.fits"
);

// Node.js: ファイルに保存
import { writeFile } from "node:fs/promises";
const buffer = Buffer.from(await response.arrayBuffer());
await writeFile("frame_001.fits", buffer);
```

### 全 FITS ファイルの一括ダウンロード

```javascript
import {
  albumListMediaInfos,
  albumAstroFitsList,
  downloadFile,
} from "dwarfii_api/src/http_api.js";
import { writeFile } from "node:fs/promises";
import { basename } from "node:path";

const IP = "192.168.88.1";

// 1. 天体セッション一覧を取得
const mediaInfos = await albumListMediaInfos(IP, [4]);

for (const media of mediaInfos.data) {
  const details = media.astroImageDetails;
  if (!details) continue;

  console.log(`セッション: ${details.target} (${details.srcDir})`);

  // 2. FITS ファイル一覧を取得
  const fitsResult = await albumAstroFitsList(IP, details.srcDir);

  // 3. 成功フレームのみダウンロード
  for (const fits of fitsResult.data.fitsInfo) {
    if (fits.isFailed) continue;

    const response = await downloadFile(IP, fits.filePath);
    const buffer = Buffer.from(await response.arrayBuffer());
    await writeFile(basename(fits.filePath), buffer);
    console.log(`  ダウンロード完了: ${basename(fits.filePath)}`);
  }
}
```

---

## ストリーミング

MJPEG ストリームは HTTP で直接取得できます。

### メインストリーム (望遠カメラ)

```javascript
import { mainstreamUrl } from "dwarfii_api/src/http_api.js";

const url = mainstreamUrl("192.168.88.1");
// => "http://192.168.88.1:8082/mainstream"

// HTML の <img> タグで表示可能
// <img src="http://192.168.88.1:8082/mainstream" />
```

```bash
# VLC で表示
vlc http://192.168.88.1:8082/mainstream

# ffmpeg で録画
ffmpeg -i http://192.168.88.1:8082/mainstream -c copy output.mjpeg
```

### セカンドストリーム (広角カメラ)

```javascript
import { secondstreamUrl } from "dwarfii_api/src/http_api.js";

const url = secondstreamUrl("192.168.88.1");
// => "http://192.168.88.1:8082/secondstream"
```

```bash
vlc http://192.168.88.1:8082/secondstream
```

> **注意:** DWARF II / 3 では従来ポート 8092 でストリーミングが提供されていましたが、
> DWARF mini ではポート 8082 に統一されています。
> 既存の `api_codes.js` の `telephotoURL` / `wideangleURL` (ポート 8092) と混同しないよう注意してください。
