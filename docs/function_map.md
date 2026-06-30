# Function Map - 機能マップ

機能の所在と依存関係を管理する。
機能の追加・変更・削除時は必ずこのファイルを更新し、影響範囲を確認すること。

---

## Backend 機能一覧

| 機能 | ファイル | 依存先 | 状態 |
|------|---------|--------|------|
| 設定管理 | backend/app/core/__init__.py | .env | ✅ 実装済 |
| 為替データ取得 | backend/app/services/fx_data_service.py | yfinance, db/candle_repository | ✅ 実装済 |
| ライブ価格取得 | backend/app/services/fx_data_service.py | yfinance(1m) → Twelve Data → DBキャッシュ | ✅ 実装済 |
| 選択ローソク足AIコンテキスト | backend/app/services/ai_chat_service.py | models | ✅ 実装済 |
| テクニカル指標計算 | backend/app/services/indicator_service.py | ta, models | ✅ 実装済 |
| AI対話 | backend/app/services/ai_chat_service.py | httpx, core/config, models | ✅ 実装済 |
| DB初期化 | backend/app/db/__init__.py | sqlite3 | ✅ 実装済 |
| ローソク足永続化 | backend/app/db/candle_repository.py | db/__init__, models | ✅ 実装済 |
| チャット履歴永続化 | backend/app/db/chat_repository.py | db/__init__, models | ✅ 実装済 |
| APIルーティング | backend/app/api/__init__.py | services/*, db/* | ✅ 実装済 |

---

## Frontend 機能一覧

| 機能 | ファイル | 依存先 | 状態 |
|------|---------|--------|------|
| ローソク足チャート表示 | src/components/CandlestickChart.tsx | lightweight-charts, types | ✅ 実装済 |
| テクニカル指標オーバーレイ | src/components/CandlestickChart.tsx | lightweight-charts | ✅ 実装済 |
| 仮説ライン描画 | src/components/CandlestickChart.tsx | lightweight-charts | ✅ 実装済 |
| ローソク足範囲選択（番号付き） | src/components/CandlestickChart.tsx | lightweight-charts | ✅ 実装済 |
| AIチャットUI（⌘Enter送信） | src/components/ChatPanel.tsx | services/api | ✅ 実装済 |
| ライブ価格バッジ（10秒更新） | src/App.tsx | services/api | ✅ 実装済 |
| チャートコントロール | src/components/ChartControls.tsx | config | ✅ 実装済 |
| 仮説表示パネル | src/components/HypothesisPanel.tsx | types | ✅ 実装済 |
| API通信 | src/services/api.ts | config, types | ✅ 実装済 |
| 設定管理 | src/config/index.ts | 環境変数 | ✅ 実装済 |

---

## API エンドポイント一覧

| メソッド | パス | 機能 | ハンドラ | 状態 |
|---------|------|------|---------|------|
| GET | /health | ヘルスチェック | app/main.py | ✅ |
| GET | /api/chart | ローソク足+指標取得 | app/api/__init__.py | ✅ |
| POST | /api/chat | AI対話 | app/api/__init__.py | ✅ |
| GET | /api/chat/history | チャット履歴取得 | app/api/__init__.py | ✅ |
| GET | /api/indicators | 利用可能指標一覧 | app/api/__init__.py | ✅ |
| GET | /api/hypotheses | 仮説一覧取得 | app/api/__init__.py | ✅ |
| GET | /api/price | ライブ価格取得 | app/api/__init__.py | ✅ |

---

## OS固有機能（Windows）

| 機能 | ファイル | 備考 |
|------|---------|------|
| セットアップ | setup.bat | Python/npm依存インストール |
| 一括起動 | start.bat | Backend+Frontend同時起動 |

---

## OS固有機能（Mac/Linux）

| 機能 | ファイル | 備考 |
|------|---------|------|
| セットアップ | setup.sh | Python/npm依存インストール（CLI用） |
| 一括起動 | start.sh | Backend+Frontend同時起動（CLI用） |
| セットアップ（Mac GUI） | mac/setup.command | Finderダブルクリック対応 |
| 一括起動（Mac GUI） | mac/start.command | Finderダブルクリック対応 |

---

## 共通起動スクリプト（OS非依存）

| 機能 | ファイル | 備考 |
|------|---------|------|
| バックエンド起動 | run_backend.py | Python |
| フロントエンド起動 | run_frontend.py | Python |

---

## 影響分析テンプレート

機能を変更する際は以下を確認：

1. この機能を呼び出しているファイルはどれか？
2. この機能が依存しているファイル/APIはどれか？
3. 型定義の変更が必要か？
4. テストの更新が必要か？

---

## 更新履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-06-24 | 初期作成。テンプレート準備 |
| 2026-06-30 | セットアップ・起動スクリプトのvenv対応 |
| 2026-06-30 | mac/ フォルダ追加。setup.command / start.command 追加 |
| 2026-07-01 | /api/price 追加。ライブ価格・ローソク足範囲選択・番号マーカー・JST表示・⌘Enter送信・自動更新安定化 |
