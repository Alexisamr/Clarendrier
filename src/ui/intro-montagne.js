/**
 * ============================================================================
 * ANIMATION D'OUVERTURE MONTAGNE (ENTRE LA PAGE QUESTION ET L'ACCUEIL)
 * ============================================================================
 * Scène (~7.4s max) :
 *   1. Ciel de nuit étoilé, silhouettes de montagnes en parallaxe, flocons doux
 *      et grande montagne enneigée occupant tout l'écran.
 *   2. Avatars d'Alexis et Clara (exactement ceux du jour 8, habillés :
 *      Clara en t-shirt jaune + pantalon blanc, Alexis habillé) marchant côte à côte.
 *   3. Arrêt devant la montagne, fissure de lumière dorée au centre, tremblement,
 *      éclats de neige et séparation en deux moitiés vers la gauche et la droite.
 *   4. Révélation directe du vrai calendrier d'accueil derrière dans la lumière,
 *      puis retrait complet de l'élément du DOM.
 * ============================================================================
 */

import { clamp } from '../utils/helpers.js';
import { drawIntroAlexis, drawIntroClara } from './intro-avatars.js';

/* -------------------------------------------------------------------------
   TIMELINE & PARAMÈTRES FACILES À AJUSTER (en secondes)
   ------------------------------------------------------------------------- */
const INTRO_CONFIG = {
    TOTAL_DURATION: 7.35,          // Durée totale (< 8s)
    FADE_IN_END: 0.45,             // Fin du fondu d'entrée (on déverrouille le gate derrière)
    WALK_START: 0.40,              // Début d'apparition / marche d'Alexis & Clara
    WALK_END: 3.55,                // Arrêt devant le pied de la montagne
    GLOW_START: 3.75,              // Apparition de la lumière dorée au centre
    TREMBLE_START: 4.25,           // Léger tremblement avant séparation
    SPLIT_START: 4.65,             // Début de l'ouverture de la montagne en deux
    SPLIT_END: 6.65,               // Fin de glissement des deux moitiés
    SKY_FADE_START: 4.75,          // Effacement progressif du ciel pour révéler le vrai accueil
    SKY_FADE_END: 6.10,
    BLOOM_PEAK: 5.25,              // Pic de la lumière dorée lors de la révélation
    BLOOM_END: 6.95,
    STAR_COUNT: 115,
    SNOWFLAKE_COUNT: 42
};

const STAR_PALETTE = ['#FFFFFF', '#FFF8E7', '#CFE8FF', '#FFE6B8', '#E8D5B5'];

// Tracé de la fissure centrale en coordonnées SVG (viewBox 0 0 1000 1000)
const CRACK_POINTS = [
    [500, 128],
    [495, 220],
    [507, 330],
    [492, 455],
    [506, 585],
    [494, 725],
    [505, 860],
    [498, 1000]
];

let activeIntroCleanup = null;

function easeOutCubic(t) {
    const p = clamp(t, 0, 1);
    return 1 - Math.pow(1 - p, 3);
}

function easeInOutCubic(t) {
    const p = clamp(t, 0, 1);
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
}

function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / Math.max(0.0001, edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
}

/* -------------------------------------------------------------------------
   GÉNÉRATION DES SVG (MONTAGNES PARALLAXE + GRANDE MONTAGNE FENDUE EN DEUX)
   ------------------------------------------------------------------------- */
function buildParallaxFarSvg() {
    return `
        <svg class="intro-parallax-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
                <linearGradient id="introFarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#223A5C" stop-opacity="0.88"/>
                    <stop offset="100%" stop-color="#0E1D34" stop-opacity="0.96"/>
                </linearGradient>
            </defs>
            <path d="M -40 1000 L -40 520 L 95 365 L 220 448 L 365 315 L 495 400 L 635 305 L 780 420 L 910 345 L 1040 465 L 1040 1000 Z" fill="url(#introFarGrad)"/>
            <!-- Reflets neigeux lointains -->
            <path d="M 95 365 L 145 408 L 118 416 L 82 396 Z" fill="#C9DCF0" opacity="0.22"/>
            <path d="M 365 315 L 415 362 L 380 370 L 348 348 Z" fill="#C9DCF0" opacity="0.22"/>
            <path d="M 635 305 L 690 358 L 652 365 L 615 340 Z" fill="#C9DCF0" opacity="0.24"/>
            <path d="M 910 345 L 958 395 L 925 402 L 892 380 Z" fill="#C9DCF0" opacity="0.2"/>
        </svg>
    `;
}

