# ─── Stage 1: Build Angular ───────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build:prod

# ─── Stage 2: Serve with Nginx ────────────────────────────
FROM nginx:alpine

# Copy built Angular dist
COPY --from=builder /app/dist/booknest-frontend /usr/share/nginx/html

# Copy nginx config for Angular routing + proxy to API Gateway
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
