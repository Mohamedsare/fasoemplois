-- Back-office : e-mail des profils (recherche admin), journal des actions admin, suivi des téléchargements PDF.
-- À appliquer avec (ou juste après) le déploiement du code correspondant.

-- ---------------------------------------------------------------------------
-- 1) E-mail recopié depuis auth.users (lisible par l'utilisateur lui-même et les admins, via la RLS existante)
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

create index if not exists profiles_email_idx on public.profiles (lower(email));
create index if not exists profiles_created_idx on public.profiles (created_at desc);

create or replace function public.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end $$;

-- Préfixe « zz_ » : s'exécute après on_auth_user_created (qui crée le profil)
drop trigger if exists zz_sync_profile_email on auth.users;
create trigger zz_sync_profile_email
  after insert or update of email on auth.users
  for each row execute function public.sync_profile_email();

-- ---------------------------------------------------------------------------
-- 2) Journal des actions des administrateurs (écriture côté serveur uniquement)
-- ---------------------------------------------------------------------------
create table if not exists public.admin_logs (
  id bigint generated always as identity primary key,
  admin_id uuid references public.profiles (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists admin_logs_created_idx on public.admin_logs (created_at desc);
create index if not exists admin_logs_user_idx on public.admin_logs (user_id, created_at desc);

alter table public.admin_logs enable row level security;
drop policy if exists "admin_logs_admin_read" on public.admin_logs;
create policy "admin_logs_admin_read" on public.admin_logs for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 3) Téléchargements PDF (statistiques : modèles les plus téléchargés)
-- ---------------------------------------------------------------------------
create table if not exists public.pdf_downloads (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  cv_id uuid references public.cvs (id) on delete set null,
  template text not null,
  created_at timestamptz not null default now()
);

create index if not exists pdf_downloads_created_idx on public.pdf_downloads (created_at desc);
create index if not exists pdf_downloads_user_idx on public.pdf_downloads (user_id, created_at desc);

alter table public.pdf_downloads enable row level security;
drop policy if exists "pdf_downloads_read" on public.pdf_downloads;
create policy "pdf_downloads_read" on public.pdf_downloads for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- 4) Vue « utilisateurs » du back-office : dernier abonnement, nombre de CV, segment.
--    security_invoker : la RLS des tables s'applique (seuls les admins voient tout le monde).
-- ---------------------------------------------------------------------------
create or replace view public.admin_users with (security_invoker = true) as
select
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.city,
  p.headline,
  p.is_admin,
  p.created_at,
  (select count(*) from public.cvs c where c.user_id = p.id)::int as cv_count,
  s.plan_name,
  s.status as subscription_status,
  s.expires_at as subscription_expires_at,
  case
    when s.id is null then 'gratuit'
    when s.status <> 'expired' and s.expires_at > now() then 'abonne'
    else 'expire'
  end as segment
from public.profiles p
left join lateral (
  select sub.id, sub.status, sub.expires_at, pl.name as plan_name
  from public.subscriptions sub
  left join public.plans pl on pl.id = sub.plan_id
  where sub.user_id = p.id
  order by sub.expires_at desc
  limit 1
) s on true;

revoke all on public.admin_users from anon;
grant select on public.admin_users to authenticated;
