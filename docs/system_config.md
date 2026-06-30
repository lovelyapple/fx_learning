# System Config - ファイル管理・設定値管理

## ファイル一覧

### Root
| ファイル | 役割 | 備考 |
|---------|------|------|
| README.md | プロジェクト全体説明 | |
| .env | ユーザー環境変数 | git管理外 |
| .env.example | 環境変数テンプレート | |
| run_backend.py | バックエンド起動 | Python・共通 |
| run_frontend.py | フロントエンド起動 | Python・共通 |
| setup.bat | Windowsセットアップ | Windows専用 |
| setup.sh | Mac/Linuxセットアップ | Mac/Linux専用 |

### docs/
| ファイル | 役割 |
|---------|------|
| docs/system_config.md | 本ファイル。ファイル管理・設定管理 |
| docs/function_map.md | 機能マップ |

### .github/
| ファイル | 役割 |
|---------|------|
| .github/copilot-instructions.md | Copilotへの指示 |

### mac/
| ファイル | 役割 |
|---------|------|
| mac/setup.command | Macセットアップ（Finderダブルクリック対応） |
| mac/start.command | Mac起動スクリプト（Finderダブルクリック対応） |
| ファイル | 役割 |
|---------|------|
| .venv/ | Python仮想環境（git管理外） |
| backend/requirements.txt | Python依存パッケージ（>= 形式・Python3.11+対応） |
| backend/app/__init__.py | パッケージ定義 |
| backend/app/main.py | FastAPIエントリポイント |
| backend/app/core/__init__.py | 設定管理（Settings, get_settings） |
| backend/app/api/__init__.py | APIルーティング |
| backend/app/models/__init__.py | Pydanticデータモデル |
| backend/app/services/__init__.py | サービスパッケージ |
| backend/app/services/fx_data_service.py | 為替データ取得（yfinance + fallback） |
| backend/app/services/indicator_service.py | テクニカル指標計算 |
| backend/app/services/ai_chat_service.py | AI対話（GitHub Models API） |
| backend/app/prompts/system_prompt.txt | AIシステムプロンプト |
| backend/app/db/__init__.py | DB初期化・接続管理 |
| backend/app/db/candle_repository.py | ローソク足データCRUD |
| backend/app/db/chat_repository.py | チャット履歴・仮説CRUD |

### frontend/
| ファイル | 役割 |
|---------|------|
| frontend/package.json | npm依存定義 |
| frontend/tsconfig.json | TypeScript設定 |
| frontend/vite.config.ts | Vite設定（プロキシ、エイリアス） |
| frontend/index.html | HTMLエントリ |
| frontend/src/main.tsx | Reactエントリポイント |
| frontend/src/App.tsx | メインAppコンポーネント |
| frontend/src/styles.css | グローバルスタイル |
| frontend/src/config/index.ts | フロント設定（環境変数読み込み） |
| frontend/src/types/index.ts | TypeScript型定義 |
| frontend/src/services/api.ts | API通信層 |
| frontend/src/components/CandlestickChart.tsx | ローソク足チャート |
| frontend/src/components/ChatPanel.tsx | AIチャットUI |
| frontend/src/components/ChartControls.tsx | 時間足・指標コントロール |
| frontend/src/components/HypothesisPanel.tsx | 仮説表示パネル |
| frontend/src/components/PatternLibrary.tsx | パターン集ページ（18パターンSVGカード） |
| frontend/src/components/PatternSidebar.tsx | パターン分析サイドバー（畳める・localStorage保持） |
| frontend/src/components/Glossary.tsx | 用語集ページ（4カテゴリ42用語） |
| frontend/src/data/candlePatterns.ts | ローソク足パターン定義・matchPattern関数 |

---

## 設定値管理

### 環境変数（.env）
| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| GITHUB_TOKEN | GitHub Models API トークン | (なし・必須) |
| TWELVEDATA_API_KEY | Twelve Data APIキー（ライブ価格フォールバック） | demo |
| BACKEND_PORT | バックエンドポート | 8000 |
| FRONTEND_PORT | フロントエンドポート | 5173 |
| DEFAULT_PAIR | デフォルト通貨ペア | USDJPY=X |

### アプリ内定数
| 定数名 | 値 | 用途 | 定義場所 |
|--------|---|------|----------|
| API_BASE_URL | 環境変数から取得 | バックエンドURL | frontend/src/config/ |
| DEFAULT_INTERVAL | 1m | デフォルトローソク足間隔 | backend/app/core/__init__.py |
| DEFAULT_PERIOD | 1d | デフォルトデータ期間 | backend/app/core/__init__.py |
| CANDLE_INTERVALS | 1m,5m,15m,1h,4h,1d | ローソク足間隔選択肢 | backend/app/core/__init__.py |
| ALLOWED_PERIODS | 1d,5d,1mo,3mo,6mo,1y | データ期間選択肢 | backend/app/core/__init__.py |
| ALLOWED_PAIRS | USDJPY=X,EURUSD=X,GBPJPY=X | 通貨ペア許可リスト | backend/app/core/__init__.py |
| MAX_CHAT_HISTORY | 50 | AI会話の最大履歴数 | backend/app/core/__init__.py |
| AI_CONTEXT_CANDLES | 80 | AIに渡す直近ローソク足数 | backend/app/core/__init__.py |
| AI_TIMEOUT_SECONDS | 30 | AI API タイムアウト | backend/app/core/__init__.py |
| AUTO_REFRESH_INTERVAL_MS | 30000 | チャート自動更新間隔 | frontend/src/config/index.ts |
| LIVE_PRICE_INTERVAL_MS | 10000 | ライブ価格更新間隔 | frontend/src/config/index.ts |
| DB_PATH | data/fx_learning.db | SQLiteファイル位置 | backend/app/db/__init__.py |

---

## パス解決ルール

ファイル間の参照は以下の方法で行う（直書き禁止）：

- **Backend**: `from app.core.config import settings` 経由
- **Frontend**: `import { config } from '@/config'` 経由
- **テスト**: テスト用の設定を別途定義

---

## 更新履歴

| 日付 | 変更内容 |
|------|---------|
| 2026-06-24 | 初期作成。プロジェクト基盤ドキュメント |
| 2026-06-30 | Python venv対応。requirements.txt を >=形式に更新。.venv/ 追加 |
| 2026-06-30 | mac/ フォルダ追加。setup.command / start.command 追加 |
| 2026-07-01 | TWELVEDATA_API_KEY追加。定数にDEFAULT_INTERVAL/PERIOD/AUTO_REFRESH/LIVE_PRICE追加 |
| 2026-07-01 | RSIサブチャート追加（rsiChartHeight定数追加）。PatternLibrary/PatternSidebar/Glossary/candlePatterns追加 |
