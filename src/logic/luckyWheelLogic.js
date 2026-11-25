/**
 * ============================================================================
 * LOGIQUE PURE DE LA ROUE DE LA CHANCE (JOUR 9)
 * - Catalogue des 8 cases (4 blanches, 2 vertes, 2 rouges) et leurs lots exacts
 * - Déroulement dirigé des 3 tours (5 lancers au total grâce aux 2 rejouer)
 *   puis hasard cryptographique réel entre les 2 cases rouges au dernier tour
 * - Calcul exact et fluide de la trajectoire d'arrêt sur la case cible
 * ============================================================================
 */

export const POINTER_TOP_ANGLE = -Math.PI / 2;
export const INITIAL_TURNS = 3;
export const SPIN_EASE_POWER = 4.2;

export const WHEEL_SEGMENTS = [
    {
        id: 'green_replay',
        colorType: 'green',
        color: '#1E352B',
        textColor: '#FAF7F2',
        prizeText: "T'as le droit de rejouer",
        consumesTurn: false,
        keepInRecap: false
    },
    {
        id: 'white_respect',
        colorType: 'white',
        color: '#FAF7F2',
        textColor: '#1A211E',
        prizeText: 'Tu gagnes tout mon respect',
        consumesTurn: true,
        keepInRecap: true
    },
    {
        id: 'red_treasure',
        colorType: 'red',
        color: '#9E2A2B',
        textColor: '#FAF7F2',
        prizeText: 'Chasse au trésor maison',
        consumesTurn: true,
        keepInRecap: true
    },
    {
        id: 'white_kiss',
        colorType: 'white',
        color: '#F2EAE0',
        textColor: '#1A211E',
        prizeText: '1 bisous',
        consumesTurn: true,
        keepInRecap: true
    },
    {
        id: 'green_kisses',
        colorType: 'green',
        color: '#1E352B',
        textColor: '#FAF7F2',
        prizeText: 'Attaque de bisous sur demande',
        consumesTurn: true,
        keepInRecap: true
    },
    {
        id: 'white_replay',
        colorType: 'white',
        color: '#FAF7F2',
        textColor: '#1A211E',
        prizeText: "T'as encore le droit de rejouer (je suis vraiment sympa quand même)",
        consumesTurn: false,
        keepInRecap: false
    },
    {
        id: 'red_mystery',
        colorType: 'red',
        color: '#9E2A2B',
        textColor: '#FAF7F2',
        prizeText: "Mystery date (tu choisis la date, je m'occupe du reste)",
        consumesTurn: true,
        keepInRecap: true
    },
    {
        id: 'white_surprise',
        colorType: 'white',
        color: '#F2EAE0',
        textColor: '#1A211E',
        prizeText: 'Surprise',
        consumesTurn: true,
        keepInRecap: true
    }
];

/**
 * Séquence imposée des 4 premiers lancers avant le tirage final véritablement aléatoire (case rouge) :
 * 1. Blanche : « Tu gagnes tout mon respect » -> 3 -> 2 tours
 * 2. Verte   : « T'as le droit de rejouer »  -> reste 2 tours
 * 3. Verte   : « Attaque de bisous sur demande » -> 2 -> 1 tour
 * 4. Blanche : « T'as encore le droit de rejouer (je suis vraiment sympa quand même) » -> reste 1 tour
 * 5. Rouge   : Hasard réel entre « Chasse au trésor maison » et « Mystery date (...) » -> 1 -> 0 tour
 */
export const SCRIPTED_SEQUENCE_IDS = [
    'white_respect',
    'green_replay',
    'green_kisses',
    'white_replay'
];

export const RED_PRIZE_IDS = ['red_treasure', 'red_mystery'];

export function normalizeAngle(angle) {
    const twoPi = Math.PI * 2;
    return ((angle % twoPi) + twoPi) % twoPi;
}

export function getSegmentUnderPointer(wheelAngle, numSegments = WHEEL_SEGMENTS.length) {
    const sliceAngle = (Math.PI * 2) / numSegments;
    const rel = normalizeAngle(POINTER_TOP_ANGLE - wheelAngle);
    return Math.floor(rel / sliceAngle) % numSegments;
}

export function createWheelSessionState() {
    return {
        spinCount: 0,
        turnsRemaining: INITIAL_TURNS,
        wonPrizes: [],
        finished: false
    };
}

/**
 * Résout le prochain lancer de roue à partir de l'état courant.
 * - Retourne `null` si Clara n'a plus de tour disponible.
 * - `randomFloat` (dans [0, 1[) n'est utilisé que pour le tirage final entre les 2 cases rouges.
 */
