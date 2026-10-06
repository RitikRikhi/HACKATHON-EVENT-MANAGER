# 💻 Local Development Setup Guide — Event OS

This guide takes a new software engineer from a clean workstation to a fully running Event OS microservices environment in under 5 minutes.

---

## 📋 Prerequisites
- **Node.js:** v20.x or v22.x LTS (`node -v`)
- **npm:** v10+ (`npm -v`)
- **Git:** 2.40+ (`git -v`)
- **Supabase Account:** Free project from [Supabase.com](https://supabase.com)

---

## ⚡ 5-Minute Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/RitikRikhi/HACKATHON-EVENT-MANAGER.git
cd HACKATHON-EVENT-MANAGER
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase credentials (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`).

### 4. Build Shared Packages & Services
```bash
npm run build
```

### 5. Apply Database Schema Migrations
```bash
npx tsx scripts/migrate-complete-event-os.ts
```

### 6. Start All Microservices Concurrently
```bash
npm run dev
```

### 7. Verify Health Checks
Open your browser or terminal:
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/system/status
```

---

## 🧪 Running Tests
```bash
# Run unit tests and typecheck
npm test

# Run full end-to-end integration test runner against running services
npm run test:e2e
```
