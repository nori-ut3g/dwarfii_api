# 天体望遠鏡をリバースエンジニアリングした話
## — 全部 Claude Code で

---

## 今日の話

- スマート天体望遠鏡 **DWARF mini** を買った
- ファームウェア更新でサードパーティアプリが**全滅**した
- 通信プロトコルをリバースエンジニアリングして**復旧させた**
- 問題の調査から解析ツール作成、パケット解析、実装まで **Claude Code だけ**でやった

---

## DWARF mini とは

- DwarfLab 社製スマート天体望遠鏡（約10万円）
- 三脚に載せてスマホから操作 → 天体を自動導入・撮影
- **操作は全て WiFi 経由** — 望遠鏡自体が WiFi AP になるか家庭 WiFi に参加

```
┌──────────┐     WiFi      ┌──────────────┐
│ スマホ/PC │ ←──────────→ │ DWARF mini   │
│          │  WebSocket    │ (望遠鏡)      │
│          │  port 9900    │              │
└──────────┘   Protobuf    └──────────────┘
               平文・認証なし
```

---

## 何が起きたか

DwarfLab のファームウェア更新でサードパーティツールが全滅。

```
2025-03   dwarfii_api 最終コミット (v2.0.17)
2025-04   upstream dwarfium 最終コミット
2025-11   ← FW V1.4.7.5 リリース — 既存API動作不能に
2026-01   upstream 作者「DwarfLabから新APIが来るの待ち。いつかは不明」
2026-02   最新FW V1.0.25.2 — Star Trail, Sky Finder 等の新機能追加
```

upstream の作者に聞いた返答:
> "you are waiting for the new API from Dwarflab. They will send us but **don't know when**"

→ いつ来るかわからない。**自分で解析するしかない**

---

## Issue #8: まず問題を整理した

Claude Code に状況を伝えて **問題の調査 Issue** を作成:

- FW V1.4.7.5 で host-node 機能が削除されたこと
- `dwarfii_api` (WebSocket + Protobuf, 245コマンド) が動作不能
- upstream は10ヶ月間停止
- API 非依存の開発（AI機能、日本語化、テスト）は継続可能
- **将来のブロッカー**: ライブ観測連携、撮影パラメータ自動設定

→ ここまでは「待ち」の判断だった

---

## Issue #9: リバースエンジニアリングの可能性を調査

Claude Code と対話して **技術的・法的な実現可能性を評価**:

| 要素 | 状況 | 評価 |
|------|------|------|
| 暗号化 | **なし** (平文 WebSocket) | キャプチャ容易 |
| 認証 | **実質なし** (device_id + client_id のみ) | 再現容易 |
| シリアライゼーション | **標準 Protobuf3** | ツール充実 |
| 既存知識 | 245コマンドの Proto 定義が手元にある | 差分解析で済む |
| DRM | **なし** | 法的リスクなし |

法的根拠: **著作権法 第30条の4 (2018年改正)** — 互換性確保目的の RE を明示的に許容

**結論: 技術的には十分可能。やろう。**

Issue #9 の調査自体も Claude Code で実施。既存コードベースを読ませて、
プロトコル構造の整理、解析計画の策定、法的検討まで対話で完成。

→ ここから Claude Code と一緒にリバースエンジニアリングを開始

---

## 既存の V2 プロトコル構造（これが動かなくなった）

通信は WebSocket + Protocol Buffers:

```protobuf
// エンベロープ（全パケット共通）
message WsPacket {
  int32 major_version = 1;  // 常に 1
  int32 minor_version = 2;  // V2 では 9
  int32 module_id = 3;      // 機能カテゴリ (1-13)
  int32 cmd = 4;            // コマンド ID (10000-16300)
  int32 type = 5;           // 0=Request, 1=Response, 2=Notify
  bytes data = 6;           // コマンド固有ペイロード
}
```

- 13モジュール、245コマンド
- **暗号化なし、認証なし**（device_id + client_id のみ）

---

