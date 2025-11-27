# ==========================================
# Makefile for PakkuNeko Tracking System
# Docker Production Commands
# ==========================================

.PHONY: help build up down restart logs ps clean dev prod migrate shell

# Default target
help:
	@echo "PakkuNeko Tracking System - Docker Commands"
	@echo "============================================"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment (DB only)"
	@echo "  make dev-down     - Stop development environment"
	@echo ""
	@echo "Production:"
	@echo "  make build        - Build production images"
	@echo "  make up           - Start production containers"
	@echo "  make down         - Stop production containers"
	@echo "  make restart      - Restart production containers"
	@echo "  make rebuild      - Rebuild and restart production"
	@echo ""
	@echo "Utilities:"
	@echo "  make logs         - Show all container logs"
	@echo "  make logs-backend - Show backend logs"
	@echo "  make logs-frontend- Show frontend logs"
	@echo "  make ps           - Show container status"
	@echo "  make clean        - Remove all containers and volumes"
	@echo "  make shell-backend- Open shell in backend container"
	@echo "  make migrate      - Run database migrations"
	@echo ""
	@echo "Admin Tools:"
	@echo "  make admin        - Start with pgAdmin"
	@echo "  make admin-down   - Stop pgAdmin"

# ==========================================
# Development Commands
# ==========================================

dev:
	docker compose up -d
	@echo "Development database started!"
	@echo "PostgreSQL: localhost:5434"
	@echo "pgAdmin: http://localhost:5050"

dev-down:
	docker compose down

# ==========================================
# Production Commands
# ==========================================

build:
	docker compose -f docker-compose.prod.yml build

up:
	docker compose -f docker-compose.prod.yml up -d
	@echo ""
	@echo "PakkuNeko Tracking System is starting..."
	@echo "Frontend: http://localhost:$${FRONTEND_PORT:-80}"
	@echo ""
	@echo "Run 'make logs' to view logs"

down:
	docker compose -f docker-compose.prod.yml down

restart:
	docker compose -f docker-compose.prod.yml restart

rebuild:
	docker compose -f docker-compose.prod.yml up -d --build

# ==========================================
# Utility Commands
# ==========================================

logs:
	docker compose -f docker-compose.prod.yml logs -f

logs-backend:
	docker compose -f docker-compose.prod.yml logs -f backend

logs-frontend:
	docker compose -f docker-compose.prod.yml logs -f frontend

ps:
	docker compose -f docker-compose.prod.yml ps

clean:
	@echo "WARNING: This will remove all containers, volumes, and images!"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	docker compose -f docker-compose.prod.yml down -v --rmi local
	@echo "Cleaned up!"

shell-backend:
	docker compose -f docker-compose.prod.yml exec backend sh

shell-postgres:
	docker compose -f docker-compose.prod.yml exec postgres psql -U $${DB_USER:-trackinguser} -d $${DB_NAME:-tracking_system}

migrate:
	docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# ==========================================
# Admin Tools
# ==========================================

admin:
	docker compose -f docker-compose.prod.yml --profile admin up -d
	@echo ""
	@echo "pgAdmin: http://localhost:$${PGADMIN_PORT:-5050}"

admin-down:
	docker compose -f docker-compose.prod.yml --profile admin down

# ==========================================
# Quick Start
# ==========================================

quick-start: build up
	@echo ""
	@echo "=========================================="
	@echo "PakkuNeko Tracking System is ready!"
	@echo "=========================================="
	@echo "Frontend: http://localhost:$${FRONTEND_PORT:-80}"
	@echo ""
	@echo "Default Admin Login:"
	@echo "  Email: admin@example.com"
	@echo "  Password: admin123"
	@echo ""
	@echo "Run 'make logs' to view logs"
