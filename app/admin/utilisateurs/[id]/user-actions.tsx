"use client";

import { Gift, RotateCcw, ShieldCheck, ShieldOff, Trash2, XCircle } from "lucide-react";
import { deleteUserAccount, grantSubscription, resetAiQuota, revokeSubscription, setAdminRole } from "@/app/actions/admin";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";

type Props = {
  userId: string;
  name: string;
  plans: { id: string; name: string; price: number }[];
  defaultPlanId: string | null;
  hasActiveSubscription: boolean;
  isAdmin: boolean;
  isSelf: boolean;
};

const DURATIONS = [7, 30, 60, 90, 180, 365];

export function GrantSubscriptionForm({ userId, plans, defaultPlanId }: Pick<Props, "userId" | "plans" | "defaultPlanId">) {
  const { state, onSubmit, pending } = useFormAction(grantSubscription.bind(null, userId));
  const e = state?.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <FormAlert state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Plan" name="plan_id" error={e.plan_id}>
          <select id="plan_id" name="plan_id" defaultValue={defaultPlanId ?? plans[0]?.id} className="input">
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.price.toLocaleString("fr-FR")} FCFA
              </option>
            ))}
          </select>
        </Field>
        <Field label="Durée" name="days" error={e.days} hint="S'ajoute à l'abonnement en cours.">
          <select id="days" name="days" defaultValue="30" className="input">
            {DURATIONS.map((d) => (
              <option key={d} value={d}>
                {d} jours
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Motif (interne)" name="note">
        <input id="note" name="note" placeholder="Ex. dépôt reçu hors application, geste commercial…" className="input" maxLength={300} />
      </Field>
      <SubmitButton pending={pending} pendingLabel="Activation…" className="btn-primary w-full sm:w-auto">
        <Gift aria-hidden className="size-4" /> Offrir / prolonger l&apos;abonnement
      </SubmitButton>
    </form>
  );
}

export function UserQuickActions({ userId, name, hasActiveSubscription, isAdmin, isSelf }: Omit<Props, "plans" | "defaultPlanId">) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {hasActiveSubscription && (
          <form action={revokeSubscription.bind(null, userId)}>
            <ConfirmSubmit message={`Arrêter immédiatement l'abonnement de ${name} ?`} className="btn-secondary">
              <XCircle aria-hidden className="size-4" /> Arrêter l&apos;abonnement
            </ConfirmSubmit>
          </form>
        )}
        <form action={resetAiQuota.bind(null, userId)}>
          <ConfirmSubmit message={`Remettre à zéro les demandes IA des dernières 24 h de ${name} ?`} className="btn-secondary">
            <RotateCcw aria-hidden className="size-4" /> Réinitialiser le quota IA
          </ConfirmSubmit>
        </form>
        {!isSelf && (
          <form action={setAdminRole.bind(null, userId, !isAdmin)}>
            <ConfirmSubmit
              message={isAdmin ? `Retirer les droits administrateur de ${name} ?` : `Donner les droits administrateur à ${name} ? Il aura accès à tout le back-office.`}
              className="btn-secondary"
            >
              {isAdmin ? <ShieldOff aria-hidden className="size-4" /> : <ShieldCheck aria-hidden className="size-4" />}
              {isAdmin ? "Retirer les droits admin" : "Rendre administrateur"}
            </ConfirmSubmit>
          </form>
        )}
      </div>

      {!isSelf && (
        <div className="rounded-xl border border-accent-500/30 bg-accent-500/5 p-4">
          <p className="text-sm font-semibold text-accent-600">Zone sensible</p>
          <p className="mt-1 text-xs text-muted">
            {isAdmin
              ? "Retirez d'abord les droits administrateur pour pouvoir supprimer ce compte."
              : "Supprime définitivement le compte, ses CV, ses photos, ses abonnements et son historique de paiements (demande de suppression des données)."}
          </p>
          {!isAdmin && (
            <form action={deleteUserAccount.bind(null, userId)} className="mt-3">
              <ConfirmSubmit message={`Supprimer DÉFINITIVEMENT le compte de ${name} et toutes ses données ? Cette action est irréversible.`}>
                <Trash2 aria-hidden className="size-4" /> Supprimer le compte
              </ConfirmSubmit>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
