require('dotenv').config();
const mysql = require('mysql2/promise');

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT, 10) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'sonar_ai'
};

let pool = null;

async function initDatabase() {
  // 1. Connect without database to ensure the database itself exists
  const adminConn = await mysql.createConnection({
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    password: MYSQL_CONFIG.password
  });

  await adminConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${MYSQL_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await adminConn.end();

  // 2. Create connection pool bound to the database
  pool = mysql.createPool({
    host: MYSQL_CONFIG.host,
    port: MYSQL_CONFIG.port,
    user: MYSQL_CONFIG.user,
    password: MYSQL_CONFIG.password,
    database: MYSQL_CONFIG.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // 3. Create tables if they do not exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      preferences TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS detections (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NULL,
      object_class VARCHAR(100) NOT NULL,
      confidence FLOAT NULL,
      proximity_estimate INT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_detections_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS personalized_objects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      object_name VARCHAR(150) NOT NULL,
      object_class VARCHAR(100) NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_personalized_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INT PRIMARY KEY,
      speech_rate FLOAT DEFAULT 1.0,
      speech_pitch FLOAT DEFAULT 1.0,
      alert_threshold INT DEFAULT 60,
      voice_command_enabled TINYINT(1) DEFAULT 1,
      ocr_enabled TINYINT(1) DEFAULT 1,
      CONSTRAINT fk_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);

  console.log(`✅ MySQL database "${MYSQL_CONFIG.database}" initialized successfully`);
  return pool;
}

const ready = initDatabase().catch((err) => {
  console.error('❌ MySQL initialization failed:', err.message);
  console.error('   Make sure MySQL is running and check MYSQL_* variables in .env');
  throw err;
});

async function getPool() {
  if (!pool) {
    await ready;
  }
  return pool;
}

// SQLite-compatible callback wrapper backed by MySQL pool
const db = {
  ready,
  getPool,

  run(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    getPool()
      .then((p) => p.execute(sql, params))
      .then(([result]) => {
        if (callback) {
          const ctx = {
            lastID: result.insertId || 0,
            changes: result.affectedRows || 0
          };
          callback.call(ctx, null);
        }
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  },

  get(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    getPool()
      .then((p) => p.execute(sql, params))
      .then(([rows]) => {
        if (callback) callback(null, rows[0] || undefined);
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  },

  all(sql, params = [], callback) {
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    getPool()
      .then((p) => p.execute(sql, params))
      .then(([rows]) => {
        if (callback) callback(null, rows);
      })
      .catch((err) => {
        if (callback) callback(err);
      });
  }
};

module.exports = db;
