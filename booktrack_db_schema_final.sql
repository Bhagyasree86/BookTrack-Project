-- BookTrack schema agreed with Member 2
-- MySQL 8.0+
-- Fresh setup schema only. Do not run over an existing database as a migration.

CREATE DATABASE IF NOT EXISTS booktrack_db;
USE booktrack_db;

CREATE TABLE IF NOT EXISTS books (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    category VARCHAR(60),
    quantity INT NOT NULL DEFAULT 0,
    available_copies INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_books_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_books_available CHECK (
        available_copies >= 0 AND available_copies <= quantity
    )
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS students (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS borrow_records (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    book_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
    KEY idx_borrow_book_id (book_id),
    KEY idx_borrow_student_id (student_id),
    KEY idx_borrow_status (status),
    CONSTRAINT chk_borrow_status CHECK (status IN ('ISSUED', 'RETURNED')),
    CONSTRAINT chk_borrow_dates CHECK (due_date >= issue_date),
    CONSTRAINT fk_borrow_book
        FOREIGN KEY (book_id) REFERENCES books(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_borrow_student
        FOREIGN KEY (student_id) REFERENCES students(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Member 2: map Book.availableCopies to available_copies:
-- @Column(name = "available_copies")
-- private int availableCopies;
--
-- Issue/return stock updates belong in Spring Boot transactional service methods.
