-- migration: create_api_tables
-- purpose: create api_keys and api_requests tables for api access management
-- tables affected: api_keys, api_requests
-- notes: tracks api key usage and provides idempotency for api requests

-- ============================================================================
-- api_keys
-- ============================================================================

-- api_keys table: stores api keys for programmatic access to the system
-- each key is associated with a user profile (optional - can be service keys)
-- tracks creation and last rotation date for security lifecycle management
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  user_id uuid references profiles(user_id),
  created_at timestamptz not null default now(),
  last_rotated_at timestamptz not null default now()
);

-- index on key for fast authentication lookups
create unique index idx_api_keys_key on api_keys(key);

-- index on user_id to find all keys for a user
create index idx_api_keys_user_id on api_keys(user_id) where user_id is not null;

-- enable row level security
alter table api_keys enable row level security;

-- policy: only ADMIN role can view api keys
-- rationale: api keys are sensitive credentials
create policy api_keys_select on api_keys
  for select
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: only ADMIN role can create api keys
create policy api_keys_insert on api_keys
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: only ADMIN role can update api keys (e.g., rotation)
create policy api_keys_update on api_keys
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: only ADMIN role can delete api keys (revocation)
create policy api_keys_delete on api_keys
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- api_requests
-- ============================================================================

-- api_requests table: logs all api requests for monitoring and idempotency
-- tracks which api key made which request, when, and the result
-- idempotency_key prevents duplicate request processing
create table api_requests (
  id bigserial primary key,
  api_key_id uuid not null references api_keys(id),
  request_time timestamptz not null default now(),
  idempotency_key text not null,
  status_code integer not null,
  request_path text not null
);

-- index on api_key_id to find all requests for a specific key
create index idx_api_requests_api_key_id on api_requests(api_key_id);

-- btree index on idempotency_key for fast duplicate detection
-- unique constraint ensures same idempotency key cannot be used twice
create unique index idx_api_requests_idempotency_key on api_requests(idempotency_key, api_key_id);

-- index on request_time for temporal queries and cleanup
create index idx_api_requests_request_time on api_requests(request_time);

-- index on status_code for filtering failed requests
create index idx_api_requests_status_code on api_requests(status_code);

-- enable row level security
alter table api_requests enable row level security;

-- policy: only ADMIN role can view api request logs
-- rationale: api request logs may contain sensitive information
create policy api_requests_select on api_requests
  for select
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: system can insert api request logs (via api middleware)
-- typically bypassed with service role key, but allowing ADMIN for manual testing
create policy api_requests_insert on api_requests
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: no updates allowed on api request logs
-- rationale: logs should be immutable for integrity

-- policy: only ADMIN role can delete api request logs
-- rationale: deletion only for data retention or cleanup
create policy api_requests_delete on api_requests
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- function: cleanup old api request logs
-- ============================================================================

-- function to delete api request logs older than retention period (90 days)
-- should be called by scheduled job daily
create or replace function cleanup_old_api_requests()
returns integer as $$
declare
  deleted_count integer;
begin
  -- delete requests older than 90 days
  delete from api_requests
  where request_time < now() - interval '90 days';
  
  get diagnostics deleted_count = row_count;
  
  raise notice 'Deleted % old api request records', deleted_count;
  return deleted_count;
end;
$$ language plpgsql;

-- note: to automate cleanup, set up pg_cron job:
-- select cron.schedule('cleanup-api-requests', '0 3 * * *', 'select cleanup_old_api_requests()');

