-- Supabase-compatible roles and schemas for the sandbox stack.
-- Mirrors what the hosted/CLI Supabase Postgres image provides before any
-- project migration runs, so supabase/migrations behave the same here.
-- Sandbox only: passwords are fixed, well-known development values.

create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;

create role authenticator login noinherit password 'postgres';
grant anon, authenticated, service_role to authenticator;

create role supabase_auth_admin login createrole noinherit password 'postgres';
create schema auth authorization supabase_auth_admin;
grant usage on schema auth to anon, authenticated, service_role;
alter role supabase_auth_admin set search_path = auth;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;

-- Supabase's default privileges on the public schema. Row-level security, not
-- these grants, is what protects data — migrations must not rely on them.
grant usage on schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

create table if not exists public.sandbox_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
revoke all on public.sandbox_migrations from anon, authenticated;
