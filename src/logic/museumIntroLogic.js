/**
 * ============================================================================
 * LOGIQUE PURE DE L'ANIMATION D'OUVERTURE — GRANDE GALERIE DE L'ÉVOLUTION
 * ============================================================================
 * - Reprend exactement le rythme, les durées, les courbes d'accélération et
 *   les proportions de marche de l'animation de la montagne (`intro-montagne.js`).
 * - Découplé du DOM pour une exécution fluide à 60 fps et des tests unitaires
 *   déterministes.
 * ============================================================================
 */

import { clamp } from '../utils/helpers.js';

export const MUSEUM_INTRO_CONFIG = {
    TOTAL_DURATION: 7.35,          // Durée totale identique à la montagne
    FADE_IN_END: 0.45,             // Fin du fondu d'entrée (onCovered)
    WALK_START: 0.40,              // Début de marche d'Alexis & Clara
    WALK_END: 3.55,                // Arrêt devant les grandes portes du Muséum
    GLOW_START: 3.75,              // Apparition de la lumière dorée entre les portes
    TREMBLE_START: 4.25,           // Léger frémissement avant ouverture des battants
    SPLIT_START: 4.65,             // Début de l'ouverture des grandes portes
    SPLIT_END: 6.65,               // Fin de glissement des deux battants
    BG_FADE_START: 4.75,           // Effacement progressif de la nef pour révéler le calendrier
    BG_FADE_END: 6.10,             // Laisse passer les clics dès que l'accueil est dégagé
    BLOOM_PEAK: 5.25,              // Pic du halo lumineux chaud
    BLOOM_END: 6.95,               // Fin du halo doré
    DUST_COUNT: 54,                // Particules de poussière dorée dans les rayons
    SUNBEAM_COUNT: 6               // Faisceaux chauds traversant la grande verrière
};

/**
 * Catalogue du cortège d'animaux naturalisés sur 3 plans de profondeur
 * (`far`, `mid`, `fg`) + oiseaux en hauteur.
 * - `nx` : position horizontale normalisée (0 = gauche, 0.5 = axe central, 1 = droite)
 * - `ny` : position verticale relative à l'horizon (`horizonY + ny * floorSpan`)
 *   ou pour les oiseaux (`ny` en fraction directe de la hauteur du ciel/verrière)
 * - `side` : -1 (côté gauche de l'allée) ou 1 (côté droit) pour l'écartement lors de l'ouverture
 * - L'allée centrale au premier plan (0.28..0.72) reste dégagée pour Alexis & Clara.
 */
