# ================================
# Stage 1: Build React app
# ================================

FROM node:22-alpine AS builder-stage

WORKDIR /app

COPY package*.json ./

RUN npm ci

# Copy all source files and .env.production
COPY . .

# Accept build argument from docker-compose
ARG VITE_API_URL

# Set environment variable (can be empty for production)
# If ARG is empty, .env.production will be used by Vite
ENV VITE_API_URL=${VITE_API_URL}

# Build for production (Vite will read .env.production if ENV is empty)
RUN npm run build

# ================================
# Stage 2: Serve app with Nginx
# ================================

FROM nginx:1.29-alpine AS production-stage

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder-stage /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ================================
# End of Dockerfile
# ================================


