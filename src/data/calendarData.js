/**
 * ============================================================================
 * FICHIER CENTRAL DES DONNÉES MODIFIABLES — CLARENDRIER
 * ============================================================================
 * Tout le contenu personnalisable de l'application est regroupé ici :
 *  1. Mode développeur & dates de déverrouillage
 *  2. Clés de sauvegarde (localStorage) & synchronisation cloud (ntfy.sh)
 *  3. Chemins des images et ressources (/assets/...)
 *  4. Question secrète d'entrée (Gate) & mots de passe admin
 *  5. Assignation des surprises jour par jour (1 à 24 décembre)
 *  6. Catalogue complet des surprises (textes, bons, quiz, photos, roue, jeux)
 *  7. Textes d'interface et messages récurrents
 * ============================================================================
 */

/* -------------------------------------------------------------------------
   1. MODE DÉVELOPPEUR & DATES DU CALENDRIER
   - Passe DEV_MODE à `false` avant de lui offrir le site en décembre.
   ------------------------------------------------------------------------- */
import { WHEEL_SEGMENTS } from '../logic/luckyWheelLogic.js';

export const DEV_MODE = true;

export const CALENDAR_CONFIG = {
    TOTAL_DAYS: 24,
    DAY_23: 23,
    CHRISTMAS_EVE_DAY: 24,
    UNLOCK_MONTH_INDEX: 11 // 11 = Décembre en JavaScript (0 = Janvier)
};

/* -------------------------------------------------------------------------
   2. CLÉS LOCALSTORAGE & CANAL DE SYNCHRONISATION À DISTANCE
   ⚠️ Ne pas modifier ces clés pour conserver la progression déjà enregistrée.
   ------------------------------------------------------------------------- */
export const STORAGE_KEYS = {
    OPENED_DAYS: 'advent_opened_days_v1',
    GAMES_WON: 'advent_games_won_v1',
    GATE_AUTH: 'advent_gate_auth_v1',
    QUIZ_ANSWERS: 'advent_quiz_ete_answers_v1',
    SCRATCHED_CARDS: 'advent_scratched_cards_v1'
};

// Canal privé cloud (sans inscription) permettant à Alexis de recevoir et lire à distance
// ce que Clara tape sur son téléphone aux questions du quiz :
export const QUIZ_SYNC_TOPIC = 'clarendrier_alexis_clara_quiz_2025_v1';
export const QUIZ_SYNC_BASE_URL = 'https://ntfy.sh';

/* -------------------------------------------------------------------------
   3. CHEMINS DES IMAGES & LIENS EXTERNES
   ------------------------------------------------------------------------- */
export const ASSET_PATHS = {
    SCRATCH_DAY6_IMG1: '/assets/image1.png',
    SCRATCH_DAY6_IMG2: '/assets/image2.png',
    SCRATCH_DAY7_IMG3: '/assets/image3.png',
    SCRATCH_DAY7_IMG4: '/assets/image4.png',
    QUIZ_FINAL_CAP: '/assets/cap.png'
};

/* -------------------------------------------------------------------------
   4. CONFIGURATION DE LA QUESTION D'ACCÈS (ROTATION & MÉMORISATION)
   - GATE_REMEMBER_HOURS : durée (en heures) pendant laquelle l'appareil est mémorisé (24h = 1 jour)
   - QUESTION_ROTATION_HOURS : durée (en heures) avant de passer à la question suivante
   - GATE_QUESTIONS : liste des questions et réponses acceptées (insensible aux majuscules/accents)
   ------------------------------------------------------------------------- */
export const GATE_REMEMBER_HOURS = 24;
export const QUESTION_ROTATION_HOURS = 24;
export const GATE_ADMIN_PASSWORDS = ['alexis', 'admin'];
// Mots passe-partout permettant d'entrer sur le site quelle que soit la question du jour (insensible à la casse : clara / Clara)
export const GATE_MASTER_PASSWORDS = ['clara'];

export const GATE_FALLBACK_QUESTION = {
    question: "Quelle est ma couleur préférée ?",
    answers: ["bleu"]
};

