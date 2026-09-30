# Modèles d'e-mail (Supabase Auth)

À coller dans **Supabase > Authentication > Emails > Templates** : pour chaque modèle, copier le
**sujet** dans *Subject* et le contenu du fichier dans *Message body* (onglet *Source*).

| Modèle Supabase | Sujet | Fichier |
| --- | --- | --- |
| **Confirm signup** | `Confirmez votre adresse e-mail – Votre CV` | `confirmation.html` |
| **Reset Password** | `Réinitialisez votre mot de passe – Votre CV` | `reinitialisation.html` |
| **Change Email Address** | `Confirmez votre nouvelle adresse e-mail – Votre CV` | `changement-email.html` |
| **Magic Link** | `Votre lien de connexion – Votre CV` | `lien-connexion.html` |
| **Invite user** | `Vous êtes invité(e) à rejoindre Votre CV` | `invitation.html` |
| **Reauthentication** | `Votre code de vérification – Votre CV` | `code-verification.html` |

Les liens pointent vers `/auth/confirm?token_hash=…&type=…` : la vérification se fait côté serveur
et fonctionne même si l'e-mail est ouvert sur un autre appareil que celui de l'inscription.
La destination d'origine (ex. l'éditeur de CV) est reprise depuis `redirect_to={{ .RedirectTo }}`.

Variables Supabase utilisées : `{{ .SiteURL }}`, `{{ .TokenHash }}`, `{{ .RedirectTo }}`,
`{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Token }}`.

Ces fichiers sont générés depuis une mise en page commune ; si vous en modifiez un, gardez les
autres cohérents (couleurs, pied de page).
