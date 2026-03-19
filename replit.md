# La Liga Brasil

## Overview

A full-stack Brazilian news site about Spanish football (La Liga). Built with React + Vite frontend, Express API backend, PostgreSQL database, and OpenAI AI integration for translating international articles.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/laliga-brasil)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (for article translation)
- **Routing**: Wouter
- **Styling**: Tailwind CSS with custom crimson color palette

## Color Palette

- Primary: #DB0037 (crimson red)
- Dark Primary: #610018 (maroon)
- Bright Accent: #FF0040 
- Dark Backgrounds: #0D0D0D, #111111, #1A1A1A
- Card Backgrounds: #161616, #1C1C1C

## Features

### Public Site
- **Homepage**: Breaking news ticker, hero featured article, latest news grid, trending sidebar, team shortcuts bar
- **Article page** (/noticias/:slug): Full article with reading time, view count, share buttons, source attribution
- **Teams list** (/times): Grid of all 20 La Liga clubs
- **Team page** (/times/:slug): Team profile with crest, info, recent articles
- **Category pages** (/categoria/:category): Articles filtered by category
- **Search** (/busca): Real-time article search

### Dashboard (/dashboard)
- **Overview**: Stats (total articles, published, drafts, scheduled, total views), recent articles table
- **Articles** (/dashboard/artigos): Full CRUD with filters by status, category, team, source
- **Article Editor** (/dashboard/artigos/novo|/:id/editar): Rich editor with custom datetime picker for scheduling
- **Import** (/dashboard/importar): Import from Marca, AS, The Athletic, Sport, Mundo Deportivo with AI translation to PT-BR
- **Teams** (/dashboard/times): Edit all 20 La Liga team profiles, logos, colors, descriptions

### AI Features
- AI-powered article translation from Spanish/English to Brazilian Portuguese
- Cultural adaptation of football terminology
- Attribution footer on imported articles

## Structure

```text
artifacts/
├── api-server/           # Express 5 API server
│   └── src/routes/       # articles.ts, teams.ts, categories.ts, stats.ts, scraper.ts
└── laliga-brasil/        # React + Vite frontend
    └── src/
        ├── pages/        # home, article, team, teams-list, category, search, admin/*
        ├── components/   # ArticleCard, Navbar, Footer, CustomDateTimePicker
        └── hooks/        # use-articles, use-teams, use-system
lib/
├── db/src/schema/        # teams.ts, articles.ts
├── api-spec/             # openapi.yaml (source of truth)
├── api-client-react/     # Generated React Query hooks
└── api-zod/              # Generated Zod schemas
```

## API Endpoints

- `GET /api/articles` - Public articles (paginated, filtered)
- `GET /api/articles/:slug` - Single article (increments view count)
- `GET /api/teams` - All 20 La Liga teams
- `GET /api/teams/:slug` - Team with recent articles
- `GET /api/categories` - Categories with article counts
- `GET /api/stats` - Site statistics
- `GET/POST /api/admin/articles` - Admin article management
- `PUT/DELETE /api/admin/articles/:id` - Update/delete article
- `POST /api/admin/articles/:id/publish` - Publish immediately
- `POST /api/admin/articles/:id/schedule` - Schedule with custom datetime
- `GET/POST /api/admin/teams` - Admin team management
- `PUT /api/admin/teams/:id` - Update team
- `GET /api/scraper/sources` - List news sources
- `POST /api/scraper/fetch` - Fetch and AI-translate articles from source
- `POST /api/scraper/translate` - Translate individual article

## Database Tables

- `teams` - 20 La Liga clubs (name, slug, city, stadium, colors, logo, description)
- `articles` - News articles (title, slug, content, status, featured, breaking_news, category, team_id, source attribution, scheduled publishing)

## All Times in Brasília Timezone (BRT/UTC-3)

Articles are stored with UTC timestamps and displayed in Brasília time.
