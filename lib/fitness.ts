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
