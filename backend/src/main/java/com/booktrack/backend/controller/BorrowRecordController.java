
package com.booktrack.backend.controller;

import com.booktrack.backend.entity.BorrowRecord;
import com.booktrack.backend.service.BorrowRecordService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/borrow-records")
@CrossOrigin(origins = "*")
public class BorrowRecordController {

    private final BorrowRecordService borrowRecordService;

    public BorrowRecordController(
            BorrowRecordService borrowRecordService) {
        this.borrowRecordService = borrowRecordService;
    }

    // Issue a book to a student
    @PostMapping("/issue")
    public ResponseEntity<BorrowRecord> issueBook(
            @Valid @RequestBody IssueBookRequest request) {

        BorrowRecord record = borrowRecordService.issueBook(
                request.getBookId(),
                request.getStudentId(),
                request.getDueDate()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(record);
    }

    // Return a borrowed book
    @PostMapping("/{id}/return")
    public ResponseEntity<BorrowRecord> returnBook(
            @PathVariable Long id) {

        BorrowRecord record =
                borrowRecordService.returnBook(id);

        return ResponseEntity.ok(record);
    }

    // Get all borrowing records
    @GetMapping
    public List<BorrowRecord> getAllRecords() {
        return borrowRecordService.getAllRecords();
    }

    // Get borrowing records for a student
    @GetMapping("/student/{studentId}")
    public List<BorrowRecord> getRecordsByStudent(
            @PathVariable Long studentId) {

        return borrowRecordService.getRecordsByStudent(studentId);
    }

    // Get one borrowing record
    @GetMapping("/{id}")
    public ResponseEntity<BorrowRecord> getRecordById(
            @PathVariable Long id) {

        return ResponseEntity.ok(
                borrowRecordService.getRecordById(id));
    }

    // Request body for issuing a book
    public static class IssueBookRequest {

        @NotNull(message = "Book ID is required")
        private Long bookId;

        @NotNull(message = "Student ID is required")
        private Long studentId;

        @NotNull(message = "Due date is required")
        private LocalDate dueDate;

        public IssueBookRequest() {
        }

        public Long getBookId() {
            return bookId;
        }

        public void setBookId(Long bookId) {
            this.bookId = bookId;
        }

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public LocalDate getDueDate() {
            return dueDate;
        }

        public void setDueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
        }
    }
}
