-- Run once in Supabase SQL Editor before using this game build.
create table if not exists public.room_private (
  room_id uuid primary key references public.rooms(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.room_private enable row level security;
revoke all on public.room_private from anon, authenticated;
grant all on public.room_private to service_role;
-- The browser now calls the Vercel server route only. Remove previous public policies
-- so clients cannot read room tokens/private state or forge room updates directly.
do $$ declare p record; begin
  for p in select schemaname, tablename, policyname from pg_policies where schemaname='public' and tablename in ('rooms','room_players','room_private') loop
    execute format('drop policy if exists %I on %I.%I',p.policyname,p.schemaname,p.tablename);
  end loop;
end $$;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
revoke all on public.rooms from anon, authenticated;
revoke all on public.room_players from anon, authenticated;
grant all on public.rooms to service_role;
grant all on public.room_players to service_role;
