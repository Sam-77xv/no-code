# ClipForge Desktop Application Dockerfile
# Builds the Tauri desktop application

# Stage 1: Install Rust and Node.js dependencies
FROM rust:1-slim AS builder

WORKDIR /app

# Install Node.js and pnpm
RUN apt-get update && apt-get install -y \
    curl \
    git \
    pkg-config \
    libssl-dev \
    libgtk-3-dev \
    libwebkit2gtk-4.1-dev \
    libappindicator3-dev \
    librsvg2-dev \
    patchelf \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js via nvm
ENV NVM_DIR /usr/local/nvm
ENV NODE_VERSION 18
RUN mkdir -p $NVM_DIR && \
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash && \
    . "$NVM_DIR/nvm.sh" && \
    nvm install $NODE_VERSION && \
    nvm use $NODE_VERSION && \
    npm install -g pnpm

# Copy source files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the web frontend
RUN pnpm --filter @clipforge/web build

# Build the Tauri desktop application
RUN cd apps/desktop && \
    pnpm tauri build --ci

# Stage 2: Package the desktop application
FROM debian:stable-slim

WORKDIR /app

# Copy built files
COPY --from=builder /app/apps/desktop/src-tauri/target/release /app/dist

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libgtk-3-0 \
    libwebkit2gtk-4.1-0 \
    libappindicator3-1 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Create output directory
RUN mkdir -p /app/output

# Copy the built binary
COPY --from=builder /app/apps/desktop/src-tauri/target/release/clipforge /app/output/clipforge

# Set entrypoint
ENTRYPOINT ["/app/output/clipforge"]
