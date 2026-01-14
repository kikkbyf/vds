#!/bin/bash
export PYTHONUNBUFFERED=1

# --- secrets injection ---
# If GOOGLE_CREDENTIALS_JSON env var is set (from Railway), write it to the file
if [ -n "$GOOGLE_CREDENTIALS_JSON" ]; then
    echo "Detected GOOGLE_CREDENTIALS_JSON, writing to google_gemini_service_account.json..."
    echo "$GOOGLE_CREDENTIALS_JSON" > /app/google_gemini_service_account.json
    export GOOGLE_APPLICATION_CREDENTIALS="/app/google_gemini_service_account.json"
fi

# Sync Database Schema
echo "Syncing Database Schema..."
npx prisma db push

# Run Data Migrations (Versioning)
echo "Checking Data Migrations..."
node scripts/migrate.js

# Auto-create Admin User (Safe to run multiple times, it uses upsert)
echo "Ensuring Admin User Exists..."
node scripts/create-admin.js "yifan.bu17@gmail.com" "kikk9229"
node scripts/approve-admin.js

# Start Backend in background
echo "Starting Python Backend..."
/opt/venv/bin/python3 api_server.py &

# Start Frontend
echo "Starting Next.js..."
npm start
