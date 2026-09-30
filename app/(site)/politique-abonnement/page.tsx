import type { Metadata } from "next";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LegalPage } from "@/components/legal-page";
import { SUBSCRIPTION_DAYS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Politique d'abonnement",
  description: `Durée, paiement, renouvellement et résiliation des abonnements ${BRAND.name}.`,
};

export default function SubscriptionPolicyPage() {
  return (
    <LegalPage title="Politique d'abonnement" current="/politique-abonnement">
      <section>
        <h2>1. Ce que comprend l&apos;abonnement</h2>
        <p>
          L&apos;abonnement débloque le téléchargement de vos CV en PDF, la création de plusieurs CV (dans la limite
          propre à chaque plan) et un usage quotidien étendu de l&apos;assistant IA. Les plans, leurs prix et leurs
          avantages sont présentés sur la page{" "}
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
          <li>Le paiement s&apos;effectue par dépôt Orange Money sur le compte indiqué au moment du paiement (64 71 20 44, SARE MOHAMED), du montant exact du plan choisi.</li>
          <li>Après le dépôt, vous saisissez dans votre espace l&apos;ID de la transaction figurant dans le SMS de confirmation d&apos;Orange Money.</li>
          <li>L&apos;accès est activé dès que notre équipe a vérifié la réception du dépôt ; la durée de l&apos;abonnement court à partir de cette validation.</li>
          <li>Un dépôt introuvable, d&apos;un montant incorrect ou dont l&apos;ID a déjà été utilisé est rejeté, avec un motif visible dans votre espace. Pour toute réclamation, indiquez la référence du paiement.</li>
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
          Le téléchargement en PDF et la création de nouveaux CV redeviennent réservés aux abonnés. Tous vos CV sont
          conservés : vous pouvez toujours les consulter et les modifier, et les télécharger de nouveau dès que vous
          renouvelez votre abonnement.
        </p>
      </section>

      <section>
        <h2>7. Réclamations</h2>
        <p>
          Pour toute question sur un paiement, écrivez à{" "}
          <a href={`mailto:${BRAND.contactEmail}`} className="underline">{BRAND.contactEmail}</a> en indiquant la
          référence du paiement (format VC-XXXXXXXX), visible dans votre historique.
        </p>
      </section>
    </LegalPage>
  );
}
