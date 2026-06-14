# ── Stage 1: build the Vite app ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ── Stage 2: serve with nginx ─────────────────────────────────────────────────
FROM nginx:alpine

# Static assets from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Logo asset (already in dist via public/, but kept explicit for clarity)
# (Vite copies public/ into dist/ at build time automatically)

# nginx config template — $BACKEND_URL is substituted at startup
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Default backend URL works for docker-compose where the service is named "backend"
ENV BACKEND_URL=http://backend:8000

EXPOSE 80

# Substitute only $BACKEND_URL, leaving nginx's own $host/$uri/$remote_addr untouched
CMD ["/bin/sh", "-c", \
  "envsubst '$BACKEND_URL' < /etc/nginx/conf.d/default.conf.template \
   > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
