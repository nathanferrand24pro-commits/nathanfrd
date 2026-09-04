// Protocole "Foundational Fitness" d'Andrew Huberman — définitions et helpers.

export type DayType =
  | "endurance"
  | "jambes"
  | "recuperation"
  | "torse"
  | "cardio"
  | "hiit"
  | "bras";

export type Phase = "force" | "hypertrophie";

export interface ProtocolDay {
  dayType: DayType;
  title: string;
  subtitle: string;
  description: string;
  isResistance: boolean;
  icon: string;
}

// Planning hebdomadaire du protocole (index 0 = dimanche, comme Date.getDay()).
export const WEEKLY_PROTOCOL: ProtocolDay[] = [
  {
    dayType: "endurance",
    title: "Endurance longue",
    subtitle: "Zone 2 · 60–75 min",
    description:
      "Cardio à intensité conversationnelle : jogging, vélo, rando, rameur. Nez-bouche fermée si possible pour renforcer le diaphragme.",
    isResistance: false,
    icon: "🏃",
  },
  {
    dayType: "jambes",
    title: "Musculation — Jambes",
    subtitle: "50–60 min",
    description:
      "Quadriceps, ischio-jambiers, mollets. Squats, presse, fentes, leg curls. La séance la plus exigeante de la semaine, placée en début de semaine.",
    isResistance: true,
    icon: "🦵",
  },
  {
    dayType: "recuperation",
    title: "Récupération thermique",
    subtitle: "Sauna + froid",
    description:
      "Contraste chaud/froid : 20 min de sauna puis 2–5 min d'immersion froide, à répéter 3–5 fois. Accélère la récupération sans stresser les muscles.",
    isResistance: false,
    icon: "🧖",
  },
  {
    dayType: "torse",
    title: "Musculation — Torse",
    subtitle: "Pousser / Tirer + cou",
    description:
      "Alternance poussée (développé, dips) et tirage (tractions, rowing), plus travail du cou. Épaules et poitrine incluses.",
    isResistance: true,
    icon: "💪",
  },
  {
    dayType: "cardio",
    title: "Cardio modéré",
    subtitle: "Zone 3 · ~35 min",
    description:
      "Course, vélo ou rameur à allure soutenue mais tenable : respiration profonde sans être à fond.",
    isResistance: false,
    icon: "🚴",
  },
  {
    dayType: "hiit",
    title: "Intervalles haute intensité",
    subtitle: "HIIT · 20–30 min max",
    description:
      "Sprints courts type assault bike ou côtes : 20–60 s d'effort maximal, récupération égale ou double, 5–8 tours. Monte la fréquence cardiaque près du max.",
    isResistance: false,
    icon: "⚡",
  },
  {
    dayType: "bras",
    title: "Musculation — Bras",
    subtitle: "Bras, mollets, cou",
    description:
      "Biceps, triceps, mollets et cou, avec travail indirect du torse. Séance plus courte pour finir la semaine.",
    isResistance: true,
    icon: "🏋️",
  },
];

export const DAY_TYPE_LABELS: Record<DayType, string> = {
  endurance: "Endurance longue",
  jambes: "Jambes",
  recuperation: "Récupération",
  torse: "Torse",
  cardio: "Cardio modéré",
  hiit: "HIIT",
  bras: "Bras",
};

export const PHASE_INFO: Record<
  Phase,
  { label: string; reps: string; sets: string; rest: string; description: string }
> = {
  force: {
    label: "Force",
    reps: "4–8 répétitions",
    sets: "3–4 séries",
    rest: "2–4 min de repos",
    description:
      "Mois « lourd » : charges élevées (85–95 % du max), peu de répétitions, repos longs. Développe force et densité musculaire.",
  },
  hypertrophie: {
    label: "Hypertrophie",
    reps: "8–15 répétitions",
    sets: "2–3 séries",
    rest: "~90 s de repos",
    description:
      "Mois « volume » : charges modérées, plus de répétitions, repos courts. Développe le volume musculaire et l'endurance de force.",
  },
};

// Le protocole alterne chaque mois entre un cycle force et un cycle hypertrophie.
// Convention : mois impairs (janvier, mars…) = force, mois pairs = hypertrophie.
export function currentPhase(date: Date = new Date()): Phase {
  return (date.getMonth() + 1) % 2 === 1 ? "force" : "hypertrophie";
}

// Phase effective : le réglage manuel (FitnessSetting.phaseOverride) prime sur
// l'alternance automatique — utile pour décaler le cycle (vacances, blessure).
export function resolvePhase(date: Date, override?: string | null): Phase {
  if (override === "force" || override === "hypertrophie") return override;
  return currentPhase(date);
}

export function protocolDayFor(date: Date = new Date()): ProtocolDay {
  return WEEKLY_PROTOCOL[date.getDay()];
}

export const MUSCLE_GROUPS = [
  "jambes",
  "poitrine",
  "dos",
  "epaules",
  "bras",
  "mollets",
  "cou",
  "abdos",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  jambes: "Jambes",
  poitrine: "Poitrine",
  dos: "Dos",
  epaules: "Épaules",
  bras: "Bras",
  mollets: "Mollets",
  cou: "Cou",
  abdos: "Abdominaux",
};

