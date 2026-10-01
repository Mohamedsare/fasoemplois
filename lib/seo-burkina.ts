/**
 * Données des pages SEO « CV au Burkina Faso » : villes (chefs-lieux de province et grandes communes),
 * secteurs d'activité et langues locales utiles sur un CV. Ces informations rendent chaque page de ville utile
 * (et différente) pour le lecteur, au lieu d'une simple page dupliquée.
 */

export type SectorKey =
  | "administration"
  | "ong"
  | "banque"
  | "numerique"
  | "commerce"
  | "btp"
  | "agriculture"
  | "elevage"
  | "agro-industrie"
  | "mines"
  | "sante"
  | "education"
  | "transport"
  | "tourisme"
  | "artisanat";

export const SECTORS: Record<SectorKey, { label: string; tip: string; sample: string }> = {
  administration: {
    label: "Administration et fonction publique",
    tip: "Présentez un CV sobre et chronologique, avec vos diplômes et leurs dates exactes : c'est ce que regardent les jurys et les directions des ressources humaines.",
    sample: "issa",
  },
  ong: {
    label: "ONG et projets de développement",
    tip: "Mettez en avant la gestion de projet, le suivi-évaluation, la rédaction de rapports et les bailleurs avec lesquels vous avez travaillé. Une version en anglais est souvent un plus.",
    sample: "issa",
  },
  banque: {
    label: "Banques, assurances et microfinance",
    tip: "Chiffrez vos résultats (portefeuille, encours, objectifs atteints) et montrez votre rigueur : les recruteurs du secteur financier lisent d'abord les chiffres.",
    sample: "ibrahim",
  },
  numerique: {
    label: "Télécoms et numérique",
    tip: "Listez vos compétences techniques par catégorie (langages, outils, méthodes) et ajoutez un lien vers vos réalisations : GitHub, portfolio ou site.",
    sample: "mariam",
  },
  commerce: {
    label: "Commerce et distribution",
    tip: "Valorisez vos ventes, votre clientèle et votre connaissance du marché local. Les langues parlées avec les clients sont un vrai atout à indiquer.",
    sample: "moussa",
  },
  btp: {
    label: "BTP et travaux publics",
    tip: "Décrivez les chantiers suivis (type d'ouvrage, montant, équipe encadrée) et vos logiciels techniques. Les recruteurs veulent voir des réalisations concrètes.",
    sample: "adama",
  },
  agriculture: {
    label: "Agriculture et agrobusiness",
    tip: "Montrez votre expérience terrain : cultures, surfaces, groupements accompagnés, formations données aux producteurs, outils de collecte de données.",
    sample: "issa",
  },
  elevage: {
    label: "Élevage et pastoralisme",
    tip: "Précisez les filières maîtrisées (bovins, petits ruminants, volaille), la santé animale et votre travail avec les éleveurs et leurs organisations.",
    sample: "issa",
  },
  "agro-industrie": {
    label: "Agro-industrie et transformation",
    tip: "Indiquez les procédés, normes d'hygiène et de qualité que vous connaissez, ainsi que les volumes traités ou les équipes encadrées.",
    sample: "moussa",
  },
  mines: {
    label: "Mines et industries extractives",
    tip: "La sécurité est essentielle : citez vos formations HSE, vos habilitations et les équipements maîtrisés. Les sociétés minières apprécient aussi l'anglais.",
    sample: "adama",
  },
  sante: {
    label: "Santé",
    tip: "Indiquez votre diplôme d'État, vos services et vos stages, ainsi que les programmes de santé publique auxquels vous avez participé.",
    sample: "aicha",
  },
  education: {
    label: "Éducation et formation",
    tip: "Précisez les niveaux et matières enseignés, le nombre d'élèves et vos résultats aux examens. Pour l'enseignement supérieur, ajoutez vos publications.",
    sample: "aminata",
  },
  transport: {
    label: "Transport et logistique",
    tip: "Mettez en avant la gestion des stocks, des flottes et des approvisionnements, avec des chiffres (camions, entrepôts, délais).",
    sample: "moussa",
  },
  tourisme: {
    label: "Tourisme, hôtellerie et culture",
    tip: "Valorisez l'accueil, les langues parlées et votre connaissance du patrimoine local. Une photo professionnelle est particulièrement attendue dans ce secteur.",
    sample: "salimata",
  },
  artisanat: {
    label: "Artisanat et métiers",
    tip: "Décrivez vos savoir-faire, vos réalisations et vos clients. Un CV simple et clair, avec une photo, suffit souvent à faire la différence.",
    sample: "rasmane",
  },
};

