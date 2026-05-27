alter table public.courses
add column if not exists instructor text;

notify pgrst, 'reload schema';
