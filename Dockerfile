# Base image with Node.js
FROM node:20-slim AS base

# Install Python and build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# --- Python Backend Setup ---
# Create virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
# If requirements.txt doesn't exist, we'll install manually (fallback for now)
# RUN pip install -r requirements.txt
RUN pip install fastapi uvicorn python-dotenv google-genai pydantic

# --- Frontend Setup ---
COPY package.json package-lock.json ./
RUN npm ci

# Copy Source Code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

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
