-- migration: adapt_buildings_for_api
-- purpose: adapt buildings table to match API implementation
-- tables affected: buildings
-- notes: adds missing fields for API compatibility while preserving existing denormalized structure

-- ============================================================================
-- add missing columns for API compatibility
-- ============================================================================

-- add building_number as alias/copy of house_number for API consistency
-- we keep both: house_number for DB, building_number for API
alter table buildings 
  add column if not exists building_number varchar(10);

-- populate building_number from house_number for existing records
update buildings set building_number = house_number where building_number is null;

-- make building_number required
alter table buildings
  alter column building_number set not null;

-- add created_by and updated_by for audit trail
alter table buildings
  add column if not exists created_by uuid,
  add column if not exists updated_by uuid;

-- set default values for existing records (use system UUID for now)
update buildings 
set 
  created_by = '00000000-0000-0000-0000-000000000000'::uuid,
  updated_by = '00000000-0000-0000-0000-000000000000'::uuid
where created_by is null or updated_by is null;

-- make them required for new records
alter table buildings
  alter column created_by set not null,
  alter column updated_by set not null;

-- ============================================================================
-- make city_district_code optional
-- ============================================================================

-- change city_district_code to nullable (some buildings may not have a district)
alter table buildings
  alter column city_district_code drop not null;

-- update unique constraint to handle nullable city_district_code properly
drop index if exists idx_buildings_unique_address;

create unique index idx_buildings_unique_address_v2 on buildings (
  voivodeship_code,
  district_code,
  community_code,
  city_code,
  coalesce(city_part_code, ''),
  coalesce(city_district_code, ''), -- now nullable
  coalesce(street_code, ''),
  building_number, -- use new column
  status
) where status = 'active'; -- only enforce uniqueness for active buildings

-- ============================================================================
-- update triggers to handle new fields
-- ============================================================================

-- drop and recreate location trigger to ensure it works with all columns
drop trigger if exists buildings_location_trigger on buildings;

create trigger buildings_location_trigger
  before insert or update of latitude, longitude on buildings
  for each row
  execute function update_buildings_location();

-- ============================================================================
-- create view for API compatibility
-- ============================================================================

-- create a view that maps database columns to API-expected names
-- this allows API to use simpler column names while DB keeps denormalized structure
create or replace view buildings_api as
select
  -- map id to integer for API (using hashtext for consistent integer from UUID)
  -- note: this is a workaround - actual UUID is still used in DB
  (('x' || substring(id::text, 1, 8))::bit(32)::bigint)::integer as id_int,
  id as id_uuid, -- keep original UUID
  
  -- core fields (codes only, no names for API simplicity)
  voivodeship_code,
  district_code,
  community_code,
  city_code,
  city_district_code,
  street_code,
  building_number, -- API column
  
  -- location as GeoJSON string for API
  case 
    when location is not null then 
      json_build_object(
        'type', 'Point',
        'coordinates', array[longitude, latitude]
      )::text
    else null
  end as location,
  
  -- also provide separate coordinates for convenience
  latitude,
  longitude,
  
  -- provider and status
  provider_id,
  status,
  
  -- timestamps and audit
  created_at,
  updated_at,
  created_by,
  updated_by
from buildings;

-- ============================================================================
-- indexes for new columns
-- ============================================================================

-- index on building_number for lookups
create index if not exists idx_buildings_building_number on buildings(building_number);

-- indexes on audit columns
create index if not exists idx_buildings_created_by on buildings(created_by);
create index if not exists idx_buildings_updated_by on buildings(updated_by);

-- ============================================================================
-- comments for documentation
-- ============================================================================

comment on column buildings.building_number is 
  'Building number (API field) - same as house_number but used for API consistency';

comment on column buildings.created_by is 
  'UUID of user who created the record - for audit trail';

comment on column buildings.updated_by is 
  'UUID of user who last updated the record - for audit trail';

comment on view buildings_api is 
  'API-compatible view of buildings table with simplified column names and GeoJSON location';


