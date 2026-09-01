# 📰 Chronicle News — AI-Powered News Aggregation & Publishing Platform

An enterprise-grade, copyright-compliant, full-stack news aggregation and publishing platform built with **Next.js 14+ (App Router)**, **Python FastAPI**, **SQLAlchemy 2.0 (PostgreSQL / SQLite)**, and **OpenRouter AI**.

Designed from the ground up for **₹0/month baseline operation** using GitHub Student Developer Pack benefits, permanent cloud free tiers, and cost-controlled AI synthesis.

---

## 📑 Table of Contents

1. [Architectural Overview](#-architectural-overview)
2. [Technology Stack](#-technology-stack)
3. [Monorepo Project Structure](#-monorepo-project-structure)
4. [Copyright & Intellectual Property Safeguards](#-copyright--intellectual-property-safeguards)
5. [Local Development Quickstart (Windows-Friendly)](#-local-development-quickstart-windows-friendly)
6. [Admin Experience & Publishing Workflow](#-admin-experience--publishing-workflow)
7. [Automated RSS Ingestion & Deduplication Pipeline](#-automated-rss-ingestion--deduplication-pipeline)
8. [OpenRouter AI Pipeline & Token Cost Control](#-openrouter-ai-pipeline--token-cost-control)
9. [Technical SEO & Social Discoverability](#-technical-seo--social-discoverability)
10. [Domain Migration Playbook](#-domain-migration-playbook)
11. [Database Backup & Recovery SOP](#-database-backup--recovery-sop)
12. [Cloud Deployment & GitHub Student Pack Guide](#-cloud-deployment--github-student-pack-guide)
13. [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🏛️ Architectural Overview

Chronicle operates as a **Modular Monolith**:

```
┌──────────────────────────────┐
│  Permitted RSS / News Feeds  │
└──────────────┬───────────────┘
               │ (APScheduler Async Worker / Every 15 min)
               ▼
┌──────────────────────────────┐
│  Ingestion & Normalizer      │ ──> [ Strips tracking queries & cleans HTML ]
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  3-Level Deduplication       │ ──> [ URL Hash + Source GUID + Title SimHash ]
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  Copyright Guardrail Filter  │ ──> [ Enforces METADATA_ONLY / SUMMARY_ALLOWED ]
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  OpenRouter AI Pipeline      │ ──> [ Structured JSON: Summary, Tags, Category ]
└──────────────┬───────────────┘
               ▼
┌──────────────────────────────┐
│  Relational Database (DB)    │ ──> [ Sets status: PENDING_REVIEW ]
└──────────────┬───────────────┘
               │
               ├────────────────────────────────────────┐
               ▼                                        ▼
┌──────────────────────────────┐         ┌──────────────────────────────┐
│   Admin Review Queue         │         │   Public Next.js Portal      │
│  - 1-Click Publish           │         │  - SSR / ISR Caching         │
│  - Inline Edit & Refine      │ ──────> │  - Dynamic OpenGraph & Meta  │
│  - Reject / Schedule Release │         │  - Schema.org NewsArticle    │
└──────────────────────────────┘         └──────────────────────────────┘
```

---

## ⚡ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14.2+ (App Router)** | TypeScript, Tailwind CSS, Lucide Icons, SSR & ISR |
| **Backend** | **Python 3.11+, FastAPI** | AsyncIO, Pydantic v2, SQLAlchemy 2.0 Async |
| **Database** | **PostgreSQL / SQLite** | PostgreSQL (`asyncpg`) for production; SQLite (`aiosqlite`) for zero-friction local testing |
| **AI Integration** | **OpenRouter API** | `google/gemini-2.0-flash-001` or `deepseek/deepseek-chat` |
| **Background Jobs** | **APScheduler** | Integrated async worker inside FastAPI event loop |
| **Authentication** | **JWT + Passlib (bcrypt)** | HTTP-only, SameSite=Lax Secure Cookies, RBAC (`SUPER_ADMIN`, `EDITOR`) |
| **Image Storage** | **Cloudinary / Local Uploads** | WebP formats, image licensing tags, responsive dimensions |

---

## 📂 Monorepo Project Structure

```
news-platform/
├── frontend/                     # Next.js 14+ App Router Client & Admin UI
│   ├── app/
│   │   ├── (public)/             # Public pages (/, /latest, /category/[slug], /article/[slug], /search, legal)
│   │   ├── (admin)/              # Protected Admin Desk (/admin/dashboard, /admin/pending, /admin/create, sources)
│   │   ├── layout.tsx            # Global HTML & font setup
│   │   ├── sitemap.ts            # Dynamic sitemap.xml
│   │   └── robots.ts             # Dynamic robots.txt
│   ├── components/
│   │   ├── public/               # Header, Footer, HeroStory, ArticleCard, SocialShare
│   │   └── admin/                # AdminSidebar, AdminHeader, StatsCard
│   ├── lib/                      # api.ts (typed client), utils.ts, seo.ts
│   └── types/                    # Shared TypeScript schema interfaces
│
├── backend/                      # Python FastAPI Application
│   ├── app/
│   │   ├── api/v1/               # Public and protected REST endpoints
│   │   ├── core/                 # Config, Database engine, Security/JWT
│   │   ├── models/               # SQLAlchemy 2.0 ORM models
│   │   ├── schemas/              # Pydantic request/response validation
│   │   ├── services/             # Ingestion, Deduplication, OpenRouter AI, Publishing, Search
│   │   ├── providers/            # BaseProvider & RSSProvider abstractions
│   │   ├── workers/              # APScheduler background tasks
│   │   └── main.py               # Application entrypoint & CORS middleware
│   ├── tests/                    # 14+ Pytest unit and integration test suite
│   ├── requirements.txt
│   └── Dockerfile
│
├── scripts/                      # DB migration and initial seeding scripts
├── .github/workflows/ci.yml      # GitHub Actions CI pipeline
├── docker-compose.yml            # Local Docker setup with PostgreSQL
├── .env.example                  # Environment configuration template
└── README.md
```

---

## ⚖️ Copyright & Intellectual Property Safeguards

The platform **never** acts as a content scraper:
1. **Source Usage Policies**: Each source has a configured permission rule (`METADATA_ONLY`, `SUMMARY_ALLOWED`, `LICENSED_REPUBLISH`). By default, only headlines and short excerpts are used to generate original transformative executive summaries.
2. **Prominent Publisher Attribution**: Every aggregated article displays a dedicated attribution badge with a direct outbound link (`rel="nofollow noopener"`) to the original article.
3. **Image Protection**: If a source policy is `NOT_ALLOWED`, external image links are discarded by the pipeline, and editorial placeholders or staff photography are used instead.
4. **Origin Tracking**: Every story tracks its provenance via `content_origin`: `ORIGINAL`, `AGGREGATED`, `AI_ASSISTED`, or `LICENSED`.

---

## 🚀 Local Development Quickstart (Windows-Friendly)

### 1. Prerequisites
- **Git**
- **Node.js 18+ & npm**
- **Python 3.11+**

### 2. Clone & Setup Environment
```powershell
# Copy environment file
Copy-Item .env.example .env
```

### 3. Setup & Run Backend
```powershell
cd backend

# Create virtual environment (optional)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Seed initial categories, default sources, and superadmin
python ..\scripts\seed_database.py

# Run FastAPI server
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000`  
Swagger API Docs at: `http://localhost:8000/api/v1/docs`

### 4. Setup & Run Frontend
Open a new terminal window:
```powershell
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Public Website will be live at: `http://localhost:3000`  
Admin Panel at: `http://localhost:3000/admin/login`

**Default Super Admin Credentials**:
- **Email**: `admin@newsplatform.local`
- **Password**: `AdminSecurePassword123!`

---

## 🛠️ Admin Experience & Publishing Workflow

You never need to touch VS Code to publish or curate news:

1. **Dashboard (`/admin/dashboard`)**: Monitor real-time counts, breaking activity, and source health.
2. **Review Queue (`/admin/pending`)**:
   - Inspect AI-generated summary, extracted metadata, suggested category, and tags.
   - Click **Publish to Live Feed** to push to the homepage immediately.
   - Click **Reject** to dismiss irrelevant stories.
   - Click **Edit Story** to refine headlines or text.
3. **Create Original Article (`/admin/create`)**:
   - Write original staff reporting with title, summary, HTML body, category, tags, and media uploads.
   - Choose **Publish**, **Save Draft**, or **Schedule Future Release**.
4. **Source Management (`/admin/sources`)**:
   - Add new RSS wire feeds with custom category mapping and copyright usage policies.
   - Click **Test Feed** for live parsing verification.
   - Click **Fetch Now** to pull stories immediately.

---

## 🤖 OpenRouter AI Pipeline & Token Cost Control

The OpenRouter service is located in `backend/app/services/ai/openrouter.py`:

* **Key Security**: `OPENROUTER_API_KEY` is loaded exclusively on the backend and is **never** sent to browser JavaScript.
* **Cost Efficiency**: Uses `google/gemini-2.0-flash-001` ($0.075 / 1M input tokens, ~₹6 per 1,000 articles).
* **Cost Guardrails**:
  - Deduplication prevents processing duplicate syndicated stories.
  - Summaries are capped at 500 response tokens.
  - If the API key is not configured or rate-limited, the system falls back to a deterministic local synthesizer without crashing.

---

## 🔍 Technical SEO & Social Discoverability

* **Dynamic Metadata**: Every article dynamically populates title, description, canonical URLs, and OpenGraph/Twitter image cards.
* **Schema.org JSON-LD**: Injects structured `NewsArticle` schemas for Google Search and Discover indexing.
* **Dynamic Sitemap**: Accessible at `/sitemap.xml` indexing all desks and published articles.
* **Robots Configuration**: Accessible at `/robots.txt` disallowing admin routes while exposing content to search engine crawlers.

---

## 🌐 Domain Migration Playbook

To transition from a free student domain (e.g. `chronicle-news.me`) to a production domain (e.g. `chroniclenews.com`):

1. **DNS Setup**: Point `A` and `CNAME` records to your frontend (Vercel/Cloudflare Pages) and backend host.
2. **Environment Variables**:
   Update your production environment variables:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://chroniclenews.com
   NEXT_PUBLIC_API_URL=https://api.chroniclenews.com/api/v1
   ALLOWED_ORIGINS=https://chroniclenews.com
   ```
3. **Permanent 301 Redirects**: Configure 301 redirects on Cloudflare or Vercel from `old-domain.me/*` to `new-domain.com/*` to preserve SEO search rankings.
4. **Google Search Console**: Submit the Change of Address tool in Google Search Console and submit the new `/sitemap.xml`.

---

## 💾 Database Backup & Recovery SOP

### PostgreSQL Automated Backup (Production)
```bash
# Export compressed database dump
pg_dump -h <host> -U <user> -d news_platform -F c -b -v -f ./backup_$(date +%Y%m%d_%H%M%S).dump

# Restore database dump
pg_restore -h <host> -U <user> -d news_platform -v ./backup_latest.dump
```

### SQLite Local Backup
```powershell
# Create copy of database
Copy-Item .\news_platform.db .\news_platform_backup.db
```

---

## 💰 Cost Breakdown & GitHub Student Developer Pack

| Scale Tier | Monthly Burn | Hosting & Stack Strategy |
| :--- | :--- | :--- |
| **Development (0–100 users/day)** | **₹0 / $0** | Vercel (Frontend) + Azure Student $100 / Render (Backend) + Neon PostgreSQL Free Tier (0.5GB) + Student Pack Domain (`.me`/`.tech`) |
| **Small Production (100–1,000 users/day)** | **~₹50 – ₹150 ($0.60–$1.80)** | Same free infrastructure + OpenRouter Gemini Flash token usage (~500 articles/month) |
| **Growing Production (10,000+ users/day)** | **~₹3,400 – ₹6,500 ($40–$75)** | Dedicated container, Cloudflare edge caching (absorbing 95% of bandwidth), production PostgreSQL |

---

## 🧪 Testing & Quality Assurance

Run the automated Pytest test suite:
```powershell
# Run backend test suite
pytest backend/tests -v
```

Run frontend production build verification:
```powershell
cd frontend
npm run build
```

---

## 📜 License & Compliance

Designed and built for compliance with international digital publishing standards, Fair Use metadata curation, and copyright preservation.
