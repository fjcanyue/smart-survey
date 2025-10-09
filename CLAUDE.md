# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a lightweight online survey system that uses SurveyJS and Large Language Models (LLMs) to create questionnaires through natural language prompts. The system is designed for zero-cost deployment using Cloudflare's ecosystem (Pages, Workers, D1/R2).

## Architecture

The system follows a frontend + Serverless backend architecture:

1. **Frontend**: React SPA hosted on Cloudflare Pages
   - Survey Creator: For creating/editing surveys
   - Survey Runner: For displaying and running surveys
   - Results Viewer: For viewing survey results

2. **Backend**: Cloudflare Workers
   - API endpoints for survey generation, storage, and retrieval
   - LLM integration for natural language to survey conversion
   - Database interactions with Cloudflare D1

3. **Database**: Cloudflare D1 (SQLite compatible)
   - `surveys` table: Stores survey definitions
   - `results` table: Stores survey responses

## Key Technologies

- **Frontend**: React with SurveyJS (`survey-react-ui`, `survey-creator`)
- **Backend**: Cloudflare Workers
- **Database**: Cloudflare D1 (SQL)
- **AI Models**: OpenAI GPT / Google Gemini / Anthropic Claude (via API)
- **Deployment**: Cloudflare Pages

## Common Development Tasks

### Working with SurveyJS
- Survey definitions are stored as JSON objects following the SurveyJS schema
- Use `survey-react-ui` for rendering surveys in the frontend
- Use `survey-creator` for editing survey definitions

### AI Integration
- Natural language to survey conversion is handled by LLMs
- Prompt engineering is critical for generating valid SurveyJS JSON
- The system uses a system prompt to ensure consistent output format

### Database Operations
- Surveys and results are stored in Cloudflare D1
- JSON data is stored as TEXT in the database and parsed/stringified as needed
- Use D1's SQL interface for queries and data manipulation

### Cloudflare Integration
- Frontend is deployed via Cloudflare Pages
- Backend APIs run on Cloudflare Workers
- Database operations use Cloudflare D1 bindings

## Security Considerations

- LLM API keys must be stored as Cloudflare Worker secrets
- All input validation should happen on the backend
- Implement rate limiting for LLM API calls
- Configure proper CORS policies for API endpoints

## Deployment

1. Frontend: Deploy React app to Cloudflare Pages
2. Backend: Deploy Worker with `wrangler deploy`
3. Database: Create D1 database with `wrangler d1 create`
4. Secrets: Set API keys with `wrangler secret put`

## Future Extensions

- User authentication with Cloudflare Access or Auth0
- Advanced analytics and data visualization
- Survey template marketplace
- Webhook integrations
- R2 storage for high-volume scenarios