export type Zone = "centre" | "ouest" | "nord" | "est" | "sahel" | "sud-ouest" | "centre-est" | "centre-ouest" | "centre-sud" | "centre-nord";

const ZONE_LABELS: Record<Zone, string> = {
  centre: "le Centre",
  ouest: "l'Ouest",
  nord: "le Nord",
  est: "l'Est",
  sahel: "le Sahel",
  "sud-ouest": "le Sud-Ouest",
  "centre-est": "le Centre-Est",
  "centre-ouest": "le Centre-Ouest",
  "centre-sud": "le Centre-Sud",
  "centre-nord": "le Centre-Nord",
};

/** Langue locale la plus utile à indiquer selon la zone (en plus du français). */
const ZONE_LANGUAGES: Record<Zone, string[]> = {
  centre: ["Mooré", "Dioula"],
  ouest: ["Dioula"],
  nord: ["Mooré", "Fulfuldé"],
  est: ["Gulmancéma", "Mooré"],
  sahel: ["Fulfuldé"],
  "sud-ouest": ["Dagara", "Lobiri", "Dioula"],
  "centre-est": ["Mooré", "Bissa"],
  "centre-ouest": ["Mooré", "Dioula"],
  "centre-sud": ["Mooré"],
  "centre-nord": ["Mooré", "Fulfuldé"],
};

const ZONE_SECTORS: Record<Zone, SectorKey[]> = {
  centre: ["administration", "ong", "commerce"],
  ouest: ["agriculture", "commerce", "agro-industrie"],
  nord: ["agriculture", "commerce", "elevage"],
  est: ["agriculture", "elevage", "ong"],
  sahel: ["elevage", "ong", "commerce"],
  "sud-ouest": ["agriculture", "mines", "commerce"],
  "centre-est": ["commerce", "agriculture", "elevage"],
  "centre-ouest": ["agriculture", "commerce", "education"],
  "centre-sud": ["agriculture", "commerce", "elevage"],
  "centre-nord": ["commerce", "elevage", "agriculture"],
};

type CityInput = {
  name: string;
  zone: Zone;
  /** Grande ville (texte plus détaillé) */
  major?: boolean;
  sectors?: SectorKey[];
  languages?: string[];
  schools?: string[];
  /** Phrase propre à la ville */
  note?: string;
};