## Phase 1: 診断ツール群の一括生成

Claude Code で **10個の Node.js スクリプト** を生成。
共通設定（`common.js`）＋各ツールという構成。

```
tools/v3-probe/
├── common.js            # 共通定数・ユーティリティ
├── ws-diagnose.js       # 7段階の段階的接続テスト
├── port-scan.js         # ポートスキャン
├── http-probe.js        # HTTP エンドポイント探索
├── ws-proxy.js          # WebSocket MitM プロキシ
├── pcap-decode.js       # Wireshark .pcap 解析
├── proto-decode.js      # 複数戦略 Protobuf デコーダ
├── notify-listener.js   # 通知モニタリング
├── cmd-survey.js        # コマンド ID 総当たり列挙
├── raw-recorder.js      # バイナリトラフィック録画
└── v3-test.js           # 発見したコマンドの実機テスト
```

---

### ツール①: ws-diagnose.js — 段階的接続テスト

V2 → V3 で **何が壊れたか** を切り分けるためのツール。
7段階のテストを順番に実行し、どこで通信が途切れるか特定する:

```
$ node ws-diagnose.js --ip 192.168.11.31
```

```
>>> Test A — WebSocket Connection
[ OK ] Connected in 15ms

>>> Test B — Passive Listen
[ OK ] Server sent 1 message(s) unprompted!
[DATA]   [2000ms] binary: 08 01 10 09 18 01 20 01 28 87 4e 30 02

>>> Test C — V2 Text "ping" → "pong"?
[ OK ] Received "pong" after 45ms

>>> Test D — WebSocket Native Ping Frame
[ OK ] WebSocket pong received after 12ms

>>> Test E — V2 Protobuf Command
[INFO] V2 packet built: 53 bytes
[DATA] 08 01 10 09 18 01 20 01 28 b7 4e 30 00 3a 00 42 24 ...
[ OK ] Received 1 response(s)!

>>> Test F — Decode Test Packet
[ OK ] Best: "V2 WsPacket" (100%)

>>> Test G — Alternative Ports
[INFO] Port 9901: ECONNREFUSED
[INFO] Port 8082: Connected but not WebSocket
```

→ **結果: 接続自体はできるが V2 コマンドが無視される** ことが判明

---

### ツール②: proto-decode.js — 複数戦略デコーダ

受信データを **4つの戦略で同時にデコード**、信頼度スコアで順位付け。

例: V3 カメラ Open コマンド（CMD 10050）のパケットを解析:

```
$ node proto-decode.js --hex "08 01 10 14 18 04 20 01 28 b2 51 30 00 3a 02 08 01
  42 24 30 30 30 30 44 41 46 32 2d 30 30 ..."
```

```
DECODE RESULTS (ranked by confidence)

  ✓ Wire Format Walk:               █████████░ 90%
    field1 (varint): 1               ← major_version
    field2 (varint): 20              ← minor_version = 20 ← V3!
    field3 (varint): 4               ← device_id = DWARF mini
    field4 (varint): 1               ← module_id = CAMERA_TELE
    field5 (varint): 10418           ← cmd (10050 の varint エンコード)
    field6 (varint): 0               ← type = REQUEST
    field7 (bytes):  "08 01"         ← data (inner payload)
    field8 (string): "0000DAF2-..."  ← client_id

  ✓ V2 WsPacket:                    ████████░░ 80%
    { majorVersion: 1, minorVersion: 20, deviceId: 4,
      moduleId: 1, cmd: 10418, type: 0, data: "CAE=" }

  ✗ JSON Parse:                      ░░░░░░░░░░  0%
  ✓ Offset Scan (header detection):  ███░░░░░░░ 30%

SUMMARY
[ OK ] Best match: "Wire Format Walk" with 90% confidence
```

→ **エンベロープは V2 と互換、`minor_version` が 9→20 に変更** と確認

---

### Wireshark キャプチャの方法

iPhone 公式アプリと DWARF mini の通信を **Wireshark** で傍受:

