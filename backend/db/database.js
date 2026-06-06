const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(
  path.join(__dirname, 'librarium.sqlite')
);

db.pragma('foreign_keys = ON');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS authors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      bio TEXT,
      birth_year INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      genre TEXT,
      year INTEGER,
      isbn TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(author_id) REFERENCES authors(id) ON DELETE CASCADE
    );
  `);

  const admin = db
    .prepare('SELECT id FROM users WHERE username = ?')
    .get('admin');

  if (!admin) {
    const hash = bcrypt.hashSync('admin123', 10);

    db.prepare(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
    ).run(
      'admin',
      hash,
      'admin'
    );
  }

  console.log('✅ Database initialized');
}

function getDb() {
  return db;
}

module.exports = {
  getDb,
  initDb
};