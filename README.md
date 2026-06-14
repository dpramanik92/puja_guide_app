# Kolkata Durga Puja Guide App

Mobile app (iOS + Android) with an OpenAI GPT-4o chatbot for Kolkata Durga Puja pandal information. Supports English and Bengali. Uses RAG over a local pandal database, falling back to Tavily web search.

---

## Project Structure

```
puja_app/
├── backend/     Python FastAPI — RAG pipeline + live feed API
└── mobile/      React Native (Expo) — iOS + Android app
```

---

## Quick Start

### 1. Backend setup

```bash
cd backend

# Create virtualenv
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env and fill in your API keys
cp .env.example .env
# Edit .env: add OPENAI_API_KEY and TAVILY_API_KEY

# Collect pandal data (one-time, ~50 Tavily + OpenAI calls)
python scripts/collect_pandal_data.py

# Ingest into ChromaDB (one-time)
python -m app.data.ingest

# Start the API server
uvicorn app.main:app --reload --port 8000
```

API is live at http://localhost:8000. Docs at http://localhost:8000/docs.

### 2. Mobile setup

```bash
cd mobile

# Install Node.js (if not installed): https://nodejs.org

# Download Bengali fonts (Hind Siliguri) and place them in:
#   mobile/assets/fonts/HindSiliguri-Regular.ttf
#   mobile/assets/fonts/HindSiliguri-Bold.ttf
# Download from: https://fonts.google.com/specimen/Hind+Siliguri

npm install
npx expo start
```

- Press `i` for iOS simulator, `a` for Android emulator
- Scan QR with Expo Go app for physical device

### 3. Connect mobile to backend

If running on a physical device, replace `localhost` in `src/services/api.ts`:
```ts
const BASE_URL = __DEV__
  ? "http://YOUR_MACHINE_IP:8000/api"   // ← your local IP
  : "https://your-backend.example.com/api";
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat` | Streaming SSE chat with RAG |
| GET | `/api/live-feed?lang=en\|bn` | Live Puja news feed |
| GET | `/health` | Health check |

### Chat request body
```json
{
  "message": "কুমারটুলি পূজা কোথায়?",
  "history": []
}
```

---

## Features

- **Chatbot**: Ask anything about Durga Puja pandals in English or Bengali
- **RAG pipeline**: Searches local ChromaDB first; falls back to Tavily web search
- **Streaming**: Responses appear token-by-token
- **Live Feed**: Real-time Puja news summarized by GPT-4o
- **Bilingual**: Full Bengali Unicode support with Hind Siliguri font

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo (TypeScript) |
| Navigation | Expo Router |
| i18n | react-i18next |
| Backend | Python FastAPI |
| LLM | OpenAI GPT-4o |
| Embeddings | text-embedding-3-small |
| Vector DB | ChromaDB |
| Web Search | Tavily API |

---

## Environment Variables (backend/.env)

```
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
CHROMA_PERSIST_DIR=./chroma_db
SIMILARITY_THRESHOLD=0.75
```

Get your API keys:
- OpenAI: https://platform.openai.com/api-keys
- Tavily: https://tavily.com

---

## Adding More Pandal Data

Add JSON files to `backend/data/pandals/` following the schema in the existing files, then re-run `python -m app.data.ingest`.

---

## Roadmap

- [ ] Map view with pandal pins
- [ ] Route planning integration
- [ ] Twitter/X live feed (when API cost is acceptable)
- [ ] Favorite pandals
- [ ] Push notifications for crowd alerts
- [ ] App Store / Play Store release