```
┌──────────┐                     ┌──────────────┐
│  iPhone   │ ← 同一 WiFi →     │ DWARF mini   │
│ 公式アプリ │   192.168.11.x     │ 192.168.11.31│
└──────────┘                     └──────────────┘
      ↕  WiFi パケットを傍受
┌──────────┐
│  Mac      │  Wireshark
│ (キャプチャ)│  フィルタ: tcp.port == 9900
└──────────┘
```

**手順**:
1. DWARF mini を **STA モード**（家庭 WiFi に参加）で起動
2. Mac で Wireshark を起動、WiFi インタフェースを選択
3. キャプチャフィルタ: `tcp port 9900`
4. iPhone の公式アプリで操作（接続、GOTO、撮影など）
5. 操作ごとに `.pcap` を保存

5回に分けてキャプチャ:
```
captures/
├── iphone-capture.pcap          # 9MB   初回接続（初期化シーケンス）
├── iphone-capture2.pcap         # 278MB  長時間セッション
├── iphone-capture3-photo.pcap   # 2.6MB  写真撮影
├── iphone-capture4-modes.pcap   # 59MB   モード切替
└── iphone-full-capture.pcap     # 43MB   フルセッション
```

---

### ツール③: pcap-decode.js — .pcap ファイルの自動解析

Wireshark のキャプチャを **自動で Protobuf デコード**するツール。

```bash
$ node pcap-decode.js captures/iphone-capture.pcap
```

処理の流れ:
1. **tshark** で TCP ペイロード抽出（ポート 9900 のみ）
2. **WebSocket フレームをパース**（RFC 6455 マスキング解除含む）
3. 各フレームを V2 の **WsPacket 定義でデコード**
4. 内部データも既知の型名でデコード（未知なら raw hex 表示）

**実際の出力**（初回接続の pcap）:

```
PCAP DECODE — DwarfLab App Traffic
Extracted 133 data packets from pcap

#  4 App→DWARF [REQ   ] v1.20 dev=1 mod=4 cmd=13000 SetTime
     raw=08 8d f4 86 cd 06 11 00 00 00 00 00 00 22 40
#  5 App→DWARF [REQ   ] v1.20 dev=1 mod=4 cmd=13001 SetTimeZone
     raw=0a 0a 41 73 69 61 2f 54 6f 6b 79 6f          ← "Asia/Tokyo"
#  7 App→DWARF [REQ   ] v1.20 dev=1 mod=8  cmd=15011 CMD_15011   ← 未知!
#  8 App→DWARF [REQ   ] v1.20 dev=1 mod=14 cmd=16405 CMD_16405   ← 未知! 新モジュール!
# 14 DWARF→App [NRESP ] v1.8  dev=4 mod=4  cmd=13000 SetTime     ← 応答OK
# 18 App→DWARF [REQ   ] v1.20 dev=1 mod=4  cmd=13010 CMD_13010   ← 未知! GPS?
     raw=09 77 19 0c 5b 60 ea 41 40 11 08 30 67 13 ...  (67 bytes)
# 22 DWARF→App [NRESP ] v1.8  dev=4 mod=14 cmd=16405 CMD_16405   ← 251バイトの大応答
# 40 App→DWARF [REQ   ] v1.20 dev=4 mod=14 cmd=16404 CMD_16404   ← モード切替
     raw=1a 02 08 01
# 43 App→DWARF [REQ   ] v1.20 dev=4 mod=1  cmd=10050 CMD_10050   ← 新カメラOpen!
     raw=08 01
# 44 App→DWARF [REQ   ] v1.20 dev=4 mod=2  cmd=12036 CMD_12036   ← 新カメラOpen!
# 45 DWARF→App [NRESP ] v1.8  dev=4 mod=2  cmd=12036 CMD_12036   ← 応答OK!
# 46 DWARF→App [NRESP ] v1.8  dev=4 mod=1  cmd=10050 CMD_10050   ← 応答OK!
```

