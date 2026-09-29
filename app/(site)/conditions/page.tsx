import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation de la plateforme Faso Emploi.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation" current="/conditions">
      <section>
        <h2>1. Objet</h2>
        <p>
          Les présentes conditions encadrent l&apos;utilisation de la plateforme Faso Emploi (le « Service »), qui
          publie des offres d&apos;emploi au Burkina Faso, permet aux candidats de créer un profil et un CV, et de
          postuler aux offres. En créant un compte, vous acceptez ces conditions.
        </p>
      </section>

      <section>
        <h2>2. Éditeur</h2>
        <ul>
          <li>Raison sociale : <ToFill>nom de la société ou de l&apos;entrepreneur</ToFill></li>
          <li>Siège : <ToFill>adresse, ville</ToFill></li>
          <li>Immatriculation : <ToFill>n° RCCM / IFU</ToFill></li>
          <li>Contact : <a href="mailto:contact@fasoemploi.bf" className="underline">contact@fasoemploi.bf</a></li>
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
        <h2>4. Accès gratuit et accès abonné</h2>
        <p>
          La consultation de la liste des offres et de leur aperçu est gratuite. L&apos;accès au contenu complet des
          offres et la candidature en ligne sont réservés aux titulaires d&apos;un abonnement actif, dans les conditions
          prévues par la <Link href="/politique-abonnement" className="underline">politique d&apos;abonnement</Link>.
        </p>
      </section>

      <section>
        <h2>5. Offres d&apos;emploi</h2>
        <p>
          Les offres sont sélectionnées et publiées par l&apos;équipe Faso Emploi à partir d&apos;informations fournies
          par les employeurs. Faso Emploi n&apos;est pas l&apos;employeur et ne garantit ni l&apos;obtention d&apos;un
          entretien ni celle d&apos;un emploi. <strong>Aucun recruteur sérieux ne demande d&apos;argent pour postuler</strong> :
          signalez-nous toute demande de ce type.
        </p>
      </section>

      <section>
        <h2>6. Candidatures et contenus</h2>
        <ul>
          <li>Vous êtes responsable des informations, CV et messages que vous envoyez.</li>
          <li>Il est interdit de publier des contenus faux, illicites, injurieux ou portant atteinte aux droits de tiers.</li>
          <li>En postulant, vous autorisez Faso Emploi à transmettre votre candidature à l&apos;employeur concerné.</li>
        </ul>
      </section>

      <section>
        <h2>7. Utilisations interdites</h2>
        <ul>
          <li>Extraire massivement les offres ou les données du Service (robots, aspiration).</li>
          <li>Contourner les mesures d&apos;accès aux contenus réservés.</li>
          <li>Perturber le fonctionnement du Service ou tenter d&apos;accéder aux comptes d&apos;autres utilisateurs.</li>
        </ul>
        <p>Tout manquement peut entraîner la suspension ou la suppression du compte.</p>
      </section>

      <section>
        <h2>8. Responsabilité</h2>
        <p>
          Faso Emploi s&apos;efforce d&apos;assurer la disponibilité et l&apos;exactitude du Service, sans pouvoir le
          garantir en permanence. Sa responsabilité ne saurait être engagée pour le contenu des offres fourni par les
          employeurs ni pour les décisions de recrutement.
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
