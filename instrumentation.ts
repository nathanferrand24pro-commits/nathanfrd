export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Aligne les calculs de « jour » serveur (fitness, nutrition, sommeil) sur
    // le fuseau de l'utilisateur : sans cela, un serveur en UTC (Vercel/Docker)
    // bascule de jour à 2h du matin heure française.
    if (!process.env.TZ) process.env.TZ = "Europe/Paris";
    const { initCron } = await import("./lib/cron");
    initCron();
  }
}
