import { prisma } from "../../../lib/db";
import { SleepForm } from "../../../components/SleepForm";
import { SleepChart } from "../../../components/SleepChart";
import { DeleteButton } from "../../../components/DeleteButton";

export const dynamic = "force-dynamic";

function hours(min: number) {
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

export default async function SleepPage() {
  const entries = await prisma.sleepEntry.findMany({
    orderBy: { date: "desc" },
    take: 30,
  });

  const last = entries[0] ?? null;
  const week = entries.slice(0, 7);
  const avgWeek =
    week.length > 0
      ? Math.round(week.reduce((s, e) => s + e.durationMin, 0) / week.length)
      : null;

  const chartPoints = [...entries]
    .slice(0, 14)
    .reverse()
    .map((e) => ({ date: new Date(e.date).toISOString(), durationMin: e.durationMin }));

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="glass p-5 sm:p-6">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            Dernière nuit
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--fit-ink)" }}>
            {last ? hours(last.durationMin) : "—"}
          </p>
          {last && (
            <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-3)" }}>
              {new Date(last.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              {last.source === "apple-sante" && "  · Apple Santé"}
            </p>
          )}
        </div>
        <div className="glass p-5 sm:p-6">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            Moyenne 7 nuits
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: "var(--fit-ink)" }}>
            {avgWeek !== null ? hours(avgWeek) : "—"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-3)" }}>
            Objectif : ~8 h par nuit
          </p>
        </div>
        <div className="glass p-5 sm:p-6 col-span-2 md:col-span-1">
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            Conseil Huberman
          </p>
          <p className="text-xs mt-2 leading-relaxed" style={{ color: "var(--fit-ink-2)" }}>
            Régularité avant tout : mêmes horaires de coucher et de réveil chaque jour, lumière du
            soleil dans les 30–60 min après le réveil, pas de caféine après 14h.
          </p>
        </div>
      </div>

      {/* Graphique */}
      {chartPoints.length >= 2 && (
        <div className="glass p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "var(--fit-ink)" }}>
              14 dernières nuits
            </h2>
            <p className="text-xs" style={{ color: "var(--fit-ink-3)" }}>
              Ligne pointillée : objectif 8 h
            </p>
          </div>
          <SleepChart points={chartPoints} />
        </div>
      )}

      {/* Saisie manuelle */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
          Enregistrer une nuit
        </h2>
        <SleepForm />
      </div>

      {/* Intégration Apple Santé */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-2" style={{ color: "var(--fit-ink)" }}>
          Synchronisation Apple Santé
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: "var(--fit-ink-2)" }}>
          Une app web ne peut pas lire Apple Santé directement (HealthKit est réservé aux apps
          natives). La solution : un <strong>Raccourci iOS</strong> qui lit votre sommeil dans
          Santé et l&apos;envoie ici automatiquement chaque matin.
        </p>
        <details className="mt-3">
          <summary
            className="text-sm font-medium cursor-pointer py-2 min-h-[44px] flex items-center"
            style={{ color: "var(--fit-accent-strong)" }}
          >
            Créer le Raccourci (guide pas à pas)
          </summary>
          <ol
            className="mt-3 space-y-2 text-sm leading-relaxed list-decimal pl-5"
            style={{ color: "var(--fit-ink-2)" }}
          >
            <li>
              Ouvrez l&apos;app <strong>Raccourcis</strong> → onglet Raccourcis → « + » pour créer
              un nouveau raccourci.
            </li>
            <li>
              Ajoutez l&apos;action <strong>« Rechercher des échantillons de santé »</strong> :
              type <em>Sommeil</em>, filtre <em>Valeur est Endormi</em>, période{" "}
              <em>Aujourd&apos;hui</em> (ou dernières 24 h), tri par date de début.
            </li>
            <li>
              Ajoutez <strong>« Calculer des statistiques »</strong> sur la <em>durée</em> des
              échantillons → <em>Somme</em> (vous obtenez la durée totale en minutes).
            </li>
            <li>
              Ajoutez <strong>« Obtenir le contenu de l&apos;URL »</strong> :
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>
                  URL : <code>https://votre-domaine/api/fitness/sleep</code> (ou l&apos;adresse
                  locale de votre serveur)
                </li>
                <li>Méthode : POST · Type de corps : JSON</li>
                <li>
                  Champs : <code>durationMin</code> = la somme calculée ·{" "}
                  <code>source</code> = <code>apple-sante</code>
                </li>
                <li>
                  Si vous avez défini <code>FITNESS_API_TOKEN</code> côté serveur, ajoutez
                  l&apos;en-tête <code>Authorization</code> = <code>Bearer votre-token</code>
                </li>
              </ul>
            </li>
            <li>
              Dans l&apos;onglet <strong>Automatisation</strong> : « Nouvelle automatisation » →{" "}
              <em>Heure de la journée</em> (par ex. 9h00, tous les jours) → « Exécuter
              immédiatement » → sélectionnez votre raccourci. Votre sommeil se synchronise alors
              chaque matin sans intervention.
            </li>
          </ol>
        </details>
      </div>

      {/* Historique */}
      <div className="glass p-5 sm:p-6">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--fit-ink)" }}>
          Historique
        </h2>
        {entries.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--fit-ink-3)" }}>
            Aucune nuit enregistrée pour l&apos;instant.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id} className="glass-inset px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--fit-ink)" }}>
                    {hours(e.durationMin)}
                    {e.quality && (
                      <span className="ml-2 text-xs" style={{ color: "var(--fit-ink-3)" }}>
                        Qualité {e.quality}/5
                      </span>
                    )}
                    {e.source === "apple-sante" && (
                      <span className="pill-accent ml-2 px-2.5 py-0.5 text-[10px] font-semibold">
                        Apple Santé
                      </span>
                    )}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--fit-ink-3)" }}>
                    {new Date(e.date).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                    {e.bedTime &&
                      e.wakeTime &&
                      ` · ${new Date(e.bedTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} → ${new Date(e.wakeTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
                <DeleteButton
                  url={`/api/fitness/sleep/${e.id}`}
                  message="Supprimer cette nuit ?"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
