-- Course categories for catalog filtering and admin management

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_sort_order_idx on public.categories (sort_order, name);

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

alter table public.categories enable row level security;

insert into public.categories (name, slug, sort_order, is_active)
values
  ('Clinical Documentation', 'clinical-documentation', 1, true),
  ('Healthcare Operations', 'healthcare-operations', 2, true),
  ('Medical Leadership', 'medical-leadership', 3, true)
on conflict (slug) do nothing;
