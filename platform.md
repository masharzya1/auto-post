# AI Content Automator

## Overview

This is an AI-powered content automation platform designed for non-technical users. The application enables automated content generation (text, images, and videos) for social media platforms like Facebook and YouTube Shorts. Users can configure automation settings, manage workflows with cron-based scheduling, and generate AI-powered content even when the browser is closed.

The system follows a client-heavy architecture with React (Vite) on the frontend, Express.js on the backend, and PostgreSQL with Drizzle ORM for data persistence. Firebase Authentication handles user login via Google OAuth.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with Vite for fast development and HMR
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Authentication**: Firebase Auth with Google sign-in (redirect flow)

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all database table definitions
- **API Pattern**: RESTful endpoints defined in `server/routes.ts`
- **Storage Layer**: `server/storage.ts` provides a DatabaseStorage class implementing IStorage interface

### AI Integrations
- **Chat**: OpenAI-compatible chat completions via Platform AI Integrations (`server/ai_integrations/chat/`)
- **Image Generation**: GPT-image-1 model for image creation (`server/ai_integrations/image/`)
- **Batch Processing**: Rate-limited batch utilities for bulk AI operations (`server/ai_integrations/batch/`)

### Data Model
The application uses four main database tables:
1. **settings**: Platform configuration (FB/YT IDs, niche, posting frequency, AI model selections, API keys)
2. **limits**: AI usage quotas (text/image/video limits and current usage)
3. **workflows**: Automation definitions with cron schedules and enabled/disabled status
4. **content**: Generated content items with type, status, and platform metadata

### Build System
- **Development**: tsx for running TypeScript directly
- **Production Build**: esbuild for server bundling, Vite for client bundling
- **Output**: `dist/` directory with `index.cjs` for server and `public/` for static assets

### Path Aliases
- `@/` maps to `client/src/`
- `@shared/` maps to `shared/`
- `@assets/` maps to `attached_assets/`

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries with schema defined in `shared/schema.ts`
- **drizzle-kit**: Database migrations via `npm run db:push`

### Authentication
- **Firebase Auth**: Google OAuth authentication
- Environment variables required:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`

### AI Services
- **Platform AI Integrations**: OpenAI-compatible API for chat and image generation
- Environment variables:
  - `AI_INTEGRATIONS_OPENAI_API_KEY`
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Scheduling
- **node-cron**: Server-side cron job scheduling for automated workflows

### Third-Party UI Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **embla-carousel-react**: Carousel/slider functionality
- **react-day-picker**: Date picker component
- **vaul**: Drawer component
- **cmdk**: Command palette component