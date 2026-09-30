import type { CvDraft, CvTemplate } from "./types";

/**
 * CV d'exemple (personnes fictives) pour présenter les modèles.
 * Portraits : photos libres de droits Unsplash (voir public/exemples/CREDITS.txt).
 */
export type SampleCv = { cv: CvDraft; photo: string };

const base = { photo_path: "exemple", website: null, certifications: [], interests: [] } satisfies Partial<CvDraft>;

export const SAMPLE_CVS: SampleCv[] = [
  {
    photo: "/exemples/awa.jpg",
    cv: {
      ...base,
      title: "Exemple Moderne",
      template: "moderne",
      accent: "#009e49",
      full_name: "Awa Ouédraogo",
      headline: "Comptable confirmée · SYSCOHADA",
      email: "awa.ouedraogo@exemple.com",
      phone: "+226 70 12 34 56",
      city: "Ouagadougou",
      summary:
        "Comptable avec 5 ans d'expérience en cabinet et en entreprise, spécialisée dans la tenue comptable des PME, les déclarations fiscales et les clôtures annuelles. Rigoureuse, organisée et à l'aise avec les outils numériques.",
      experiences: [
        {
          title: "Comptable principale",
          organization: "Cabinet d'expertise comptable, Ouagadougou",
          start: "2022",
          end: "Aujourd'hui",
          description:
            "- Tenue de la comptabilité de 40 PME clientes\n- Déclarations fiscales mensuelles (TVA, IUTS) sans pénalité\n- Préparation des états financiers annuels SYSCOHADA\n- Encadrement de 2 assistants comptables",
        },
        {
          title: "Comptable",
          organization: "Société de distribution agroalimentaire",
          start: "2020",
          end: "2022",
          description: "- Rapprochements bancaires et suivi de trésorerie\n- Réduction des délais de clôture mensuelle de 10 à 5 jours",
        },
        {
          title: "Assistante comptable (stage)",
          organization: "Banque commerciale",
          start: "2019",
          end: "2019",
          description: "- Saisie et contrôle des pièces comptables\n- Lettrage des comptes fournisseurs",
        },
      ],
      education: [
        { title: "Master en comptabilité, contrôle, audit", organization: "Université Thomas Sankara", start: "2018", end: "2020", description: "" },
        { title: "Licence en sciences de gestion", organization: "Université Joseph Ki-Zerbo", start: "2015", end: "2018", description: "" },
      ],
      skills: ["SYSCOHADA", "Sage Saari", "Excel avancé", "Fiscalité", "Paie", "Audit interne", "Rigueur", "Esprit d'équipe"],
      languages: ["Français (courant)", "Mooré (langue maternelle)", "Anglais (intermédiaire)"],
      interests: ["Lecture", "Bénévolat associatif", "Course à pied"],
    },
  },
  {
    photo: "/exemples/issa.jpg",
    cv: {
      ...base,
      title: "Exemple Classique",
      template: "classique",
      accent: "#1d4ed8",
      full_name: "Issa Sawadogo",
      headline: "Chargé de projet · Développement rural",
      email: "issa.sawadogo@exemple.com",
      phone: "+226 76 45 12 89",
      city: "Bobo-Dioulasso",
      summary:
        "Ingénieur agronome, 6 ans d'expérience dans la coordination de projets d'appui aux coopératives agricoles, du terrain jusqu'au reporting aux bailleurs de fonds. Habitué à gérer des équipes pluridisciplinaires et des budgets importants.",
      experiences: [
        {
          title: "Chargé de projet",
          organization: "ONG internationale de développement",
          start: "2021",
          end: "Aujourd'hui",
          description:
            "- Coordination d'un projet de 850 millions FCFA auprès de 12 coopératives\n- Suivi-évaluation et rapports trimestriels aux bailleurs\n- Formation de 300 producteurs aux techniques agroécologiques",
        },
        {
          title: "Animateur de terrain",
          organization: "Programme national de sécurité alimentaire",
          start: "2018",
          end: "2021",
          description: "- Accompagnement de 25 groupements de femmes\n- Mise en place de 8 champs-écoles paysans",
        },
      ],
      education: [
        { title: "Diplôme d'ingénieur agronome", organization: "Université Nazi Boni", start: "2013", end: "2018", description: "" },
      ],
      certifications: [{ title: "Gestion du cycle de projet", organization: "Institut régional de formation", start: "", end: "2022", description: "" }],
      skills: [
        "Gestion de projet : cadre logique, suivi-évaluation, budget",
        "Outils : Excel, KoboToolbox, QGIS",
        "Animation : formations d'adultes, facilitation",
      ],
      languages: ["Français (courant)", "Dioula (courant)", "Anglais (intermédiaire)"],
      interests: ["Agriculture durable", "Football"],
    },
  },
  {
    photo: "/exemples/mariam.jpg",
    cv: {
      ...base,
      title: "Exemple Épuré",
      template: "epure",
      accent: "#7c3aed",
      full_name: "Mariam Traoré",
      headline: "Développeuse web full-stack",
      email: "mariam.traore@exemple.com",
      phone: "+226 65 78 90 12",
      city: "Ouagadougou",
      website: "github.com/mariam-traore",
      summary:
        "Développeuse full-stack passionnée par les produits utiles : applications web rapides, accessibles et bien conçues. J'aime transformer un besoin métier en outil simple à utiliser.",
      experiences: [
        {
          title: "Développeuse full-stack",
          organization: "Start-up fintech",
          start: "2023",
          end: "Aujourd'hui",
          description:
            "- Conception d'applications Next.js et PostgreSQL utilisées par 20 000 clients\n- Intégration du paiement mobile (Orange Money, Moov Money)\n- Mise en production continue et revues de code",
        },
        {
          title: "Développeuse web",
          organization: "Agence digitale",
          start: "2021",
          end: "2023",
          description: "- Réalisation de 15 sites et applications pour des PME\n- Amélioration des performances (temps de chargement divisé par 3)",
        },
      ],
      education: [{ title: "Licence en informatique", organization: "Université Joseph Ki-Zerbo", start: "2018", end: "2021", description: "" }],
      skills: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL", "Tailwind CSS", "Git", "Figma"],
      languages: ["Français", "Anglais (professionnel)", "Bambara"],
      interests: ["Communauté tech", "Photographie"],
    },
  },
  {
    photo: "/exemples/boukary.jpg",
    cv: {
      ...base,
      title: "Exemple Exécutif",
      template: "executif",
      accent: "#1d4ed8",
      full_name: "Boukary Kaboré",
      headline: "Directeur administratif et financier",
      email: "boukary.kabore@exemple.com",
      phone: "+226 70 55 21 43",
      city: "Ouagadougou",
      summary:
        "Directeur administratif et financier avec 14 ans d'expérience dans l'industrie et les services. Pilotage de la performance, levée de fonds et transformation des fonctions finance. Leader d'équipes de 25 personnes.",
      experiences: [
        {
          title: "Directeur administratif et financier",
          organization: "Groupe industriel agroalimentaire",
          start: "2019",
          end: "Aujourd'hui",
          description:
            "- Pilotage d'un budget annuel de 18 milliards FCFA\n- Négociation d'un financement bancaire de 4 milliards FCFA\n- Déploiement d'un ERP et réduction des délais de reporting de 40 %",
        },
        {
          title: "Responsable contrôle de gestion",
          organization: "Opérateur de télécommunications",
          start: "2014",
          end: "2019",
          description: "- Mise en place des tableaux de bord de la direction générale\n- Programme d'économies de 1,2 milliard FCFA",
        },
        {
          title: "Auditeur senior",
          organization: "Cabinet d'audit international",
          start: "2010",
          end: "2014",
          description: "- Missions d'audit légal pour des banques et industries",
        },
      ],
      education: [
        { title: "MBA Finance d'entreprise", organization: "Business school, Dakar", start: "2012", end: "2014", description: "" },
        { title: "Master en finance", organization: "Université Joseph Ki-Zerbo", start: "2008", end: "2010", description: "" },
      ],
      certifications: [{ title: "Diplôme d'expertise comptable (DECOF)", organization: "", start: "", end: "2016", description: "" }],
      skills: ["Stratégie financière", "Levée de fonds", "Contrôle de gestion", "Normes IFRS", "Management d'équipe", "ERP SAP", "Négociation bancaire"],
      languages: ["Français (courant)", "Anglais (courant)", "Mooré"],
      interests: ["Mentorat", "Golf", "Échecs"],
    },
  },
  {
    photo: "/exemples/aminata.jpg",
    cv: {
      ...base,
      title: "Exemple Élégance",
      template: "elegance",
      accent: "#b91c1c",
      full_name: "Aminata Compaoré",
      headline: "Juriste d'affaires",
      email: "aminata.compaore@exemple.com",
      phone: "+226 71 23 45 67",
      city: "Ouagadougou",
      summary:
        "Juriste d'affaires spécialisée en droit OHADA des sociétés et en contrats commerciaux. Sept ans d'accompagnement d'entreprises dans leurs opérations, de la création aux partenariats internationaux.",
      experiences: [
        {
          title: "Juriste d'affaires senior",
          organization: "Cabinet d'avocats d'affaires",
          start: "2020",
          end: "Aujourd'hui",
          description:
            "- Rédaction et négociation de contrats commerciaux et de partenariats\n- Accompagnement de 30 opérations de création et restructuration de sociétés\n- Veille juridique et formation des équipes clientes",
        },
        {
          title: "Juriste",
          organization: "Société minière",
          start: "2017",
          end: "2020",
          description: "- Gestion du contentieux et des relations avec les autorités\n- Conformité réglementaire du code minier",
        },
      ],
      education: [
        { title: "Master 2 Droit des affaires", organization: "Université Thomas Sankara", start: "2015", end: "2017", description: "" },
        { title: "Licence en droit privé", organization: "Université Joseph Ki-Zerbo", start: "2012", end: "2015", description: "" },
      ],
      skills: [
        "Droit : OHADA, sociétés, contrats, droit minier",
        "Rédaction : actes, contrats, notes juridiques",
        "Qualités : rigueur, négociation, discrétion",
      ],
      languages: ["Français (courant)", "Anglais (juridique)", "Dioula"],
      interests: ["Littérature africaine", "Plaidoirie", "Voyages"],
    },
  },
  {
    photo: "/exemples/salimata.jpg",
    cv: {
      ...base,
      title: "Exemple Horizon",
      template: "horizon",
      accent: "#0f766e",
      full_name: "Salimata Zongo",
      headline: "Responsable marketing digital",
      email: "salimata.zongo@exemple.com",
      phone: "+226 72 34 56 78",
      city: "Ouagadougou",
      website: "linkedin.com/in/salimata-zongo",
      summary:
        "Spécialiste du marketing digital depuis 6 ans : stratégie de contenu, réseaux sociaux et campagnes publicitaires orientées résultats. J'aime construire des marques proches de leur public.",
      experiences: [
        {
          title: "Responsable marketing digital",
          organization: "Opérateur de services financiers mobiles",
          start: "2021",
          end: "Aujourd'hui",
          description:
            "- Stratégie social media : communauté passée de 40 000 à 250 000 abonnés\n- Campagnes publicitaires avec un coût d'acquisition réduit de 35 %\n- Management d'une équipe de 4 personnes",
        },
        {
          title: "Chargée de communication",
          organization: "Agence de communication",
          start: "2018",
          end: "2021",
          description: "- Gestion de 12 comptes clients\n- Production de contenus vidéo et visuels",
        },
      ],
      education: [{ title: "Master en marketing et communication", organization: "Institut supérieur de commerce", start: "2016", end: "2018", description: "" }],
      certifications: [{ title: "Certification Google Ads", organization: "Google", start: "", end: "2023", description: "" }],
      skills: ["Stratégie digitale", "Meta Ads", "Google Ads", "SEO", "Canva", "Création de contenu", "Analyse de données", "Gestion de communauté"],
      languages: ["Français", "Anglais", "Mooré"],
      interests: ["Photographie", "Mode africaine", "Podcasts"],
    },
  },
  {
    photo: "/exemples/adama.jpg",
    cv: {
      ...base,
      title: "Exemple Parcours",
      template: "parcours",
      accent: "#c2410c",
      full_name: "Adama Ouattara",
      headline: "Ingénieur génie civil · Conduite de travaux",
      email: "adama.ouattara@exemple.com",
      phone: "+226 75 67 89 01",
      city: "Koudougou",
      summary:
        "Ingénieur génie civil, 8 ans d'expérience sur des chantiers de bâtiments et de routes. Garant de la qualité, des délais et de la sécurité, avec des équipes allant jusqu'à 80 ouvriers.",
      experiences: [
        {
          title: "Conducteur de travaux principal",
          organization: "Entreprise de BTP",
          start: "2020",
          end: "Aujourd'hui",
          description:
            "- Construction d'un bâtiment administratif R+4 (2,5 milliards FCFA)\n- Planification et suivi de 80 ouvriers et 6 sous-traitants\n- Zéro accident grave sur 3 ans de chantier",
        },
        {
          title: "Ingénieur travaux",
          organization: "Bureau d'études techniques",
          start: "2017",
          end: "2020",
          description: "- Contrôle de 45 km de routes bitumées\n- Rédaction des rapports de conformité",
        },
        {
          title: "Ingénieur stagiaire",
          organization: "Société de travaux routiers",
          start: "2016",
          end: "2017",
          description: "- Métrés et suivi des approvisionnements",
        },
      ],
      education: [{ title: "Diplôme d'ingénieur en génie civil", organization: "Institut international d'ingénierie (2iE)", start: "2011", end: "2016", description: "" }],
      skills: [
        "Techniques : béton armé, VRD, routes",
        "Logiciels : AutoCAD, Robot Structural, MS Project",
        "Management : planification, sécurité, sous-traitance",
      ],
      languages: ["Français (courant)", "Dioula", "Anglais technique"],
      interests: ["Architecture", "Basket-ball"],
    },
  },
  {
    photo: "/exemples/rasmane.jpg",
    cv: {
      ...base,
      title: "Exemple Créatif",
      template: "creatif",
      accent: "#7c3aed",
      full_name: "Rasmané Zerbo",
      headline: "Designer graphique & UI",
      email: "rasmane.zerbo@exemple.com",
      phone: "+226 66 12 98 34",
      city: "Ouagadougou",
      website: "behance.net/rasmane-zerbo",
      summary:
        "Designer graphique et UI, je crée des identités visuelles et des interfaces qui racontent une histoire. Cinq ans de projets pour des marques, des start-up et des festivals culturels.",
      experiences: [
        {
          title: "Designer UI / UX",
          organization: "Studio numérique",
          start: "2022",
          end: "Aujourd'hui",
          description:
            "- Conception des interfaces de 8 applications mobiles\n- Création d'un design system utilisé par 3 équipes produit\n- Tests utilisateurs et amélioration continue",
        },
        {
          title: "Graphiste",
          organization: "Agence de publicité",
          start: "2019",
          end: "2022",
          description: "- Identités visuelles pour 20 marques locales\n- Affiches et supports pour un festival international",
        },
      ],
      education: [{ title: "Licence en arts graphiques et design", organization: "Institut des arts, Ouagadougou", start: "2016", end: "2019", description: "" }],
      skills: ["Figma", "Illustrator", "Photoshop", "After Effects", "Identité visuelle", "UI design", "Typographie", "Prototypage"],
      languages: ["Français", "Mooré", "Anglais"],
      interests: ["Illustration", "Musique", "Cinéma"],
    },
  },
  {
    photo: "/exemples/fatimata.jpg",
    cv: {
      ...base,
      title: "Exemple Prestige",
      template: "prestige",
      accent: "#c2410c",
      full_name: "Fatimata Diallo",
      headline: "Responsable des ressources humaines",
      email: "fatimata.diallo@exemple.com",
      phone: "+226 73 21 43 65",
      city: "Ouagadougou",
      summary:
        "Responsable RH avec 9 ans d'expérience en recrutement, gestion des talents et relations sociales. Convaincue que la performance d'une entreprise commence par l'épanouissement de ses équipes.",
      experiences: [
        {
          title: "Responsable des ressources humaines",
          organization: "Groupe hôtelier",
          start: "2020",
          end: "Aujourd'hui",
          description:
            "- Gestion RH de 350 collaborateurs sur 4 sites\n- Plan de formation annuel : 2 000 heures dispensées\n- Turnover réduit de 22 % à 12 % en deux ans",
        },
        {
          title: "Chargée de recrutement",
          organization: "Cabinet de conseil RH",
          start: "2016",
          end: "2020",
          description: "- Plus de 150 recrutements de cadres et techniciens\n- Conduite d'évaluations et assessment centers",
        },
      ],
      education: [
        { title: "Master en gestion des ressources humaines", organization: "Université Aube Nouvelle", start: "2014", end: "2016", description: "" },
      ],
      certifications: [{ title: "Certification en droit du travail", organization: "Institut de formation", start: "", end: "2021", description: "" }],
      skills: ["Recrutement", "Gestion des talents", "Paie et administration", "Droit du travail", "Dialogue social", "Formation", "SIRH"],
      languages: ["Français (courant)", "Fulfuldé", "Anglais (intermédiaire)"],
      interests: ["Coaching", "Cuisine", "Randonnée"],
    },
  },
  {
    photo: "/exemples/aicha.jpg",
    cv: {
      ...base,
      title: "Exemple Compact",
      template: "compact",
      accent: "#0f766e",
      full_name: "Dr Aïcha Sanou",
      headline: "Médecin généraliste",
      email: "aicha.sanou@exemple.com",
      phone: "+226 74 56 78 90",
      city: "Bobo-Dioulasso",
      summary:
        "Médecin généraliste, 7 ans de pratique en milieu hospitalier et en centre de santé communautaire. Engagée pour une médecine de proximité, la prévention et la santé maternelle et infantile.",
      experiences: [
        {
          title: "Médecin généraliste",
          organization: "Centre hospitalier régional",
          start: "2021",
          end: "Aujourd'hui",
          description:
            "- 40 consultations par jour en médecine générale et urgences\n- Coordination du programme de prévention du paludisme\n- Encadrement des internes et infirmiers stagiaires",
        },
        {
          title: "Médecin chef de poste",
          organization: "Centre de santé communautaire",
          start: "2018",
          end: "2021",
          description: "- Gestion d'un centre desservant 25 000 habitants\n- Campagnes de vaccination et de dépistage",
        },
        {
          title: "Interne des hôpitaux",
          organization: "CHU Sourô Sanou",
          start: "2016",
          end: "2018",
          description: "- Rotations en pédiatrie, gynécologie et médecine interne",
        },
      ],
      education: [
        { title: "Doctorat en médecine", organization: "Université Nazi Boni", start: "2010", end: "2018", description: "" },
        { title: "Baccalauréat série D", organization: "Lycée Ouezzin Coulibaly", start: "", end: "2010", description: "" },
      ],
      certifications: [
        { title: "Échographie obstétricale", organization: "Diplôme universitaire", start: "", end: "2022", description: "" },
        { title: "Gestion des urgences", organization: "Formation continue", start: "", end: "2020", description: "" },
      ],
      skills: ["Médecine générale", "Urgences", "Santé maternelle", "Échographie", "Santé publique", "Écoute"],
      languages: ["Français", "Dioula", "Anglais médical"],
      interests: ["Santé communautaire", "Lecture"],
    },
  },
  {
    photo: "/exemples/ibrahim.jpg",
    cv: {
      ...base,
      title: "Exemple Corporate",
      template: "corporate",
      accent: "#b91c1c",
      full_name: "Ibrahim Konaté",
      headline: "Chargé de clientèle entreprises · Banque",
      email: "ibrahim.konate@exemple.com",
      phone: "+226 70 98 76 54",
      city: "Ouagadougou",
      summary:
        "Chargé de clientèle entreprises, 6 ans d'expérience en banque commerciale. Développement d'un portefeuille de PME, analyse de crédit et conseil en financement, avec un sens aigu de la relation client.",
      experiences: [
        {
          title: "Chargé de clientèle entreprises",
          organization: "Banque commerciale",
          start: "2021",
          end: "Aujourd'hui",
          description:
            "- Gestion d'un portefeuille de 120 PME et 9 milliards FCFA d'encours\n- Croissance du produit net bancaire du portefeuille de 18 % par an\n- Montage et analyse de dossiers de crédit",
        },
        {
          title: "Conseiller clientèle particuliers",
          organization: "Banque commerciale",
          start: "2018",
          end: "2021",
          description: "- Accueil, conseil et vente de produits bancaires\n- Meilleur conseiller de l'agence en 2020",
        },
      ],
      education: [
        { title: "Master en banque et finance", organization: "Université Thomas Sankara", start: "2016", end: "2018", description: "" },
        { title: "Licence en économie", organization: "Université Joseph Ki-Zerbo", start: "2013", end: "2016", description: "" },
      ],
      skills: [
        "Banque : analyse de crédit, financement des PME, conformité",
        "Commercial : prospection, négociation, fidélisation",
        "Outils : Excel, Delta Banking, CRM",
      ],
      languages: ["Français (courant)", "Anglais (professionnel)", "Mooré"],
      interests: ["Football", "Entrepreneuriat", "Lecture économique"],
    },
  },
  {
    photo: "/exemples/moussa.jpg",
    cv: {
      ...base,
      title: "Exemple Mosaïque",
      template: "mosaique",
      accent: "#009e49",
      full_name: "Moussa Kiemtoré",
      headline: "Responsable logistique et approvisionnements",
      email: "moussa.kiemtore@exemple.com",
      phone: "+226 76 54 32 10",
      city: "Ouagadougou",
      summary:
        "Responsable logistique, 7 ans d'expérience dans la chaîne d'approvisionnement : achats, entrepôts et transport. Je fais circuler les bons produits, au bon endroit, au meilleur coût.",
      experiences: [
        {
          title: "Responsable logistique",
          organization: "Distributeur de produits de grande consommation",
          start: "2020",
          end: "Aujourd'hui",
          description:
            "- Gestion de 3 entrepôts et d'une flotte de 25 camions\n- Réduction des ruptures de stock de 30 %\n- Négociation des contrats de transport régionaux",
        },
        {
          title: "Acheteur",
          organization: "ONG humanitaire",
          start: "2017",
          end: "2020",
          description: "- Achats de 2 milliards FCFA par an selon les procédures des bailleurs\n- Suivi de 60 fournisseurs",
        },
      ],
      education: [{ title: "Master en logistique et transport", organization: "Institut supérieur de gestion", start: "2015", end: "2017", description: "" }],
      skills: ["Supply chain", "Gestion des stocks", "Achats", "Transport", "Sage X3", "Excel avancé", "Management", "Négociation"],
      languages: ["Français", "Mooré", "Anglais (intermédiaire)"],
      interests: ["Football", "Jeux de stratégie", "Voyages"],
    },
  },
];

/** Exemple d'un modèle donné (les modèles sans exemple dédié reprennent le premier). */
export function sampleFor(template: CvTemplate): SampleCv {
  return SAMPLE_CVS.find((s) => s.cv.template === template) ?? SAMPLE_CVS[0];
}
