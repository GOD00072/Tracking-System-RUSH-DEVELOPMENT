# Database Setup Guide - PostgreSQL with Docker

## 🐳 Quick Start

### 1. Start PostgreSQL Database
```bash
# Start PostgreSQL + pgAdmin
docker-compose up -d

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f postgres
```

### 2. Generate Prisma Client
```bash
cd backend
npm run db:generate
```

### 3. Run Database Migrations
```bash
# Development
npm run db:migrate

# Or push schema directly (faster for development)
npm run db:push
```

### 4. (Optional) Seed Database
```bash
npm run db:seed
```

---

## 📊 Database Access

### PostgreSQL Connection
- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `tracking_system`
- **Username**: `trackinguser`
- **Password**: `trackingpass123`
- **Connection String**:
  ```
  postgresql://trackinguser:trackingpass123@localhost:5432/tracking_system
  ```

### pgAdmin Web UI
- **URL**: http://localhost:5050
- **Email**: admin@tracking.local
- **Password**: admin123

After login, add a new server:
- **Host**: `postgres` (container name)
- **Port**: `5432`
- **Username**: `trackinguser`
- **Password**: `trackingpass123`

---

## 🛠️ Available Commands

### Docker Commands
```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# View logs
docker-compose logs -f postgres

# Restart containers
docker-compose restart

# Check container status
docker-compose ps
```

### Prisma Commands
```bash
cd backend

# Generate Prisma Client
npm run db:generate

# Create migration (development)
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:prod

# Push schema without migration (quick dev)
npm run db:push

# Open Prisma Studio (GUI)
npm run db:studio

# Seed database
npm run db:seed
```

---

## 📝 Prisma Studio

Visual database editor:
```bash
cd backend
npm run db:studio
```
Opens at: http://localhost:5555

---

## 🔧 Database Schema

The database includes these tables:
- **users** - User accounts and authentication
- **customers** - Customer information
- **orders** - Customer orders
- **shipments** - Shipment tracking
- **tracking_history** - Status updates
- **schedules** - Ship/flight schedules
- **reviews** - Customer reviews
- **portfolio_items** - Portfolio showcase
- **rate_calculator** - Shipping rates
- **notifications** - Notification logs
- **contact_messages** - Contact form submissions
- **statistics** - System statistics

See `backend/prisma/schema.prisma` for full schema.

---

## 🐛 Troubleshooting

### Port 5432 already in use
```bash
# Check what's using port 5432
sudo lsof -i :5432

# If it's a local PostgreSQL, stop it
sudo systemctl stop postgresql

# Or change the port in docker-compose.yml:
# ports:
#   - "5433:5432"
# Then update DATABASE_URL in .env to use port 5433
```

### Cannot connect to database
```bash
# Check if containers are running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart containers
docker-compose restart
```

### Reset database
```bash
# ⚠️ This will delete ALL data
docker-compose down -v
docker-compose up -d
cd backend
npm run db:push
npm run db:seed
```

### View database directly
```bash
# Connect with psql
docker exec -it tracking-system-postgres psql -U trackinguser -d tracking_system

# List tables
\dt

# View table schema
\d users

# Exit
\q
```

---

## 🚀 Production Deployment

### Using Environment Variables
```bash
# Set DATABASE_URL in production
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# Run migrations
npm run db:migrate:prod
```

### Using Docker in Production
```yaml
# docker-compose.prod.yml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}  # Use secrets
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always
```

---

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

---

**Last Updated**: November 4, 2025
