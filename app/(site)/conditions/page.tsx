import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: `Conditions générales d'utilisation de ${BRAND.name}.`,
};

export default function TermsPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation" current="/conditions">
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions encadrent l&apos;utilisation de {BRAND.name} (le « Service »), un outil en ligne de
          création de CV assisté par intelligence artificielle. En créant un compte, vous acceptez ces conditions.
        </p>
      </section>

      <section>
        <h2>2. Éditeur</h2>
        <ul>
          <li>Raison sociale : <ToFill>nom de la société ou de l&apos;entrepreneur</ToFill></li>
          <li>Siège : <ToFill>adresse, ville</ToFill></li>
          <li>Immatriculation : <ToFill>n° RCCM / IFU</ToFill></li>
          <li>Contact : <a href={`mailto:${BRAND.contactEmail}`} className="underline">{BRAND.contactEmail}</a></li>
          <li>Hébergement : Vercel Inc. (application) et Supabase Inc. (base de données)</li>
        </ul>
      </section>

      <section>
        <h2>3. Compte</h2>
        <ul>
          <li>Vous devez fournir des informations exactes et les tenir à jour.</li>
          <li>Vous êtes responsable de la confidentialité de votre mot de passe et de l&apos;activité de votre compte.</li>
          <li>Un compte est personnel : il ne peut être ni partagé ni cédé.</li>
          <li>Vous pouvez demander la suppression de votre compte à tout moment (voir la politique de confidentialité).</li>
        </ul>
      </section>

      <section>
        <h2>4. Accès gratuit et abonnement</h2>
        <p>
          La création d&apos;un CV, l&apos;assistant IA (dans une limite quotidienne) et l&apos;aperçu en ligne sont
          gratuits. Le téléchargement en PDF, la création de CV supplémentaires et un usage étendu de l&apos;assistant
          sont réservés aux titulaires d&apos;un abonnement actif, dans les conditions prévues par la{" "}
          <Link href="/politique-abonnement" className="underline">politique d&apos;abonnement</Link>.
        </p>
      </section>

      <section>
        <h2>5. Assistant IA</h2>
        <ul>
          <li>
            Les propositions de l&apos;assistant (résumé, reformulations, compétences, relecture) sont générées
            automatiquement à partir des informations que vous fournissez. Elles peuvent comporter des erreurs.
          </li>
          <li>Vous restez seul responsable du contenu final de votre CV : relisez-le et vérifiez chaque information.</li>
          <li>N&apos;indiquez jamais d&apos;expérience, de diplôme ou de résultat que vous ne possédez pas.</li>
        </ul>
      </section>

      <section>
        <h2>6. Vos contenus</h2>
        <p>
          Vous conservez tous les droits sur le contenu de vos CV et sur votre photo. Vous nous autorisez uniquement à
          les stocker et à les traiter pour vous fournir le Service (affichage, génération du PDF, assistant IA). Il est
          interdit de publier des contenus faux, illicites, injurieux ou portant atteinte aux droits de tiers.
        </p>
      </section>

      <section>
        <h2>7. Utilisations interdites</h2>
        <ul>
          <li>Contourner les limites d&apos;usage ou les mesures d&apos;accès réservées aux abonnés.</li>
          <li>Utiliser le Service de manière automatisée ou massive (robots, revente de CV générés).</li>
          <li>Perturber le fonctionnement du Service ou tenter d&apos;accéder aux comptes d&apos;autres utilisateurs.</li>
        </ul>
        <p>Tout manquement peut entraîner la suspension ou la suppression du compte.</p>
      </section>

      <section>
        <h2>8. Responsabilité</h2>
        <p>
          {BRAND.name} s&apos;efforce d&apos;assurer la disponibilité du Service, sans pouvoir la garantir en
          permanence. {BRAND.name} ne garantit ni l&apos;obtention d&apos;un entretien ni celle d&apos;un emploi grâce
          aux CV créés.
        </p>
      </section>

      <section>
        <h2>9. Modification des conditions</h2>
        <p>
          Ces conditions peuvent évoluer. La date de mise à jour figure en haut de page ; en cas de changement
          important, vous en serez informé par e-mail ou sur le Service.
        </p>
      </section>

      <section>
        <h2>10. Droit applicable</h2>
        <p>
          Les présentes conditions sont régies par le droit burkinabè. À défaut d&apos;accord amiable, tout litige
          relève des juridictions compétentes de <ToFill>ville, ex. Ouagadougou</ToFill>.
        </p>
      </section>
    </LegalPage>
  );
}
