# ─── STAGE 1: Build the React Application ─────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Cache dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build-time environment arguments (Vite bakes these into JS bundles during build)
ARG VITE_API_BASE_URL=http://localhost:5981
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ─── STAGE 2: Lightweight Nginx Web Server ─────────────────────────
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clean default assets
RUN rm -rf ./*

# Copy compiled static assets from builder
COPY --from=builder /app/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Port 80 for web traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
