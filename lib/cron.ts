import cron from "node-cron";
import { runAllScrapers } from "./scrapers/index";

let initialized = false;

export function initCron() {
  if (initialized) return;
  initialized = true;

  const schedule = process.env.CRON_SCHEDULE ?? "0 6 * * *";

  cron.schedule(
    schedule,
    async () => {
      console.log("[CRON] Démarrage de la veille quotidienne...");
      try {
        const results = await runAllScrapers();
        const total = results.reduce((sum, r) => sum + r.newArticles, 0);
        console.log(`[CRON] Veille terminée — ${total} nouveaux articles`);
      } catch (err) {
        console.error("[CRON] Erreur:", err);
      }
    },
    {
      timezone: "Europe/Paris",
    }
  );

  console.log(`[CRON] Veille planifiée (${schedule}, Europe/Paris)`);
}
