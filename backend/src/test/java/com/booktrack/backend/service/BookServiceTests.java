package com.booktrack.backend.service;

import com.booktrack.backend.entity.Book;
import com.booktrack.backend.repository.BookRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class BookServiceTests {

    @Autowired
    private BookService bookService;

    @Autowired
    private BookRepository bookRepository;

    @BeforeEach
    void cleanDatabase() {
        bookRepository.deleteAll();
    }

    @Test
    void shouldAddAndRetrieveBook() {
        Book book = new Book(
                "Java Programming",
                "James Gosling",
                "9781234567890",
                10,
                10
        );

        Book savedBook = bookService.addBook(book);

        assertNotNull(savedBook.getId());
        assertEquals("Java Programming", savedBook.getTitle());

        Optional<Book> foundBook =
                bookService.getBookById(savedBook.getId());

        assertTrue(foundBook.isPresent());
        assertEquals("James Gosling", foundBook.get().getAuthor());
    }

    @Test
    void shouldUpdateBook() {
        Book original = bookService.addBook(
                new Book("Java Basics", "Author One",
                        "1111111111111", 10, 10)
        );

        Book updatedDetails = new Book(
                "Advanced Java",
                "Author One",
                "1111111111111",
                10,
                8
        );

        Book updated = bookService.updateBook(
                original.getId(), updatedDetails
        );

        assertEquals("Advanced Java", updated.getTitle());
        assertEquals(8, updated.getAvailableCopies());
    }

    @Test
    void shouldDeleteBook() {
        Book saved = bookService.addBook(
                new Book("Test Book", "Test Author",
                        "2222222222222", 5, 5)
        );

        Long id = saved.getId();

        bookService.deleteBook(id);

        assertFalse(bookService.getBookById(id).isPresent());
    }

    @Test
    void shouldSearchBooksByTitleOrAuthor() {
        bookService.addBook(
                new Book("Java Fundamentals", "Alice Smith",
                        "3333333333333", 5, 5)
        );

        bookService.addBook(
                new Book("Programming Guide", "Java Experts",
                        "4444444444444", 4, 4)
        );

        List<Book> results = bookService.searchBooks("java");

        assertEquals(2, results.size());
    }
}