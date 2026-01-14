# Base image with Node.js (Full version to ensure all libs for Prisma are present)
FROM node:20 AS base

# Install Python and build dependencies
# We include openssl explicitly even though node:20 usually has it, just to be safe
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python Backend Setup ---
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .
RUN pip install fastapi uvicorn python-dotenv google-genai pydantic

# --- Frontend Setup ---
COPY package.json package-lock.json ./

# 1. Install dependencies
# We allow postinstall scripts to run naturally.
# Even if they fail due to missing schema, we will run generate manually later.
RUN npm install --legacy-peer-deps

# 2. Copy Source Code (includes prisma/schema.prisma)
COPY . .

# 3. Generate Prisma Client
# explicit schema location is good practice
# Generate Prisma Client (Explicitly)
# We use an inline environment variable so it doesn't persist in the runtime image
RUN DATABASE_URL="postgresql://dummy:5432/mydb" npx prisma generate --schema=./prisma/schema.prisma

# Build Next.js
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Expose ports
ENV PORT=3000
EXPOSE 3000
EXPOSE 8000

# Start script
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
