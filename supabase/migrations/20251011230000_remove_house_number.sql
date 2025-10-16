-- migration: remove_house_number
-- purpose: Remove house_number column from buildings table
-- tables affected: buildings
-- notes: building_number is now the primary field for building numbers

-- ============================================================================
-- Remove house_number column from buildings table
-- ============================================================================

-- Drop the house_number column since building_number is now the primary field
alter table buildings drop column if exists house_number;

-- ============================================================================
-- Update comments
-- ============================================================================

comment on column buildings.building_number is 
  'Building number - primary field for building identification';

-- ============================================================================
-- Update buildings_api view to remove any house_number references
-- ============================================================================

-- Recreate the buildings_api view without house_number
drop view if exists buildings_api;

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
  building_number, -- API column (now primary field)
  
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

comment on view buildings_api is 
  'API-compatible view of buildings table with simplified column names and GeoJSON location';
