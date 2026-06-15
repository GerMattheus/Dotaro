# DOTARO — Brief de refonte complète

> À lire intégralement avant d'écrire la moindre ligne de code. Ce document définit la vision du jeu, les contraintes techniques, le workflow attendu et les règles de collaboration. Toute décision non couverte doit être proposée à l'humain avant d'être implémentée.

---

## 1. Contexte

**Repo GitHub** : https://github.com/GerMattheus/Dotaro
**État actuel** : prototype minimal en HTML/CSS/JS vanilla — une grille 15x15 où deux joueurs posent des points à tour de rôle. Aucune logique de jeu, aucune règle, aucune fin de partie. Point de départ, pas un état à préserver.

**Auteur** : Mattheus Germano (GerMattheus), étudiant en informatique à l'Université de Sherbrooke, passionné de bio-informatique. Ce projet figurera dans son portfolio professionnel, présenté comme "réimplémentation personnelle d'un jeu de stratégie de mon enfance".

**Origine** : Dotaro est une réimplémentation personnelle du **Jeu Chimie**, un jeu de stratégie de territoire originaire de **Kinshasa (République Démocratique du Congo)**. Le jeu officiel est développé par **Tresor Mvumbi** et disponible sur l'App Store, Google Play et à l'adresse jeuchimie.com. Dotaro n'est pas affilié à l'original — ce crédit doit figurer dans le README.

**Vision** : transformer ce prototype en un vrai jeu web installable sur mobile (PWA), avec des règles paramétrables, plusieurs modes de jeu et un multijoueur local et à distance. Le tout en gardant un esprit léger, rapide et joué de courtes parties.

---

## 2. Le jeu — concept et règles

### Concept central
Deux joueurs posent des points de leur couleur à tour de rôle sur les **intersections** d'une grille quadrillée. L'objectif est de former des **parcelles** — des zones fermées encerclant des points adverses — pour marquer des points. Celui qui totalise le plus de points en fin de partie gagne.

### Placement des points sur les intersections

**Important** : les points se posent sur les **INTERSECTIONS** des lignes de la grille, pas dans les cases. C'est le fonctionnement du Jeu Chimie original (visible sur toutes les images de référence dans `images/`).

Conséquences techniques :
- Une grille NxN affiche **(N+1) × (N+1) intersections** jouables
- Une grille "15x15" donne donc 16×16 = 256 intersections
- Le voisinage entre intersections utilise la 8-connexité (voir ci-dessous)

### Mécanique de base
- Grille de taille variable (par défaut 15x15, configurable)
- Deux joueurs alternent leurs coups
- On marque des points en formant des **parcelles** (zones fermées)
- Les points restent sur la grille une fois posés — pas de retrait
- Fin de partie : deux tours consécutifs passés, atteinte d'une limite de temps, ou grille pleine

### Définition d'une parcelle valide

Une zone fermée est une **parcelle valide** si et seulement si :
1. Elle est entièrement entourée par les points d'**un seul joueur**, connectés en **8-connexité** (haut, bas, gauche, droite ET les 4 diagonales)
2. Elle contient au moins **un point adverse** à l'intérieur
3. Elle ne contient **aucun point du joueur qui encercle**

Cas invalides :
- Zone vide entourée → pas de parcelle, rien ne se passe
- Zone contenant des points du joueur qui encercle → invalide
- Frontière partiellement ouverte → pas fermée, pas de parcelle

**Algorithme de détection** : flood-fill depuis l'extérieur de la grille en **4-connexité** (haut/bas/gauche/droite uniquement), en bloquant sur les points du joueur encerclant. Toute intersection non atteinte est à l'intérieur de la parcelle. Ce duo "frontière en 8-connexité + flood-fill intérieur en 4-connexité" est la bonne approche pour ce type de problème.

### Comptage des points

Quand une parcelle valide se forme :

```
score gagné = (nombre de points adverses à l'intérieur) × (valeur de capture)
```

Le paramètre "valeur de capture" (1, 2 ou 3) est configuré avant la partie.

### Encerclement en cascade

Si le joueur encerclé parvient ensuite à former une **parcelle plus grande** englobant complètement la parcelle adverse :
- La parcelle interne adverse **tombe** : elle est annulée
- Les points gagnés par l'adversaire via cette parcelle sont **soustraits de son score**
- Le joueur qui fait la grande parcelle gagne des points pour **tous les points adverses à l'intérieur** de sa grande parcelle, y compris les anciens points de contour de la parcelle annulée
- L'animation montre clairement la cascade : dissolution de l'ancienne parcelle, puis formation de la nouvelle

