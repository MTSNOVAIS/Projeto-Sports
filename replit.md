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
- **Data Sources**: RSS feeds + mock data fallback

## Color Palette

- Primary: #DB0037 (crimson red)
- Dark Primary: #610018 (maroon)
- Bright Accent: #FF0040 
- Dark Backgrounds: #0D0D0D, #111111, #1A1A1A
- Card Backgrounds: #161616, #1C1C1C

## Features

### Public Site
- **Homepage**: Breaking news ticker, hero featured article, latest news grid, trending sidebar, team shortcuts bar
- **Article page** (/noticias/:slug): Full article with reading time, view count, share buttons, source attribution (with link to original source)
- **Teams list** (/times): Grid of all 20 La Liga clubs
- **Team page** (/times/:slug): Team profile with crest, info, recent articles
- **Category pages** (/categoria/:category): Articles filtered by category
- **Search** (/busca): Real-time article search

### Dashboard (/dashboard)
- **Overview**: Stats (total articles, published, drafts, scheduled, total views), recent articles table
- **Articles** (/dashboard/artigos): Full CRUD with filters by status, category, team, source
- **Article Editor** (/dashboard/artigos/novo|/:id/editar): Rich editor with custom datetime picker for scheduling
- **Import** (/dashboard/importar): 
  - RSS feed support for real-time data from Marca, AS, BBC Sport, ESPN, Sport, Mundo Deportivo
  - Real data status indicators (shows if articles are from live feeds or demo data)
  - AI-powered automatic translation from Spanish/English to Brazilian Portuguese
  - Direct link to view original article
  - One-click import to drafts for editorial review
- **Teams** (/dashboard/times): Edit all 20 La Liga team profiles, logos, colors, descriptions
- **Users** (/dashboard/usuarios): Manage admin users with role assignment
- **Roles** (/dashboard/cargos): Manage user roles with 17 granular permissions

### AI Features
- AI-powered article translation from Spanish/English to Brazilian Portuguese
- Cultural adaptation of football terminology
- Server-side translation optimization (no double-translation)
- Attribution footer with link to original source

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
├── db/src/schema/        # teams.ts, articles.ts, users.ts
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
- `GET /api/admin/users` - List admin users
- `POST/PUT/DELETE /api/admin/users/:id` - User management
- `GET /api/admin/roles` - List available roles
- `POST/PUT/DELETE /api/admin/roles/:id` - Role management
- `GET /api/scraper/sources` - List news sources (RSS feed-based)
- `POST /api/scraper/fetch` - Fetch articles from RSS feeds with AI translation
- `POST /api/scraper/translate` - Translate individual article

## Database Tables

- `teams` - 20 La Liga clubs (name, slug, city, stadium, colors, logo, description)
- `articles` - News articles (title, slug, content, status, featured, breaking_news, category, team_id, source attribution, scheduled publishing)
- `users` - Admin users (email, password, name, role, active status)
- `roles` - User roles with granular permissions (17 permission types)

## All Times in Brasília Timezone (BRT/UTC-3)

Articles are stored with UTC timestamps and displayed in Brasília time.

## Recent Improvements (Import System)

### Real Data Sources
- Added RSS feed support for 7 major sports news sources:
  - Marca (ES) - Real Madrid & Spanish football
  - AS (ES) - Spanish sports
  - BBC Sport (EN) - International coverage
  - ESPN (EN) - Global sports news
  - Sport (ES) - Barcelona focus
  - Mundo Deportivo (ES) - Barcelona/Catalan football
  - The Athletic (EN) - Premium sports analysis
- Automatic fallback to demo data when feeds are unavailable
- Real data status indicators in the UI

### Optimized Import Flow
- Server-side RSS parsing and translation (no double processing)
- Faster import workflow - articles already translated on fetch
- Better error handling and fallback mechanisms
- Direct links to original articles for fact-checking

### Enhanced Article Display
- Improved source attribution with visual badges
- Link to read original article in source publication
- Source name displayed in article header
- Better editorial note explaining translation

### User Management
- Admin user creation, editing, and deletion
- Role-based access control (RBAC)
- 17 granular permissions for fine-grained access control
- User status management (active/inactive)

### Permission System
- View Dashboard
- Manage/Create/Edit/Delete/Publish Articles
- Manage/Create/Edit/Delete Teams
- Manage/Create/Edit/Delete Users
- Manage Roles
- Import Articles
- View Statistics
