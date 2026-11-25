/**
 * ============================================================================
 * ANIMATION D'OUVERTURE — GRANDE GALERIE DE L'ÉVOLUTION (MUSÉUM DE PARIS)
 * ============================================================================
 * Basée exactement sur le rythme, la technique, la parallaxe et l'ouverture
 * de l'animation de la montagne (`intro-montagne.js`) :
 *   1. Nef du XIXe siècle (verrière lumineuse, arches et colonnes en fer,
 *      coursives et balcons ouvragés sur plusieurs étages, parquet chaleureux).
 *   2. Rayons de lumière tamisée traversant la verrière avec poussières
 *      dorées flottantes, et grand cortège d'animaux naturalisés sur 3 plans
 *      de profondeur en parallaxe (éléphants, girafes, zèbres, rhinocéros,
 *      lions, antilopes, autruches, buffle et oiseaux en hauteur).
 *   3. Alexis et Clara (avatars exacts importés depuis `intro-avatars.js`,
 *      même marche, mêmes déplacements et proportions que la montagne)
 *      traversent côte à côte la galerie devant les animaux.
 *   4. Arrêt devant les grandes portes du Muséum, lueur dorée entre les
 *      battants, léger frémissement, puis ouverture des deux portes vers la
 *      gauche et la droite révélant directement le calendrier d'accueil.
 *
 * Appel facile à brancher plus tard :
 *   import { lancerIntroMuseum } from './intro-museum.js';
 *   lancerIntroMuseum({ onCovered, onComplete });
 * ============================================================================
 */

import { clamp } from '../utils/helpers.js';
import { drawIntroAlexis, drawIntroClara } from './intro-avatars.js';
import {
    MUSEUM_INTRO_CONFIG,
    computeMuseumIntroFrame
} from '../logic/museumIntroLogic.js';
import {
    paintFarNaveAndVerriere,
    paintMidIronBalconies,
    paintMuseumPortalHalf,
    drawSunbeams,
    drawLivingGalleryAccents,
    drawCaravanAnimals,
    drawCoupleParquetReflections
} from './museumArtwork.js';

let activeMuseumCleanup = null;

const DUST_PALETTE = ['#FFF7DE', '#F9E0A4', '#E8C480', '#FFF1C8'];

