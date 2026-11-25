/**
 * ============================================================================
 * CONFIGURATION DU JEU — GRANDE GALERIE DE L'ÉVOLUTION (CASE 22)
 * ============================================================================
 * Fichier dédié et facile à modifier :
 *  - MUSEUM_LOOP_CONFIG      : dimensions de la boucle circulaire, vitesses, ailes
 *  - MUSEUM_CARTELS          : emplacements des panneaux / cartels consultables
 *                              (remplace simplement les titres et textes ici !)
 *  - MUSEUM_OBJECTIVE_CONFIG : structure prête pour définir un objectif & une fin
 * ============================================================================
 */

export const MUSEUM_LOOP_CONFIG = {
    /** Circonférence totale de la coursive en pixels monde (boucle complète 360°) */
    LOOP_LENGTH: 4800,

    /** Position de départ sur la boucle (en pixels monde) */
    START_POSITION: 0,

    /** Vitesse de marche horizontale de Clara & Alexis (px/s) */
    WALK_SPEED: 240,

    /** Distance de proximité (px monde) pour pouvoir consulter un cartel */
    INTERACT_RADIUS: 96,

    /** Distance à laquelle Alexis marche naturellement à côté / légèrement derrière Clara */
    COMPANION_FOLLOW_OFFSET: 34,

    /** Découpage des 4 grandes zones de la galerie autour de la nef centrale */
    WINGS: [
        { id: 'north', label: 'Aile Nord', startNorm: 0.0, endNorm: 0.25 },
        { id: 'east', label: 'Rotonde Est', startNorm: 0.25, endNorm: 0.5 },
        { id: 'south', label: 'Aile Sud', startNorm: 0.5, endNorm: 0.75 },
        { id: 'west', label: 'Rotonde Ouest', startNorm: 0.75, endNorm: 1.0 }
    ]
};

/**
 * ----------------------------------------------------------------------------
 * CARTELS & PANNEAUX CONSULTABLES LE LONG DE LA COURSIVE
 * ----------------------------------------------------------------------------
 * Pour personnaliser le contenu plus tard :
 *  - Modifie `title`, `subtitle`, `category` et `body` de chaque emplacement.
 *  - Tu peux aussi ajouter ou déplacer un cartel en ajustant `loopPosition`
 *    (entre 0 et MUSEUM_LOOP_CONFIG.LOOP_LENGTH = 4800).
 * ----------------------------------------------------------------------------
 */
export const MUSEUM_CARTELS = [
    {
        id: 'cartel_01',
        number: '01',
        loopPosition: 340,
        wing: 'Aile Nord',
        category: 'Emplacement temporaire',
        title: 'Cartel n°1 — À compléter',
        subtitle: 'Entrée de la Grande Galerie',
        body: 'Texte temporaire pour ce premier cartel de la coursive. Tu pourras facilement remplacer ce contenu par un souvenir, une anecdote ou un indice dans src/data/museumGameConfig.js.',
        visualKind: 'panel'
    },
    {
        id: 'cartel_02',
        number: '02',
        loopPosition: 920,
        wing: 'Aile Nord',
        category: 'Emplacement temporaire',
        title: 'Cartel n°2 — À compléter',
        subtitle: 'Vue sur la caravane de la savane',
        body: 'Texte temporaire pour le panneau n°2. Cet emplacement surplombe le début du grand cortège d\'animaux naturalisés au centre de la nef.',
        visualKind: 'lectern'
    },
    {
        id: 'cartel_03',
        number: '03',
        loopPosition: 1520,
        wing: 'Rotonde Est',
        category: 'Emplacement temporaire',
        title: 'Cartel n°3 — À compléter',
        subtitle: 'Sous les grandes arches de fer',
        body: 'Texte temporaire pour le panneau n°3. Cet emplacement est prêt à accueillir le texte définitif de ton choix.',
        visualKind: 'panel'
    },
    {
        id: 'cartel_04',
        number: '04',
        loopPosition: 2120,
        wing: 'Rotonde Est',
        category: 'Emplacement temporaire',
        title: 'Cartel n°4 — À compléter',
        subtitle: 'Balcon de la lumière dorée',
        body: 'Texte temporaire pour le panneau n°4. Tu pourras y glisser un petit mot, une question ou un souvenir de votre premier rendez-vous.',
        visualKind: 'lectern'
    },
    {
        id: 'cartel_05',
        number: '05',
        loopPosition: 2740,
        wing: 'Aile Sud',
        category: 'Emplacement temporaire',
        title: 'Cartel n°5 — À compléter',
        subtitle: 'Au cœur de la grande nef',
        body: 'Texte temporaire pour le panneau n°5. Facile à éditer directement depuis le fichier de configuration du musée.',
        visualKind: 'panel'
    },
    {
        id: 'cartel_06',
        number: '06',
        loopPosition: 3340,
        wing: 'Aile Sud',
        category: 'Emplacement temporaire',
        title: 'Cartel n°6 — À compléter',
        subtitle: 'Galerie des espèces disparues',
        body: 'Texte temporaire pour le panneau n°6. Prêt à recevoir son futur texte ou indice.',
        visualKind: 'lectern'
    },
    {
        id: 'cartel_07',
        number: '07',
        loopPosition: 3940,
        wing: 'Rotonde Ouest',
        category: 'Emplacement temporaire',
        title: 'Cartel n°7 — À compléter',
        subtitle: 'Sous la verrière du XIXe siècle',
        body: 'Texte temporaire pour le panneau n°7. Situé dans le dernier virage avant de boucler le tour de la galerie.',
        visualKind: 'panel'
    },
    {
        id: 'cartel_08',
        number: '08',
        loopPosition: 4460,
        wing: 'Rotonde Ouest',
        category: 'Emplacement temporaire',
        title: 'Cartel n°8 — À compléter',
        subtitle: 'Retour vers le point de départ',
        body: 'Texte temporaire pour le panneau n°8. Juste avant de revenir au point de départ de la boucle autour du hall central.',
        visualKind: 'lectern'
    }
];