export const GATE_QUESTIONS = [
    {
        active: true, // Passe à `false` pour désactiver cette question, ou passe les suivantes à `true` au fur et à mesure
        question: "Quelle est ma couleur préférée ?",
        // Mets ici uniquement ta vraie couleur préférée si tu veux restreindre à une seule réponse :
        answers: [
            "bleu", "vert", "noir", "rouge", "blanc", "violet",
            "jaune", "orange", "gris", "marron", "beige", "bordeaux",
            "marine", "turquoise", "kaki", "corail", "lavande"
        ],
        // Messages d'erreur personnalisés pour certaines mauvaises réponses (insensible à la casse)
        customErrors: {
            "rose": "je savais t'allais répondre ça et c'est FAUX (un peu vrai mais j'assume pas)."
        }
    },
    {
        active: false, // Prête à activer plus tard (passe simplement à `true`)
        question: "Dans quel musée avons nous fait notre première sortie tout les deux ?",
        answers: [
            "musée d'histoire naturelle",
            "musee d'histoire naturelle",
            "musée d histoire naturelle",
            "musée dhistoire naturelle",
            "musée d'histoire naturel",
            "musée d'histoires naturelles",
            "musée de l'histoire naturelle",
            "musée des histoires naturelles",
            "musée national d'histoire naturelle",
            "muséum d'histoire naturelle",
            "museum d'histoire naturelle",
            "muséum national d'histoire naturelle",
            "museum national d'histoire naturelle",
            "muséum",
            "museum",
            "histoire naturelle",
            "histoire naturel",
            "histoires naturelles",
            "d'histoire naturelle",
            "d histoire naturelle",
            "dhistoire naturelle",
            "histoire nat",
            "mnhn",
            "mhnh",
            "musée naturel",
            "musée naturelle",
            "musée de la nature",
            "musée nature",
            "grande galerie de l'évolution",
            "galerie de l'évolution",
            "jardin des plantes",
            "musée des animaux",
            "musée des dinosaures"
        ],
        // Validation souple : accepte toute réponse contenant l'une de ces variantes (même dans une phrase ou avec de petites fautes)
        acceptedKeywords: [
            "histoire nat",
            "histoires nat",
            "naturelle",
            "naturel",
            "naturele",
            "museum",
            "mnhn",
            "m n h n",
            "mhnh",
            "musee d histoire",
            "musee histoire",
            "musee dhistoire",
            "musee de l histoire",
            "musee de la nature",
            "musee nature",
            "galerie de l evolution",
            "galerie evolution",
            "grande galerie",
            "jardin des plantes",
            "musee des animaux",
            "musee animaux",
            "musee des dinosaures",
            "musee dinosaures"
        ]
    }
    // Tu peux ajouter d'autres questions ici qui tourneront toutes les X heures
];

/* -------------------------------------------------------------------------
   5. ASSIGNATION FACILE DES SURPRISES PAR JOUR (1 À 24 DÉCEMBRE)
   - Pour déplacer n'importe quelle surprise vers un autre jour plus tard
     (ex: mettre la surprise du jour 4 au jour 20), change simplement le numéro ici !
   - Pour ajouter un nouveau jour (ex: 11), associe-le à une clé de SURPRISES_CATALOG.
   ------------------------------------------------------------------------- */
export const DAY_ASSIGNMENTS = {
    1: 'spotify_just_two_of_us', // Jour 1 : Petit mot surprise -> notre musique à nous deux
    2: 'physical_chocolats',     // Jour 2 : Cadeau physique (chocolats et bonbons)
    3: 'quiz_ete',               // Jour 3 : Petit quizz de notre été
    4: 'coupon_chanson',         // Jour 4 : Bon pour une chanson à 2
    5: 'ferret_dune',            // Jour 5 : Jeu Ascension de la Dune
    6: 'physical_portecle',      // Jour 6 : Cadeau physique (porte-clé bracelet fait main)
    7: 'scratch_photo_1',        // Jour 7 : Les cartes à gratter
    8: 'physical_ferrero',       // Jour 8 : Cadeau physique (petite boîte de Ferrero Rocher)
    9: 'coupon_spiderman',       // Jour 9 : Bon pour aller voir Spider-Man
    11: 'physical_tshirt',       // Jour 11 : Cadeau physique (t-shirt I Love AA)
    12: 'midnight_swim',         // Jour 12 : Jeu Bain de Minuit au Cap
    13: 'physical_day13',        // Jour 13 : Case rouge vide
    14: 'scratch_photo_2',       // Jour 14 : Les autres cartes à gratter
    16: 'coupon_massage',        // Jour 16 : Bon pour un EENORME massage
    17: 'physical_bonbons_chocolats', // Jour 17 : Cadeau physique (bonbon / chocolats)
    19: 'physical_lettre',       // Jour 19 : Cadeau physique (lettre avec photo de nous deux)
    20: 'lucky_wheel',           // Jour 20 : La Roue de la Chance
    21: 'physical_bracelet',     // Jour 21 : Cadeau physique (bracelet fait main)
    22: 'museum_gallery',        // Jour 22 : Jeu Grande Galerie de l'Évolution (Muséum de Paris)
    24: 'physical_noel_24'       // Jour 24 : Cadeau physique (Lettre malo + photo + JBL Go 4)
};

