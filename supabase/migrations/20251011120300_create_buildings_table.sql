-- migration: create_buildings_table
-- purpose: create buildings table with partitioning by voivodeship
-- tables affected: buildings
-- notes: denormalized structure with both codes and names for performance and historical integrity
--        partitioned by voivodeship_code using list partitioning
--        includes geography point for spatial queries

-- ============================================================================
-- buildings (main table - partitioned)
-- ============================================================================

-- buildings table: stores building addresses with internet provider information
-- denormalized design: stores both codes and names from dictionary tables
-- rationale: 
--   - performance: avoids multiple joins on frequent queries
--   - historical integrity: preserves names even if dictionary data changes
--   - location stored as geography(point,4326) for spatial queries
--   - partitioned by voivodeship_code for improved query performance
-- note: primary key must include partition key (voivodeship_code) for partitioned tables
create table buildings (
  id uuid default gen_random_uuid(),
  
  -- voivodeship (województwo)
  voivodeship_code varchar(7) not null references voivodeships(code) on update cascade,
  voivodeship_name varchar(100) not null,
  
  -- district (powiat)
  district_code varchar(7) not null references districts(code) on update cascade,
  district_name varchar(100) not null,
  
  -- community (gmina)
  community_code varchar(7) not null references communities(code) on update cascade,
  community_name varchar(100) not null,
  
  -- city (miejscowość)
  city_code varchar(7) not null references cities(code) on update cascade,
  city_name varchar(100) not null,
  
  -- optional: city part (część miasta)
  city_part_code varchar(7) references cities(code) on update cascade,
  city_part_name varchar(100),
  
  -- city district (dzielnica)
  city_district_code varchar(7) not null references city_districts(code) on update cascade,
  city_district_name varchar(100),
  
  -- optional: street
  street_code varchar(7) references streets(code) on update cascade on delete restrict,
  street_name varchar(100),
  
  -- required: house number and postal code
  house_number varchar(10) not null,
  post_code varchar(6) not null,
  
  -- provider reference
  provider_id integer not null references providers(id) on update cascade,
  
  -- location data: stored both as separate coordinates and geography point
  -- latitude and longitude are required for easy access
  -- location geography(point,4326) is computed from lat/lon for spatial queries
  latitude double precision not null,
  longitude double precision not null,
  location geography(point, 4326),
  
  -- lifecycle tracking
  status status_enum not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- composite primary key including partition key
  primary key (id, voivodeship_code)
) partition by list (voivodeship_code);

-- ============================================================================
-- partitions for each voivodeship
-- ============================================================================

-- note: partitions must be created for each voivodeship code
-- example partitions for common voivodeships (more can be added as needed)

-- dolnośląskie
create table buildings_02 partition of buildings
  for values in ('02');

-- kujawsko-pomorskie  
create table buildings_04 partition of buildings
  for values in ('04');

-- lubelskie
create table buildings_06 partition of buildings
  for values in ('06');

-- lubuskie
create table buildings_08 partition of buildings
  for values in ('08');

-- łódzkie
create table buildings_10 partition of buildings
  for values in ('10');

-- małopolskie
create table buildings_12 partition of buildings
  for values in ('12');

-- mazowieckie
create table buildings_14 partition of buildings
  for values in ('14');

-- opolskie
create table buildings_16 partition of buildings
  for values in ('16');

-- podkarpackie
create table buildings_18 partition of buildings
  for values in ('18');

-- podlaskie
create table buildings_20 partition of buildings
  for values in ('20');

-- pomorskie
create table buildings_22 partition of buildings
  for values in ('22');

-- śląskie
create table buildings_24 partition of buildings
  for values in ('24');

-- świętokrzyskie
create table buildings_26 partition of buildings
  for values in ('26');

-- warmińsko-mazurskie
create table buildings_28 partition of buildings
  for values in ('28');

-- wielkopolskie
create table buildings_30 partition of buildings
  for values in ('30');

-- zachodniopomorskie
create table buildings_32 partition of buildings
  for values in ('32');

-- ============================================================================
-- indexes
-- ============================================================================

-- note: primary key (id, voivodeship_code) automatically creates an index

-- unique constraint: ensures no duplicate buildings
-- combines all location components including optional fields (coalesced to empty string)
create unique index idx_buildings_unique_address on buildings (
  voivodeship_code,
  district_code,
  community_code,
  city_code,
  coalesce(city_part_code, ''),
  city_district_code,
  coalesce(street_code, ''),
  house_number
);

-- btree indexes on all code columns for fast lookups and joins
create index idx_buildings_voivodeship_code on buildings(voivodeship_code);
create index idx_buildings_district_code on buildings(district_code);
create index idx_buildings_community_code on buildings(community_code);
create index idx_buildings_city_code on buildings(city_code);
create index idx_buildings_city_part_code on buildings(city_part_code) where city_part_code is not null;
create index idx_buildings_city_district_code on buildings(city_district_code);
create index idx_buildings_street_code on buildings(street_code) where street_code is not null;

-- index on provider for filtering by isp
create index idx_buildings_provider_id on buildings(provider_id);

-- index on status for filtering active/deleted buildings
create index idx_buildings_status on buildings(status);

-- gist index on location for spatial queries (find buildings near point, within radius, etc.)
create index idx_buildings_location on buildings using gist(location);

-- index on created_at and updated_at for temporal queries
create index idx_buildings_created_at on buildings(created_at);
create index idx_buildings_updated_at on buildings(updated_at);

-- ============================================================================
-- trigger: auto-update updated_at timestamp
-- ============================================================================

-- function to update updated_at column on row modification
create or replace function update_buildings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger to automatically update updated_at before each update
create trigger buildings_updated_at_trigger
  before update on buildings
  for each row
  execute function update_buildings_updated_at();

-- ============================================================================
-- trigger: auto-compute location geography from lat/lon
-- ============================================================================

-- function to compute geography point from latitude and longitude
-- ensures location is always in sync with lat/lon coordinates
create or replace function update_buildings_location()
returns trigger as $$
begin
  -- construct geography point from longitude (x) and latitude (y)
  -- note: postgis uses (longitude, latitude) order, not (lat, lon)
  new.location = st_point(new.longitude, new.latitude)::geography;
  return new;
end;
$$ language plpgsql;

-- trigger to automatically compute location before insert or update
create trigger buildings_location_trigger
  before insert or update of latitude, longitude on buildings
  for each row
  execute function update_buildings_location();

-- ============================================================================
-- row level security
-- ============================================================================

-- enable rls on buildings table
alter table buildings enable row level security;

-- policy: allow READ, WRITE, and ADMIN roles to select buildings
create policy buildings_select on buildings
  for select
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('READ', 'WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can insert buildings
create policy buildings_insert on buildings
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update buildings
create policy buildings_update on buildings
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete buildings
-- note: soft-delete (status='deleted') is preferred over hard delete
create policy buildings_delete on buildings
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

