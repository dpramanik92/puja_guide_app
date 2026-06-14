# Kolkata Durga Puja Guide — CLAUDE.md

Project root: `/Users/dipyaman/Documents/codes/puja_app/`

Three sub-projects that work together:

```
puja_app/
├── backend/     FastAPI + ChromaDB + OpenAI + Tavily
├── mobile/      Expo SDK 54 (iOS + Android)
├── web/         React + Vite (browser testing mirror)
└── logo/        maa_durga_logo.png  ← master copy of logo
```

---

## How to run

### 1 — Backend (always start this first)

```bash
cd /Users/dipyaman/Documents/codes/puja_app/backend
nohup bash launch.sh > server.log 2>&1 &
# or foreground:
bash launch.sh
```

`launch.sh` sets `PYTHONPATH` and `PATH` explicitly — do **not** skip it:

```bash
export PYTHONPATH=/Users/dipyaman/Documents/codes/puja_app/backend
export PATH=/Users/dipyaman/Documents/codes/puja_app/backend/venv/bin:$PATH
cd /Users/dipyaman/Documents/codes/puja_app/backend
exec python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Health check: `curl http://localhost:8000/health`

ChromaDB cold-starts slowly (~30–40 s) on first request because onnxruntime/numpy load embeddings — this is expected.

### 2 — Web (browser testing)

```bash
cd /Users/dipyaman/Documents/codes/puja_app/web
npm install
npm run dev        # http://localhost:3000
```

Vite proxies `/api/*` → `http://localhost:8000` automatically.

### 3 — Mobile (Expo)

```bash
cd /Users/dipyaman/Documents/codes/puja_app/mobile
npm install --legacy-peer-deps   # required — SDK 54 has peer dep quirks
npx expo start /Users/dipyaman/Documents/codes/puja_app/mobile --port 8081
```

Scan the QR code in Expo Go on iPhone. The mobile backend URL is hardcoded to the machine's LAN IP — update it if the IP changes:

```
mobile/src/services/api.ts  line 4:
  "http://192.168.29.125:8000/api"
```

Both the phone and the Mac must be on the same Wi-Fi. The backend binds `0.0.0.0:8000`, not localhost, so the phone can reach it.

---

## Environment variables

`backend/.env` (not committed):

```
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
CHROMA_PERSIST_DIR=./chroma_db
SIMILARITY_THRESHOLD=0.75
```

**Critical**: `load_dotenv()` must be the very first line in `backend/app/main.py`, before any other imports, otherwise FastAPI crashes with "OPENAI_API_KEY not set".

---

## Tech stack

| Layer | Choice |
|---|---|
| Chat LLM | OpenAI GPT-4o only (no other providers) |
| Embeddings | text-embedding-3-small |
| Vector DB | ChromaDB (local, persisted at `backend/chroma_db/`) |
| Web search fallback | Tavily API |
| Backend | FastAPI + uvicorn, Python venv at `backend/venv/` |
| Mobile | Expo SDK 54, React 19.1.0, React Native 0.81.5, Expo Router v6 |
| Web | React + Vite, port 3000 |
| i18n | react-i18next, English + Bengali |
| Bengali font | Hind Siliguri (Regular + Bold TTF in `mobile/assets/fonts/`) |
| Mobile HTTP | react-native-sse for SSE streaming |

---

## Project structure — key files

### Backend

```
backend/
├── app/
│   ├── main.py              FastAPI entrypoint — load_dotenv() MUST be first
│   ├── api/
│   │   ├── chat.py          POST /api/chat  → SSE StreamingResponse
│   │   └── live.py          GET  /api/live-feed?lang=en|bn
│   ├── rag/
│   │   ├── pipeline.py      Orchestration: retrieve → (web fallback) → GPT-4o stream
│   │   ├── retriever.py     ChromaDB similarity search
│   │   ├── embeddings.py    OpenAI text-embedding-3-small wrapper
│   │   └── web_search.py    Tavily search wrapper
│   └── data/
│       └── ingest.py        One-time: chunk pandal JSONs → embed → store in ChromaDB
├── data/pandals/            50 pandal JSON files (already ingested, 92 chunks in ChromaDB)
├── scripts/
│   └── collect_pandal_data.py  One-time data collection via Tavily + GPT-4o
├── launch.sh                Reliable start script (use this, not plain uvicorn)
├── requirements.txt
└── .env
```