export const MUSEUM_CARAVAN_SPECIES = [
    // --- OISEAUX EN HAUTEUR SOUS LA VERRIÈRE (plan lointain & intermédiaire) ---
    { id: 'bird_far_1', species: 'bird', depth: 'far', side: -1, nx: 0.22, ny: 0.18, scale: 0.72, facing: 1, phase: 0.3 },
    { id: 'bird_far_2', species: 'bird', depth: 'far', side: 1, nx: 0.76, ny: 0.16, scale: 0.68, facing: -1, phase: 1.8 },
    { id: 'bird_mid_1', species: 'bird', depth: 'mid', side: -1, nx: 0.35, ny: 0.24, scale: 0.90, facing: 1, phase: 2.9 },
    { id: 'bird_mid_2', species: 'bird', depth: 'mid', side: 1, nx: 0.65, ny: 0.22, scale: 0.86, facing: -1, phase: 4.1 },
    { id: 'bird_mid_3', species: 'bird', depth: 'far', side: 1, nx: 0.52, ny: 0.13, scale: 0.60, facing: -1, phase: 5.2 },

    // --- PLAN ARRIÈRE-PLAN (far : vitesse parallaxe douce) ---
    { id: 'giraffe_far_l', species: 'giraffe', depth: 'far', side: -1, nx: 0.19, ny: 0.11, scale: 0.72, facing: 1, phase: 0.4 },
    { id: 'antelope_far_l', species: 'antelope', depth: 'far', side: -1, nx: 0.33, ny: 0.09, scale: 0.60, facing: 1, phase: 1.1 },
    { id: 'giraffe_far_r', species: 'giraffe', depth: 'far', side: 1, nx: 0.81, ny: 0.11, scale: 0.74, facing: -1, phase: 2.2 },
    { id: 'ostrich_far_r', species: 'ostrich', depth: 'far', side: 1, nx: 0.67, ny: 0.10, scale: 0.62, facing: -1, phase: 3.0 },

    // --- PLAN CENTRAL (mid : grand cortège emblématique de la Grande Galerie) ---
    { id: 'buffalo_mid_l', species: 'buffalo', depth: 'mid', side: -1, nx: 0.27, ny: 0.19, scale: 0.66, facing: 1, phase: 4.5 },
    { id: 'zebra_mid_l', species: 'zebra', depth: 'mid', side: -1, nx: 0.33, ny: 0.34, scale: 0.74, facing: 1, phase: 1.9 },
    { id: 'elephant_mid_l', species: 'elephant', depth: 'mid', side: -1, nx: 0.15, ny: 0.40, scale: 0.96, facing: 1, phase: 0.6 },
    { id: 'antelope_mid_r', species: 'antelope', depth: 'mid', side: 1, nx: 0.73, ny: 0.20, scale: 0.68, facing: -1, phase: 3.7 },
    { id: 'lion_mid_r', species: 'lion', depth: 'mid', side: 1, nx: 0.67, ny: 0.33, scale: 0.76, facing: -1, phase: 2.6 },
    { id: 'rhino_mid_r', species: 'rhino', depth: 'mid', side: 1, nx: 0.84, ny: 0.40, scale: 0.90, facing: -1, phase: 1.2 },

    // --- PREMIER PLAN (fg : vitesse parallaxe rapide, encadrant l'allée sans gêner le couple) ---
    { id: 'ostrich_fg_l', species: 'ostrich', depth: 'fg', side: -1, nx: 0.22, ny: 0.62, scale: 0.96, facing: 1, phase: 2.1 },
    { id: 'zebra_fg_l', species: 'zebra', depth: 'fg', side: -1, nx: 0.12, ny: 0.77, scale: 1.06, facing: 1, phase: 0.9 },
    { id: 'antelope_fg_r', species: 'antelope', depth: 'fg', side: 1, nx: 0.78, ny: 0.61, scale: 0.96, facing: -1, phase: 3.2 },
    { id: 'lion_fg_r', species: 'lion', depth: 'fg', side: 1, nx: 0.87, ny: 0.76, scale: 1.06, facing: -1, phase: 1.5 }
];

export function easeOutCubic(t) {
    const p = clamp(t, 0, 1);
    return 1 - Math.pow(1 - p, 3);
}

