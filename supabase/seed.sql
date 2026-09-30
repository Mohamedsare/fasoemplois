-- Données de démonstration (SaaS de création de CV)
-- À exécuter après toutes les migrations.

insert into public.plans (name, price, description, features, badge, is_featured, position, cv_limit) values
  ('Essentiel', 500, 'Pour un CV soigné, prêt à envoyer.',
    array['4 CV professionnels', 'Téléchargement PDF illimité', '12 modèles, dont 9 Premium', 'Assistant IA étendu'], null, false, 1, 4),
  ('Standard', 1200, 'Un CV adapté à chaque poste visé.',
    array['6 CV professionnels', 'Téléchargement PDF illimité', '12 modèles, dont 9 Premium', 'Assistant IA étendu et relecture notée'], 'Recommandé', true, 2, 6),
  ('Premium', 2000, 'Pour les candidatures nombreuses.',
    array['8 CV professionnels', 'Téléchargement PDF illimité', '12 modèles, dont 9 Premium', 'Assistant IA étendu et relecture notée'], null, false, 3, 8),
  ('Entreprise', 5000, 'Pour les écoles, cabinets et accompagnateurs.',
    array['8 CV professionnels', 'Téléchargement PDF illimité', '12 modèles, dont 9 Premium', 'Accompagnement dédié'], null, false, 4, 8);

update public.plans set is_available = false where name = 'Entreprise';

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
  E'## Où chercher\n- Les services de stage de votre université.\n- Les candidatures spontanées auprès des entreprises de votre secteur.\n\n## Relancer\nSans réponse après une semaine, relancez poliment par téléphone ou par e-mail.\n\n## Transformer l''essai\nSoyez ponctuel, curieux et force de proposition. Demandez un retour à la fin du stage.'
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