**この出力から読み取れたこと**:
- `v1.20` → プロトコルバージョンが V2 (v1.9) から変わっている
- `cmd=15011`, `cmd=16405`, `cmd=13010` → V2 に存在しない新コマンド
- `mod=14` → V2 に存在しない新モジュール
- `cmd=10050` → V2 の `cmd=10000`（カメラOpen）の置換

写真撮影セッションの pcap も解析:

```
$ node pcap-decode.js captures/iphone-capture3-photo.pcap

#  3 App→DWARF [REQ   ] v1.20 dev=4 mod=3 cmd=11005 CMD_11005
     raw=08 ff ff ff ff ff ff ff ff ff 01                ← ライブスタッキング開始
#  7 DWARF→App [NOTIFY] v1.8  dev=4 mod=9 cmd=15255 CMD_15255
     raw=08 01 10 3c                                     ← 進捗通知（1/60フレーム）
#  8 DWARF→App [NOTIFY] v1.8  dev=4 mod=9 cmd=15255 CMD_15255
     raw=08 02 10 3c                                     ← 進捗通知（2/60フレーム）
     ...
# 38 App→DWARF [REQ   ] v1.20 dev=4 mod=3 cmd=11006 CMD_11006  ← スタッキング停止
```

→ **フレームカウンタ（08 01, 08 02, ...）が進捗通知と判明**

---

## Phase 2: パケットキャプチャ解析のまとめ

5回分の pcap を解析した結果:

| 項目 | V2 | V3 |
|------|----|----|
| プロトコルバージョン | `minor_version = 9` | `minor_version = 20` |
| エンベロープ | WsPacket | **同じ** |
| カメラ開閉 | CMD 10000/12000 | **CMD 10050/12036** (新) |
| 新モジュール | なし | **mod=14** (デバイス設定), **mod=15** (カメラパラメータ) |
| 新コマンド | — | 30+ 個 |

**決定的な発見**: `minor_version` を `9` → `20` にするだけで V3 として認識される

---

### raw-recorder の記録例 — WebSocket の生データ

ws-diagnose と並行して raw-recorder.js で **WebSocket のバイナリ通信を丸ごと保存**:

```
captures/session-2026-02-27_14-38-27/
├── 00001-send-binary.bin   ← 自分が送った V2 コマンド (53 bytes)
├── 00002-send-text.bin     ← "ping" (4 bytes)
├── 00003-recv-text.bin     ← "pong" (4 bytes)
├── 00004-recv-binary.bin   ← DWARF からの通知 (57 bytes)
├── 00005-send-text.bin     ← "ping"
└── 00006-recv-text.bin     ← "pong"
```

対応する **JSONL ログ**（タイムスタンプ付き）:

```json
{"seq":1,"dir":"send","type":"binary","size":53,
 "hex":"08 01 10 09 18 01 20 01 28 b7 4e 30 00 3a 00 42 24 ...","elapsed":218}
{"seq":2,"dir":"send","type":"text","size":4,"hex":"70 69 6e 67","elapsed":10195}
{"seq":3,"dir":"recv","type":"text","size":4,"hex":"70 6f 6e 67","elapsed":10314}
{"seq":4,"dir":"recv","type":"binary","size":57,
 "hex":"08 01 10 08 18 04 20 09 28 e3 76 30 02 3a 04 08 2e 10 34 ...","elapsed":13381}
```

送信パケット (seq=1) を `xxd` で見ると:

```
00000000: 0801 1009 1801 2001 28b7 4e30 003a 0042  ...... .(.N0.:.B
00000010: 2430 3030 3044 4146 322d 3030 3030 2d31  $0000DAF2-0000-1
00000020: 3030 302d 3830 3030 2d30 3038 3035 4639  000-8000-00805F9
00000030: 4233 3446 42                             B34FB
```

→ WsPacket: `v1.9, mod=1, cmd=10039 (GetSystemWorkingState), client_id=0000DAF2-...`

