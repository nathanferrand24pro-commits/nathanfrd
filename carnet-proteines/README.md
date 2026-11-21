# Carnet Protéines

Application iPhone de suivi des protéines, des calories et des macros. Vous photographiez votre repas et Claude estime chaque aliment : son poids, ses calories, ses protéines, ses glucides et ses lipides.

```
iPhone (photo)  →  serveur Vercel (garde la clé Claude)  →  API Claude
                ←  aliments, grammes, macros              ←
```

- `server/` : une fonction Vercel qui reçoit la photo et appelle l'API Claude. La clé Claude ne se trouve que là.
- `ios/CarnetProteines/` : l'app SwiftUI (iOS 17 et plus). Les repas et le profil restent sur l'iPhone.

## 1. Mettre le serveur en ligne (Vercel)

1. Créez une clé sur [console.anthropic.com](https://console.anthropic.com) → *API Keys*, et ajoutez quelques euros de crédit. Une analyse coûte de l'ordre de quelques centimes.
2. Choisissez un jeton d'application, une longue chaîne au hasard. Exemple sur Mac : `openssl rand -hex 24` dans le Terminal.
3. Sur [vercel.com](https://vercel.com), choisissez *Add New → Project*, puis importez ce dépôt GitHub.
   - **Root Directory** : `carnet-proteines/server`. C'est important : la racine du dépôt contient une autre application.
   - **Environment Variables** :
     - `ANTHROPIC_API_KEY` = votre clé Claude
     - `APP_TOKEN` = le jeton de l'étape 2
4. Cliquez sur *Deploy*. Notez l'adresse obtenue, par exemple `https://carnet-proteines.vercel.app`.

Test rapide depuis le Terminal du Mac :

```bash
curl -X POST https://VOTRE-PROJET.vercel.app/api/analyze \
  -H "Authorization: Bearer VOTRE_APP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"note":"200 g de blanc de poulet grillé et 150 g de riz cuit"}'
```

La réponse attendue est un JSON avec `"plat"`, `"aliments"`, `"confiance"` et `"remarque"`.

## 2. Installer l'app sur l'iPhone (Xcode, sur Mac)

1. Ouvrez Xcode, puis *File → New → Project → iOS → App*.
   - Product Name : `CarnetProteines`
   - Interface : **SwiftUI** · Storage : **None**
2. Dans le navigateur de fichiers d'Xcode, supprimez `ContentView.swift` et `CarnetProteinesApp.swift`, ceux créés par Xcode.
3. Glissez-y tous les fichiers `.swift` de `ios/CarnetProteines/` et cochez *Copy items if needed*.
4. Ouvrez `Config.swift` et remplacez :
   - `serverURL` par l'adresse Vercel (sans `/` final) ;
   - `appToken` par votre `APP_TOKEN`.
5. Dans la cible *CarnetProteines*, onglet **Info**, ajoutez la clé
   `Privacy - Camera Usage Description` avec la valeur « Pour photographier vos repas et estimer leurs calories et leurs macros. »
6. Dans l'onglet **Signing & Capabilities**, choisissez votre compte Apple dans *Team*.
7. Branchez l'iPhone, sélectionnez-le en haut d'Xcode, puis lancez avec ▶︎.
   - Au premier lancement, sur l'iPhone : *Réglages → Général → VPN et gestion de l'appareil*, puis faites confiance à votre compte développeur.
   - Avec un compte Apple gratuit, l'app doit être réinstallée depuis Xcode tous les 7 jours. Avec un compte développeur (99 €/an), elle reste installée et peut passer par TestFlight.

Le simulateur n'a pas d'appareil photo : utilisez « Galerie » ou une description.

## Fonctionnement

- **Profil** (rempli une seule fois au premier lancement) : sexe, âge, taille, poids, activité, objectif. Les besoins sont calculés avec la formule Mifflin-St Jeor × activité, avec −15 % pour une perte et +10 % pour la prise de muscle. Protéines : 1,6 à 2 g/kg selon l'objectif, réglable. Lipides : 1 g/kg. Le reste va aux glucides. Vous pouvez aussi imposer vos calories.
- **Ajouter un repas** : photo ou galerie, avec des précisions facultatives. L'estimation se lance seule. Vous corrigez les grammes et les valeurs se recalculent. Vous pouvez aussi ajouter un aliment à la main, par exemple depuis l'étiquette d'un produit.
- **Aujourd'hui** : la jauge de protéines, les calories, glucides et lipides, la liste des repas (glisser vers la gauche pour supprimer) et la navigation par jour.
- **Historique** : un graphique des protéines sur 7 jours avec l'objectif et les moyennes.

## Sécurité et coûts

- La clé Claude reste sur Vercel. L'app n'envoie que le jeton `APP_TOKEN`, qui empêche un inconnu d'utiliser votre serveur s'il en découvre l'adresse. Si vous publiez l'app pour d'autres personnes, il faudra de vrais comptes utilisateurs et une limite d'appels par personne.
- Modèle utilisé : `claude-opus-5-5`, avec un effort `medium` et une sortie JSON contrainte par un schéma. Si un filtre de sécurité refuse une photo, l'API relance automatiquement la demande sur un autre modèle (`fallbacks: "default"`).
- Pour réduire le coût par photo, vous pouvez passer à `claude-sonnet-5-5` dans `server/api/analyze.ts`. Comparez d'abord la qualité des estimations sur quelques repas.
- Les estimations tirées d'une photo restent approximatives : les portions et l'huile de cuisson se voient mal. Les précisions dans le champ texte améliorent nettement le résultat.
