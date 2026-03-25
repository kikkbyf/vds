#!/bin/bash
export PYTHONUNBUFFERED=1

retry_command() {
    local description="$1"
    local attempts="$2"
    local sleep_seconds="$3"
    shift 3

    local attempt=1
    while [ "$attempt" -le "$attempts" ]; do
        echo "${description} (attempt ${attempt}/${attempts})..."
        if "$@"; then
            echo "${description} succeeded."
            return 0
        fi

        if [ "$attempt" -lt "$attempts" ]; then
            echo "${description} failed. Waiting ${sleep_seconds}s before retry..."
            sleep "$sleep_seconds"
        fi

        attempt=$((attempt + 1))
    done

    echo "${description} failed after ${attempts} attempts."
    return 1
}

# --- secrets injection ---
# If GOOGLE_CREDENTIALS_JSON env var is set (from Railway), write it to the file
if [ -n "$GOOGLE_CREDENTIALS_JSON" ]; then
    echo "Detected GOOGLE_CREDENTIALS_JSON, writing to google_gemini_service_account.json..."
    echo "$GOOGLE_CREDENTIALS_JSON" > /app/google_gemini_service_account.json
    export GOOGLE_APPLICATION_CREDENTIALS="/app/google_gemini_service_account.json"
fi

# Sync Database Schema
echo "Syncing Database Schema..."
retry_command "Prisma schema sync" 10 5 npx prisma db push

# Run Data Migrations (Versioning)
echo "Checking Data Migrations..."
retry_command "Data migrations" 10 5 node scripts/migrate.js

# Auto-create Admin User (Safe to run multiple times, it uses upsert)
echo "Ensuring Admin User Exists..."
retry_command "Admin user bootstrap" 10 5 node scripts/create-admin.js "yifan.bu17@gmail.com" "kikk9229"
retry_command "Admin approval" 10 5 node scripts/approve-admin.js

# Start Backend in background
echo "Starting Python Backend..."
/opt/venv/bin/python3 api_server.py &

# Start Frontend
echo "Starting Next.js..."
npm start
