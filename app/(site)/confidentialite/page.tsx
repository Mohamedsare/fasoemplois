import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Comment ${BRAND.name} collecte, utilise et protège vos données personnelles.`,
};

export default function PrivacyPage() {
  const mail = (
    <a href={`mailto:${BRAND.contactEmail}`} className="underline">
      {BRAND.contactEmail}
    </a>
  );
  return (
    <LegalPage title="Politique de confidentialité" current="/confidentialite">
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          <ToFill>raison sociale et adresse de l&apos;éditeur</ToFill>, joignable à {mail}. Les traitements sont
          effectués conformément à la réglementation burkinabè relative à la protection des données personnelles,
          sous le contrôle de la Commission de l&apos;Informatique et des Libertés (CIL).
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <ul>
          <li><strong>Compte</strong> : nom, prénom, e-mail, téléphone, mot de passe (chiffré) ; photo et nom si vous vous connectez avec Google.</li>
          <li><strong>CV</strong> : le contenu de vos CV (coordonnées, expériences, formations, compétences…) et votre photo de profil.</li>
          <li><strong>Assistant IA</strong> : les textes que vous soumettez à l&apos;assistant et le nombre de demandes effectuées.</li>
          <li><strong>Paiements</strong> : plan choisi, montant, numéro Orange Money utilisé, ID de transaction, référence et statut.</li>
          <li><strong>Technique</strong> : cookies de session indispensables à la connexion.</li>
          <li>
            <strong>Mesure d&apos;audience</strong> : le pixel Meta (Facebook) enregistre les pages visitées pour mesurer
            l&apos;efficacité de nos publicités ; il dépose des cookies Meta et transmet à Meta votre adresse IP et des
            informations sur votre navigateur.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Finalités</h2>
        <ul>
          <li>Créer et gérer votre compte, vos CV et votre abonnement.</li>
          <li>Générer vos CV en PDF et vous proposer l&apos;aide de l&apos;assistant IA.</li>
          <li>Vérifier vos paiements et prévenir la fraude.</li>
          <li>Assurer la sécurité du Service et respecter nos obligations légales et comptables.</li>
          <li>Mesurer l&apos;audience du site et l&apos;efficacité de nos campagnes publicitaires.</li>
        </ul>
      </section>

      <section>
        <h2>4. Destinataires</h2>
        <ul>
          <li>L&apos;équipe {BRAND.name} habilitée (administration et vérification des paiements).</li>
          <li>
            Nos sous-traitants techniques : Supabase (base de données, stockage, authentification), Vercel (hébergement),
            OpenAI (traitement des textes soumis à l&apos;assistant IA), Resend (e-mails), Meta (mesure d&apos;audience
            publicitaire) et Google si vous utilisez la connexion Google.
          </li>
        </ul>
        <p>Vos CV ne sont jamais publiés ni transmis à des tiers sans votre action. Vos données ne sont jamais vendues.</p>
      </section>

      <section>
        <h2>5. Durées de conservation</h2>
        <ul>
          <li>Compte, CV et photos : tant que le compte est actif, puis supprimés sur demande ou après <ToFill>durée, ex. 3 ans</ToFill> d&apos;inactivité.</li>
          <li>Historique d&apos;usage de l&apos;assistant IA : <ToFill>durée, ex. 12 mois</ToFill>.</li>
          <li>Paiements : durée imposée par les obligations comptables.</li>
        </ul>
      </section>

      <section>
        <h2>6. Sécurité</h2>
        <p>
          Les accès sont cloisonnés par des règles de sécurité au niveau de la base de données : chaque utilisateur
          n&apos;accède qu&apos;à ses propres CV. Les photos sont stockées dans un espace privé et ne sont accessibles
          que par des liens temporaires. Les échanges sont chiffrés (HTTPS).
        </p>
      </section>

      <section>
        <h2>7. Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression de vos
          données. Vous pouvez modifier ou supprimer vos CV à tout moment depuis votre espace ; pour toute autre
          demande, écrivez à {mail}. Vous pouvez également saisir la CIL.
        </p>
      </section>

      <section>
        <h2>8. Transferts hors du Burkina Faso</h2>
        <p>
          Nos prestataires techniques peuvent héberger ou traiter des données hors du Burkina Faso (
          <ToFill>région d&apos;hébergement Supabase / Vercel</ToFill>, États-Unis pour OpenAI). Ces transferts sont
          encadrés par leurs engagements contractuels de sécurité et de confidentialité.
        </p>
      </section>
    </LegalPage>
  );
}
