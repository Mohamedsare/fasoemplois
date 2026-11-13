-- Validation manuelle des inscriptions par l'admin : statut de confirmation de l'e-mail
-- visible dans la vue « admin_users » (filtre « Non confirmés » du back-office).

-- auth.users n'est pas lisible par le rôle authenticated : fonction security definer,
-- qui ne répond qu'aux administrateurs (ou à l'utilisateur lui-même).
create or replace function public.email_confirmed(uid uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select u.email_confirmed_at is not null
  from auth.users u
  where u.id = uid and (public.is_admin() or uid = auth.uid());
$$;

revoke all on function public.email_confirmed(uuid) from public, anon;
grant execute on function public.email_confirmed(uuid) to authenticated;

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
  end as segment,
  coalesce(public.email_confirmed(p.id), true) as email_confirmed
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
