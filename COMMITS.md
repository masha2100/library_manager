# 📋 Git Commit Guide — Librarium

Покрокова інструкція для правильного git-workflow проекту Librarium.  
Використовує [Conventional Commits](https://www.conventionalcommits.org/).

---

## Формат коміту

```
<type>(<scope>): <короткий опис>

[тіло — необов'язково]

[footer — необов'язково, напр. Closes #12]
```

**Типи:** `feat` · `fix` · `refactor` · `docs` · `chore` · `test` · `style`

---

## Покрокові коміти

### Крок 1 — Ініціалізація репозиторію

```bash
git init
git branch -M main
```

**Коміт:**
```
chore: initial repository setup

- Add .gitignore (node_modules, .env, *.sqlite, .DS_Store)
- Create top-level project structure: backend/ and frontend/
```

```bash
git add .gitignore
git commit -m "chore: initial repository setup

- Add .gitignore
- Create project directory structure"
```

---

### Крок 2 — Backend: package.json і залежності

```bash
cd backend
npm install
```

**Коміт:**
```
chore(backend): add package.json with express dependencies

Dependencies: express, better-sqlite3, bcryptjs, jsonwebtoken, cors
DevDependencies: nodemon
```

```bash
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): add package.json with express dependencies

- express ^4.18
- better-sqlite3 ^9.4 (sync SQLite driver)
- bcryptjs ^2.4 (password hashing)
- jsonwebtoken ^9.0 (JWT auth)
- cors ^2.8
- nodemon for dev auto-reload"
```

---

### Крок 3 — База даних

```bash
git add backend/db/database.js
git commit -m "feat(db): SQLite schema, init function, and seed data

- Create users, authors, books tables with FK constraints
- Enable WAL mode and foreign_keys pragma
- Seed admin user (admin/admin123 bcrypt hash)
- Seed 3 authors and 4 sample books on first run"
```

---

### Крок 4 — JWT Middleware

```bash
git add backend/middleware/auth.js
git commit -m "feat(auth): add JWT bearer token middleware

- Validate Authorization: Bearer <token> header
- Attach decoded user to req.user
- Return 401 for missing or invalid tokens
- JWT_SECRET read from process.env with safe default"
```

---

### Крок 5 — Auth routes

```bash
git add backend/routes/auth.js
git commit -m "feat(auth): login, logout, and /me endpoints

POST /api/auth/login  - validates credentials, returns JWT (8h expiry)
POST /api/auth/logout - protected, client should discard token
GET  /api/auth/me     - returns current user from token"
```

---

### Крок 6 — Authors routes

```bash
git add backend/routes/authors.js
git commit -m "feat(authors): full CRUD REST API for authors

GET    /api/authors        - list all with book_count
GET    /api/authors/:id    - single author with books array
POST   /api/authors        - create (name required)
PUT    /api/authors/:id    - update
DELETE /api/authors/:id    - delete + cascade books via FK"
```

---

### Крок 7 — Books routes

```bash
git add backend/routes/books.js
git commit -m "feat(books): full CRUD + search/filter + CSV/JSON export

GET /api/books         - list with ?search, author_id, genre, sort, status
GET /api/books/stats   - total, available, checked_out, authors counts
GET /api/books/export  - real file download, format=csv|json
GET /api/books/:id     - single book with author_name
POST/PUT/DELETE        - create, update, delete

Validation: title and author_id required; status enum check in schema"
```

---

### Крок 8 — Express server entry point

```bash
git add backend/server.js backend/.env.example
git commit -m "feat(backend): Express server with CORS, static file serving

- Mount /api/auth, /api/books, /api/authors routers
- Serve frontend/ as static files (production)
- SPA fallback: non-API routes serve index.html
- GET /api/health endpoint
- .env.example with PORT, JWT_SECRET, FRONTEND_ORIGIN"
```

---

### Крок 9 — Frontend: index.html (app shell + design)

```bash
git add frontend/index.html
git commit -m "feat(frontend): Librarium HTML/CSS app shell

- Login screen with preview panel
- Sidebar navigation (Books / Authors)
- Topbar with Export CSV/JSON buttons
- Books page: stats cards, toolbar with search+filters, table
- Authors page: responsive card grid
- Modal/overlay system
- Toast notifications
- Full Librarium design system (CSS variables, Geist font)
- Responsive animations (fadeUp, slideUp, toastIn)"
```

---

### Крок 10 — Frontend: API module

```bash
git add frontend/js/api.js
git commit -m "feat(frontend): API module with fetch wrapper and token helpers

- Centralized request() with auto Bearer header injection
- Token/user stored in localStorage (lib_token, lib_user)
- Named exports: auth, books, authors
- books.exportUrl() for download link generation
- Proper error propagation from API JSON error field"
```

---

### Крок 11 — Frontend: app.js (повний UI)

```bash
git add frontend/js/app.js
git commit -m "feat(frontend): complete UI logic in app.js (ES module)

Books:
- renderBooks() with live search/filter/sort via API
- openAddBook(), editBook(), deleteBook(), viewBook()
- Event delegation on tbody for view/edit/delete actions
- Debounced search input (220ms)

Authors:
- renderAuthors() with card grid
- openAddAuthor(), editAuthor(), deleteAuthor()
- Cascade warning shows book count before deletion

Auth:
- login/logout with JWT storage
- Auto-login on page load (verifies token with /me)
- Clears stored token on 401

Shared:
- openModal() / closeModal() (window-scoped for inline onclick)
- toast(msg, type) notifications
- updateStats() polls /books/stats
- refreshAuthorFilter() keeps dropdown in sync
- doExport() triggers file download with auth token"
```

---

### Крок 12 — Документація

```bash
git add README.md COMMITS.md
git commit -m "docs: add README with setup guide and full API reference

- Prerequisites, install steps, .env setup
- Running backend (dev and production)
- API reference table for auth, books, authors
- Database schema documentation
- Tech decisions and security notes
- Git commit history overview"
```

---

## Повна послідовність команд

```bash
# 1. Init
git init && git branch -M main

# 2. Package
git add backend/package.json backend/package-lock.json
git commit -m "chore(backend): add package.json with express dependencies"

# 3. DB
git add backend/db/
git commit -m "feat(db): SQLite schema, init function, and seed data"

# 4. Middleware
git add backend/middleware/
git commit -m "feat(auth): add JWT bearer token middleware"

# 5. Auth routes
git add backend/routes/auth.js
git commit -m "feat(auth): login, logout, and /me endpoints"

# 6. Authors routes
git add backend/routes/authors.js
git commit -m "feat(authors): full CRUD REST API for authors"

# 7. Books routes
git add backend/routes/books.js
git commit -m "feat(books): full CRUD + search/filter + CSV/JSON export"

# 8. Server
git add backend/server.js backend/.env.example
git commit -m "feat(backend): Express server with CORS and static file serving"

# 9. HTML
git add frontend/index.html
git commit -m "feat(frontend): Librarium HTML/CSS app shell"

# 10. API module
git add frontend/js/api.js
git commit -m "feat(frontend): API module with fetch wrapper and token helpers"

# 11. App logic
git add frontend/js/app.js
git commit -m "feat(frontend): complete UI logic in app.js"

# 12. Docs
git add README.md COMMITS.md .gitignore
git commit -m "docs: README with setup instructions and API reference"

# Push до GitHub
git remote add origin https://github.com/YOUR_USERNAME/librarium.git
git push -u origin main
```

---

## Поради

- Не роби `git add .` одразу — додавай файли логічними групами (по одній фічі за раз).
- Перевіряй `git status` і `git diff --staged` перед кожним комітом.
- Використовуй `git log --oneline` щоб бачити красиву історію.
- Якщо треба виправити останній коміт: `git commit --amend`.
