# PG Manager Backend

Spring Boot 3 service that powers the PG Manager platform. It secures Google OAuth sign-in for tenants and admins, aggregates dashboard metrics, and exposes REST APIs for rooms, tenants, and allocation reporting. MongoDB is used for persistence and Micrometer Prometheus metrics power observability.

## ✨ Features
- Google OAuth → JWT authentication for tenants and administrators.
- REST endpoints for room setup, tenant lifecycle, and occupancy analytics.
- Scheduled allocation snapshots feeding the admin dashboard.
- Prometheus-ready metrics and Spring Boot Actuator health endpoints.

## 🔧 Prerequisites
- **Java** 21 (managed via Gradle toolchain).
- **MongoDB** 6+ running locally (`mongodb://localhost:27017/pg-mgmt` by default).
- **Gradle 8.10+** (wrapper included) or **Maven 3.9+**.
- Configured Google OAuth client ID for verifying login tokens.

## � Quick start
```bash
cd pg-mgmt-backend

# create src/main/resources/application.yml (see template below)

./gradlew bootRun
```

The API listens on <http://localhost:8080/> by default. Initial routes:
- `POST /auth/google` – Tenant Google sign-in → JWT token.
- `POST /auth/admin/google` – Admin Google sign-in.
- `GET /api/tenants` – Authenticated tenant management endpoints.
- `GET /api/dashboard/summary` – Admin dashboard statistics.

## 📦 Build & run options

| Workflow | Gradle | Maven |
| --- | --- | --- |
| Dev server | `./gradlew bootRun` | `mvn spring-boot:run` |
| Package JAR | `./gradlew bootJar` | `mvn package` |
| Unit tests | `./gradlew test` | `mvn test` |
| Clean build | `./gradlew clean build` | `mvn clean package` |

Gradle is the primary build (see `build.gradle`), while Maven is available for teams that prefer it (`pom.xml`).

## ⚙️ Configuration

Populate `application.yml` / `application.properties` or environment variables with the following keys:

| Property | Description | Example |
| --- | --- | --- |
| `spring.data.mongodb.uri` | Mongo connection string. | `mongodb+srv://username:password@cluster.fqmzawg.mongodb.net/pg_mgmt?retryWrites=true&w=majority&appName=Cluster` |
| `jwt.secret` | HMAC key for signing JWT access tokens. Provide at least 32 characters; never commit this value. | `pg-mgmt-dev-secret-please-change` |
| `jwt.expiration-ms` | (Optional) Token lifetime in milliseconds. Defaults to 86,400,000 (24h). | `3600000` |
| `app.cors.allowed-origins` | Comma-separated list of allowed browser origins. | `https://app.example.com,https://admin.example.com` |
| `google.oauth.client-id` | OAuth client configured in Google Cloud Console. | `1234567890-abcdef.apps.googleusercontent.com` |
| `management.endpoints.web.exposure.include` | (Optional) Actuator endpoints to expose. Defaults to `health,info,prometheus`. | `health,info,prometheus` |

For production, store secrets in your deployment environment (Kubernetes Secrets, AWS Parameter Store, etc.) and enable HTTPS termination.

Sample `application.yml` for local development:

```yaml
spring:
	data:
		mongodb:
			uri: mongodb+srv://username:password@cluster.fqmzawg.mongodb.net/pg_mgmt?retryWrites=true&w=majority&appName=Cluster

jwt:
	secret: pg-mgmt-dev-secret-please-change
	expiration-ms: 86400000

app:
	cors:
		allowed-origins: http://localhost:4200

google:
	oauth:
		client-id: your-google-oauth-client-id

management:
	endpoints:
		web:
			exposure:
				include: health,info,prometheus
```

## 🔐 Security considerations
- All `/api/**` routes require a valid JWT issued by this service.
- Configure `app.cors.allowed-origins` to the exact frontend hosts to prevent browser abuse.
- Rotate `jwt.secret` periodically and re-issue tokens upon rotation.
- Google OAuth client IDs should match the environment; staging and production typically need separate credentials.

## 📊 Observability
- Spring Boot Actuator is enabled; the health endpoint is available at `/actuator/health`.
- Prometheus metrics are exported at `/actuator/prometheus` when `micrometer-registry-prometheus` is on the classpath (default).

## ✅ Quality checks
- Unit tests: `./gradlew test`
- Static analysis (if configured): integrate with IDE inspections or add Gradle plugins as needed.
- Container smoke test: `./gradlew bootJar` followed by `java -jar build/libs/pg-mgmt-backend-1.0.jar`.

## 📚 Documentation
- Comprehensive Javadoc now decorates domain models, repositories, and allocation services—browse `src/main/java/com/harikiran/pgmgmt/**` for inline API notes.
- When adding new modules, extend existing documentation patterns to keep the codebase discoverable.
