
package com.booktrack.backend.service;

import com.booktrack.backend.entity.Book;
import com.booktrack.backend.entity.BorrowRecord;
import com.booktrack.backend.entity.Student;

import com.booktrack.backend.repository.BookRepository;
import com.booktrack.backend.repository.BorrowRecordRepository;
import com.booktrack.backend.repository.StudentRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BorrowRecordServiceTests {

    @Autowired
    private BorrowRecordService borrowRecordService;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private BorrowRecordRepository borrowRecordRepository;

    @BeforeEach
    void cleanDatabase() {
        borrowRecordRepository.deleteAll();
        studentRepository.deleteAll();
        bookRepository.deleteAll();
    }

    private Book createBook(int quantity, int availableCopies) {
        return bookRepository.save(
                new Book(
                        "Java Test Book",
                        "Test Author",
                        "1234567890123",
                        quantity,
                        availableCopies
                )
        );
    }

    private Student createStudent() {
        return studentRepository.save(
                new Student(
                        "Test Student",
                        "borrowing.test@example.com",
                        "CSE"
                )
        );
    }

    @Test
    void issueBookShouldDecreaseAvailableCopies() {
        Book book = createBook(5, 5);
        Student student = createStudent();

        BorrowRecord record = borrowRecordService.issueBook(
                book.getId(),
                student.getId(),
                LocalDate.now().plusDays(14)
        );

        assertNotNull(record.getId());
        assertEquals("ISSUED", record.getStatus());
        assertEquals(LocalDate.now(), record.getIssueDate());
        assertNull(record.getReturnDate());

        Book updatedBook =
                bookRepository.findById(book.getId()).orElseThrow();

        assertEquals(4, updatedBook.getAvailableCopies());
    }

    @Test
    void returnBookShouldRestoreAvailableCopies() {
        Book book = createBook(5, 5);
        Student student = createStudent();

        BorrowRecord issued = borrowRecordService.issueBook(
                book.getId(),
                student.getId(),
                LocalDate.now().plusDays(14)
        );

        BorrowRecord returned =
                borrowRecordService.returnBook(issued.getId());

        assertEquals("RETURNED", returned.getStatus());
        assertEquals(LocalDate.now(), returned.getReturnDate());

        Book updatedBook =
                bookRepository.findById(book.getId()).orElseThrow();

        assertEquals(5, updatedBook.getAvailableCopies());
    }

    @Test
    void secondReturnShouldBeRejected() {
        Book book = createBook(5, 5);
        Student student = createStudent();

        BorrowRecord issued = borrowRecordService.issueBook(
                book.getId(),
                student.getId(),
                LocalDate.now().plusDays(14)
        );

        borrowRecordService.returnBook(issued.getId());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> borrowRecordService.returnBook(issued.getId())
        );

        assertEquals(409, exception.getStatusCode().value());

        Book updatedBook =
                bookRepository.findById(book.getId()).orElseThrow();

        assertEquals(5, updatedBook.getAvailableCopies());
    }

    @Test
    void issueShouldFailWhenNoCopiesAreAvailable() {
        Book book = createBook(5, 0);
        Student student = createStudent();

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> borrowRecordService.issueBook(
                        book.getId(),
                        student.getId(),
                        LocalDate.now().plusDays(14)
                )
        );

        assertEquals(409, exception.getStatusCode().value());

        Book unchangedBook =
                bookRepository.findById(book.getId()).orElseThrow();

        assertEquals(0, unchangedBook.getAvailableCopies());
    }
}
