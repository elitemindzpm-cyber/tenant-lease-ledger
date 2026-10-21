-- Run this in the SQL editor of the PRODUCTION backend
-- (https://rnebpqnzignwjeukgztz.supabase.co — the same database the Zyno website uses).
-- It creates the maintenance-requests table the tenant app reads and writes,
-- scoped so each tenant only ever sees their own requests (matched by sign-in email).

create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_email text not null,
  customer_id uuid references public.customers (id) on delete set null,
  lease_id uuid references public.leases (id) on delete set null,
  subject text not null,
  description text,
  category text,
  area text,
  priority text not null default 'Medium',
  preferred_time timestamptz,
  status text not null default 'open', -- open | in_progress | resolved | closed
  assignee text,
  rating int check (rating between 1 and 5),
  timeline jsonb not null default '[]'::jsonb
);

create index if not exists maintenance_requests_email_idx on public.maintenance_requests (customer_email);

grant select, insert, update on public.maintenance_requests to authenticated;
grant all on public.maintenance_requests to service_role;

alter table public.maintenance_requests enable row level security;

-- Tenants read only their own requests (their login email matches the row).
create policy "tenants read own requests"
  on public.maintenance_requests for select to authenticated
  using (lower(customer_email) = lower(auth.jwt() ->> 'email'));

-- Tenants can raise a request only under their own email.
create policy "tenants create own requests"
  on public.maintenance_requests for insert to authenticated
  with check (lower(customer_email) = lower(auth.jwt() ->> 'email'));

-- Tenants can update only their own requests (cancel / rate a repair).
create policy "tenants update own requests"
  on public.maintenance_requests for update to authenticated
  using (lower(customer_email) = lower(auth.jwt() ->> 'email'))
  with check (lower(customer_email) = lower(auth.jwt() ->> 'email'));

-- Staff manage all requests through the service role (website admin side).
