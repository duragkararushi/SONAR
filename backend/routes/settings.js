const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get user settings
router.get('/', auth, (req, res) => {
  const userId = req.user.id;

  db.get(
    'SELECT * FROM user_settings WHERE user_id = ?',
    [userId],
    (err, settings) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch settings' });
      }
      if (!settings) {
        db.run(
          'INSERT INTO user_settings (user_id) VALUES (?)',
          [userId],
          () => {
            db.get(
              'SELECT * FROM user_settings WHERE user_id = ?',
              [userId],
              (err, newSettings) => {
                res.json(newSettings);
              }
            );
          }
        );
      } else {
        res.json(settings);
      }
    }
  );
});

// Update settings
router.put('/', auth, (req, res) => {
  const userId = req.user.id;
  const { speech_rate, speech_pitch, alert_threshold, voice_command_enabled, ocr_enabled } = req.body;

  db.run(
    `UPDATE user_settings 
     SET speech_rate = COALESCE(?, speech_rate),
         speech_pitch = COALESCE(?, speech_pitch),
         alert_threshold = COALESCE(?, alert_threshold),
         voice_command_enabled = COALESCE(?, voice_command_enabled),
         ocr_enabled = COALESCE(?, ocr_enabled)
     WHERE user_id = ?`,
    [speech_rate, speech_pitch, alert_threshold, voice_command_enabled, ocr_enabled, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update settings' });
      }
      res.json({ success: true, updated: this.changes > 0 });
    }
  );
});

module.exports = router;
