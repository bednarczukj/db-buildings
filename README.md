# Polish Buildings Database (BBP)

A web application for manual entry, browsing, and management of building data in Poland, including broadband provider information. Includes role-based access control, autocomplete search, and a public REST API.

---

## Table of Contents

1. [Tech Stack](#tech-stack)  
2. [Getting Started Locally](#getting-started-locally)  
3. [Available Scripts](#available-scripts)  
4. [Project Scope](#project-scope)  
   - [In Scope (MVP)](#in-scope-mvp)  
   - [Out of Scope (MVP)](#out-of-scope-mvp)  
5. [Project Status](#project-status)  
6. [License](#license)  

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