#!/bin/bash
# FX Learning App - Mac セットアップ
# Finder からダブルクリックして実行できます

# スクリプトのある場所からプロジェクトルートへ移動
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "====================================="
echo "  FX Learning App - Mac セットアップ"
echo "====================================="
echo ""

echo "[1/4] Python仮想環境を作成中..."
if [ ! -d .venv ]; then
    python3 -m venv .venv
    echo "  .venv を作成しました"
else
    echo "  .venv はすでに存在します"
fi

echo "[2/4] バックエンド依存パッケージをインストール中..."
.venv/bin/pip install -r backend/requirements.txt --quiet
echo "  完了"

echo "[3/4] フロントエンド依存パッケージをインストール中..."
cd frontend
npm install --silent
cd ..
echo "  完了"

echo "[4/4] .env ファイルを確認中..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "  .env を作成しました"
    echo ""
    echo "  ⚠️  .env を開いて GITHUB_TOKEN を設定してください"
    open .env
else
    echo "  .env はすでに存在します"
fi

echo ""
echo "====================================="
echo "  セットアップ完了！"
echo "  次: mac/start.command をダブルクリック"
echo "====================================="
echo ""
read -p "Enterキーで閉じます..."
