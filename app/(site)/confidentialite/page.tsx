import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Comment Faso Emplois collecte, utilise et protège vos données personnelles.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" current="/confidentialite">
      <section>
        <h2>1. Responsable du traitement</h2>
        <p>
          <ToFill>raison sociale et adresse de l&apos;éditeur</ToFill>, joignable à{" "}
          <a href="mailto:contact@fasoemplois.tech" className="underline">contact@fasoemplois.tech</a>. Les traitements sont
          effectués conformément à la réglementation burkinabè relative à la protection des données personnelles,
          sous le contrôle de la Commission de l&apos;Informatique et des Libertés (CIL).
        </p>
      </section>

      <section>
        <h2>2. Données collectées</h2>
        <ul>
          <li><strong>Compte</strong> : nom, prénom, e-mail, téléphone, mot de passe (chiffré) ; photo et nom si vous vous connectez avec Google.</li>
          <li><strong>Profil</strong> : ville, titre professionnel, expérience, compétences, langues, préférences d&apos;emploi.</li>
          <li><strong>CV</strong> : CV en ligne et fichiers PDF que vous déposez.</li>
          <li><strong>Candidatures</strong> : offres visées, messages, statut de traitement.</li>
          <li><strong>Paiements</strong> : plan choisi, montant, méthode, référence et statut. Les données bancaires sont traitées par le prestataire de paiement, jamais stockées par Faso Emplois.</li>
          <li><strong>Technique</strong> : cookies de session indispensables à la connexion.</li>
        </ul>
      </section>

      <section>
        <h2>3. Finalités</h2>
        <ul>
          <li>Créer et gérer votre compte et votre abonnement.</li>
          <li>Transmettre vos candidatures aux employeurs concernés.</li>
          <li>Vous recommander des offres adaptées à votre profil.</li>
          <li>Assurer la sécurité du Service et prévenir la fraude.</li>
          <li>Respecter nos obligations légales et comptables.</li>
        </ul>
      </section>

      <section>
        <h2>4. Destinataires</h2>
        <ul>
          <li>L&apos;équipe Faso Emplois habilitée (administration du Service).</li>
          <li>Les employeurs, uniquement pour les candidatures que vous leur adressez.</li>
          <li>Nos sous-traitants techniques : Supabase (base de données, stockage, authentification), Vercel (hébergement), le prestataire de paiement, et Google si vous utilisez la connexion Google.</li>
        </ul>
        <p>Vos données ne sont jamais vendues.</p>
      </section>

      <section>
        <h2>5. Durées de conservation</h2>
        <ul>
          <li>Compte, profil et CV : tant que le compte est actif, puis supprimés sur demande ou après <ToFill>durée, ex. 3 ans</ToFill> d&apos;inactivité.</li>
          <li>Candidatures : <ToFill>durée, ex. 2 ans</ToFill> après leur envoi.</li>
          <li>Paiements : durée imposée par les obligations comptables.</li>
        </ul>
      </section>

      <section>
        <h2>6. Sécurité</h2>
        <p>
          Les accès sont cloisonnés par des règles de sécurité au niveau de la base de données : chaque utilisateur
          n&apos;accède qu&apos;à ses propres données. Les CV sont stockés dans un espace privé et ne sont accessibles que
          par des liens temporaires. Les échanges sont chiffrés (HTTPS).
        </p>
      </section>

      <section>
        <h2>7. Vos droits</h2>
        <p>
          Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;opposition et de suppression de vos
          données. Vous pouvez modifier la plupart d&apos;entre elles depuis votre espace ; pour toute autre demande,
          écrivez à <a href="mailto:contact@fasoemplois.tech" className="underline">contact@fasoemplois.tech</a>. Vous pouvez
          également saisir la CIL.
        </p>
      </section>

      <section>
        <h2>8. Transferts hors du Burkina Faso</h2>
        <p>
          Nos prestataires techniques peuvent héberger des données hors du Burkina Faso (<ToFill>région d&apos;hébergement Supabase / Vercel</ToFill>).
          Ces transferts sont encadrés par leurs engagements contractuels de sécurité et de confidentialité.
        </p>
      </section>
    </LegalPage>
  );
}
