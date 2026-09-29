-- Connexion Google : le profil reprend le prénom / nom fournis par le fournisseur OAuth.
-- Google renvoie `full_name` / `name` (et parfois `given_name` / `family_name`), pas nos clés
-- `first_name` / `last_name` utilisées par le formulaire d'inscription.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  full_name text := trim(coalesce(meta ->> 'full_name', meta ->> 'name', ''));
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    coalesce(
      nullif(meta ->> 'first_name', ''),
      nullif(meta ->> 'given_name', ''),
      split_part(full_name, ' ', 1)
    ),
    coalesce(
      nullif(meta ->> 'last_name', ''),
      nullif(meta ->> 'family_name', ''),
      nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''),
      ''
    ),
    meta ->> 'phone'
  );
  return new;
end;
$$;
