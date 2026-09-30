-- Créateur de CV : plusieurs CV par utilisateur (quota selon le plan), modèles, photo, assistant IA.

-- ---------------------------------------------------------------------------
-- CV multiples
-- ---------------------------------------------------------------------------
alter table public.cvs drop constraint if exists cvs_user_id_key;

alter table public.cvs
  add column if not exists title text not null default 'Mon CV',
  add column if not exists template text not null default 'moderne',
  add column if not exists accent text not null default '#009e49',
  add column if not exists photo_path text,
  add column if not exists website text,
  add column if not exists certifications jsonb not null default '[]'::jsonb,
  add column if not exists interests text[] not null default '{}';

alter table public.cvs drop constraint if exists cvs_template_check;
alter table public.cvs add constraint cvs_template_check check (template in ('moderne', 'classique', 'epure'));
alter table public.cvs drop constraint if exists cvs_accent_check;
alter table public.cvs add constraint cvs_accent_check check (accent ~ '^#[0-9a-fA-F]{6}$');

create index if not exists cvs_user_idx on public.cvs (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Quota de CV par plan (1 sans abonnement)
-- ---------------------------------------------------------------------------
alter table public.plans add column if not exists cv_limit int not null default 1;
alter table public.plans drop constraint if exists plans_cv_limit_check;
alter table public.plans add constraint plans_cv_limit_check check (cv_limit between 1 and 50);

-- Barème demandé : 500 FCFA → 4, 1 200 FCFA → 6, au-delà → 8
update public.plans
set cv_limit = case when price <= 500 then 4 when price <= 1200 then 6 else 8 end
where cv_limit = 1;

create or replace function public.cv_limit_for(uid uuid default auth.uid())
returns int language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.cv_limit
       from public.subscriptions s join public.plans p on p.id = s.plan_id
      where s.user_id = uid and s.status in ('active', 'cancelled') and s.expires_at > now()
      order by s.expires_at desc limit 1),
    1
  );
$$;

create or replace function public.enforce_cv_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.cvs where user_id = new.user_id) >= public.cv_limit_for(new.user_id) then
    raise exception 'cv_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists cvs_limit on public.cvs;
create trigger cvs_limit before insert on public.cvs
  for each row execute function public.enforce_cv_limit();

-- ---------------------------------------------------------------------------
-- Candidature : quel CV en ligne a été envoyé
-- ---------------------------------------------------------------------------
alter table public.applications
  add column if not exists cv_id uuid references public.cvs (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Photos de profil (bucket privé, servi par URL signée)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "photos_storage_own" on storage.objects;
create policy "photos_storage_own" on storage.objects for all to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos_storage_admin_read" on storage.objects;
create policy "photos_storage_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'photos' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Usage de l'assistant IA (limite quotidienne, maîtrise des coûts)
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_idx on public.ai_usage (user_id, created_at desc);

alter table public.ai_usage enable row level security;

drop policy if exists "ai_usage_own_read" on public.ai_usage;
create policy "ai_usage_own_read" on public.ai_usage for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ai_usage_own_insert" on public.ai_usage;
create policy "ai_usage_own_insert" on public.ai_usage for insert to authenticated
  with check (user_id = auth.uid());
