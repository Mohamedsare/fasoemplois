import { CITIES, CONTRACT_TYPES, EXPERIENCE_LABELS } from "@/lib/constants";
import type { Category, Profile } from "@/lib/types";
import { TagInput } from "./tag-input";

const SKILL_SUGGESTIONS = ["Excel", "Gestion de projet", "Anglais", "Comptabilité", "Service client", "Communication", "Vente", "Informatique"];
const LANGUAGE_SUGGESTIONS = ["Français", "Mooré", "Dioula", "Fulfuldé", "Anglais"];

// Groupes de champs du profil, partagés par l'onboarding (une étape par groupe) et « Mon profil ».

export function InfoFields({ profile }: { profile: Profile }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="last_name" className="label">Nom</label>
        <input id="last_name" name="last_name" defaultValue={profile.last_name} className="input" />
      </div>
      <div>
        <label htmlFor="first_name" className="label">Prénom</label>
        <input id="first_name" name="first_name" defaultValue={profile.first_name} className="input" />
      </div>
      <div>
        <label htmlFor="phone" className="label">Téléphone</label>
        <input id="phone" name="phone" type="tel" defaultValue={profile.phone ?? ""} placeholder="+226 …" className="input" />
      </div>
      <div>
        <label htmlFor="city" className="label">Ville</label>
        <select id="city" name="city" defaultValue={profile.city ?? ""} className="input">
          <option value="">—</option>
          {CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}

export function ProFields({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="headline" className="label">Titre professionnel</label>
        <input id="headline" name="headline" defaultValue={profile.headline ?? ""} placeholder="Ex. Comptable, Développeur web…" className="input" />
      </div>
      <fieldset>
        <legend className="label">Niveau d&apos;expérience</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(EXPERIENCE_LABELS).map(([value, label]) => (
            <label key={value} className="chip cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white">
              <input type="radio" name="experience_level" value={value} defaultChecked={profile.experience_level === value} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function SkillsFields({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="skills-input" className="label">Compétences</label>
        <TagInput id="skills-input" name="skills" defaultValue={profile.skills} suggestions={SKILL_SUGGESTIONS} />
      </div>
      <div>
        <label htmlFor="languages-input" className="label">Langues</label>
        <TagInput id="languages-input" name="languages" defaultValue={profile.languages} suggestions={LANGUAGE_SUGGESTIONS} />
      </div>
    </div>
  );
}

export function PreferenceFields({ profile, categories }: { profile: Profile; categories: Category[] }) {
  const chip = "chip cursor-pointer has-[:checked]:border-ink has-[:checked]:bg-ink has-[:checked]:text-white";
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="label">Type de contrat</legend>
        <div className="flex flex-wrap gap-2">
          {CONTRACT_TYPES.map((c) => (
            <label key={c} className={chip}>
              <input type="checkbox" name="pref_contracts" value={c} defaultChecked={profile.pref_contracts.includes(c)} className="sr-only" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Villes</legend>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <label key={c} className={chip}>
              <input type="checkbox" name="pref_cities" value={c} defaultChecked={profile.pref_cities.includes(c)} className="sr-only" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      {categories.length > 0 && (
        <fieldset>
          <legend className="label">Secteurs</legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <label key={c.id} className={chip}>
                <input type="checkbox" name="pref_categories" value={c.id} defaultChecked={profile.pref_categories.includes(c.id)} className="sr-only" />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