export function easeInOutCubic(t) {
    const p = clamp(t, 0, 1);
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

export function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/**
 * Calcule de façon déterministe tous les paramètres d'une frame de l'animation Muséum.
 * Reprend strictement les équations de `intro-montagne.js` pour la marche, la perspective,
 * la lueur centrale, le tremblement, la séparation et le halo doré.
 */
export function computeMuseumIntroFrame(elapsed, width, height) {
    const cfg = MUSEUM_INTRO_CONFIG;
    const safeW = Math.max(1, width);
    const safeH = Math.max(1, height);

    const isCovered = elapsed >= cfg.FADE_IN_END;
    const isPassingThrough = elapsed >= cfg.BG_FADE_END;
    const isFinished = elapsed >= cfg.TOTAL_DURATION;

    // 1. Parallaxe multicouche pendant l'avancée dans la galerie
    const approachProgress = easeOutCubic(
        (elapsed - cfg.WALK_START) / (cfg.WALK_END - cfg.WALK_START)
    );
    const bgFade = 1 - smoothstep(cfg.BG_FADE_START, cfg.BG_FADE_END, elapsed);

    const parallax = {
        far: {
            y: -approachProgress * 10,
            scale: 1 + approachProgress * 0.028,
            lateralFactor: approachProgress * 0.015
        },
        mid: {
            y: -approachProgress * 22,
            scale: 1 + approachProgress * 0.056,
            lateralFactor: approachProgress * 0.042
        },
        fg: {
            y: approachProgress * 22,
            scale: 1 + approachProgress * 0.125,
            lateralFactor: approachProgress * 0.095
        }
    };

    // 2. Lueur entre les portes, tremblement & ouverture des deux grands battants
    const glowRise = smoothstep(cfg.GLOW_START, cfg.SPLIT_START + 0.15, elapsed);
    const splitProgress = easeInOutCubic(
        (elapsed - cfg.SPLIT_START) / (cfg.SPLIT_END - cfg.SPLIT_START)
    );

    let tremorX = 0;
    let tremorY = 0;
    if (elapsed >= cfg.TREMBLE_START && elapsed < cfg.SPLIT_START + 0.65) {
        const tremorEnv = elapsed < cfg.SPLIT_START
            ? smoothstep(cfg.TREMBLE_START, cfg.SPLIT_START, elapsed)
            : 1 - smoothstep(cfg.SPLIT_START, cfg.SPLIT_START + 0.65, elapsed);
        tremorX = Math.sin(elapsed * 68) * 3.2 * tremorEnv;
        tremorY = Math.cos(elapsed * 54) * 2.0 * tremorEnv;
    }

    const maxSlidePx = safeW * 0.62;
    const slideOffset = splitProgress * maxSlidePx;
    const doorOpacity = 1 - smoothstep(cfg.SPLIT_END - 0.35, cfg.SPLIT_END + 0.15, elapsed);
    const seamGlowAlpha = glowRise * (1 - smoothstep(cfg.SPLIT_END - 0.5, cfg.SPLIT_END, elapsed));

    const beamFadeOut = 1 - smoothstep(cfg.SPLIT_START + 0.25, cfg.SPLIT_START + 0.95, elapsed);
    const beamScaleY = smoothstep(cfg.GLOW_START, cfg.SPLIT_START, elapsed);
    const beamScaleX = 1 + splitProgress * 12;
    const beamAlpha = glowRise * beamFadeOut;

    // 3. Halo doré central de révélation du calendrier
    let bloomAlpha = 0;
    if (elapsed >= cfg.GLOW_START && elapsed <= cfg.BLOOM_END) {
        if (elapsed <= cfg.BLOOM_PEAK) {
            bloomAlpha = smoothstep(cfg.GLOW_START, cfg.BLOOM_PEAK, elapsed) * 0.88;
        } else {
            bloomAlpha = (1 - smoothstep(cfg.BLOOM_PEAK, cfg.BLOOM_END, elapsed)) * 0.88;
        }
    }
    const bloomScale = 0.65 + smoothstep(cfg.GLOW_START, cfg.BLOOM_END, elapsed) * 0.9;

    // 4. Marche d'Alexis & Clara (EXACTEMENT identique à intro-montagne.js)
    const avatarFadeIn = smoothstep(cfg.WALK_START, cfg.WALK_START + 0.5, elapsed);
    const avatarFadeOut = 1 - smoothstep(cfg.SPLIT_START + 0.35, cfg.SPLIT_START + 1.35, elapsed);
    const avatarAlpha = avatarFadeIn * avatarFadeOut;

    const walkT = clamp(
        (elapsed - cfg.WALK_START) / (cfg.WALK_END - cfg.WALK_START),
        0,
        1
    );
    const walkEase = easeOutCubic(walkT);
    const isWalking = elapsed >= cfg.WALK_START && elapsed < cfg.WALK_END;

    const startY = safeH * 0.94;
    const stopY = safeH * 0.785;
    const stepIntoLight = smoothstep(cfg.SPLIT_START + 0.25, cfg.SPLIT_START + 1.35, elapsed) * 18;
    const coupleY = startY + (stopY - startY) * walkEase - stepIntoLight;

    const baseUnit = clamp(Math.min(safeW, safeH) / 420, 0.85, 1.25);
    const perspScale = baseUnit * (1.28 - 0.34 * walkEase);

    const spacing = 22 * perspScale;
    const centerX = safeW * 0.5;
    const alexisX = centerX - spacing;
    const claraX = centerX + spacing;

    const walkPhase = elapsed * 7.6;
    const hairSway = isWalking
        ? Math.sin(walkPhase) * 2.4
        : Math.sin(elapsed * 2.1) * 1.4;

    // 5. Légère respiration vivante de la lumière de la verrière
    const lightPulse = 0.88 + 0.12 * Math.sin(elapsed * 1.15) * Math.cos(elapsed * 0.53);
    const dustGlobalFade = 1 - smoothstep(cfg.SPLIT_END - 0.6, cfg.TOTAL_DURATION, elapsed);

    return {
        isCovered,
        isPassingThrough,
        isFinished,
        approachProgress,
        bgFade,
        parallax,
        doors: {
            glowRise,
            splitProgress,
            tremorX,
            tremorY,
            slideOffset,
            doorOpacity,
            seamGlowAlpha,
            beamAlpha,
            beamScaleX,
            beamScaleY
        },
        bloom: {
            alpha: bloomAlpha,
            scale: bloomScale
        },
        walk: {
            walkT,
            walkEase,
            isWalking,
            avatarAlpha,
            coupleY,
            perspScale,
            alexisX,
            claraX,
            walkPhase,
            hairSway
        },
        lightPulse,
        dustGlobalFade
    };
}