デバイスの応答 (seq=4):
```
00000000: 0801 1008 1804 2009 28e3 7630 023a 0408  ...... .(.v0.:..
          ^^^^ ^^^^                                 v1.8 ← V2応答!
                    ^^^^ ^^^^                       dev=4 (DWARF mini), mod=9
                              ^^^^^^^^              cmd=15203 (SDCard通知)
                                       ^^^^        type=2 (NOTIFY)
```

→ **V2 コマンドを送ったら V2 形式で応答が来た。通信自体は生きている!**

---

### ツール④: v3-test.js — pcap から発見したコマンドの実機検証

pcap-decode で特定した **V3 初期化シーケンスを完全再現**:

```
公式アプリの初期化シーケンス（pcap から特定）:

 1. SetTime (13000) + SetTimeZone (13001)   — V2 と同じ
 2. Focus 初期化 (15011, mod=8)             — 新コマンド
 3. デバイス設定取得 (16405, mod=14)         — 新モジュール
 4. スケジュール (16102, mod=13)             — 新コマンド
 5. 天体パラメータ (11043 × 3回, 11040)     — 新コマンド
 6. GPS 送信 (13010, mod=4)                 — 新コマンド
 7. モード切替 (16404, mod=14)              — 新コマンド
 8. カメラ開 Tele (10050)                   — V2 の 10000 を置換!
 9. カメラ開 Wide (12036)                   — V2 の 12000 を置換!
10. トラッキング設定 (11039)               — 新コマンド
11. カメラパラメータ (16700, mod=15)        — 新モジュール
```

pcap で抽出した **生バイナリペイロードをそのまま再利用**:

```javascript
// pcap-decode の raw 出力から抽出したバイト列
const CAPTURED_DATA = {
  "13001_tz":    Buffer.from("0a0a417369612f546f6b796f", "hex"),  // "Asia/Tokyo"
  "11043_arg1":  Buffer.from("1001", "hex"),       // field2 = 1
  "10050_open":  Buffer.from("0801", "hex"),       // field1 = 1 (open)
  "16404_req":   Buffer.from("1a020801", "hex"),   // nested: {field1: 1}
  "13010_gps":   Buffer.from("0977190c5b...", "hex"),  // GPS doubles + string
};
```

```bash
$ node v3-test.js --ip 192.168.11.31

V3 COMMAND TEST: 192.168.11.31:9900 (protocol v1.20)
[ OK ] Connected

Phase 1: System Init
  1. SetTime (13000)
  [DATA]  [NRESP] mod=4 cmd=13000 dev=4 v1.8       ← 応答!
  2. SetTimeZone (13001)
  [DATA]  [NRESP] mod=4 cmd=13001 dev=4 v1.8       ← 応答!
  3. Focus cmd (15011, mod=8)
  [DATA]  [NRESP] mod=8 cmd=15011 dev=4 v1.8       ← 応答! 新コマンド動いた!

Phase 7: Camera Open (NEW COMMANDS!)
  16. OpenCamera TELE (10050, mod=1, arg: 08 01) — V3 NEW!
  [ OK ]  *** TELE CAMERA RESPONDED! ***             ← 成功!!!
  17. OpenCamera WIDE (12036, mod=2, no args) — V3 NEW!
  [ OK ]  *** WIDE CAMERA RESPONDED! ***             ← 成功!!!
```

→ **pcap から抽出したシーケンスをそのまま再生し、全コマンドの応答を確認!**

---

### ツール⑤: cmd-survey.js — コマンド総当たり

READ-ONLY コマンドだけを順番に送信して、どれが応答を返すか調査:

```
Command                                   Mod   CMD    Status
────────────────────────────────────────────────────────────────
✓ SetMasterLock(HOST)                     4     13004  RESPONSE
✓ Tele: GetSystemWorkingState             1     10039  RESPONSE
✓ Tele: GetAllParams                      1     10036  RESPONSE
✗ Tele: GetExpMode                        1     10008  NO_RESPONSE
✗ Wide: GetAllParams                      2     12027  NO_RESPONSE
✓ Motor: GetPosition                      6     14011  RESPONSE
```

