import type { Metadata } from "next";
import { FitnessNav, FitnessTabBar } from "../../components/FitnessNav";

export const metadata: Metadata = {
  title: "Fitness — Protocole Huberman",
  description: "Suivi du protocole de musculation Foundational Fitness d'Andrew Huberman",
};

export default function FitnessLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Fond aurora sobre derrière toute la section (les surfaces de verre le floutent) */}
      <div className="fit-aurora" aria-hidden />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 pb-28 sm:pb-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "var(--fit-ink)", letterSpacing: "-0.02em" }}
            >
              Fitness
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--fit-ink-2)" }}>
              Protocole « Foundational Fitness » d&apos;Andrew Huberman — 3 séances de
              musculation et 3 séances cardio par semaine
            </p>
          </div>
          <FitnessNav />
        </div>
        {children}
        <FitnessTabBar />
      </div>
    </>
  );
}