### Mobile

```
mobile/
├── app/
│   ├── _layout.tsx          Root layout: loads HindSiliguri fonts, hides splash
│   └── (tabs)/
│       ├── _layout.tsx      Tab bar: logo + language toggle in header
│       ├── index.tsx        Home screen: hero + pandal list → tap → chat
│       ├── chat.tsx         Chat screen: SSE streaming, auto-fires query from params
│       └── live.tsx         Live feed screen: Tavily news cards
├── src/
│   ├── components/
│   │   ├── ChatBubble.tsx
│   │   ├── MessageInput.tsx
│   │   └── LiveFeedCard.tsx
│   ├── services/api.ts      SSE client + live feed fetch — UPDATE IP HERE
│   ├── i18n/               en.json, bn.json, index.ts
│   └── hooks/useLanguage.ts
├── assets/
│   ├── fonts/               HindSiliguri-Regular.ttf, HindSiliguri-Bold.ttf
│   └── maa_durga_logo.png   Logo used in header (copied from /logo/)
├── metro.config.js          Required for RN 0.81
├── babel.config.js
└── package.json
```

### Web

```
web/
├── src/
│   ├── App.tsx              Tab state, language toggle, logo in header
│   ├── components/
│   │   ├── HomeScreen.tsx   Pandal list → onNavigate("chat", query)
│   │   ├── ChatScreen.tsx   SSE streaming chat
│   │   └── LiveScreen.tsx   Live feed cards
│   ├── services/api.ts      ReadableStream SSE client
│   ├── i18n/
│   └── styles/index.css
├── public/
│   └── maa_durga_logo.png   Served as static asset
└── vite.config.ts           Proxy /api → localhost:8000
```

---

## RAG pipeline logic

1. Embed user query with `text-embedding-3-small`
2. Similarity search ChromaDB (top-5 chunks, threshold 0.75)
3. If no good match → Tavily web search fallback
4. Build context string (docs or web results)
5. GPT-4o streams response with `temperature=0.3, max_tokens=1024`
6. System prompt instructs: respond in same language as user, cite source naturally

SSE wire format:
```
data: __SOURCE__database\n\n   or   data: __SOURCE__web\n\n
data: "token text"\n\n          ← JSON-encoded to preserve spaces
data: [DONE]\n\n
```

Tokens are `json.dumps(delta.content)` on the backend and `JSON.parse(data)` on both clients. **Never strip the JSON encoding** — this is how spaces between words are preserved.

---

## Pandal data

50 JSON files in `backend/data/pandals/`. Already ingested into ChromaDB at `backend/chroma_db/` (92 chunks). To re-ingest after changing JSON files:

```bash
cd /Users/dipyaman/Documents/codes/puja_app/backend
source venv/bin/activate
python -m app.data.ingest
```

---

## i18n

- All UI strings in `src/i18n/en.json` and `src/i18n/bn.json` (same keys in both)
- Language toggle in header on every screen
- GPT-4o responds in whichever language the user writes in (detected by the model from the query text)
- Pandal queries are generated in the active language: English or Bengali

---

## Logo

Master file: `/Users/dipyaman/Documents/codes/puja_app/logo/maa_durga_logo.png` (1254×1254 PNG)

Copies:
- `mobile/assets/maa_durga_logo.png` — bundled via `require()`
- `web/public/maa_durga_logo.png` — served as `/maa_durga_logo.png`

Used in the header top-left on every screen beside the app title.

---

## Known gotchas / decisions made

### Python 3.13 type annotation crash
Module-level variables in `retriever.py`, `embeddings.py`, `web_search.py` must NOT use `|` union type annotations (`chromadb.Client | None` fails because `chromadb.Client` is a factory function, not a class). Use bare `= None` with no annotation.