→ **V3 で一部の GET コマンドが廃止/変更された** ことを特定

---

### ツール⑥: notify-listener.js — デバイスの通知モニタリング

カメラ起動後に DWARF が自発的に送ってくるデータを長時間記録:

```
Phase 1: パッシブリッスン (5秒)
Phase 2: HOST 登録
Phase 3: Wide カメラ起動
Phase 4: Tele カメラ起動
Phase 5: 30秒間モニタリング
Phase 6: カメラ停止

結果:
  CMD 15201 [NOTIFY] × 12  ResNotifyEle (バッテリー)
  CMD 15202 [NOTIFY] × 6   ResNotifyCharge (充電状態)
  CMD 15261 [NOTIFY] × 24  ← V3 新通知!
  CMD 15264 [NOTIFY] × 18  ← V3 新通知!
  CMD 15267 [NOTIFY] × 3   ← V3 新通知!
  CMD 15292 [NOTIFY] × 8   ← V3 新通知!
```

→ **V3 で追加された通知コマンドの全容を把握**

---

## Phase 3: プロトコル定義の再構築

pcap 解析 + 実機テストの結果をもとに、Claude Code で Proto 定義とコマンドモジュールを実装。

### 新規作成ファイル

```
src/proto/ — Proto 定義（8ファイル新規）
  v3_astro.proto, v3_camera.proto, v3_notify.proto,
  v3_system.proto, v3_focus.proto,
  device_config.proto, camera_params.proto

src/ — コマンドモジュール（7ファイル新規）
  v3_astro.js (14関数), v3_camera_tele.js, v3_camera_wide.js,
  v3_system.js, v3_focus.js, v3_device_config.js, v3_camera_params.js
```

**27ファイル変更、28,693行追加** の PR → マージ

---

## 結局、私（人間）がやったこと

全工程を振り返ると、**私がやったのは指示だけ**。

しかも Claude Code のセッションログが残っていたので、
**実際にどんな指示を出したか**を復元できた。

---

### 私が出した指示（実際の会話ログから抜粋）

**セッション 1: 問題調査 & 計画策定**

```
私: "前のセッションからの引き継ぎ資料を見て欲しい"
私: "https://github.com/nori-ut3g/dwarfium/issues/9 これだ"
私: "ここでは実際にこれを解決するための計画等をしたい。"
私: "じゃあフォークしよう。"
私: "OK 今フォークした。本家の方に何もしないでね。絶対に"
私: "OKじゃあ、実際に初めていこう"
```

→ Claude Code が Issue 作成、フォーク設定、CLAUDE.md 作成、
   診断ツール 5 つの設計と実装計画を策定

**セッション 2-3: ツール生成**

```
私: "Implement the following plan:"
    (Claude Code 自身が前のセッションで書いた計画を貼る)
```

→ 10 個のスクリプトが生成される。ここで私が言ったのは
   文字通り **"Implement the following plan"** だけ。

**セッション 4: pcap 解析〜V3 実装（ここが核心）**

```
私: "今まで色々実装してもらったけど、これって結局使えるようになったんだっけ"
私: "それは dwarf api だっけこの前やったやつ"
私: "進めて欲しいけど、そのためには何か解析する必要がある？
     それとも情報は揃ってるの？"
私: "じゃあそれぞれIssueを立ててもらって、調査内容を記入、
     そのあと実装してCopilotにレビューしてもらってください。"
```

→ この **1つの指示** で Claude Code が:
   - Issue #3 を作成（V3 コマンドの完全な仕様書つき）
   - .proto 8 ファイル + JS 7 モジュールを実装
   - PR #4 を作成（27 ファイル, +28,693行）
   - Copilot レビューの指摘 11 件を修正
   - PR マージ

**セッション 5: ドキュメント**

