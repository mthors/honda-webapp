-- Migration: 20261025000002_harden_table_privileges.sql
-- Defense-in-depth: Revoke default table privileges on sensitive tables from public, anon, authenticated, and service_role.
-- Restrict authenticated and service_role access to explicit required operations, preserving RLS policies.

-- Staff profiles: Revoke all privileges; permit DML for authenticated and service_role
revoke all on table public.staff_profiles from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.staff_profiles to authenticated, service_role;

-- Leads: Revoke all privileges; permit DML for authenticated and service_role
revoke all on table public.leads from public, anon, authenticated, service_role;
grant select, insert, update, delete on table public.leads to authenticated, service_role;

-- Audit logs: Revoke all privileges; permit select and insert for authenticated and service_role
revoke all on table public.audit_logs from public, anon, authenticated, service_role;
grant select, insert on table public.audit_logs to authenticated, service_role;
