"use client";

import { ArrowLeft, Check } from "lucide-react";
import { useRef, useState } from "react";
import { submitApplication } from "@/app/actions/applications";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import { formatShortDate } from "@/lib/format";
import { replaceFileWithUpload } from "@/lib/cv-upload";
import type { CvFile } from "@/lib/types";

const STEPS = ["CV", "Infos", "Vérification", "Envoi"] as const;

type Props = {
  jobId: string;
  files: CvFile[];
  onlineCvs: { id: string; title: string; updated_at: string }[];
  defaults: { full_name: string; email: string; phone: string };
};

export function ApplyWizard({ jobId, files, onlineCvs, defaults }: Props) {
  const { state, onSubmit, pending } = useFormAction(submitApplication.bind(null, jobId), {
    // Envoi direct du PDF vers Supabase Storage avant la Server Action
    prepare: (fd) => replaceFileWithUpload(fd, "file"),
  });
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState(
    onlineCvs[0] ? `online:${onlineCvs[0].id}` : files[0] ? `file:${files[0].id}` : "upload",
  );
  const [uploadName, setUploadName] = useState("");
  const [info, setInfo] = useState({ ...defaults, message: "" });
  const [stepError, setStepError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const cvLabel =
    choice.startsWith("online:")
      ? onlineCvs.find((c) => `online:${c.id}` === choice)?.title ?? "CV en ligne"
      : choice === "upload"
        ? uploadName || "Nouveau CV (PDF)"
        : files.find((f) => `file:${f.id}` === choice)?.name ?? "";

  function next() {
    setStepError("");
    if (step === 0 && choice === "upload" && !uploadName) return setStepError("Choisissez un fichier PDF.");
    if (step === 1) {
      if (info.full_name.trim().length < 2) return setStepError("Indiquez votre nom.");
      if (!/^\S+@\S+\.\S+$/.test(info.email)) return setStepError("Adresse e-mail invalide.");
    }
    setStep((s) => Math.min(s + 1, 2));
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6">
      {/* Étapes */}
      <ol className="flex flex-wrap gap-2 text-xs" aria-label="Étapes">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-medium ${
              i < step ? "border-brand-600 bg-brand-50 text-brand-800" : i === step ? "border-ink" : "border-line text-muted"
            }`}
          >
            {i < step ? <Check aria-hidden className="size-3.5" /> : <span aria-hidden>{i + 1}</span>} {label}
          </li>
        ))}
      </ol>

      <FormAlert state={state} />
      {stepError && <p role="alert" className="text-sm text-accent-600">{stepError}</p>}

      {/* Les champs restent montés (masqués) pour être envoyés avec le formulaire */}
      <section hidden={step !== 0} className="space-y-3">
        <h1 className="text-xl font-bold">Quel CV envoyer ?</h1>
        {onlineCvs.map((c) => (
          <CvOption key={c.id} value={`online:${c.id}`} choice={choice} onChange={setChoice}
            title={c.title} subtitle={`CV Faso Emplois · modifié le ${formatShortDate(c.updated_at)}`} />
        ))}
        {files.map((f) => (
          <CvOption key={f.id} value={`file:${f.id}`} choice={choice} onChange={setChoice}
            title={f.name} subtitle={`PDF ajouté le ${formatShortDate(f.created_at)}`} />
        ))}
        <label className={`card flex cursor-pointer flex-col gap-3 p-4 ${choice === "upload" ? "border-2 border-ink" : ""}`}>
          <span className="flex items-center gap-3">
            <input type="radio" name="cv_choice" value="upload" checked={choice === "upload"} onChange={() => setChoice("upload")} className="size-4 accent-brand-600" />
            <span className="font-medium">Importer un autre CV</span>
          </span>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            disabled={choice !== "upload"}
            onChange={(e) => setUploadName(e.target.files?.[0]?.name ?? "")}
            className="text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700 disabled:opacity-50"
          />
          <span className="text-xs text-muted">PDF, 5 Mo maximum.</span>
        </label>
      </section>

      <section hidden={step !== 1} className="space-y-4">
        <h1 className="text-xl font-bold">Vos informations</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet" name="full_name" required error={state?.fieldErrors?.full_name}>
            <input id="full_name" name="full_name" value={info.full_name} onChange={(e) => setInfo({ ...info, full_name: e.target.value })} className="input" />
          </Field>
          <Field label="E-mail" name="email" required error={state?.fieldErrors?.email}>
            <input id="email" name="email" type="email" value={info.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} className="input" />
          </Field>
          <Field label="Téléphone" name="phone">
            <input id="phone" name="phone" type="tel" value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} className="input" />
          </Field>
        </div>
        <Field label="Message au recruteur" name="message" hint="Facultatif — quelques lignes de motivation.">
          <textarea id="message" name="message" rows={6} maxLength={3000} value={info.message}
            onChange={(e) => setInfo({ ...info, message: e.target.value })} placeholder="Madame, Monsieur…" className="input" />
        </Field>
      </section>

      {step === 2 && (
        <section className="space-y-3">
          <h1 className="text-xl font-bold">Vérifiez votre candidature</h1>
          <Recap label="CV" value={cvLabel} onEdit={() => setStep(0)} />
          <Recap label="Message" value={info.message ? `« ${info.message.slice(0, 80)}${info.message.length > 80 ? "…" : ""} »` : "Aucun message"} onEdit={() => setStep(1)} />
          <Recap label="Contact" value={[info.email, info.phone].filter(Boolean).join(" · ")} onEdit={() => setStep(1)} />
        </section>
      )}

      <div className="flex items-center gap-3 border-t border-line pt-5">
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary"><ArrowLeft aria-hidden className="size-4" /> Retour</button>
        )}
        {step < 2 ? (
          <button type="button" onClick={next} className="btn-primary ml-auto">Continuer</button>
        ) : (
          <div className="ml-auto">
            <SubmitButton pending={pending} pendingLabel="Envoi…">Envoyer ma candidature</SubmitButton>
          </div>
        )}
      </div>
    </form>
  );
}

function CvOption({ value, choice, onChange, title, subtitle }: {
  value: string; choice: string; onChange: (v: string) => void; title: string; subtitle: string;
}) {
  return (
    <label className={`card flex cursor-pointer items-center gap-3 p-4 ${choice === value ? "border-2 border-ink" : ""}`}>
      <input type="radio" name="cv_choice" value={value} checked={choice === value} onChange={() => onChange(value)} className="size-4 accent-brand-600" />
      <span className="flex-1">
        <span className="block font-medium">{title}</span>
        <span className="text-xs text-muted">{subtitle}</span>
      </span>
    </label>
  );
}

function Recap({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className="w-20 font-semibold">{label}</span>
      <span className="flex-1 truncate text-sm text-muted">{value}</span>
      <button type="button" onClick={onEdit} className="text-sm text-brand-700 underline">modifier</button>
    </div>
  );
}
