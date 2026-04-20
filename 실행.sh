#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Flask 백엔드 시작 (포트 5002)..."
python3 server.py &
FLASK_PID=$!

sleep 1

echo "🚀 프론트엔드 시작 → http://localhost:3000"
npm run dev

kill $FLASK_PID
