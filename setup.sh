#!/bin/bash
# FX Learning App - Mac/Linux Setup
# Requires: Python 3.11+, Node.js 18+

set -e

echo "[1/4] Creating Python virtual environment..."
if [ ! -d .venv ]; then
    python3 -m venv .venv
    echo ".venv created."
else
    echo ".venv already exists, skipping."
fi

echo "[2/4] Installing backend dependencies into .venv..."
.venv/bin/pip install -r backend/requirements.txt --quiet

echo "[3/4] Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo "[4/4] Creating .env from template (if not exists)..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env created. Please edit it to set your GITHUB_TOKEN."
else
    echo ".env already exists, skipping."
fi

echo ""
echo "Setup complete!"
echo "Next: Edit .env to set GITHUB_TOKEN, then run: ./start.sh"
