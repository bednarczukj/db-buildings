# Database Schema Plan

## 1. Tables

### 1.1. voivodeships
- code VARCHAR(7) PRIMARY KEY
- name VARCHAR(100) NOT NULL

### 1.2. districts
- code VARCHAR(7) PRIMARY KEY
- name VARCHAR(100) NOT NULL
- voivodeship_code VARCHAR(7) NOT NULL REFERENCES voivodeships(code) ON UPDATE CASCADE ON DELETE RESTRICT

### 1.3. communities
- code VARCHAR(7) PRIMARY KEY
- name VARCHAR(100) NOT NULL
- type_id INTEGER
- type  VARCHAR(50)
- district_code VARCHAR(7) NOT NULL REFERENCES districts(code) ON UPDATE CASCADE ON DELETE RESTRICT

### 1.4. cities
- code VARCHAR(7) PRIMARY KEY
- name VARCHAR(100) NOT NULL
- community_code VARCHAR(7) NOT NULL REFERENCES communities(code) ON UPDATE CASCADE ON DELETE RESTRICT

### 1.5. city_districts
- code VARCHAR(7) PRIMARY KEY
- name VARCHAR(100) NOT NULL
- city_code VARCHAR(7) NOT NULL REFERENCES cities(code) ON UPDATE CASCADE ON DELETE RESTRICT

### 1.6. streets
- code VARCHAR(7) PRIMARY KEY
- name VARCHAR(100) NOT NULL


### 1.7. providers
- id SERIAL PRIMARY KEY
- name TEXT NOT NULL UNIQUE
- technology TEXT NOT NULL
- bandwidth INTEGER NOT NULL

### 1.8. buildings
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- voivodeship_code VARCHAR(7) NOT NULL REFERENCES voivodeships(code) ON UPDATE CASCADE
- voivodeship_name VARCHAR(100) NOT NULL
- district_code VARCHAR(7) NOT NULL REFERENCES districts(code) ON UPDATE CASCADE
- district_name VARCHAR(100) NOT NULL
- community_code VARCHAR(7) NOT NULL REFERENCES communities(code) ON UPDATE CASCADE
- community_name VARCHAR(100) NOT NULL
- city_code VARCHAR(7) NOT NULL REFERENCES cities(code) ON UPDATE CASCADE
- city_name VARCHAR(100) NOT NULL
- city_part_code VARCHAR(7) NOT NULL REFERENCES cities(code) ON UPDATE CASCADE
- city_part_name VARCHAR(100)
- city_district_code VARCHAR(7) NOT NULL REFERENCES city_districts(code) ON UPDATE CASCADE
- city_district_name VARCHAR(100)
- street_code VARCHAR(7) NOT NULL REFERENCES streets(code) ON UPDATE CASCADE ON DELETE RESTRICT
- street_name VARCHAR(100) NOT NULL
- house_number VARCHAR(10) NOT NULL
- provider_id INTEGER NOT NULL REFERENCES providers(id) ON UPDATE CASCADE
- latitude DOUBLE PRECISION NOT NULL
- longitude DOUBLE PRECISION NOT NULL
- location GEOGRAPHY(Point,4326) NOT NULL
- status status_enum NOT NULL DEFAULT 'active'
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- updated_at TIMESTAMPTZ NOT NULL DEFAULT now()

**Partitioning:** LIST on (voivodeship_code)

### 1.9. profiles
- user_id UUID PRIMARY KEY
- role role_enum NOT NULL

### 1.10. audit_logs
- id BIGSERIAL PRIMARY KEY
- user_id UUID NOT NULL REFERENCES profiles(user_id)
- entity_type TEXT NOT NULL
- entity_id UUID NOT NULL
- action TEXT NOT NULL
- changed_fields JSONB
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()

**Partitioning:** RANGE on (created_at) by month

### 1.11. api_keys
- id UUID PRIMARY KEY DEFAULT gen_random_uuid()
- key TEXT NOT NULL UNIQUE
- user_id UUID REFERENCES profiles(user_id)
- created_at TIMESTAMPTZ NOT NULL DEFAULT now()
- last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now()