// Objectif Huberman : ~10 séries de travail par groupe musculaire et par semaine.
export const WEEKLY_SETS_TARGET = 10;

// ---------------------------------------------------------------------------
// Programme concret de chaque jour (calendrier d'entraînement).
// Les schémas de séries dépendent de la phase du mois (force / hypertrophie).
// ---------------------------------------------------------------------------

export interface ProgramExercise {
  nom: string; // doit correspondre à un nom de DEFAULT_EXERCISES
  force: string;
  hypertrophie: string;
  note?: string;
}

export interface DayProgram {
  echauffement?: string;
  cardioDetail?: string;
  exercices: ProgramExercise[];
}

export const DAILY_PROGRAM: Record<DayType, DayProgram> = {
  endurance: {
    cardioDetail:
      "Zone 2 · 60–75 min en continu, intensité conversationnelle (~60–70 % FC max). Jogging, vélo, rando rapide ou rameur. Respiration nasale si possible. Structure : 5 min de mise en route, 55–65 min à allure stable, 5 min de retour au calme. Option : marche lestée en terrain vallonné.",
    exercices: [],
  },
  jambes: {
    echauffement:
      "5–10 min de vélo ou rameur facile, mobilité hanches/chevilles, puis 2–3 séries de montée en gamme au squat (barre vide → 50 % → 75 % de la charge de travail).",
    exercices: [
      {
        nom: "Squat",
        force: "4 × 4-8 · repos 2-4 min",
        hypertrophie: "3 × 8-12 · repos 90 s",
        note: "Mouvement principal : charge la plus lourde de la semaine, technique prioritaire.",
      },
      {
        nom: "Presse à cuisses",
        force: "3 × 6-8 · repos 2-3 min",
        hypertrophie: "3 × 10-12 · repos 90 s",
      },
      {
        nom: "Soulevé de terre jambes tendues",
        force: "3 × 6-8 · repos 2-3 min",
        hypertrophie: "3 × 10-12 · repos 90 s",
        note: "Ischio-jambiers : dos plat, descente contrôlée.",
      },
      {
        nom: "Leg curl",
        force: "3 × 6-8 · repos 2 min",
        hypertrophie: "2 × 12-15 · repos 90 s",
      },
      {
        nom: "Extension quadriceps",
        force: "3 × 8 · repos 2 min",
        hypertrophie: "2 × 12-15 · repos 90 s",
        note: "Isolation de finition : contraction 1 s en haut.",
      },
      {
        nom: "Mollets debout",
        force: "4 × 8-10 · repos 2 min",
        hypertrophie: "3 × 12-15 · repos 90 s",
        note: "1re moitié du volume mollets de la semaine (suite samedi en assis).",
      },
      {
        nom: "Relevé de jambes suspendu",
        force: "3 × 10-15 · repos 90 s",
        hypertrophie: "3 × 10-15 · repos 90 s",
        note: "Abdos au poids du corps : même schéma dans les deux phases.",
      },
    ],
  },
  recuperation: {
    cardioDetail:
      "Contraste thermique : 20 min de sauna puis 2–5 min d'immersion froide, à répéter 3–5 cycles. Bien s'hydrater entre les cycles. Pas d'effort musculaire : au plus 20–30 min de marche tranquille ou 10 min de mobilité douce. Sans sauna : douche alternée 3 × (3 min chaud / 1 min froid) + marche.",
    exercices: [],
  },
  torse: {
    echauffement:
      "5 min de rameur ou corde à sauter, rotations d'épaules avec élastique, montée en gamme au développé couché et 1 série facile de tirage léger.",
    exercices: [
      {
        nom: "Développé couché",
        force: "4 × 4-8 · repos 2-4 min",
        hypertrophie: "3 × 8-12 · repos 90 s",
        note: "Poussée principale, en alternance poussé/tiré sur toute la séance.",
      },
      {
        nom: "Tractions",
        force: "4 × 4-8 · repos 2-4 min",
        hypertrophie: "3 × 8-15 · repos 90 s",
        note: "Lestées en phase force si plus de 8 reps faciles ; élastique d'assistance sinon.",
      },
      {
        nom: "Développé incliné haltères",
        force: "3 × 6-8 · repos 2-3 min",
        hypertrophie: "3 × 8-12 · repos 90 s",
        note: "Haut de poitrine + épaules antérieures.",
      },
      {
        nom: "Rowing barre",
        force: "3 × 6-8 · repos 2-3 min",
        hypertrophie: "3 × 8-12 · repos 90 s",
      },
      {
        nom: "Tirage vertical",
        force: "3 × 6-8 · repos 2 min",
        hypertrophie: "2 × 10-15 · repos 90 s",
        note: "Complète le volume dos (~10 séries sur la séance).",
      },
      {
        nom: "Élévations latérales",
        force: "3 × 8-10 · repos 90 s",
        hypertrophie: "3 × 12-15 · repos 60-90 s",
        note: "Épaules : rester léger et strict même en phase force.",
      },
      {
        nom: "Flexion du cou",
        force: "3 × 10-15 · repos 60-90 s",
        hypertrophie: "3 × 10-15 · repos 60-90 s",
        note: "Cou (avant) : charge très légère, mouvement lent, jamais à l'échec.",
      },
    ],
  },
  cardio: {
    cardioDetail:
      "Zone 3 · ~35 min : allure soutenue mais tenable (~75–80 % FC max, parler devient difficile). Course, vélo ou rameur. Structure : 5 min d'échauffement, 25 min à allure constante, 5 min de retour au calme. Variante : gilet lesté ou dénivelé plutôt que plus de vitesse.",
    exercices: [],
  },
  hiit: {
    cardioDetail:
      "HIIT · 20–30 min max : 5 min d'échauffement progressif, puis 5–8 tours de 20–60 s d'effort quasi maximal avec récupération égale ou double (ex. 30 s à fond / 60 s très facile), 3–5 min de retour au calme. Supports sûrs : assault bike, vélo, rameur, sprints en côte. Arrêter si la technique se dégrade.",
    exercices: [],
  },
  bras: {
    echauffement:
      "5 min de cardio léger, rotations d'épaules et de poignets, 1–2 séries légères de dips (ou pompes) et de curl barre à vide.",
    exercices: [
      {
        nom: "Dips",
        force: "4 × 4-8 · repos 2-4 min",
        hypertrophie: "3 × 8-12 · repos 90 s",
        note: "Compound triceps + travail indirect de la poitrine (lestés en phase force).",
      },
      {
        nom: "Curl biceps barre",
        force: "3 × 6-8 · repos 2-3 min",
        hypertrophie: "3 × 8-12 · repos 90 s",
      },
      {
        nom: "Extension triceps poulie",
        force: "3 × 8 · repos 2 min",
        hypertrophie: "3 × 10-15 · repos 90 s",
      },
      {
        nom: "Curl marteau",
        force: "3 × 8 · repos 2 min",
        hypertrophie: "2 × 10-12 · repos 90 s",
        note: "Brachial et avant-bras, en complément du curl barre.",
      },
      {
        nom: "Mollets assis",
        force: "4 × 8-10 · repos 2 min",
        hypertrophie: "3 × 12-15 · repos 60-90 s",
        note: "2e moitié du volume mollets de la semaine (soléaire).",
      },
      {
        nom: "Extension du cou",
        force: "3 × 10-15 · repos 60-90 s",
        hypertrophie: "3 × 10-15 · repos 60-90 s",
        note: "Cou (arrière), en miroir de la flexion du mercredi : très léger et contrôlé.",
      },
      {
        nom: "Crunch poulie",
        force: "3 × 10-15 · repos 60-90 s",
        hypertrophie: "3 × 10-15 · repos 60-90 s",
        note: "Abdos en finition de séance.",
      },
    ],
  },
};

