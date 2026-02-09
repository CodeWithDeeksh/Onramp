# Onramp - AI-Powered Open Source Onboarding Assistant

**Onramp** is an intelligent onboarding assistant that helps developers discover, understand, and contribute to open-source projects. Built for hackathons and real-world use, it combines real GitHub data with AI-powered analysis to provide personalized guidance.

## 🎯 Problem Statement

New developers face significant barriers when trying to contribute to open-source:
- **Overwhelming codebases** - Hard to understand large, unfamiliar projects
- **Finding the right project** - Difficult to match skills with suitable repositories
- **Getting started** - No clear path from interest to first contribution
- **Issue selection** - Hard to identify beginner-friendly tasks

## 💡 Solution

Onramp provides an AI-powered onboarding experience that:
1. **Analyzes repositories** - Understands architecture, modules, and complexity
2. **Matches developers** - Recommends projects based on skills and interests
3. **Guides contributions** - Provides step-by-step onboarding paths
4. **Classifies issues** - Identifies beginner-friendly contribution opportunities

## ✨ Key Features

### 🔍 Repository Analysis
- **Real GitHub Integration** - Fetches actual repository data (stars, structure, README)
- **Intelligent Analysis** - Analyzes architecture patterns, modules, and technologies
- **Entry Points** - Identifies best files to start exploring
- **Detailed Insights** - Shows file lists, complexity levels, and module purposes

### 🎯 Smart Matching
- **Profile-Based** - Matches based on languages, frameworks, and experience level
- **Guest Mode** - Works without signup for instant access
- **Personalized Scores** - Calculates match scores across multiple dimensions
- **Curated Recommendations** - Suggests React, VS Code, Next.js, and more

### 🗺️ Contribution Guidance
- **4-Step Onboarding Path** - From documentation to first contribution
- **Personalized Difficulty** - Adjusts based on experience level
- **Resource Links** - Direct links to README, issues, and documentation
- **Progress Tracking** - Mark steps as complete

### 🎨 Beautiful UI/UX
- **Modern Design** - Clean, professional interface with smooth animations
- **Welcome Modal** - Sign in, sign up, or continue as guest
- **Responsive** - Works on desktop and mobile
- **Fast & Smooth** - Optimized performance, no lag

### 🛡️ Robust Architecture
- **Graceful Fallbacks** - Works without API keys (demo mode)
- **Error Handling** - Comprehensive try-catch blocks throughout
- **Caching** - Redis caching for performance
- **Type Safety** - Full TypeScript coverage

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

**Note**: If you don't have Docker installed, the app will run in **Demo Mode** with sample data. See the Demo Mode section below for details.

### 4. Configure environment variables

#### Backend Configuration

Copy the example file and update with your credentials:

```bash
cp packages/backend/.env.example packages/backend/.env
```

**For Demo Mode** (no API keys needed):
- The app will work with sample data
- You'll see "⚠️ Demo Mode" warnings in the analysis
- Perfect for testing the UI and flow

**For Full Functionality** (requires API keys):
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

## Demo Mode

Onramp includes a **Demo Mode** that allows you to test the application without setting up API keys or external services. This is perfect for hackathons, quick demos, or exploring the UI.

### What Works in Demo Mode

✅ **Full UI Experience**: All pages and components work normally  
✅ **Sample Data**: Repository analysis returns realistic mock data  
✅ **No Setup Required**: Just run `npm run dev` in both packages  
✅ **Clear Indicators**: Demo data is marked with "⚠️ Demo Mode" warnings

### What's Limited in Demo Mode

⚠️ **GitHub Data**: Shows sample repository structure instead of real data  
⚠️ **AI Analysis**: Returns basic analysis instead of AI-powered insights  
⚠️ **Database**: Requires PostgreSQL/Redis for persistence (optional)

### Enabling Full Functionality

To get real GitHub data and AI-powered analysis:

1. **Get API Keys**:
   - GitHub Token: https://github.com/settings/tokens (select `repo` scope)
   - OpenAI Key: https://platform.openai.com/api-keys

2. **Update `.env`**:
   ```env
   GITHUB_TOKEN=ghp_your_token_here
   OPENAI_API_KEY=sk-your_key_here
   ```

3. **Restart Backend**:
   ```bash
   cd packages/backend
   npm run dev
   ```

The app will automatically detect valid API keys and switch to full functionality!

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
