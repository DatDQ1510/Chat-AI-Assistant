# 🐳 Docker Deployment Guide

## 📋 Tổng quan

Hệ thống gồm **5 services**:
1. **database** - PostgreSQL 15 + pgvector extension
2. **redis** - Redis 7 cho caching và job queue
3. **backend** - Node.js API server (Express + Socket.IO)
4. **worker** - BullMQ worker cho background jobs
5. **frontend** - React SPA (Nginx)

## 🚀 Deployment Commands

### Build và chạy tất cả services
```bash
docker-compose up --build -d
```

### Chỉ chạy một service cụ thể
```bash
# Backend only
docker-compose up backend -d

# Frontend only
docker-compose up frontend -d

# Worker only
docker-compose up worker -d
```

### Xem logs
```bash
# Tất cả services
docker-compose logs -f

# Backend
docker-compose logs -f backend

# Worker
docker-compose logs -f worker

# Frontend
docker-compose logs -f frontend
```

### Stop và xóa containers
```bash
docker-compose down

# Xóa cả volumes (⚠️ mất data)
docker-compose down -v
```

## 📁 Cấu trúc Files

```
.
├── docker-compose.yml          # Main orchestration file
├── .env                        # Root environment variables
│
├── Database/
│   ├── Dockerfile             # PostgreSQL + pgvector
│   └── init/
│       └── uuid.sql           # Init script
│
├── Backend/
│   ├── Dockerfile.backend     # Node.js production build
│   ├── .dockerignore
│   └── .env                   # Backend-specific env vars
│
└── Frontend/
    ├── Dockerfile             # Vite build + Nginx
    ├── nginx.conf             # Reverse proxy config
    ├── .env                   # Dev environment
    └── .env.production        # Production environment
```

## 🔧 Environment Variables

### Root `.env` (dùng cho Docker Compose)
```dotenv
# Database
DB_HOST=database          # Service name trong Docker network
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=chat_ai_assistant

# Redis
REDIS_HOST=redis          # Service name trong Docker network
REDIS_PORT=6379

# Backend
PORT=5000
NODE_ENV=development
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...

# Docker Ports (host mapping)
BACKEND_PORT=5000
FRONTEND_PORT=80
```

### Backend `.env`
```dotenv
# Same as root .env but with Docker service names
DB_HOST=database
REDIS_HOST=redis
```

### Frontend `.env.production`
```dotenv
# Empty để dùng relative paths (Nginx sẽ proxy)
VITE_API_URL=
```

## 🌐 Network Architecture

```
┌─────────────────────────────────────────────┐
│         Docker Network: app-network         │
│                                             │
│  ┌─────────┐   ┌─────────┐   ┌──────────┐  │
│  │Database │   │  Redis  │   │  Backend │  │
│  │ :5432   │◄──┤  :6379  │◄──┤  :5000   │  │
│  └─────────┘   └─────────┘   └────▲─────┘  │
│                                    │        │
│                    ┌───────────────┘        │
│                    │                        │
│                ┌───┴────┐   ┌──────────┐    │
│                │ Worker │   │ Frontend │    │
│                │(BullMQ)│   │   :80    │    │
│                └────────┘   └─────▲────┘    │
└─────────────────────────────────┼──────────┘
                                  │
                         ┌────────┴────────┐
                         │   Host :80      │
                         │  (Browser)      │
                         └─────────────────┘
```

### Request Flow

1. **Browser → Frontend (Nginx :80)**
   ```
   http://localhost:80/
   ```

2. **Frontend → Backend API (via Nginx proxy)**
   ```
   /v1/api/* → http://backend:5000/v1/api/*
   ```

3. **Frontend → Backend Socket.IO (via Nginx proxy)**
   ```
   /socket.io/* → http://backend:5000/socket.io/*
   ```

4. **Backend → Database**
   ```
   postgresql://database:5432/chat_ai_assistant
   ```

5. **Backend → Redis**
   ```
   redis://redis:6379
   ```

6. **Worker → Redis (consume jobs)**
   ```
   redis://redis:6379
   ```

## 🐛 Troubleshooting

### Backend không connect được Database
```bash
# Kiểm tra DB_HOST trong Backend/.env
cat Backend/.env | grep DB_HOST
# Phải là: DB_HOST=database (KHÔNG phải localhost)
```

### Backend không connect được Redis
```bash
# Kiểm tra REDIS_HOST
cat Backend/.env | grep REDIS_HOST
# Phải là: REDIS_HOST=redis (KHÔNG phải 127.0.0.1)
```

### Frontend không gọi được API
```bash
# Kiểm tra nginx.conf
cat Frontend/nginx.conf | grep proxy_pass
# Phải có: proxy_pass http://backend:5000/v1/api/;
```

### Worker không chạy
```bash
# Xem logs
docker-compose logs -f worker

# Restart worker
docker-compose restart worker
```

### Port conflict
```bash
# Nếu port 80 đã bị dùng, sửa trong .env:
FRONTEND_PORT=8080

# Rebuild
docker-compose up --build -d
```

## 📊 Health Checks

### Kiểm tra tất cả containers
```bash
docker-compose ps
```

### Kiểm tra Backend API
```bash
curl http://localhost:5000/v1/api/health
```

### Kiểm tra Frontend
```bash
curl http://localhost:80
```

### Kiểm tra Database
```bash
docker exec -it postgres_db psql -U postgres -d chat_ai_assistant -c "SELECT version();"
```

### Kiểm tra Redis
```bash
docker exec -it redis redis-cli ping
# Response: PONG
```

## 🔐 Security Notes

⚠️ **PRODUCTION DEPLOYMENT**:

1. **Thay đổi secrets trong `.env`**:
   - `DB_PASSWORD`
   - `ACCESS_TOKEN_SECRET`
   - `REFRESH_TOKEN_SECRET`
   - `OPENAI_API_KEY`

2. **Không expose ports không cần thiết**:
   ```yaml
   # Xóa port mapping cho database và redis trong production
   # ports:
   #   - "${DB_PORT}:5432"
   ```

3. **Sử dụng Docker secrets**:
   ```yaml
   secrets:
     - db_password
     - api_keys
   ```

4. **Enable SSL/TLS cho Nginx**:
   - Thêm SSL certificate vào `Frontend/nginx.conf`
   - Redirect HTTP → HTTPS

## 📝 Maintenance

### Backup Database
```bash
docker exec postgres_db pg_dump -U postgres chat_ai_assistant > backup.sql
```

### Restore Database
```bash
cat backup.sql | docker exec -i postgres_db psql -U postgres -d chat_ai_assistant
```

### Clear Redis cache
```bash
docker exec -it redis redis-cli FLUSHALL
```

### Rebuild một service
```bash
# Backend only
docker-compose up --build backend -d

# Frontend only
docker-compose up --build frontend -d
```

## 🎯 Production Checklist

- [ ] Thay đổi tất cả secrets trong `.env`
- [ ] Set `NODE_ENV=production` trong `.env`
- [ ] Remove port mapping cho database và redis
- [ ] Enable Nginx SSL/TLS
- [ ] Configure backup strategy cho PostgreSQL
- [ ] Setup monitoring (Prometheus/Grafana)
- [ ] Configure log rotation
- [ ] Setup health check endpoints
- [ ] Test failover scenarios
- [ ] Document disaster recovery plan

---

**Last Updated**: November 19, 2025
