# ================================
# Stage 1: Build React app
# ================================

FROM  node:22-alpine AS builder-stage

WORKDIR /app

COPY package*.json ./ 

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

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


