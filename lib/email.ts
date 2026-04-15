import nodemailer from "nodemailer";
import { prisma } from "./db";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

export async function sendAlerts(newArticleIds: string[]) {
  if (!process.env.SMTP_HOST) {
    console.log("[Email] SMTP non configuré — alertes désactivées");
    return;
  }

  if (newArticleIds.length === 0) return;

  const articles = await prisma.article.findMany({
    where: { id: { in: newArticleIds } },
    include: { source: true },
  });

  const subscribers = await prisma.alertSubscription.findMany({
    where: { active: true },
  });

  const transporter = createTransporter();

  for (const sub of subscribers) {
    const keywords = JSON.parse(sub.keywords) as string[];

    // Filter articles matching subscriber keywords
    const matching =
      keywords.length === 0
        ? articles
        : articles.filter((a) => {
            const text = (a.title + " " + (a.summary ?? "")).toLowerCase();
            return keywords.some((kw) => text.includes(kw.toLowerCase()));
          });

    if (matching.length === 0) continue;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><title>Veille Droit Social</title></head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h1 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">
    Veille Juridique Droit Social
  </h1>
  <p style="color: #666;">
    ${matching.length} nouvelle(s) décision(s)/publication(s) correspondent à votre veille.
  </p>
  ${matching
    .map(
      (a) => `
  <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 15px 0;">
    <span style="
      background: ${a.source.type === "officiel" ? "#1e3a5f" : "#b45309"};
      color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;
    ">${a.source.name}</span>
    <h3 style="margin: 10px 0 5px 0; color: #1e3a5f;">
      <a href="${a.url}" style="color: #1e3a5f; text-decoration: none;">${a.title}</a>
    </h3>
    ${a.summary ? `<p style="color: #555; margin: 5px 0; font-size: 14px;">${a.summary.slice(0, 200)}...</p>` : ""}
    <p style="font-size: 12px; color: #999; margin: 5px 0;">
      ${new Date(a.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
    </p>
    <a href="${a.url}" style="
      display: inline-block; background: #1e3a5f; color: white;
      padding: 6px 12px; border-radius: 4px; text-decoration: none; font-size: 13px; margin-top: 8px;
    ">Lire la source →</a>
  </div>`
    )
    .join("")}
  <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
  <p style="font-size: 12px; color: #999;">
    Pour vous désabonner, visitez la page Alertes de votre tableau de bord.
  </p>
</body>
</html>`;

    await transporter.sendMail({
      from: process.env.ALERT_FROM_EMAIL ?? "veille@exemple.fr",
      to: sub.email,
      subject: `Veille Droit Social — ${matching.length} nouvelle(s) publication(s)`,
      html,
    });

    console.log(`[Email] Alerte envoyée à ${sub.email} (${matching.length} articles)`);
  }
}