/* -------------------------------------------------------------------------
   6. TEXTE DES CASES VIDES (CHAÎNE VIDE "" PRÊTE À ÊTRE REMPLIE PLUS TARD)
   ------------------------------------------------------------------------- */
export const EMPTY_DAYS_CONTENT = {
    10: "",
    15: "",
    18: "",
    23: ""
};

export function getDefaultDayContent(day) {
    return EMPTY_DAYS_CONTENT[day] ?? "";
}

/* -------------------------------------------------------------------------
   7. CATALOGUE COMPLET DES SURPRISES INTERCHANGEABLES
   ------------------------------------------------------------------------- */
export const DEFAULT_WHEEL_SEGMENTS = WHEEL_SEGMENTS;

export const SURPRISES_CATALOG = {
    scratch_photo_1: {
        game: "scratch_card",
        gameTitle: "Tickets d'Or à Gratter",
        gameSubtitle: "Surprise cachée • 2 Cartes à gratter",
        imageSrc: ASSET_PATHS.SCRATCH_DAY6_IMG1,
        cards: [
            {
                id: "day6_img1",
                label: "Carte n°1",
                imageSrc: ASSET_PATHS.SCRATCH_DAY6_IMG1,
                revealThreshold: 55,
                caption: ""
            },
            {
                id: "day6_img2",
                label: "Carte n°2",
                imageSrc: ASSET_PATHS.SCRATCH_DAY6_IMG2,
                captionThreshold: 50,
                revealThreshold: 50,
                caption: "Notre première sortie tout les deux 😭"
            }
        ],
        content: "Notre première sortie tout les deux 😭"
    },

    scratch_photo_2: {
        game: "scratch_card",
        gameTitle: "Tickets d'Or à Gratter",
        gameSubtitle: "Surprise cachée • 2 Cartes à gratter",
        imageSrc: ASSET_PATHS.SCRATCH_DAY7_IMG3,
        cards: [
            {
                id: "day7_img3",
                label: "Carte n°1",
                imageSrc: ASSET_PATHS.SCRATCH_DAY7_IMG3,
                captionThreshold: 50,
                revealThreshold: 50,
                caption: "on ira Clara promis."
            },
            {
                id: "day7_img4",
                label: "Carte n°2",
                imageSrc: ASSET_PATHS.SCRATCH_DAY7_IMG4,
                captionThreshold: 50,
                revealThreshold: 50,
                caption: "la plage des dunes ... j'en parlerais dans mon livre"
            }
        ],
        content: "la plage des dunes ... j'en parlerais dans mon livre"
    },

    spotify_just_two_of_us: {
        game: "spotify_link",
        secretKicker: "Petit mot secret",
        secretLabel: "Clique sur moi, surprise",
        spotifyUri: "spotify:track:5fdNHVZHbWB1AaXk4RBGVD",
        spotifyWebUrl: "https://open.spotify.com/track/5fdNHVZHbWB1AaXk4RBGVD",
        content: "Clique sur moi, surprise"
    },

    coupon_massage: {
        game: "coupon",
        theme: "red",
        gameTitle: "Bon Cadeau",
        couponTitle: "Bon pour un EENORME massage",
        couponClause: "",
        content: "Bon pour un EENORME massage"
    },

    coupon_chanson: {
        game: "coupon",
        theme: "pine",
        gameTitle: "Bon Cadeau",
        couponTitle: "Bon pour une chanson à 2 où JE chante (chippie va)",
        couponClause: "(je choisie la musique parcontre hein faut pas abuser du loup qui se cache dans la bergerie)",
        content: "Bon pour une chanson à 2 où JE chante (chippie va)"
    },

    coupon_spiderman: {
        game: "coupon",
        theme: "red",
        gameTitle: "Bon Cadeau",
        couponTitle: "Bon pour aller voir Spider-Man au ciné dès le premier week-end des vacances de Noël",
        couponClause: "(il ressort au ciné avec de nouvelles scènes)",
        content: "Bon pour aller voir Spider-Man au ciné dès le premier week-end des vacances de Noël (il ressort au ciné avec de nouvelles scènes)"
    },

    quiz_ete: {
        game: "quiz_ete",
        gameTitle: "Tu te souviens de notre été ?",
        gameSubtitle: "Quiz Souvenirs • 4 Questions",
        finalImage: ASSET_PATHS.QUIZ_FINAL_CAP,
        finalMessage: "quizz terminé a demain ! (ce bunker dans mon cœur vrmt)",
        content: `quizz terminé a demain ! (ce bunker dans mon cœur vrmt)`,
        questions: [
            {
                id: "q1_mont_lachat",
                shortTitle: "Question 1 • Livre d'Or de la Croix du Mont Lachat (Annecy)",
                question: "Première question sérieuse (promis les autres ne le sont pas) Que pense tu que j'ai mis dans le livre d'Or de la Croix du Mont Lachat à coté d'Annecy ?",
                type: "text",
                placeholder: "Écris ce que tu penses ici..."
            },
            {
                id: "q2_arrivee_cap",
                shortTitle: "Question 2 • Arrivée au Cap",
                question: "Quel est la première chose que j'ai faite en arrivant au cap ?",
                type: "choice",
                options: [
                    {
                        label: "Je me suis enfuis (ta grand mère me faisait trop peur)",
                        isCorrect: false,
                        feedback: "alors oui c'est vrai ta grand mère me fait peur mais c'est pas ça."
                    },
                    {
                        label: "un bon petit pipi",
                        isCorrect: false,
                        feedback: "nan ça c'était sur le bunker (heureusement que tu m'a aidé (j'aurais besoin de ton aide de nouveau))"
                    },
                    {
                        label: "un bon gros caca",
                        isCorrect: false,
                        feedback: "malheureusement non je suis trop bien élever pour m'abaisser a ce niveau de répugnantise (spoiler : ruben va le faire à jade)"
                    },
                    {
                        label: "aucune de ces trois réponses",
                        isCorrect: true,
                        feedback: "Bonne réponse mais désolé ça n'était aucune de ces réponses moi même je m'en souviens plus mais regarde ce que je t'ai mis quand tu met les mauvaises réponses."
                    }
                ]
            },
            {
                id: "q3_mot_maxime",
                shortTitle: "Question 3 • Le mot de Maxime",
                question: "Quel était la mot préférer de Maxime durant ce séjour.",
                type: "choice",
                options: [
                    {
                        label: "alcool",
                        isCorrect: false,
                        feedback: "eh nan c'est toi ça (t'es mon alcoolique à moi)"
                    },
                    {
                        label: "eh mamie",
                        isCorrect: true,
                        feedback: "Bonne réponse ! C'était bien « eh mamie » !"
                    },
                    {
                        label: "finalement",
                        isCorrect: false,
                        feedback: "nan ça c'est mon mot pref."
                    }
                ]
            },
            {
                id: "q4_prochaines_vacances",
                shortTitle: "Question 4 • Nos prochaines vacances tous les deux",
                question: "Quand est-ce qu'on re part en vaccances tout les deux ?",
                type: "text",
                placeholder: "Dis-moi quand..."
            }
        ]
    },

    ferret_dune: {
        game: "ferret",
        gameTitle: "L'Ascension de la Dune",
        gameSubtitle: "Défi Cap Ferret",
        content: `Merci pour ces vacances au Cap Ferret ❤️`
    },

    midnight_swim: {
        game: "midnight_swim",
        gameTitle: "Bain de Minuit au Cap",
        gameSubtitle: "Dernière soirée",
        content: ""
    },

    lucky_wheel: {
        game: "lucky_wheel",
        gameTitle: "La Roue de la Chance",
        gameSubtitle: "",
        content: "",
        segments: DEFAULT_WHEEL_SEGMENTS
    },

    museum_gallery: {
        game: "museum_gallery",
        gameTitle: "La Grande Galerie de l'Évolution",
        gameSubtitle: "Premier rendez-vous • Muséum de Paris",
        content: ""
    },

    physical_chocolats: {
        giftKind: "physical",
        game: null,
        cardNote: "à faire",
        physicalTitle: "Chocolats et bonbons",
        content: "Cadeau physique : chocolats et bonbons"
    },

    physical_portecle: {
        giftKind: "physical",
        game: null,
        cardNote: "à faire",
        physicalTitle: "Porte-clé bracelet fait main",
        content: "Cadeau physique : porte-clé bracelet fait main"
    },

    physical_ferrero: {
        giftKind: "physical",
        game: null,
        physicalTitle: "Petite boîte de Ferrero Rocher",
        content: "Cadeau physique : petite boîte de Ferrero Rocher"
    },

    physical_tshirt: {
        giftKind: "physical",
        game: null,
        physicalTitle: "T-shirt I Love AA",
        content: "Cadeau physique : t-shirt I Love AA"
    },

    physical_day13: {
        giftKind: "physical",
        game: null,
        cardNote: "vide",
        content: ""
    },

    physical_bonbons_chocolats: {
        giftKind: "physical",
        game: null,
        cardNote: "à faire",
        physicalTitle: "Bonbon / chocolats",
        content: "Cadeau physique : bonbon / chocolats"
    },

    physical_bracelet: {
        giftKind: "physical",
        game: null,
        cardNote: "à faire",
        physicalTitle: "Bracelet fait main",
        content: "Cadeau physique : bracelet fait main"
    },

    physical_lettre: {
        giftKind: "physical",
        game: null,
        cardNote: "à faire",
        physicalTitle: "Lettre avec photo de nous deux",
        content: "Cadeau physique : lettre avec photo de nous deux"
    },

    physical_noel_24: {
        giftKind: "physical",
        game: null,
        cardNote: "à faire",
        physicalTitle: "Lettre malo + photo de nous deux avec dedans 3 raison de pourquoi je t'aime (et enfaite y'en a partout dans la carte) + (jbl go 4)",
        content: "Lettre malo + photo de nous deux avec dedans 3 raison de pourquoi je t'aime (et enfaite y'en a partout dans la carte) + (jbl go 4)"
    }
};

