-- ========================================================
-- BookTrack – Library Management System
-- Database Setup and Initialization Script
-- Author: Member 3 (Database Management) & Member 5 (Docker Integration)
-- Database: MySQL 8.0+
-- ========================================================

CREATE DATABASE IF NOT EXISTS `booktrack_db`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `booktrack_db`;

-- --------------------------------------------------------
-- Table structure for `books`
-- --------------------------------------------------------
DROP TABLE IF EXISTS `borrow_records`;
DROP TABLE IF EXISTS `students`;
DROP TABLE IF EXISTS `books`;

CREATE TABLE `books` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(150) NOT NULL,
  `author` VARCHAR(100) NOT NULL,
  `isbn` VARCHAR(20) NOT NULL,
  `category` VARCHAR(60) DEFAULT 'General',
  `quantity` INT NOT NULL DEFAULT 1,
  `available_copies` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  CONSTRAINT `chk_quantity_non_negative` CHECK (`quantity` >= 0),
  CONSTRAINT `chk_available_non_negative` CHECK (`available_copies` >= 0),
  CONSTRAINT `chk_available_le_quantity` CHECK (`available_copies` <= `quantity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `students`
-- --------------------------------------------------------
CREATE TABLE `students` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `department` VARCHAR(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_student_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `borrow_records`
-- --------------------------------------------------------
CREATE TABLE `borrow_records` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `book_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `issue_date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `return_date` DATE DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
  PRIMARY KEY (`id`),
  KEY `fk_borrow_book` (`book_id`),
  KEY `fk_borrow_student` (`student_id`),
  CONSTRAINT `fk_borrow_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_borrow_student` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Sample Data Insertion
-- --------------------------------------------------------
INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `category`, `quantity`, `available_copies`) VALUES
(1, 'Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', '9780132350884', 'Computer Science', 8, 7),
(2, 'The Pragmatic Programmer', 'Andrew Hunt & David Thomas', '9780201616224', 'Computer Science', 5, 4),
(3, 'Design Patterns: Elements of Reusable Object-Oriented Software', 'Erich Gamma et al.', '9780201633610', 'Software Engineering', 6, 6),
(4, 'Introduction to Algorithms (CLRS)', 'Thomas H. Cormen', '9780262033848', 'Algorithms', 10, 8),
(5, 'Continuous Delivery: Reliable Software Releases', 'Jez Humble & David Farley', '9780321601919', 'DevOps', 4, 3),
(6, 'Spring in Action (6th Edition)', 'Craig Walls', '9781617297571', 'Technology', 7, 7);

INSERT INTO `students` (`id`, `name`, `email`, `department`) VALUES
(1, 'Aarav Sharma', 'aarav.sharma@university.edu', 'Computer Science'),
(2, 'Diya Patel', 'diya.patel@university.edu', 'Information Technology'),
(3, 'Rohan Verma', 'rohan.verma@university.edu', 'Electronics & Comm.'),
(4, 'Ananya Iyer', 'ananya.iyer@university.edu', 'Computer Science');

INSERT INTO `borrow_records` (`id`, `book_id`, `student_id`, `issue_date`, `due_date`, `return_date`, `status`) VALUES
(1, 1, 1, DATE_SUB(CURRENT_DATE, INTERVAL 5 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 9 DAY), NULL, 'ISSUED'),
(2, 2, 2, DATE_SUB(CURRENT_DATE, INTERVAL 10 DAY), DATE_ADD(CURRENT_DATE, INTERVAL 4 DAY), NULL, 'ISSUED'),
(3, 4, 3, DATE_SUB(CURRENT_DATE, INTERVAL 20 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 6 DAY), NULL, 'OVERDUE'),
(4, 5, 4, DATE_SUB(CURRENT_DATE, INTERVAL 14 DAY), DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), CURRENT_DATE, 'RETURNED');
