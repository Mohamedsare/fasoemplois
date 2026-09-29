-- Faso Emplois — données de démonstration
-- À exécuter après la migration initiale.

insert into public.categories (name, slug, position) values
  ('Développement', 'developpement', 1),
  ('Comptabilité', 'comptabilite', 2),
  ('Marketing', 'marketing', 3),
  ('Commercial', 'commercial', 4),
  ('Administration', 'administration', 5),
  ('Finance', 'finance', 6),
  ('Informatique', 'informatique', 7),
  ('Santé', 'sante', 8),
  ('Agriculture', 'agriculture', 9),
  ('Logistique', 'logistique', 10);

insert into public.companies (name, city, description, website) values
  ('FasoTech Solutions', 'Ouagadougou', 'Éditeur de logiciels et intégrateur de solutions de paiement mobile.', 'https://example.com'),
  ('Cabinet Sahel Conseil', 'Bobo-Dioulasso', 'Cabinet d''expertise comptable au service des PME.', null),
  ('Kôrô Média', 'Ouagadougou', 'Agence de communication digitale et événementielle.', null),
  ('Wend-Panga Distribution', 'Koudougou', 'Distribution de produits de grande consommation.', null),
  ('ONG Terre Verte', 'Ouagadougou', 'Appui aux coopératives agricoles et à la sécurité alimentaire.', null),
  ('Clinique Espoir', 'Koudougou', 'Clinique de médecine générale et de maternité.', null);

insert into public.plans (name, price, description, features, application_limit, badge, is_featured, position) values
  ('Essentiel', 500, 'Pour consulter les offres et postuler ponctuellement.',
    array['Offres complètes', 'Postuler en ligne', 'Suivi des candidatures'], 3, null, false, 1),
  ('Standard', 1200, 'Le meilleur équilibre pour une recherche active.',
    array['Offres complètes', 'Postuler en ligne', 'Suivi des candidatures', 'Recommandations personnalisées'], 15, 'Recommandé', true, 2),
  ('Premium', 2000, 'Pour postuler sans compter.',
    array['Offres complètes', 'Candidatures illimitées', 'Suivi des candidatures', 'Recommandations personnalisées', 'Alertes prioritaires'], null, null, false, 3),
  ('Entreprise', 5000, 'Pour les cabinets et accompagnateurs de candidats.',
    array['Tout Premium', 'Accompagnement dédié'], null, null, false, 4);

update public.plans set is_available = false where name = 'Entreprise';

-- Offres
with src (title, company, category, city, contract, exp, salary, days_ago, deadline_in, summary, skills, featured, urgent) as (
  values
  ('Développeur Full Stack', 'FasoTech Solutions', 'Développement', 'Ouagadougou', 'CDI', '1-3', 'À négocier', 2, 30,
   'Rejoignez notre équipe produit pour concevoir des applications web et mobiles utilisées dans toute l''Afrique de l''Ouest.',
   array['React', 'Node.js', 'PostgreSQL'], true, false),
  ('Responsable comptable', 'Cabinet Sahel Conseil', 'Comptabilité', 'Bobo-Dioulasso', 'CDI', '5+', '450 000 – 600 000 FCFA', 3, 15,
   'Vous encadrez l''équipe comptable du cabinet et supervisez les dossiers de nos clients PME.',
   array['SYSCOHADA', 'Excel'], false, true),
  ('Chargé(e) marketing digital', 'Kôrô Média', 'Marketing', 'Ouagadougou', 'CDD', '1-3', null, 5, 20,
   'Vous pilotez les campagnes digitales de nos clients : réseaux sociaux, contenus et reporting.',
   array['Digital', 'Contenu'], true, false),
  ('Commercial terrain', 'Wend-Panga Distribution', 'Commercial', 'Koudougou', 'CDI', 'debutant', '150 000 FCFA + primes', 7, 25,
   'Vous développez notre réseau de revendeurs dans la région du Centre-Ouest.',
   array['Vente', 'Moto'], false, false),
  ('Assistant(e) administratif', 'ONG Terre Verte', 'Administration', 'Ouagadougou', 'Stage', 'debutant', 'Indemnité de stage', 8, 10,
   'Stage de 6 mois au sein de l''équipe administrative et financière.',
   array['Bureautique', 'Accueil'], false, false),
  ('Infirmier(ère) diplômé(e) d''État', 'Clinique Espoir', 'Santé', 'Koudougou', 'CDI', '1-3', null, 1, 45,
   'La clinique renforce son service de médecine générale.',
   array['Soins', 'Gardes'], false, true)
)
insert into public.jobs (title, company_id, category_id, city, contract_type, experience_level, salary,
  deadline, summary, skills, is_featured, is_urgent, status, published_at)
select s.title, c.id, cat.id, s.city, s.contract::public.contract_type, s.exp::public.experience_level, s.salary,
  current_date + s.deadline_in, s.summary, s.skills, s.featured, s.urgent, 'publie', now() - make_interval(days => s.days_ago)
from src s
join public.companies c on c.name = s.company
join public.categories cat on cat.name = s.category;

