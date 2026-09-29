import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";
import { SUBSCRIPTION_DAYS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politique d'abonnement",
  description: "Durée, paiement, renouvellement et résiliation des abonnements Faso Emploi.",
};

export default function SubscriptionPolicyPage() {
  return (
    <LegalPage title="Politique d'abonnement" current="/politique-abonnement">
      <section>
        <h2>1. Ce que comprend l&apos;abonnement</h2>
        <p>
          L&apos;abonnement donne accès au contenu complet des offres (missions, profil recherché, informations de
          candidature…) et à la candidature en ligne, dans la limite éventuelle de candidatures mensuelles propre à
          chaque plan. Les plans, leurs prix et leurs avantages sont présentés sur la page{" "}
          <Link href="/abonnements" className="underline">Abonnements</Link>.
        </p>
      </section>

      <section>
        <h2>2. Durée</h2>
        <p>
          Un abonnement dure {SUBSCRIPTION_DAYS} jours à compter du paiement confirmé. Si vous payez alors qu&apos;un
          abonnement est encore en cours, la nouvelle période s&apos;ajoute à la durée restante.
        </p>
      </section>

      <section>
        <h2>3. Paiement</h2>
        <ul>
          <li>Les prix sont indiqués en francs CFA (FCFA), toutes taxes comprises.</li>
          <li>Le paiement s&apos;effectue par Mobile Money, carte bancaire ou tout autre moyen proposé au moment du paiement.</li>
          <li>L&apos;accès est activé dès la confirmation du paiement par le prestataire.</li>
          <li>Un paiement échoué, annulé ou expiré n&apos;est pas débité et n&apos;ouvre aucun accès.</li>
        </ul>
      </section>

      <section>
        <h2>4. Pas de renouvellement automatique</h2>
        <p>
          L&apos;abonnement n&apos;est pas reconduit automatiquement : aucun prélèvement n&apos;a lieu sans une nouvelle
          action de votre part. Vous pouvez renouveler ou changer de plan à tout moment depuis{" "}
          <Link href="/espace/abonnement" className="underline">votre espace</Link>.
        </p>
      </section>

      <section>
        <h2>5. Résiliation</h2>
        <p>
          L&apos;abonnement est sans engagement. L&apos;option « Ne pas renouveler » conserve votre accès jusqu&apos;à
          l&apos;échéance. Sauf disposition légale contraire ou erreur de notre part (double paiement, accès non
          activé), la période en cours n&apos;est pas remboursée.
        </p>
      </section>

      <section>
        <h2>6. À l&apos;expiration</h2>
        <p>
          Les contenus réservés redeviennent verrouillés. Votre profil, vos CV, vos favoris et l&apos;historique de vos
          candidatures sont conservés.
        </p>
      </section>

      <section>
        <h2>7. Réclamations</h2>
        <p>
          Pour toute question sur un paiement, écrivez à{" "}
          <a href="mailto:contact@fasoemploi.bf" className="underline">contact@fasoemploi.bf</a> en indiquant la
          référence du paiement (format FE-XXXXXXXX), visible dans votre historique.
        </p>
      </section>
    </LegalPage>
  );
}
