BookTrack - Docker Setup and Integration Testing

1. Overview

This document describes how to run the BookTrack backend and MySQL database using Docker Compose and how to verify the book management REST APIs.

2. Technologies

Java 21

Spring Boot

Maven

MySQL 8.4

Docker and Docker Compose

REST API testing using curl

3. Docker Architecture

The application uses two containers:

Backend: Runs the Spring Boot application on port 8081.

Database: Runs MySQL 8.4 on port 3306 inside Docker and maps it to host port 3307.

The backend connects to MySQL using the Docker Compose service name db.

4. Docker Files

Dockerfile: Builds and packages the backend application using Java 21.

docker-compose.yml: Defines the backend and MySQL services, ports, database credentials, persistent volume, and health check.

.dockerignore: Excludes unnecessary files from the Docker build context.

.env: Stores the local database password. Keep this file private and never commit it to Git.

5. Prerequisites

Install and start Docker Desktop. Ensure that the project is available locally and the .env file contains the required DB_PASSWORD value.

Run the commands from the project root directory.

6. Start the Application

Validate the Docker Compose configuration:

docker compose config --quiet

Build the image and start the containers:

docker compose up -d --build

Check the container status:

docker compose ps

Expected result: the backend is running and MySQL reports a healthy status.

View backend logs if needed:

docker compose logs backend

7. Integration Testing

The following tests were executed against the running Dockerized application.

Test 1: Create a book

curl -i -X POST http://localhost:8081/api/books -H "Content-Type: application/json" -d "{\"title\":\"Docker Fundamentals\",\"author\":\"Test Author\",\"isbn\":\"9781234567890\",\"quantity\":5,\"availableCopies\":5}"

Actual result: 201 Created. The API returned the newly created book with ID 1.

Test 2: Retrieve all books

curl -i http://localhost:8081/api/books

Actual result: 200 OK. The API returned the saved book in a JSON array.

Test 3: Retrieve a book by ID

curl -i http://localhost:8081/api/books/1

Actual result: 200 OK. The API returned the matching book.

Test 4: Search books by keyword

curl -i "http://localhost:8081/api/books/search?keyword=Docker"

Actual result: 200 OK. The API returned the matching book.

Test 5: Update a book

curl -i -X PUT http://localhost:8081/api/books/1 -H "Content-Type: application/json" -d "{\"title\":\"Docker and Kubernetes\",\"author\":\"Test Author\",\"isbn\":\"9781234567890\",\"quantity\":5,\"availableCopies\":4}"

Actual result: 200 OK. The API returned the updated book.

A subsequent GET request confirmed that the updated title and available-copy count persisted.

Test 6: Delete a book

curl -i -X DELETE http://localhost:8081/api/books/1

Actual result: 204 No Content. The API successfully deleted the test book.

Test 7: Verify deletion

curl -i http://localhost:8081/api/books

Actual result: 200 OK, with an empty JSON array ([]).

8. Test Results

Test

Result

Docker Compose configuration validation

Passed

MySQL container health check

Passed

Create book

Passed

Retrieve all books

Passed

Retrieve book by ID

Passed

Search by keyword

Passed

Update book

Passed

Verify updated data persists

Passed

Delete book

Passed

Verify deletion

Passed

These results demonstrate successful end-to-end book API operations using the backend and MySQL containers.

9. Troubleshooting

MySQL is not healthy: Check database logs using docker compose logs db.

Backend fails to start: Check docker compose logs backend.

Port 8081 is already in use: Stop the conflicting process or adjust the port configuration consistently.

Database password is missing: Confirm that .env exists in the project root and contains DB_PASSWORD with a local development password.

Configuration errors: Run docker compose config --quiet before starting the services.

10. Stop the Application

Stop and remove the containers and network:

docker compose down

The named database volume is retained. Do not use docker compose down -v unless you intentionally want to remove the persistent database volume and its data.

11. Security Notes

Keep .env private and excluded from Git.

Do not use a local development password in production.

Use appropriate secrets management and database permissions in production.

12. Scope and Limitations

The tests documented here cover the book REST API against the Dockerized Spring Boot and MySQL services. They do not establish that student registration, book issuing, book returns, or the frontend have been tested.