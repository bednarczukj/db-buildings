-- migration: enable_extensions_and_types
-- purpose: enable required postgresql extensions and create custom types
-- tables affected: none (foundation for other migrations)
-- notes: must be run before any other migrations that depend on postgis or pg_trgm

-- ============================================================================
-- extensions
-- ============================================================================

-- enable postgis extension for geography/geometry data types
-- used for storing building location data as geography(point,4326)
create extension if not exists postgis;

-- enable pg_trgm extension for trigram-based fuzzy text search
-- used for autocomplete functionality on city and street names
create extension if not exists pg_trgm;

-- ============================================================================
-- custom types
-- ============================================================================

-- status_enum: tracks lifecycle state of records
-- 'active' - record is currently valid and in use
-- 'deleted' - record has been soft-deleted (preserved for audit trail)
create type status_enum as enum ('active', 'deleted');

-- role_enum: defines user permission levels
-- 'ADMIN' - full system access including user management
-- 'WRITE' - can create, update, and delete buildings and related data
-- 'READ' - can only view data, no modifications allowed
create type role_enum as enum ('ADMIN', 'WRITE', 'READ');

