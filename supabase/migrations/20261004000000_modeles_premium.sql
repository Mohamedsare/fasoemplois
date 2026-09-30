-- Modèles de CV premium : 12 modèles (3 gratuits + 9 Premium inclus dans les abonnements).
-- Sans risque : peut être appliquée avant ou après le déploiement du code.

alter table public.cvs drop constraint if exists cvs_template_check;
alter table public.cvs add constraint cvs_template_check check (template in (
  'moderne', 'classique', 'epure',
  'executif', 'elegance', 'horizon', 'parcours', 'creatif', 'prestige', 'compact', 'corporate', 'mosaique'
));

-- Avantages des plans : les modèles Premium remplacent la mention « 3 modèles »
-- (les plans modifiés à la main dans l'admin gardent leurs autres avantages)
update public.plans
set features = array_append(
  array_remove(array_remove(features, '3 modèles et 7 couleurs'), '12 modèles, dont 9 Premium'),
  '12 modèles, dont 9 Premium'
);
