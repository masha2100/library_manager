# 📚 Librarium — Library Manager

A full-stack web application for managing a library collection with books and authors.

**Stack:** HTML · CSS · Vanilla JS (ES modules) · Node.js · Express.js · SQLite (better-sqlite3) · JWT Auth

---

## ✨ Features

| # | Feature |
|---|---------|
| 1 | Add, view, update, delete books |
| 2 | Filter books by title, author, genre |
| 3 | Sort books by title, author, year |
| 4 | Add, edit, delete authors |
| 5 | Deleting an author cascades to their books |
| 6 | Export book list as **CSV** or **JSON** |
| 7 | JWT-based login / logout |
| 8 | Auto-login from stored token |
| 9 | Live stats dashboard (total, available, checked-out, authors) |

---

## 🗂️ Project Structure

```
librarium/
├── backend/
│   ├── db/
│   │   └── database.js        # SQLite init + seed data
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── routes/
│   │   ├── auth.js            # POST /login, POST /logout, GET /me
│   │   ├── books.js           # Full CRUD + filter + export
│   │   └── authors.js         # Full CRUD
│   ├── server.js              # Express entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── js/
│   │   ├── api.js             # Fetch wrapper + token helpers
│   │   └── app.js             # UI logic, events, rendering
│   └── index.html             # Single-page app shell
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### 1 — Clone & install backend dependencies

```bash
git clone https://github.com/your-username/librarium.git
cd librarium/backend
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET to a long random string
```

### 3 — Start the backend

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The API will be available at **http://localhost:3001**

The database file `backend/db/librarium.sqlite` is created automatically on first run with seed data.

### 4 — Open the frontend

The backend serves the `frontend/` folder as static files.  
Open **http://localhost:3001** in your browser.

**Default credentials:** `admin` / `admin123`

> For local development you can also open `frontend/index.html` directly with VS Code Live Server (port 5500). Make sure `FRONTEND_ORIGIN=http://localhost:5500` is set in `.env`.

---

## 📡 API Reference

All endpoints (except `/api/auth/login` and `/api/health`) require:
```
Authorization: Bearer <token>
```

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | `{ username, password }` → `{ token, user }` |
| POST | `/api/auth/logout` | Invalidates session (client must discard token) |
| GET  | `/api/auth/me` | Returns current user from token |

### Books

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/books` | List books. Query: `search`, `author_id`, `genre`, `sort`, `status` |
| GET    | `/api/books/stats` | Returns counts: total, available, checked_out, authors |
| GET    | `/api/books/export` | Download. Query: `format=csv\|json` |
| GET    | `/api/books/:id` | Single book |
| POST   | `/api/books` | Create book |
| PUT    | `/api/books/:id` | Update book |
| DELETE | `/api/books/:id` | Delete book |

**Book body fields:**
```json
{
  "title": "1984",
  "author_id": 1,
  "genre": "Dystopian",
  "year": 1949,
  "isbn": "978-0-452-28423-4",
  "status": "available",
  "description": "A dystopian novel."
}
```

### Authors

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/authors` | List all authors (with `book_count`) |
| GET    | `/api/authors/:id` | Single author with their books |
| POST   | `/api/authors` | Create author |
| PUT    | `/api/authors/:id` | Update author |
| DELETE | `/api/authors/:id` | Delete author + all their books (CASCADE) |

---

## 🗃️ Database Schema

```sql
users   (id, username, password[bcrypt], role, created_at)
authors (id, name, bio, birth_year, created_at)
books   (id, title, author_id→authors, genre, year, isbn,
         status['available'|'checked_out'], description, created_at)
```

Foreign keys are enforced: deleting an author cascades to their books.

---

## 📦 Git Commit History

The repository follows this commit structure (see **COMMITS.md** for full messages):

```
feat: initial project scaffold and .gitignore
feat(db): SQLite schema, seed data, database init
feat(auth): JWT middleware, login/logout/me endpoints
feat(authors): full CRUD routes for authors
feat(books): full CRUD + search/filter + CSV/JSON export
feat(frontend): HTML/CSS app shell with Librarium design system
feat(frontend): API module with fetch wrapper and token helpers
feat(frontend): books page – list, add, edit, delete, view
feat(frontend): authors page – grid, add, edit, delete
feat(frontend): stats dashboard, export buttons, auto-login
docs: README with setup instructions and API reference
```

---

## 🛠️ Tech Decisions

- **better-sqlite3** — synchronous SQLite driver, zero config, perfect for a single-user library app
- **bcryptjs** — password hashing (pure JS, no native build needed)
- **jsonwebtoken** — stateless JWT auth, 8h expiry
- **No bundler** — ES module `<script type="module">` keeps the frontend zero-dependency and framework-free
- **Export** — real file download via a signed URL with the JWT as a query param

---

## 🔒 Security Notes

- Change `JWT_SECRET` in `.env` before deploying
- The seed password `admin123` should be changed for any real deployment
- CORS is locked to `FRONTEND_ORIGIN` in production

---

## 📝 License

MIT
