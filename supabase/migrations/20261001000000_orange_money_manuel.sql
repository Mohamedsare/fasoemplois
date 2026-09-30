-- Paiement manuel par Orange Money : l'utilisateur fait un dépôt puis saisit l'ID de la
-- transaction ; un administrateur vérifie et valide (abonnement activé) ou rejette.

alter table public.payments
  add column if not exists admin_note text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.profiles (id) on delete set null;

-- Un même ID de transaction ne peut servir qu'une fois (hors paiements annulés ou rejetés).
create unique index if not exists payments_provider_ref_unique
  on public.payments (provider, upper(provider_ref))
  where provider_ref is not null and status in ('pending', 'paid');

-- File de vérification des paiements en attente
create index if not exists payments_pending_idx
  on public.payments (created_at)
  where status = 'pending';
