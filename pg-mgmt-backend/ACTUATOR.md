# Spring Boot Actuator Integration

## Overview
Production-ready monitoring and management endpoints powered by Spring Boot Actuator.

## Available Endpoints

### Public Endpoints (No Auth Required)
- `GET /actuator/health` - Overall health status
- `GET /actuator/health/liveness` - Kubernetes liveness probe
- `GET /actuator/health/readiness` - Kubernetes readiness probe
- `GET /actuator/info` - Application build and version info

### Protected Endpoints (HTTP Basic Auth)
- `GET /actuator/metrics` - Application metrics
- `GET /actuator/metrics/{metricName}` - Specific metric details
- `GET /actuator/prometheus` - Prometheus-formatted metrics

## Authentication

Protected endpoints use HTTP Basic authentication (separate from JWT):

```bash
# Set credentials via environment variables
export ACTUATOR_USERNAME=admin
export ACTUATOR_PASSWORD=secure-password-here

# Access protected endpoint
curl -u admin:secure-password-here http://localhost:8080/actuator/metrics