/**
 * ----------------------------------------------------------------------------
 * STRUCTURE PRÊTE POUR L'OBJECTIF & LA FIN DU JEU (ÉTAPE SUIVANTE)
 * ----------------------------------------------------------------------------
 * Pour activer une condition de fin plus tard, passe `enabled: true` et choisis
 * le mode voulu (`visit_all_cartels`, `complete_loop`, etc.).
 * ----------------------------------------------------------------------------
 */
export const MUSEUM_OBJECTIVE_CONFIG = {
    enabled: false,
    mode: 'free_exploration', // 'free_exploration' | 'visit_all_cartels' | 'complete_loop'
    requiredCartelIds: MUSEUM_CARTELS.map((c) => c.id),
    requiredLaps: 1,
    completionBadge: 'Grande Galerie de l\'Évolution',
    completionTitle: 'Fin de la visite',
    completionMessage: 'Texte de fin temporaire à personnaliser ensemble plus tard.',
    completionButtonLabel: 'Continuer la promenade'
};

/**
 * ----------------------------------------------------------------------------
 * ÉCLAIRAGE LED ARC-EN-CIEL DU PLAFOND (SCÉNOGRAPHIE GRANDE GALERIE)
 * ----------------------------------------------------------------------------
 * Conserve la dominante dorée chaleureuse du musée tout en ajoutant de grandes
 * rampes LED architecturales sous la verrière qui changent doucement de teinte
 * en fondu continu (17 s de maintien par couleur + 4,5 s de transition fondue).
 * ----------------------------------------------------------------------------
 */
export const MUSEUM_LED_CONFIG = {
    /** Durée pendant laquelle chaque couleur reste stable (entre 15 et 20 secondes) */
    HOLD_SECONDS: 17,

    /** Durée du fondu enchaîné parfait vers la couleur suivante (secondes) */
    TRANSITION_SECONDS: 4.5,

    /** Palette arc-en-ciel inspirée de la scénographie lumineuse du Muséum [R, G, B] */
    COLORS: [
        { id: 'violet', label: 'Violet', rgb: [154, 92, 246] },
        { id: 'blue', label: 'Bleu', rgb: [66, 152, 255] },
        { id: 'turquoise', label: 'Turquoise', rgb: [44, 212, 204] },
        { id: 'emerald', label: 'Émeraude', rgb: [72, 206, 128] },
        { id: 'amber', label: 'Ambre', rgb: [255, 186, 68] },
        { id: 'coral', label: 'Corail', rgb: [244, 98, 112] },
        { id: 'magenta', label: 'Magenta', rgb: [232, 96, 206] }
    ]
};

/**
 * ----------------------------------------------------------------------------
 * ANIMAUX NATURALISÉS DU GRAND HALL CENTRAL (BOUCLE PARALLAXE)
 * ----------------------------------------------------------------------------
 * 38 spécimens répartis sur 2 plans de profondeur ('far' et 'mid') tout autour
 * de la boucle : aucune espèce identique n'est placée juste à côté d'une autre
 * (ni sur un même plan, ni en voisinage direct entre les deux plans).
 * ----------------------------------------------------------------------------
 */
