# Fantafoot

Jeu de fantasy football base sur le championnat de France de Ligue 1.

## Regles du jeu

- Chaque membre cree un club (email + nom de club) avec un budget de **220 M€**
  pour recruter un effectif definitif de **22 joueurs** de Ligue 1.
- A chaque journee (34 au total), le membre aligne **11 titulaires** :
  1 gardien, 4 defenseurs, 3 milieux, 3 attaquants.
- Chaque journee a sa propre **date limite** de composition ; passe ce delai,
  la composition de la derniere journee jouee s'applique automatiquement.
- Un meme joueur peut etre possede par plusieurs clubs (membres) en meme temps.
- Bareme de points par journee :
  - passe decisive : **+1**
  - but : **+3** (ou **+4** si marque par un defenseur)
  - but sur penalty : **+1** en plus du but
  - carton jaune : **-0.5**
  - carton rouge : **-2**
  - gardien ayant encaisse plus de 3 buts : **-1**
  - clean-sheet gardien : **+2**
  - clean-sheet defenseur : **+1**
- La valeur d'un joueur est actualisee apres chaque journee finalisee :
  `valeur = arrondi_superieur(points_saison * x/34 + valeur_depart * (34-x)/34)`
  ou `x` est le nombre de journees deja terminees.
- Un classement general cumule les scores de tous les clubs sur la saison.

## Stack technique

- Next.js 14 (App Router) + TypeScript
- Prisma ORM (SQLite en developpement, compatible PostgreSQL en production)
- NextAuth (authentification par email/mot de passe)
- Tailwind CSS

## Demarrage rapide

```bash
npm install
cp .env.example .env        # puis renseigner NEXTAUTH_SECRET (valeur aleatoire)
npx prisma migrate dev      # cree la base et lance le seed automatiquement
npm run dev
```

Un compte administrateur est cree automatiquement par le seed avec les
identifiants definis dans `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`, par defaut
`admin@fantafoot.local` / `ChangeMe123!`) : **pensez a les changer**.

## Base des joueurs

Le seed (`prisma/seed.ts`) peuple une base de demonstration realiste (144
joueurs sur les 18 clubs de Ligue 1) afin de pouvoir tester immediatement
toutes les fonctionnalites. Ce n'est pas un export exhaustif et a jour du
championnat (les effectifs changent a chaque mercato).

Pour disposer de la liste complete et a jour, l'administrateur peut utiliser
l'outil d'**import en masse** (page `/admin/joueurs`) : coller un tableau au
format `Nom;Poste;Club L1;Valeur de depart` copie depuis un export du site
lequipe.fr (effectifs Ligue 1). Un joueur existant (meme nom + meme club) est
mis a jour plutot que duplique.

## Modules admin (reserves au role ADMIN)

- **/admin/joueurs** : creation, edition et import en masse des joueurs,
  y compris la valeur de depart (fixee arbitrairement par l'admin).
- **/admin/journees** : generation du calendrier des 34 journees et gestion
  des dates limites.
- **/admin/stats** : saisie des resultats d'equipe (buts encaisses par club,
  ce qui calcule automatiquement les clean-sheets/malus de tous les
  gardiens et defenseurs du club) et des statistiques individuelles
  (buts, passes, cartons) uniquement pour les joueurs concernes. La
  finalisation d'une journee fige les points, met a jour les valeurs des
  joueurs et calcule le score de chaque club.

## Tests

```bash
npm test
```

Tests unitaires du bareme de points et de la formule de valorisation des
joueurs (`src/lib/points.test.ts`, `src/lib/value.test.ts`).