export function lancerIntroMuseum({ onCovered, onComplete } = {}) {
    if (activeMuseumCleanup) {
        activeMuseumCleanup();
        activeMuseumCleanup = null;
    }

    // 1. Construction autonome de l'overlay (aucune modification nécessaire dans index.html)
    const overlay = document.createElement('div');
    overlay.className = 'intro-museum-overlay';
    overlay.setAttribute('aria-label', "Animation d'ouverture Grande Galerie de l'Évolution");
    overlay.innerHTML = `
        <div class="intro-museum-hall" data-role="hall">
            <div class="intro-museum-skylight-glow"></div>
            <div class="intro-museum-parallax-layer" data-role="parallax-far">
                <canvas class="intro-museum-layer-canvas" data-role="far-canvas"></canvas>
            </div>
            <div class="intro-museum-parallax-layer" data-role="parallax-mid">
                <canvas class="intro-museum-layer-canvas" data-role="mid-canvas"></canvas>
            </div>
        </div>

        <div class="intro-museum-golden-bloom" data-role="bloom"></div>

        <div class="intro-museum-stage">
            <div class="intro-museum-half intro-museum-half--left" data-role="half-left">
                <canvas class="intro-museum-layer-canvas" data-role="half-left-canvas"></canvas>
                <div class="intro-museum-seam-glow" data-role="seam-glow"></div>
            </div>
            <div class="intro-museum-half intro-museum-half--right" data-role="half-right">
                <canvas class="intro-museum-layer-canvas" data-role="half-right-canvas"></canvas>
                <div class="intro-museum-seam-glow" data-role="seam-glow"></div>
            </div>
            <div class="intro-museum-crack-beam" data-role="crack-beam"></div>
        </div>

        <canvas class="intro-museum-canvas--fg" data-role="fg-canvas"></canvas>
    `;

    document.body.appendChild(overlay);

    const hallEl = overlay.querySelector('[data-role="hall"]');
    const parallaxFarEl = overlay.querySelector('[data-role="parallax-far"]');
    const parallaxMidEl = overlay.querySelector('[data-role="parallax-mid"]');
    const bloomEl = overlay.querySelector('[data-role="bloom"]');
    const halfLeftEl = overlay.querySelector('[data-role="half-left"]');
    const halfRightEl = overlay.querySelector('[data-role="half-right"]');
    const crackBeamEl = overlay.querySelector('[data-role="crack-beam"]');
    const seamGlowEls = overlay.querySelectorAll('[data-role="seam-glow"]');

    const farCanvas = overlay.querySelector('[data-role="far-canvas"]');
    const midCanvas = overlay.querySelector('[data-role="mid-canvas"]');
    const halfLeftCanvas = overlay.querySelector('[data-role="half-left-canvas"]');
    const halfRightCanvas = overlay.querySelector('[data-role="half-right-canvas"]');
    const fgCanvas = overlay.querySelector('[data-role="fg-canvas"]');

    const farCtx = farCanvas.getContext('2d');
    const midCtx = midCanvas.getContext('2d');
    const halfLeftCtx = halfLeftCanvas.getContext('2d');
    const halfRightCtx = halfRightCanvas.getContext('2d');
    const fgCtx = fgCanvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    // Cap DPR à 1.5 pour une fluidité 60 fps constante sur mobile et desktop
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

    function sizeAndPaintStaticLayers() {
        width = window.innerWidth;
        height = window.innerHeight;

        const canvases = [
            [farCanvas, farCtx],
            [midCanvas, midCtx],
            [halfLeftCanvas, halfLeftCtx],
            [halfRightCanvas, halfRightCtx],
            [fgCanvas, fgCtx]
        ];

        for (let i = 0; i < canvases.length; i++) {
            const [canvas, ctx] = canvases[i];
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        // Pré-rendu unique de l'architecture XIXe, des portes et du parquet (coût 0 par frame ensuite)
        paintFarNaveAndVerriere(farCtx, width, height);
        paintMidIronBalconies(midCtx, width, height);
        paintMuseumPortalHalf(halfLeftCtx, width, height, 'left');
        paintMuseumPortalHalf(halfRightCtx, width, height, 'right');
    }
    sizeAndPaintStaticLayers();

    // 2. Particules de poussière dorée flottant lentement dans les rayons de la verrière
    const dustMotes = Array.from({ length: MUSEUM_INTRO_CONFIG.DUST_COUNT }, () => ({
        x: Math.random() * width,
        y: Math.random() * height * 0.88,
        r: 0.9 + Math.random() * 1.9,
        vx: -4 + Math.random() * 8,
        vy: 5 + Math.random() * 11,
        driftAmp: 7 + Math.random() * 14,
        driftSpeed: 0.45 + Math.random() * 0.85,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.28 + Math.random() * 0.46,
        color: DUST_PALETTE[Math.floor(Math.random() * DUST_PALETTE.length)]
    }));

    // Éclats dorés & poussières lumineuses libérés à l'ouverture des grandes portes
    const doorBurstParticles = [];
    let hasSpawnedInitialBurst = false;
    let splitBurstTimer = 0;

    function spawnDoorLightBurst(count, spreadSpeed = 1) {
        for (let i = 0; i < count; i++) {
            const side = Math.random() < 0.5 ? -1 : 1;
            const isGold = Math.random() < 0.65;
            const py = height * (0.22 + Math.random() * 0.52);
            const px = width * 0.5 + (Math.random() - 0.5) * 14;
            doorBurstParticles.push({
                x: px,
                y: py,
                vx: side * (30 + Math.random() * 135) * spreadSpeed,
                vy: (-48 + Math.random() * 80) * spreadSpeed,
                gravity: isGold ? 22 : 68,
                r: isGold ? (1.4 + Math.random() * 2.3) : (1.2 + Math.random() * 2.0),
                life: 0.85 + Math.random() * 0.85,
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

    function finishIntro() {
        if (isFinished) return;
        isFinished = true;
        if (animId !== null) {
            cancelAnimationFrame(animId);
            animId = null;
        }
        notifyCoveredOnce();
        window.removeEventListener('resize', sizeAndPaintStaticLayers);
        activeMuseumCleanup = null;

        overlay.remove();
        if (typeof onComplete === 'function') onComplete();
    }

    window.addEventListener('resize', sizeAndPaintStaticLayers);

    activeMuseumCleanup = () => {
        isFinished = true;
        if (animId !== null) cancelAnimationFrame(animId);
        window.removeEventListener('resize', sizeAndPaintStaticLayers);
        overlay.remove();
    };

    // Fondu d'entrée GPU sur la frame suivante (identique à la montagne)
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

        const frame = computeMuseumIntroFrame(elapsed, width, height);

        if (frame.isCovered) {
            notifyCoveredOnce();
        }
        if (frame.isPassingThrough) {
            overlay.classList.add('is-passing-through');
        }

        // --- A. PARALLAXE GPU DE LA NEF (VERRIÈRE + BALCONS EN FER OUVRAGÉ) ---
        parallaxFarEl.style.transform = `translate3d(0, ${frame.parallax.far.y.toFixed(2)}px, 0) scale(${frame.parallax.far.scale.toFixed(4)})`;
        parallaxMidEl.style.transform = `translate3d(0, ${frame.parallax.mid.y.toFixed(2)}px, 0) scale(${frame.parallax.mid.scale.toFixed(4)})`;
        hallEl.style.opacity = frame.bgFade.toFixed(3);

        // --- B. OUVERTURE DES GRANDES PORTES DU MUSÉUM & LUEUR DORÉE ---
        const {
            glowRise,
            tremorX,
            tremorY,
            slideOffset,
            doorOpacity,
            seamGlowAlpha,
            beamAlpha,
            beamScaleX,
            beamScaleY
        } = frame.doors;

        halfLeftEl.style.transform = `translate3d(${(-slideOffset + tremorX).toFixed(2)}px, ${tremorY.toFixed(2)}px, 0)`;
        halfRightEl.style.transform = `translate3d(${(slideOffset - tremorX).toFixed(2)}px, ${(-tremorY * 0.7).toFixed(2)}px, 0)`;
        halfLeftEl.style.opacity = doorOpacity.toFixed(3);
        halfRightEl.style.opacity = doorOpacity.toFixed(3);

        for (let i = 0; i < seamGlowEls.length; i++) {
            seamGlowEls[i].style.opacity = seamGlowAlpha.toFixed(3);
        }

        crackBeamEl.style.opacity = beamAlpha.toFixed(3);
        crackBeamEl.style.transform = `translate3d(-50%, 0, 0) scale(${beamScaleX.toFixed(2)}, ${beamScaleY.toFixed(3)})`;

        bloomEl.style.opacity = frame.bloom.alpha.toFixed(3);
        bloomEl.style.transform = `scale(${frame.bloom.scale.toFixed(3)})`;

        // Poussières lumineuses lors du frémissement puis de l'ouverture des battants
        if (elapsed >= MUSEUM_INTRO_CONFIG.TREMBLE_START + 0.12 && !hasSpawnedInitialBurst) {
            hasSpawnedInitialBurst = true;
            spawnDoorLightBurst(26, 0.85);
        }
        if (elapsed >= MUSEUM_INTRO_CONFIG.SPLIT_START && elapsed <= MUSEUM_INTRO_CONFIG.SPLIT_START + 1.05) {
            splitBurstTimer -= dt;
            if (splitBurstTimer <= 0) {
                splitBurstTimer = 0.085;
                spawnDoorLightBurst(6, 1.12);
            }
        }

        // --- C. DESSIN AVANT-PLAN : RAYONS, CORTÈGE 3 PLANS, POUSSIÈRE & AVATARS ---
        fgCtx.clearRect(0, 0, width, height);

        // 1. Rayons de lumière tamisée & chaude traversant la grande verrière + accents vivants
        drawSunbeams(fgCtx, width, height, elapsed, frame.lightPulse, frame.bgFade);
        drawLivingGalleryAccents(fgCtx, width, height, frame, elapsed);

        // 2. Cortège d'animaux naturalisés sur 3 plans de profondeur + oiseaux en hauteur
        drawCaravanAnimals(fgCtx, width, height, frame, elapsed);

        // 3. Particules de poussière dorée qui flottent dans les rayons
        if (frame.dustGlobalFade > 0.01) {
            for (let i = 0; i < dustMotes.length; i++) {
                const m = dustMotes[i];
                m.x += m.vx * dt;
                m.y += m.vy * dt;
                if (m.y > height * 0.92) {
                    m.y = -8;
                    m.x = Math.random() * width;
                }
                if (m.x < -12) m.x = width + 12;
                if (m.x > width + 12) m.x = -12;

                const mx = m.x + Math.sin(elapsed * m.driftSpeed + m.phase) * m.driftAmp;
                const twinkle = 0.65 + 0.35 * Math.sin(elapsed * 2.3 + m.phase);
                fgCtx.globalAlpha = m.alpha * twinkle * frame.dustGlobalFade;
                fgCtx.fillStyle = m.color;
                fgCtx.beginPath();
                fgCtx.arc(mx, m.y, m.r, 0, Math.PI * 2);
                fgCtx.fill();
            }
            fgCtx.globalAlpha = 1;
        }

        // 4. Avatars exacts d'Alexis & Clara (importés de intro-avatars.js, même marche & proportions)
        const {
            avatarAlpha,
            alexisX,
            claraX,
            coupleY,
            perspScale,
            walkPhase,
            isWalking,
            hairSway
        } = frame.walk;

        if (avatarAlpha > 0.01) {
            // Ombres & reflets discrets sur le parquet ciré sous les personnages
            drawCoupleParquetReflections(fgCtx, alexisX, claraX, coupleY, perspScale, glowRise, avatarAlpha);

            fgCtx.save();
            fgCtx.globalAlpha = avatarAlpha;
            drawIntroAlexis(fgCtx, alexisX, coupleY, perspScale, walkPhase + 0.65, isWalking, glowRise);
            drawIntroClara(fgCtx, claraX, coupleY + 1.5 * perspScale, perspScale, walkPhase, isWalking, hairSway, glowRise);
            fgCtx.restore();
        }

        // 5. Poussières d'or & éclats lumineux lors de l'ouverture des grandes portes
        for (let i = doorBurstParticles.length - 1; i >= 0; i--) {
            const pt = doorBurstParticles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vy += pt.gravity * dt;
            pt.vx *= 0.985;
            pt.life -= dt;

            if (pt.life <= 0) {
                doorBurstParticles.splice(i, 1);
                continue;
            }

            const a = clamp(pt.life / 0.65, 0, 1);
            fgCtx.globalAlpha = a * (pt.isGold ? 0.92 : 0.80);
            fgCtx.fillStyle = pt.isGold ? '#FFE59E' : '#FFF7E4';
            fgCtx.beginPath();
            fgCtx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
            fgCtx.fill();
        }
        fgCtx.globalAlpha = 1;

        if (frame.isFinished) {
            finishIntro();
            return;
        }

        animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
}

export const playMuseumIntro = lancerIntroMuseum;
