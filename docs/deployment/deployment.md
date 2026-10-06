# 🚀 Deployment Guide — Event OS

Event OS is containerized using Docker and Docker Compose for deployment on virtual machines (AWS EC2, DigitalOcean Droplets, Hetzner) or container orchestrators (AWS ECS, Kubernetes, Render, Railway).

---

## 🐳 1. Docker Compose Deployment (Recommended)

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+
- A hosted Supabase PostgreSQL instance

### Step-by-Step Production Launch
1. **Clone the repository on the target server:**
   ```bash
   git clone https://github.com/RitikRikhi/HACKATHON-EVENT-MANAGER.git /opt/event-os
   cd /opt/event-os
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Set `NODE_ENV=production`, your `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `DATABASE_URL`.*

3. **Apply Database Migrations:**
   ```bash
   npm ci
   npx tsx scripts/migrate-complete-event-os.ts
   ```

4. **Build and start all 8 containers in the background:**
   ```bash
   docker-compose up --build -d
   ```

5. **Verify Running Containers:**
   ```bash
   docker-compose ps
   ```

6. **Check Gateway Health:**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8000/api/system/status
   ```

---

## 🌐 2. Reverse Proxy & SSL (Nginx / Cloudflare)

Map incoming domain traffic (e.g. `api.eventos.yourdomain.com`) to the API Gateway port `8000`:

```nginx
server {
    server_name api.eventos.yourdomain.com;

    client_max_body_size 30M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## 🔐 3. Required GitHub Secrets for CI/CD

When configuring continuous deployment via `.github/workflows/deploy.yml`:
- `DOCKER_USERNAME`: Docker Hub / Container Registry username
- `DOCKER_PASSWORD`: Docker Hub / Container Registry personal access token
- `SUPABASE_URL`: Supabase project API URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
