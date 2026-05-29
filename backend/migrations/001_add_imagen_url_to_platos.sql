-- Migration: Add imagen_url column to platos
-- Run with: mysql -u <user> -p < database

ALTER TABLE platos
  ADD COLUMN imagen_url VARCHAR(255) NULL AFTER precio;

-- Rollback (if needed):
-- ALTER TABLE platos DROP COLUMN imagen_url;