/* -------------------------------------------------------------------------
   8. TEXTES D'INTERFACE & CONSTANTES MÉTIER DES MINI-JEUX
   ------------------------------------------------------------------------- */
export const UI_TEXTS = {
    GATE_ERROR: 'Mauvaise réponse, réessaie…',
    LOCKED_DAY_TOAST: (day) => `Patience… ouverture le ${day} décembre`,
    CARD_KICKER_DEFAULT: 'Déc',
    CARD_KICKER_DAY_23: 'Veille de la veille de Noël',
    CARD_KICKER_DAY_24: 'Veille de Noël',
    MODAL_DAY_TITLE: (day) => `${day} Décembre`,
    SECRET_NOTEBOOK_TITLE: 'Carnet secret • Réponses de Clara',
    SECRET_NOTEBOOK_LOADING: 'Récupération des réponses de Clara…',
    SECRET_NOTEBOOK_EMPTY: `
            <div style="padding:12px 0;color:var(--text-secondary);">
                Clara n'a pas encore répondu aux quiz.
                Dès qu'elle cliquera ou écrira une réponse sur son téléphone, tout s'affichera ici !
            </div>
        `,
    FERRET_GAME: {
        HUD_TITLE: 'Ascension de la dune',
        WIN_TITLE: "Bravo ! Trop forte t'as terminé le jeu",
        WIN_DESC: "Merci pour ces vacances au Cap Ferret ❤️",
        WIN_BTN: 'Fermer',
        LOSS_LIVES_BADGE: '3 obstacles percutés 💔',
        LOSS_LIVES_TITLE: 'Aïe, chute dans la dune !',
        LOSS_LIVES_DESC: "Tu t'es pris trop de barrières en bois et d'obstacles pendant la montée !",
        LOSS_TIME_BADGE: 'Trop tard...',
        LOSS_TIME_TITLE: 'Il fait nuit noire',
        LOSS_TIME_DESC: "Le soleil a plongé dans l'océan avant que tu n'atteignes le sommet !",
        RETRY_BTN: "Retenter l'ascension",
        OFF_TRACK_POPUP: 'Sable mou ! Tu es bloquée, reviens sur le chemin !'
    },
    MIDNIGHT_SWIM: {
        INITIAL_HINT: "Va jouer dans l'eau et reviens me voir 😁",
        STARGAZE_HINT: 'touche les étoiles la haut'
    }
};

/* -------------------------------------------------------------------------
   9. GÉNÉRATION DES 24 CASES DU CALENDRIER
   ------------------------------------------------------------------------- */
export const calendarData = Array.from({ length: CALENDAR_CONFIG.TOTAL_DAYS }, (_, i) => {
    const day = i + 1;
    const assignedKey = DAY_ASSIGNMENTS[day];

    if (assignedKey && SURPRISES_CATALOG[assignedKey]) {
        const entry = SURPRISES_CATALOG[assignedKey];
        return {
            day,
            surpriseKey: assignedKey,
            giftKind: entry.giftKind || 'app',
            isEmpty: false,
            ...entry
        };
    }

    return {
        day: day,
        game: null,
        giftKind: 'empty',
        isEmpty: true,
        cardNote: 'vide',
        content: getDefaultDayContent(day)
    };
});
