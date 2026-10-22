# ========================================================
# BookTrack Backend - Multi-Stage Dockerfile
# Author: Member 5 (Docker, Integration Testing & Documentation)
# Base: Eclipse Temurin Java 21 (LTS)
# ========================================================

# Stage 1: Build the application artifact
FROM maven:3.9.6-eclipse-temurin-21 AS builder

WORKDIR /build

# Copy Maven POM and dependency definition first for caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production jar
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal, secure JRE runtime image
FROM eclipse-temurin:21-jre-jammy

LABEL maintainer="BookTrack DevOps Team <devops@booktrack.local>"
LABEL description="BookTrack Spring Boot Library Management Backend"
LABEL version="1.0.0"

WORKDIR /app

# Run as a non-privileged user for security compliance
RUN groupadd -r booktrack && useradd -r -g booktrack booktrack

# Copy compiled jar from builder stage
COPY --from=builder /build/target/*.jar app.jar

# Adjust permissions
RUN chown -R booktrack:booktrack /app

USER booktrack

# Expose Spring Boot port (configured as 8081)
EXPOSE 8081

# JVM flags optimized for container resource management
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
