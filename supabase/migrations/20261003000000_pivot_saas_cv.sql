-- Pivot : le produit devient un SaaS de création de CV propulsé par l'IA.
-- Suppression DÉFINITIVE de tout ce qui concerne les offres d'emploi (tables et données).
-- ⚠️ À appliquer APRÈS le déploiement du code qui n'utilise plus ces tables.

-- Candidatures, favoris, offres et référentiels
drop table if exists public.application_events cascade;
drop table if exists public.applications cascade;
drop table if exists public.favorites cascade;
drop table if exists public.job_sections cascade;
drop table if exists public.jobs cascade;
drop table if exists public.companies cascade;
drop table if exists public.categories cascade;

-- Fonctions liées aux offres
drop function if exists public.public_stats();
drop function if exists public.job_outline(uuid);
drop function if exists public.enforce_application_limit();
drop function if exists public.log_application_status();

-- Types devenus inutiles
drop type if exists public.application_status;
drop type if exists public.job_section_kind;
drop type if exists public.job_status;
drop type if exists public.contract_type;

-- Plans : la limite de candidatures n'a plus de sens
alter table public.plans drop column if exists application_limit;

-- Profils : préférences de recherche d'emploi
alter table public.profiles
  drop column if exists pref_contracts,
  drop column if exists pref_cities,
  drop column if exists pref_categories;

-- Stockage : logos d'entreprises (le bucket, s'il contient des fichiers, se vide depuis le dashboard)
drop policy if exists "logos_storage_admin" on storage.objects;

-- Plans : avantages reformulés pour le créateur de CV (modifiables ensuite dans Admin > Abonnements)
update public.plans
set features = array[
  cv_limit || ' CV professionnels',
  'Téléchargement PDF illimité',
  'Assistant IA étendu',
  '3 modèles et 7 couleurs'
];