**Note** : deux parcelles (une par joueur) peuvent coexister dans la même zone si la zone externe n'est pas encore une parcelle valide fermée. La cascade ne s'applique que si la grande parcelle est entièrement valide.

### Règle du suicide

Si un joueur pose un point qui le ferait **immédiatement encercler** sans créer de parcelle valide, **le coup est refusé**.

- Feedback visuel : l'intersection scintille brièvement en rouge
- Son d'erreur court si le son est activé

Exception : si le coup crée simultanément une parcelle valide et libère son propre groupe, le coup est autorisé.

### Modes de jeu

**Mode "Parcelles"** (défaut — fidèle au Jeu Chimie)
- On marque des points uniquement via les parcelles valides
- Les modes "Captures seules" et "Hybride" sont exclus de la v1

**Variante "Parcelle = rejoue"** (booléen)
- Quand un joueur forme une parcelle valide, il rejoue immédiatement

**Variantes de comptage**
- À **1 point par point adverse** dans la parcelle (mode rapide)
- À **2 points** (mode pondéré)
- À **3 points** (mode long)

### Paramètres de partie

| Paramètre | Options | Défaut |
|---|---|---|
| Taille de la grille | 9x9, 13x13, 15x15, 19x19 | 15x15 |
| Grille évolutive | Off / Rapide (toutes les 3 parcelles) / Normale (toutes les 5) / Lente (toutes les 10) | Off |
| Taille max (si évolutive) | 19x19 / 25x25 / 31x31 | 19x19 |
| Parcelle = rejoue | Oui / Non | Non |
| Valeur d'un point capturé | 1, 2, ou 3 points | 1 |
| Temps par coup | Illimité / 10s / 30s / 60s | Illimité |
| Temps total par joueur | Illimité / 5min / 10min / 15min | Illimité |
| Couleur joueur 1 | Voir système de couleurs ci-dessous | Bleu |
| Couleur joueur 2 | Auto-définie selon la paire | Rouge |
| Thème visuel | Voir section 5 | Papier millimétré |

### Système de couleurs

Couleurs organisées en **paires contrastantes**. Quand un joueur choisit sa couleur, l'autre reçoit automatiquement la couleur jumelle.

Paires :
- Bleu / Rouge
- Vert / Magenta
- Jaune / Violet
- Cyan / Orange
- Blanc / Noir (mode classique)

Implémenter au minimum 5 paires. Ne **jamais** permettre des combinaisons qui se ressemblent (bleu et cyan, orange et rouge, etc.).

---

## 3. Architecture attendue

### Principe directeur

**Séparation stricte entre le moteur de jeu et l'interface utilisateur.**

