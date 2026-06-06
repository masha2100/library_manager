// routes/books.js
const express = require('express');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/books?search=&author_id=&genre=&sort=&status=
router.get('/', (req, res) => {
  const { search = '', author_id = '', genre = '', sort = 'title', status = '' } = req.query;

  let sql = `
    SELECT b.*, a.name as author_name
    FROM books b
    LEFT JOIN authors a ON a.id = b.author_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (LOWER(b.title) LIKE ? OR LOWER(a.name) LIKE ?)';
    params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
  }
  if (author_id) { sql += ' AND b.author_id = ?'; params.push(author_id); }
  if (genre)     { sql += ' AND LOWER(b.genre) = ?'; params.push(genre.toLowerCase()); }
  if (status)    { sql += ' AND b.status = ?'; params.push(status); }

  const sortMap = { title: 'b.title ASC', author: 'a.name ASC', year: 'b.year DESC', id: 'b.id DESC' };
  sql += ` ORDER BY ${sortMap[sort] || 'b.title ASC'}`;

  const books = getDb().prepare(sql).all(...params);
  res.json(books);
});

// GET /api/books/export?format=csv|json
router.get('/export', (req, res) => {
  const { format = 'csv', author_id = '', genre = '', status = '' } = req.query;
  let sql = `
    SELECT b.id, b.title, a.name as author, b.genre, b.year, b.isbn, b.status, b.description
    FROM books b
    LEFT JOIN authors a ON a.id = b.author_id
    WHERE 1=1
  `;
  const params = [];
  if (author_id) { sql += ' AND b.author_id = ?'; params.push(author_id); }
  if (genre)     { sql += ' AND LOWER(b.genre) = ?'; params.push(genre.toLowerCase()); }
  if (status)    { sql += ' AND b.status = ?'; params.push(status); }
  sql += ' ORDER BY b.title ASC';

  const books = getDb().prepare(sql).all(...params);

  if (format === 'json') {
    res.setHeader('Content-Disposition', 'attachment; filename="librarium-books.json"');
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(books, null, 2));
  }

  // CSV
  const headers = ['id', 'title', 'author', 'genre', 'year', 'isbn', 'status', 'description'];
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [headers.join(','), ...books.map(b => headers.map(h => escape(b[h])).join(','))];
  res.setHeader('Content-Disposition', 'attachment; filename="librarium-books.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send(rows.join('\r\n'));
});

// GET /api/books/stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const total   = db.prepare('SELECT COUNT(*) as c FROM books').get().c;
  const avail   = db.prepare("SELECT COUNT(*) as c FROM books WHERE status='available'").get().c;
  const checked = db.prepare("SELECT COUNT(*) as c FROM books WHERE status='checked_out'").get().c;
  const authors = db.prepare('SELECT COUNT(*) as c FROM authors').get().c;
  const genres  = db.prepare('SELECT COUNT(DISTINCT genre) as c FROM books WHERE genre IS NOT NULL').get().c;
  res.json({ total, available: avail, checked_out: checked, authors, genres });
});

// GET /api/books/:id
router.get('/:id', (req, res) => {
  const book = getDb().prepare(`
    SELECT b.*, a.name as author_name FROM books b
    LEFT JOIN authors a ON a.id = b.author_id WHERE b.id = ?
  `).get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

// POST /api/books
router.post('/', (req, res) => {
  const { title, author_id, genre, year, isbn, status = 'available', description } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!author_id)              return res.status(400).json({ error: 'Author is required' });

  const db = getDb();
  const author = db.prepare('SELECT id FROM authors WHERE id = ?').get(author_id);
  if (!author) return res.status(400).json({ error: 'Author not found' });

  const result = db.prepare(`
    INSERT INTO books (title, author_id, genre, year, isbn, status, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title.trim(), author_id, genre || null, year || null, isbn || null, status, description || null);

  const book = db.prepare(`
    SELECT b.*, a.name as author_name FROM books b
    LEFT JOIN authors a ON a.id = b.author_id WHERE b.id = ?
  `).get(result.lastInsertRowid);
  res.status(201).json(book);
});

// PUT /api/books/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Book not found' });

  const { title, author_id, genre, year, isbn, status, description } = req.body;
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  if (!author_id)              return res.status(400).json({ error: 'Author is required' });

  db.prepare(`
    UPDATE books SET title=?, author_id=?, genre=?, year=?, isbn=?, status=?, description=?
    WHERE id=?
  `).run(title.trim(), author_id, genre || null, year || null, isbn || null,
         status || 'available', description || null, req.params.id);

  const book = db.prepare(`
    SELECT b.*, a.name as author_name FROM books b
    LEFT JOIN authors a ON a.id = b.author_id WHERE b.id = ?
  `).get(req.params.id);
  res.json(book);
});

// DELETE /api/books/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
  res.json({ message: 'Book deleted' });
});

module.exports = router;
