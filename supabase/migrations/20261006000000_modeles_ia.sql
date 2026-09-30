-- Modèles de CV créés par l'IA depuis le back-office.
-- Un modèle IA est une « fiche de style » JSON (jamais de code), rendue par un moteur unique.

create table if not exists public.cv_templates (
  id text primary key check (id ~ '^ia-[a-z0-9-]{3,40}$'),
  name text not null check (char_length(name) between 2 and 40),
  description text not null default '',
  premium boolean not null default true,
  spec jsonb not null,
  -- Personne d'exemple utilisée pour l'aperçu (awa, issa, mariam…)
  sample text not null default 'awa',
  -- Consigne donnée à l'IA (historique)
  prompt text,
  is_published boolean not null default false,
  position int not null default 100,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists cv_templates_updated_at on public.cv_templates;
create trigger cv_templates_updated_at before update on public.cv_templates
  for each row execute function public.set_updated_at();

alter table public.cv_templates enable row level security;
drop policy if exists "cv_templates_read" on public.cv_templates;
create policy "cv_templates_read" on public.cv_templates for select to anon, authenticated
  using (is_published or public.is_admin());
drop policy if exists "cv_templates_admin" on public.cv_templates;
create policy "cv_templates_admin" on public.cv_templates for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Copie de la fiche de style dans le CV : un CV ne change pas si l'admin modifie ou retire le modèle
alter table public.cvs add column if not exists template_spec jsonb;

-- Les modèles ne sont plus une liste figée : identifiant simple, validé par l'application
alter table public.cvs drop constraint if exists cvs_template_check;
alter table public.cvs add constraint cvs_template_check check (template ~ '^[a-z0-9-]{2,50}$');
