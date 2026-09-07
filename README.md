# 📰 Chronicle News — AI-Powered News Aggregation & Publishing Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2%2B-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%20%7C%203.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0%20Async-D71F00?style=flat&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI%20Synthesis-6366F1?style=flat)](https://openrouter.ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4%2B-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-Pytest%20Passing-success?style=flat&logo=pytest)](https://docs.pytest.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, copyright-compliant, full-stack news aggregation and publishing platform built with **Next.js 14+ (App Router)**, **Python FastAPI**, **SQLAlchemy 2.0 Async (PostgreSQL / SQLite)**, and **OpenRouter AI**.

Designed from the ground up for **₹0/month baseline operation** using GitHub Student Developer Pack benefits, permanent cloud free tiers, and cost-controlled AI synthesis.

---

## 📑 Table of Contents

1. [Key Features & Highlights](#-key-features--highlights)
2. [Architectural Overview & Data Flow](#-architectural-overview--data-flow)
3. [Technology Stack](#-technology-stack)
4. [Monorepo Project Structure](#-monorepo-project-structure)
5. [Environment Configuration Reference](#-environment-configuration-reference)
6. [Local Development Quickstart](#-local-development-quickstart)
   - [Windows (PowerShell)](#windows-powershell)
   - [macOS / Linux (Bash)](#macos--linux-bash)
   - [Docker Compose Quickstart](#docker-compose-quickstart)
7. [Admin Newsroom & Editorial Workflow](#-admin-newsroom--editorial-workflow)
8. [Automated Ingestion, Deduplication & AI Pipeline](#-automated-ingestion-deduplication--ai-pipeline)
9. [Copyright, Fair Use & Attribution Safeguards](#-copyright-fair-use--attribution-safeguards)
10. [Background Workers & Task Scheduling](#-background-workers--task-scheduling)
11. [REST API Documentation & Endpoint Reference](#-rest-api-documentation--endpoint-reference)
12. [Technical SEO, Social Sharing & Schemas](#-technical-seo-social-sharing--schemas)
13. [Production Cloud Deployment Playbook](#-production-cloud-deployment-playbook)
14. [Database Backup & Disaster Recovery SOP](#-database-backup--disaster-recovery-sop)
15. [Cost Breakdown & Student Pack Optimization](#-cost-breakdown--student-pack-optimization)
16. [Testing & Quality Assurance](#-testing--quality-assurance)

---

## ✨ Key Features & Highlights

- 🤖 **AI-Powered News Synthesis**: Automatically extracts key takeaways, writes concise 3–4 bullet point summaries, assigns accurate categories, and generates keyword tags using OpenRouter models (DeepSeek Chat, Gemini 2.0 Flash, Llama 3.3).
- 🔄 **3-Level Deduplication Engine**: Filters out identical and syndicated wire stories across multiple agencies (e.g. AP, Reuters, BBC) via URL normalization, external GUID hashing, and Title SimHash similarity scoring.
- ⚖️ **Strict Copyright & Fair Use Compliance**: Enforces source-level usage policies (`METADATA_ONLY`, `SUMMARY_ALLOWED`, `LICENSED_REPUBLISH`) and image policies (`NOT_ALLOWED`, `THUMBNAIL_ONLY`, `LICENSED`). Every story contains clear origin badges and direct outbound publisher attribution (`rel="nofollow noopener"`).
- 📰 **Full Editorial Newsroom Desk**: Modern Next.js 14 Admin Panel with real-time statistics, a Pending Review queue with 1-click publishing, inline story editor, full WYSIWYG article composer, and future-scheduled publishing countdowns.
- ⚡ **Automated Background Scheduler**: Built-in APScheduler runs periodic RSS wire ingestion (every 15 min) and checks for due scheduled articles (every 1 min) directly inside the FastAPI async event loop.
- 🖼️ **Media Library & Image Optimization**: Built-in support for local file uploads and Cloudinary object storage, WebP compression, aspect ratio formatting, and licensing attribution.
- 🌐 **Modern Public Reader Portal**: High-performance Server-Side Rendered (SSR) & ISR news portal with dynamic categories, breaking news tickers, reading time estimates, related story recommendations, and dark/light themes.
- 🔒 **Enterprise Security & RBAC**: Strict JWT authentication stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies with role-based access control (`SUPER_ADMIN`, `EDITOR`), bcrypt password hashing, and SlowAPI rate limiting with reverse-proxy IP detection.
- 🔍 **Search Engine & Social Discovery Ready**: Dynamic `sitemap.xml`, `robots.txt`, OpenGraph/Twitter social cards, and Schema.org `NewsArticle` JSON-LD structured data for Google Search and Discover.

---

## 🏛️ Architectural Overview & Data Flow

Chronicle operates as a high-performance **Modular Monolith**:

```
┌───────────────────────────────────┐
│     Permitted Wire RSS Feeds      │
└─────────────────┬─────────────────┘
                  │ (APScheduler Async Worker / Every 15 min)
                  ▼
┌───────────────────────────────────┐
│     Ingestion & Normalizer        │ ───> [ Strips tracking queries, UTM tags & cleans HTML ]
└─────────────────┬─────────────────┘
                  ▼
┌───────────────────────────────────┐
│     3-Level Deduplication         │ ───> [ 1. Canonical URL Hash  2. Source GUID  3. Title SimHash ]
└─────────────────┬─────────────────┘
                  ▼
┌───────────────────────────────────┐
│     Copyright Guardrail Filter    │ ───> [ Enforces METADATA_ONLY / SUMMARY_ALLOWED policies ]
└─────────────────┬─────────────────┘
                  ▼
┌───────────────────────────────────┐
│     OpenRouter AI Pipeline        │ ───> [ Structured JSON: Executive Summary, Category, Tags ]
└─────────────────┬─────────────────┘
                  ▼
┌───────────────────────────────────┐
│     Relational Database (DB)      │ ───> [ Stores story in status: PENDING_REVIEW ]
└─────────────────┬─────────────────┘
                  │
                  ├─────────────────────────────────────────────┐
                  ▼                                             ▼
┌───────────────────────────────────┐         ┌───────────────────────────────────┐
│        Admin Editorial Desk       │         │        Public Next.js Portal      │
│  - 1-Click Fast Publishing        │         │  - Server-Side Rendering (SSR)    │
│  - Story Editor & Category Fix    │ ──────> │  - Incremental Static Regen (ISR) │
│  - Scheduled Future Release       │         │  - Schema.org NewsArticle JSON-LD │
│  - Manual RSS Wire Trigger        │         │  - OpenGraph & Twitter Cards      │
└───────────────────────────────────┘         └───────────────────────────────────┘
```

---

## ⚡ Technology Stack

| Domain | Technology | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14.2+ (App Router)** | TypeScript, Server Components, SSR, ISR, Suspense |
| **Styling & Icons** | **Tailwind CSS + Lucide Icons** | Responsive editorial layout, glassmorphism, typography plugins |
| **Backend Framework** | **Python 3.11+, FastAPI** | High-concurrency AsyncIO, Pydantic v2 schemas, Dependency Injection |
| **Database & ORM** | **PostgreSQL / SQLite + SQLAlchemy 2.0** | `asyncpg` (Production PostgreSQL) and `aiosqlite` (Zero-setup local testing) |
| **AI Intelligence** | **OpenRouter API** | `deepseek/deepseek-chat`, `google/gemini-2.0-flash-001`, or `meta-llama/llama-3.3-70b-instruct` |
| **Background Scheduler** | **APScheduler 3.10+** | Non-blocking async background job runner embedded in FastAPI lifecycle |
| **Authentication & AuthZ**| **JWT + Passlib (bcrypt)** | HttpOnly secure session cookies, Bearer Token fallback, RBAC permissions |
| **Rate Limiting** | **SlowAPI / limits** | Client IP rate limiting with `X-Forwarded-For` proxy support |
| **Media Storage** | **Cloudinary / Local FS** | Dual storage driver supporting local `./uploads` or Cloudinary CDN |
| **Testing Suite** | **Pytest + Pytest-AsyncIO** | 16+ unit and integration tests covering AI, Auth, Ingestion, and Publishing |

---

## 📂 Monorepo Project Structure

```
news-platform/
├── frontend/                     # Next.js 14+ App Router Client & Admin UI
│   ├── app/
│   │   ├── (public)/             # Public reader routes
│   │   │   ├── page.tsx          # Homepage with featured hero, breaking bar & category grids
│   │   │   ├── latest/           # Real-time chronological news feed
│   │   │   ├── category/[slug]/  # Category desk pages (India, World, Tech, Business, etc.)
│   │   │   ├── article/[slug]/   # Article detail page with JSON-LD, reading time & related stories
│   │   │   ├── search/           # Live full-text search page with query filters
│   │   │   └── legal/            # Copyright, Terms of Service, Privacy & Ethics policies
│   │   ├── (admin)/              # Protected Editorial Desk
│   │   │   └── admin/
│   │   │       ├── login/        # Superadmin authentication portal
│   │   │       ├── dashboard/    # Analytics overview, pending queue stats & system health
│   │   │       ├── pending/      # Editorial review queue (Publish / Reject / Edit)
│   │   │       ├── articles/     # Article manager (Drafts, Scheduled, Published archive)
│   │   │       ├── create/       # Rich article composer with media picker & scheduler
│   │   │       ├── edit/[id]/    # Inline story editor
│   │   │       ├── sources/      # Wire RSS management, live feed tester & manual sync
│   │   │       └── media/        # Media library with image uploader & license tagging
│   │   ├── layout.tsx            # Root layout with Google Fonts (Inter / Outfit) & header/footer
│   │   ├── sitemap.ts            # Dynamic sitemap generator (/sitemap.xml)
│   │   └── robots.ts             # Dynamic crawler directive generator (/robots.txt)
│   ├── components/
│   │   ├── public/               # Public UI: Header, Footer, HeroStory, ArticleCard, SocialShare
│   │   └── admin/                # Admin UI: AdminSidebar, AdminHeader, StatsCard, SourceModal
│   ├── lib/                      # api.ts (typed HTTP client), utils.ts, seo.ts
│   └── types/                    # Shared TypeScript domain models & DTOs
│
├── backend/                      # Python FastAPI Application
│   ├── app/
│   │   ├── api/                  # API version routing
│   │   │   ├── deps.py           # Dependency injection (DB session, current user, rate limiter)
│   │   │   └── v1/
│   │   │       ├── router.py     # Main v1 endpoint aggregator
│   │   │       └── endpoints/    # Route controllers (articles, admin, auth, sources, categories, images)
│   │   ├── core/                 # Core configuration, security, database & hashing
│   │   │   ├── config.py         # Pydantic Settings reading .env
│   │   │   ├── database.py       # Async SQLAlchemy engine & session maker
│   │   │   └── security.py       # JWT creation, token decoding, and bcrypt password hashing
│   │   ├── models/               # SQLAlchemy ORM database models
│   │   │   ├── article.py        # Article model (status, content_origin, published_at, scheduled_for)
│   │   │   ├── category.py       # News category model with slug & display order
│   │   │   ├── source.py         # Wire source model with usage & image policies
│   │   │   ├── user.py           # Admin user model with role enumeration
│   │   │   ├── tag.py            # Tag model & article_tags association table
│   │   │   └── image.py          # Media asset model with dimensions & license attribution
│   │   ├── schemas/              # Pydantic request & response validation schemas
│   │   ├── services/             # Business logic & domain services
│   │   │   ├── ai/openrouter.py  # OpenRouter AI summarizer & categorization client
│   │   │   ├── deduplication.py  # 3-level deduplication engine (SimHash & URL hashing)
│   │   │   ├── ingestion/        # RSS feed parser, normalizer & batch orchestrator
│   │   │   ├── publishing.py     # Editorial status transitions & scheduled publishing worker
│   │   │   └── image_service.py  # Image processor, WebP converter & storage driver
│   │   ├── providers/            # Wire provider abstraction layer (RSSProvider, NewsAPI)
│   │   ├── workers/              # APScheduler background tasks & lifecycle manager
│   │   └── main.py               # Application factory, CORS, lifespan & DB migration startup
│   ├── tests/                    # Pytest automated test suite (16 test cases)
│   ├── requirements.txt          # Python pip dependencies
│   └── Dockerfile                # Production container specification
│
├── scripts/                      # Utility and database seed scripts
│   └── seed_database.py          # Seeds initial superadmin, categories & wire feeds
├── .github/workflows/ci.yml      # GitHub Actions CI workflow (Tests & Linting)
├── docker-compose.yml            # Multi-container local orchestration (PostgreSQL + API + Client)
├── .env.example                  # Environment configuration template
└── README.md                     # Platform documentation
```

---

## ⚙️ Environment Configuration Reference

Create a `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| **`DATABASE_URL`** | `sqlite+aiosqlite:///./news_platform.db` | Async database URL. Use `postgresql+asyncpg://user:pass@host:5432/dbname` for production. |
| **`ENVIRONMENT`** | `development` | Deployment environment (`development` or `production`). |
| **`API_V1_PREFIX`** | `/api/v1` | URL path prefix for all REST API endpoints. |
| **`SECRET_KEY`** | *(random 64-char string)* | Cryptographic key used to sign JWT session tokens. |
| **`ACCESS_TOKEN_EXPIRE_MINUTES`** | `1440` | JWT token validity window (1440 min = 24 hours). |
| **`ALLOWED_ORIGINS`** | `http://localhost:3000,http://127.0.0.1:3000` | Comma-separated CORS allowed origins for web requests. |
| **`OPENROUTER_API_KEY`** | `sk-or-v1-...` | API key from [OpenRouter.ai](https://openrouter.ai/keys). |
| **`OPENROUTER_MODEL`** | `deepseek/deepseek-chat` | LLM model identifier (e.g. `google/gemini-2.0-flash-001`). |
| **`OPENROUTER_MAX_TOKENS`** | `500` | Maximum token limit per AI synthesis call to control costs. |
| **`OPENROUTER_TEMPERATURE`** | `0.3` | LLM temperature (lower values ensure factual summaries). |
| **`ENABLE_BACKGROUND_WORKER`** | `true` | Enables or disables the embedded APScheduler background runner. |
| **`RSS_FETCH_INTERVAL_MINUTES`**| `15` | Polling interval for automated RSS wire feed ingestion. |
| **`SUPERADMIN_EMAIL`** | `admin@newsplatform.com` | Email address of the primary platform super administrator. |
| **`SUPERADMIN_PASSWORD`** | `AdminSecurePassword123!` | Initial password for the superadmin account. |
| **`SUPERADMIN_NAME`** | `Platform Administrator` | Display name of the super administrator. |
| **`STORAGE_DRIVER`** | `local` | Media storage mode: `local` (disk) or `cloudinary` (CDN). |
| **`UPLOAD_DIR`** | `./uploads` | Local disk directory for image uploads when in `local` mode. |
| **`CLOUDINARY_CLOUD_NAME`** | *(empty)* | Cloudinary cloud identifier (if using Cloudinary driver). |
| **`CLOUDINARY_API_KEY`** | *(empty)* | Cloudinary API access key. |
| **`CLOUDINARY_API_SECRET`** | *(empty)* | Cloudinary API access secret. |
| **`NEXT_PUBLIC_SITE_URL`** | `http://localhost:3000` | Public URL of the frontend application. |
| **`NEXT_PUBLIC_API_URL`** | `http://localhost:8000/api/v1` | Public backend API URL consumed by the frontend client. |
| **`NEXT_PUBLIC_SITE_NAME`** | `Chronicle News` | Brand name displayed across header, metadata & social cards. |

---

## 🚀 Local Development Quickstart

### Prerequisites
- **Node.js**: `v18.17.0+` or `v20+`
- **Python**: `3.11+` or `3.12+`
- **Git**

---

### Windows (PowerShell)

#### 1. Setup Environment
```powershell
# In project root
Copy-Item .env.example .env
```

#### 2. Backend Setup & Startup
```powershell
cd backend

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install required Python packages
pip install -r requirements.txt

# Seed initial categories, default wire feeds, and superadmin
python ..\scripts\seed_database.py

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```
- **Backend API**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/api/v1/docs`
- **ReDoc Interactive Reference**: `http://localhost:8000/api/v1/redoc`

#### 3. Frontend Setup & Startup
Open a separate PowerShell terminal:
```powershell
cd frontend

# Install Node dependencies
npm install

# Start Next.js development server
npm run dev
```
- **Public Portal**: `http://localhost:3000`
- **Admin Login**: `http://localhost:3000/admin/login`

---

### macOS / Linux (Bash)

```bash
# 1. Setup Environment
cp .env.example .env

# 2. Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 ../scripts/seed_database.py
uvicorn app.main:app --reload --port 8000 &

# 3. Frontend Setup
cd ../frontend
npm install
npm run dev
```

---

### Docker Compose Quickstart

Run the complete multi-tier stack (PostgreSQL + FastAPI Backend + Next.js Frontend) with a single command:

```bash
docker-compose up --build
```

---

### Default Superadmin Credentials

| Field | Value |
| :--- | :--- |
| **Login URL** | `http://localhost:3000/admin/login` |
| **Email** | `admin@newsplatform.com` |
| **Password** | `AdminSecurePassword123!` |

---

## 🛠️ Admin Newsroom & Editorial Workflow

Chronicle provides a zero-code editorial experience for managing breaking news:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ADMIN NEWSROOM DESK                             │
├───────────────────┬────────────────────────────────────────────────────┤
│ 📊 Dashboard      │ Real-time stats: Published, Pending, Total Views,  │
│                   │ Source health & system performance.                │
├───────────────────┼────────────────────────────────────────────────────┤
│ 📥 Review Queue   │ Review AI-synthesized wire stories:                │
│   (/admin/pending)│ - ⚡ 1-Click "Publish to Live Feed"                │
│                   │ - ✏️ Inline Story Editor (Headline, Body, Tags)    │
│                   │ - 🗑️ "Reject & Dismiss" button                     │
├───────────────────┼────────────────────────────────────────────────────┤
│ ✍️ Story Composer │ Write original staff reporting with rich text,      │
│   (/admin/create) │ media uploads, custom tags, and publication timing │
│                   │ (Publish Now / Save Draft / Schedule Release).     │
├───────────────────┼────────────────────────────────────────────────────┤
│ 📡 Wire Sources   │ Manage RSS/Atom feeds:                             │
│   (/admin/sources)│ - Add custom RSS feeds with usage & image policies │
│                   │ - 🧪 "Test Feed" parsing validation                │
│                   │ - 🔄 "Fetch Now" immediate ingestion trigger       │
├───────────────────┼────────────────────────────────────────────────────┤
│ 🖼️ Media Library  │ Upload staff photos, optimize into WebP, and tag   │
│   (/admin/media)  │ with copyright licenses & photographer credits.    │
└───────────────────┴────────────────────────────────────────────────────┘
```

---

## 🤖 Automated Ingestion, Deduplication & AI Pipeline

### 1. Ingestion Engine
Located in `backend/app/services/ingestion/`:
- Polls enabled wire sources based on `RSS_FETCH_INTERVAL_MINUTES`.
- Strips URL query tracking parameters (`utm_source`, `utm_medium`, `fbclid`, etc.).
- Sanitizes raw HTML excerpts, extracting clean plain text for AI processing.

### 2. Multi-Level Deduplication
Located in `backend/app/services/deduplication.py`:
- **Level 1 — URL Hash**: Exact match check against canonical stripped URL.
- **Level 2 — External GUID**: Matches source wire provider external identifier.
- **Level 3 — Title SimHash**: Computes 64-bit SimHash hamming distance across stories in the last 7 days to eliminate duplicate syndicated articles across different news outlets.

### 3. OpenRouter AI Synthesis
Located in `backend/app/services/ai/openrouter.py`:
- Formulates a strict JSON-schema prompt to synthesize long wire articles into:
  1. An executive 2–3 sentence overview.
  2. 3–4 bullet point key takeaways.
  3. Suggested category mapping (India, World, Tech, Business, Science, etc.).
  4. 3–5 trending keyword tags.
- **Resilience**: If the AI model fails or hits token limits, the engine gracefully falls back to a deterministic local extractive summarizer so ingestion never fails.

---

## ⚖️ Copyright, Fair Use & Attribution Safeguards

Chronicle is built to respect digital intellectual property rights and follow international Fair Use principles:

1. **Usage Policies**:
   - `METADATA_ONLY`: Only headline, original URL, and publication timestamp are ingested.
   - `SUMMARY_ALLOWED` *(Default)*: AI generates a transformative, original executive summary. Full original article text is **never** copied or stored.
   - `LICENSED_REPUBLISH`: Reserved for staff writers or syndicated partner feeds.
2. **Image Protection**:
   - Sources with image policy `NOT_ALLOWED` have external image URLs discarded automatically. The article falls back to category-themed editorial assets or staff photography.
3. **Mandatory Publisher Attribution**:
   - Every aggregated article displays a prominent attribution badge with the source name and a direct outbound link (`rel="nofollow noopener noreferrer"`) to the publisher's original article.
4. **Origin Transparency**:
   - Every story is tagged with its provenance: `ORIGINAL`, `AGGREGATED`, `AI_ASSISTED`, or `LICENSED`.

---

## ⏰ Background Workers & Task Scheduling

The background worker is managed by **APScheduler** in `backend/app/workers/`:

| Job ID | Job Name | Default Interval | Task Function | Description |
| :--- | :--- | :--- | :--- | :--- |
| `periodic_feed_ingestion` | Periodic Feed Ingestion | Every 15 minutes | `run_periodic_feed_ingestion` | Fetches enabled wire feeds, deduplicates stories, runs AI synthesis, and adds to Pending Review. |
| `periodic_scheduled_publisher`| Scheduled Article Auto-Publisher | Every 1 minute | `run_periodic_scheduled_publisher`| Queries database for articles in `scheduled` status where `scheduled_for <= NOW()` and automatically publishes them. |

### Configuring Scheduler Verbosity
APScheduler routine heartbeat logs are silenced to `WARNING` in `backend/app/main.py` so your console stays clean while preserving error alerts.

---

## 📡 REST API Documentation & Endpoint Reference

The backend provides a comprehensive, documented REST API under `/api/v1`:

### Public Endpoints

| Method | Endpoint | Description | Query Parameters / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/articles` | List published articles | `page`, `size`, `category`, `tag`, `sort`, `search` |
| `GET` | `/api/v1/articles/{slug}` | Get full article details by slug | — |
| `GET` | `/api/v1/categories` | List all active news desks/categories | — |
| `GET` | `/api/v1/tags` | List trending keyword tags | `limit` |
| `GET` | `/api/v1/sources` | List active news wire sources | — |
| `POST`| `/api/v1/auth/login` | Authenticate admin user & set JWT cookie | `{ "email": "...", "password": "..." }` |
| `GET` | `/api/v1/auth/me` | Get current authenticated user profile | *(Requires JWT Cookie or Bearer Token)* |
| `POST`| `/api/v1/auth/logout` | Clear authentication session cookie | — |

### Admin Endpoints *(Requires Admin Authentication)*

| Method | Endpoint | Description | Query Parameters / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/dashboard` | Get real-time dashboard analytics | — |
| `GET` | `/api/v1/admin/pending` | List articles in Pending Review queue | `page`, `size` |
| `POST`| `/api/v1/admin/articles` | Create a new article (draft/scheduled/published) | ArticleCreate JSON schema |
| `PUT` | `/api/v1/admin/articles/{id}` | Update article content, headline, or status | ArticleUpdate JSON schema |
| `POST`| `/api/v1/admin/articles/{id}/publish` | 1-Click fast publish an article | — |
| `POST`| `/api/v1/admin/articles/{id}/reject` | Reject/archive a story from the review queue | — |
| `DELETE`| `/api/v1/admin/articles/{id}` | Permanently delete an article | — |
| `GET` | `/api/v1/admin/sources` | List all configured RSS wire feeds | — |
| `POST`| `/api/v1/admin/sources` | Register a new RSS wire source | SourceCreate JSON schema |
| `POST`| `/api/v1/admin/sources/{id}/test` | Test parse an RSS feed URL in real time | — |
| `POST`| `/api/v1/admin/sources/{id}/fetch` | Manually trigger immediate feed ingestion | — |
| `GET` | `/api/v1/admin/images` | List media library assets | `page`, `size` |
| `POST`| `/api/v1/admin/images/upload` | Upload and optimize image asset (multipart/form-data) | File, alt text, license info |

---

## 🔍 Technical SEO, Social Sharing & Schemas

Chronicle implements modern SEO standards automatically:

- **Server-Side Rendering (SSR)**: Story pages are rendered server-side so search engine bots (Googlebot, Bingbot) receive complete semantic HTML.
- **Dynamic Metadata**: Every page dynamically compiles `<title>`, `<meta name="description">`, canonical links, and viewport tags.
- **Social Graph Sharing**: Injects OpenGraph (`og:title`, `og:image`, `og:description`, `og:type="article"`) and Twitter Card (`summary_large_image`) tags.
- **Schema.org Structured Data**: Generates JSON-LD `NewsArticle` schemas including headline, datePublished, dateModified, author, publisher, and image dimensions.
- **Dynamic Sitemap**: Automatically generated at `/sitemap.xml` mapping all published stories, category desks, and static pages.
- **Robots Directives**: Accessible at `/robots.txt` allowing indexing of public content while disallowing `/admin/*` routes.

---

## ☁️ Production Cloud Deployment Playbook

### 1. Frontend Deployment (Vercel)
1. Push your repository to GitHub.
2. Connect your repository to [Vercel](https://vercel.com).
3. Set the **Root Directory** to `frontend`.
4. Configure Environment Variables in Vercel:
   ```bash
   NEXT_PUBLIC_SITE_URL=https://your-domain.com
   NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
   NEXT_PUBLIC_SITE_NAME=Chronicle News
   ```
5. Deploy! Vercel handles global Edge CDN caching and SSL certificates.

### 2. Backend Deployment (Azure / Render / Railway)
1. Deploy the `backend` folder as a Python web service.
2. Set Build Command: `pip install -r requirements.txt`
3. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Configure Backend Environment Variables:
   ```bash
   DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:5432/<database>?ssl=require
   ENVIRONMENT=production
   SECRET_KEY=<your-64-character-random-secret>
   ALLOWED_ORIGINS=https://your-domain.com
   OPENROUTER_API_KEY=sk-or-v1-...
   ENABLE_BACKGROUND_WORKER=true
   ```

### 3. Managed Database (Azure / Neon / Supabase)
- Create a managed PostgreSQL database.
- Use connection pooler string with `postgresql+asyncpg://` driver.
- On first startup, the backend automatically verifies and creates all database tables and seeds the superadmin account.

---

## 💾 Database Backup & Disaster Recovery SOP

### PostgreSQL Automated Backup (Production)
```bash
# Export compressed binary database dump
pg_dump -h <host> -U <user> -d news_platform -F c -b -v -f ./backup_$(date +%Y%m%d_%H%M%S).dump

# Restore database dump
pg_restore -h <host> -U <user> -d news_platform -v ./backup_latest.dump
```

### SQLite Local Backup
```powershell
# Create instant snapshot of local SQLite database
Copy-Item .\news_platform.db .\news_platform_backup.db
```

---

## 💰 Cost Breakdown & Student Pack Optimization

Chronicle is architected to operate at **₹0 / $0 monthly cost** for students and developers:

| Scale Tier | Monthly Burn | Hosting & Stack Strategy |
| :--- | :--- | :--- |
| **Development (0–100 users/day)** | **₹0 / $0** | Vercel (Frontend) + Azure Student $100 / Render Free (Backend) + Neon PostgreSQL Free Tier (0.5 GB) + Student Pack Domain (`.me`/`.tech`) |
| **Small Production (100–1,000 users/day)** | **~₹50 – ₹150 ($0.60–$1.80)** | Same free infrastructure + OpenRouter Gemini Flash token usage (~500 articles/month) |
| **Growing Production (10,000+ users/day)** | **~₹3,400 – ₹6,500 ($40–$75)** | Dedicated container, Cloudflare edge caching (absorbing 95% of bandwidth), production PostgreSQL |

---

## 🧪 Testing & Quality Assurance

Chronicle includes a comprehensive automated test suite powered by Pytest.

### Running Backend Tests
```powershell
# Run all unit and integration tests
pytest backend/tests -v
```

**Test Suite Coverage**:
- `test_ai_service.py`: OpenRouter AI prompt construction, structured output parsing & fallback mechanism.
- `test_api_endpoints.py`: Public article listing, filtering, slug retrieval & pagination.
- `test_auth.py`: JWT token creation, expiration, login validation & password hashing.
- `test_media_library.py`: Image upload processing, dimension extraction & validation.
- `test_normalization_dedup.py`: URL parameter stripping, SimHash deduplication & GUID collisions.
- `test_publishing_workflow.py`: Article status transitions, scheduled publishing & editor approval.

### Running Frontend Typecheck & Build
```powershell
cd frontend
npm run build
```

---

## 📜 License & Compliance

Designed and built for compliance with international digital publishing standards, Fair Use metadata curation, and copyright preservation. Distributed under the MIT License.
