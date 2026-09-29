"use client";

import { useState } from "react";
import { saveProfile } from "@/app/actions/candidate";
import { FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { InfoFields, PreferenceFields, ProFields, SkillsFields } from "@/components/profile-fields";
import { ProgressBar } from "@/components/ui";
import { replaceFileWithUpload } from "@/lib/cv-upload";
import type { Category, Profile } from "@/lib/types";

const STEPS = [
  { label: "Infos", title: "Vos informations", text: "Pour que les recruteurs puissent vous contacter." },
  { label: "Profil pro", title: "Votre profil professionnel", text: "Quel poste visez-vous et avec quelle expérience ?" },
  { label: "Compétences", title: "Quelles sont vos compétences ?", text: "Elles nous aident à vous recommander les bonnes offres." },
  { label: "CV", title: "Ajoutez votre CV", text: "Un PDF prêt à être envoyé avec vos candidatures." },
  { label: "Préférences", title: "Vos préférences d'emploi", text: "Contrats, villes et secteurs qui vous intéressent." },
];

export function OnboardingWizard({ profile, categories }: { profile: Profile; categories: Category[] }) {
  const { state, onSubmit, pending } = useFormAction(saveProfile, {
    prepare: (fd) => replaceFileWithUpload(fd, "cv_file"),
  });
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input type="hidden" name="complete" value="1" />
      <input type="hidden" name="suivant" value="/espace" />

      <ol className="flex flex-wrap justify-between gap-2 text-xs" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li
            key={s.label}
            aria-current={i === step ? "step" : undefined}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium ${
              i < step ? "border-brand-600 bg-brand-50 text-brand-800" : i === step ? "border-ink" : "border-transparent text-muted"
            }`}
          >
            <span aria-hidden>{i < step ? "✓" : i + 1}</span> {s.label}
          </li>
        ))}
      </ol>
      <ProgressBar value={((step + 1) / STEPS.length) * 100} label="Progression" />

      <div>
        <h1 className="text-2xl font-bold">{STEPS[step].title}</h1>
        <p className="mt-1 text-sm text-muted">{STEPS[step].text}</p>
      </div>

      <FormAlert state={state} />

      {/* Tous les groupes restent montés pour être envoyés ensemble à la fin */}
      <div hidden={step !== 0}><InfoFields profile={profile} /></div>
      <div hidden={step !== 1}><ProFields profile={profile} /></div>
      <div hidden={step !== 2}><SkillsFields profile={profile} /></div>
      <div hidden={step !== 3}>
        <label className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line p-10 text-center hover:border-brand-600">
          <span aria-hidden className="text-3xl">📄</span>
          <span className="font-medium">Choisissez votre CV (PDF, 5 Mo max.)</span>
          <input
            type="file"
            name="cv_file"
            accept="application/pdf"
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
          />
          <span className="text-xs text-muted">Vous pourrez aussi créer un CV en ligne depuis la page CV.</span>
        </label>
      </div>
      <div hidden={step !== 4}><PreferenceFields profile={profile} categories={categories} /></div>

      <div className="flex items-center gap-3 border-t border-line pt-5">
        {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="btn-secondary">← Retour</button>}
        {!last && (
          <button type="button" onClick={() => setStep(step + 1)} className="ml-auto text-sm text-muted hover:text-ink">
            Passer
          </button>
        )}
        {last ? (
          <div className="ml-auto">
            <SubmitButton pending={pending} pendingLabel="Enregistrement…">Terminer</SubmitButton>
          </div>
        ) : (
          <button type="button" onClick={() => setStep(step + 1)} className="btn-primary">Continuer</button>
        )}
      </div>
    </form>
  );
}
