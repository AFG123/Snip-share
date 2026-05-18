# SnipShare

SnipShare is a full-stack pastebin-style app for sharing code/text snippets with short links.

It includes:
- **Node.js + Express + PostgreSQL** backend
- **React + Vite + Tailwind CSS** frontend
- Features like expiry, password protection, burn-after-read, raw view, download toggle, manage token links, and rate limiting.

---

## Features

- Create snippets with:
  - Language
  - Expiry (preset + custom hours)
  - Optional password protection
  - Burn after read
  - Download toggle
  - Optional title + note
- Short URL viewer route (`/:shortId`)
- Raw endpoint (`/api/snippets/:shortId/raw`)
- Password verification endpoint
- Manage endpoints (token-based):
  - Get snippet stats/details
  - Delete snippet
- View count tracking
- Burn-after-read destruction tracking
- Expired snippet cleanup cron job (every 15 minutes)
- API rate limiting:
  - Create snippet: 10/hour per IP
  - Password verify: 5 attempts/15 minutes per IP

---

## Project Structure

```text
snipshare/
├── backend/
│   ├── app.js
│   ├── .env.example
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── migrations/
│       ├── routes/
│       ├── services/
│       └── utils/
└── frontend/
    ├── index.html
    ├── favicon.svg
    ├── vercel.json
    └── src/
        ├── api/
        ├── components/
        ├── pages/
        └── utils/
```

---

## Local Setup

## 1) Backend

```bash
cd backend
npm install
```

Create `.env` in `backend/` (based on `.env.example`):

```env
DATABASE_URL=your_postgres_connection_string
PORT=3000
NODE_ENV=development
```

Optional (used for URL generation in API response):

```env
FRONTEND_BASE_URL=http://localhost:5173
BACKEND_BASE_URL=http://localhost:3000
```

Run backend:

```bash
npm run dev
```

---

## 2) Frontend

```bash
cd frontend
npm install
```

Create `.env` in `frontend/`:

```env
VITE_API_URL=http://localhost:3000
```

Run frontend:

```bash
npm run dev
```

---

## API Endpoints

Base: `/api/snippets`

- `POST /`
  - Create snippet
- `GET /:shortId`
  - Get snippet (or protected/destroyed/expired state)
- `GET /:shortId/raw`
  - Get plain text content
- `POST /:shortId/verify`
  - Verify password and return snippet content
- `GET /manage/:token`
  - Get manage details (`content`, `created_at`, `expiry_at`, `view_count`)
- `DELETE /manage/:token`
  - Delete snippet via manage token

Postman collection is available at:

`backend/SnipShare.postman_collection.json`

---

## SQL Notes

If your DB schema was created manually, ensure `snippets` contains required columns used by the app (for example):

- `short_id`
- `manage_token`
- `content`
- `language`
- `title`
- `note`
- `password_hash`
- `expiry_at`
- `burn_after_read`
- `download_enabled`
- `view_count`
- `created_at`

Migration file for title/note:

`backend/src/migrations/add_title_note.sql`

---

## Deployment Notes

- **Frontend (Vercel)** uses SPA rewrite config in `frontend/vercel.json`.
- **Backend** can be deployed on Render/Node hosting.
- Use NeonDB (or any Postgres) via `DATABASE_URL`.

---

## Tech Stack

- **Backend:** Express, pg, bcrypt, express-rate-limit, node-cron, cors
- **Frontend:** React, React Router, Vite, Tailwind CSS, highlight.js

