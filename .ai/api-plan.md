# REST API Plan

## 1. Resources

- Voivodeship (`voivodeships`)
- District (`districts`)
- Community (`communities`)
- City (`cities`)
- City District (`city_districts`)
- Street (`streets`)
- Provider (`providers`)
- Building (`buildings`)
- Audit Log (`audit_logs`)
- API Key (`api_keys`)

## 2. Endpoints

### 2.1. TERYT Dictionary Resources

For each resource: `voivodeships`, `districts`, `communities`, `cities`, `city-districts`, `streets`:

- GET /api/v1/{resource}
  - Query params: filter by parent code, page, pageSize
- POST /api/v1/{resource}
- GET /api/v1/{resource}/{code}
- PUT /api/v1/{resource}/{code}
- DELETE /api/v1/{resource}/{code}

### 2.2. Providers

- GET /api/v1/providers
- POST /api/v1/providers
- GET /api/v1/providers/:id
- PUT /api/v1/providers/:id
- DELETE /api/v1/providers/:id

### 2.3. Buildings

- GET /api/v1/buildings
  - Query params: page, pageSize, filters (voivodeship_code, district_code, community_code, city_code, provider_id, status)
- POST /api/v1/buildings
- GET /api/v1/buildings/:id
- PUT /api/v1/buildings/:id
- DELETE /api/v1/buildings/:id

#### Search & Autocomplete

- GET /api/v1/buildings/search
  - Query params: q (min 2 chars), type (`city`|`street`), debounce 300ms

### 2.4. Public REST API

- GET /api/v1/public/buildings
  - Requires X-API-Key, Idempotency-Key header
  - Query params: page, pageSize
- GET /api/v1/public/buildings/:id

### 2.5. Audit Logs

- GET /api/v1/audit-logs
  - Query params: dateFrom, dateTo, page, pageSize, sort

### 2.6. API Keys (ADMIN-only)

- POST /api/v1/api-keys
- GET /api/v1/api-keys
- POST /api/v1/api-keys/:id/rotate
- DELETE /api/v1/api-keys/:id

## 3. Authentication & Authorization

- Use Supabase Auth with JWT stored in HttpOnly Secure cookies
- Roles: ADMIN, WRITE, READ
- Middleware verifies JWT and sets current user context
- Row-Level Security (RLS) policies enforce access per table as per schema

## 4. Validation & Business Logic

- Validate TERYT code lengths (VARCHAR(7)) and existence of parent codes
- Coordinate ranges: longitude 14.1–24.1, latitude 49.0–54.8
- Unique functional index on buildings for uniqueness
- Optimistic locking using `updated_at` timestamp
- Reject invalid data early with 4xx responses
