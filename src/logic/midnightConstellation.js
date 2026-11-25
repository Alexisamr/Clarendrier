/**
 * ============================================================================
 * LOGIQUE PURE DE LA CONSTELLATION DU CŒUR (BAIN DE MINUIT)
 * - Calcul paramétrique du cœur et échantillonnage uniforme en longueur d'arc
 * - Détection de toucher / glisser sur les étoiles de la constellation
 * - Courbe progressive étoile par étoile + intensité musicale associée
 * ============================================================================
 */

export const HEART_STAR_COUNT = 12;
export const HEART_MILESTONE_INDICES = [3, 7, 11]; // 4e, 8e et 12e étoile

/**
 * Coordonnées d'un point sur la courbe paramétrique douce du cœur.
 * - theta = 0       -> creux central en haut
 * - theta = Math.PI -> pointe inférieure du cœur
 * - theta dans [Math.PI, 2*Math.PI] -> côté gauche (de bas en haut)
 * - theta dans [0, Math.PI]         -> côté droit (de haut en bas)
 */
export function getSmoothHeartPoint(theta, centerX, centerY, heartScale) {
    const hx = 16 * Math.pow(Math.sin(theta), 3);
    const hy = -(
        13 * Math.cos(theta) -
        5 * Math.cos(2 * theta) -
        2 * Math.cos(3 * theta) -
        Math.cos(4 * theta)
    );
    return {
        x: centerX + hx * heartScale,
        y: centerY + hy * heartScale
    };
}

/**
 * Retourne des angles theta répartis uniformément par longueur d'arc
 * en partant de la pointe basse (theta = Math.PI), en montant par le lobe gauche,
 * en passant par le creux supérieur (theta = 2*Math.PI ≡ 0) puis en redescendant par le lobe droit.
 */
export function computeHeartStarAngles(count = HEART_STAR_COUNT) {
    const sampleSteps = 720;
    const startTheta = Math.PI;
    const endTheta = Math.PI * 3;
    const cumulativeLengths = [0];
    const thetas = [startTheta];

    let prev = getSmoothHeartPoint(startTheta, 0, 0, 1);
    let totalLen = 0;

    for (let i = 1; i <= sampleSteps; i++) {
        const theta = startTheta + (i / sampleSteps) * (endTheta - startTheta);
        const pt = getSmoothHeartPoint(theta, 0, 0, 1);
        totalLen += Math.hypot(pt.x - prev.x, pt.y - prev.y);
        cumulativeLengths.push(totalLen);
        thetas.push(theta);
        prev = pt;
    }

    const result = [];
    for (let k = 0; k < count; k++) {
        const targetDist = (k / count) * totalLen;
        let idx = 0;
        while (idx < cumulativeLengths.length - 1 && cumulativeLengths[idx] < targetDist) {
            idx++;
        }
        if (idx === 0) {
            result.push(thetas[0]);
        } else {
            const d0 = cumulativeLengths[idx - 1];
            const d1 = cumulativeLengths[idx];
            const frac = d1 > d0 ? (targetDist - d0) / (d1 - d0) : 0;
            result.push(thetas[idx - 1] + frac * (thetas[idx] - thetas[idx - 1]));
        }
    }

    return result;
}

export const HEART_STAR_ANGLES = computeHeartStarAngles(HEART_STAR_COUNT);

/**
 * Calcule la géométrie responsive du cœur dans le ciel étoilé agrandi.
 */
export function getHeartLayout(width, horizonY) {
    const heartScale = Math.min(width * 0.019, horizonY * 0.0175);
    return {
        centerX: width * 0.5,
        centerY: horizonY * 0.47,
        heartScale,
        hitRadius: Math.max(50, Math.min(76, Math.min(width, horizonY) * 0.13))
    };
}

/**
 * Calcule les coordonnées écran des 12 étoiles de la constellation du cœur.
 */
export function getHeartStars(centerX, centerY, heartScale, angles = HEART_STAR_ANGLES) {
    return angles.map((theta, index) => {
        const pt = getSmoothHeartPoint(theta, centerX, centerY, heartScale);
        return {
            index,
            theta,
            x: pt.x,
            y: pt.y
        };
    });
}

/**
 * Échantillonne un arc lisse le long de la courbe du cœur entre deux angles thetaStart et thetaEnd.
 */
export function sampleHeartArc(thetaStart, thetaEnd, centerX, centerY, heartScale, segments = 24) {
    const pts = [];
    const count = Math.max(2, segments);
    for (let i = 0; i <= count; i++) {
        const t = i / count;
        const theta = thetaStart + (thetaEnd - thetaStart) * t;
        pts.push(getSmoothHeartPoint(theta, centerX, centerY, heartScale));
    }
    return pts;
}

/**
 * Évalue un toucher ou glisser dans le ciel par rapport à la prochaine étoile à allumer.
 * Retourne si la cible est touchée, si c'est une étape clé (milestone) et si le cœur est complet.
 */
export function evaluateSkyTouch(touchX, touchY, currentIndex, stars, hitRadius) {
    if (!Array.isArray(stars) || stars.length === 0 || currentIndex >= stars.length) {
        return {
            hit: false,
            alreadyComplete: true,
            starIndex: currentIndex,
            targetStar: null,
            isMilestone: false,
            isComplete: true
        };
    }

    const targetStar = stars[currentIndex];
    const dist = Math.hypot(touchX - targetStar.x, touchY - targetStar.y);

    if (dist <= hitRadius) {
        const nextIndex = currentIndex + 1;
        const isComplete = nextIndex >= stars.length;
        const isMilestone = HEART_MILESTONE_INDICES.includes(currentIndex) || isComplete;
        return {
            hit: true,
            alreadyComplete: false,
            starIndex: currentIndex,
            nextIndex,
            targetStar,
            isMilestone,
            isComplete
        };
    }

    return {
        hit: false,
        alreadyComplete: false,
        starIndex: currentIndex,
        nextIndex: currentIndex,
        targetStar,
        isMilestone: false,
        isComplete: false
    };
}

/**
 * Détermine l'état et la progression de la musique romantique selon l'avancement du cœur.
 */
export function getConstellationMusicState(litCount, totalCount = HEART_STAR_COUNT, isComplete = false) {
    const safeTotal = Math.max(1, totalCount);
    const progress = Math.max(0, Math.min(1, litCount / safeTotal));
    const complete = Boolean(isComplete || litCount >= safeTotal);
    return {
        mode: complete ? 'climax' : 'calm',
        progress
    };
}
