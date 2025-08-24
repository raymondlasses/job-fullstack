# Web Crawler & Command Runner (Next.js + MUI + FastAPI + Celery + MongoDB + Docker)

This project provides:
- A Next.js + MUI frontend
- A FastAPI backend
- Celery workers with RabbitMQ for async jobs
- MongoDB for storing results
- Dockerized setup with `docker-compose`

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/yourproject.git
cd yourproject
```

### 2. Start services
```bash
docker compose up --build
```
Use --build the first time to build images.

Later runs can be started faster with:
```bash
docker compose up -d
```

### 3. Access the app
http://localhost:3000 in your browser
