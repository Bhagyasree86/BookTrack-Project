# BookTrack — Library Management System

A full-stack library management system built with **Java, Spring Boot, MySQL, HTML, CSS, and JavaScript**, with Docker-based containerization and Jenkins continuous integration.

## 1. Project Overview

BookTrack helps manage a library’s book catalogue, student records, and book borrowing and returning activities. It provides a web-based interface backed by REST APIs and a relational database.

### Key Features

- View and search the book catalogue.
- Add, update, and delete books.
- Register and view students.
- Issue books to registered students.
- Record book returns and update available copies.
- Display library information through a dashboard.
- Store application data in MySQL.
- Run the frontend, backend, and database using Docker Compose.
- Build and test the backend automatically through Jenkins.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript |
| Web server | Nginx |
| Backend | Java 21, Spring Boot |
| API style | REST |
| Database | MySQL 8.0 |
| Persistence | Spring Data JPA / Hibernate |
| Build tool | Maven |
| Version control | Git and GitHub |
| CI and automated testing | Jenkins |
| Containerization | Docker and Docker Compose |

## 3. Project Architecture

```text
User / Web Browser
        |
        v
Frontend — Nginx
localhost:3000
        |
        v
Spring Boot REST API
localhost:8081
        |
        v
MySQL Database
localhost:3307
```

Docker Compose starts the frontend, backend, and database as separate containers. Inside the Docker network, the backend connects to MySQL using the service hostname `mysql` and port `3306`.

## 4. Repository Structure

```text
BookTrack-Project/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   └── test/
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   └── Dockerfile
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
├── database/
│   └── schema.sql
├── docker-compose.yml
├── Jenkinsfile
├── .gitignore
└── README.md
```

*Confirm that each listed file or folder exists in the final GitHub repository.*

## 5. Prerequisites

For the Docker-based setup:

- Git
- Docker Desktop with Docker Compose
- An internet connection for the initial image and dependency downloads

For running the backend directly on the computer:

- Java 21
- MySQL 8.0
- Maven, or the included Maven Wrapper

## 6. Run the Project with Docker

### Step 1: Clone the repository

```bash
git clone https://github.com/Bhagyasree86/BookTrack-Project.git
cd BookTrack-Project
```

### Step 2: Start Docker Desktop

Wait until Docker Desktop reports that its engine is running.

### Step 3: Build and start the services

```bash
docker compose up -d --build
```

This command builds the application images and starts the containers.

### Step 4: Verify the running containers

```bash
docker compose ps
```

Check that the frontend and backend are running and that MySQL is healthy.

### Step 5: Open the application

| Service | URL |
|---|---|
| BookTrack frontend | http://localhost:3000 |
| Backend books API | http://localhost:8081/api/books |
| MySQL from host tools | `localhost:3307` |
| Jenkins, when running locally | http://localhost:9090 |

The Jenkins URL is available only if Jenkins is installed and running on the local machine.

### Stop the application

```bash
docker compose down
```

The named MySQL volume is retained, so database data can persist across ordinary container shutdowns.

**Warning:** `docker compose down -v` also removes the Compose-managed volume and can delete the stored database data. Use it only when you intentionally want to reset the database.

## 7. Run the Backend Without Docker

1. Install Java 21 and MySQL.
2. Create the `booktrack_db` database and initialize its schema if required.
3. Configure the datasource in `backend/src/main/resources/application.properties`.
4. Set the `DB_PASSWORD` environment variable to your local MySQL password.
5. Open a terminal in the `backend` directory.
6. Run:

```bash
./mvnw spring-boot:run
```

On Windows Command Prompt:

```bat
mvnw.cmd spring-boot:run
```

The local backend is configured to use port `8081`. Ensure that the required database is running and that the port is available.

For a direct local run, use the local MySQL configuration. When running through Docker Compose, the backend must use the Docker database hostname `mysql`, not `localhost`.

## 8. REST API Endpoints

The backend exposes REST APIs for managing books, students, and borrowing records. The following table describes the expected resource operations; confirm the exact mappings against the controller classes before submission.

### Books

