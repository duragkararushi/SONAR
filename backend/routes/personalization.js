const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Add personalized object
router.post('/add', auth, (req, res) => {
  const { object_name, object_class } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO personalized_objects (user_id, object_name, object_class) VALUES (?, ?, ?)',
    [userId, object_name, object_class],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save personalized object' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get personalized objects
router.get('/', auth, (req, res) => {
  const userId = req.user.id;

  db.all(
    'SELECT * FROM personalized_objects WHERE user_id = ? ORDER BY added_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch personalized objects' });
      }
      res.json(rows);
    }
  );
});

// Delete personalized object
router.delete('/:id', auth, (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;

  db.run(
    'DELETE FROM personalized_objects WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Object not found' });
      }
      res.json({ success: true });
    }
  );
});

module.exports = router;