-- Sections (réservées aux abonnés sauf mention)
insert into public.job_sections (job_id, kind, content, is_public)
select j.id, v.kind::public.job_section_kind, v.content, v.is_public
from public.jobs j
cross join lateral (values
  ('missions', E'- Analyser les besoins et proposer des solutions adaptées\n- Réaliser les tâches principales du poste avec rigueur\n- Rendre compte régulièrement à votre responsable\n- Contribuer à l''amélioration continue de l''équipe', false),
  ('profil', E'Vous êtes rigoureux(se), autonome et avez le sens du service.\n\n- Formation dans le domaine\n- Bonne maîtrise du français écrit et oral', false),
  ('avantages', E'- Assurance maladie\n- Formation continue\n- Cadre de travail stimulant', false),
  ('candidature', E'Postulez directement sur Faso Emplois avec votre CV et un court message de motivation.\n\nLes candidatures incomplètes ne seront pas étudiées.', false),
  ('formation', 'Bac+2 minimum dans le domaine concerné.', true)
) as v (kind, content, is_public);

insert into public.tips (slug, title, excerpt, category, reading_minutes, content) values
(
  'rediger-un-cv-efficace',
  'Rédiger un CV efficace en 5 étapes',
  'Structure, mots-clés, mise en page : les bases pour qu''un recruteur retienne votre CV en quelques secondes.',
  'CV',
  4,
  E'Un recruteur passe en moyenne moins d''une minute sur un CV. Il doit donc aller droit au but.\n\n## 1. Un titre clair\nIndiquez en haut le poste visé : « Comptable junior », « Technicien réseau »…\n\n## 2. Un résumé de 3 lignes\nQui êtes-vous, que savez-vous faire, que cherchez-vous ?\n\n## 3. Des expériences chiffrées\nPréférez « Gestion de 120 dossiers clients par mois » à « Gestion de dossiers ».\n\n## 4. Les compétences utiles au poste\nAdaptez la liste à chaque offre en reprenant ses mots-clés.\n\n## 5. Une seule page si possible\nAérez, utilisez une police lisible et relisez-vous (ou faites-vous relire).'
),
(
  'reussir-son-entretien',
  'Réussir son entretien d''embauche',
  'Préparation, questions fréquentes et attitude : tout ce qu''il faut savoir avant le jour J.',
  'Entretien',
  5,
  E'## Avant l''entretien\nRenseignez-vous sur l''entreprise : activités, clients, actualités. Relisez l''offre et votre CV.\n\n## Les questions classiques\n- Présentez-vous.\n- Pourquoi ce poste ?\n- Quelles sont vos qualités et vos défauts ?\n- Où vous voyez-vous dans 5 ans ?\n\nPréparez des réponses courtes, appuyées par des exemples concrets.\n\n## Le jour J\nArrivez 10 minutes en avance, avec plusieurs copies de votre CV. Soignez votre tenue et votre ponctualité.\n\n## Après\nEnvoyez un court message de remerciement dans les 24 heures.'
),
(
  'lettre-de-motivation',
  'La lettre de motivation qui fait la différence',
  'Vous, eux, nous : la méthode simple pour une lettre personnalisée et convaincante.',
  'Candidature',
  4,
  E'La lettre de motivation montre que vous avez compris le besoin de l''entreprise.\n\n## Vous\nMontrez que vous connaissez l''entreprise et ses enjeux.\n\n## Moi\nExpliquez ce que vous apportez : compétences, expériences, résultats.\n\n## Nous\nDécrivez ce que vous pourriez accomplir ensemble et proposez une rencontre.\n\nÉvitez les lettres génériques : une lettre par offre.'
),
(
  'trouver-un-stage',
  'Trouver un stage au Burkina Faso',
  'Où chercher, comment relancer et comment transformer un stage en premier emploi.',
  'Recherche',
  3,
  E'## Où chercher\n- Les offres de stage sur Faso Emplois.\n- Les services de stage de votre université.\n- Les candidatures spontanées auprès des entreprises de votre secteur.\n\n## Relancer\nSans réponse après une semaine, relancez poliment par téléphone ou par e-mail.\n\n## Transformer l''essai\nSoyez ponctuel, curieux et force de proposition. Demandez un retour à la fin du stage.'
),
(
  'reseau-professionnel',
  'Développer son réseau professionnel',
  'Beaucoup d''offres ne sont jamais publiées : votre réseau est votre meilleur allié.',
  'Recherche',
  3,
  E'## Commencez par votre entourage\nAnciens camarades, professeurs, famille : faites savoir ce que vous cherchez.\n\n## Participez aux événements\nForums de l''emploi, salons, conférences : venez avec des CV et une présentation de 30 secondes.\n\n## Soignez votre présence en ligne\nUn profil professionnel à jour et une photo sérieuse inspirent confiance.'
),
(
  'eviter-les-arnaques',
  'Repérer les fausses offres d''emploi',
  'Frais de dossier, promesses trop belles : les signaux qui doivent vous alerter.',
  'Sécurité',
  2,
  E'## Les signaux d''alerte\n- On vous demande de payer pour postuler ou pour une formation obligatoire.\n- Le salaire est anormalement élevé pour le poste.\n- Le recruteur refuse de donner le nom ou l''adresse de l''entreprise.\n\n## Le bon réflexe\nUn vrai recruteur ne demande jamais d''argent. En cas de doute, signalez l''offre.'
);
