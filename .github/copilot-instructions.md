# Copilot Instructions for FX Learning App

## プロジェクト概要
AIと対話しながらFX（USD/JPY）のテクニカル分析を学ぶWebアプリ。
React + FastAPI + GitHub Models API 構成。

## 絶対守るルール（最重要）

1. **パス直書き禁止**: ファイル内で他ファイルのパスをハードコードしない。絶対パスも禁止（OS固有ツール除く）。
   - Backend: `backend/app/core/config.py` から設定を読む
   - Frontend: `frontend/src/config/` から設定を読む
   - パス解決は必ず設定モジュール経由、または `__file__` からの相対解決

2. **マジックナンバー禁止**: 定数は全て設定ファイルまたは環境変数で管理。
   - ユーザー設定 → `.env`
   - アプリ定数 → `docs/system_config.md` に記載し、コード内は設定モジュール経由

3. **ファイル作成・変更時の義務**:
   - `docs/system_config.md` にファイルを登録
   - `docs/function_map.md` に機能を登録
   - 影響を受ける既存ファイル・機能がないかレビュー

4. **フォルダ構成**: クリーンアーキテクチャ準拠
   - `api/` → ルーティングのみ（薄く）
   - `services/` → ビジネスロジック
   - `models/` → データ構造定義
   - `core/` → 横断的関心事（設定、ログ等）

5. **rootに置けるファイル**: 実行ファイル、.env、README.md のみ

## 技術スタック
- Frontend: React + Vite + TypeScript + TradingView Lightweight Charts
- Backend: Python FastAPI + yfinance + GitHub Models API
- 通信: REST API（将来WebSocket拡張可能）

## コミット規則
- 機能単位で段階的にcommit
- 日本語commitメッセージOK
- Co-authored-by trailer を含める

## ドキュメント更新タイミング
- ファイル追加/削除 → system_config.md 更新
- 機能追加/変更/削除 → function_map.md 更新
- 設計方針変更 → README.md + この instructions 更新
- 実装と乖離が生じたら即時修正
