import "server-only";
import { askJson } from "./ai";
import { SAMPLE_PEOPLE } from "./sample-cvs";
import { MAIN_KEYS, SIDEBAR_KEYS, SPEC_OPTIONS, sanitizeSpec, type TemplateSpec } from "./template-spec";

const DESIGNER_PROMPT = `Tu es directeur artistique, spécialiste des CV professionnels (format A4, impression et lecture par les logiciels de recrutement).
Tu conçois des modèles de CV sobres, élégants et très lisibles, adaptés au marché de l'emploi en Afrique de l'Ouest francophone.
Tu ne produis jamais de code : uniquement une fiche de style JSON dont chaque valeur est choisie dans les listes autorisées.
Principes : une seule couleur d'accent, bon contraste, hiérarchie claire, pas de surcharge, cohérence entre typographie et public visé
(finance, droit, administration : sobre et classique ; créatif, tech, marketing : plus audacieux ; santé, éducation : clair et rassurant).
Réponds uniquement avec un objet JSON valide.`;

function schemaText() {
  const enums = Object.entries(SPEC_OPTIONS)
    .map(([key, values]) => `- ${key} : ${Object.entries(values).map(([v, label]) => `"${v}" (${label})`).join(", ")}`)
    .join("\n");
  return `Champs de la fiche « spec » :
${enums}
- sidebarWidth : nombre entre 56 et 80 (mm), utilisé si layout a une colonne latérale
- photoSize : nombre entre 22 et 42 (mm)
- nameSize : nombre entre 18 et 34 (pt)
- nameWeight : 300, 400, 600, 700 ou 800
- nameUppercase, titleUppercase : true ou false
- sidebarSections : liste ordonnée parmi ${SIDEBAR_KEYS.map((k) => `"${k}"`).join(", ")} (ignorée en une colonne)
- mainOrder : liste ordonnée parmi ${MAIN_KEYS.map((k) => `"${k}"`).join(", ")} (les sections placées dans la colonne latérale y sont retirées automatiquement)
- defaultAccent : couleur hexadécimale « #rrggbb » assez foncée pour du texte sur fond blanc`;
}

export type GeneratedTemplate = { name: string; description: string; sample: string; spec: TemplateSpec };

/**
 * Demande à l'IA une fiche de style à partir d'une description (et, pour une retouche, de la fiche actuelle).
 * La réponse est entièrement revalidée : seules les valeurs autorisées sont conservées.
 */
export async function generateTemplate(brief: string, current?: { spec: TemplateSpec; name: string; description: string } | null): Promise<GeneratedTemplate> {
  const people = SAMPLE_PEOPLE.map((p) => `"${p.id}" (${p.headline})`).join(", ");
  const task = current
    ? `Voici un modèle existant à MODIFIER selon la consigne, en gardant tout ce que la consigne ne demande pas de changer.
Modèle actuel : ${JSON.stringify({ name: current.name, description: current.description, spec: current.spec })}
Consigne de modification : ${brief}`
    : `Crée un NOUVEAU modèle de CV original et professionnel selon cette demande : ${brief}`;

  const raw = await askJson<{ name?: unknown; description?: unknown; sample?: unknown; spec?: unknown }>(
    `${task}

${schemaText()}

Réponds avec ce JSON :
{
  "name": "nom court et évocateur du modèle, en français, 1 à 2 mots (ex. « Sahel », « Horizon Pro »)",
  "description": "une phrase de 4 à 9 mots décrivant le style et le public visé",
  "sample": "personne d'exemple la plus adaptée pour l'aperçu, parmi : ${people}",
  "spec": { ...tous les champs de la fiche... }
}`,
    { system: DESIGNER_PROMPT, effort: "medium", maxTokens: 1500 },
  );

  const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
  const sample = SAMPLE_PEOPLE.some((p) => p.id === raw.sample) ? String(raw.sample) : current ? "awa" : SAMPLE_PEOPLE[0].id;
  return {
    name: text(raw.name, 40) || current?.name || "Nouveau modèle",
    description: text(raw.description, 120) || current?.description || "",
    sample,
    spec: sanitizeSpec(raw.spec),
  };
}
