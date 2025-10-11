-- migration: disable_all_rls_policies
-- purpose: disable all row level security policies for development/testing
-- tables affected: all tables with rls enabled
-- notes: WARNING - this removes all access control! only use in development

-- ============================================================================
-- disable rls on dictionary tables
-- ============================================================================

alter table voivodeships disable row level security;
alter table districts disable row level security;
alter table communities disable row level security;
alter table cities disable row level security;
alter table city_districts disable row level security;
alter table streets disable row level security;

-- ============================================================================
-- disable rls on providers
-- ============================================================================

alter table providers disable row level security;

-- ============================================================================
-- disable rls on buildings
-- ============================================================================

alter table buildings disable row level security;

-- ============================================================================
-- disable rls on profiles
-- ============================================================================

alter table profiles disable row level security;

-- ============================================================================
-- disable rls on audit_logs
-- ============================================================================

alter table audit_logs disable row level security;

-- ============================================================================
-- disable rls on api tables
-- ============================================================================

alter table api_keys disable row level security;
alter table api_requests disable row level security;

