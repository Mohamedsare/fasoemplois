# Faso Emploi

Plateforme d'emploi au Burkina Faso : offres publiées par l'équipe Faso Emploi, aperçu gratuit, contenu complet et candidature réservés aux abonnés (dès 500 FCFA / mois).

**Stack :** Next.js 16 (App Router, Server Actions, `proxy.ts`) · Tailwind CSS 4 · Supabase (Auth, Postgres + RLS, Storage).

## Installation

```bash
npm install
cp .env.local.example .env.local   # puis renseignez les clés
npm run dev
```

### Supabase

1. **Clés** (Project Settings > API) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement : paiements et activation des abonnements).
2. **Schéma + données de démo**, au choix :
   - `npm run db:migrate` (API Management, nécessite `TOKEN` = jeton personnel dans `.env.local`) ;
   - `supabase link` puis `supabase db push`, puis `supabase/seed.sql` dans le SQL Editor ;
   - ou coller `supabase/migrations/20260929000000_init.sql` puis `supabase/seed.sql` dans le SQL Editor.
3. **Authentication > URL Configuration** : *Site URL* = `http://localhost:3000`, *Redirect URLs* += `http://localhost:3000/auth/confirm` (et les équivalents en production).
4. **Premier administrateur** : créez un compte depuis le site, puis :

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'vous@exemple.com');
   ```

### Connexion avec Google

1. **Google Cloud Console** (console.cloud.google.com) > *APIs & Services* :
   - *OAuth consent screen* : type **External**, nom « Faso Emploi », e-mail de support, domaine du site ; scopes `email`, `profile`, `openid`. Publiez l'application (sinon seuls les « test users » peuvent se connecter).
   - *Credentials* > *Create credentials* > **OAuth client ID** > *Web application* :
     - *Authorized JavaScript origins* : `http://localhost:3000` et votre domaine de production ;
     - *Authorized redirect URIs* : `https://<ref-du-projet>.supabase.co/auth/v1/callback`.
