# EmotiGift 🎁

AI-native hyper-personalized gift platform targeting Japanese Z-generation and millennials. Transform emotional intentions into concrete, meaningful gifts through conversational AI.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.9.0
- Google AI API key for Gemini model

### Installation
```bash
# Clone the repository
git clone https://github.com/Pepper161/Emotigift.git
cd Emotigift

# Install dependencies
npm install
cd next-client && npm install && cd ..
```

### Environment Setup
```bash
# Set your Google AI API key (check agent configuration for exact variable name)
export GEMINI_API_KEY=your_api_key_here
```

### Development

**Start both servers simultaneously:**

1. **Backend (Mastra)** - Terminal 1:
```bash
npm run dev
```
*Starts Mastra development server on port 4111*

2. **Frontend (Next.js)** - Terminal 2:
```bash
npm run dev:client
```
*Starts Next.js development server on port 3000*

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:4111/api
- Mastra Playground: http://localhost:4111

### Production Build
```bash
# Build both backend and frontend
npm run build

# Start production server
npm run start
```

## 🏗️ Architecture

### Current Implementation
- **Frontend**: Next.js + React + TypeScript (port 3000)
- **Backend**: Mastra framework (port 4111)
- **Database**: Mixed approach - main instance uses `:memory:`, weather agent uses `file:../mastra.db`
- **AI Model**: Google Gemini 2.0 Flash Experimental

### Key Features
- ✅ **Real Reddit Analysis**: Direct Reddit API integration for user post analysis
- ✅ **AI-Powered Recommendations**: Concrete product suggestions with detailed explanations
- ✅ **Shopping Integration**: Direct links to Amazon, Rakuten, Yahoo! Shopping
- ✅ **Conversational Interface**: Natural language gift consultation
- ✅ **Responsive Design**: Mobile-first UI with Tailwind CSS

## 🛠️ Available Scripts

### Development
```bash
npm run dev              # Start Mastra backend only
npm run dev:client       # Start Next.js frontend only
npm run dev:old-client   # Start legacy Vite client (for comparison)
```

### Production
```bash
npm run build            # Build both backend and frontend
npm run build:client     # Build Next.js frontend only
npm run start            # Start production Mastra server
npm run preview          # Preview Vite build (legacy)
```

## 📁 Project Structure

```
Emotigift/
├── src/mastra/                    # Mastra backend
│   ├── agents/                    # AI agents
│   │   └── gift-consultant-agent.ts
│   ├── tools/                     # Mastra tools
│   │   ├── reddit-analyzer-tool.ts
│   │   └── gemini-gift-analyzer-tool.ts
│   └── workflows/                 # Business workflows
├── next-client/                   # Next.js frontend
│   ├── src/
│   │   ├── app/                   # App Router pages
│   │   ├── components/            # React components
│   │   └── types/                 # TypeScript definitions
├── client/                        # Legacy Vite client (preserved)
└── package.json                   # Root dependencies
```

## 🤖 AI Features

### Reddit Analysis
- Direct Reddit JSON API integration
- User post analysis for personality insights
- Subreddit activity pattern recognition
- Interest categorization based on posting behavior

### Gift Recommendations
- AI agent with explicit tool calling instructions
- Structured JSON output with concrete product names
- Real-time Reddit data processing
- Explainable AI with detailed reasoning

### Shopping Integration
- Smart search keyword generation
- Direct links to major Japanese e-commerce sites
- URL encoding and special character handling
- Multi-platform product search (Amazon, Rakuten, Yahoo!)

## 🔧 Technical Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Frontend | Next.js 15, React 19, TypeScript | Modern web application framework |
| Backend | Mastra, Node.js | AI-native framework for agents and workflows |
| Database | PostgreSQL, Vector DB | Polyglot persistence for structured and semantic data |
| AI/ML | Google Gemini 2.0, Vercel AI SDK | Large language model and AI tooling |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Development | TypeScript, ESLint | Type safety and code quality |

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000 and 4111 are available
2. **API key missing**: Set the GEMINI_API_KEY environment variable
3. **Connection refused**: Start the Mastra backend first, then the frontend
4. **Module not found**: Run `npm install` in both root and `next-client` directories

### Debug Logs
Open browser developer tools and check console for:
- `🔍 エージェントレスポンス:` - Agent response details
- `📄 解析対象テキスト:` - Text being analyzed
- `🎁 最終推薦結果:` - Final recommendation results

## 📝 Development Notes

- The Vite dev server proxies `/api/*` requests to the Mastra backend at `localhost:4111`
- The weather feature serves as an architectural template for the gift recommendation system
- All Reddit API calls use public JSON endpoints without authentication
- Gift recommendations include direct shopping links for immediate purchase

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## 📄 License

This project is part of the Gakuiku Hackathon and is intended for educational and demonstration purposes.

