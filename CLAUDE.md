# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EmotiGift is an AI-native hyper-personalized gift platform targeting Japanese Z-generation and millennials. The platform transforms the emotional intentions of gift-givers into concrete, meaningful gifts through conversational AI. The project is strategically positioned at the intersection of three major Japanese consumption trends: "Imi-shohi" (meaning consumption), "Oshi-katsu" consumption (fan activity), and social gifting.

### Core Value Proposition
- **From Transaction to Emotional Communication**: Goes beyond traditional e-commerce by understanding relationships, occasions, and emotional intentions through conversational AI
- **Market Positioning**: Targets the convergence of meaning-based consumption, fan culture spending (3.5 trillion yen market), and social gifting trends
- **AI-First Approach**: Uses Mastra framework for complete AI workflow orchestration from user feedback to model retraining and deployment

## Development Commands

### Backend (Mastra)
- `npm run dev` - Start Mastra development server (port 4000) with hot reload
- `npm run build` - Build both Mastra backend and React frontend
- `npm run start` - Start production Mastra server

### Frontend (React + Vite)
- `npm run dev:client` - Start Vite development server only (port 3000)
- `npm run build:client` - Build React frontend only
- `npm run preview` - Preview production build

### Full Stack Development
Run both servers simultaneously:
1. `npm run dev` (terminal 1) - Mastra backend
2. `npm run dev:client` (terminal 2) - React frontend

The Vite dev server proxies `/api/*` requests to the Mastra backend at `localhost:4000`.

## Architecture

### Planned Architecture (Polyglot Microservices)
The full production system will use a microservices architecture with the following services:

| Service | Responsibilities | Tech Stack |
| --- | --- | --- |
| User & Profile Service | User registration, authentication (JWT), profile data management, privacy settings | Mastra (TypeScript), PostgreSQL, Redis |
| Recommendation Service | Recommendation model management, gift candidate and explanation generation | Mastra (TypeScript), Python (FastAPI), Vector DB, PostgreSQL |
| Gift & Order Service | Product catalog, inventory, shopping cart, payment gateway integration, order processing | Mastra (TypeScript), PostgreSQL, Stripe API |
| Conversational AI Gateway | All user interactions via chat, conversation state management, intent routing | Mastra (Agent), WebSocket, Next.js |
| Notification & Messaging Service | Transaction emails, push notifications, social gift link delivery | Mastra (Workflow), RabbitMQ, SendGrid API |

### Current Implementation (Development Phase)
- **Backend Structure (`src/mastra/`)**: Mastra instance with weather example demonstrating agent/tool/workflow patterns
- **Frontend Structure (`client/`)**: React + Vite + TypeScript with Japanese UI
- **Storage Configuration**: Mixed approach - main instance uses `:memory:`, weather agent uses `file:../mastra.db`
- **AI Model**: Google Gemini 2.5 Pro Experimental
- **Development Focus**: Weather feature serves as architectural template for future gift recommendation features

### Key Configuration
- **TypeScript**: Strict mode enabled, React JSX support
- **API Proxy**: Vite dev server proxies `/api/*` to Mastra backend at `localhost:4000`
- **Database**: PostgreSQL + Vector DB (Pinecone/pgvector) for polyglot persistence in production
- **Build**: Vite bundles to `dist/` directory

## Mastra Framework Patterns

### Creating New Agents
Agents are AI-powered components with memory and specific instructions:
```typescript
export const myAgent = new Agent({
  name: 'My Agent',
  instructions: 'Agent behavior instructions',
  model: gemini2, // or other supported models
})
```

### Creating New Tools
Tools connect to external APIs and services:
```typescript
export const myTool = new Tool({
  id: 'my-tool',
  description: 'Tool description',
  inputSchema: z.object({ /* zod schema */ }),
  execute: async ({ context, input }) => {
    // Tool implementation
  }
})
```

### Workflows
Workflows orchestrate multi-step processes:
```typescript
const workflow = new Workflow({
  name: 'my-workflow',
  triggerSchema: z.object({ /* input schema */ }),
})
.step('step1')
.step('step2')
.commit()
```

## Recommendation Engine Architecture (Planned)

### Cascade Hybrid Knowledge-Based Model
The production system will implement a three-stage recommendation pipeline:

1. **Knowledge-Based Recommendation (KBR)**: Interprets abstract conversational input ("creative gift for artistic friend") and applies semantic constraints to solve cold-start problems
2. **Collaborative + Content-Based Filtering**: Refines candidates using item attributes and similar user preferences 
3. **LLM Final Ranking & Explanation**: Large Language Model provides final selection with human-like explanations for Explainable AI (XAI) requirements

### MLOps Automation with Mastra
The system uses Mastra workflows for complete MLOps lifecycle automation:

- **Real-time Feedback Loop**: User actions trigger workflows that update preference vectors in near real-time
- **Automated Retraining**: Weekly scheduled workflows for data ingestion, model training via Vertex AI, evaluation, and conditional deployment
- **Intelligent Catalog Ingestion**: AI agents automatically process new products, generate semantic tags, create embeddings, and update vector databases

## Environment Requirements

- Node.js >= 20.9.0
- Google AI API key for Gemini model (check agent configuration for exact variable name)
- All dependencies installed via `npm install`

## Development Status & Roadmap

### Current Implementation (Phase 1)
- ✅ Weather information display with AI-powered activity suggestions
- ✅ React frontend with Japanese UI and TypeScript
- ✅ Mastra backend demonstrating agent/tool/workflow patterns
- ✅ API proxy setup for seamless frontend-backend communication

### Planned Features (Future Phases)
- **Conversational Onboarding**: AI-driven user profiling with gamification elements
- **Explainable AI Recommendations**: Natural language explanations for all gift suggestions
- **Social Gift Delivery**: URL-based gifting without requiring recipient addresses
- **Ethical AI Framework**: Privacy dashboard with granular user control over personalization
- **Japanese Market Integration**: Support for "Oshi-katsu" merchandise, sustainable products, and social gifting trends

### Key Japanese UI Elements
- Interface designed for Japanese users with cultural context
- Support for meaning-based consumption preferences
- Integration planned for fan culture and character merchandise
- Social-first design for LINE and Instagram sharing

The weather feature serves as a working architectural template demonstrating how the final gift recommendation system will operate using Mastra's agent, tool, and workflow patterns.