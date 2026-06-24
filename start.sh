#!/bin/bash
# FX Learning App - Start (Mac/Linux)
# Backend and Frontend both start in background

echo "Starting FX Learning App..."

# Start backend
python3 run_backend.py &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 3

# Start frontend
python3 run_frontend.py &
FRONTEND_PID=$!

echo ""
echo "Backend:  http://localhost:8000 (PID: $BACKEND_PID)"
echo "Frontend: http://localhost:5173 (PID: $FRONTEND_PID)"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
