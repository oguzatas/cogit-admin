# Cogit Admin

> **Status:** Archived / open-sourced reference project.

Use with the [backend](https://github.com/oguzatas/cogit-backend) 

Cogit  is an Angular-based admin dashboard for managing multi-tenant assessment operations.  
It provides interfaces for authentication, tenant and assignment management, test creation/editing, test result viewing, and invite-based assessment access.

## What this project does

- Admin login and protected app shell
- Dashboard with KPI and chart views
- Test lifecycle management (draft/publish/edit/delete)
- Tenant and assignment management
- Assignment results and reporting views
- Public assessment invite route (`/assessment/invite/:accessKey`)

## Tech stack

- **Framework:** Angular 21 (standalone components)
- **Language:** TypeScript
- **UI:** PrimeNG, PrimeIcons, PrimeUIX themes
- **Styling:** SCSS + Tailwind CSS v4
- **Charts:** Chart.js
- **HTTP/Auth:** Angular HttpClient + auth interceptor/guard flow
- **Tooling:** Angular CLI, ESLint, Prettier, Karma + Jasmine

## Requirements

- Node.js (LTS recommended)
- npm

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure backend API URL in:
   - `src/environments/environment.ts`
   - `src/environments/environment.development.ts`

3. Start development server:

   ```bash
   npm start
   ```

4. Open `http://localhost:4200`.

## Available scripts

- `npm start` — run dev server
- `npm run build` — production build
- `npm run watch` — development build in watch mode
- `npm test` — run unit tests
- `npm run format` — format code with Prettier

## Project structure

- `src/app/core` — auth, API services, shared core logic
- `src/app/dashboard` — dashboard state and presentation
- `src/app/tests` and `src/app/test-builder` — test management and builder flows
- `src/app/tenants` — tenant directory and details
- `src/app/assignments` — assignments, reports, and results
- `src/app/pages` — top-level routed pages (login, home, tests, etc.)

## Build output

Build artifacts are generated in `dist/scorion-admin/`.

## License

See [LICENSE.md](./LICENSE.md).
