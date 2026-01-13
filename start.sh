#!/bin/bash
export PYTHONUNBUFFERED=1

# --- secrets injection ---
# If GOOGLE_CREDENTIALS_JSON env var is set (from Railway), write it to the file
if [ -n "$GOOGLE_CREDENTIALS_JSON" ]; then
    echo "Detected GOOGLE_CREDENTIALS_JSON, writing to google_gemini_service_account.json..."
    echo "$GOOGLE_CREDENTIALS_JSON" > /app/google_gemini_service_account.json
    export GOOGLE_APPLICATION_CREDENTIALS="/app/google_gemini_service_account.json"
fi

# Start Backend in background
echo "Starting Python Backend..."
/opt/venv/bin/python3 api_server.py &

# Start Frontend
echo "Starting Next.js..."
npm start