export const MUSEUM_HALL_CARAVAN = [
    // Plan central lointain (parallaxe 0.44) — 19 spécimens
    { id: 'hall_far_01', kind: 'elephant', plane: 'far', loopNorm: 0.034, facing: 1, scale: 0.78 },
    { id: 'hall_far_02', kind: 'zebra', plane: 'far', loopNorm: 0.086, facing: 1, scale: 0.74 },
    { id: 'hall_far_03', kind: 'rhino', plane: 'far', loopNorm: 0.138, facing: 1, scale: 0.76 },
    { id: 'hall_far_04', kind: 'buffalo', plane: 'far', loopNorm: 0.190, facing: 1, scale: 0.76 },
    { id: 'hall_far_05', kind: 'giraffe', plane: 'far', loopNorm: 0.242, facing: 1, scale: 0.74 },
    { id: 'hall_far_06', kind: 'lion', plane: 'far', loopNorm: 0.294, facing: -1, scale: 0.74 },
    { id: 'hall_far_07', kind: 'antelope', plane: 'far', loopNorm: 0.346, facing: 1, scale: 0.74 },
    { id: 'hall_far_08', kind: 'ostrich', plane: 'far', loopNorm: 0.398, facing: 1, scale: 0.75 },
    { id: 'hall_far_09', kind: 'zebra', plane: 'far', loopNorm: 0.450, facing: -1, scale: 0.74 },
    { id: 'hall_far_10', kind: 'rhino', plane: 'far', loopNorm: 0.502, facing: 1, scale: 0.77 },
    { id: 'hall_far_11', kind: 'ostrich', plane: 'far', loopNorm: 0.554, facing: 1, scale: 0.75 },
    { id: 'hall_far_12', kind: 'buffalo', plane: 'far', loopNorm: 0.606, facing: -1, scale: 0.77 },
    { id: 'hall_far_13', kind: 'giraffe', plane: 'far', loopNorm: 0.658, facing: 1, scale: 0.73 },
    { id: 'hall_far_14', kind: 'elephant', plane: 'far', loopNorm: 0.710, facing: -1, scale: 0.77 },
    { id: 'hall_far_15', kind: 'lion', plane: 'far', loopNorm: 0.762, facing: 1, scale: 0.75 },
    { id: 'hall_far_16', kind: 'antelope', plane: 'far', loopNorm: 0.814, facing: 1, scale: 0.74 },
    { id: 'hall_far_17', kind: 'zebra', plane: 'far', loopNorm: 0.866, facing: 1, scale: 0.74 },
    { id: 'hall_far_18', kind: 'rhino', plane: 'far', loopNorm: 0.918, facing: -1, scale: 0.76 },
    { id: 'hall_far_19', kind: 'ostrich', plane: 'far', loopNorm: 0.970, facing: 1, scale: 0.75 },

    // Plan central avant de la nef (parallaxe 0.58) — 19 spécimens
    { id: 'hall_mid_01', kind: 'giraffe', plane: 'mid', loopNorm: 0.008, facing: 1, scale: 0.95 },
    { id: 'hall_mid_02', kind: 'lion', plane: 'mid', loopNorm: 0.060, facing: 1, scale: 0.96 },
    { id: 'hall_mid_03', kind: 'antelope', plane: 'mid', loopNorm: 0.112, facing: 1, scale: 0.94 },
    { id: 'hall_mid_04', kind: 'ostrich', plane: 'mid', loopNorm: 0.164, facing: 1, scale: 0.96 },
    { id: 'hall_mid_05', kind: 'elephant', plane: 'mid', loopNorm: 0.216, facing: 1, scale: 1.02 },
    { id: 'hall_mid_06', kind: 'zebra', plane: 'mid', loopNorm: 0.268, facing: 1, scale: 0.96 },
    { id: 'hall_mid_07', kind: 'rhino', plane: 'mid', loopNorm: 0.320, facing: 1, scale: 0.98 },
    { id: 'hall_mid_08', kind: 'buffalo', plane: 'mid', loopNorm: 0.372, facing: 1, scale: 0.96 },
    { id: 'hall_mid_09', kind: 'giraffe', plane: 'mid', loopNorm: 0.424, facing: -1, scale: 0.94 },
    { id: 'hall_mid_10', kind: 'elephant', plane: 'mid', loopNorm: 0.476, facing: 1, scale: 1.00 },
    { id: 'hall_mid_11', kind: 'lion', plane: 'mid', loopNorm: 0.528, facing: -1, scale: 0.96 },
    { id: 'hall_mid_12', kind: 'antelope', plane: 'mid', loopNorm: 0.580, facing: 1, scale: 0.94 },
    { id: 'hall_mid_13', kind: 'zebra', plane: 'mid', loopNorm: 0.632, facing: 1, scale: 0.96 },
    { id: 'hall_mid_14', kind: 'rhino', plane: 'mid', loopNorm: 0.684, facing: 1, scale: 0.98 },
    { id: 'hall_mid_15', kind: 'ostrich', plane: 'mid', loopNorm: 0.736, facing: -1, scale: 0.95 },
    { id: 'hall_mid_16', kind: 'buffalo', plane: 'mid', loopNorm: 0.788, facing: 1, scale: 0.97 },
    { id: 'hall_mid_17', kind: 'elephant', plane: 'mid', loopNorm: 0.840, facing: 1, scale: 1.01 },
    { id: 'hall_mid_18', kind: 'giraffe', plane: 'mid', loopNorm: 0.892, facing: 1, scale: 0.95 },
    { id: 'hall_mid_19', kind: 'lion', plane: 'mid', loopNorm: 0.944, facing: 1, scale: 0.96 }
];
