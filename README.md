# FX Learning App

AIと対話しながらFX（ドル円）のテクニカル分析を学ぶアプリケーション。

## 概要

リアルタイムの為替データを用いて、ローソク足チャート・テクニカル指標を表示し、
AIチャットを通じて「この形は何？」「ブレイクした？」「仮説が正しいか？」といった
対話型学習を実現する。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Frontend | React + Vite + TypeScript |
| チャート | TradingView Lightweight Charts |
| Backend | Python FastAPI |
| AI | GitHub Models API |
| データ | Yahoo Finance (yfinance) |

## アーキテクチャ

```
fx_learning/
├── backend/              # Python FastAPI サーバー（クロスプラットフォーム）
│   ├── app/
│   │   ├── api/          # ルーティング（エンドポイント定義）
│   │   ├── services/     # ビジネスロジック（データ取得、AI、指標計算）
│   │   ├── models/       # データモデル（Pydantic）
│   │   ├── core/         # 設定、共通ユーティリティ
│   │   ├── db/           # データベース（SQLite永続化）
│   │   ├── prompts/      # AIプロンプトファイル
│   │   └── main.py       # FastAPI アプリエントリポイント
│   ├── tests/
│   └── requirements.txt
├── frontend/             # React + Vite（クロスプラットフォーム）
│   ├── src/
│   │   ├── components/   # UIコンポーネント
│   │   ├── services/     # API通信層
│   │   ├── hooks/        # カスタムフック
│   │   ├── types/        # 型定義
│   │   ├── config/       # 設定読み込み
│   │   └── App.tsx
│   └── package.json
├── data/                 # SQLite DB（git管理外）
├── docs/                 # ドキュメント
│   ├── function_map.md   # 機能マップ
│   └── system_config.md  # システム設定・ファイル管理
├── .github/
│   └── copilot-instructions.md
├── .env                  # 環境変数（ユーザー設定・git管理外）
├── .env.example          # 環境変数テンプレート
├── run_backend.py        # バックエンド起動（Python・共通）
├── run_frontend.py       # フロントエンド起動（Python・共通）
├── setup.bat             # Windows セットアップ
├── setup.sh              # Mac/Linux セットアップ
└── README.md
```

> **クロスプラットフォーム方針**: コアロジック（backend/, frontend/）は全てOS非依存。
> OS固有の処理が必要な場合は `windows/` または `mac/` フォルダに格納する。
> 起動スクリプトとセットアップスクリプトのみrootに配置可。

## プロジェクトルール

### 1. Git管理
- 段階的にcommitする（機能単位・論理単位）
- commitメッセージは日本語OK、内容を明確に

### 2. ドキュメント管理
- **README.md**: プロジェクト全体像、方針、手引き
- **docs/system_config.md**: ファイル一覧、設定値、パス管理
- **docs/function_map.md**: 機能とファイルの対応表
- **.github/copilot-instructions.md**: Copilotへの重要指示

### 3. コーディングルール
- ❌ ファイル内で他ファイルのパスを直書き禁止 → 設定ファイルから読む
- ❌ マジックナンバー禁止 → 環境変数 or 設定ファイルで管理
- ❌ rootに不要なファイルを置かない（実行ファイル、.env、設定のみ）
- ✅ クリーンアーキテクチャ思想でフォルダ分離
- ✅ 機能変更時は影響範囲をレビューし、function_map.mdを更新

### 4. 環境変数
- `.env` にユーザーが設定する値を記載
- `.env.example` にテンプレートを用意
- アプリ内部の定数は `docs/system_config.md` で管理

## セットアップ

### Windows
```bat
setup.bat
```

### Mac/Linux
```bash
chmod +x setup.sh
./setup.sh
```

### 手動セットアップ
```bash
# 1. 環境変数を設定
cp .env.example .env
# .env を編集してGITHUB_TOKENを設定

# 2. バックエンド
cd backend
pip install -r requirements.txt

# 3. フロントエンド
cd frontend
npm install
```

## 起動

```bash
# バックエンド（ターミナル1）
python run_backend.py

# フロントエンド（ターミナル2）
python run_frontend.py
```

## TODO

- [ ] プロジェクト基盤作成（ドキュメント、フォルダ構成）
- [ ] バックエンド：為替データ取得API
- [ ] バックエンド：テクニカル指標計算
- [ ] バックエンド：AIチャットAPI（GitHub Models）
- [ ] フロントエンド：ローソク足チャート表示
- [ ] フロントエンド：テクニカル指標オーバーレイ
- [ ] フロントエンド：AIチャットパネル
- [ ] フロントエンド：仮説可視化（予測ライン描画）
- [ ] 統合テスト・動作確認
