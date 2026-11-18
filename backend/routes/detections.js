const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Save detection log
router.post('/', auth, (req, res) => {
  const { object_class, confidence, proximity_estimate } = req.body;
  const userId = req.user.id;

  db.run(
    'INSERT INTO detections (user_id, object_class, confidence, proximity_estimate) VALUES (?, ?, ?, ?)',
    [userId, object_class, confidence, proximity_estimate],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to save detection' });
      }
      res.status(201).json({ id: this.lastID });
    }
  );
});

// Get recent detections
router.get('/recent', auth, (req, res) => {
  const userId = req.user.id;
  const limit = req.query.limit || 50;

  db.all(
    'SELECT * FROM detections WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?',
    [userId, limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch detections' });
      }
      res.json(rows);
    }
  );
});

// Get detection statistics
router.get('/stats', auth, (req, res) => {
  const userId = req.user.id;

  db.get(
    `SELECT 
      COUNT(*) as total,
      AVG(confidence) as avg_confidence,
      AVG(proximity_estimate) as avg_proximity,
      object_class as most_common
    FROM detections 
    WHERE user_id = ? 
    GROUP BY object_class 
    ORDER BY COUNT(*) DESC 
    LIMIT 1`,
    [userId],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }
      res.json(stats || { total: 0 });
    }
  );
});

module.exports = router;

