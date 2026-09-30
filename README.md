# Votre CV

SaaS de création de CV propulsé par l'IA — [votrecv.site](https://votrecv.site).
L'utilisateur crée un CV professionnel guidé par un assistant IA (OpenAI), avec photo, 3 modèles A4 et 7 couleurs.
Gratuit : 1 CV + assistant IA (15 demandes / jour) + aperçu. Abonnement (dès 500 FCFA / mois, Orange Money) :
téléchargement PDF, jusqu'à 8 CV et 60 demandes IA / jour.

**Stack :** Next.js 16 (App Router, Server Actions, `proxy.ts`) · Tailwind CSS 4 · Supabase (Auth, Postgres + RLS, Storage) · OpenAI · Chromium headless (PDF).

## Installation

```bash
npm install
cp .env.local.example .env.local   # puis renseignez les clés
npm run dev
```

### Supabase

1. **Clés** (Project Settings > API) : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement : paiements, activation des abonnements, jetons PDF).
2. **Schéma + données**, au choix :
   - `npm run db:migrate` (API Management, nécessite `TOKEN` = jeton personnel dans `.env.local`) ;
   - `supabase link` puis `supabase db push`, puis `supabase/seed.sql` dans le SQL Editor ;
   - ou coller les fichiers de `supabase/migrations/` **dans l'ordre**, puis `supabase/seed.sql` (plans + astuces), dans le SQL Editor.
3. **Authentication > URL Configuration** : *Site URL* = `http://localhost:3000`, *Redirect URLs* += `http://localhost:3000/**` (et les équivalents en production).
4. **Premier administrateur** : `npm run admin:create -- vous@exemple.com MotDePasse`.

### Migrations

| Fichier | Contenu |
| --- | --- |
| `20260929000000_init.sql` | schéma initial |
| `20260930000000_google_auth.sql` | noms repris du profil Google |
| `20261001000000_orange_money_manuel.sql` | paiements Orange Money vérifiés par l'admin |
| `20261002000000_cv_builder.sql` | CV multiples, quotas, bucket privé `photos`, suivi IA |
| `20261003000000_pivot_saas_cv.sql` | **suppression définitive** des offres, candidatures, favoris, entreprises, catégories |
| `20261004000000_modeles_premium.sql` | 12 modèles de CV (3 gratuits + 9 Premium), avantages des plans |
| `20261005000000_backoffice_admin.sql` | back-office : e-mail des profils, journal des actions admin, suivi des PDF, vue `admin_users` |

