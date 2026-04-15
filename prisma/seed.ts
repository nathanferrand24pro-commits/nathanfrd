import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../app/generated/prisma/client";
import path from "path";

const dbPath = path.resolve(process.cwd(), "prisma/dev.db");
const adapter = new PrismaLibSql({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const sources = [
  // Sources officielles
  {
    name: "Cour de Cassation – Chambre Sociale",
    url: "https://www.courdecassation.fr",
    type: "officiel",
    scraper: "cour-cassation",
  },
  {
    name: "Conseil d'État",
    url: "https://www.conseil-etat.fr",
    type: "officiel",
    scraper: "conseil-etat",
  },
  {
    name: "Légifrance",
    url: "https://www.legifrance.gouv.fr",
    type: "officiel",
    scraper: "legifrance",
  },
  {
    name: "Ministère du Travail",
    url: "https://travail-emploi.gouv.fr",
    type: "officiel",
    scraper: "travail-emploi",
  },
  // Cabinets d'avocats
  {
    name: "Flichy Grangé Avocats",
    url: "https://www.flichygrange.com",
    type: "cabinet",
    scraper: "flichy-grange",
  },
  {
    name: "Fromont Briens",
    url: "https://www.fromont-briens.com",
    type: "cabinet",
    scraper: "fromont-briens",
  },
  {
    name: "Capstan Avocats",
    url: "https://www.capstan.fr",
    type: "cabinet",
    scraper: "capstan",
  },
  {
    name: "CMS Francis Lefebvre",
    url: "https://cms.law/fr",
    type: "cabinet",
    scraper: "cms-lefebvre",
  },
  {
    name: "Barthélémy Avocats",
    url: "https://www.barthelemy-avocats.com",
    type: "cabinet",
    scraper: "barthelemy",
  },
];

async function main() {
  console.log("Seeding sources...");
  for (const source of sources) {
    await prisma.source.upsert({
      where: { id: source.scraper },
      update: {},
      create: {
        id: source.scraper,
        ...source,
      },
    });
  }
  console.log(`✓ ${sources.length} sources créées`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
