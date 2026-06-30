#!/bin/bash
# FX Learning App - Mac 起動
# Finder からダブルクリックして実行できます

# スクリプトのある場所からプロジェクトルートへ移動
DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

echo "====================================="
echo "  FX Learning App - 起動中"
echo "====================================="
echo ""

# セットアップ確認
if [ ! -d .venv ]; then
    echo "❌ .venv が見つかりません。先に mac/setup.command を実行してください。"
    read -p "Enterキーで閉じます..."
    exit 1
fi

if [ ! -d frontend/node_modules ]; then
    echo "❌ node_modules が見つかりません。先に mac/setup.command を実行してください。"
    read -p "Enterキーで閉じます..."
    exit 1
fi

# バックエンド起動
echo "バックエンドを起動中... (http://localhost:8000)"
.venv/bin/python3 run_backend.py &
BACKEND_PID=$!

# バックエンドの起動を待つ
sleep 4

# フロントエンド起動
echo "フロントエンドを起動中... (http://localhost:5173)"
python3 run_frontend.py &
FRONTEND_PID=$!

# ブラウザを開く
sleep 3
open http://localhost:5173

echo ""
echo "====================================="
echo "  起動完了！"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo ""
echo "  Ctrl+C で両サーバーを停止します"
echo "====================================="
echo ""

trap "kill \$BACKEND_PID \$FRONTEND_PID 2>/dev/null; echo '停止しました'; exit" INT TERM
wait
