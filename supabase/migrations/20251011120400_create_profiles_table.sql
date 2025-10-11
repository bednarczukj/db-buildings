-- migration: create_profiles_table
-- purpose: create profiles table linking supabase auth users to application roles
-- tables affected: profiles
-- notes: references auth.users table managed by supabase auth
--        stores user role for authorization checks

-- ============================================================================
-- profiles
-- ============================================================================

-- profiles table: extends supabase auth.users with application-specific role
-- one-to-one relationship with auth.users
-- user_id is both primary key and foreign key to auth.users(id)
create table profiles (
  user_id uuid primary key references auth.users(id) on update cascade on delete restrict,
  role role_enum not null
);

-- index on role for filtering users by permission level
create index idx_profiles_role on profiles(role);

-- enable row level security
alter table profiles enable row level security;

-- policy: users can view their own profile
create policy profiles_select_own on profiles
  for select
  to authenticated
  using (
    user_id = auth.uid()
  );

-- policy: ADMIN users can view all profiles
create policy profiles_select_admin on profiles
  for select
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: only ADMIN role can insert new profiles
-- rationale: profile creation is part of user provisioning process
create policy profiles_insert on profiles
  for insert
  to authenticated
  with check (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: only ADMIN role can update profiles
-- rationale: role changes are sensitive and should be restricted
create policy profiles_update on profiles
  for update
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- policy: only ADMIN role can delete profiles
-- rationale: profile deletion is part of user deprovisioning
-- note: deletion will fail if foreign key constraints exist (e.g., audit_logs)
create policy profiles_delete on profiles
  for delete
  to authenticated
  using (
    current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN'
  );

-- ============================================================================
-- function: automatically create profile for new users
-- ============================================================================

-- function to create a profile with default READ role when user signs up
-- this ensures every authenticated user has a profile record
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, role)
  values (new.id, 'READ');
  return new;
end;
$$ language plpgsql security definer;

-- trigger on auth.users insert to auto-create profile
-- security definer: allows function to insert into profiles table bypassing rls
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function handle_new_user();

