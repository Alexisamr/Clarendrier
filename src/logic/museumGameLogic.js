/**
 * ============================================================================
 * LOGIQUE PURE DU JEU — GRANDE GALERIE DE L'ÉVOLUTION (CASE 22)
 * ============================================================================
 * Découplée du DOM et du Canvas pour être rapide, déterministe et testable :
 *  - Boucle circulaire sans couture (wrap positif & négatif, delta le plus court)
 *  - Déplacement fluide de Clara & suivi naturel d'Alexis avec cycle de marche
 *    synchronisé à la distance réelle parcourue
 *  - Détection de proximité des cartels / panneaux à travers la couture 0/L
 *  - Progression mini-carte circulaire & évaluation d'objectif extensible
 * ============================================================================
 */

import {
    MUSEUM_LOOP_CONFIG,
    MUSEUM_CARTELS,
    MUSEUM_OBJECTIVE_CONFIG,
    MUSEUM_LED_CONFIG
} from '../data/museumGameConfig.js';

/**
 * Ramène n'importe quelle position monde dans l'intervalle [0, loopLength).
 */
export function wrapLoopPosition(position, loopLength = MUSEUM_LOOP_CONFIG.LOOP_LENGTH) {
    if (loopLength <= 0) return 0;
    const mod = position % loopLength;
    return mod < 0 ? mod + loopLength : mod;
}

/**
 * Calcule le plus court écart signé sur la boucle circulaire :
 * résultat dans (-loopLength / 2, +loopLength / 2].
 */
export function shortestLoopDelta(fromPos, toPos, loopLength = MUSEUM_LOOP_CONFIG.LOOP_LENGTH) {
    if (loopLength <= 0) return 0;
    const a = wrapLoopPosition(fromPos, loopLength);
    const b = wrapLoopPosition(toPos, loopLength);
    let delta = b - a;
    const half = loopLength * 0.5;
    if (delta > half) delta -= loopLength;
    if (delta <= -half) delta += loopLength;
    return delta;
}

/**
 * Retourne la progression normalisée [0, 1), l'angle en radians et l'aile actuelle
 * pour la mini-carte circulaire du musée.
 */
export function getLoopProgress(
    position,
    loopLength = MUSEUM_LOOP_CONFIG.LOOP_LENGTH,
    wings = MUSEUM_LOOP_CONFIG.WINGS
) {
    const wrapped = wrapLoopPosition(position, loopLength);
    const normalized = loopLength > 0 ? wrapped / loopLength : 0;
    const angleRad = normalized * Math.PI * 2;
    const percent = Math.round(normalized * 100);

    let wing = wings[0] || { id: 'north', label: 'Aile Nord' };
    for (let i = 0; i < wings.length; i++) {
        if (normalized >= wings[i].startNorm && normalized < wings[i].endNorm) {
            wing = wings[i];
            break;
        }
    }

    return {
        wrapped,
        normalized,
        angleRad,
        percent,
        wingId: wing.id,
        wingLabel: wing.label
    };
}

/**
 * Crée l'état initial du jeu.
 */
export function createMuseumGameState(config = MUSEUM_LOOP_CONFIG) {
    const startPos = wrapLoopPosition(config.START_POSITION || 0, config.LOOP_LENGTH);
    const companionPos = wrapLoopPosition(
        startPos - (config.COMPANION_FOLLOW_OFFSET || 34),
        config.LOOP_LENGTH
    );

    return {
        // Position continue (utile pour parallaxe sans saut) & position bouclée [0, L)
        totalDistanceSigned: startPos,
        playerPos: startPos,
        velocity: 0,
        facing: 1, // 1 = droite, -1 = gauche
        walkCycle: 0,
        isWalking: false,

        // Alexis marche avec Clara (léger décalage naturel qui s'adapte au sens de marche)
        companionPos,
        companionFacing: 1,
        companionWalkCycle: 0.85,
        companionIsWalking: false,

        // Progression sur la boucle & cartels consultés
        lapsCompleted: 0,
        visitedCartelIds: [],
        activeCartelId: null,
        objectiveCompleted: false
    };
}

