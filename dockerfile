FROM node:20-alpine

WORKDIR /app

# Install nginx and supervisord to run both services
RUN apk add --no-cache nginx supervisor

# ===== Build Frontend (React/Vite) =====
COPY package*.json ./
RUN npm ci
COPY src ./src
COPY index.html vite.config.js ./
RUN npm run build

# ===== Setup Backend =====
COPY server/package*.json ./server/
RUN cd server && npm ci

COPY server ./server

# ===== Configure Services =====

# Copy nginx config (serves frontend + proxies /api to backend)
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built frontend to nginx html directory
RUN mkdir -p /usr/share/nginx/html && cp -r /app/dist/* /usr/share/nginx/html/

# Copy supervisord config to run both services
COPY supervisord.conf /etc/supervisor/conf.d/services.conf

# Create log directories
RUN mkdir -p /var/log/supervisor

# Expose port 80
EXPOSE 80

# Start supervisord (runs both services)
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/services.conf"]
