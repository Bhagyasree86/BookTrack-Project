
package com.booktrack.backend.repository;

import com.booktrack.backend.entity.BorrowRecord;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface BorrowRecordRepository
        extends JpaRepository<BorrowRecord, Long> {

    // Get borrowing records for a particular student
    List<BorrowRecord> findByStudent_Id(Long studentId);

    // Get records by status, such as ISSUED or RETURNED
    List<BorrowRecord> findByStatus(String status);

    // Lock a borrowing record while processing a return
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT br FROM BorrowRecord br WHERE br.id = :id")
    Optional<BorrowRecord> findByIdForUpdate(@Param("id") Long id);
}
