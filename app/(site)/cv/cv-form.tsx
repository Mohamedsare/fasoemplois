"use client";

import { useState } from "react";
import { saveCv } from "@/app/actions/cv";
import { Field, FormAlert, SubmitButton, useFormAction } from "@/components/form";
import type { Cv, CvEntry } from "@/lib/types";

const EMPTY_ENTRY: CvEntry = { title: "", organization: "", start: "", end: "", description: "" };

type Props = {
  cv: Cv | null;
  defaults: { full_name: string; email: string; phone: string; city: string };
};

export function CvForm({ cv, defaults }: Props) {
  const { state, onSubmit, pending } = useFormAction(saveCv);

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-semibold">Informations personnelles</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Nom complet" name="full_name" required error={state?.fieldErrors?.full_name}>
            <input id="full_name" name="full_name" defaultValue={cv?.full_name || defaults.full_name} className="input" required />
          </Field>
          <Field label="Titre du CV" name="headline" hint="Ex. Comptable junior, Développeur web…">
            <input id="headline" name="headline" defaultValue={cv?.headline ?? ""} className="input" />
          </Field>
          <Field label="E-mail" name="email">
            <input id="email" name="email" type="email" defaultValue={cv?.email ?? defaults.email} className="input" />
          </Field>
          <Field label="Téléphone" name="phone">
            <input id="phone" name="phone" type="tel" defaultValue={cv?.phone ?? defaults.phone} className="input" />
          </Field>
          <Field label="Ville" name="city">
            <input id="city" name="city" defaultValue={cv?.city ?? defaults.city} className="input" />
          </Field>
        </div>
        <Field label="Résumé" name="summary" hint="3 à 4 lignes : qui vous êtes et ce que vous recherchez.">
          <textarea id="summary" name="summary" rows={4} defaultValue={cv?.summary ?? ""} className="input" />
        </Field>
      </section>

      <EntryList
        prefix="experiences"
        title="Expériences professionnelles"
        addLabel="Ajouter une expérience"
        titleLabel="Poste"
        orgLabel="Entreprise"
        initial={cv?.experiences ?? []}
      />

      <EntryList
        prefix="education"
        title="Formation"
        addLabel="Ajouter une formation"
        titleLabel="Diplôme"
        orgLabel="Établissement"
        initial={cv?.education ?? []}
      />

      <section className="card space-y-5 p-6">
        <h2 className="text-lg font-semibold">Compétences et langues</h2>
        <Field label="Compétences" name="skills" hint="Séparées par des virgules. Ex. Excel, SYSCOHADA, gestion de stock">
          <textarea id="skills" name="skills" rows={2} defaultValue={cv?.skills.join(", ") ?? ""} className="input" />
        </Field>
        <Field label="Langues" name="languages" hint="Séparées par des virgules. Ex. Français (courant), Mooré, Anglais (intermédiaire)">
          <textarea id="languages" name="languages" rows={2} defaultValue={cv?.languages.join(", ") ?? ""} className="input" />
        </Field>
      </section>

      <div className="sticky bottom-0 -mx-4 flex items-center gap-4 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <SubmitButton pending={pending} pendingLabel="Enregistrement…">Enregistrer mon CV</SubmitButton>
        <div className="flex-1"><FormAlert state={state} /></div>
      </div>
    </form>
  );
}

type EntryListProps = {
  prefix: string;
  title: string;
  addLabel: string;
  titleLabel: string;
  orgLabel: string;
  initial: CvEntry[];
};

function EntryList({ prefix, title, addLabel, titleLabel, orgLabel, initial }: EntryListProps) {
  // Chaque ligne a une clé stable pour que React ne mélange pas les champs à la suppression.
  const [rows, setRows] = useState(() =>
    (initial.length ? initial : [EMPTY_ENTRY]).map((entry, i) => ({ key: i, entry })),
  );
  const [nextKey, setNextKey] = useState(rows.length);

  const add = () => {
    setRows((r) => [...r, { key: nextKey, entry: EMPTY_ENTRY }]);
    setNextKey((k) => k + 1);
  };
  const remove = (key: number) => setRows((r) => r.filter((row) => row.key !== key));

  return (
    <section className="card space-y-5 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <input type="hidden" name={`${prefix}_count`} value={rows.length} />

      {rows.map(({ key, entry }, i) => {
        const name = (f: keyof CvEntry) => `${prefix}[${i}][${f}]`;
        const id = (f: keyof CvEntry) => `${prefix}-${key}-${f}`;
        return (
          <fieldset key={key} className="space-y-4 rounded-lg border border-line p-4">
            <legend className="sr-only">{title} {i + 1}</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor={id("title")} className="text-sm font-medium">{titleLabel}</label>
                <input id={id("title")} name={name("title")} defaultValue={entry.title} className="input" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={id("organization")} className="text-sm font-medium">{orgLabel}</label>
                <input id={id("organization")} name={name("organization")} defaultValue={entry.organization} className="input" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={id("start")} className="text-sm font-medium">Début</label>
                <input id={id("start")} name={name("start")} defaultValue={entry.start} placeholder="Ex. 2022" className="input" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor={id("end")} className="text-sm font-medium">Fin</label>
                <input id={id("end")} name={name("end")} defaultValue={entry.end} placeholder="Ex. 2024 ou Aujourd'hui" className="input" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor={id("description")} className="text-sm font-medium">Description</label>
              <textarea id={id("description")} name={name("description")} rows={3} defaultValue={entry.description} className="input" />
            </div>
            <button type="button" onClick={() => remove(key)} className="text-sm text-accent-600 hover:underline">
              Supprimer
            </button>
          </fieldset>
        );
      })}

      <button type="button" onClick={add} className="btn-secondary">+ {addLabel}</button>
    </section>
  );
}
