# Polish Buildings Database (BBP)

![CI/CD Pipeline](https://github.com/jacekbednarczuk/db-buildings/actions/workflows/ci.yml/badge.svg)

A web application for manual entry, browsing, and management of building data in Poland, including broadband provider information. Includes role-based access control, autocomplete search, and a public REST API.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Getting Started Locally](#getting-started-locally)
3. [Available Scripts](#available-scripts)
4. [CI/CD](#cicd)
5. [Project Scope](#project-scope)
   - [In Scope (MVP)](#in-scope-mvp)
   - [Out of Scope (MVP)](#out-of-scope-mvp)
6. [Project Status](#project-status)
7. [License](#license)

---

## Tech Stack

- **Frontend**
  - Astro 5
  - React 19
  - TypeScript 5
  - Tailwind CSS 4
  - Shadcn/ui
- **Backend**
  - Supabase (PostgreSQL & Auth)
- **Testing**
  - Vitest (unit tests)
  - React Testing Library
  - Playwright (E2E tests)
- **AI (internal)**
  - Openrouter.ai (model orchestration)
- **CI/CD & Hosting**
  - GitHub Actions
  - DigitalOcean (Docker)

---

## Getting Started Locally

### Prerequisites

- Node.js v22.14.0 (use [nvm](https://github.com/nvm-sh/nvm))
- npm (bundled with Node.js)

### Installation

```sh
git clone https://github.com/your-org/db-buildings.git
cd db-buildings
nvm use
npm install
```

### Running in Development

```sh
npm run dev
```

Open your browser at `http://localhost:3000` (or the port shown in console).

---

## Available Scripts

From the project root, you can run:

- `npm run dev`  
  Start the local development server.

- `npm run build`  
  Build the app for production.

- `npm run preview`  
  Serve the built app locally.

- `npm run astro`  
  Run the Astro CLI.

- `npm run lint`  
  Lint all `.ts`, `.tsx`, and `.astro` files.

- `npm run lint:fix`  
  Lint and automatically fix issues.

- `npm run format`  
  Format all `.json`, `.css`, and `.md` files with Prettier.

---

## CI/CD

This project uses **GitHub Actions** for continuous integration and deployment.

### Pipeline Overview

The CI/CD pipeline automatically runs on:

- Push to `master` branch
- Pull requests to `master`
- Manual trigger via GitHub Actions UI

### What's Tested

- ✅ **Lint & Code Quality** - ESLint and Prettier checks
- ✅ **Unit Tests** - Vitest with coverage reporting
- ✅ **Production Build** - Verifies production build succeeds

### Getting Started

To set up CI/CD for your fork:

1. **Quick Start:** Read [`.github/SETUP-GUIDE.md`](.github/SETUP-GUIDE.md) for step-by-step instructions
2. **Technical Docs:** See [`.github/README.md`](.github/README.md) for detailed documentation
3. **Architecture:** Check [`.github/ARCHITECTURE.md`](.github/ARCHITECTURE.md) for diagrams and details

### Required Secrets

Add these secrets in GitHub `Settings → Secrets and variables → Actions`:

- `SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

See [`.github/SETUP-GUIDE.md`](.github/SETUP-GUIDE.md) for more details.

---

## API Documentation

API endpoints are documented in the `.ai/` directory:

- **GET /api/v1/buildings** - [Full documentation](.ai/api-endpoint-buildings-get.md)
  - List buildings with filtering and pagination
  - Supports filters: voivodeship, district, community, city, provider, status
- **POST /api/v1/buildings** - [Full documentation](.ai/api-endpoint-buildings-post.md)
  - Create a new building
  - Validates TERYT codes and coordinates
  - Checks for duplicates

- **GET /api/v1/buildings/:id** - [Full documentation](.ai/api-endpoint-building-by-id.md)
  - Get single building by ID
  - Fast primary key lookup
  - Returns 404 if not found

For HTTP request examples, see [API Examples](.ai/api-examples.http).

### Testing

To test the API endpoints:

1. Start the server: `npm run dev`
2. Run the test script: `./.ai/test-get-by-id.sh`
3. Or see [Test Examples](.ai/test-results-example.md) for expected results

For more details on using mock data in development and testing, see [Mock Data README](src/lib/mocks/README.md).

---

## Project Scope

### In Scope (MVP)

- Manual entry and CRUD of building records with:
  - Building number, type, TERYT hierarchy (voivodeship → county → commune → locality → district/part (optional) → street (optional))
  - Coordinates (WGS84), broadband provider data (name, technology, throughput)
- CRUD for TERYT dictionaries (voivodeships, counties, communes, localities, parts/districts, streets)
- Role-based access:
  - `ADMIN`: manage users and roles
  - `WRITE`: create, update, delete buildings and dictionaries
  - `READ`: view only
- Supabase Auth with HttpOnly secure cookies and session timeout
- Autocomplete search (min. 2 chars, 300 ms debounce)
- Public REST API v1:
  - Read building parameters (coordinates, provider, technology, throughput)
  - API keys with rotation, rate limit 10 req/hr, `Idempotency-Key`, HTTP 429/`Retry-After`
  - Pagination (`page`, `pageSize`)
- Audit logging (filters, pagination, retention 365 days)
- Hard delete with confirmation modal
- Optimistic locking and unique constraints

### Out of Scope (MVP)

- Automatic data imports or external integrations
- Bulk upload of building data
- External provider dictionary (entered manually)
- Backup UI and enforcement of HTTPS/CORS/SLA

---

## Project Status

🔧 Currently in MVP development. Core features implemented; additional enhancements and documentation forthcoming.

---

## License

This project is not yet licensed. Please add a `LICENSE` file to specify the terms under which the project may be used or contributed to.