/**
 * Fait avancer la simulation d'un pas de temps `dt` (borné à 0.05s max).
 * `moveDir` ∈ [-1, 1] (ex: -1 gauche, 0 arrêt, +1 droite).
 */
export function stepMuseumPlayer(state, moveDir, rawDt, config = MUSEUM_LOOP_CONFIG) {
    const dt = Math.min(Math.max(rawDt || 0, 0), 0.05);
    const loopLength = config.LOOP_LENGTH;
    const maxSpeed = config.WALK_SPEED;
    const clampedDir = Math.max(-1, Math.min(1, moveDir || 0));

    // Accélération / décélération douce pour un rendu organique
    const targetVel = clampedDir * maxSpeed;
    const accelRate = Math.abs(targetVel) > 1 ? 11.5 : 14.0;
    const blend = 1 - Math.exp(-accelRate * dt);
    const nextVelocity = state.velocity + (targetVel - state.velocity) * blend;
    const effectiveVel = Math.abs(nextVelocity) < 3.5 && Math.abs(targetVel) < 1 ? 0 : nextVelocity;

    const dx = effectiveVel * dt;
    const nextTotalSigned = state.totalDistanceSigned + dx;
    const nextPlayerPos = wrapLoopPosition(nextTotalSigned, loopLength);
    const nextFacing = clampedDir > 0.08 ? 1 : (clampedDir < -0.08 ? -1 : state.facing);
    const isWalking = Math.abs(effectiveVel) > 10;

    // Cycle de marche strictement synchronisé à la distance parcourue (aucun patinage)
    const strideRadPerPx = 0.048;
    const nextWalkCycle = isWalking
        ? state.walkCycle + Math.abs(dx) * strideRadPerPx
        : state.walkCycle + dt * 1.1;

    // Compteur de tours complets réalisés dans un sens ou dans l'autre
    const prevLapBucket = Math.floor(Math.abs(state.totalDistanceSigned) / loopLength);
    const nextLapBucket = Math.floor(Math.abs(nextTotalSigned) / loopLength);
    const lapsCompleted = Math.max(state.lapsCompleted, nextLapBucket, prevLapBucket);

    // Suivi naturel d'Alexis juste derrière / à côté de Clara
    const followOffset = config.COMPANION_FOLLOW_OFFSET || 34;
    const desiredCompanionPos = wrapLoopPosition(nextPlayerPos - nextFacing * followOffset, loopLength);
    const compDelta = shortestLoopDelta(state.companionPos, desiredCompanionPos, loopLength);
    const compStep = compDelta * (1 - Math.exp(-6.8 * dt));
    const nextCompanionPos = wrapLoopPosition(state.companionPos + compStep, loopLength);
    const compSpeed = dt > 0 ? Math.abs(compStep) / dt : 0;
    const companionIsWalking = compSpeed > 12;
    const companionFacing = Math.abs(compDelta) > 4 ? (compDelta > 0 ? 1 : -1) : nextFacing;
    const nextCompanionWalkCycle = companionIsWalking
        ? state.companionWalkCycle + Math.abs(compStep) * strideRadPerPx
        : state.companionWalkCycle + dt * 1.0;

    return {
        ...state,
        totalDistanceSigned: nextTotalSigned,
        playerPos: nextPlayerPos,
        velocity: effectiveVel,
        facing: nextFacing,
        walkCycle: nextWalkCycle,
        isWalking,
        companionPos: nextCompanionPos,
        companionFacing,
        companionWalkCycle: nextCompanionWalkCycle,
        companionIsWalking,
        lapsCompleted
    };
}

/**
 * Trouve le cartel / panneau le plus proche du joueur dans le rayon d'interaction.
 */
export function findNearestCartel(
    playerPos,
    cartels = MUSEUM_CARTELS,
    loopLength = MUSEUM_LOOP_CONFIG.LOOP_LENGTH,
    interactRadius = MUSEUM_LOOP_CONFIG.INTERACT_RADIUS
) {
    let best = null;
    let bestAbsDist = Infinity;

    for (let i = 0; i < cartels.length; i++) {
        const cartel = cartels[i];
        const delta = shortestLoopDelta(playerPos, cartel.loopPosition, loopLength);
        const absDist = Math.abs(delta);
        if (absDist <= interactRadius && absDist < bestAbsDist) {
            best = {
                cartel,
                delta,
                distance: absDist
            };
            bestAbsDist = absDist;
        }
    }

    return best;
}