export const DEFAULT_EXERCISES: { name: string; muscleGroup: MuscleGroup }[] = [
  // Jambes
  { name: "Squat", muscleGroup: "jambes" },
  { name: "Presse à cuisses", muscleGroup: "jambes" },
  { name: "Fentes haltères", muscleGroup: "jambes" },
  { name: "Leg curl", muscleGroup: "jambes" },
  { name: "Extension quadriceps", muscleGroup: "jambes" },
  { name: "Soulevé de terre jambes tendues", muscleGroup: "jambes" },
  // Poitrine
  { name: "Développé couché", muscleGroup: "poitrine" },
  { name: "Développé incliné haltères", muscleGroup: "poitrine" },
  { name: "Dips", muscleGroup: "poitrine" },
  { name: "Écarté poulie", muscleGroup: "poitrine" },
  // Dos
  { name: "Tractions", muscleGroup: "dos" },
  { name: "Rowing barre", muscleGroup: "dos" },
  { name: "Tirage vertical", muscleGroup: "dos" },
  { name: "Rowing haltère", muscleGroup: "dos" },
  // Épaules
  { name: "Développé militaire", muscleGroup: "epaules" },
  { name: "Élévations latérales", muscleGroup: "epaules" },
  { name: "Oiseau haltères", muscleGroup: "epaules" },
  // Bras
  { name: "Curl biceps barre", muscleGroup: "bras" },
  { name: "Curl marteau", muscleGroup: "bras" },
  { name: "Extension triceps poulie", muscleGroup: "bras" },
  { name: "Barre au front", muscleGroup: "bras" },
  // Mollets
  { name: "Mollets debout", muscleGroup: "mollets" },
  { name: "Mollets assis", muscleGroup: "mollets" },
  // Cou
  { name: "Flexion du cou", muscleGroup: "cou" },
  { name: "Extension du cou", muscleGroup: "cou" },
  // Abdominaux
  { name: "Crunch poulie", muscleGroup: "abdos" },
  { name: "Relevé de jambes suspendu", muscleGroup: "abdos" },
];
