-- migration: insert_voivodeships
-- purpose: insert all 16 polish voivodeships
-- tables affected: voivodeships

-- Insert all 16 Polish voivodeships (Województwa)
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