⚠️ `20261003000000_pivot_saas_cv.sql` est **irréversible** : l'appliquer **après** avoir déployé le code
de *Votre CV* (l'ancienne version du site lit encore ces tables).

### Connexion avec Google

1. **Google Cloud Console** (console.cloud.google.com) > *APIs & Services* :
   - *OAuth consent screen* (*Branding*) : nom « Votre CV », e-mail de support, domaine `votrecv.site` ; scopes `email`, `profile`, `openid`. Publiez l'application (sinon seuls les « test users » peuvent se connecter).
   - *Credentials* > client OAuth *Web application* :
     - *Authorized JavaScript origins* : `http://localhost:3000`, `https://votrecv.site`, `https://www.votrecv.site` ;
     - *Authorized redirect URIs* : `https://<ref-du-projet>.supabase.co/auth/v1/callback`.
2. **Supabase** > *Authentication* > *Sign In / Providers* > **Google** : activez, collez le *Client ID* et le *Client Secret*.

Côté application : bouton « Continuer avec Google » sur `/connexion` et `/inscription`, retour via `/auth/confirm` (échange du code PKCE), puis redirection vers `/cv` (ou la destination `?suivant=`).

### E-mails avec Resend

Le SMTP par défaut de Supabase est limité à quelques e-mails par heure : en production, les e-mails
d'authentification partent via **Resend** depuis `no-reply@votrecv.site`.

1. **Resend** (resend.com) > *Domains* > *Add domain* : `votrecv.site`, région **EU (Ireland)**.
2. Chez le registrar du domaine, ajouter **exactement** les enregistrements DNS affichés par Resend
   (DKIM `resend._domainkey`, MX et SPF sur `send`), puis cliquer *Verify* et attendre « Verified ».
   Recommandé en plus : un TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:contact@votrecv.site`.
3. Relier Resend à Supabase, au choix :
   - Resend > *Integrations* > **Supabase** : choisir le projet, l'expéditeur et le domaine → SMTP configuré automatiquement ;
   - ou manuellement : Resend > *API Keys* > clé « Sending access » limitée à `votrecv.site`, puis
     Supabase > *Authentication* > *Emails* > *SMTP Settings* > *Enable custom SMTP* :

     | Champ | Valeur |
     | --- | --- |
     | Sender email | `no-reply@votrecv.site` |
     | Sender name | `Votre CV` |
     | Host | `smtp.resend.com` |
     | Port | `465` |
     | Username | `resend` |
     | Password | la clé API Resend (`re_…`) |
4. Supabase > *Authentication* > *Rate Limits* : relever « Rate limit for sending emails » (ex. 100 / heure).
5. Supabase > *Authentication* > *Emails* > *Templates* : coller les modèles français de
   [`supabase/templates/`](supabase/templates/README.md) (sujet + contenu, 6 modèles).
6. Tester : inscription, « Mot de passe oublié », puis vérifier la réception (et le dossier spam).

`contact@votrecv.site` doit être une vraie boîte de réception (Resend n'en fournit pas) :
créez-la chez votre registrar ou un service de redirection (ex. ImprovMX, Zoho Mail).

### Créateur de CV, assistant IA et PDF

- **Quotas** : 1 CV sans abonnement, puis selon le plan (4 / 6 / 8), modifiable dans *Admin > Abonnements*
  (« Nombre de CV »). Appliqué aussi par un trigger Postgres.
- **Assistant IA (OpenAI)** : remplissage à partir d'un texte libre, résumé, reformulation des expériences,
  suggestions de compétences, relecture notée. Il n'invente ni employeur, ni date, ni chiffre.
  `OPENAI_API_KEY` (secrète) et, facultatif, `OPENAI_MODEL` (défaut `gpt-6.1-sol`). Sans clé, l'éditeur
  fonctionne sans les boutons IA. Limites : 15 demandes / jour sans abonnement, 60 avec (`AI_DAILY_LIMIT`).
- **PDF (abonnés uniquement)** : `/cv/[id]/pdf` vérifie l'abonnement, signe un jeton de 2 minutes, puis
  Chromium (`@sparticuz/chromium` sur Vercel, Chrome/Edge en local) imprime `/cv-print/[id]` en A4.
  Sans abonnement, les boutons « Télécharger en PDF » mènent aux abonnements et l'aperçu porte un filigrane.
- **Marque** : nom, domaine et e-mail de contact centralisés dans `lib/brand.ts`.

## Déploiement sur Vercel

### Ordre de mise en ligne

1. Déployer le code (push sur `main`).
2. Appliquer `20261003000000_pivot_saas_cv.sql` sur la base de production.
3. Vérifier : inscription e-mail + Google, création d'un CV avec l'IA, paiement Orange Money puis validation
   admin, téléchargement du PDF.

### Configuration du projet Vercel

1. **Variables d'environnement** (Production et Preview) :

   | Variable | Valeur |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` |
   | `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` (**secrète**) |
   | `NEXT_PUBLIC_SITE_URL` | `https://votrecv.site` (sans `/` final) |
   | `OPENAI_API_KEY` | clé OpenAI (**secrète**) |
   | `PAYMENT_PROVIDER` | `orange_money` (ou absent) — jamais `simulation` en production |

2. **Région des fonctions** (Settings > Functions) : la même que la base Supabase, pour limiter la latence.
3. **Domaine** `votrecv.site` (+ `www`) dans Vercel, puis :
   - Supabase > *URL Configuration* : *Site URL* = `https://votrecv.site`, *Redirect URLs* += `https://votrecv.site/**`, `https://www.votrecv.site/**` ;
   - Google Cloud > client OAuth : *Authorized JavaScript origins* += les deux domaines.

### Avant la mise en ligne publique

- [ ] **Pages légales** : compléter les passages « À compléter » de `/conditions` et `/confidentialite` (raison sociale, RCCM/IFU, adresse, durées de conservation, région d'hébergement) et les faire relire.
- [ ] **E-mails** : Resend branché sur Supabase et modèles français installés.
- [ ] **Boîte** `contact@votrecv.site` opérationnelle.

## Paiement

Orange Money manuel (défaut) : l'utilisateur envoie le montant (`*144*10*64712044*Montant#`), saisit l'ID
de transaction, puis un admin valide ou rejette la demande dans *Admin > Paiements*. Références au format
`VC-XXXXXXXX`. `PAYMENT_PROVIDER=simulation` sert uniquement au développement.

## Sécurité (RLS)

- Chaque utilisateur n'accède qu'à ses propres CV, photos et paiements ; les admins voient tout.
- Abonnements et paiements : lecture seule côté client ; écriture uniquement côté serveur (clé `service_role`).
- Photos dans un bucket privé, servies via URL signées.
- Le PDF n'est généré qu'après vérification de l'abonnement côté serveur.

## Structure

```
app/(site)/     pages publiques, créateur de CV et espace utilisateur
app/admin/      back-office (utilisateurs, abonnements, paiements, contenu)
app/cv-print/   page d'impression interne (jeton signé)
app/actions/    Server Actions
components/     composants partagés
lib/            Supabase, auth, IA, PDF, paiements, marque, types
supabase/       migrations SQL, données (plans, astuces), modèles d'e-mails
scripts/        apply-migrations.mjs, create-admin.mjs
```
