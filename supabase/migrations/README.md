# Database Migrations

This directory contains PostgreSQL migrations for the buildings database.

## Migration Files

1. **20251011120000_enable_extensions_and_types.sql**
   - Enables PostGIS and pg_trgm extensions
   - Creates custom enums: `status_enum`, `role_enum`

2. **20251011120100_create_dictionary_tables.sql**
   - Creates territorial division tables: `voivodeships`, `districts`, `communities`, `cities`, `city_districts`, `streets`
   - Includes RLS policies for all dictionary tables
   - Adds pg_trgm indexes for autocomplete on cities and streets

3. **20251011120200_create_providers_table.sql**
   - Creates `providers` table for ISP information
   - Includes RLS policies

4. **20251011120300_create_buildings_table.sql**
   - Creates main `buildings` table with list partitioning by voivodeship
   - Creates 16 partitions (one per voivodeship)
   - Includes unique constraint, spatial indexes, and RLS policies
   - Auto-updates `updated_at` and computes `location` from lat/lon

5. **20251011120400_create_profiles_table.sql**
   - Creates `profiles` table linking auth.users to application roles
   - Auto-creates profile with READ role for new users
   - Includes RLS policies

6. **20251011120500_create_audit_logs_table.sql**
   - Creates `audit_logs` table with range partitioning by month
   - Creates initial 6 monthly partitions
   - Includes functions for automatic partition management
   - Includes RLS policies

7. **20251011120600_create_api_tables.sql**
   - Creates `api_keys` and `api_requests` tables
   - Includes idempotency support via unique constraint
   - Includes cleanup function for old request logs
   - Includes RLS policies

## Running Migrations

```bash
# Apply all migrations to local database
supabase db reset

# Create a new migration
supabase migration new migration_name

# Push migrations to remote
supabase db push
```

## Important Notes

### Partitioned Tables

#### Buildings (LIST partitioning)

- Partitioned by `voivodeship_code`
- All 16 voivodeship partitions are pre-created
- Primary key must include partition key: `(id, voivodeship_code)`

#### Audit Logs (RANGE partitioning)

- Partitioned by `created_at` (monthly)
- Initial 6 months of partitions created
- Use `create_next_audit_logs_partition()` to add new partitions
- Use `drop_old_audit_logs_partitions()` to remove old partitions (365-day retention)

### Row Level Security (RLS)

All tables have RLS enabled with granular policies:

- **Dictionary tables**: Public read, WRITE/ADMIN modify
- **Providers**: Public read, WRITE/ADMIN modify
- **Buildings**: READ/WRITE/ADMIN read, WRITE/ADMIN modify
- **Profiles**: Users can view own profile, ADMIN manages all
- **Audit logs**: READ/WRITE/ADMIN view, ADMIN delete
- **API tables**: ADMIN only

### Automated Tasks

Consider setting up these pg_cron jobs:

```sql
-- Create next month's audit_logs partition
SELECT cron.schedule('create-audit-partition', '0 0 1 * *', 'SELECT create_next_audit_logs_partition()');

-- Drop audit_logs partitions older than 365 days
SELECT cron.schedule('drop-old-audit-partitions', '0 2 * * *', 'SELECT drop_old_audit_logs_partitions()');

-- Cleanup api_requests older than 90 days
SELECT cron.schedule('cleanup-api-requests', '0 3 * * *', 'SELECT cleanup_old_api_requests()');
```

## Schema Design Notes

### Denormalization in Buildings Table

The `buildings` table stores both codes and names from dictionary tables. This denormalization is intentional:

- **Performance**: Avoids multiple joins on frequent queries
- **Historical Integrity**: Preserves names even if dictionary data changes
- **Trade-off**: Requires triggers to sync changes (planned for future migration)

### Geography vs Geometry

Using `geography(point, 4326)` instead of `geometry`:

- Geography automatically handles earth curvature
- Better for distance calculations (meters, not degrees)
- Slightly slower than geometry but more accurate for Poland-wide queries

### Composite Primary Keys

Partitioned tables require partition keys in primary key:

- `buildings`: `(id, voivodeship_code)`
- `audit_logs`: `(id, created_at)`

This is a PostgreSQL requirement for partitioned tables.
