-- Sonar AI Assistant — MySQL Database Schema
CREATE DATABASE IF NOT EXISTS sonar_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sonar_ai;

-- Users table (for signups and logins)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  preferences TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Detections log table
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
) ENGINE=InnoDB;

-- Personalization table (face/object memory)
CREATE TABLE IF NOT EXISTS personalized_objects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  object_name VARCHAR(150) NOT NULL,
  object_class VARCHAR(100) NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_personalized_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Settings table
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
) ENGINE=InnoDB;
