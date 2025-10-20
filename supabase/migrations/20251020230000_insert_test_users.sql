-- migration: insert_test_users
-- purpose: insert test users for local development
-- tables affected: auth.users

-- Test user: bednarczukj@gmail.com with password: password123
-- Note: The trigger handle_new_user() will automatically create a profile with READ role
-- For local development, we use a simple plaintext approach (NOT for production!)
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
    '$2a$10$PK4B8/9HrlKA8Z5S3UEpJeKwK8sUVBP8M5v5a1A8LKKqQy4kLUe0C', -- bcrypt hash of "password123"
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
ON CONFLICT (id) DO NOTHING;