const CITY_INPUT: CityInput[] = [
  {
    name: "Ouagadougou",
    zone: "centre",
    major: true,
    sectors: ["administration", "ong", "banque", "numerique", "commerce", "btp"],
    schools: ["l'Université Joseph Ki-Zerbo", "l'Université Thomas-Sankara", "les grandes écoles et universités privées de la capitale"],
    note: "Capitale et premier bassin d'emploi du pays, Ouagadougou concentre les administrations, les sièges des banques, des opérateurs télécoms et la plupart des ONG et organisations internationales.",
  },
  {
    name: "Bobo-Dioulasso",
    zone: "ouest",
    major: true,
    sectors: ["agro-industrie", "commerce", "transport", "btp", "sante", "agriculture"],
    schools: ["l'Université Nazi Boni"],
    note: "Capitale économique de l'Ouest, Bobo-Dioulasso est un carrefour du commerce, de l'agro-industrie et du transport vers les pays voisins.",
  },
  {
    name: "Koudougou",
    zone: "centre-ouest",
    major: true,
    sectors: ["education", "commerce", "agriculture", "sante"],
    languages: ["Mooré", "Lyélé"],
    schools: ["l'Université Norbert Zongo"],
    note: "Troisième ville du pays et ville universitaire, Koudougou forme chaque année de nombreux diplômés qui cherchent un premier emploi ou un stage.",
  },
  {
    name: "Ouahigouya",
    zone: "nord",
    major: true,
    sectors: ["agriculture", "commerce", "education", "ong"],
    schools: ["l'Université de Ouahigouya"],
    note: "Grande ville du Nord, Ouahigouya vit du commerce et d'une agriculture dynamique, notamment le maraîchage.",
  },
  {
    name: "Banfora",
    zone: "ouest",
    major: true,
    sectors: ["agro-industrie", "agriculture", "tourisme", "commerce"],
    languages: ["Dioula"],
    note: "Au cœur des Cascades, Banfora est connue pour son agro-industrie, ses vergers et ses sites touristiques.",
  },
  {
    name: "Kaya",
    zone: "centre-nord",
    major: true,
    sectors: ["commerce", "artisanat", "elevage", "ong"],
    note: "Kaya est un pôle commercial du Centre-Nord, réputé pour son artisanat du cuir, et accueille de nombreux projets humanitaires.",
  },
  {
    name: "Tenkodogo",
    zone: "centre-est",
    major: true,
    sectors: ["commerce", "agriculture", "elevage", "administration"],
    languages: ["Bissa", "Mooré"],
    note: "Tenkodogo est une ville administrative et commerçante du Centre-Est, proche des frontières du Ghana et du Togo.",
  },
  {
    name: "Fada N'Gourma",
    zone: "est",
    major: true,
    sectors: ["agriculture", "elevage", "ong", "education"],
    schools: ["l'Université de Fada N'Gourma"],
    note: "Principale ville de l'Est, Fada N'Gourma rassemble services publics, projets de développement et activités agropastorales.",
  },
  {
    name: "Dédougou",
    zone: "ouest",
    major: true,
    sectors: ["agriculture", "commerce", "education"],
    languages: ["Dioula", "Bwamu"],
    schools: ["l'Université de Dédougou"],
    note: "Dédougou, dans la Boucle du Mouhoun, est au centre d'une grande région agricole, notamment pour le coton et les céréales.",
  },
  {
    name: "Gaoua",
    zone: "sud-ouest",
    major: true,
    sectors: ["mines", "commerce", "agriculture", "tourisme"],
    languages: ["Lobiri", "Dagara", "Dioula"],
    note: "Gaoua, en pays lobi, combine activités minières, commerce et patrimoine culturel reconnu.",
  },
  {
    name: "Dori",
    zone: "sahel",
    major: true,
    sectors: ["elevage", "ong", "commerce"],
    languages: ["Fulfuldé"],
    note: "Principale ville du Sahel burkinabè, Dori est un centre de l'élevage et des interventions humanitaires.",
  },
  {
    name: "Houndé",
    zone: "ouest",
    sectors: ["mines", "agriculture", "commerce"],
    languages: ["Dioula", "Bwamu"],
    note: "Houndé est un pôle minier et cotonnier de l'Ouest.",
  },
  { name: "Pouytenga", zone: "centre-est", sectors: ["commerce", "transport", "artisanat"], note: "Pouytenga est l'une des places commerciales les plus actives du pays, grâce à son grand marché." },
  { name: "Koupéla", zone: "centre-est", sectors: ["commerce", "transport", "agriculture"], note: "Koupéla est un carrefour routier important entre Ouagadougou et l'Est." },
  { name: "Garango", zone: "centre-est", languages: ["Bissa"] },
  { name: "Ouargaye", zone: "centre-est", languages: ["Bissa", "Mooré"] },
  { name: "Ziniaré", zone: "centre", sectors: ["administration", "agriculture", "commerce"], note: "Proche de la capitale, Ziniaré attire de plus en plus d'activités et de services." },
  { name: "Zorgho", zone: "centre" },
  { name: "Boussé", zone: "centre" },
  { name: "Manga", zone: "centre-sud" },
  { name: "Kombissiri", zone: "centre-sud" },
  { name: "Pô", zone: "centre-sud", languages: ["Kassena", "Mooré"], note: "Ville frontalière du Ghana, Pô offre de belles opportunités à ceux qui parlent anglais." },
  { name: "Réo", zone: "centre-ouest", languages: ["Lyélé", "Mooré"] },
  { name: "Léo", zone: "centre-ouest", languages: ["Dioula", "Mooré"], note: "Proche de la frontière ghanéenne, Léo valorise les candidats qui parlent anglais." },
  { name: "Sapouy", zone: "centre-ouest" },
  { name: "Kongoussi", zone: "centre-nord", sectors: ["agriculture", "commerce", "elevage"] },
  { name: "Boulsa", zone: "centre-nord" },
  { name: "Yako", zone: "nord" },
  { name: "Gourcy", zone: "nord" },
  { name: "Titao", zone: "nord" },
  { name: "Orodara", zone: "ouest", sectors: ["agriculture", "agro-industrie", "commerce"], note: "Orodara est connue pour ses vergers et la production de fruits." },
  { name: "Sindou", zone: "ouest", sectors: ["agriculture", "tourisme", "commerce"] },
  { name: "Niangoloko", zone: "ouest", sectors: ["commerce", "transport", "agriculture"], note: "Ville frontalière de la Côte d'Ivoire, Niangoloko vit du commerce et du transport." },
  { name: "Boromo", zone: "ouest", sectors: ["commerce", "transport", "agriculture"] },
  { name: "Nouna", zone: "ouest" },
  { name: "Solenzo", zone: "ouest" },
  { name: "Toma", zone: "ouest", languages: ["Samo", "Dioula"] },
  { name: "Tougan", zone: "ouest", languages: ["Samo", "Dioula"] },
  { name: "Diébougou", zone: "sud-ouest", languages: ["Dagara", "Dioula"] },
  { name: "Dano", zone: "sud-ouest", languages: ["Dagara", "Dioula"] },
  { name: "Batié", zone: "sud-ouest", languages: ["Lobiri", "Dagara"] },
  { name: "Bogandé", zone: "est" },
  { name: "Diapaga", zone: "est", sectors: ["agriculture", "elevage", "tourisme"] },
  { name: "Gayéri", zone: "est" },
  { name: "Pama", zone: "est" },
  { name: "Djibo", zone: "sahel", languages: ["Fulfuldé"] },
  { name: "Gorom-Gorom", zone: "sahel", languages: ["Fulfuldé", "Tamasheq"] },
  { name: "Sebba", zone: "sahel", languages: ["Fulfuldé"] },
];

