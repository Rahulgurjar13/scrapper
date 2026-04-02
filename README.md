# 🕸️ Scraper Nexus

A full-stack Amazon product scraper with real-time dashboard, price tracking, analytics, and auto-scheduling.

**Tech Stack:** FastAPI · React · MongoDB · WebSockets · Recharts

---

## Features

- **🔍 Smart Scraping** — Scrapes Amazon.in with Chrome fingerprint spoofing, multi-fallback selectors, and CAPTCHA detection
- **📈 Price History** — Tracks price changes over time with visual charts
- **⏰ Auto-Scheduling** — Set categories to auto-scrape every X hours
- **📊 Analytics** — Best deals, price distribution, average prices by category
- **🔗 Custom Search** — Add any Amazon search term as a scrapeable category
- **⚖️ Product Comparison** — Compare products side-by-side
- **📥 CSV Export** — Download scraped data as CSV
- **🗑️ Data Management** — Delete products and categories
- **📡 Live Logs** — Real-time WebSocket log streaming

---

## Quick Start (Local)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally (`mongod`)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/scraper-nexus.git
cd scraper-nexus

# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
cd ..

# Frontend
npm install
```

### 2. Start

```bash
# Terminal 1 — Backend
source backend/venv/bin/activate
python -m uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
npm run dev
```

### 3. Open
- Frontend: http://localhost:8080
- API Docs: http://localhost:8000/docs

---

## 🚀 Deployment

### Database: MongoDB Atlas (Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Create a database user (username + password)
3. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
4. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority`

### Backend: Render (Free)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** (leave empty)
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - **Runtime:** Python 3
5. Environment Variables:
   - `MONGO_URI` = your Atlas connection string
   - `DB_NAME` = `scraper_nexus`
   - `CORS_ORIGINS` = `https://your-app.vercel.app` (your Vercel URL)
6. Deploy → Note your URL: `https://scraper-nexus-api.onrender.com`

### Frontend: Vercel (Free)

1. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
2. Framework: **Vite**
3. Environment Variables:
   - `VITE_API_URL` = `https://scraper-nexus-api.onrender.com` (your Render URL, no trailing slash)
   - `VITE_WS_URL` = `wss://scraper-nexus-api.onrender.com` (same URL but with `wss://`)
4. Deploy!

### After Deployment

1. Go back to Render → Environment Variables
2. Set `CORS_ORIGINS` = your Vercel URL (e.g., `https://scraper-nexus.vercel.app`)
3. Redeploy the Render service

---

## Environment Variables

### Backend (.env)

| Variable | Description | Example |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net` |
| `DB_NAME` | Database name | `scraper_nexus` |
| `CORS_ORIGINS` | Allowed frontend URLs (comma-separated) | `https://myapp.vercel.app` |
| `REQUEST_DELAY` | Delay between scrape requests (seconds) | `2.0` |
| `MAX_PAGES` | Max pages to scrape per category | `5` |
| `SCRAPER_TIMEOUT` | HTTP request timeout (seconds) | `30` |

### Frontend (Vercel Dashboard)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API URL | `https://scraper-nexus-api.onrender.com` |
| `VITE_WS_URL` | Backend WebSocket URL | `wss://scraper-nexus-api.onrender.com` |

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard` | Dashboard metrics & charts |
| GET | `/api/categories` | List all categories |
| POST | `/api/categories/fetch` | Fetch categories from Amazon |
| POST | `/api/categories/custom` | Add custom search category |
| DELETE | `/api/categories/:id` | Delete a category |
| GET | `/api/products` | List products (paginated) |
| DELETE | `/api/products/:asin` | Delete a product |
| DELETE | `/api/products` | Delete all products |
| POST | `/api/scraper/start` | Start scraping |
| POST | `/api/scraper/stop` | Stop scraping |
| GET | `/api/scraper/status` | Get scraper status |
| GET | `/api/analytics` | Get analytics data |
| GET | `/api/analytics/price-history/:asin` | Price history for a product |
| GET | `/api/analytics/price-drops` | Products with price drops |
| GET | `/api/schedules` | List auto-scrape schedules |
| POST | `/api/schedules` | Create a schedule |
| DELETE | `/api/schedules/:id` | Delete a schedule |
| GET | `/api/logs` | Get recent logs |
| WS | `/ws/logs` | Live log streaming |
| GET | `/health` | Health check |

---

## Project Structure

```
scraper-nexus/
├── backend/
│   ├── __init__.py
│   ├── main.py              # FastAPI entry point
│   ├── config.py             # Settings & env vars
│   ├── database.py           # MongoDB operations
│   ├── requirements.txt
│   ├── .env                  # Local environment (not committed)
│   ├── routes/
│   │   ├── dashboard.py
│   │   ├── categories.py
│   │   ├── products.py
│   │   ├── scraper.py
│   │   ├── logs.py
│   │   ├── analytics.py
│   │   └── schedules.py
│   └── scraper/
│       ├── core.py           # Scraping engine
│       └── category_fetcher.py
├── src/
│   ├── App.tsx
│   ├── lib/api.ts            # API client
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Categories.tsx
│   │   ├── Products.tsx
│   │   ├── Analytics.tsx
│   │   ├── ScraperControl.tsx
│   │   └── Logs.tsx
│   └── components/
│       ├── AppLayout.tsx
│       └── AppSidebar.tsx
├── vercel.json               # Vercel deployment config
├── render.yaml               # Render deployment config
└── README.md
```

---

## License

MIT
