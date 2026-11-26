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
 * PLAQUES & PANNEAUX CONSULTABLES LE LONG DE LA COURSIVE (6 AU TOTAL)
 * ----------------------------------------------------------------------------
 * Pour personnaliser ou ajouter une plaque :
 *  - Modifie simplement `title`, `body` (et `scientificNames` si besoin d'italique).
 *  - Tu peux ajuster `loopPosition` (entre 0 et MUSEUM_LOOP_CONFIG.LOOP_LENGTH = 4800).
 * ----------------------------------------------------------------------------
 */
export const MUSEUM_CARTELS = [
    {
        id: 'cartel_01',
        number: '01',
        kind: 'museum',
        loopPosition: 360,
        title: 'Rhinoceros unicornis, un animal à la corne empruntée',
        body:
            "Le rhinocéros qu'on a vu ensemble est un rhinocéros indien mâle. Sa corne d'origine, usée contre les barreaux de sa cage à Versailles, n'avait pas pu pousser normalement.\n\n" +
            "Les taxidermistes (les spécialistes qui préparent et naturalisent les animaux morts pour les exposer) l'ont donc remplacée par la longue corne d'un rhinocéros blanc d'Afrique (Ceratotherium simum), sans le savoir (eh oui, ils étaient un peu cons à l'époque).\n\n" +
            "Cette corne d'une autre espèce est restée en place jusqu'à la restauration de 1992, où on l'a remplacée par un moulage de corne d'Indien, plus petit que celui de l'animal lui-même. Autrement dit, ce que l'on voit aujourd'hui n'est pas non plus la corne qu'il avait de son vivant.",
        scientificNames: ['Rhinoceros unicornis', 'Ceratotherium simum'],
        visualKind: 'panel'
    },
    {
        id: 'cartel_02',
        number: '02',
        kind: 'museum',
        loopPosition: 1160,
        title: 'Architeuthis sanctipauli, Wheke le calmar géant',
        body:
            "Wheke, qui signifie « calmar » en maori, a été pêché en janvier 2000 au large de la Nouvelle-Zélande, à 615 mètres de profondeur.\n\n" +
            "Plutôt que de le conserver dans l'alcool ou le formol comme les autres musées du monde, le Muséum l'a plastiné : l'eau, le formol et l'alcool ont été remplacés par une résine durcissante, au prix de deux ans et demi de travail. Il a fallu reconstituer 300 ventouses abîmées par le formol et fabriquer de faux yeux, seul le bec est d'origine.\n\n" +
            "C'est le premier calmar géant plastiné au monde, alors que les premières images de l'espèce dans son milieu naturel ne datent que de 2004.",
        scientificNames: ['Architeuthis sanctipauli'],
        visualKind: 'lectern'
    },
    {
        id: 'cartel_03',
        number: '03',
        kind: 'museum',
        loopPosition: 1960,
        title: 'Eubalaena australis, un record bien caché',
        body:
            "Cette énorme squellette de baleine franche australe avec ses faons tout aussi gigantesque (j'espère que tu t'en souviens quand même je le prendrai mal sinon).\n\n" +
            "Ce que ses os ne montrent pas, c'est son vrai record : chez les baleines franches, les testicules sont probablement les plus gros de tout le règne animal, avec environ 500 kg par couille (je peux pas rivaliser), soit 1% du poids de la baleine. C'est environ dix fois plus que chez la baleine bleue, pourtant bien plus grande.\n\n" +
            "L'explication la plus probable est la compétition spermatique : une femelle a été observée en train de s'accoupler avec deux mâles simultanément. Ces mâles peuvent produire jusqu'à 4,5 litres de sperme, pour « noyer » celui de leurs rivaux (des vrai zhommes ça).",
        scientificNames: ['Eubalaena australis'],
        visualKind: 'panel'
    },
    {
        id: 'cartel_04',
        number: '04',
        kind: 'museum',
        loopPosition: 2760,
        title: 'La grande allée, 500 mètres de passif-agressif',
        body:
            "Aux deux bouts de la grande allée centrale du Jardin des Plantes (tu sais, là où on a fait 2 allers-retours comme des cons en courant pour trouver l'entrée de la galerie), deux statues sont censées se faire face... sauf que ce n'est pas le cas. Côté Grande Galerie, Buffon, l'ancien patron du lieu, regarde fièrement son jardin. Mais 500 mètres plus loin, côté Seine, le scientifique Jean-Baptiste de Lamarck lui tourne carrément le dos pour regarder la rue.\n\n" +
            "Ce n'est pas une erreur d'installation : de son vivant, Lamarck a été le premier à proposer une vraie théorie de l'évolution, bien avant Darwin, ce qui lui a valu les moqueries et le mépris de ses collègues du Muséum. Il a fini sa vie seul, aveugle et ruiné, complètement rejeté par l'institution.\n\n" +
            "Alors (le pauvre, alors qu'il avait raison ...), quand on a finalement décidé de lui ériger une statue un siècle plus tard, on a glissé une petite vengeance à l'arrière de son socle pile face au parc et aux bâtiments des chercheurs en y gravant cette phrase de sa fille : « La postérité vous admirera, elle vous vengera, mon père. » Un immense « je vous l'avais bien dit » en bronze, posé là pour l'éternité (cheh c'est bien mérité).",
        scientificNames: [],
        visualKind: 'lectern'
    },
    {
        id: 'cartel_05',
        number: '05',
        kind: 'museum',
        loopPosition: 3560,
        title: 'Equus quagga quagga, la naissance de la paléogénétique',
        body:
            "Le quagga est une sorte de zèbre à moitié rayé : l'avant de son corps portait des rayures brunes de zèbre, alors que l'arrière ressemblait plutôt à celui d'un cheval (lui aussi on est censé l'avoir vu mais pour être honnête va falloir y retourner j'en ai aucun souvenir mince alors).\n\n" +
            "Éteint en 1883, il a fourni en 1984 deux fragments d'ADN mitochondrial (229 paires de nucléotides) extraits d'un muscle séché conservé en musée, avec 12 substitutions par rapport au zèbre de montagne, soit une divergence estimée à 3-4 millions d'années. C'est la première analyse d'ADN d'un animal éteint, et elle a lancé le domaine de l'ADN ancien (dcp si t'a suivi c'est la naissance de la paléogénétique).\n\n" +
            "Une étude de 2005 a ensuite montré qu'il s'est séparé très récemment du zèbre des plaines, probablement lors de l'avant-dernier maximum glaciaire. Ses rayures ont donc disparu en un temps géologiquement très court (j'ai sacrément kiffé faire ces petits point culture anecdotiques).",
        scientificNames: ['Equus quagga quagga'],
        visualKind: 'panel'
    },
    {
        id: 'cartel_06',
        number: '06',
        kind: 'museum',
        loopPosition: 4360,
        title: "Mammuthus meridionalis, la crise d'hormones préhistorique",
        body:
            "Ce squelette géant (merci) du mammouth de Durfort (qui a été restauré il y a peu, comme je t'en avais parlé), haut de près de 4 mètres, est la star incontestée de la galerie (mais c'est toi la star de ma vie).\n\n" +
            "Ce que ses os ne montrent pas, c'est que ce grand mâle traversait probablement chaque année le « musth », une période de rut complètement hors de contrôle. Son taux de testostérone pouvait alors être multiplié par vingt, transformant ce colosse de 10 tonnes en boule de nerfs prête à charger n'importe quoi.\n\n" +
            "Pour annoncer la couleur à ses rivaux, il sécrétait un liquide huileux par les tempes tout en urinant en continu sur ses propres pattes arrière : une technique de séduction douteuse (très douteuse, à mon humble avis, on n'en serait pas là si j'avais essayé de t'attirer avec mon pipi en le faisant couler sur mes pieds ... Quoiqueee ?), mais radicale pour dissuader la concurrence (ça c'est certain).",
        scientificNames: ['Mammuthus meridionalis'],
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
