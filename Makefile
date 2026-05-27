.PHONY: dev dev-docker install db-setup clean logs help

# ── Start all services (local, no Docker) ─────────────────────────────────────
dev:
	@echo "🚀 Starting GzoneSphere dev stack..."
	npm run dev:all

# ── Start all services with Docker (Postgres + APIs + Frontend) ───────────────
dev-docker:
	@echo "🐳 Starting with Docker..."
	docker-compose -f backend/docker-compose.yml up --build -d
	@echo "✅ Backend up. Starting frontend..."
	npm run dev:front

# ── Install all dependencies ───────────────────────────────────────────────────
install:
	@echo "📦 Installing all dependencies..."
	npm install
	cd backend/core-api && pip install -r requirements.txt --break-system-packages
	cd backend/cms-api && go mod download
	@echo "✅ All dependencies installed"

# ── Setup local PostgreSQL database and users ─────────────────────────────────
db-setup:
	@echo "🗄️  Creating PostgreSQL database and users..."
	psql -U postgres -c "CREATE USER gzs_core_user WITH PASSWORD 'Gzone123@';" 2>/dev/null || true
	psql -U postgres -c "CREATE USER gzs_cms_user  WITH PASSWORD 'Gzone123@';" 2>/dev/null || true
	psql -U postgres -c "CREATE DATABASE GzoneSphere OWNER gzs_core_user;" 2>/dev/null || true
	psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE GzoneSphere TO gzs_core_user;" 2>/dev/null || true
	psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE GzoneSphere TO gzs_cms_user;" 2>/dev/null || true
	psql -U postgres -d GzoneSphere -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";" 2>/dev/null || true
	psql -U postgres -d GzoneSphere -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";" 2>/dev/null || true
	@echo "✅ Database ready"

# ── Clean build artifacts and log files ───────────────────────────────────────
clean:
	@rm -f *.log backend/core-api/*.log backend/cms-api/*.log
	@rm -rf __pycache__ backend/core-api/__pycache__ backend/core-api/routes/__pycache__
	@rm -rf dist .vite
	@echo "🧹 Cleaned"

# ── Tail live logs for all services ───────────────────────────────────────────
logs:
	@tail -f backend/core-api/core-api.log backend/cms-api/cms-api.log 2>/dev/null || \
		echo "No log files found yet — start services first"

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo "GzoneSphere Dev Commands:"
	@echo "  make install     → Install all deps (npm + pip + go)"
	@echo "  make db-setup    → Create local Postgres DB + user"
	@echo "  make dev         → Start frontend + core API + CMS API"
	@echo "  make dev-docker  → Start everything via Docker"
	@echo "  make clean       → Remove logs and build artifacts"
	@echo "  make logs        → Tail all service logs"
	@echo ""
