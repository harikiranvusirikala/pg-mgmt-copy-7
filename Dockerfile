# ============================================================================
# Multi-stage Dockerfile for PG Management Backend
# Optimized for Render.com deployment with Java 21
# ============================================================================

# Stage 1: Build the application
FROM eclipse-temurin:21-jdk-jammy AS builder

# Install Node.js for Angular build
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

WORKDIR /app

# Copy Gradle wrapper and build files (root level)
COPY gradlew.bat settings.gradle gradle.properties ./
COPY buildSrc buildSrc/

# Copy backend Gradle wrapper and build files
COPY pg-mgmt-backend/gradlew pg-mgmt-backend/gradlew.bat pg-mgmt-backend/build.gradle pg-mgmt-backend/
COPY pg-mgmt-backend/gradle pg-mgmt-backend/gradle/

# Copy frontend build files and dependencies first (for better caching)
COPY pg-mgmt-frontend/package*.json pg-mgmt-frontend/angular.json pg-mgmt-frontend/tsconfig*.json pg-mgmt-frontend/build.gradle pg-mgmt-frontend/
COPY pg-mgmt-frontend/src pg-mgmt-frontend/src/
COPY pg-mgmt-frontend/public pg-mgmt-frontend/public/

# Copy backend source code
COPY pg-mgmt-backend/src pg-mgmt-backend/src/
COPY src src/

# Make gradlew executable and build the application
# The build will automatically trigger frontend build due to dependencies
RUN chmod +x pg-mgmt-backend/gradlew && \
    cd pg-mgmt-backend && \
    ./gradlew clean bootJar --no-daemon

# Stage 2: Runtime image
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy the built JAR from builder stage
COPY --from=builder /app/pg-mgmt-backend/build/libs/*.jar app.jar

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