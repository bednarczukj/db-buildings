-- migration: create_audit_logs_table
-- purpose: create audit_logs table with range partitioning by month
-- tables affected: audit_logs
-- notes: tracks all data modification actions for compliance and debugging
--        partitioned by created_at (monthly) for efficient querying and data retention
--        old partitions can be dropped automatically to maintain retention policy

-- ============================================================================
-- audit_logs (main table - partitioned)
-- ============================================================================

-- audit_logs table: stores audit trail of all data modifications
-- tracks who made what changes to which entities
-- partitioned by created_at using range partitioning (monthly)
-- partitions older than retention period can be dropped for data lifecycle management
create table audit_logs (
  id bigserial,
  user_id uuid not null references profiles(user_id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  changed_fields jsonb,
  created_at timestamptz not null default now(),
  
  -- composite primary key including partition key
  primary key (id, created_at)
) partition by range (created_at);

-- ============================================================================
-- initial partitions (monthly)
-- ============================================================================

-- note: partitions must be created and maintained for each month
-- ideally managed by automated process (cron job or pg_partman)
-- creating initial partitions for current and next few months as examples

-- october 2025
create table audit_logs_2025_10 partition of audit_logs
  for values from ('2025-10-01') to ('2025-11-01');

-- november 2025
create table audit_logs_2025_11 partition of audit_logs
  for values from ('2025-11-01') to ('2025-12-01');

-- december 2025
create table audit_logs_2025_12 partition of audit_logs
  for values from ('2025-12-01') to ('2026-01-01');

-- january 2026
create table audit_logs_2026_01 partition of audit_logs
  for values from ('2026-01-01') to ('2026-02-01');

-- february 2026
create table audit_logs_2026_02 partition of audit_logs
  for values from ('2026-02-01') to ('2026-03-01');

-- march 2026
create table audit_logs_2026_03 partition of audit_logs
  for values from ('2026-03-01') to ('2026-04-01');

-- ============================================================================
-- indexes
-- ============================================================================

-- index on user_id for finding all actions by specific user
create index idx_audit_logs_user_id on audit_logs(user_id);

-- index on entity_type and entity_id for finding all changes to specific entity
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- index on action for filtering by action type (insert, update, delete)
create index idx_audit_logs_action on audit_logs(action);

-- index on created_at for temporal queries (already covered by partition key but explicit for clarity)
create index idx_audit_logs_created_at on audit_logs(created_at);

-- ============================================================================
-- row level security
-- ============================================================================

-- enable rls on audit_logs table
alter table audit_logs enable row level security;

-- policy: READ, WRITE, and ADMIN roles can view audit logs
-- rationale: transparency for data modification tracking
create policy audit_logs_select on audit_logs
  for select
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('READ', 'WRITE', 'ADMIN')
  );

-- policy: system can insert audit logs (bypass rls with security definer functions)
-- note: audit log inserts typically happen via triggers with security definer
-- this policy allows authenticated users with WRITE/ADMIN roles to manually insert if needed
create policy audit_logs_insert on audit_logs
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: no updates allowed on audit logs
-- rationale: audit logs should be immutable for integrity
-- (no update policy means updates are blocked)

-- policy: only ADMIN role can delete audit logs
-- rationale: deletion should be rare and controlled (typically via partition drop)
-- hard delete individual records only for data correction or gdpr compliance
create policy audit_logs_delete on audit_logs
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- function: automated partition management
-- ============================================================================

-- function to create next month's partition
-- should be called by scheduled job (pg_cron or external cron)
create or replace function create_next_audit_logs_partition()
returns void as $$
declare
  next_month date;
  month_after date;
  partition_name text;
begin
  -- calculate next month's start date
  next_month := date_trunc('month', now() + interval '1 month');
  month_after := date_trunc('month', now() + interval '2 months');
  
  -- generate partition table name (e.g., audit_logs_2026_01)
  partition_name := 'audit_logs_' || to_char(next_month, 'YYYY_MM');
  
  -- create partition if it doesn't exist
  execute format(
    'create table if not exists %I partition of audit_logs for values from (%L) to (%L)',
    partition_name,
    next_month,
    month_after
  );
  
  raise notice 'Created partition: %', partition_name;
end;
$$ language plpgsql;

-- function to drop partitions older than retention period (365 days)
-- should be called by scheduled job daily
-- warning: this permanently deletes old audit data
create or replace function drop_old_audit_logs_partitions()
returns void as $$
declare
  retention_date date;
  partition_record record;
  partition_name text;
begin
  -- calculate cutoff date (365 days ago)
  retention_date := date_trunc('month', now() - interval '365 days');
  
  -- find and drop old partitions
  for partition_record in
    select tablename
    from pg_tables
    where schemaname = 'public'
      and tablename like 'audit_logs_%'
      and tablename ~ '^audit_logs_[0-9]{4}_[0-9]{2}$'
  loop
    partition_name := partition_record.tablename;
    
    -- extract year and month from partition name
    -- check if partition is older than retention date
    -- (simplified check - in production use more robust date parsing)
    if partition_name < 'audit_logs_' || to_char(retention_date, 'YYYY_MM') then
      -- drop old partition
      execute format('drop table if exists %I', partition_name);
      raise notice 'Dropped old partition: %', partition_name;
    end if;
  end loop;
end;
$$ language plpgsql;

-- note: to automate partition management, set up pg_cron jobs:
-- select cron.schedule('create-audit-partition', '0 0 1 * *', 'select create_next_audit_logs_partition()');
-- select cron.schedule('drop-old-audit-partitions', '0 2 * * *', 'select drop_old_audit_logs_partitions()');

