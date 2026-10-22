-- BookTrack existing-database migration
-- MySQL 8.0.46
-- Run ONLY against the existing booktrack_db after confirming the backup exists.
-- This migration preserves rows and changes IDs/FKs from INT to BIGINT.
-- DDL statements auto-commit in MySQL; the separate backup is important.

USE booktrack_db;

-- 1. Drop the current foreign keys so referenced key types can be changed.
ALTER TABLE borrow_records
    DROP FOREIGN KEY fk_borrow_book,
    DROP FOREIGN KEY fk_borrow_student;

-- 2. Change parent primary keys and borrowing primary/foreign key columns.
ALTER TABLE books
    MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;

ALTER TABLE students
    MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT;

ALTER TABLE borrow_records
    MODIFY COLUMN id BIGINT NOT NULL AUTO_INCREMENT,
    MODIFY COLUMN book_id BIGINT NOT NULL,
    MODIFY COLUMN student_id BIGINT NOT NULL;

-- 3. Restore the foreign-key relationships.
ALTER TABLE borrow_records
    ADD CONSTRAINT fk_borrow_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    ADD CONSTRAINT fk_borrow_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE RESTRICT;

-- 4. Verify the resulting column types.
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'booktrack_db'
  AND (
      (TABLE_NAME IN ('books', 'students') AND COLUMN_NAME = 'id')
      OR
      (TABLE_NAME = 'borrow_records'
       AND COLUMN_NAME IN ('id', 'book_id', 'student_id'))
  )
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 5. Verify foreign keys are present.
SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'booktrack_db'
  AND TABLE_NAME = 'borrow_records'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY COLUMN_NAME;

-- 6. Verify record counts are still present.
SELECT 'books' AS table_name, COUNT(*) AS total_records FROM books
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'borrow_records', COUNT(*) FROM borrow_records;
