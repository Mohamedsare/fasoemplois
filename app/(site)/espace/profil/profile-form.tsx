"use client";

import { saveProfile } from "@/app/actions/candidate";
import { FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { InfoFields, PreferenceFields, ProFields, SkillsFields } from "@/components/profile-fields";
import type { Category, Profile } from "@/lib/types";

export function ProfileForm({ profile, categories }: { profile: Profile; categories: Category[] }) {
  const { state, onSubmit, pending } = useFormAction(saveProfile);

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <Section title="Informations"><InfoFields profile={profile} /></Section>
      <Section title="Profil professionnel"><ProFields profile={profile} /></Section>
      <Section title="Compétences et langues"><SkillsFields profile={profile} /></Section>
      <Section title="Préférences d'emploi"><PreferenceFields profile={profile} categories={categories} /></Section>
      <div className="sticky bottom-16 flex items-center gap-4 rounded-2xl border border-line bg-white/95 p-4 backdrop-blur lg:bottom-4">
        <SubmitButton pending={pending} pendingLabel="Enregistrement…">Enregistrer</SubmitButton>
        <div className="flex-1"><FormAlert state={state} /></div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-4 p-6">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </section>
  );
}
