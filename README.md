# Onramp - AI-Powered Open Source Onboarding

Onramp is an AI-powered assistant that helps developers find and contribute to open-source projects. It analyzes repositories, matches developers with suitable projects, and provides personalized contribution guidance.

## Features

- **Repository Analysis**: Analyze GitHub repositories to understand architecture, modules, and entry points
- **Smart Matching**: Get personalized project recommendations based on your skills and interests
- **Contribution Guidance**: Receive step-by-step guidance for making your first contribution
- **Issue Classification**: Find beginner-friendly issues with AI-powered difficulty classification
- **Interactive UI**: Beautiful, animated interface with custom cursor effects and smooth transitions

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL (Prisma ORM)
- Redis (caching)
- OpenAI/Anthropic (LLM)
- Vitest + fast-check (testing)

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- GitHub Personal Access Token
- OpenAI API Key or Anthropic API Key

## Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd onramp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start infrastructure services

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis containers.

### 4. Configure environment variables

#### Backend Configuration

Copy the example file and update with your credentials:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Required environment variables:
- `GITHUB_TOKEN`: Your GitHub Personal Access Token
- `OPENAI_API_KEY`: Your OpenAI API key (or `ANTHROPIC_API_KEY` for Anthropic)
- `DATABASE_URL`: PostgreSQL connection string (default works with Docker Compose)
- `REDIS_URL`: Redis connection string (default works with Docker Compose)

#### Frontend Configuration

The frontend uses Vite's proxy in development, so no configuration is needed. For production:

```bash
cp packages/frontend/.env.example packages/frontend/.env.production
```

Update `VITE_API_BASE_URL` with your production backend URL.

### 5. Set up the database

```bash
cd packages/backend
npx prisma migrate dev
npx prisma generate
cd ../..
```

### 6. Start the development servers

#### Terminal 1 - Backend
```bash
cd packages/backend
npm run dev
```

Backend runs on http://localhost:5000

#### Terminal 2 - Frontend
```bash
cd packages/frontend
npm run dev
```

Frontend runs on http://localhost:3000

## Development

### Running Tests

#### Backend Tests
```bash
cd packages/backend
npm test
```

#### Frontend Build
```bash
cd packages/frontend
npm run build
```

### Code Quality

```bash
# Lint all packages
npm run lint

# Format code
npm run format
```

## Project Structure

```
onramp/
├── packages/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── clients/  # External service clients (GitHub, LLM, Cache)
│   │   │   ├── services/ # Business logic services
│   │   │   ├── routes/   # API route handlers
│   │   │   ├── middleware/ # Express middleware
│   │   │   ├── types/    # TypeScript types and interfaces
│   │   │   ├── validation/ # Zod schemas
│   │   │   └── utils/    # Utility functions
│   │   └── prisma/       # Database schema
│   └── frontend/         # React application
│       └── src/
│           ├── components/ # React components
│           ├── pages/     # Page components
│           ├── services/  # API client services
│           ├── context/   # React Context providers
│           └── types/     # TypeScript types
├── docker-compose.yml    # Infrastructure services
└── package.json          # Workspace configuration
```

## API Endpoints

### Repository Analysis
- `POST /api/repositories/analyze` - Analyze a GitHub repository
- `GET /api/repositories/:owner/:repo` - Get cached repository analysis

### User Profile
- `POST /api/users/profile` - Create/update user profile
- `GET /api/users/:userId/profile` - Get user profile

### Recommendations
- `POST /api/recommendations` - Get project recommendations

### Contribution Guidance
- `POST /api/guidance` - Get contribution path for a repository

### Issues
- `GET /api/issues/:owner/:repo` - Get classified issues for a repository

### Health
- `GET /api/health` - Health check endpoint

## Environment Variables Reference

### Backend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Server port | No | 5000 |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | Yes | - |
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `LLM_PROVIDER` | LLM provider (openai/anthropic) | No | openai |
| `OPENAI_API_KEY` | OpenAI API key | Conditional | - |
| `ANTHROPIC_API_KEY` | Anthropic API key | Conditional | - |
| `CORS_ORIGIN` | Allowed CORS origin | No | * |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | No | 900000 |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No | 100 |
| `CACHE_TTL_REPOSITORY_ANALYSIS` | Cache TTL for repository analysis (seconds) | No | 3600 |
| `CACHE_TTL_ISSUE_CLASSIFICATION` | Cache TTL for issue classification (seconds) | No | 1800 |

### Frontend

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL | No | /api (proxied) |

## Deployment

### Production Build

#### Backend
```bash
cd packages/backend
npm run build
npm start
```

#### Frontend
```bash
cd packages/frontend
npm run build
```

The built files will be in `packages/frontend/dist/` and can be served by any static file server.

### Docker Deployment

See Task 21.3 for Docker configurations (coming soon).

## Testing

The project uses Vitest for unit testing and fast-check for property-based testing.

### Backend Tests
- 108 tests covering all services, clients, middleware, and validation
- Property-based tests for critical correctness properties
- Run with `npm test` in the backend package

### Frontend
- Component rendering verified through build process
- End-to-end testing can be added with Playwright or Cypress

## Contributing

This is a hackathon MVP project. Contributions are welcome!

## License

MIT