Base path: `/api/books`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/books` | Retrieve all books |
| GET | `/api/books/{id}` | Retrieve a book by ID, if implemented |
| POST | `/api/books` | Add a book |
| PUT | `/api/books/{id}` | Update a book |
| DELETE | `/api/books/{id}` | Delete a book |

Example request to add a book:

```http
POST /api/books
Content-Type: application/json
```

```json
{
  "title": "Java Programming",
  "author": "James Gosling",
  "isbn": "9781234567890",
  "quantity": 10,
  "availableCopies": 10,
  "category": "Computer Science"
}
```

Example request to update a book:

```http
PUT /api/books/1
Content-Type: application/json
```

```json
{
  "title": "Java Programming",
  "author": "James Gosling",
  "isbn": "9781234567890",
  "quantity": 10,
  "availableCopies": 8,
  "category": "Computer Science"
}
```

### Students

Base path: `/api/students`

Document the operations actually implemented in `StudentController.java`. The intended operations include registering a student and retrieving student records.

### Borrowing and Returns

Base path: `/api/borrow-records`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/borrow-records` | Retrieve borrowing records, if implemented |
| POST | `/api/borrow-records/issue` | Issue a book |
| POST | `/api/borrow-records/{id}/return` | Record a book return |

Example issue request:

```http
POST /api/borrow-records/issue
Content-Type: application/json
```

```json
{
  "bookId": 1,
  "studentId": 1,
  "dueDate": "2026-11-01"
}
```

Use IDs that exist in the database. The API should validate the selected book and student and maintain the available-copy count.

**API note:** Confirm exact endpoint mappings, request fields, response formats, and HTTP status codes in the controller classes before treating this section as the final API specification.

## 9. Database

BookTrack uses MySQL to store library information.

The database used by the application is `booktrack_db`.

Core entities include:

- **Book:** title, author, ISBN, category, total quantity, and available copies.
- **Student:** student registration details.
- **Borrow record:** book and student references, issue date, due date, return date, and borrowing status.

The project uses Spring Data JPA and Hibernate for persistence. The Docker Compose configuration initializes the database using `database/schema.sql`, and the backend uses the MySQL service inside the Compose network.

### Database configuration

Do not commit real passwords or sensitive credentials. Use environment variables or an untracked local configuration file for secrets.

The Docker Compose credentials are intended for local academic development and should be replaced with secure credentials before any public deployment.

## 10. Docker Configuration

The `docker-compose.yml` file defines three services:

| Service | Container purpose | Host port |
|---|---|---|
| `frontend` | Nginx serving the web interface | `3000` |
| `backend` | Spring Boot REST API | `8081` |
| `mysql` | MySQL database | `3307` |

Docker Compose provides service-to-service networking, persistent database storage through a named volume, and a MySQL health check so that the backend can wait for the database to become healthy.

Useful commands:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql
docker compose down
```

## 11. Jenkins Continuous Integration

BookTrack uses Jenkins with a version-controlled `Jenkinsfile`.

The `BookTrack-CI` pipeline checks out the GitHub repository and runs the backend Maven verification command:

```bat
mvnw.cmd -B clean verify
```

This command compiles the backend and runs its configured tests.

### Verified result

In the verified Jenkins build:

- **9 tests ran**
- **0 failures**
- **0 errors**
- **Build status: SUCCESS**

The successful run demonstrates automated backend build and test validation. Docker deployment is managed separately through Docker Compose; do not describe it as an automated Jenkins deployment unless that pipeline functionality is added and tested.

## 12. Testing

The backend includes automated tests for application startup and book and borrowing service behavior.

To run the tests locally from the `backend` directory:

```bash
./mvnw clean verify
```

On Windows:

```bat
mvnw.cmd clean verify
```

Manual verification should also cover:

- Listing, adding, updating, and deleting books.
- Registering and listing students.
- Issuing a book to a valid student.
- Returning an issued book.
- Updating available copies after issue and return.
- Confirming the frontend reflects the latest backend data.
- Starting and stopping all Docker services successfully.

## 13. Team Contributions

Replace the placeholders with the actual names of the members and adjust the descriptions to match the work each person completed.

| Team member | Contribution |
|---|---|
| Member 1 —  | Frontend interface, layout, forms, and user interactions |
| Member 2 —  | Backend REST APIs and book-management functionality |
| Member 3 —  | Student and borrowing functionality, database support, or assigned backend tasks |
| Member 4 —  | Backend integration, testing, and CI workflow support |
| Member 5 —  | Docker configuration, integration verification, and documentation |

The team collaborated through GitHub to share code, review changes, and integrate individual contributions. Jenkins was used to verify the backend build and automated tests.

## 14. Future Enhancements

Possible future improvements include:

- User authentication and role-based access.
- Search, filtering, and pagination.
- Fine calculation and overdue-book notifications.
- More comprehensive API and integration tests.
- Secure environment-specific configuration.
- Cloud deployment and monitoring.
- A fuller automated CI/CD pipeline.

## 15. Repository

GitHub: https://github.com/Bhagyasree86/BookTrack-Project

BookTrack demonstrates full-stack application development, REST API integration, relational database management, Git-based collaboration, containerization, and automated backend testing using Jenkins.
