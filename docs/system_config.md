# System Config - ファイル管理・設定値管理

## ファイル一覧

### Root
| ファイル | 役割 | 備考 |
|---------|------|------|
| README.md | プロジェクト全体説明 | |
| .env | ユーザー環境変数 | git管理外 |
| .env.example | 環境変数テンプレート | |
| run_backend.py | バックエンド起動 | 未作成 |
| run_frontend.bat | フロントエンド起動 | 未作成 |

### docs/
| ファイル | 役割 |
|---------|------|
| docs/system_config.md | 本ファイル。ファイル管理・設定管理 |
| docs/function_map.md | 機能マップ |

### .github/
| ファイル | 役割 |
|---------|------|
| .github/copilot-instructions.md | Copilotへの指示 |

### backend/ (未作成)
| ファイル | 役割 |
|---------|------|

### frontend/ (未作成)
| ファイル | 役割 |
|---------|------|

---

## 設定値管理

### 環境変数（.env）
| 変数名 | 説明 | デフォルト |
|--------|------|-----------|
| GITHUB_TOKEN | GitHub Models API トークン | (なし・必須) |
| BACKEND_PORT | バックエンドポート | 8000 |
| FRONTEND_PORT | フロントエンドポート | 5173 |
| DEFAULT_PAIR | デフォルト通貨ペア | USDJPY=X |

### アプリ内定数
| 定数名 | 値 | 用途 | 定義場所 |
|--------|---|------|----------|
| API_BASE_URL | 環境変数から取得 | バックエンドURL | frontend/src/config/ |
| CANDLE_INTERVALS | 1m,5m,15m,1h,4h,1d | ローソク足間隔選択肢 | backend/app/core/config.py |
| MAX_CHAT_HISTORY | 50 | AI会話の最大履歴数 | backend/app/core/config.py |

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