function buildParallaxMidSvg() {
    return `
        <svg class="intro-parallax-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
                <linearGradient id="introMidGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#172A44"/>
                    <stop offset="100%" stop-color="#0B1628"/>
                </linearGradient>
            </defs>
            <path d="M -40 1000 L -40 595 L 145 425 L 295 520 L 460 440 L 580 505 L 760 405 L 920 515 L 1040 455 L 1040 1000 Z" fill="url(#introMidGrad)"/>
            <path d="M 145 425 L 210 482 L 166 492 L 130 468 Z" fill="#DCE9F6" opacity="0.26"/>
            <path d="M 760 405 L 828 468 L 784 476 L 742 448 Z" fill="#DCE9F6" opacity="0.28"/>
        </svg>
    `;
}

function buildCrackPolyline(offsetX = 0) {
    return CRACK_POINTS.map(([x, y]) => `${x + offsetX},${y}`).join(' ');
}

function buildMainMountainHalfSvg(side) {
    const isLeft = side === 'left';
    const clipId = isLeft ? 'intro-clip-mountain-left' : 'intro-clip-mountain-right';
    const seamOffset = isLeft ? 1.8 : 0; // Léger recouvrement pour éviter toute ligne parasite fermée
    const crackPathPoints = CRACK_POINTS.map(([x, y]) => `L ${x + seamOffset} ${y}`).join(' ');
    const clipPathD = isLeft
        ? `M -20 -20 L ${500 + seamOffset} -20 ${crackPathPoints} L -20 1020 Z`
        : `M 500 -20 L 1020 -20 L 1020 1020 L 498 1020 ${[...CRACK_POINTS].reverse().map(([x, y]) => `L ${x} ${y}`).join(' ')} Z`;

    return `
        <svg class="intro-mountain-svg" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
            <defs>
                <clipPath id="${clipId}">
                    <path d="${clipPathD}" />
                </clipPath>

                <linearGradient id="introRockLeft-${side}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#1D334C"/>
                    <stop offset="55%" stop-color="#132338"/>
                    <stop offset="100%" stop-color="#0B1626"/>
                </linearGradient>

                <linearGradient id="introRockRight-${side}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#2D4A68"/>
                    <stop offset="55%" stop-color="#1B3048"/>
                    <stop offset="100%" stop-color="#102034"/>
                </linearGradient>

                <linearGradient id="introSnowLight-${side}" x1="0" y1="0" x2="0.4" y2="1">
                    <stop offset="0%" stop-color="#FFFFFF"/>
                    <stop offset="55%" stop-color="#E7F0F9"/>
                    <stop offset="100%" stop-color="#C3D7EC"/>
                </linearGradient>

                <linearGradient id="introSnowShade-${side}" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#D7E5F3"/>
                    <stop offset="100%" stop-color="#9BB6D3"/>
                </linearGradient>

                <linearGradient id="introValleySnow-${side}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#DCE8F4"/>
                    <stop offset="42%" stop-color="#B9CCE0"/>
                    <stop offset="100%" stop-color="#8AA4C0"/>
                </linearGradient>

                <linearGradient id="introSeamGold-${side}" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#FFF5D6" stop-opacity="0.2"/>
                    <stop offset="28%" stop-color="#FFE7A3" stop-opacity="0.95"/>
                    <stop offset="72%" stop-color="#E8C273" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#FFF8E2" stop-opacity="0.85"/>
                </linearGradient>
            </defs>

            <g clip-path="url(#${clipId})">
                <!-- Massif principal gauche (flanc ombré) -->
                <path d="M -60 885 L 70 670 L 220 475 L 355 315 L 500 130 L 500 885 Z" fill="url(#introRockLeft-${side})"/>
                <!-- Massif principal droit (flanc éclairé par la lune) -->
                <path d="M 500 130 L 650 320 L 795 485 L 945 680 L 1060 885 L 500 885 Z" fill="url(#introRockRight-${side})"/>

                <!-- Contreforts secondaires gauche et droite pour remplir majestueusement l'écran -->
                <path d="M -60 900 L -60 545 L 115 410 L 285 620 L 340 890 Z" fill="#101E30"/>
                <path d="M 1060 900 L 1060 535 L 885 398 L 710 615 L 655 890 Z" fill="#182C43"/>

                <!-- Arêtes et facettes rocheuses pour donner du volume -->
                <path d="M 500 130 L 420 385 L 305 565 L 395 660 L 500 540 Z" fill="#182C44" opacity="0.72"/>
                <path d="M 500 130 L 585 375 L 705 570 L 610 655 L 500 540 Z" fill="#25405C" opacity="0.65"/>

                <!-- Calotte neigeuse du grand sommet (côté gauche ombré + côté droit lumineux) -->
                <path d="M 500 130 L 355 315 L 392 345 L 430 318 L 458 378 L 500 342 Z" fill="url(#introSnowShade-${side})"/>
                <path d="M 500 130 L 650 320 L 608 352 L 568 320 L 538 386 L 500 342 Z" fill="url(#introSnowLight-${side})"/>

                <!-- Neige sur les contreforts latéraux -->
                <path d="M 115 410 L 48 475 L 92 492 L 135 466 L 175 505 L 195 486 Z" fill="url(#introSnowShade-${side})" opacity="0.88"/>
                <path d="M 885 398 L 808 478 L 852 486 L 888 456 L 932 495 L 962 470 Z" fill="url(#introSnowLight-${side})" opacity="0.9"/>

                <!-- Couloirs de neige qui descendent sur les pentes -->
                <path d="M 458 378 L 385 520 L 428 538 L 482 430 Z" fill="#C4D8EC" opacity="0.48"/>
                <path d="M 538 386 L 622 535 L 575 552 L 518 432 Z" fill="#EEF5FC" opacity="0.62"/>
                <path d="M 290 560 L 200 725 L 255 735 L 325 605 Z" fill="#B5CCE2" opacity="0.34"/>
                <path d="M 710 560 L 805 730 L 748 738 L 675 610 Z" fill="#DFECF8" opacity="0.45"/>

                <!-- Vallée enneigée au pied de la montagne (sol où marchent Alexis & Clara) -->
                <path d="M -40 805 Q 250 768 500 785 Q 750 768 1040 805 L 1040 1020 L -40 1020 Z" fill="url(#introValleySnow-${side})"/>
                <path d="M -40 825 Q 260 792 500 808 Q 740 792 1040 825 L 1040 865 Q 500 835 -40 865 Z" fill="#FFFFFF" opacity="0.34"/>

                <!-- Quelques silhouettes discrètes de sapins alpins sur les bords gauche/droit (desktop + mobile) -->
                <g fill="#12241E" opacity="0.92">
                    <path d="M 78 725 L 48 798 L 66 798 L 38 855 L 118 855 L 90 798 L 108 798 Z"/>
                    <path d="M 148 748 L 126 802 L 139 802 L 118 845 L 178 845 L 157 802 L 170 802 Z"/>
                    <path d="M 208 766 L 192 806 L 202 806 L 186 836 L 230 836 L 214 806 L 224 806 Z"/>
                    <path d="M 296 742 L 274 794 L 287 794 L 266 838 L 326 838 L 305 794 L 318 794 Z"/>
                    <path d="M 346 762 L 332 798 L 340 798 L 326 826 L 366 826 L 352 798 L 360 798 Z"/>

                    <path d="M 922 722 L 892 796 L 910 796 L 882 855 L 962 855 L 934 796 L 952 796 Z"/>
                    <path d="M 852 746 L 830 800 L 843 800 L 822 845 L 882 845 L 861 800 L 874 800 Z"/>
                    <path d="M 792 764 L 776 804 L 786 804 L 770 836 L 814 836 L 798 804 L 808 804 Z"/>
                    <path d="M 704 742 L 682 794 L 695 794 L 674 838 L 734 838 L 713 794 L 726 794 Z"/>
                    <path d="M 654 762 L 640 798 L 648 798 L 634 826 L 674 826 L 660 798 L 668 798 Z"/>
                </g>

                <!-- Bordure dorée lumineuse le long de la fissure lors de l'ouverture -->
                <polyline
                    class="intro-seam-glow"
                    points="${buildCrackPolyline(isLeft ? -1 : 1)}"
                    fill="none"
                    stroke="url(#introSeamGold-${side})"
                    stroke-width="8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </g>
        </svg>
    `;
}