Le moteur de jeu est une bibliothèque pure (pas de DOM, pas de couleurs, pas d'animations) qui :
- Prend en entrée un état de jeu + une action (poser un point)
- Renvoie le nouvel état + les événements (parcelle formée, cascade, fin de partie, coup refusé)
- Est testable indépendamment de l'UI
- Est réutilisable pour le local et le multijoueur réseau

Cette séparation est non-négociable.

### Stack technique

**Contraintes :**
1. **Léger avant tout** : TTI < 2s en 4G, démarrage d'une partie < 1s
2. **PWA installable dès la v1** : manifest, service worker, icônes iOS, offline local
3. **Vanilla TypeScript + Vite** : sauf justification solide, pas de framework
4. **TypeScript obligatoire** pour le moteur de jeu
5. **Animations CSS pur** prioritaire ; si lib JS nécessaire, **Motion One** (4kb) uniquement
6. **Pas de Tailwind** : CSS pur avec variables custom
7. **Tests Vitest obligatoires** sur le moteur. Au minimum : pose de point, parcelle valide, parcelle invalide (zone vide, contient des points du joueur), cascade, suicide

### Multijoueur à distance — Décision tranchée : Supabase Realtime

Décision confirmée : **Supabase Realtime** pour la v1.

Spécifications :
- Création d'une partie : le joueur reçoit un **code de 6 caractères alphanumériques majuscules** (ex: "B3K9P2")
- Rejoindre : l'autre joueur entre le code
- Sync temps réel des coups via Supabase Realtime
- Pas d'authentification : juste un pseudo par joueur
- Reconnexion : revenir avec le code et reprendre (état sauvegardé côté Supabase)
- Expiration : parties inactives depuis plus de 7 jours supprimées automatiquement

À demander à l'humain au moment de l'étape multijoueur : URL Supabase + clé `anon`.

**Règles de sécurité absolues :**
- Clé `anon` uniquement, jamais `service_role` dans le frontend
- Clés dans `.env.local` (jamais commité)
- RLS activé sur toutes les tables avec politiques strictes
- Codes de partie aléatoires et non-prédictibles

---

## 4. Architecture des fichiers attendue

```
Dotaro/
├── public/
│   ├── icons/              (icônes PWA, plusieurs tailles)
│   ├── manifest.json       (PWA manifest)
│   └── sounds/             (si sons ajoutés plus tard)
├── src/
│   ├── engine/             (pure logic — zéro DOM)
│   │   ├── board.ts        (création, manipulation de la grille)
│   │   ├── rules.ts        (détection de parcelle, cascade, suicide)
│   │   ├── game.ts         (state machine de la partie)
│   │   ├── types.ts        (types partagés)
│   │   └── engine.test.ts  (tests Vitest)
│   ├── ui/
│   │   ├── components/     (BoardView, Controls, Setup, ScoreBoard, etc.)
│   │   ├── themes/         (chaque thème dans son fichier CSS)
│   │   └── styles/         (variables CSS globales)
│   ├── multiplayer/
│   │   └── connection.ts   (Supabase Realtime)
│   ├── storage/
│   │   └── local.ts        (sauvegarde de partie en cours, settings)
│   ├── main.ts             (entry point)
│   └── pwa.ts              (enregistrement du service worker)
├── images/                 (références visuelles — ne pas commiter en prod)
├── .gitignore
├── DOTARO_BRIEF.md         (ce fichier)
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

---

## 5. Direction artistique et thèmes

### Rendu visuel des parcelles

Référence obligatoire : lire les images dans `images/` avant de coder le rendu visuel.

**Forme** : polygone dont les sommets sont les points du joueur qui encercle, reliés par des lignes droites en suivant la 8-connexité.

**Construction d'une parcelle** :
- Les points du contour sont reliés par des **lignes droites** de la couleur du joueur
- L'intérieur est rempli d'une **couleur translucide** (couleur du joueur, opacité 25-35%)
- Les points capturés à l'intérieur restent visibles mais sont légèrement réduits (~10%) pour signifier qu'ils sont "domestiqués"

**Animation de formation** (400-600ms, séquencée) :
1. Les lignes du contour se tracent de point en point
2. Le fond translucide s'étend depuis le centre
3. Les points capturés rétrécissent légèrement

**Animation de cascade** (1-1.5s max) :
1. La parcelle interne se dissout : lignes s'estompent (300ms), fond disparaît (200ms), points redeviennent normaux
2. La grande parcelle se forme avec l'animation standard
3. Flash rouge sur le score adverse (soustraction), flash couleur joueur sur le gain

**Score** : mise à jour avec effet "number rolling".

### Thèmes à implémenter

**1. Papier millimétré** (thème par défaut — fidèle au Jeu Chimie)
- Fond blanc/crème, grille de fines lignes bleu clair (comme du vrai papier millimétré)
- Points petits et nets, couleurs vives
- Parcelles translucides dans la couleur du joueur
- Typographie sans-serif propre (Inter)
- C'est le look exact de l'app officielle

**2. Cosmos** (sombre et spatial)
- Fond très sombre avec étoiles statiques
- Lignes de grille quasi-invisibles, juste suggérées
- Points lumineux avec lueur subtile (box-shadow douce)
- Parcelles avec glow de la couleur du joueur
- Typographie sans-serif technique (Inter)

**3. Néon** (fun et énergique)
- Fond noir profond, grille discrète en gris foncé
- Points néon avec glow (CSS filter)
- Parcelles avec contour lumineux intense
- Typographie display moderne (Space Grotesk)

**4. Japonisant** (clin d'œil au Go)
- Fond beige/papier kraft texturé
- Grille en lignes fines noires (style goban)
- Points noirs et blancs brillants
- Typographie Noto Serif JP pour les titres

**5. Pastel** (doux, accessible)
- Fond rose pâle ou crème
- Points et parcelles pastels harmonieux
- Animations très douces
- Typographie ronde (Nunito)

### Règles d'animation

- **60fps obligatoire**, même sur iPhone d'il y a 4 ans
- `transform` et `opacity` uniquement — jamais `width`, `height`, `top`, `left` animés
- Respecter `prefers-reduced-motion`
- Animation de pose d'un point : 150-250ms max
- Animation de formation d'une parcelle : 400-600ms
- Animation de cascade : 1-1.5s max

---

## 6. Configuration Git et fichiers à protéger

### `.gitignore`

```
# Dependencies
node_modules/
.pnpm-store/

# Build
dist/
build/

# Editor
.vscode/
.idea/
*.swp
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Tests
coverage/

# IMPORTANT : Claude Code working directory — ne JAMAIS commiter
.claude/

# Fichiers de travail temporaires
.scratch/
```

**Règle absolue** : `.claude/` dans le `.gitignore` dès le premier commit.

### Workflow Git

1. Branche `main` acceptable pour un projet solo
2. Commits atomiques Conventional Commits, description en français
3. Ne pas push après chaque petite modif — grouper logiquement par feature terminée et testée
4. `git status` avant chaque commit pour vérifier que `.claude/`, `node_modules/`, `.env.local` ne sont pas inclus

---

## 7. README.md à générer

En français, avec ces sections :

```markdown
# Dotaro

[Bandeau visuel : capture d'écran du jeu en cours]

> Une réimplémentation moderne du Jeu Chimie, jeu de stratégie de territoire de Kinshasa.

## Origine et inspiration

Dotaro est inspiré du **Jeu Chimie**, un jeu traditionnel de Kinshasa (République Démocratique
du Congo). L'application officielle est développée par **Tresor Mvumbi**, disponible sur
l'App Store, Google Play, et à l'adresse jeuchimie.com.
Dotaro est une réimplémentation personnelle non affiliée, réalisée par Mattheus Germano.

## Comment jouer

[Règles : pose sur les intersections, formation des parcelles, cascade, fin de partie]

## Installation (PWA)

[URL du site déployé + instructions d'installation sur iOS et Android]

## Paramètres

[Liste des paramètres de partie avec une phrase descriptive chacun]

## Architecture

[Bref aperçu : moteur séparé de l'UI, TypeScript + Vite, tests Vitest]

## Développement local

npm install
npm run dev
npm test
npm run demo

## Roadmap

[Ce qui est fait ✅ / ce qui reste à faire]

## Crédits

Développé par Mattheus Germano avec l'assistance de Claude Code.
Inspiré du Jeu Chimie de Kinshasa — app officielle par Tresor Mvumbi (jeuchimie.com).
```

Le README doit être **fier mais pas grandiloquent** : il décrit ce qui existe, sans inventer de features.

---

## 8. Plan de construction — Checkpoints

Travail organisé en **9 checkpoints visuels et testables**. Chaque checkpoint est vérifiable en moins de 5 minutes.

**Checkpoint 1 — Plan validé**
Envoyer dans la première réponse : confirmation, description des images, recommandation de stack, plan chiffré pour les CP 2 à 9, exemple de code dans le style attendu. **Ne rien coder avant validation.**

**Checkpoint 2 — Setup + structure** *(visible : `npm run dev` affiche "Dotaro")*
- Vite + TypeScript + Vitest initialisé
- Structure de dossiers créée (voir section 4)
- `.gitignore` avec `.claude/`
- Premier commit + push GitHub

**Checkpoint 3 — Moteur de jeu testé** *(visible : `npm test` tout vert)*
- Moteur sans UI
- Tests couvrent : pose de point, parcelle valide, parcelle invalide (zone vide / contient points du joueur), cascade, suicide
- `npm run demo` : simule une partie complète dans la console

**Checkpoint 4 — UI minimale jouable** *(visible : on peut jouer une partie complète)*
- Grille avec points sur les intersections, pose par clic
- Formation de parcelles visible (style basique, sans thèmes)
- Score affiché et mis à jour, fin de partie détectée
- Deux joueurs sur le même écran

**Checkpoint 5 — Thèmes** *(visible : on peut switcher)*
- Thème "Papier millimétré" impeccable
- Au moins 2 autres thèmes jouables
- Bouton de switch en cours de partie

**Checkpoint 6 — Paramètres + persistance** *(visible : fermer/rouvrir reprend la partie)*
- Écran de setup complet avec toutes les options du brief
- Sauvegarde dans localStorage

**Checkpoint 7 — PWA** *(visible : installable sur iPhone)*
- Manifest correct, service worker fonctionnel
- Icônes iOS (180px notamment), offline local
- Instructions de test sur Safari iOS fournies

**Checkpoint 8 — Multijoueur Supabase** *(visible : 2 navigateurs, 1 partie)*
- Code de partie 6 caractères, création et rejoin
- Sync temps réel, reconnexion possible
- Clé `anon` en `.env.local`, RLS activé

**Checkpoint 9 — Polish + déploiement** *(visible : URL publique fonctionnelle)*
- 60fps sur iPhone moyen, `prefers-reduced-motion` respecté, contraste AA
- README complet avec crédit Jeu Chimie
- Déploiement Netlify ou Vercel

**Entre les checkpoints : liberté totale.** Codes, testes, commits, push sans demander.

**Règles inviolables :**
1. Ne jamais push de code non-testé sur main
2. Si une décision sort du brief ou l'interprétation d'une image est douteuse → STOP, demander
3. Commits atomiques Conventional Commits en français
4. `git status` avant chaque commit

---

## 9. Règles de collaboration

- **Demander avant d'inventer** : décision non couverte → demander, pas présumer
- **Communiquer en français** dans les commits, le README, les commentaires. Noms de variables en anglais.
- **Performance comme contrainte de design** : "est-ce que ça reste rapide sur un iPhone d'il y a 4 ans ?"
- **Aider Mattheus à comprendre** : après chaque feature significative, expliquer ce qui a été fait et pourquoi. Ne jamais laisser avec du code magique qu'il ne pourrait pas défendre en entretien.

---

## 9bis. Style du code et signature de l'auteur

Ce projet figurera dans le portfolio de Mattheus Germano. Le code doit refléter son style, pas un style générique d'assistant IA.

### Langue dans le code

| Élément | Langue |
|---|---|
| Noms de variables, fonctions, classes, types | **Anglais** |
| Commentaires dans le code | **Français** |
| Messages affichés à l'utilisateur (UI) | **Français** |
| Commits Git | **Français** dans la description, Conventional Commits pour le préfixe |
| README et docs | **Français** |
| Tests Vitest (`it("should...")`) | **Anglais** (convention) |

### Style des commentaires

- **Bref et direct** (1-2 phrases max)
- **Explique le "pourquoi"**, pas le "quoi" — le code dit déjà ce qu'il fait
- **Ton personnel et léger** quand pertinent (`// TODO: refactor ça quand j'aurai le temps`)
- JSDoc seulement sur les fonctions exportées du moteur, concis (3-4 lignes max)
- Pas de commentaires évidents au-dessus d'un `for`
- Densité raisonnable : un bon commentaire toutes les 10-20 lignes

**Exemples du ton attendu :**

```typescript
// Flood-fill depuis l'extérieur en 4-connexité pour trouver l'intérieur.
// Frontière en 8-connexité + flood-fill en 4-connexité : le duo classique
// pour ce genre de problème (analogue discret du théorème de Jordan).
function findInteriorCells(board: Board, boundary: Set<string>): Position[] {
  // ...
}
```

```typescript
// On sauvegarde dans localStorage après chaque coup — pas besoin de débouncer,
// les coups sont espacés de quelques secondes au minimum.
saveGameState(state);
```

```typescript
// Note : la grille évolutive ajoute des rangées des deux côtés, pas juste à droite.
// Sinon le jeu devient bizarre si on est près d'un bord.
function expandBoard(board: Board): Board {
  // ...
}
```

### Patterns à éviter absolument

- ❌ Commentaires qui paraphrasent le code (`// incrémente le compteur` au-dessus de `counter++`)
- ❌ JSDoc verbeux sur chaque fonction interne
- ❌ Noms génériques (`data`, `result`, `temp`, `myVar`)
- ❌ Defensive programming excessif (vérifier `null` partout quand TypeScript garantit le type)
- ❌ Fonctions de 200+ lignes qui font tout
- ❌ `console.log` oubliés dans le code commité
- ❌ Try/catch partout sans vraie gestion d'erreur
- ❌ Blocs de commentaires décoratifs (`// ===== SECTION =====`)

### Style des commits

- `feat(engine): ajoute la détection de parcelle via flood-fill`
- `fix(ui): corrige le double-tap sur mobile qui pose deux points`
- `refactor(rules): sépare la logique de cascade de la détection initiale`
- `test(engine): couvre le cas d'une parcelle en bord de grille`
- `style(themes): ajuste les contrastes du thème Cosmos`

---

## 10. Première action attendue de Claude Code

Répondre avec le **Checkpoint 1** :

1. Confirmation que le brief et toutes les clarifications ont été lus intégralement
2. Description en 2-3 phrases de ce que tu as vu dans les images de `images/`
3. Recommandation de stack précise avec justification courte
4. Plan d'action chiffré en heures pour les Checkpoints 2 à 9
5. Un exemple de 5-10 lignes de code dans le style attendu (anglais pour les noms, français pour les commentaires, ton naturel)

**Ne rien coder d'autre avant validation du Checkpoint 1.**
