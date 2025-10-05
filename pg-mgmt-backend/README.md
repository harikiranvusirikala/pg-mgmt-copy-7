# PG Management Backend

## 🔧 Configuration

| Property | Description | Example |
| --- | --- | --- |
| `jwt.secret` | HMAC key for signing JWT access tokens. Provide at least 32 characters; store outside source control. | `pg-mgmt-dev-secret-please-change` |
| `jwt.expiration-ms` | (Optional) Token lifetime in milliseconds. Defaults to 86,400,000 (24 hours). | `3600000` |
| `app.cors.allowed-origins` | Comma-separated list of allowed web origins. Defaults to development ports. | `https://app.example.com,https://admin.example.com` |
| `google.oauth.client-id` | OAuth client configured in Google Cloud Console. | `1234567890-abcdef.apps.googleusercontent.com` |

Create an `application.properties` (or `application.yml`) file with these values or supply them through environment variables when running the service.

## Security Notes

- All endpoints under `/api/**` now require a valid JWT token unless explicitly permitted (for example, `/auth/**`).
- Use HTTPS in production and rotate `jwt.secret` regularly.
- Update `app.cors.allowed-origins` before deployment to restrict browser access to trusted domains.
