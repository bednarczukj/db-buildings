-- migration: insert_test_data_dolnoslaskie
-- purpose: insert test data for dolnośląskie voivodeship to enable testing
-- tables affected: districts, communities, cities, city_districts, streets, buildings

-- Insert test district for Dolnośląskie
INSERT INTO districts (code, name, voivodeship_code) VALUES
  ('0202', 'Wrocław', '02')
ON CONFLICT (code) DO NOTHING;

-- Insert test community (gmina)
INSERT INTO communities (code, name, district_code, type_id, type) VALUES
  ('0202011', 'Wrocław', '0202', 1, 'miasto')
ON CONFLICT (code) DO NOTHING;

-- Insert test city (miejscowość)
INSERT INTO cities (code, name, community_code) VALUES
  ('0218123', 'Wrocław', '0202011')
ON CONFLICT (code) DO NOTHING;

-- Insert test city district (dzielnica)
INSERT INTO city_districts (code, name, city_code) VALUES
  ('0219810', 'Wrocław Centrum', '0218123')
ON CONFLICT (code) DO NOTHING;

-- Insert test street
INSERT INTO streets (code, name) VALUES
  ('20270', 'Rynek')
ON CONFLICT (code) DO NOTHING;

-- Insert test building for Dolnośląskie
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
    '660e8400-e29b-41d4-a716-446655440001',
    '02',
    'Dolnośląskie',
    '0202',
    'Wrocław',
    '0202011',
    'Wrocław',
    '0218123',
    'Wrocław',
    '0219810',
    'Wrocław Centrum',
    '20270',
    'Rynek',
    '1',
    '50-001',
    51.1079,
    17.0385,
    1,
    'active',
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000'
  )
ON CONFLICT (id, voivodeship_code) DO NOTHING;
