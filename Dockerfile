# ─────────────────────────────────────────────
# Stage 1: Build the React frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Install frontend dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build
# Produces /app/frontend/dist

# ─────────────────────────────────────────────
# Stage 2: Backend + serve built frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app/backend

# Install backend dependencies (production only)
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Copy the built frontend into the backend's public folder
COPY --from=frontend-builder /app/frontend/dist ./public

# Create uploads directory
RUN mkdir -p uploads

# Expose the port Cloud Run uses
EXPOSE 8080

# Start the server
CMD ["node", "index.js"]
