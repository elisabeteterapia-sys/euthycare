-- ============================================================
-- 001 — Initial Schema
-- ============================================================

-- Profiles (extends auth.users)
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  name        text,
  avatar_url  text,
  plan        text not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- Storage bucket
-- ============================================================

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Users can upload to their own folder
create policy "Users upload to own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'uploads' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can manage own files
create policy "Users manage own files"
  on storage.objects for all
  using (
    bucket_id = 'uploads' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read for uploads bucket
create policy "Public read uploads"
  on storage.objects for select
  using (bucket_id = 'uploads');
