#!/bin/bash
# FX Learning App - Mac/Linux Setup
# Requires: Python 3.11+, Node.js 18+

set -e

echo "[1/3] Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
cd ..

echo "[2/3] Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "[3/3] Creating .env from template (if not exists)..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo ".env created. Please edit it to set your GITHUB_TOKEN."
else
    echo ".env already exists, skipping."
fi

echo ""
echo "Setup complete!"
echo "Next: Edit .env, then run: python3 run_backend.py"
