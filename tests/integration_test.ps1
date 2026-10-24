# ========================================================
# BookTrack - PowerShell Integration Test Suite
# Author: Member 5 (Docker, Integration Testing & Documentation)
# ========================================================

param (
    [string]$BaseUrl = "http://localhost:8081/api"
)

$ErrorActionPreference = "Stop"
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting BookTrack Integration Tests against $BaseUrl" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Condition ($condition, $message) {
    if ($condition) {
        Write-Host " [PASS] $message" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host " [FAIL] $message" -ForegroundColor Red
        $script:failed++
    }
}

try {
    # 1. Add Book
    Write-Host "`n--> Testing 1: Add Book" -ForegroundColor Yellow
    $newBook = @{
        title = "DevOps Handbook: How to Create World-Class Agility"
        author = "Gene Kim, Jez Humble"
        isbn = "9781942788003"
        category = "DevOps"
        quantity = 4
        availableCopies = 4
    } | ConvertTo-Json

    $book = Invoke-RestMethod -Uri "$BaseUrl/books" -Method Post -Body $newBook -ContentType "application/json"
    Assert-Condition ($null -ne $book.id) "Book created with ID: $($book.id)"
    $bookId = $book.id

    # 2. View Books and Search
    Write-Host "`n--> Testing 2: View and Search Books" -ForegroundColor Yellow
    $allBooks = Invoke-RestMethod -Uri "$BaseUrl/books" -Method Get
    Assert-Condition ($allBooks.Count -gt 0) "Retrieved $($allBooks.Count) books"

    $search = Invoke-RestMethod -Uri "$BaseUrl/books/search?keyword=Handbook" -Method Get
    Assert-Condition ($search.Count -ge 1) "Search query found matched book"

    # 3. Update Book
    Write-Host "`n--> Testing 3: Update Book" -ForegroundColor Yellow
    $updatedBookData = @{
        title = "DevOps Handbook (Second Edition)"
        author = "Gene Kim, Jez Humble, Patrick Debois"
        isbn = "9781942788003"
        category = "DevOps & Cloud"
        quantity = 5
        availableCopies = 5
    } | ConvertTo-Json

    $updatedBook = Invoke-RestMethod -Uri "$BaseUrl/books/$bookId" -Method Put -Body $updatedBookData -ContentType "application/json"
    Assert-Condition ($updatedBook.title -eq "DevOps Handbook (Second Edition)") "Book title updated successfully"

    # 4. Register Student
    Write-Host "`n--> Testing 4: Student Registration" -ForegroundColor Yellow
    $rand = Get-Random -Minimum 1000 -Maximum 9999
    $studentData = @{
        name = "Test Student $rand"
        email = "test.student$rand@university.edu"
        department = "Computer Science"
    } | ConvertTo-Json

    $student = Invoke-RestMethod -Uri "$BaseUrl/students" -Method Post -Body $studentData -ContentType "application/json"
    Assert-Condition ($null -ne $student.id) "Student registered with ID: $($student.id)"
    $studentId = $student.id

    # 5. Issue Book (Check availability decrements)
    Write-Host "`n--> Testing 5: Issue Book and Verify Availability Decrement" -ForegroundColor Yellow
    $dueDate = (Get-Date).AddDays(14).ToString("yyyy-MM-dd")
    $issueData = @{
        bookId = $bookId
        studentId = $studentId
        dueDate = $dueDate
    } | ConvertTo-Json

    $loan = Invoke-RestMethod -Uri "$BaseUrl/borrow-records/issue" -Method Post -Body $issueData -ContentType "application/json"
    Assert-Condition ($null -ne $loan.id) "Book issued with loan ID: $($loan.id)"
    $loanId = $loan.id

    $bookAfterIssue = Invoke-RestMethod -Uri "$BaseUrl/books/$bookId" -Method Get
    Assert-Condition ($bookAfterIssue.availableCopies -eq 4) "Book availability decremented from 5 to 4"

    # 6. Return Book (Check availability increments)
    Write-Host "`n--> Testing 6: Return Book and Verify Availability Increment" -ForegroundColor Yellow
    $returnRecord = Invoke-RestMethod -Uri "$BaseUrl/borrow-records/$loanId/return" -Method Post
    Assert-Condition ($returnRecord.status -eq "RETURNED") "Loan marked as RETURNED"

    $bookAfterReturn = Invoke-RestMethod -Uri "$BaseUrl/books/$bookId" -Method Get
    Assert-Condition ($bookAfterReturn.availableCopies -eq 5) "Book availability incremented back to 5"

    # 7. Delete Book
    Write-Host "`n--> Testing 7: Delete Book" -ForegroundColor Yellow
    $delResponse = Invoke-WebRequest -Uri "$BaseUrl/books/$bookId" -Method Delete
    Assert-Condition ($delResponse.StatusCode -eq 204) "Book deleted with HTTP 204"

    Write-Host "`n========================================================" -ForegroundColor Cyan
    Write-Host " INTEGRATION TEST SUMMARY" -ForegroundColor Cyan
    Write-Host " Passed: $passed | Failed: $failed" -ForegroundColor Green
    Write-Host "========================================================" -ForegroundColor Cyan

} catch {
    Write-Host "`n[ERROR] An error occurred during test execution: $_" -ForegroundColor Red
    Write-Host "Ensure the Spring Boot backend is active at $BaseUrl" -ForegroundColor Yellow
}
