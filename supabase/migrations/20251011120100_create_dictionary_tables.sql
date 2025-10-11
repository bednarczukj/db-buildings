-- migration: create_dictionary_tables
-- purpose: create territorial division dictionary tables (voivodeships, districts, communities, cities, city_districts, streets)
-- tables affected: voivodeships, districts, communities, cities, city_districts, streets
-- notes: these tables store reference data for polish administrative divisions

-- ============================================================================
-- voivodeships (województwa)
-- ============================================================================

-- voivodeships table: stores top-level administrative divisions in poland
-- uses 7-character teryt code as primary key
create table voivodeships (
  code varchar(7) primary key,
  name varchar(100) not null
);

-- enable row level security
alter table voivodeships enable row level security;

-- policy: allow all users to read voivodeships (public reference data)
create policy voivodeships_select_anon on voivodeships
  for select
  to anon
  using (true);

create policy voivodeships_select_authenticated on voivodeships
  for select
  to authenticated
  using (true);

-- policy: only WRITE and ADMIN roles can insert voivodeships
create policy voivodeships_insert on voivodeships
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update voivodeships
create policy voivodeships_update on voivodeships
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete voivodeships
create policy voivodeships_delete on voivodeships
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- districts (powiaty)
-- ============================================================================

-- districts table: stores second-level administrative divisions
-- each district belongs to exactly one voivodeship
create table districts (
  code varchar(7) primary key,
  name varchar(100) not null,
  voivodeship_code varchar(7) not null references voivodeships(code) on update cascade on delete restrict
);

-- index for foreign key lookups
create index idx_districts_voivodeship_code on districts(voivodeship_code);

-- enable row level security
alter table districts enable row level security;

-- policy: allow all users to read districts (public reference data)
create policy districts_select_anon on districts
  for select
  to anon
  using (true);

create policy districts_select_authenticated on districts
  for select
  to authenticated
  using (true);

-- policy: only WRITE and ADMIN roles can insert districts
create policy districts_insert on districts
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update districts
create policy districts_update on districts
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete districts
create policy districts_delete on districts
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- communities (gminy)
-- ============================================================================

-- communities table: stores third-level administrative divisions (municipalities)
-- each community belongs to exactly one district
-- type_id and type indicate the kind of community (urban, rural, urban-rural)
create table communities (
  code varchar(7) primary key,
  name varchar(100) not null,
  type_id integer,
  type varchar(50),
  district_code varchar(7) not null references districts(code) on update cascade on delete restrict
);

-- index for foreign key lookups
create index idx_communities_district_code on communities(district_code);

-- enable row level security
alter table communities enable row level security;

-- policy: allow all users to read communities (public reference data)
create policy communities_select_anon on communities
  for select
  to anon
  using (true);

create policy communities_select_authenticated on communities
  for select
  to authenticated
  using (true);

-- policy: only WRITE and ADMIN roles can insert communities
create policy communities_insert on communities
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update communities
create policy communities_update on communities
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete communities
create policy communities_delete on communities
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- cities (miejscowości)
-- ============================================================================

-- cities table: stores localities (cities and city parts)
-- each city belongs to exactly one community
-- cities can have hierarchical structure where city parts reference parent city
-- used for autocomplete with pg_trgm gin index on name
create table cities (
  code varchar(7) primary key,
  name varchar(100) not null,
  community_code varchar(7) not null references communities(code) on update cascade on delete restrict
);

-- index for foreign key lookups
create index idx_cities_community_code on cities(community_code);

-- gin index using pg_trgm for fast fuzzy text search on city names (autocomplete)
create index idx_cities_name_trgm on cities using gin (name gin_trgm_ops);

-- enable row level security
alter table cities enable row level security;

-- policy: allow all users to read cities (public reference data)
create policy cities_select_anon on cities
  for select
  to anon
  using (true);

create policy cities_select_authenticated on cities
  for select
  to authenticated
  using (true);

-- policy: only WRITE and ADMIN roles can insert cities
create policy cities_insert on cities
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update cities
create policy cities_update on cities
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete cities
create policy cities_delete on cities
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- city_districts (dzielnice)
-- ============================================================================

-- city_districts table: stores districts within larger cities
-- each city_district belongs to exactly one city
create table city_districts (
  code varchar(7) primary key,
  name varchar(100) not null,
  city_code varchar(7) not null references cities(code) on update cascade on delete restrict
);

-- index for foreign key lookups
create index idx_city_districts_city_code on city_districts(city_code);

-- enable row level security
alter table city_districts enable row level security;

-- policy: allow all users to read city_districts (public reference data)
create policy city_districts_select_anon on city_districts
  for select
  to anon
  using (true);

create policy city_districts_select_authenticated on city_districts
  for select
  to authenticated
  using (true);

-- policy: only WRITE and ADMIN roles can insert city_districts
create policy city_districts_insert on city_districts
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update city_districts
create policy city_districts_update on city_districts
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete city_districts
create policy city_districts_delete on city_districts
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- streets (ulice)
-- ============================================================================

-- streets table: stores street names with teryt codes
-- note: currently no foreign key to parent entity (city or city_district)
-- as per db-plan, this may need to be added in future migration
-- used for autocomplete with pg_trgm gin index on name
create table streets (
  code varchar(7) primary key,
  name varchar(100) not null
);

-- gin index using pg_trgm for fast fuzzy text search on street names (autocomplete)
create index idx_streets_name_trgm on streets using gin (name gin_trgm_ops);

-- enable row level security
alter table streets enable row level security;

-- policy: allow all users to read streets (public reference data)
create policy streets_select_anon on streets
  for select
  to anon
  using (true);

create policy streets_select_authenticated on streets
  for select
  to authenticated
  using (true);

-- policy: only WRITE and ADMIN roles can insert streets
create policy streets_insert on streets
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only WRITE and ADMIN roles can update streets
create policy streets_update on streets
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' in ('WRITE', 'ADMIN')
  );

-- policy: only ADMIN role can delete streets
create policy streets_delete on streets
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

