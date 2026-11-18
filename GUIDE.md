# Guide de modification rapide — Clarendrier

Tout le contenu modifiable est centralisé dans **`src/data/calendarData.js`**.

| Pour changer… | Va dans le fichier… | Section / Constante |
| :--- | :--- | :--- |
| **Le mode test** (tout débloquer vs vraies dates de décembre) | `src/data/calendarData.js` | `DEV_MODE` (`true` ou `false`) |
| **Le contenu d'un jour** (titre, texte, image, bon, quiz, grattage, roue…) | `src/data/calendarData.js` | `SURPRISES_CATALOG` |
| **Quel type de surprise tombe quel jour** (jours 1 à 24) | `src/data/calendarData.js` | `DAY_ASSIGNMENTS` |
| **Les questions du cadenas d'entrée** (et mots de passe admin) | `src/data/calendarData.js` | `GATE_QUESTIONS` & `GATE_ADMIN_PASSWORDS` |
| **Les chemins des photos** | `src/data/calendarData.js` | `ASSET_PATHS` |
| **Les textes d'interface / messages toast** | `src/data/calendarData.js` | `UI_TEXTS` |
| **Les couleurs, polices ou tailles** | `styles/variables.css` | `:root` |
| **Le style d'un écran précis** | `styles/<composant>.css` | `calendar.css`, `modal.css`, `wheel.css`, `coupon.css`, `scratch.css`, `quiz.css`, `games.css`, `gate.css`, `decorations.css` |
| **La logique de sauvegarde / dates** | `src/logic/state.js` | Fonctions d'état et `localStorage` |
| **Un mini-jeu ou composant UI précis** | `src/ui/<composant>.js` | `luckyWheel.js`, `ferretGame.js`, `midnightSwim.js`, `scratchCard.js`, `coupon.js`, `quiz.js`, `modal.js`, `calendarGrid.js` |
