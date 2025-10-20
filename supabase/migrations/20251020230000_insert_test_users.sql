-- migration: insert_test_users
-- purpose: insert test users for local development
-- tables affected: auth.users

-- Test user: bednarczukj@gmail.com with password: password123
-- Note: The trigger handle_new_user() will automatically create a profile with READ role
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'bednarczukj@gmail.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;
