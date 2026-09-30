-- Les administrateurs ont accès à tout sans abonnement : pas de limite de CV
create or replace function public.enforce_cv_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.profiles where id = new.user_id and is_admin) then
    return new;
  end if;
  if (select count(*) from public.cvs where user_id = new.user_id) >= public.cv_limit_for(new.user_id) then
    raise exception 'cv_limit_reached' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