```
私: "これはコミットされてる？"
```

→ API リファレンスドキュメントが生成・コミットされる

---

### 注目してほしいポイント

**最も重要な指示はこれ**:

> "じゃあそれぞれIssueを立ててもらって、調査内容を記入、
> そのあと実装してCopilotにレビューしてもらってください。"

たった 1 文の指示で:
1. Issue 起票（完全な仕様書として機能する品質）
2. Proto 定義の設計と実装
3. コマンドモジュール 7 つの実装
4. PR 作成
5. レビュー対応
6. マージ

**28,693 行のコードが生成された。**

---

### 私の実際の作業時間の内訳

| 作業 | 私がやったこと |
|------|---------------|
| Wireshark キャプチャ | iPhone を操作しながら 5 回録画（計30分程度） |
| 実機テスト | `node v3-test.js --ip 192.168.11.31` を実行 |
| Claude Code への指示 | 上に書いた会話が全て。**合計で数十行** |
| 判断 | "フォークしよう"、"本家に触るな"、"Copilot にレビューさせて" |

**それ以外は全部 Claude Code が生成した。**

---

### 具体例: バイナリから GPS 座標を特定した瞬間

pcap-decode の出力で CMD 13010 に 67 バイトのペイロードを発見:

```
# 18 App→DWARF [REQ] v1.20 dev=1 mod=4 cmd=13010
     raw=09 77 19 0c 5b 60 ea 41 40 11 08 30 67 13 36 7c 61 40
         19 26 42 92 ac 3e 75 0f 40 22 06 e6 97 a5 ...  (67 bytes)
```

この出力を貼っただけで Claude Code が:

> - `09` → field 1, wire type 1 (64-bit fixed) → **double**
> - `77 19 0c 5b 60 ea 41 40` → IEEE 754 little-endian → **139.xxx** → 東京の経度
> - `11` → field 2, wire type 1 → double → **35.xxx** → 緯度
> - `19` → field 3, wire type 1 → double → **3.9** → 高度（メートル）
> - `22 06 e6 97 a5...` → field 4, wire type 2 (length-delimited) → UTF-8 → **"にいざし"**
>
> → GPS 位置情報の送信コマンドです。Proto 定義を書きます:

```protobuf
message ReqV3SetGPSLocation {
  double longitude = 1;
  double latitude = 2;
  double altitude = 3;
  string location_name = 4;
}
```

**バイナリを貼っただけで、Proto 定義まで生成された。**

---

## まとめ

### 成果

- **npm パッケージとして公開**: `dwarfii_api` v2.0.17
- V2 (DWARF II/3) と V3 (DWARF mini) の**デュアルプロトコル対応**
- 30+ の新コマンド、8 Proto ファイル、7 コマンドモジュールを追加

### 私がやったこと / Claude Code がやったこと

| 私（人間） | Claude Code |
|-----------|------------|
| "状況を調査して" | Issue #8, #9 を作成（法的検討含む） |
| "ツール作って" | 10個の診断スクリプトを設計・実装 |
| Wireshark でキャプチャ | — |
| 出力を貼る | パケット解析、未知コマンド特定、バイナリの意味推定 |
| `node v3-test.js` を実行 | — |
| "実装して" | .proto 8ファイル + JS 7モジュール (28,693行) |
| "レビュー直して" | Copilot 指摘 11件を修正 |
| "ドキュメント作って" | API リファレンス生成 |

### 感じたこと

- **指示を出すだけ** で計画→ツール→解析→実装→ドキュメントが全部できた
- 人間の仕事は「物理作業」と「判断」だけに集中できる
  - 物理: WiFi 設定、Wireshark 起動、望遠鏡の電源 ON
  - 判断: "次はこれを調べよう"、"この解釈で合ってる"
- バイナリを貼って「これ何？」で答えが返ってくるのが一番衝撃的だった
- 1日で Issue 起票 → ツール作成 → pcap 解析 → 実装 → PR マージまで完了した
