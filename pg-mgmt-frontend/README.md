# PG Manager Frontend

Enterprise management UI for the PG Manager platform. The application is built with Angular 20, Angular Material, and Chart.js, and consumes the Spring Boot backend exposed in the sibling `pg-mgmt-backend` project.

## ✨ Highlights

- Admin dashboards for occupancy, meal statistics, room setup, and tenant management.
- Tenant-facing profile portal with real-time validation and JWT-protected APIs.
- Shared theming service with light/dark support and Google OAuth-based authentication.

## 🔧 Prerequisites

- **Node.js** ≥ 18.19 (LTS recommended)
- **npm** ≥ 9
- Access to the PG Manager backend API (default `http://localhost:8080`)

Confirm versions locally:

```bash
node --version
npm --version
```

## 🚀 Quick start

```bash
cd pg-mgmt-frontend
npm install

# configure API base URL if needed (see below)

```

Once the dev server boots, visit <http://localhost:4200/>. Hot reload is enabled for TypeScript, HTML, and style changes.

## 🧰 Environment configuration

The frontend reads API endpoints from `src/environments/environment.ts` (and `.prod.ts`). Update the `apiBaseUrl` value to point at the backend instance:

```ts
export const environment = {
  production: false,
  apiBaseUrl: "http://localhost:8080",
};
```

For production deployments, also configure OAuth identifiers through `environment.prod.ts` and ensure the backend CORS whitelist trusts the deployed host.

## 📜 Available scripts

| Command          | Description                                                           |
| ---------------- | --------------------------------------------------------------------- |
| `npm run start`  | Runs `ng serve` with the default development configuration.           |
| `npm run build`  | Produces an optimized production build under `dist/pg-mgmt-frontend`. |
| `npm run watch`  | Rebuilds on file changes using the development configuration.         |
| `npm run test`   | Executes Karma unit tests.                                            |
| `npm run format` | Formats the workspace with Prettier.                                  |

Additional schematics (`ng generate`, `ng add`, etc.) remain available through the Angular CLI. Run `npx ng help` for the full catalog.

## 🗂️ Project anatomy

```
src/
  app/
    admin/        # Admin dashboard features, Google-auth protected
    user/         # Tenant login & profile portal
    core/         # Guards, services, interceptors, config
    shared/       # Shared modules, Material wrappers, utilities
  assets/         # Static assets, icons, and styling
```

## ✅ Quality checks

- **Unit tests**: `npm run test`
- **Formatting**: `npm run format`
- **Production build smoke test**: `npm run build`

CI/CD pipelines should execute the production build and unit tests. Include `--configuration production` when validating deployment bundles.

## 📚 Documentation

- Detailed documentation improvements are tracked in [`DOCUMENTATION_IMPROVEMENTS.md`](./DOCUMENTATION_IMPROVEMENTS.md).
- Service-level contracts live alongside their TypeScript sources with JSDoc annotations.

## 🔗 Helpful references

- [Angular Material](https://material.angular.io/components/categories)
- [Angular CLI command reference](https://angular.dev/tools/cli)
- [Chart.js documentation](https://www.chartjs.org/docs/latest/)
