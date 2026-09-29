-- Faso Emploi — schéma initial
-- Modèle : offres publiées par l'admin, contenu complet réservé aux abonnés.
-- À appliquer via `npm run db:migrate`, `supabase db push` ou le SQL Editor.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.contract_type as enum ('CDI', 'CDD', 'Stage', 'Freelance', 'Temps partiel', 'Bénévolat');
create type public.experience_level as enum ('debutant', '1-3', '3-5', '5+');
create type public.job_status as enum ('brouillon', 'publie', 'archive');
create type public.job_section_kind as enum (
  'missions', 'profil', 'competences', 'formation', 'experience', 'avantages', 'candidature'
);
create type public.application_status as enum ('envoyee', 'consultee', 'en_cours', 'retenue', 'refusee');
create type public.subscription_status as enum ('active', 'cancelled', 'expired');
create type public.payment_status as enum ('pending', 'paid', 'failed', 'expired', 'cancelled');
create type public.payment_method as enum ('mobile_money', 'card', 'other');

-- ---------------------------------------------------------------------------
-- Utilitaires
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profils (1-1 avec auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  full_name text generated always as (trim(first_name || ' ' || last_name)) stored,
  phone text,
  city text,
  headline text,
  experience_level public.experience_level,
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  pref_contracts text[] not null default '{}',
  pref_cities text[] not null default '{}',
  pref_categories uuid[] not null default '{}',
  onboarding_completed_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- Référentiels : catégories et entreprises
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  description text,
  city text,
  website text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Offres d'emploi
-- ---------------------------------------------------------------------------
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  company_id uuid not null references public.companies (id) on delete restrict,
  category_id uuid references public.categories (id) on delete set null,
  city text not null,
  contract_type public.contract_type not null,
  experience_level public.experience_level,
  salary text,
  deadline date,
  -- « À propos du poste » : toujours public
  summary text not null default '',
  skills text[] not null default '{}',
  is_featured boolean not null default false,
  is_urgent boolean not null default false,
  status public.job_status not null default 'brouillon',
  -- Date de mise en ligne (future = programmée)
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index jobs_visible_idx on public.jobs (status, published_at desc);
create index jobs_category_idx on public.jobs (category_id);
create index jobs_company_idx on public.jobs (company_id);

create trigger jobs_updated_at before update on public.jobs
  for each row execute function public.set_updated_at();

-- Sections détaillées ; is_public = visible sans abonnement
create table public.job_sections (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  kind public.job_section_kind not null,
  content text not null,
  is_public boolean not null default false,
  unique (job_id, kind)
);

create or replace function public.job_is_visible(j public.jobs)
returns boolean language sql stable as $$
  select j.status = 'publie' and j.published_at is not null and j.published_at <= now();
$$;

-- ---------------------------------------------------------------------------
-- Plans, abonnements, paiements
-- ---------------------------------------------------------------------------
create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price int not null check (price >= 0),
  description text,
  features text[] not null default '{}',
  -- Nombre max de candidatures par mois (null = illimité)
  application_limit int check (application_limit is null or application_limit > 0),
  badge text,
  is_featured boolean not null default false,
  is_available boolean not null default true,
  cta_label text not null default 'Choisir ce plan',
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete restrict,
  amount int not null,
  method public.payment_method not null,
  phone text,
  status public.payment_status not null default 'pending',
  provider text not null default 'simulation',
  provider_ref text,
  -- Page vers laquelle revenir après paiement (ex. /offres/<id>)
  return_to text,
  expires_at timestamptz not null default now() + interval '5 minutes',
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index payments_user_idx on public.payments (user_id, created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_id uuid not null references public.plans (id) on delete restrict,
  payment_id uuid references public.payments (id) on delete set null,
  status public.subscription_status not null default 'active',
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index subscriptions_user_idx on public.subscriptions (user_id, expires_at desc);

-- Abonnement en cours (actif ou résilié mais non échu)
create or replace function public.has_active_subscription(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = uid and status in ('active', 'cancelled') and expires_at > now()
  );
$$;

-- ---------------------------------------------------------------------------
-- CV
-- ---------------------------------------------------------------------------
create table public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  full_name text not null default '',
  headline text,
  email text,
  phone text,
  city text,
  summary text,
  experiences jsonb not null default '[]'::jsonb,
  education jsonb not null default '[]'::jsonb,
  skills text[] not null default '{}',
  languages text[] not null default '{}',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create trigger cvs_updated_at before update on public.cvs
  for each row execute function public.set_updated_at();

-- CV en PDF (bucket privé « cvs », chemin <user_id>/<fichier>.pdf)
create table public.cv_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  path text not null unique,
  size int not null default 0,
  created_at timestamptz not null default now()
);

create index cv_files_user_idx on public.cv_files (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Favoris et candidatures
-- ---------------------------------------------------------------------------
create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  job_id uuid not null references public.jobs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, job_id)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  message text,
  cv_file_id uuid references public.cv_files (id) on delete set null,
  include_online_cv boolean not null default false,
  status public.application_status not null default 'envoyee',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, user_id)
);

create index applications_user_idx on public.applications (user_id, created_at desc);
create index applications_job_idx on public.applications (job_id, created_at desc);

create trigger applications_updated_at before update on public.applications
  for each row execute function public.set_updated_at();

