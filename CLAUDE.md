# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lightweight online survey system that uses SurveyJS and Large Language Models (LLMs) to create questionnaires through natural language prompts. The system features a modern React 19 frontend with Shadcn UI and comprehensive OAuth authentication. It's designed for zero-cost deployment using Cloudflare's ecosystem (Pages, Workers, D1).

## Architecture

The system follows a frontend + Serverless backend architecture:

1. **Frontend**: React 19 SPA hosted on Cloudflare Pages
   - **AuthContext**: Global authentication state management
   - Survey Creator: For creating/editing surveys with AI generation
   - Survey Runner: For displaying and running surveys
   - Results Viewer: For viewing survey results with Frappe Charts visualization
   - Dashboard: User management interface for "My Surveys" functionality

2. **Backend**: Cloudflare Workers
   - API endpoints for survey generation, storage, and retrieval
   - LLM integration for natural language to survey conversion
   - OAuth authentication (GitHub, Google, Microsoft)
   - Database interactions with Cloudflare D1
   - JWT session management with HttpOnly cookies

3. **Database**: Cloudflare D1 (SQLite compatible)
   - `surveys` table: Stores survey definitions with user ownership
   - `results` table: Stores survey responses

## Key Technologies

- **Frontend**: React 19 with SurveyJS (`survey-react-ui`, `survey-creator-react`)
- **UI Framework**: Shadcn UI components with Tailwind CSS
- **Charts**: Frappe Charts for data visualization
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQL)
- **AI Models**: OpenAI GPT / Google Gemini / Anthropic Claude (via API) with OpenAI-compatible API support
- **Authentication**: OAuth 2.0 (GitHub, Google, Microsoft) with JWT
- **Build Tool**: Vite 7
- **Deployment**: Cloudflare Pages

## Common Development Tasks

### Working with SurveyJS
- Survey definitions are stored as JSON objects following the SurveyJS schema
- Use `survey-react-ui` for rendering surveys in the frontend
- Use `survey-creator-react` for editing survey definitions
- Surveys are automatically saved to database with user ownership when generated via AI

### Authentication and User Management
- AuthContext provides global authentication state management
- OAuth 2.0 integration with GitHub, Google, and Microsoft
- JWT tokens stored in HttpOnly cookies for security
- User ID format: `{provider}:{provider_user_id}` (e.g., `github:12345678`)
- Survey ownership and permission control based on user ID

### AI Integration
- Natural language to survey conversion is handled by LLMs
- Supports multiple LLM providers through OpenAI-compatible API
- Prompt engineering is critical for generating valid SurveyJS JSON
- The system uses a system prompt to ensure consistent output format
- AI-generated surveys are automatically associated with the authenticated user

### Database Operations
- Surveys and results are stored in Cloudflare D1
- JSON data is stored as TEXT in the database and parsed/stringified as needed
- Use D1's SQL interface for queries and data manipulation
- `owner_id` field tracks survey ownership for permission control
- User-specific survey listing with pagination support

### Cloudflare Integration
- Frontend is deployed via Cloudflare Pages
- Backend APIs run on Cloudflare Workers
- Database operations use Cloudflare D1 bindings
- Environment variables configured through wrangler.toml and secrets

## Security Considerations

- LLM API keys must be stored as Cloudflare Worker secrets
- All input validation should happen on the backend
- Implement rate limiting for LLM API calls
- Configure proper CORS policies for API endpoints
- OAuth state validation for CSRF protection
- JWT token expiration and refresh handling
- User permission validation for survey ownership
- HttpOnly cookies for session security

## Deployment

1. Configure environment variables in wrangler.toml for database binding
2. Frontend: Deploy React app to Cloudflare Pages
3. Backend: Deploy Worker with `wrangler deploy`
4. Database: Create D1 database with `wrangler d1 create`
5. Secrets: Set API keys with `wrangler secret put`
6. OAuth: Configure callback URLs for production environment

## Future Extensions

- Advanced analytics and data visualization
- Survey template marketplace
- Webhook integrations
- R2 storage for high-volume scenarios
- Mobile app development
- Team collaboration features
- Advanced permission management
- Multi-language support