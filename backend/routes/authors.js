// routes/authors.js
const express = require('express');
const { getDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/authors
router.get('/', (req, res) => {
  const db = getDb();
  const authors = db.prepare(`
    SELECT a.*, COUNT(b.id) as book_count
    FROM authors a
    LEFT JOIN books b ON b.author_id = a.id
    GROUP BY a.id
    ORDER BY a.name
  `).all();
  res.json(authors);
});

// GET /api/authors/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!author) return res.status(404).json({ error: 'Author not found' });
  const books = db.prepare('SELECT * FROM books WHERE author_id = ?').all(author.id);
  res.json({ ...author, books });
});

// POST /api/authors
router.post('/', (req, res) => {
  const { name, bio, birth_year } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO authors (name, bio, birth_year) VALUES (?, ?, ?)'
  ).run(name.trim(), bio || null, birth_year || null);

  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(author);
});

// PUT /api/authors/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Author not found' });

  const { name, bio, birth_year } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

  db.prepare(
    'UPDATE authors SET name = ?, bio = ?, birth_year = ? WHERE id = ?'
  ).run(name.trim(), bio || null, birth_year || null, req.params.id);

  const updated = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// DELETE /api/authors/:id  (cascades to books via FK)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const author = db.prepare('SELECT * FROM authors WHERE id = ?').get(req.params.id);
  if (!author) return res.status(404).json({ error: 'Author not found' });

  const bookCount = db.prepare('SELECT COUNT(*) as c FROM books WHERE author_id = ?').get(req.params.id).c;
  db.prepare('DELETE FROM authors WHERE id = ?').run(req.params.id);

  res.json({ message: `Author and ${bookCount} book(s) deleted`, deletedBooks: bookCount });
});

module.exports = router;