2. **Supabase** > *Authentication* > *Sign In / Providers* > **Google** : activez, collez le *Client ID* et le *Client Secret*.
3. **Supabase** > *Authentication* > *URL Configuration* : `http://localhost:3000/auth/confirm` (et l'URL de production) doivent figurer dans *Redirect URLs*.

Côté application : bouton « Continuer avec Google » sur `/connexion` et `/inscription`, retour via `/auth/confirm` (échange du code PKCE). Un nouveau compte Google va vers l'onboarding, sauf s'il venait d'une offre (la destination `?suivant=` est conservée). Le prénom et le nom sont repris du profil Google (migration `20260930000000_google_auth.sql`).

## Déploiement sur Vercel

### Avant la mise en ligne publique

- [ ] **Paiement réel** : implémenter le prestataire dans `lib/payments.ts` et définir `PAYMENT_PROVIDER`. En production, si la variable est absente, le paiement est désactivé (message « bientôt disponible ») ; `PAYMENT_PROVIDER=simulation` ouvrirait des abonnements gratuits.
- [ ] **Pages légales** : compléter les passages surlignés « À compléter » dans `/conditions` et `/confidentialite` (raison sociale, RCCM/IFU, adresse, durées de conservation, région d'hébergement) et les faire relire par un juriste.
- [ ] **E-mails** : configurer un SMTP (Resend, Brevo…) dans Supabase > *Authentication* > *SMTP Settings* — le SMTP par défaut de Supabase est limité à quelques e-mails par heure. Personnaliser les modèles d'e-mail en français.
- [ ] **Migrations** appliquées sur la base de production (`npm run db:migrate`) et premier compte admin créé.
- [ ] Parcours testés sur la vraie base : inscription e-mail + Google, onboarding, paiement, candidature avec CV PDF, traitement admin.

### Configuration du projet Vercel

1. Importer le dépôt Git (framework détecté : Next.js ; aucune commande à modifier).
2. **Variables d'environnement** (Production et Preview) :

   | Variable | Valeur |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` (**secrète**) |
   | `NEXT_PUBLIC_SITE_URL` | `https://votre-domaine.bf` (sans `/` final) |
   | `PAYMENT_PROVIDER` | prestataire réel (ne pas mettre `simulation` en production) |

   Sans `NEXT_PUBLIC_SITE_URL`, le domaine de production Vercel est utilisé automatiquement.
3. **Région des fonctions** (Settings > Functions) : la même que la base Supabase (ex. `cdg1` Paris si Supabase est en `eu-west-3`), pour limiter la latence.
4. **Domaine** : l'ajouter dans Vercel, puis mettre à jour :
   - Supabase > *URL Configuration* : *Site URL* = le domaine, *Redirect URLs* += `https://votre-domaine.bf/auth/confirm` (et `https://*-votre-equipe.vercel.app/auth/confirm` pour les previews) ;
   - Google Cloud > client OAuth : *Authorized JavaScript origins* += le domaine.

Notes : les CV PDF sont envoyés directement du navigateur à Supabase Storage (les requêtes vers Vercel sont limitées à 4,5 Mo) ; `sitemap.xml` et `robots.txt` sont générés automatiquement.

## Parcours (d'après le wireframe)

| Écran | Route |
| --- | --- |
| 1a Accueil | `/` |
| 2a Liste des offres (filtres, carte d'upgrade) | `/offres` |
| 3a/3c Détail + paywall / état débloqué | `/offres/[id]` |
| 8b Candidature (CV · infos · vérification · envoi) | `/offres/[id]/postuler` |
| 4a Abonnements · 4c choix contextuel | `/abonnements`, `/abonnements/choisir?offre=…` |
| 7a Paiement · 7b états | `/paiement?plan=…`, `/paiement/[reference]` |
| 5a Inscription · 5b Connexion + mot de passe | `/inscription`, `/connexion`, `/mot-de-passe-oublie`, `/reinitialisation` |
| 6a Onboarding (5 étapes) | `/bienvenue` |
| 9a Dashboard candidat · 10a/10b/10c | `/espace`, `/espace/candidatures`, `/espace/abonnement`, `/espace/favoris`, `/espace/profil` |
| CV en ligne + PDF | `/cv`, `/cv/apercu` |
| Astuces | `/astuces` |
| 11a Admin · 12a/12b offres · 12c plans | `/admin`, `/admin/offres`, `/admin/plans`, + candidats, candidatures, entreprises, catégories, paiements, contenu |

Règle clé : la destination initiale (`?suivant=`) est conservée de « Postuler » jusqu'au paiement, puis retour à l'offre.

## Paiement

`PAYMENT_PROVIDER=simulation` (défaut) : la page de paiement propose « Simuler le succès / l'échec ». **Ne jamais laisser la simulation active en production.**

Pour brancher un prestataire (CinetPay, FedaPay, PayDunya…) : implémenter `PaymentProvider` dans `lib/payments.ts` (`initiate` → URL de redirection) et ajouter un webhook qui appelle `markPaymentPaid` / `markPaymentFailed` après vérification de la signature.

## Sécurité (RLS)

- Le contenu réservé des offres (`job_sections`) n'est **jamais envoyé** aux non-abonnés : la page affiche un placeholder flouté.
- Abonnements et paiements : lecture seule côté client ; écriture uniquement côté serveur (clé `service_role`).
- Limite mensuelle de candidatures par plan appliquée par un trigger Postgres.
- Un utilisateur ne peut modifier ni son rôle admin, ni le statut de ses candidatures.
- CV PDF dans un bucket privé, servis via URL signées (60 s) au candidat et aux admins.

## Structure

```
app/(site)/     pages publiques et espace candidat
app/admin/      back-office
app/actions/    Server Actions
components/     composants partagés
lib/            Supabase, auth, paiements, requêtes, types
supabase/       migration SQL et données de démo
scripts/        apply-migrations.mjs
```
