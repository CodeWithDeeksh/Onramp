# Deployment Guide

This guide covers different deployment strategies for the Onramp application.

## Table of Contents

1. [Development Setup](#development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Environment Variables](#environment-variables)

## Development Setup

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- GitHub Personal Access Token
- OpenAI or Anthropic API Key

### Steps

1. **Start infrastructure services**:
   ```bash
   docker-compose up -d
   ```
   This starts PostgreSQL and Redis only.

2. **Set up backend**:
   ```bash
   cd packages/backend
   cp .env.example .env
   # Edit .env with your API keys
   npx prisma migrate dev
   npm run dev
   ```

3. **Set up frontend**:
   ```bash
   cd packages/frontend
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Docker Deployment

### Full Stack with Docker Compose

1. **Create environment file**:
   ```bash
   cp packages/backend/.env.example .env
   ```

2. **Edit .env with your credentials**:
   ```env
   GITHUB_TOKEN=your_github_token
   OPENAI_API_KEY=your_openai_key
   LLM_PROVIDER=openai
   ```

3. **Start all services**:
   ```bash
   docker-compose --profile fullstack up -d
   ```

   This starts:
   - PostgreSQL (port 5432)
   - Redis (port 6379)
   - Backend API (port 5000)
   - Frontend (port 3000)

4. **Run database migrations**:
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api
   - Health check: http://localhost:5000/api/health

### Infrastructure Only

To run only PostgreSQL and Redis (for local development):

```bash
docker-compose up -d
```

This is the default profile and doesn't start backend/frontend containers.

### Building Images

Build backend image:
```bash
docker build -f packages/backend/Dockerfile -t onramp-backend .
```

Build frontend image:
```bash
docker build -f packages/frontend/Dockerfile -t onramp-frontend .
```

## Production Deployment

### Backend Deployment

#### Option 1: Node.js Server

1. **Build the application**:
   ```bash
   cd packages/backend
   npm ci --omit=dev
   npm run build
   ```

2. **Set environment variables**:
   ```bash
   export NODE_ENV=production
   export PORT=5000
   export DATABASE_URL=postgresql://user:pass@host:5432/onramp
   export REDIS_URL=redis://host:6379
   export GITHUB_TOKEN=your_token
   export OPENAI_API_KEY=your_key
   ```

3. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

#### Option 2: Docker Container

1. **Build and push image**:
   ```bash
   docker build -f packages/backend/Dockerfile -t your-registry/onramp-backend:latest .
   docker push your-registry/onramp-backend:latest
   ```

2. **Deploy to your container platform** (AWS ECS, Google Cloud Run, etc.)

### Frontend Deployment

#### Option 1: Static Hosting (Vercel, Netlify, etc.)

1. **Build the application**:
   ```bash
   cd packages/frontend
   npm run build
   ```

2. **Configure environment**:
   - Set `VITE_API_BASE_URL` to your backend API URL

3. **Deploy the `dist` folder** to your hosting provider

#### Option 2: Docker with Nginx

1. **Build and push image**:
   ```bash
   docker build -f packages/frontend/Dockerfile -t your-registry/onramp-frontend:latest .
   docker push your-registry/onramp-frontend:latest
   ```

2. **Deploy to your container platform**

### Database Setup

#### PostgreSQL

For production, use a managed PostgreSQL service:
- AWS RDS
- Google Cloud SQL
- Azure Database for PostgreSQL
- DigitalOcean Managed Databases

Connection string format:
```
postgresql://username:password@host:5432/database?sslmode=require
```

#### Redis

For production, use a managed Redis service:
- AWS ElastiCache
- Google Cloud Memorystore
- Azure Cache for Redis
- Redis Cloud

Connection string format:
```
redis://host:6379
```

Or with authentication:
```
redis://:password@host:6379
```

## Environment Variables

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection | `redis://host:6379` |
| `GITHUB_TOKEN` | GitHub API token | `ghp_xxxxx` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-xxxxx` |
| `CORS_ORIGIN` | Allowed origin | `https://app.example.com` |

### Frontend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `https://api.example.com/api` |

## Health Checks

### Backend
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "services": {
    "database": "connected",
    "cache": "connected"
  }
}
```

### Frontend
```bash
curl http://localhost:3000/health
```

Expected response:
```
healthy
```

## Monitoring

### Logs

Backend uses Pino for structured logging. In production:

```bash
# View logs
docker-compose logs -f backend

# Filter by level
docker-compose logs backend | grep '"level":50'  # errors only
```

### Metrics

Consider adding:
- Application Performance Monitoring (APM): New Relic, Datadog, etc.
- Error tracking: Sentry
- Uptime monitoring: Pingdom, UptimeRobot

## Scaling

### Horizontal Scaling

The backend is stateless and can be scaled horizontally:

1. **Load Balancer**: Use Nginx, HAProxy, or cloud load balancer
2. **Multiple Instances**: Run multiple backend containers
3. **Session Storage**: Redis is already used for caching

### Caching Strategy

- Repository analysis: 1 hour TTL
- Issue classification: 30 minutes TTL
- Adjust TTLs via environment variables

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set `CORS_ORIGIN` to your frontend domain
- [ ] Use strong database passwords
- [ ] Enable Redis authentication
- [ ] Rotate API keys regularly
- [ ] Enable rate limiting (configured by default)
- [ ] Use environment variables for secrets (never commit)
- [ ] Enable database SSL connections
- [ ] Set up firewall rules
- [ ] Regular security updates

## Troubleshooting

### Backend won't start

1. Check database connection:
   ```bash
   docker-compose exec backend npx prisma db pull
   ```

2. Check Redis connection:
   ```bash
   docker-compose exec redis redis-cli ping
   ```

3. Check logs:
   ```bash
   docker-compose logs backend
   ```

### Frontend can't connect to backend

1. Check `VITE_API_BASE_URL` is set correctly
2. Check CORS configuration in backend
3. Check network connectivity
4. Verify backend is running and healthy

### Database migrations fail

1. Check database connection string
2. Ensure database exists
3. Check user permissions
4. Run migrations manually:
   ```bash
   npx prisma migrate deploy --schema=packages/backend/prisma/schema.prisma
   ```

## Backup and Recovery

### Database Backup

```bash
# Backup
docker-compose exec postgres pg_dump -U onramp onramp > backup.sql

# Restore
docker-compose exec -T postgres psql -U onramp onramp < backup.sql
```

### Redis Backup

Redis persistence is enabled by default. Data is stored in the `redis_data` volume.

## Cost Optimization

- Use caching aggressively to reduce LLM API calls
- Set appropriate cache TTLs
- Monitor API usage
- Consider using cheaper LLM models for non-critical operations
- Use managed services with auto-scaling

## Support

For issues and questions, please open an issue on GitHub.