export function resolveNextSpinOutcome(state, segments = WHEEL_SEGMENTS, randomFloat = 0.5) {
    if (!state || state.finished || state.turnsRemaining <= 0) {
        return null;
    }

    let targetId;
    let isFinalRandomRed = false;

    if (state.spinCount < SCRIPTED_SEQUENCE_IDS.length) {
        targetId = SCRIPTED_SEQUENCE_IDS[state.spinCount];
    } else {
        isFinalRandomRed = true;
        const clampedRand = Math.max(0, Math.min(0.999999, Number.isFinite(randomFloat) ? randomFloat : 0.5));
        const redIdx = Math.floor(clampedRand * RED_PRIZE_IDS.length);
        targetId = RED_PRIZE_IDS[redIdx];
    }

    const segmentIndex = segments.findIndex((seg) => seg.id === targetId);
    if (segmentIndex < 0) {
        return null;
    }

    const segment = segments[segmentIndex];
    const nextTurnsRemaining = segment.consumesTurn
        ? Math.max(0, state.turnsRemaining - 1)
        : state.turnsRemaining;
    const nextSpinCount = state.spinCount + 1;
    const nextFinished = nextTurnsRemaining === 0;
    const nextWonPrizes = segment.keepInRecap
        ? [...state.wonPrizes, segment]
        : [...state.wonPrizes];

    return {
        segmentIndex,
        segment,
        isFinalRandomRed,
        nextState: {
            spinCount: nextSpinCount,
            turnsRemaining: nextTurnsRemaining,
            wonPrizes: nextWonPrizes,
            finished: nextFinished
        }
    };
}

/**
 * Calcule une trajectoire angulaire exacte pour que la roue ralentisse naturellement
 * sur `extraRotations` tours complets et s'arrête exactement dans `targetSegmentIndex`.
 *
 * @param {number} startAngle - Angle actuel de la roue en radians
 * @param {number} targetSegmentIndex - Index du segment cible (0..numSegments-1)
 * @param {number} numSegments - Nombre total de segments
 * @param {number} direction - +1 (sens horaire) ou -1 (sens antihoraire)
 * @param {number} offsetRatio - Position relative dans la case (clampée entre 0.22 et 0.78 pour éviter les bords)
 * @param {number} extraRotations - Nombre de tours complets supplémentaires (défaut 5)
 */
export function computeTargetSpinTrajectory(
    startAngle,
    targetSegmentIndex,
    numSegments = WHEEL_SEGMENTS.length,
    direction = 1,
    offsetRatio = 0.5,
    extraRotations = 5
) {
    const twoPi = Math.PI * 2;
    const sliceAngle = twoPi / numSegments;
    const safeDir = direction < 0 ? -1 : 1;
    const safeOffset = Math.max(0.22, Math.min(0.78, offsetRatio));
    const safeRotations = Math.max(3, Math.round(extraRotations));

    const targetRel = (targetSegmentIndex + safeOffset) * sliceAngle;
    const desiredEndMod = normalizeAngle(POINTER_TOP_ANGLE - targetRel);
    const startMod = normalizeAngle(startAngle);

    let forwardDelta;
    if (safeDir > 0) {
        forwardDelta = normalizeAngle(desiredEndMod - startMod);
        if (forwardDelta < 0.15) forwardDelta += twoPi;
    } else {
        let backwardDist = normalizeAngle(startMod - desiredEndMod);
        if (backwardDist < 0.15) backwardDist += twoPi;
        forwardDelta = -backwardDist;
    }

    const totalDelta = forwardDelta + safeDir * safeRotations * twoPi;
    const endAngle = startAngle + totalDelta;

    return {
        startAngle,
        endAngle,
        totalDelta,
        direction: safeDir
    };
}

/**
 * Échantillonne la position angulaire et la vitesse instantanée le long de la courbe de freinage.
 */
export function sampleSpinCurve(startAngle, totalDelta, progress, durationSec) {
    const t = Math.max(0, Math.min(1, progress));
    const oneMinusT = 1 - t;
    const eased = 1 - Math.pow(oneMinusT, SPIN_EASE_POWER);
    const angle = startAngle + totalDelta * eased;
    const safeDur = Math.max(0.1, durationSec);
    const omega = (SPIN_EASE_POWER * totalDelta / safeDur) * Math.pow(oneMinusT, SPIN_EASE_POWER - 1);
    return { angle, omega, done: t >= 1 };
}

export function formatRemainingTurnsText(turnsRemaining) {
    const safe = Math.max(0, Math.floor(turnsRemaining));
    if (safe === 0) return 'Il te reste 0 tour';
    if (safe === 1) return 'Il te reste 1 tour';
    return `Il te reste ${safe} tours`;
}

export function getRevealKickerText(segment) {
    if (!segment) return '';
    if (segment.colorType === 'red') return 'Case rouge · Grand lot';
    if (segment.colorType === 'green') {
        return segment.consumesTurn ? 'Case verte · Lot gagné' : 'Case verte · Tour offert';
    }
    return segment.consumesTurn ? 'Case blanche' : 'Case blanche · Tour offert';
}

export function getRevealStatusText(segment, turnsRemaining) {
    if (!segment) return '';
    if (turnsRemaining <= 0) {
        return 'Dernier tour joué · Ce grand lot est pour toi';
    }
    if (!segment.consumesTurn) {
        return `Tu ne perds pas de tour · ${formatRemainingTurnsText(turnsRemaining)}`;
    }
    if (segment.id === 'white_respect') {
        return `Ce tour est perdu · ${formatRemainingTurnsText(turnsRemaining)}`;
    }
    return formatRemainingTurnsText(turnsRemaining);
}
