-- migration: insert_providers
-- purpose: insert test providers for buildings
-- tables affected: providers

-- Insert test providers
INSERT INTO providers (id, name, technology, bandwidth) VALUES
  (1, 'Orange Polska S.A.', 'Fiber', 1000),
  (2, 'T-Mobile Polska S.A.', '5G', 600),
  (3, 'Play Sp. z o.o.', 'LTE', 300),
  (4, 'Netia S.A.', 'DSL', 100),
  (5, 'UPC Polska Sp. z o.o.', 'Cable', 500)
ON CONFLICT (id) DO NOTHING;
