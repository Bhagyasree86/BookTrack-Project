
package com.booktrack.backend.service;

import com.booktrack.backend.entity.Book;
import com.booktrack.backend.entity.BorrowRecord;
import com.booktrack.backend.entity.Student;

import com.booktrack.backend.repository.BookRepository;
import com.booktrack.backend.repository.BorrowRecordRepository;
import com.booktrack.backend.repository.StudentRepository;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

@Service
public class BorrowRecordService {

    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final BorrowRecordRepository borrowRecordRepository;

    public BorrowRecordService(
            BookRepository bookRepository,
            StudentRepository studentRepository,
            BorrowRecordRepository borrowRecordRepository) {

        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
        this.borrowRecordRepository = borrowRecordRepository;
    }

    // Issue a book to a student
    @Transactional
    public BorrowRecord issueBook(
            Long bookId,
            Long studentId,
            LocalDate dueDate) {

        LocalDate today = LocalDate.now();

        if (dueDate == null || dueDate.isBefore(today)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Due date cannot be before the issue date"
            );
        }

        // Lock the book row to prevent conflicting availability updates
        Book book = bookRepository.findByIdForUpdate(bookId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Book not found"));

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Student not found"));

        if (book.getAvailableCopies() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No copies of this book are available"
            );
        }

        // Decrease available copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepository.save(book);

        // Create the borrowing record
        BorrowRecord record = new BorrowRecord();
        record.setBook(book);
        record.setStudent(student);
        record.setIssueDate(today);
        record.setDueDate(dueDate);
        record.setReturnDate(null);
        record.setStatus("ISSUED");

        return borrowRecordRepository.save(record);
    }

    // Return a borrowed book
    @Transactional
    public BorrowRecord returnBook(Long borrowRecordId) {

        // Lock the borrowing record to prevent duplicate returns
        BorrowRecord record =
                borrowRecordRepository.findByIdForUpdate(borrowRecordId)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Borrowing record not found"
                        ));

        if (!"ISSUED".equals(record.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This book has already been returned"
            );
        }

        Long bookId = record.getBook().getId();

        // Lock the book while updating availability
        Book book = bookRepository.findByIdForUpdate(bookId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Book not found"
                ));

        if (book.getAvailableCopies() >= book.getQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Available copies cannot exceed total quantity"
            );
        }

        // Restore the available copy
        book.setAvailableCopies(book.getAvailableCopies() + 1);
        bookRepository.save(book);

        // Mark the borrowing record as returned
        record.setBook(book);
        record.setReturnDate(LocalDate.now());
        record.setStatus("RETURNED");

        return borrowRecordRepository.save(record);
    }

    // Retrieve all borrowing records
    @Transactional(readOnly = true)
    public List<BorrowRecord> getAllRecords() {
        return borrowRecordRepository.findAll();
    }

    // Retrieve borrowing records for one student
    @Transactional(readOnly = true)
    public List<BorrowRecord> getRecordsByStudent(Long studentId) {

        if (!studentRepository.existsById(studentId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Student not found"
            );
        }

        return borrowRecordRepository.findByStudent_Id(studentId);
    }

    // Retrieve a borrowing record by ID
    @Transactional(readOnly = true)
    public BorrowRecord getRecordById(Long id) {
        return borrowRecordRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Borrowing record not found"
                ));
    }
}
