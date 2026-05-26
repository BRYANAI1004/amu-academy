-- AMU Academy course and lesson metadata schema

create extension if not exists "pgcrypto";

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  description text,
  short_description text,
  overview text,
  what_you_learn jsonb not null default '[]'::jsonb,
  price_cents integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'draft',
  lesson_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  duration_seconds integer,
  sort_order integer not null default 0,
  is_preview boolean not null default false,
  objectives jsonb not null default '[]'::jsonb,
  notes text,
  video_provider text,
  video_uid text,
  video_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, sort_order)
);

create index if not exists lessons_course_id_idx on public.lessons (course_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row
execute function public.set_updated_at();

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
before update on public.lessons
for each row
execute function public.set_updated_at();

create or replace function public.sync_course_lesson_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.courses
    set lesson_count = lesson_count + 1,
        updated_at = now()
    where id = new.course_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.courses
    set lesson_count = greatest(lesson_count - 1, 0),
        updated_at = now()
    where id = old.course_id;
    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists lessons_sync_course_lesson_count on public.lessons;
create trigger lessons_sync_course_lesson_count
after insert or delete on public.lessons
for each row
execute function public.sync_course_lesson_count();

alter table public.courses enable row level security;
alter table public.lessons enable row level security;
