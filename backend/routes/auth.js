const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { getDb } = require('../db/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    const db = getDb();

    const user = db
      .prepare('SELECT * FROM users WHERE username = ?')
      .get(username);

    if (!user) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    const validPassword = bcrypt.compareSync(
      password,
      user.password
    );

    if (!validPassword) {
      return res.status(401).json({
        error: 'Invalid username or password'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '8h'
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    message: 'Logged out successfully'
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = router;