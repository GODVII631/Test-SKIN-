-- Skin Portal: schema, RLS, storage. Admin role is NEVER writable from the client.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique not null,
  username text not null,
  global_name text,
  avatar text,
  role text not null default 'member' check (role in ('admin','member')),
  ic_name text default '',
  skin_quota int not null default 3 check (skin_quota >= 0),
  submitted_count int not null default 0 check (submitted_count >= 0),
  is_blocked boolean not null default false,
  notification_enabled boolean not null default true,
  notify_on_submission boolean not null default true,
  notify_on_status_change boolean not null default true,
  sound_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- webhook URL lives in its own table: only the owner can read it
create table public.user_webhooks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  webhook_url text not null check (webhook_url ~ '^https://(discord|discordapp)\.com/api/webhooks/[0-9]+/[A-Za-z0-9_-]+$')
);

create table public.skin_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ic_name text not null check (char_length(ic_name) between 1 and 64),
  skin_title text not null check (char_length(skin_title) between 1 and 120),
  description text check (char_length(description) <= 1000),
  file_name text not null check (file_name ~* '\.(mcaddon|zip|png)$'),
  file_size bigint not null check (file_size > 0 and file_size <= 52428800),
  file_path text not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note text,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.skin_submissions (user_id, created_at desc);
create index on public.skin_submissions (status, created_at desc);

create table public.bot_logs (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.skin_submissions(id) on delete set null,
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  event text not null,
  status text not null check (status in ('sent','simulated','failed','skipped')),
  channel text,
  error_message text,
  created_at timestamptz not null default now()
);
create index on public.bot_logs (created_at desc);

-- helpers
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- create profile on first Discord login; admin only via server-side config table
create table public.app_config (key text primary key, value text not null);
alter table public.app_config enable row level security; -- no policies = nobody via API

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := new.raw_user_meta_data;
  did text := coalesce(meta->>'provider_id', meta->>'sub');
  admin_id text := (select value from public.app_config where key = 'initial_admin_discord_id');
begin
  insert into public.profiles (id, discord_id, username, global_name, avatar, role, skin_quota)
  values (
    new.id, did,
    coalesce(meta->>'user_name', meta->>'name', 'discord_user'),
    meta->>'full_name',
    meta->>'avatar_url',
    case when admin_id is not null and did = admin_id then 'admin' else 'member' end,
    case when admin_id is not null and did = admin_id then 15 else 3 end
  );
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- block clients from changing privileged columns
create or replace function public.guard_profile_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.role := old.role; new.skin_quota := old.skin_quota;
    new.submitted_count := old.submitted_count; new.is_blocked := old.is_blocked;
    new.discord_id := old.discord_id;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_profile before update on public.profiles
  for each row execute function public.guard_profile_update();

-- quota enforced server-side on insert/delete
create or replace function public.submission_quota() returns trigger
language plpgsql security definer set search_path = public as $$
declare p public.profiles;
begin
  if tg_op = 'INSERT' then
    select * into p from public.profiles where id = new.user_id for update;
    if p.is_blocked then raise exception 'บัญชีถูกระงับสิทธิ์การส่งสกิน'; end if;
    if p.submitted_count >= p.skin_quota then
      raise exception 'ส่งสกินครบตามโควตาแล้ว (%/%)', p.submitted_count, p.skin_quota;
    end if;
    update public.profiles set submitted_count = submitted_count + 1 where id = new.user_id;
    return new;
  else
    update public.profiles set submitted_count = greatest(submitted_count - 1, 0) where id = old.user_id;
    return old;
  end if;
end $$;
create trigger quota_ins before insert on public.skin_submissions for each row execute function public.submission_quota();
create trigger quota_del after delete on public.skin_submissions for each row execute function public.submission_quota();

-- owners cannot change status/review fields; editing resets to pending
create or replace function public.guard_submission_update() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    new.user_id := old.user_id; new.admin_note := old.admin_note;
    new.reviewed_by := old.reviewed_by; new.status := 'pending';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger guard_submission before update on public.skin_submissions
  for each row execute function public.guard_submission_update();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_webhooks enable row level security;
alter table public.skin_submissions enable row level security;
alter table public.bot_logs enable row level security;

create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy webhooks_all on public.user_webhooks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy subs_select on public.skin_submissions for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());
create policy subs_insert on public.skin_submissions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy subs_update on public.skin_submissions for update to authenticated
  using (user_id = (select auth.uid()) or public.is_admin())
  with check (user_id = (select auth.uid()) or public.is_admin());
create policy subs_delete on public.skin_submissions for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy logs_select on public.bot_logs for select to authenticated using (public.is_admin());
create policy logs_insert on public.bot_logs for insert to authenticated
  with check (user_id = (select auth.uid()));

-- private storage bucket: 50 MB, path = <user_id>/<file>
insert into storage.buckets (id, name, public, file_size_limit)
values ('addons','addons', false, 52428800) on conflict (id) do nothing;

create policy addons_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'addons' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy addons_select on storage.objects for select to authenticated
  using (bucket_id = 'addons' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));
create policy addons_update on storage.objects for update to authenticated
  using (bucket_id = 'addons' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy addons_delete on storage.objects for delete to authenticated
  using (bucket_id = 'addons' and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));

-- realtime
alter publication supabase_realtime add table public.skin_submissions, public.profiles, public.bot_logs;
