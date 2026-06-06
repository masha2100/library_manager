// server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb } = require('./db/database');

const authRoutes    = require('./routes/auth');
const booksRoutes   = require('./routes/books');
const authorsRoutes = require('./routes/authors');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || '*' }));
app.use(express.json());

// Serve static frontend from /public in production
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/books',   booksRoutes);
app.use('/api/authors', authorsRoutes);

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// SPA fallback – send index.html for any non-API route
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  } else {
    res.status(404).json({ error: 'Route not found' });
  }
});

// ── Start ────────────────────────────────────────────────────────────────────
initDb();
app.listen(PORT, () => {
  console.log(`🚀 Librarium API running on http://localhost:${PORT}`);
});

module.exports = app;