export type City = {
  slug: string;
  name: string;
  zone: string;
  major: boolean;
  sectors: SectorKey[];
  languages: string[];
  schools: string[];
  note: string | null;
};

export const citySlug = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const CITIES_BF: City[] = CITY_INPUT.map((c) => ({
  slug: citySlug(c.name),
  name: c.name,
  zone: ZONE_LABELS[c.zone],
  major: Boolean(c.major),
  sectors: c.sectors ?? ZONE_SECTORS[c.zone],
  languages: c.languages ?? ZONE_LANGUAGES[c.zone],
  schools: c.schools ?? [],
  note: c.note ?? null,
}));

export const findCity = (slug: string) => CITIES_BF.find((c) => c.slug === slug) ?? null;

/** « à Ouagadougou », « à Fada N'Gourma » : préposition correcte pour toutes nos villes. */
export const atCity = (c: Pick<City, "name">) => `à ${c.name}`;

/** Chemin de la page d'une ville. */
export const cityPath = (c: Pick<City, "slug">) => `/creer-cv/${c.slug}`;

/** Villes proches dans la même zone (maillage interne), puis grandes villes. */
export function relatedCities(c: City, count = 8) {
  const same = CITIES_BF.filter((x) => x.zone === c.zone && x.slug !== c.slug);
  const majors = CITIES_BF.filter((x) => x.major && x.slug !== c.slug && !same.includes(x));
  return [...same, ...majors].slice(0, count);
}