/* -------------------------------------------------------------------------
   LANCEMENT DE L'ANIMATION D'OUVERTURE MONTAGNE
   ------------------------------------------------------------------------- */
export function playMountainIntro({ onCovered, onComplete } = {}) {
    if (activeIntroCleanup) {
        activeIntroCleanup();
        activeIntroCleanup = null;
    }

    // 1. Construction dynamique de l'overlay (aucune modification nécessaire dans index.html)
    const overlay = document.createElement('div');
    overlay.className = 'intro-montagne-overlay';
    overlay.setAttribute('aria-label', "Animation d'ouverture");
    overlay.innerHTML = `
        <div class="intro-montagne-sky" data-role="sky">
            <div class="intro-montagne-nebula"></div>
            <canvas class="intro-montagne-canvas intro-montagne-canvas--stars" data-role="stars-canvas"></canvas>
            <div class="intro-parallax-layer" data-role="parallax-far">${buildParallaxFarSvg()}</div>
            <div class="intro-parallax-layer" data-role="parallax-mid">${buildParallaxMidSvg()}</div>
        </div>

        <div class="intro-golden-bloom" data-role="bloom"></div>

        <div class="intro-mountain-stage">
            <div class="intro-mountain-half intro-mountain-half--left" data-role="half-left">
                ${buildMainMountainHalfSvg('left')}
            </div>
            <div class="intro-mountain-half intro-mountain-half--right" data-role="half-right">
                ${buildMainMountainHalfSvg('right')}
            </div>
            <div class="intro-center-crack-beam" data-role="crack-beam"></div>
        </div>

        <canvas class="intro-montagne-canvas intro-montagne-canvas--fg" data-role="fg-canvas"></canvas>
    `;

    document.body.appendChild(overlay);

    const skyEl = overlay.querySelector('[data-role="sky"]');
    const parallaxFarEl = overlay.querySelector('[data-role="parallax-far"]');
    const parallaxMidEl = overlay.querySelector('[data-role="parallax-mid"]');
    const bloomEl = overlay.querySelector('[data-role="bloom"]');
    const halfLeftEl = overlay.querySelector('[data-role="half-left"]');
    const halfRightEl = overlay.querySelector('[data-role="half-right"]');
    const crackBeamEl = overlay.querySelector('[data-role="crack-beam"]');
    const seamGlowEls = overlay.querySelectorAll('.intro-seam-glow');
    const starsCanvas = overlay.querySelector('[data-role="stars-canvas"]');
    const fgCanvas = overlay.querySelector('[data-role="fg-canvas"]');

    const starsCtx = starsCanvas.getContext('2d');
    const fgCtx = fgCanvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resizeCanvases() {
        width = window.innerWidth;
        height = window.innerHeight;
        starsCanvas.width = Math.round(width * dpr);
        starsCanvas.height = Math.round(height * dpr);
        starsCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        fgCanvas.width = Math.round(width * dpr);
        fgCanvas.height = Math.round(height * dpr);
        fgCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvases();

    // 2. Génération des étoiles & flocons doux
    const stars = Array.from({ length: INTRO_CONFIG.STAR_COUNT }, () => ({
        nx: Math.random(),
        ny: Math.random() * 0.62,
        r: 0.6 + Math.random() * 1.5,
        baseAlpha: 0.35 + Math.random() * 0.6,
        twinkleSpeed: 1.5 + Math.random() * 3.0,
        phase: Math.random() * Math.PI * 2,
        color: STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)],
        isBright: Math.random() < 0.1
    }));

    const snowflakes = Array.from({ length: INTRO_CONFIG.SNOWFLAKE_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 1.0 + Math.random() * 2.1,
        vy: 18 + Math.random() * 26,
        driftAmp: 10 + Math.random() * 18,
        driftSpeed: 0.7 + Math.random() * 1.1,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.35 + Math.random() * 0.45
    }));

    // Éclats de neige + poussières d'or générés lors de l'ouverture de la montagne
    const snowBurstParticles = [];
    let hasSpawnedInitialBurst = false;
    let splitBurstTimer = 0;

    function spawnCrackSnowBurst(count, spreadSpeed = 1) {
        for (let i = 0; i < count; i++) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const isGold = Math.random() < 0.34;
            const py = height * (0.20 + Math.random() * 0.68);
            const px = width * 0.5 + (Math.random() - 0.5) * 14;
            snowBurstParticles.push({
                x: px,
                y: py,
                vx: side * (35 + Math.random() * 150) * spreadSpeed,
                vy: (-55 + Math.random() * 90) * spreadSpeed,
                gravity: isGold ? 28 : 115,
                r: isGold ? (1.4 + Math.random() * 2.2) : (1.8 + Math.random() * 3.2),
                life: 0.85 + Math.random() * 0.85,
                maxLife: 1.7,
                isGold
            });
        }
    }

    // 3. Cycle de vie & nettoyage garanti du DOM
    let isFinished = false;
    let hasNotifiedCovered = false;
    let animId = null;

    function notifyCoveredOnce() {
        if (hasNotifiedCovered) return;
        hasNotifiedCovered = true;
        if (typeof onCovered === 'function') {
            onCovered();
        }
    }

    function finishIntro(skipped = false) {
        if (isFinished) return;
        isFinished = true;
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        notifyCoveredOnce();
        window.removeEventListener('resize', resizeCanvases);
        activeIntroCleanup = null;

        overlay.remove();
        if (typeof onComplete === 'function') onComplete();
    }

    window.addEventListener('resize', resizeCanvases);

    activeIntroCleanup = () => {
        isFinished = true;
        if (animId !== null) cancelAnimationFrame(animId);
        window.removeEventListener('resize', resizeCanvases);
        overlay.remove();
    };

    // Déclenche le fondu d'entrée GPU sur la frame suivante
    requestAnimationFrame(() => {
        if (!isFinished) {
            overlay.classList.add('is-visible');
        }
    });

    const startTime = performance.now();
    let prevTime = startTime;

    function tick(now) {
        if (isFinished) return;

        const elapsed = (now - startTime) * 0.001;
        const dt = clamp((now - prevTime) / 1000, 0.001, 0.05);
        prevTime = now;

        // Dès que l'écran montagne recouvre la page de question, on déverrouille le gate en dessous
        if (elapsed >= INTRO_CONFIG.FADE_IN_END) {
            notifyCoveredOnce();
        }

        // Permet les clics sur le calendrier dès que la montagne est largement ouverte
        if (elapsed >= INTRO_CONFIG.SKY_FADE_END) {
            overlay.classList.add('is-passing-through');
        }

        // --- A. PARALLAXE DOUCE DES MONTAGNES D'ARRIÈRE-PLAN ---
        const approachProgress = easeOutCubic(
            (elapsed - INTRO_CONFIG.WALK_START) / (INTRO_CONFIG.WALK_END - INTRO_CONFIG.WALK_START)
        );
        const skyFade = 1 - smoothstep(INTRO_CONFIG.SKY_FADE_START, INTRO_CONFIG.SKY_FADE_END, elapsed);

        const farY = -approachProgress * 10;
        const farScale = 1 + approachProgress * 0.025;
        const midY = -approachProgress * 22;
        const midScale = 1 + approachProgress * 0.05;

        parallaxFarEl.style.transform = `translate3d(0, ${farY.toFixed(2)}px, 0) scale(${farScale.toFixed(4)})`;
        parallaxMidEl.style.transform = `translate3d(0, ${midY.toFixed(2)}px, 0) scale(${midScale.toFixed(4)})`;
        skyEl.style.opacity = skyFade.toFixed(3);

        // --- B. FISSURE DORÉE, TREMBLEMENT & OUVERTURE EN DEUX DE LA MONTAGNE ---
        const glowRise = smoothstep(INTRO_CONFIG.GLOW_START, INTRO_CONFIG.SPLIT_START + 0.15, elapsed);
        const splitProgress = easeInOutCubic(
            (elapsed - INTRO_CONFIG.SPLIT_START) / (INTRO_CONFIG.SPLIT_END - INTRO_CONFIG.SPLIT_START)
        );

        // Léger tremblement avant et au début de la séparation
        let tremorX = 0;
        let tremorY = 0;
        if (elapsed >= INTRO_CONFIG.TREMBLE_START && elapsed < INTRO_CONFIG.SPLIT_START + 0.65) {
            const tremorEnv = elapsed < INTRO_CONFIG.SPLIT_START
                ? smoothstep(INTRO_CONFIG.TREMBLE_START, INTRO_CONFIG.SPLIT_START, elapsed)
                : 1 - smoothstep(INTRO_CONFIG.SPLIT_START, INTRO_CONFIG.SPLIT_START + 0.65, elapsed);
            tremorX = Math.sin(elapsed * 68) * 3.2 * tremorEnv;
            tremorY = Math.cos(elapsed * 54) * 2.0 * tremorEnv;
        }

        // Les deux moitiés glissent vers la gauche et la droite (jusqu'à sortir complètement de l'écran)
        const maxSlidePx = width * 0.62;
        const slideOffset = splitProgress * maxSlidePx;
        const halfOpacity = 1 - smoothstep(INTRO_CONFIG.SPLIT_END - 0.35, INTRO_CONFIG.SPLIT_END + 0.15, elapsed);

        halfLeftEl.style.transform = `translate3d(${(-slideOffset + tremorX).toFixed(2)}px, ${tremorY.toFixed(2)}px, 0)`;
        halfRightEl.style.transform = `translate3d(${(slideOffset - tremorX).toFixed(2)}px, ${(-tremorY * 0.7).toFixed(2)}px, 0)`;
        halfLeftEl.style.opacity = halfOpacity.toFixed(3);
        halfRightEl.style.opacity = halfOpacity.toFixed(3);

        // Lueur dorée sur les arêtes internes de la fissure
        const seamGlowAlpha = glowRise * (1 - smoothstep(INTRO_CONFIG.SPLIT_END - 0.5, INTRO_CONFIG.SPLIT_END, elapsed));
        for (let i = 0; i < seamGlowEls.length; i++) {
            seamGlowEls[i].style.opacity = seamGlowAlpha.toFixed(3);
        }

        // Faisceau lumineux vertical au centre avant la séparation complète
        const beamFadeOut = 1 - smoothstep(INTRO_CONFIG.SPLIT_START + 0.25, INTRO_CONFIG.SPLIT_START + 0.95, elapsed);
        const beamScaleY = smoothstep(INTRO_CONFIG.GLOW_START, INTRO_CONFIG.SPLIT_START, elapsed);
        const beamScaleX = 1 + splitProgress * 12;
        crackBeamEl.style.opacity = (glowRise * beamFadeOut).toFixed(3);
        crackBeamEl.style.transform = `translate3d(-50%, 0, 0) scale(${beamScaleX.toFixed(2)}, ${beamScaleY.toFixed(3)})`;

        // Halo doré d'ouverture qui révèle l'accueil du calendrier puis s'évapore
        let bloomAlpha = 0;
        if (elapsed >= INTRO_CONFIG.GLOW_START && elapsed <= INTRO_CONFIG.BLOOM_END) {
            if (elapsed <= INTRO_CONFIG.BLOOM_PEAK) {
                bloomAlpha = smoothstep(INTRO_CONFIG.GLOW_START, INTRO_CONFIG.BLOOM_PEAK, elapsed) * 0.88;
            } else {
                bloomAlpha = (1 - smoothstep(INTRO_CONFIG.BLOOM_PEAK, INTRO_CONFIG.BLOOM_END, elapsed)) * 0.88;
            }
        }
        const bloomScale = 0.65 + smoothstep(INTRO_CONFIG.GLOW_START, INTRO_CONFIG.BLOOM_END, elapsed) * 0.9;
        bloomEl.style.opacity = bloomAlpha.toFixed(3);
        bloomEl.style.transform = `scale(${bloomScale.toFixed(3)})`;

        // Éclats de neige lors de la cassure et au début du glissement
        if (elapsed >= INTRO_CONFIG.TREMBLE_START + 0.12 && !hasSpawnedInitialBurst) {
            hasSpawnedInitialBurst = true;
            spawnCrackSnowBurst(28, 0.85);
        }
        if (elapsed >= INTRO_CONFIG.SPLIT_START && elapsed <= INTRO_CONFIG.SPLIT_START + 1.05) {
            splitBurstTimer -= dt;
            if (splitBurstTimer <= 0) {
                splitBurstTimer = 0.085;
                spawnCrackSnowBurst(6, 1.15);
            }
        }

        // --- C. DESSIN DU CIEL ÉTOILÉ (tant que le ciel est visible) ---
        if (skyFade > 0.01) {
            starsCtx.clearRect(0, 0, width, height);
            for (let i = 0; i < stars.length; i++) {
                const st = stars[i];
                const sx = st.nx * width;
                const sy = st.ny * height;
                const twinkle = 0.58 + 0.42 * Math.sin(elapsed * st.twinkleSpeed + st.phase);
                const alpha = st.baseAlpha * twinkle;

                starsCtx.fillStyle = st.color;
                starsCtx.globalAlpha = alpha;
                starsCtx.beginPath();
                starsCtx.arc(sx, sy, st.r, 0, Math.PI * 2);
                starsCtx.fill();

                if (st.isBright && twinkle > 0.8) {
                    starsCtx.strokeStyle = st.color;
                    starsCtx.lineWidth = 0.65;
                    starsCtx.globalAlpha = alpha * 0.5;
                    starsCtx.beginPath();
                    starsCtx.moveTo(sx - st.r * 3, sy);
                    starsCtx.lineTo(sx + st.r * 3, sy);
                    starsCtx.moveTo(sx, sy - st.r * 3);
                    starsCtx.lineTo(sx, sy + st.r * 3);
                    starsCtx.stroke();
                }
            }
            starsCtx.globalAlpha = 1;
        }

        // --- D. DESSIN AVANT-PLAN : FLOCONS, AVATARS ALEXIS & CLARA, ÉCLATS DE NEIGE ---
        fgCtx.clearRect(0, 0, width, height);

        // 1. Flocons qui tombent doucement
        const snowGlobalFade = 1 - smoothstep(INTRO_CONFIG.SPLIT_END - 0.6, INTRO_CONFIG.TOTAL_DURATION, elapsed);
        if (snowGlobalFade > 0.01) {
            fgCtx.fillStyle = '#FFFFFF';
            for (let i = 0; i < snowflakes.length; i++) {
                const fl = snowflakes[i];
                fl.y += fl.vy * dt;
                if (fl.y > height + 10) {
                    fl.y = -10;
                    fl.x = Math.random() * width;
                }
                const fx = fl.x + Math.sin(elapsed * fl.driftSpeed + fl.phase) * fl.driftAmp;
                fgCtx.globalAlpha = fl.alpha * snowGlobalFade;
                fgCtx.beginPath();
                fgCtx.arc(fx, fl.y, fl.r, 0, Math.PI * 2);
                fgCtx.fill();
            }
            fgCtx.globalAlpha = 1;
        }

        // 2. Avatars d'Alexis et Clara marchant côte à côte vers le pied de la montagne
        const avatarFadeIn = smoothstep(INTRO_CONFIG.WALK_START, INTRO_CONFIG.WALK_START + 0.5, elapsed);
        const avatarFadeOut = 1 - smoothstep(INTRO_CONFIG.SPLIT_START + 0.35, INTRO_CONFIG.SPLIT_START + 1.35, elapsed);
        const avatarAlpha = avatarFadeIn * avatarFadeOut;

        if (avatarAlpha > 0.01) {
            const walkT = clamp(
                (elapsed - INTRO_CONFIG.WALK_START) / (INTRO_CONFIG.WALK_END - INTRO_CONFIG.WALK_START),
                0,
                1
            );
            const walkEase = easeOutCubic(walkT);
            const isWalking = elapsed >= INTRO_CONFIG.WALK_START && elapsed < INTRO_CONFIG.WALK_END;

            // Ils partent du bas de l'écran et avancent jusqu'au pied de la grande montagne
            const startY = height * 0.94;
            const stopY = height * 0.785;
            // Petit pas vers la lumière lorsqu'ils s'effacent dans l'ouverture
            const stepIntoLight = smoothstep(INTRO_CONFIG.SPLIT_START + 0.25, INTRO_CONFIG.SPLIT_START + 1.35, elapsed) * 18;
            const coupleY = startY + (stopY - startY) * walkEase - stepIntoLight;

            // Légère perspective : un peu plus grands au premier plan, plus petits au pied de la montagne
            const baseUnit = clamp(Math.min(width, height) / 420, 0.85, 1.25);
            const perspScale = baseUnit * (1.28 - 0.34 * walkEase);

            const spacing = 22 * perspScale;
            const centerX = width * 0.5;
            const alexisX = centerX - spacing;
            const claraX = centerX + spacing;

            const walkPhase = elapsed * 7.6;
            const hairSway = isWalking
                ? Math.sin(walkPhase) * 2.4
                : Math.sin(elapsed * 2.1) * 1.4;

            fgCtx.save();
            fgCtx.globalAlpha = avatarAlpha;
            drawIntroAlexis(fgCtx, alexisX, coupleY, perspScale, walkPhase + 0.65, isWalking, glowRise);
            drawIntroClara(fgCtx, claraX, coupleY + 1.5 * perspScale, perspScale, walkPhase, isWalking, hairSway, glowRise);
            fgCtx.restore();
        }

        // 3. Éclats de neige et poussières d'or lors de l'ouverture de la montagne
        for (let i = snowBurstParticles.length - 1; i >= 0; i--) {
            const pt = snowBurstParticles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vy += pt.gravity * dt;
            pt.vx *= 0.985;
            pt.life -= dt;

            if (pt.life <= 0) {
                snowBurstParticles.splice(i, 1);
                continue;
            }

            const a = clamp(pt.life / 0.65, 0, 1);
            fgCtx.globalAlpha = a * (pt.isGold ? 0.92 : 0.88);
            fgCtx.fillStyle = pt.isGold ? '#FFE59E' : '#F4F9FF';
            fgCtx.beginPath();
            if (pt.isGold) {
                fgCtx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            } else {
                // Petit éclat anguleux de neige
                fgCtx.moveTo(pt.x, pt.y - pt.r);
                fgCtx.lineTo(pt.x + pt.r * 0.85, pt.y);
                fgCtx.lineTo(pt.x, pt.y + pt.r);
                fgCtx.lineTo(pt.x - pt.r * 0.85, pt.y);
                fgCtx.closePath();
            }
            fgCtx.fill();
        }
        fgCtx.globalAlpha = 1;

        if (elapsed >= INTRO_CONFIG.TOTAL_DURATION) {
            finishIntro(false);
            return;
        }

        animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
}