### Expo SDK 54 install
Always use `--legacy-peer-deps` for npm installs in `mobile/`. Peer dep conflicts are expected and non-fatal.

### Starting Expo from wrong CWD
If the shell CWD drifts, pass the full project path explicitly:
```bash
npx expo start /Users/dipyaman/Documents/codes/puja_app/mobile --port 8081
```

### SSE token spacing
Tokens from OpenAI can start with a space (e.g., `" hello"`). The SSE parser strips leading whitespace unless tokens are JSON-encoded. Always use `json.dumps()` in `pipeline.py` and `JSON.parse()` in both clients.

### Mobile chat tab already mounted
`useEffect([], [])` only fires on mount. When the Chat tab is already open and the user taps a pandal on Home, params change but the effect doesn't re-run. Fixed with a `lastFiredQueryRef` and `useEffect([params.query])`.

### Backend IP for mobile
The mobile client hardcodes the dev machine's LAN IP. The backend must bind `0.0.0.0` (not `127.0.0.1`). Update `mobile/src/services/api.ts` line 4 whenever the machine IP changes.

---

## Docker & AWS deployment

### Files added

```
puja_app/
├── docker-compose.yml          Local multi-container setup
├── .env.example                Template for docker-compose secrets
├── backend/
│   ├── Dockerfile              Python 3.11-slim, bundles pre-ingested chroma_db
│   └── .dockerignore
└── web/
    ├── Dockerfile              Multi-stage: Node build → nginx serve
    ├── nginx.conf.template     nginx config with $BACKEND_URL substitution
    └── .dockerignore
```

### Local Docker run

```bash
# 1. Create .env with real API keys
cp .env.example .env
# edit .env: set OPENAI_API_KEY and TAVILY_API_KEY

# 2. Build and start both containers
docker compose up --build

# Web → http://localhost:3000
# Backend API → http://localhost:8000
```

The web container's nginx proxies `/api/*` → backend container (`http://backend:8000`).
The `web` service waits for the backend health check to pass before starting.

### AWS deployment path (ECS + ECR)

**1. Push images to ECR**

```bash
AWS_REGION=ap-south-1
AWS_ACCOUNT=<your-account-id>

# Authenticate
aws ecr get-login-password --region $AWS_REGION \
  | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Create repos (once)
aws ecr create-repository --repository-name puja-backend --region $AWS_REGION
aws ecr create-repository --repository-name puja-web     --region $AWS_REGION

# Build & push
docker build -t puja-backend ./backend
docker tag puja-backend:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/puja-backend:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/puja-backend:latest

docker build -t puja-web ./web
docker tag puja-web:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/puja-web:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/puja-web:latest
```

**2. ECS setup**
- Create an ECS cluster (Fargate recommended)
- Create two task definitions: `puja-backend` and `puja-web`
- Backend task env vars: `OPENAI_API_KEY`, `TAVILY_API_KEY` — store in AWS Secrets Manager and reference them in the task definition
- Web task env var: `BACKEND_URL=http://<backend-service-private-dns>:8000` (use ECS Service Discovery or internal ALB)

**3. Load balancer**
- ALB with two target groups: path `/api/*` → backend service, `/*` → web service
- Alternatively: put both on the same ALB, web container handles the `/api` proxy via nginx

**4. Mobile app for production**
Update `mobile/src/services/api.ts` line 4:
```typescript
const BASE_URL = __DEV__
  ? "http://192.168.29.125:8000/api"
  : "https://<your-alb-or-api-domain>/api";  // ← set this to the AWS URL
```

### nginx + SSE in AWS
If using an ALB in front of the web container, add these ALB attributes:
- Idle timeout: 300s (default 60s is too short for SSE streams)
- The nginx container already sets `proxy_buffering off` and `X-Accel-Buffering: no`

### ChromaDB in Docker
The backend Docker image bundles the pre-ingested `chroma_db/` directory (~7 MB). This means:
- No EFS or persistent volume needed
- Re-ingest by rebuilding the image (run `python -m app.data.ingest` locally first, then rebuild)
- The `CHROMA_PERSIST_DIR=./chroma_db` env var resolves to `/app/chroma_db` inside the container
