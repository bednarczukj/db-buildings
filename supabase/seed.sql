-- Seed data for testing
-- This file is loaded after migrations during supabase db reset

-- Insert providers
INSERT INTO providers (id, name, technology, bandwidth) VALUES
  (1, 'Orange Polska S.A.', 'Fiber', 1000),
  (2, 'T-Mobile Polska S.A.', '5G', 600),
  (3, 'Play Sp. z o.o.', 'LTE', 300),
  (4, 'Netia S.A.', 'DSL', 100),
  (5, 'UPC Polska Sp. z o.o.', 'Cable', 500)
ON CONFLICT (id) DO NOTHING;

-- Insert voivodeships
INSERT INTO voivodeships (code, name) VALUES
  ('02', 'Dolnośląskie'),
  ('04', 'Kujawsko-pomorskie'),
  ('06', 'Lubelskie'),
  ('08', 'Lubuskie'),
  ('10', 'Łódzkie'),
  ('12', 'Małopolskie'),
  ('14', 'Mazowieckie'),
  ('16', 'Opolskie'),
  ('18', 'Podkarpackie'),
  ('20', 'Podlaskie'),
  ('22', 'Pomorskie'),
  ('24', 'Śląskie'),
  ('26', 'Świętokrzyskie'),
  ('28', 'Warmińsko-mazurskie'),
  ('30', 'Wielkopolskie'),
  ('32', 'Zachodniopomorskie')
ON CONFLICT (code) DO NOTHING;

-- Insert districts
INSERT INTO districts (code, name, voivodeship_code) VALUES
  ('1465', 'Warszawa', '14'),
  ('1261', 'Kraków', '12'),
  ('3063', 'Gdańsk', '22')
ON CONFLICT (code) DO NOTHING;

-- Insert communities
INSERT INTO communities (code, name, type_id, type, district_code) VALUES
  ('1465011', 'Warszawa', 1, 'miasto', '1465'),
  ('1261011', 'Kraków', 1, 'miasto', '1261'),
  ('3063011', 'Gdańsk', 1, 'miasto', '3063')
ON CONFLICT (code) DO NOTHING;

-- Insert cities
INSERT INTO cities (code, name, community_code) VALUES
  ('0918123', 'Warszawa', '1465011'),
  ('0950867', 'Kraków', '1261011'),
  ('0945145', 'Gdańsk', '3063011')
ON CONFLICT (code) DO NOTHING;

-- Insert city districts
INSERT INTO city_districts (code, name, city_code) VALUES
  ('0919810', 'Warszawa Śródmieście', '0918123'),
  ('0950463', 'Kraków-Śródmieście', '0950867')
ON CONFLICT (code) DO NOTHING;

-- Insert streets
INSERT INTO streets (code, name) VALUES
  ('10270', 'Marszałkowska'),
  ('12345', 'Floriańska'),
  ('67890', 'Długa')
ON CONFLICT (code) DO NOTHING;

-- Insert test buildings (using UUIDs from mocks)
-- Note: If any foreign key reference fails (e.g., to city_districts), check dictionary consistency.
INSERT INTO buildings (
  id,
  voivodeship_code,
  voivodeship_name,
  district_code,
  district_name,
  community_code,
  community_name,
  city_code,
  city_name,
  city_district_code,
  city_district_name,
  street_code,
  street_name,
  building_number,
  post_code,
  latitude,
  longitude,
  provider_id,
  status,
  created_by,
  updated_by
) VALUES
  (
    '550e8400-e29b-41d4-a716-446655440001',
    '14',
    'Mazowieckie',
    '1465',
    'Warszawa',
    '1465011',
    'Warszawa',
    '0918123',
    'Warszawa',
    '0919810',
    'Warszawa Śródmieście',
    '10270',
    'Marszałkowska',
    '1',
    '00-001',
    52.2297,
    21.0122,
    1,
    'active',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002',
    '12',
    'Małopolskie',
    '1261',
    'Kraków',
    '1261011',
    'Kraków',
    '0950867',
    'Kraków',
    '0950463',
    'Kraków-Śródmieście',
    '12345',
    'Floriańska',
    '15A',
    '31-019',
    50.0647,
    19.945,
    2,
    'active',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003',
    '22',
    'Pomorskie',
    '3063',
    'Gdańsk',
    '3063011',
    'Gdańsk',
    '0945145',
    'Gdańsk',
    null,
    null,
    '67890',
    'Długa',
    '42',
    '80-001',
    54.352,
    18.6466,
    1,
    'deleted',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
  )
ON CONFLICT (id, voivodeship_code) DO NOTHING;