/**
 * Enregistre la consultation d'un cartel (idempotent, retourne un nouvel array).
 */
export function markCartelVisited(visitedCartelIds, cartelId) {
    if (!cartelId) return visitedCartelIds;
    if (visitedCartelIds.includes(cartelId)) return visitedCartelIds;
    return [...visitedCartelIds, cartelId];
}

/**
 * Évalue la progression & l'état d'objectif futur (extensible sans casser le jeu libre).
 */
export function evaluateMuseumObjective(
    visitedCartelIds,
    lapsCompleted,
    cartels = MUSEUM_CARTELS,
    objectiveConfig = MUSEUM_OBJECTIVE_CONFIG
) {
    const totalCount = cartels.length;
    const visitedSet = new Set(visitedCartelIds);
    const visitedCount = cartels.filter((c) => visitedSet.has(c.id)).length;
    const progressRatio = totalCount > 0 ? visitedCount / totalCount : 0;

    let isComplete = false;
    if (objectiveConfig && objectiveConfig.enabled) {
        if (objectiveConfig.mode === 'visit_all_cartels') {
            const required = objectiveConfig.requiredCartelIds && objectiveConfig.requiredCartelIds.length > 0
                ? objectiveConfig.requiredCartelIds
                : cartels.map((c) => c.id);
            isComplete = required.every((id) => visitedSet.has(id));
        } else if (objectiveConfig.mode === 'complete_loop') {
            isComplete = lapsCompleted >= (objectiveConfig.requiredLaps || 1);
        }
    }

    return {
        visitedCount,
        totalCount,
        progressRatio,
        lapsCompleted,
        isComplete
    };
}

/**
 * Calcule la couleur RGB courante des grandes rampes LED arc-en-ciel du plafond.
 * Maintient chaque teinte pendant `HOLD_SECONDS` (15-20s) puis effectue un fondu
 * cosinusoïdal parfaitement fluide pendant `TRANSITION_SECONDS` vers la suivante.
 */
export function sampleMuseumLedColor(elapsedSeconds, ledConfig = MUSEUM_LED_CONFIG) {
    const colors = ledConfig && Array.isArray(ledConfig.COLORS) && ledConfig.COLORS.length > 0
        ? ledConfig.COLORS
        : MUSEUM_LED_CONFIG.COLORS;
    const holdSec = Math.max(0.1, ledConfig?.HOLD_SECONDS ?? MUSEUM_LED_CONFIG.HOLD_SECONDS);
    const transitionSec = Math.max(0.1, ledConfig?.TRANSITION_SECONDS ?? MUSEUM_LED_CONFIG.TRANSITION_SECONDS);
    const stepDuration = holdSec + transitionSec;
    const totalCycle = stepDuration * colors.length;

    const wrappedTime = wrapLoopPosition(Math.max(0, elapsedSeconds || 0), totalCycle);
    const colorIndex = Math.floor(wrappedTime / stepDuration) % colors.length;
    const nextColorIndex = (colorIndex + 1) % colors.length;
    const localTime = wrappedTime - colorIndex * stepDuration;

    let blend = 0;
    let isTransitioning = false;
    if (localTime > holdSec) {
        const rawT = Math.min(1, Math.max(0, (localTime - holdSec) / transitionSec));
        blend = 0.5 - 0.5 * Math.cos(Math.PI * rawT);
        isTransitioning = true;
    }

    const fromRgb = colors[colorIndex].rgb;
    const toRgb = colors[nextColorIndex].rgb;
    const r = Math.round(fromRgb[0] + (toRgb[0] - fromRgb[0]) * blend);
    const g = Math.round(fromRgb[1] + (toRgb[1] - fromRgb[1]) * blend);
    const b = Math.round(fromRgb[2] + (toRgb[2] - fromRgb[2]) * blend);

    return {
        r,
        g,
        b,
        rgb: `rgb(${r}, ${g}, ${b})`,
        colorId: colors[colorIndex].id,
        colorIndex,
        nextColorIndex,
        blend,
        isTransitioning
    };
}
