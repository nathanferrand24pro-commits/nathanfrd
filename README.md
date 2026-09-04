This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Fitness — Protocole Huberman

L'application inclut un suivi du protocole « Foundational Fitness » d'Andrew Huberman, accessible sur [`/fitness`](http://localhost:3000/fitness) :

- **Tableau de bord** : séance du jour selon le planning hebdomadaire (3 musculations + 3 cardios), phase du mois (alternance force / hypertrophie), volume de séries par groupe musculaire vs l'objectif de ~10 séries/semaine.
- **Journal de séance** : enregistrement des séries (exercice, répétitions, charge), durée et notes.
- **Exercices** : bibliothèque pré-remplie (jambes, poitrine, dos, épaules, bras, mollets, cou, abdominaux), extensible.
- **Progression** : records personnels et courbes de charge maximale par exercice.
- **Calendrier** : programme concret de chaque jour du protocole (échauffement, exercices ordonnés avec séries × répétitions × repos selon la phase force/hypertrophie, détail des séances cardio), grille mensuelle avec les séances réalisées.
- **Nutrition** : suivi calorique journalier par repas avec recherche d'aliments via l'API Open Food Facts (ou saisie manuelle), objectifs calories/protéines modifiables.
- **Sommeil** : saisie des nuits (coucher/réveil/qualité), graphique des 14 dernières nuits, et synchronisation Apple Santé via un Raccourci iOS qui envoie la durée de sommeil sur `POST /api/fitness/sleep` (guide pas à pas sur la page Sommeil).
- **Wellness** : poids corporel (courbe + moyenne mobile), hydratation, minuteur de repos par phase, « la dernière fois » avec pré-remplissage des charges, séries d'échauffement exclues des statistiques, détails cardio (distance, FC, RPE), régularité hebdomadaire, export JSON (`GET /api/fitness/export`).
- **App iPhone (PWA)** : installable depuis Safari (Partager → « Sur l'écran d'accueil »), plein écran sur `/fitness`, barre d'onglets basse, design « liquid glass » sobre.

Notes de déploiement :

- **Fuseau horaire** : les calculs de « jour » (nutrition, sommeil, semaine du protocole) suivent le fuseau du serveur. `instrumentation.ts` force `TZ=Europe/Paris` par défaut ; définir la variable `TZ` pour un autre fuseau.
- **`FITNESS_API_TOKEN`** ne protège que `POST /api/fitness/sleep` (le webhook du Raccourci iOS). Les autres routes n'ont pas d'authentification : pour un déploiement public, protéger l'app au niveau de la plateforme (protection Vercel, Basic Auth de reverse-proxy, ou Cloudflare Access).
- Après un `git pull`, appliquer les migrations : `npx prisma migrate dev`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
