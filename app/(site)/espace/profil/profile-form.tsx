"use client";

import Link from "next/link";
import { saveProfile } from "@/app/actions/candidate";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { CITIES } from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const { state, onSubmit, pending } = useFormAction(saveProfile);
  const e = state?.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="card space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom" name="first_name" required error={e.first_name}>
          <input id="first_name" name="first_name" defaultValue={profile.first_name} autoComplete="given-name" className="input" />
        </Field>
        <Field label="Nom" name="last_name" required error={e.last_name}>
          <input id="last_name" name="last_name" defaultValue={profile.last_name} autoComplete="family-name" className="input" />
        </Field>
        <Field label="Téléphone" name="phone">
          <input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} autoComplete="tel" placeholder="+226 …" className="input" />
        </Field>
        <Field label="Ville" name="city">
          <input id="city" name="city" list="profile-cities" defaultValue={profile.city ?? ""} className="input" />
          <datalist id="profile-cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Titre professionnel" name="headline" hint="Ex. Comptable, Développeur web… Repris comme titre de vos nouveaux CV.">
            <input id="headline" name="headline" defaultValue={profile.headline ?? ""} className="input" />
          </Field>
        </div>
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
        <SubmitButton pending={pending} className="btn-primary w-full py-3 sm:w-auto sm:py-2" pendingLabel="Enregistrement…">
          Enregistrer
        </SubmitButton>
        <Link href="/mot-de-passe-oublie" className="text-center text-sm text-muted underline hover:text-ink sm:ml-auto">
          Changer mon mot de passe
        </Link>
      </div>
      <FormAlert state={state} />
    </form>
  );
}
