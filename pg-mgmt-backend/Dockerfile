# ============================================================================
# Multi-stage Dockerfile for PG Management Backend
# Optimized for Render.com deployment with Java 21
# ============================================================================

# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-jammy AS builder

WORKDIR /app

# Copy Gradle wrapper and build files
COPY gradlew gradlew.bat build.gradle settings.gradle ./
COPY gradle gradle/

# Copy source code
COPY src src/

# Make gradlew executable and build the application
RUN chmod +x gradlew && \
    ./gradlew clean bootJar --no-daemon

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy the built JAR from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Change ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the port (Render.com will set PORT env variable)
EXPOSE 8080

# Health check
# HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    # CMD curl -f http://localhost:${PORT:-8080}/actuator/health || exit 1

# Run the application
# Render.com provides PORT env variable, so we bind to it
ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dserver.port=${PORT:-8080}", \
    "-jar", \
    "app.jar"]