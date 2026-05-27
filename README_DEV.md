# GzoneSphere Local Development Guide

Welcome to the GzoneSphere development environment. This guide will help you get the entire stack running locally.

## 1. Prerequisites
- **Node.js**: 18.x or higher
- **Docker Desktop**: Required for the backend services and database
- **Go**: 1.21.x (if running CMS API natively)
- **Python**: 3.12.x (if running Core API natively)

## 2. Quick Start
Run the following commands to start the entire stack:

```bash
# 1. Start backend services (PostgreSQL, FastAPI, Golang CMS)
cd backend
docker compose up -d

# 2. Install frontend dependencies
cd ..
npm install

# 3. Start frontend dev server
npm run dev
```

## 3. Service URLs
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **FastAPI Core**: [http://localhost:8000](http://localhost:8000) (Swagger docs at [/docs](http://localhost:8000/docs))
- **Golang CMS**: [http://localhost:8080](http://localhost:8080) (Health check at [/health](http://localhost:8080/health))
- **PostgreSQL**: `localhost:5432` (User: `gzone_user`, DB: `gzonesphere`)

## 4. Authentication
By default, the frontend runs in **Dummy Mode** using mock data. To test real authentication:

1. Create/Update `.env.local` in the project root:
   ```env
   VITE_REAL_AUTH=true
   VITE_CORE_API_URL=http://localhost:8000
   VITE_CMS_API_URL=http://localhost:8080/api/cms
   ```
2. Use the default dev credentials:
   - **Admin**: `admin@gzonesphere.com` / `Admin@123456`
   - **User**: `user@gzonesphere.com` / `User@123456`

## 5. Useful Commands
- **View Logs**: `docker compose logs -f [service_name]` (e.g., `core-api`)
- **Reset Database**: `docker compose down -v && docker compose up -d`
- **Rebuild Containers**: `docker compose up --build -d`
- **Run Python Command**: `docker compose exec core-api python [command]`

## 6. Project Structure
- `/src`: React Frontend
- `/backend/core-api`: FastAPI (Python) - Auth, Profiles, Core Logic
- `/backend/cms-api`: Golang - Games, Blogs, Content Management
- `/backend/init-db.sql`: Database initialization and seed data

## 7. Environment Variables
### Core API (FastAPI)
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Used for JWT signing
- `ENV`: `development` or `production`

### CMS API (Golang)
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Must match Core API secret for admin verification
- `PORT`: Server port (default 8080)
