-- migration: create_providers_table
-- purpose: create providers table for internet service providers
-- tables affected: providers
-- notes: stores isp information including technology and bandwidth

-- ============================================================================
-- providers
-- ============================================================================

-- providers table: stores internet service provider information
-- each provider has unique name and specifies their technology and bandwidth
create table providers (
  id serial primary key,
  name text not null unique,
  technology text not null,
  bandwidth integer not null
);

-- btree index on name for fast lookups and sorting
create index idx_providers_name on providers(name);

-- enable row level security
alter table providers enable row level security;

-- policy: allow all users to read providers (public reference data)
create policy providers_select_anon on providers
  for select
  to anon
  using (true);

create policy providers_select_authenticated on providers
  for select
  to authenticated
  using (true);

-- policy: only WRITE and ADMIN roles can insert providers
create policy providers_insert on providers
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update providers
create policy providers_update on providers
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete providers
create policy providers_delete on providers
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