-- Historique des statuts (timeline candidat)
create table public.application_events (
  id bigint generated always as identity primary key,
  application_id uuid not null references public.applications (id) on delete cascade,
  status public.application_status not null,
  created_at timestamptz not null default now()
);

create index application_events_app_idx on public.application_events (application_id, created_at);

create or replace function public.log_application_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.application_events (application_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

create trigger applications_log_status
  after insert or update of status on public.applications
  for each row execute function public.log_application_status();

-- Limite mensuelle de candidatures selon le plan
create or replace function public.enforce_application_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  lim int;
  used int;
begin
  select p.application_limit into lim
  from public.subscriptions s join public.plans p on p.id = s.plan_id
  where s.user_id = new.user_id and s.status in ('active', 'cancelled') and s.expires_at > now()
  order by s.expires_at desc limit 1;

  if lim is not null then
    select count(*) into used from public.applications
    where user_id = new.user_id and created_at >= date_trunc('month', now());
    if used >= lim then
      raise exception 'application_limit_reached' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger applications_limit
  before insert on public.applications
  for each row execute function public.enforce_application_limit();

-- ---------------------------------------------------------------------------
-- Astuces
-- ---------------------------------------------------------------------------
create table public.tips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  content text not null,
  category text not null,
  reading_minutes int not null default 3,
  is_published boolean not null default true,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Fonctions publiques
-- ---------------------------------------------------------------------------
-- Chiffres de la page d'accueil (sans exposer les tables)
create or replace function public.public_stats()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'jobs', (select count(*) from public.jobs j where public.job_is_visible(j)),
    'new_jobs', (select count(*) from public.jobs j
                 where public.job_is_visible(j) and j.published_at > now() - interval '7 days'),
    'companies', (select count(*) from public.companies),
    'candidates', (select count(*) from public.profiles where not is_admin)
  );
$$;

-- Plan des sections d'une offre publiée (titres seulement, sans le contenu)
create or replace function public.job_outline(p_job_id uuid)
returns table (kind public.job_section_kind, is_public boolean)
language sql stable security definer set search_path = '' as $$
  select s.kind, s.is_public
  from public.job_sections s join public.jobs j on j.id = s.job_id
  where s.job_id = p_job_id and public.job_is_visible(j);
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.job_sections enable row level security;
alter table public.plans enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.cvs enable row level security;
alter table public.cv_files enable row level security;
alter table public.favorites enable row level security;
alter table public.applications enable row level security;
alter table public.application_events enable row level security;
alter table public.tips enable row level security;

-- profiles
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (first_name, last_name, phone, city, headline, experience_level, skills, languages,
  pref_contracts, pref_cities, pref_categories, onboarding_completed_at)
  on public.profiles to authenticated;

-- categories / companies : lecture publique, écriture admin
create policy "categories_read" on public.categories for select to anon, authenticated using (true);
create policy "categories_admin" on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "companies_read" on public.companies for select to anon, authenticated using (true);
create policy "companies_admin" on public.companies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- jobs
create policy "jobs_read" on public.jobs for select to anon, authenticated
  using ((status = 'publie' and published_at <= now()) or public.is_admin());
create policy "jobs_admin" on public.jobs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- job_sections : le contenu réservé n'est jamais envoyé aux non-abonnés
create policy "job_sections_read" on public.job_sections for select to anon, authenticated
  using (
    public.is_admin()
    or (
      (is_public or public.has_active_subscription())
      and exists (select 1 from public.jobs j where j.id = job_id and public.job_is_visible(j))
    )
  );
create policy "job_sections_admin" on public.job_sections for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- plans
create policy "plans_read" on public.plans for select to anon, authenticated
  using (is_available or public.is_admin());
create policy "plans_admin" on public.plans for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- payments / subscriptions : lecture seule côté client (écritures via la clé service_role)
create policy "payments_read" on public.payments for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions_read" on public.subscriptions for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "subscriptions_admin" on public.subscriptions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- cvs / cv_files
create policy "cvs_own" on public.cvs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cvs_admin_read" on public.cvs for select to authenticated using (public.is_admin());
create policy "cv_files_own" on public.cv_files for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cv_files_admin_read" on public.cv_files for select to authenticated using (public.is_admin());

-- favorites
create policy "favorites_own" on public.favorites for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- applications
create policy "applications_read" on public.applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "applications_insert" on public.applications for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.has_active_subscription()
    and exists (select 1 from public.jobs j where j.id = job_id and public.job_is_visible(j))
  );
create policy "applications_admin_update" on public.applications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke update on public.applications from authenticated, anon;
grant update (status) on public.applications to authenticated;

create policy "application_events_read" on public.application_events for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
  );

-- tips
create policy "tips_read" on public.tips for select to anon, authenticated
  using (is_published or public.is_admin());
create policy "tips_admin" on public.tips for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Stockage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('cvs', 'cvs', false, 5242880, array['application/pdf']),
  ('logos', 'logos', true, 1048576, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

create policy "cvs_storage_own" on storage.objects for all to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cvs_storage_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and public.is_admin());

create policy "logos_storage_admin" on storage.objects for all to authenticated
  using (bucket_id = 'logos' and public.is_admin())
  with check (bucket_id = 'logos' and public.is_admin());
