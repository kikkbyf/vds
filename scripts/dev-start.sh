#!/bin/bash

PORT=9229

echo "🔍 Checking for processes on port $PORT..."

# Find PID occupying the port
PID=$(lsof -ti :$PORT)

if [ -n "$PID" ]; then
  echo "⚠️  Port $PORT is in use by PID $PID. Killing it..."
  kill -9 $PID
  echo "✅ Process killed."
else
  echo "✅ Port $PORT is free."
fi

# Clean Next.js lock file if it exists
if [ -f ".next/dev/lock" ]; then
  echo "🧹 Cleaning .next/dev/lock..."
  rm .next/dev/lock
fi

echo "🚀 Starting Next.js Dev Server with TurboPack..."
# Using exec so the new process takes over the shell (signals pass through)
exec npx next dev -p $PORT --turbo
