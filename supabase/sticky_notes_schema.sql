-- Sticky notes realtime schema for Supabase
-- Run this in the Supabase SQL editor for your project.

create extension if not exists pgcrypto;

create table if not exists public.sticky_notes (
  id uuid primary key default gen_random_uuid(),
  board_id text not null default 'global',
  text text not null default '',
  color text not null,
  x double precision not null,
  y double precision not null,
  rotation double precision not null default 0,
  created_by text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sticky_notes_global_board_only check (board_id = 'global'),
  constraint sticky_notes_text_length check (char_length(text) <= 500)
);

create index if not exists sticky_notes_board_updated_idx
  on public.sticky_notes (board_id, updated_at desc);

create or replace function public.set_sticky_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tr_sticky_notes_set_updated_at on public.sticky_notes;
create trigger tr_sticky_notes_set_updated_at
before update on public.sticky_notes
for each row
execute function public.set_sticky_notes_updated_at();

alter table public.sticky_notes replica identity full;
alter table public.sticky_notes enable row level security;

drop policy if exists "sticky_notes_select_global_anon" on public.sticky_notes;
create policy "sticky_notes_select_global_anon"
on public.sticky_notes
for select
to anon
using (board_id = 'global');

drop policy if exists "sticky_notes_insert_global_anon" on public.sticky_notes;
create policy "sticky_notes_insert_global_anon"
on public.sticky_notes
for insert
to anon
with check (board_id = 'global');

drop policy if exists "sticky_notes_update_global_anon" on public.sticky_notes;
create policy "sticky_notes_update_global_anon"
on public.sticky_notes
for update
to anon
using (board_id = 'global')
with check (board_id = 'global');

drop policy if exists "sticky_notes_delete_global_anon" on public.sticky_notes;
create policy "sticky_notes_delete_global_anon"
on public.sticky_notes
for delete
to anon
using (board_id = 'global');

drop policy if exists "sticky_notes_select_global_authenticated" on public.sticky_notes;
create policy "sticky_notes_select_global_authenticated"
on public.sticky_notes
for select
to authenticated
using (board_id = 'global');

drop policy if exists "sticky_notes_insert_global_authenticated" on public.sticky_notes;
create policy "sticky_notes_insert_global_authenticated"
on public.sticky_notes
for insert
to authenticated
with check (board_id = 'global');

drop policy if exists "sticky_notes_update_global_authenticated" on public.sticky_notes;
create policy "sticky_notes_update_global_authenticated"
on public.sticky_notes
for update
to authenticated
using (board_id = 'global')
with check (board_id = 'global');

drop policy if exists "sticky_notes_delete_global_authenticated" on public.sticky_notes;
create policy "sticky_notes_delete_global_authenticated"
on public.sticky_notes
for delete
to authenticated
using (board_id = 'global');

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'sticky_notes'
  ) then
    alter publication supabase_realtime add table public.sticky_notes;
  end if;
end;
$$;
