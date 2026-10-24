#!/usr/bin/env python3
"""
BookTrack - Automated End-to-End Integration Testing Suite
Author: Member 5 (Docker, Integration Testing & Documentation)

Verifies all 7 core functional requirements:
 1. Add Book
 2. View Books & Search
 3. Update Book
 4. Delete Book
 5. Student Registration
 6. Issue Book (Verifying availability decrement)
 7. Return Book (Verifying availability increment)

Usage:
    python tests/integration_tests.py [http://localhost:8081/api]
"""

import sys
import json
import urllib.request
import urllib.error
from datetime import date, timedelta

BASE_URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081/api"

class TestRunner:
    def __init__(self, base_url):
        self.base_url = base_url.rstrip('/')
        self.passed = 0
        self.failed = 0

    def log_step(self, title):
        print(f"\n========================================================")
        print(f"  RUNNING TEST: {title}")
        print(f"========================================================")

    def assert_equal(self, actual, expected, message):
        if actual == expected:
            print(f"  [PASS] {message}: expected '{expected}', got '{actual}'")
            self.passed += 1
        else:
            print(f"  [FAIL] {message}: expected '{expected}', got '{actual}'")
            self.failed += 1

    def request(self, path, method="GET", body=None):
        url = f"{self.base_url}{path}"
        headers = {"Content-Type": "application/json"}
        data = json.dumps(body).encode('utf-8') if body is not None else None
        req = urllib.request.Request(url, data=data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                status = resp.status
                raw = resp.read().decode('utf-8')
                res_body = json.loads(raw) if raw else None
                return status, res_body
        except urllib.error.HTTPError as e:
            raw = e.read().decode('utf-8')
            res_body = json.loads(raw) if raw.startswith('{') or raw.startswith('[') else raw
            return e.code, res_body
        except urllib.error.URLError as e:
            print(f"\n[FATAL] Could not connect to {url}: {e.reason}")
            print(f"Ensure the Spring Boot backend is running at {self.base_url}")
            sys.exit(1)

    def run(self):
        print(f"Starting BookTrack Integration Test against target: {self.base_url}\n")

        # ----------------------------------------------------
        # TEST 1: Add a New Book
        # ----------------------------------------------------
        self.log_step("1. Add a New Book")
        new_book = {
            "title": "Site Reliability Engineering: How Google Runs Production Systems",
            "author": "Niall Richard Murphy et al.",
            "isbn": "9781491929124",
            "category": "DevOps",
            "quantity": 5,
            "availableCopies": 5
        }
        status, book = self.request("/books", method="POST", body=new_book)
        self.assert_equal(status, 201, "HTTP Status for Add Book")
        book_id = book.get("id") if isinstance(book, dict) else None
        self.assert_equal(isinstance(book_id, int), True, "Book ID generated")

        # ----------------------------------------------------
        # TEST 2: View Books & Search
        # ----------------------------------------------------
        self.log_step("2. View All Books & Search by Keyword")
        status, books = self.request("/books")
        self.assert_equal(status, 200, "HTTP Status for View All Books")
        self.assert_equal(isinstance(books, list) and len(books) > 0, True, "Books list returned")

        status, search_res = self.request("/books/search?keyword=Reliability")
        self.assert_equal(status, 200, "HTTP Status for Search Books")
        self.assert_equal(isinstance(search_res, list) and len(search_res) >= 1, True, "Search query matched book")

        # ----------------------------------------------------
        # TEST 3: Update Book
        # ----------------------------------------------------
        self.log_step("3. Update Book Details")
        updated_payload = {
            "title": "Site Reliability Engineering (Updated Edition)",
            "author": "Niall Richard Murphy et al.",
            "isbn": "9781491929124",
            "category": "Cloud & DevOps",
            "quantity": 6,
            "availableCopies": 6
        }
        status, updated_book = self.request(f"/books/{book_id}", method="PUT", body=updated_payload)
        self.assert_equal(status, 200, "HTTP Status for Update Book")
        self.assert_equal(updated_book.get("title"), updated_payload["title"], "Updated book title matched")

        # ----------------------------------------------------
        # TEST 4: Student Registration
        # ----------------------------------------------------
        self.log_step("4. Register a New Student")
        import random
        rand_suffix = random.randint(1000, 9999)
        new_student = {
            "name": f"Integration Test Student {rand_suffix}",
            "email": f"test.student{rand_suffix}@university.edu",
            "department": "Computer Science"
        }
        status, student = self.request("/students", method="POST", body=new_student)
        self.assert_equal(status, 201, "HTTP Status for Register Student")
        student_id = student.get("id") if isinstance(student, dict) else None
        self.assert_equal(isinstance(student_id, int), True, "Student ID generated")

        # ----------------------------------------------------
        # TEST 5: Issue Book (Verify Availability Decreases)
        # ----------------------------------------------------
        self.log_step("5. Issue Book to Student & Verify Availability Decrement")
        due_date = (date.today() + timedelta(days=14)).isoformat()
        issue_payload = {
            "bookId": book_id,
            "studentId": student_id,
            "dueDate": due_date
        }
        status, loan_record = self.request("/borrow-records/issue", method="POST", body=issue_payload)
        self.assert_equal(status, 201, "HTTP Status for Issue Book")
        loan_id = loan_record.get("id") if isinstance(loan_record, dict) else None
        self.assert_equal(isinstance(loan_id, int), True, "Borrow Record ID generated")

        # Check book availability dropped from 6 to 5
        status, book_after_issue = self.request(f"/books/{book_id}")
        self.assert_equal(book_after_issue.get("availableCopies"), 5, "Book available copies decremented by 1")

        # ----------------------------------------------------
        # TEST 6: Return Book (Verify Availability Increases)
        # ----------------------------------------------------
        self.log_step("6. Return Book & Verify Availability Increment")
        status, return_record = self.request(f"/borrow-records/{loan_id}/return", method="POST")
        self.assert_equal(status, 200, "HTTP Status for Return Book")
        self.assert_equal(return_record.get("status"), "RETURNED", "Borrow record status marked as RETURNED")

        # Check book availability returned back to 6
        status, book_after_return = self.request(f"/books/{book_id}")
        self.assert_equal(book_after_return.get("availableCopies"), 6, "Book available copies incremented back to original")

        # ----------------------------------------------------
        # TEST 7: Delete Book
        # ----------------------------------------------------
        self.log_step("7. Delete Book Option")
        status, _ = self.request(f"/books/{book_id}", method="DELETE")
        self.assert_equal(status, 204, "HTTP Status for Delete Book (204 No Content)")

        # Verify book is no longer found
        status, _ = self.request(f"/books/{book_id}")
        self.assert_equal(status, 404, "Deleted book returns 404 Not Found")

        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------
        print(f"\n========================================================")
        print(f"  INTEGRATION TEST SUMMARY")
        print(f"========================================================")
        print(f"  Total Assertions Passed: {self.passed}")
        print(f"  Total Assertions Failed: {self.failed}")
        if self.failed == 0:
            print(f"\n  >>> ALL 7 CORE FUNCTIONAL CRITERIA VERIFIED SUCCESSFULLY! <<<\n")
            return 0
        else:
            print(f"\n  >>> INTEGRATION SUITE FINISHED WITH {self.failed} FAILURES <<<\n")
            return 1

if __name__ == "__main__":
    runner = TestRunner(BASE_URL)
    exit_code = runner.run()
    sys.exit(exit_code)