### 1.12. api_requests
- id BIGSERIAL PRIMARY KEY
- api_key_id UUID NOT NULL REFERENCES api_keys(id)
- request_time TIMESTAMPTZ NOT NULL DEFAULT now()
- idempotency_key TEXT NOT NULL
- status_code INTEGER NOT NULL
- request_path TEXT NOT NULL

## 2. Relationships

- voivodeships 1—* districts
- districts 1—* communities
- communities 1—* cities
- cities 1—* city_districts, streets
- providers 1—* buildings
- profiles 1—* audit_logs
- api_keys 1—* api_requests
- buildings partitioned by voivodeship_code (LIST)
- audit_logs partitioned by created_at (RANGE monthly)

## 3. Indexes

- **Unique functional index** on buildings:
  `(voivodeship_code, district_code, community_code, city_code, COALESCE(city_part_code, ''), city_district_code, COALESCE(street_code, ''), house_number)`
- **BTREE** indexes on all `*_code` columns in buildings
- **GiST** index on buildings(location)
- **GIN (pg_trgm)** indexes on cities(name) and streets(name)
- **BTREE** on providers(name)
- **BTREE** on api_requests(idempotency_key)

## 4. PostgreSQL Types & Extensions

- `CREATE TYPE status_enum AS ENUM ('active','deleted');`
- `CREATE TYPE role_enum AS ENUM ('ADMIN','WRITE','READ');`
- `CREATE EXTENSION IF NOT EXISTS postgis;`
- `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

## 5. RLS Policies

### 5.1. Common setup
```sql
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
```  

### 5.2. Buildings
```sql
CREATE POLICY buildings_select ON buildings FOR SELECT
  USING (current_setting('request.jwt.claim.role') IN ('READ','WRITE','ADMIN'));
CREATE POLICY buildings_modify ON buildings FOR INSERT, UPDATE, DELETE
  TO PUBLIC
  USING (current_setting('request.jwt.claim.role') IN ('WRITE','ADMIN'));
```  

### 5.3. Dictionary tables (voivodeships, districts, ...) 
```sql
CREATE POLICY dict_select ON voivodeships FOR SELECT USING (true);
-- similarly on other dict tables
CREATE POLICY dict_modify ON voivodeships FOR INSERT, UPDATE, DELETE
  USING (current_setting('request.jwt.claim.role') IN ('WRITE','ADMIN'));
```  

### 5.4. Profiles
```sql
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (current_setting('request.jwt.claim.role') = 'ADMIN' OR profiles.user_id = current_setting('request.jwt.claim.sub')::UUID);
CREATE POLICY profiles_modify ON profiles FOR INSERT, UPDATE, DELETE
  USING (current_setting('request.jwt.claim.role') = 'ADMIN');
```  

### 5.5. Audit_logs & API tables
```sql
CREATE POLICY audit_select ON audit_logs FOR SELECT
  USING (current_setting('request.jwt.claim.role') IN ('ADMIN','WRITE','READ'));
CREATE POLICY audit_modify ON audit_logs FOR DELETE
  USING (current_setting('request.jwt.claim.role') = 'ADMIN');

CREATE POLICY api_select ON api_keys FOR SELECT
  USING (current_setting('request.jwt.claim.role') = 'ADMIN');
CREATE POLICY api_modify ON api_keys FOR INSERT, UPDATE, DELETE
  USING (current_setting('request.jwt.claim.role') = 'ADMIN');
```  

## 6. Triggers & Automation

- **Trigger** on each dictionary table to sync `*_code` and `*_name` in `buildings` upon `INSERT/UPDATE/DELETE`.
- **Cron/Trigger** to drop `audit_logs` partitions older than 365 days daily.

## 7. Additional Notes

- Denormalization chosen for performance and historical integrity.
- LIST partitioning on buildings aligns with common filtering by voivodeship.
- Monthly RANGE partitioning for audit_logs supports efficient purging.
- pg_trgm GIN indexes optimize autocomplete on name fields.
