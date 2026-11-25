/**
 * ============================================================================
 * MINI-JEU CONTEMPLATIF PLEIN ÉCRAN (JOUR 8) : BAIN DE MINUIT AU CAP FERRET
 * - Dernière soirée sous un ciel étoilé irréel + Voie Lactée
 * - Départ sur le sable en bas, puis avancée libre dans toutes les directions
 *   dans l'eau très peu profonde (jusqu'aux fesses maximum) sur toute la plage
 * - Clara de dos : longs cheveux bruns + silhouette entièrement beige couleur peau
 * - Banc de phytoplancton bioluminescent : aura et traînée bleu turquoise
 *   lumineuse dès qu'on bouge dans l'eau
 * - Silence de la nuit interrompu au loin par d'énormes vagues qui s'explosent
 *   contre le sol avec réverbération sourde (fait sursauter et rire !)
 * ============================================================================
 */

import { UI_TEXTS } from '../data/calendarData.js';
import { clamp } from '../utils/helpers.js';
import {
    stopActiveGame,
    setActiveGameCleanup,
    markGameWon,
    saveAndSyncQuizAnswer
} from '../logic/state.js';
import {
    HEART_STAR_COUNT,
    HEART_STAR_ANGLES,
    getSmoothHeartPoint,
    getHeartLayout,
    getHeartStars,
    sampleHeartArc,
    evaluateSkyTouch,
    getConstellationMusicState
} from '../logic/midnightConstellation.js';
import { createMidnightAudioEngine } from '../logic/midnightAudio.js';
import {
    fsOverlay,
    fsTimer,
    fsHint,
    fsEndCard,
    ferretCanvas
} from './dom.js';
import { closeFullscreenGame } from './ferretGame.js';
import { openModal, closeModal } from './modal.js';

const STAR_PALETTE = ['#FFFFFF', '#FFF8E7', '#CFE8FF', '#FFE6B8', '#B8F2E6'];
const PLANKTON_COLORS = ['#00F5D4', '#00E5FF', '#48CAE4', '#80FFDB', '#72EFDD'];

const TOTAL_STARS = 260;
const MILKY_WAY_STARS = 110;
const MAX_PLANKTON_PARTICLES = 240;
const MAX_PLANKTON_RIPPLES = 24;
const PLAYER_MAX_SPEED = 148;
const MIN_WATER_PLAY_SEC = 1.8;
const POST_SWIM_HUG_DELAY_SEC = 4.5;
const STARGAZE_HINT_DELAY_SEC = 10;
const CONSTELLATION_RETURN_MENU_SEC = 16;
const DRAG_STAR_COOLDOWN_MS = 240;

export function launchFullscreenMidnightSwim(item) {
    stopActiveGame();
    fsOverlay.classList.add('active');
    fsOverlay.setAttribute('aria-hidden', 'false');
    fsEndCard.classList.remove('visible');

    // Masque la barre de progression et le badge Minuit : laisse uniquement la croix pour quitter
    const fsStatsEl = document.querySelector('.fs-stats');
    if (fsStatsEl) fsStatsEl.style.display = 'none';
    if (fsTimer) fsTimer.style.display = 'none';

    fsHint.textContent = UI_TEXTS.MIDNIGHT_SWIM.INITIAL_HINT;
    fsHint.style.opacity = '1';

    const canvas = ferretCanvas;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    let baseHorizonY = height * 0.43;
    let baseShorelineY = height * 0.82;
    let horizonY = baseHorizonY;     // Ligne d'horizon où le ciel étoilé touche l'océan
    let shorelineY = baseShorelineY; // Limite entre le sable en bas et l'eau peu profonde

    // Alexis assis sur la plage (non jouable, fin et tout beige, à côté du point de départ de Clara)
    const alexis = {
        x: width * 0.36,
        y: shorelineY + (height - shorelineY) * 0.48
    };

    let skyExpandBlend = 0;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        baseHorizonY = height * 0.43;
        baseShorelineY = height * 0.82;
        horizonY = baseHorizonY + (height * 0.76 - baseHorizonY) * skyExpandBlend;
        shorelineY = baseShorelineY + (height * 0.86 - baseShorelineY) * skyExpandBlend;
        alexis.x = width * (0.36 + 0.12 * skyExpandBlend);
        alexis.y = shorelineY + (height - shorelineY) * 0.48;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // 1. Génération du ciel étoilé irréel (260 étoiles + amas de la Voie Lactée)
    const stars = Array.from({ length: TOTAL_STARS }, (_, idx) => {
        const inMilkyWay = idx < MILKY_WAY_STARS;
        let nx = Math.random();
        let ny = Math.random();
        if (inMilkyWay) {
            const t = Math.random();
            const spread = (Math.random() - 0.5) * 0.28;
            nx = clamp(t + spread * 0.7, 0.02, 0.98);
            ny = clamp((1 - t) * 0.82 + 0.08 + spread, 0.03, 0.95);
        }
        return {
            nx,
            ny,
            r: inMilkyWay ? (0.5 + Math.random() * 1.4) : (0.6 + Math.random() * 1.9),
            baseAlpha: 0.35 + Math.random() * 0.65,
            twinkleSpeed: 1.2 + Math.random() * 3.4,
            phase: Math.random() * Math.PI * 2,
            color: STAR_PALETTE[Math.floor(Math.random() * STAR_PALETTE.length)],
            isBright: Math.random() < 0.09
        };
    });

    // Étoiles filantes dans le ciel nocturne
    const shootingStars = [];
    let nextShootingStarTimer = 3.5;

    // 2. Joueur : Clara commence sur le sable à droite d'Alexis (peut aller vers lui pour un câlin ou vers la mer)
    const player = {
        x: width * 0.60,
        y: shorelineY + (height - shorelineY) * 0.48,
        vx: 0,
        vy: 0,
        targetX: null,
        targetY: null,
        walkCycle: 0,
        hairSway: 0,
        glowIntensity: 0,
        isHugging: false,
        hugBlend: 0
    };

    // Petits coeurs doux quand Clara s'assoit contre Alexis pour lui faire un câlin
    const hugHearts = [];
    let hugHeartTimer = 0;

    // Suivi de la suite : 1) aller jouer dans l'eau, 2) revenir faire un câlin (musique calme), 3) pause, 4) constellation du cœur sous les étoiles
    let waterPlayTime = 0;
    let hasPlayedInWater = false;
    let postSwimHugTimer = 0;
    let stargazePhase = false;
    let stargazeIdleTimer = 0;
    let constellationProgress = 0;
    let lastStarLitAtMs = 0;
    let lastArcDrawProgress = 1;
    let closingArcProgress = 0;
    let heartRevealBlend = 0;
    let constellationCompletedTimer = 0;
    let finaleShown = false;
    let climaxTriggered = false;
    const starBursts = [];
    const guidingWisps = [];
    const heartPulseWaves = [];

    const keys = { left: false, right: false, up: false, down: false };
    let isPointerDown = false;

    // 3. Particules de phytoplancton bleu turquoise, sillages et empreintes dans le sable
    const planktonParticles = [];
    const planktonRipples = [];
    const sandFootprints = [];
    let stepDistAccum = 0;

    // Bancs de phytoplancton ambiants très subtils sous la surface
    const ambientPlanktonPatches = Array.from({ length: 12 }, () => ({
        nx: 0.08 + Math.random() * 0.84,
        ny: 0.47 + Math.random() * 0.32,
        rx: 36 + Math.random() * 50,
        ry: 11 + Math.random() * 18,
        phase: Math.random() * Math.PI * 2,
        driftSpeed: 0.3 + Math.random() * 0.4
    }));

    // 4. Vagues au loin qui s'explosent contre le sol avec réverbération sourde et puissante
    let nextBoomWaveTimer = 4.5;
    let distantWave = null;
    let screenTremor = 0;

    // Moteur audio procédural (vagues très graves & puissantes, musique romantique évolutive)
    const nightAudio = createMidnightAudioEngine();

    function syncMidnightStateAttributes(inWater) {
        const phase = finaleShown || constellationProgress >= HEART_STAR_COUNT
            ? 'completed'
            : (stargazePhase
                ? 'stargaze'
                : (player.isHugging ? 'hug' : (inWater ? 'water' : 'beach')));
        fsOverlay.dataset.midnightPhase = phase;
        fsOverlay.dataset.constellationProgress = String(constellationProgress);
        fsOverlay.dataset.musicMode = nightAudio.getMusicMode();
    }
    syncMidnightStateAttributes(false);

    function spawnPlankton(x, y, vx, vy, count = 4) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const spd = 6 + Math.random() * 28;
            planktonParticles.push({
                x: x + (Math.random() - 0.5) * 22,
                y: y + (Math.random() - 0.5) * 12,
                vx: -vx * 0.16 + Math.cos(angle) * spd,
                vy: -vy * 0.16 + Math.sin(angle) * spd * 0.55,
                r: 1.2 + Math.random() * 2.4,
                life: 1.0 + Math.random() * 1.3,
                maxLife: 2.3,
                color: PLANKTON_COLORS[Math.floor(Math.random() * PLANKTON_COLORS.length)]
            });
        }
        if (planktonParticles.length > MAX_PLANKTON_PARTICLES) {
            planktonParticles.splice(0, planktonParticles.length - MAX_PLANKTON_PARTICLES);
        }
    }

    function spawnPlanktonRipple(x, y, strength = 1) {
        planktonRipples.push({
            x,
            y,
            rx: 8,
            ry: 3.8,
            maxRx: 34 + strength * 22,
            alpha: 0.42 * Math.min(1.1, strength)
        });
        if (planktonRipples.length > MAX_PLANKTON_RIPPLES) {
            planktonRipples.shift();
        }
    }

    let hasUnlockedSouvenir = false;
    let isRunning = true;
    let animId = null;

    function unlockMidnightSouvenir() {
        if (hasUnlockedSouvenir) return;
        hasUnlockedSouvenir = true;

        markGameWon(item.day);

        saveAndSyncQuizAnswer(
            `bain_minuit_jour_${item.day}`,
            `Bain de Minuit (Jour ${item.day})`,
            `A exploré le bain de minuit et le phytoplancton au Cap Ferret`,
            `Surprise Jour ${item.day}`
        );

        openModal(item);
    }

    function spawnStarBurst(x, y, count = 16, warmTint = false) {
        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 * i) / count + Math.random() * 0.35;
            const spd = 16 + Math.random() * 54;
            starBursts.push({
                x,
                y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                r: 1.4 + Math.random() * 2.2,
                life: 0.95 + Math.random() * 0.55,
                warm: warmTint || Math.random() < 0.35
            });
        }
    }

    function triggerStargazeWish(clientX, clientY, isDrag = false) {
        if (!stargazePhase || finaleShown) return;
        nightAudio.ensureAudio();

        if (constellationProgress >= HEART_STAR_COUNT) return;

        const layout = getHeartLayout(width, horizonY);
        const heartStars = getHeartStars(layout.centerX, layout.centerY, layout.heartScale);
        const result = evaluateSkyTouch(clientX, clientY, constellationProgress, heartStars, layout.hitRadius);

        if (result.hit) {
            // En glissement continu, cadence douce pour savourer chaque étoile ; un clic/tap direct répond toujours immédiatement
            const nowMs = performance.now();
            if (isDrag && (nowMs - lastStarLitAtMs) < DRAG_STAR_COOLDOWN_MS) return;
            lastStarLitAtMs = nowMs;

            fsHint.style.opacity = '0';

            const pt = result.targetStar;
            spawnStarBurst(pt.x, pt.y, result.isMilestone ? 28 : 18, result.isMilestone);
            heartPulseWaves.push({
                x: pt.x,
                y: pt.y,
                r: 6,
                maxR: result.isComplete ? 120 : (result.isMilestone ? 54 : 34),
                alpha: result.isMilestone ? 0.85 : 0.65,
                warm: result.isMilestone
            });

            nightAudio.playStarChime(result.starIndex, result.isMilestone);
            constellationProgress = result.nextIndex;
            lastArcDrawProgress = 0;

            const musicState = getConstellationMusicState(constellationProgress, HEART_STAR_COUNT, result.isComplete);
            nightAudio.setMusicProgress(musicState.progress);

            if (result.isMilestone && !result.isComplete) {
                // Double étoile filante croisée aux étapes clés (4e et 8e étoile)
                for (let m = 0; m < 2; m++) {
                    const dir = m === 0 ? 1 : -1;
                    shootingStars.push({
                        x: width * (m === 0 ? 0.22 : 0.78),
                        y: horizonY * (0.14 + m * 0.10),
                        vx: dir * (260 + m * 40),
                        vy: 85 + m * 25,
                        life: 0.95
                    });
                }
            }

            if (result.isComplete) {
                closingArcProgress = 0;
                if (!climaxTriggered) {
                    climaxTriggered = true;
                    nightAudio.triggerMusicClimax();
                }

                // Grande onde lumineuse + pluie d'étoiles filantes quand le cœur se referme parfaitement
                heartPulseWaves.push({
                    x: layout.centerX,
                    y: layout.centerY,
                    r: 18,
                    maxR: Math.max(width, horizonY) * 0.42,
                    alpha: 0.9,
                    warm: true
                });
                spawnStarBurst(layout.centerX, layout.centerY, 36, true);

                for (let k = 0; k < 7; k++) {
                    shootingStars.push({
                        x: width * (0.10 + k * 0.13),
                        y: horizonY * (0.06 + (k % 3) * 0.11),
                        vx: (k % 2 === 0 ? 1 : -1) * (250 + k * 24),
                        vy: 100 + k * 14,
                        life: 1.0 + k * 0.14
                    });
                }
            }
            return;
        }

        // Si Clara tape ailleurs dans le ciel (hors glissement), on crée une étoile filante + une luciole guide vers la prochaine étoile !
        if (!isDrag && result.targetStar) {
            spawnStarBurst(clientX, clientY, 10, false);

            const dir = Math.random() < 0.5 ? 1 : -1;
            shootingStars.push({
                x: clientX - dir * 70,
                y: Math.max(26, clientY - 40),
                vx: dir * (240 + Math.random() * 110),
                vy: 80 + Math.random() * 55,
                life: 0.8
            });

            // Luciole d'étoile qui file doucement du doigt vers la prochaine étoile du cœur
            guidingWisps.push({
                startX: clientX,
                startY: clientY,
                targetX: result.targetStar.x,
                targetY: result.targetStar.y,
                ctrlX: (clientX + result.targetStar.x) * 0.5 + (Math.random() - 0.5) * 90,
                ctrlY: Math.min(clientY, result.targetStar.y) - 45,
                progress: 0
            });
        }
    }

    // Contrôles tactiles & souris : se déplacer librement ou, pendant la suite, relier les étoiles du cœur (tap ou glisser)
    const setPointerTarget = (clientX, clientY) => {
        nightAudio.ensureAudio();
        if (stargazePhase) return;
        player.targetX = clamp(clientX, 28, width - 28);
        player.targetY = clamp(clientY, horizonY + 26, height - 32);
    };

    const onTouchStart = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        isPointerDown = true;
        if (stargazePhase) {
            triggerStargazeWish(e.touches[0].clientX, e.touches[0].clientY, false);
            return;
        }
        setPointerTarget(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchMove = (e) => {
        if (!isPointerDown || !e.touches || e.touches.length === 0) return;
        if (stargazePhase) {
            triggerStargazeWish(e.touches[0].clientX, e.touches[0].clientY, true);
            return;
        }
        setPointerTarget(e.touches[0].clientX, e.touches[0].clientY);
    };

    const onTouchEnd = () => {
        isPointerDown = false;
        player.targetX = null;
        player.targetY = null;
    };

    const onMouseDown = (e) => {
        isPointerDown = true;
        if (stargazePhase) {
            triggerStargazeWish(e.clientX, e.clientY, false);
            return;
        }
        setPointerTarget(e.clientX, e.clientY);
    };

    const onMouseMove = (e) => {
        if (!isPointerDown) return;
        if (stargazePhase) {
            triggerStargazeWish(e.clientX, e.clientY, true);
            return;
        }
        setPointerTarget(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
        isPointerDown = false;
        player.targetX = null;
        player.targetY = null;
    };

    const onKeyDown = (e) => {
        nightAudio.ensureAudio();
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q' || e.key === 'A' || e.key === 'Q') keys.left = true;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'z' || e.key === 'W' || e.key === 'Z') keys.up = true;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
    };

    const onKeyUp = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q' || e.key === 'A' || e.key === 'Q') keys.left = false;
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'z' || e.key === 'W' || e.key === 'Z') keys.up = false;
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let lastTime = performance.now();

    function drawMidnightScene(now, dt) {
        const t = now * 0.001;

        ctx.save();
        if (screenTremor > 0.01) {
            const tx = (Math.random() - 0.5) * screenTremor * 7;
            const ty = (Math.random() - 0.5) * screenTremor * 5;
            ctx.translate(tx, ty);
        }

        // 1. CIEL ÉTOILÉ IRRÉEL DU CAP FERRET
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0.0, '#01030A');
        skyGrad.addColorStop(0.45, '#040B1B');
        skyGrad.addColorStop(0.82, '#08162E');
        skyGrad.addColorStop(1.0, '#0D213F');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY + 2);

        // Nébuleuse / Voie Lactée diagonale dans le ciel
        ctx.save();
        ctx.translate(width * 0.5, horizonY * 0.48);
        ctx.rotate(-0.42);
        const mwGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, width * 0.65);
        mwGrad.addColorStop(0.0, 'rgba(130, 175, 255, 0.16)');
        mwGrad.addColorStop(0.35, 'rgba(90, 210, 235, 0.09)');
        mwGrad.addColorStop(0.7, 'rgba(55, 95, 165, 0.04)');
        mwGrad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = mwGrad;
        ctx.scale(1.6, 0.42);
        ctx.beginPath();
        ctx.arc(0, 0, width * 0.65, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Étoiles scintillantes
        for (let i = 0; i < stars.length; i++) {
            const st = stars[i];
            const sx = st.nx * width;
            const sy = st.ny * (horizonY - 8);
            const twinkle = 0.62 + 0.38 * Math.sin(t * st.twinkleSpeed + st.phase);
            const alpha = st.baseAlpha * twinkle;

            ctx.fillStyle = st.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sx, sy, st.r, 0, Math.PI * 2);
            ctx.fill();

            if (st.isBright && twinkle > 0.82) {
                ctx.strokeStyle = st.color;
                ctx.lineWidth = 0.7;
                ctx.globalAlpha = alpha * 0.55;
                ctx.beginPath();
                ctx.moveTo(sx - st.r * 3.2, sy);
                ctx.lineTo(sx + st.r * 3.2, sy);
                ctx.moveTo(sx, sy - st.r * 3.2);
                ctx.lineTo(sx, sy + st.r * 3.2);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;

        // Étoiles filantes
        for (let i = shootingStars.length - 1; i >= 0; i--) {
            const ss = shootingStars[i];
            ss.x += ss.vx * dt;
            ss.y += ss.vy * dt;
            ss.life -= dt;
            if (ss.life <= 0) {
                shootingStars.splice(i, 1);
                continue;
            }
            const tailX = ss.x - ss.vx * 0.14;
            const tailY = ss.y - ss.vy * 0.14;
            const sGrad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
            sGrad.addColorStop(0, `rgba(255, 255, 255, ${Math.min(1, ss.life * 2)})`);
            sGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
            ctx.strokeStyle = sGrad;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(ss.x, ss.y);
            ctx.lineTo(tailX, tailY);
            ctx.stroke();
        }

        // 1b. SUITE SOUS LES ÉTOILES : CONSTELLATION PROGRESSIVE EN 12 ÉTOILES -> CŒUR LUMINEUX PALPITANT
        if (skyExpandBlend > 0.05) {
            ctx.save();
            const layout = getHeartLayout(width, horizonY);
            const { centerX: heartCenterX, centerY: heartCenterY, heartScale } = layout;
            const heartStars = getHeartStars(heartCenterX, heartCenterY, heartScale);
            const isHeartDone = constellationProgress >= HEART_STAR_COUNT;
            const progressRatio = constellationProgress / HEART_STAR_COUNT;

            // Légère lueur nébuleuse intérieure qui s'éveille doucement à mesure que le cœur se dessine
            if (constellationProgress >= 2) {
                const heartBeat = isHeartDone ? (1 + Math.sin(t * 3.4) * 0.065) : 1;
                const innerAlpha = isHeartDone
                    ? (0.16 + 0.07 * Math.sin(t * 3.4)) * Math.max(0.4, heartRevealBlend)
                    : progressRatio * 0.085;
                const fillGrad = ctx.createRadialGradient(
                    heartCenterX, heartCenterY, 4,
                    heartCenterX, heartCenterY, heartScale * 20 * heartBeat
                );
                fillGrad.addColorStop(0, `rgba(255, 184, 210, ${innerAlpha})`);
                fillGrad.addColorStop(0.55, `rgba(0, 245, 212, ${innerAlpha * 0.58})`);
                fillGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = fillGrad;
                ctx.beginPath();
                ctx.arc(heartCenterX, heartCenterY, heartScale * 20 * heartBeat, 0, Math.PI * 2);
                ctx.fill();
            }

            // Courbes de constellation déjà reliées (tracé fluide le long de la vraie courbe du cœur)
            if (constellationProgress >= 2) {
                const segmentsToDraw = constellationProgress - 1;
                ctx.save();
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = isHeartDone ? 'rgba(255, 195, 218, 0.85)' : 'rgba(0, 245, 212, 0.8)';
                ctx.shadowBlur = isHeartDone ? (14 + Math.sin(t * 3.4) * 5) : 10;
                ctx.strokeStyle = isHeartDone
                    ? 'rgba(255, 245, 250, 0.94)'
                    : 'rgba(225, 252, 255, 0.86)';
                ctx.lineWidth = isHeartDone ? 2.6 : 2.1;

                for (let seg = 0; seg < segmentsToDraw; seg++) {
                    const t0 = HEART_STAR_ANGLES[seg];
                    const t1 = HEART_STAR_ANGLES[seg + 1];
                    const frac = seg === segmentsToDraw - 1 ? lastArcDrawProgress : 1;
                    const tEnd = t0 + (t1 - t0) * frac;
                    const arcPts = sampleHeartArc(t0, tEnd, heartCenterX, heartCenterY, heartScale, 18);

                    ctx.beginPath();
                    for (let j = 0; j < arcPts.length; j++) {
                        if (j === 0) ctx.moveTo(arcPts[j].x, arcPts[j].y);
                        else ctx.lineTo(arcPts[j].x, arcPts[j].y);
                    }
                    ctx.stroke();
                }

                // Arc de fermeture finale (entre la 12e étoile et la pointe basse)
                if (isHeartDone && closingArcProgress > 0.01) {
                    const t0 = HEART_STAR_ANGLES[HEART_STAR_COUNT - 1];
                    const t1 = Math.PI * 3; // Revient exactement à la pointe basse (theta = Math.PI)
                    const tEnd = t0 + (t1 - t0) * closingArcProgress;
                    const closePts = sampleHeartArc(t0, tEnd, heartCenterX, heartCenterY, heartScale, 20);

                    ctx.beginPath();
                    for (let j = 0; j < closePts.length; j++) {
                        if (j === 0) ctx.moveTo(closePts[j].x, closePts[j].y);
                        else ctx.lineTo(closePts[j].x, closePts[j].y);
                    }
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Halo final du cœur complet qui respire avec la musique emballée
            if (isHeartDone && heartRevealBlend > 0.02) {
                const maxSteps = 140;
                const pulseScale = 1 + Math.sin(t * 3.4) * 0.022;
                ctx.save();
                ctx.translate(heartCenterX, heartCenterY);
                ctx.scale(pulseScale, pulseScale);
                ctx.translate(-heartCenterX, -heartCenterY);

                ctx.beginPath();
                for (let s = 0; s <= maxSteps; s++) {
                    const theta = (s / maxSteps) * Math.PI * 2;
                    const pt = getSmoothHeartPoint(theta, heartCenterX, heartCenterY, heartScale);
                    if (s === 0) ctx.moveTo(pt.x, pt.y);
                    else ctx.lineTo(pt.x, pt.y);
                }
                ctx.closePath();

                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.shadowColor = 'rgba(255, 175, 205, 0.9)';
                ctx.shadowBlur = 18;
                ctx.strokeStyle = `rgba(255, 240, 246, ${0.65 * heartRevealBlend})`;
                ctx.lineWidth = 3.2;
                ctx.stroke();
                ctx.restore();
            }

            // Petite luciole lumineuse qui glisse de la dernière étoile vers la prochaine cible (guide intuitif !)
            if (stargazePhase && !isHeartDone && constellationProgress > 0 && skyExpandBlend > 0.5) {
                const prevTheta = HEART_STAR_ANGLES[constellationProgress - 1];
                const nextTheta = HEART_STAR_ANGLES[constellationProgress];
                const glidePhase = (t * 0.72) % 1;
                const fireflyTheta = prevTheta + (nextTheta - prevTheta) * glidePhase;
                const ff = getSmoothHeartPoint(fireflyTheta, heartCenterX, heartCenterY, heartScale);
                const ffAlpha = Math.sin(glidePhase * Math.PI) * 0.75 * skyExpandBlend;

                ctx.save();
                const ffGrad = ctx.createRadialGradient(ff.x, ff.y, 0.5, ff.x, ff.y, 11);
                ffGrad.addColorStop(0, `rgba(255, 245, 210, ${ffAlpha})`);
                ffGrad.addColorStop(0.5, `rgba(0, 245, 212, ${ffAlpha * 0.6})`);
                ffGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
                ctx.fillStyle = ffGrad;
                ctx.beginPath();
                ctx.arc(ff.x, ff.y, 11, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Étoiles guides de la constellation (allumées, prochaine cible brillante, et légers repères discrets à venir)
            for (let i = 0; i < heartStars.length; i++) {
                const star = heartStars[i];
                const cx = star.x;
                const cy = star.y;
                const isLit = i < constellationProgress;
                const isNext = i === constellationProgress && stargazePhase;
                const isUpcomingPreview = (i === constellationProgress + 1 || i === constellationProgress + 2) && stargazePhase && skyExpandBlend > 0.6;

                if (isLit) {
                    const beatGlow = isHeartDone ? (15 + Math.sin(t * 3.4 + i * 0.4) * 4) : 14;
                    const glowG = ctx.createRadialGradient(cx, cy, 1, cx, cy, beatGlow);
                    glowG.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
                    glowG.addColorStop(0.42, isHeartDone ? 'rgba(255, 198, 220, 0.62)' : 'rgba(0, 245, 212, 0.55)');
                    glowG.addColorStop(1, 'rgba(0, 245, 212, 0)');
                    ctx.fillStyle = glowG;
                    ctx.beginPath();
                    ctx.arc(cx, cy, beatGlow, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#FFFFFF';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3.0, 0, Math.PI * 2);
                    ctx.fill();
                } else if (isNext && skyExpandBlend > 0.45) {
                    const pulse = 0.5 + 0.5 * Math.sin(t * 4.4);
                    const ringR = 11 + (1 - pulse) * 11;

                    // Halo doré/turquoise chaleureux qui invite clairement à toucher ou glisser dessus
                    const targetHalo = ctx.createRadialGradient(cx, cy, 1, cx, cy, 24);
                    targetHalo.addColorStop(0, `rgba(255, 246, 210, ${(0.88 * skyExpandBlend).toFixed(3)})`);
                    targetHalo.addColorStop(0.45, `rgba(0, 245, 212, ${(0.42 * skyExpandBlend).toFixed(3)})`);
                    targetHalo.addColorStop(1, 'rgba(0, 245, 212, 0)');
                    ctx.fillStyle = targetHalo;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
                    ctx.fill();

                    // Anneau qui pulse doucement
                    ctx.strokeStyle = `rgba(255, 232, 168, ${((0.35 + pulse * 0.55) * skyExpandBlend).toFixed(3)})`;
                    ctx.lineWidth = 1.6;
                    ctx.beginPath();
                    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
                    ctx.stroke();

                    // Petite étoile à 4 branches scintillante au centre de la cible
                    const rayLen = 6 + pulse * 3.5;
                    ctx.strokeStyle = `rgba(255, 252, 238, ${(0.9 * skyExpandBlend).toFixed(3)})`;
                    ctx.lineWidth = 1.2;
                    ctx.beginPath();
                    ctx.moveTo(cx - rayLen, cy);
                    ctx.lineTo(cx + rayLen, cy);
                    ctx.moveTo(cx, cy - rayLen);
                    ctx.lineTo(cx, cy + rayLen);
                    ctx.stroke();

                    ctx.fillStyle = '#FFFDF4';
                    ctx.beginPath();
                    ctx.arc(cx, cy, 3.6, 0, Math.PI * 2);
                    ctx.fill();
                } else if (isUpcomingPreview) {
                    // Tout petit point discret pour la prochaine étoile d'après
                    const softTwinkle = (0.18 + 0.14 * Math.sin(t * 2.6 + i)) * skyExpandBlend;
                    ctx.fillStyle = `rgba(210, 245, 255, ${softTwinkle.toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 1.9, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Ondes lumineuses concentriques à chaque étoile attrapée
            for (let i = heartPulseWaves.length - 1; i >= 0; i--) {
                const pw = heartPulseWaves[i];
                pw.r += (pw.maxR - pw.r) * dt * 3.4;
                pw.alpha -= dt * 0.95;
                if (pw.alpha <= 0.01) {
                    heartPulseWaves.splice(i, 1);
                    continue;
                }
                ctx.strokeStyle = pw.warm
                    ? `rgba(255, 210, 224, ${pw.alpha.toFixed(3)})`
                    : `rgba(0, 245, 212, ${pw.alpha.toFixed(3)})`;
                ctx.lineWidth = 1.6;
                ctx.beginPath();
                ctx.arc(pw.x, pw.y, pw.r, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Lucioles guides envoyées vers la prochaine étoile si Clara touche ailleurs dans le ciel
            for (let i = guidingWisps.length - 1; i >= 0; i--) {
                const w = guidingWisps[i];
                w.progress += dt * 1.45;
                if (w.progress >= 1) {
                    guidingWisps.splice(i, 1);
                    continue;
                }
                const u = w.progress;
                const inv = 1 - u;
                const wx = inv * inv * w.startX + 2 * inv * u * w.ctrlX + u * u * w.targetX;
                const wy = inv * inv * w.startY + 2 * inv * u * w.ctrlY + u * u * w.targetY;
                const wAlpha = Math.sin(u * Math.PI) * 0.92;

                const wGrad = ctx.createRadialGradient(wx, wy, 0.5, wx, wy, 10);
                wGrad.addColorStop(0, `rgba(255, 250, 224, ${wAlpha})`);
                wGrad.addColorStop(0.55, `rgba(0, 245, 212, ${wAlpha * 0.65})`);
                wGrad.addColorStop(1, 'rgba(0, 245, 212, 0)');
                ctx.fillStyle = wGrad;
                ctx.beginPath();
                ctx.arc(wx, wy, 10, 0, Math.PI * 2);
                ctx.fill();
            }

            // Éclats d'étoiles lors du toucher
            for (let i = starBursts.length - 1; i >= 0; i--) {
                const sb = starBursts[i];
                sb.x += sb.vx * dt;
                sb.y += sb.vy * dt;
                sb.vx *= 0.95;
                sb.vy *= 0.95;
                sb.life -= dt;
                if (sb.life <= 0) {
                    starBursts.splice(i, 1);
                    continue;
                }
                const alpha = Math.min(1, sb.life);
                ctx.fillStyle = sb.warm
                    ? `rgba(255, 232, 186, ${alpha})`
                    : `rgba(210, 255, 250, ${alpha})`;
                ctx.beginPath();
                ctx.arc(sb.x, sb.y, sb.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }

        // 2. GRANDE ÉTENDUE D'EAU PEU PROFONDE SUR LA PLAGE (entre horizonY et shorelineY)
        const waterGrad = ctx.createLinearGradient(0, horizonY, 0, shorelineY);
        waterGrad.addColorStop(0.0, '#051124');
        waterGrad.addColorStop(0.45, '#071B34');
        waterGrad.addColorStop(0.85, '#09233E');
        waterGrad.addColorStop(1.0, '#0D2B45');
        ctx.fillStyle = waterGrad;
        ctx.fillRect(0, horizonY, width, shorelineY - horizonY + 4);

        // Reflets des étoiles à la surface du film d'eau calme
        ctx.save();
        for (let i = 0; i < 45; i++) {
            const st = stars[i * 5];
            if (!st) continue;
            const rx = st.nx * width + Math.sin(t * 1.5 + i) * 4;
            const ry = horizonY + (1 - st.ny) * (shorelineY - horizonY) * 0.65;
            ctx.fillStyle = 'rgba(200, 230, 255, 0.14)';
            ctx.fillRect(rx - 4, ry, 8, 1.1);
        }
        ctx.restore();

        // Bancs de phytoplancton ambiants très doux sous l'eau
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < ambientPlanktonPatches.length; i++) {
            const p = ambientPlanktonPatches[i];
            const px = p.nx * width + Math.sin(t * p.driftSpeed + p.phase) * 18;
            const py = horizonY + (p.ny - 0.43) * height;
            const pulse = 0.022 + 0.022 * Math.sin(t * 1.4 + p.phase);
            const g = ctx.createRadialGradient(px, py, 2, px, py, p.rx);
            g.addColorStop(0, `rgba(0, 245, 212, ${pulse})`);
            g.addColorStop(0.6, `rgba(0, 180, 255, ${pulse * 0.45})`);
            g.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(px, py, p.rx, p.ry, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 3. VAGUE LOINTAINE QUI EXPLOSE CONTRE LE SOL AVEC RÉVERBÉRATION (sur l'horizon)
        if (distantWave) {
            const wx = distantWave.xNorm * width;
            const ww = distantWave.widthNorm * width;
            const wy = horizonY + 3;

            const wAlpha = distantWave.alpha;
            const waveGrad = ctx.createRadialGradient(wx, wy, 4, wx, wy, ww * 0.65);
            waveGrad.addColorStop(0, `rgba(235, 250, 255, ${wAlpha * 0.85})`);
            waveGrad.addColorStop(0.45, `rgba(0, 245, 212, ${wAlpha * 0.35})`);
            waveGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = waveGrad;
            ctx.beginPath();
            ctx.ellipse(wx, wy, ww * 0.6, 12 + distantWave.crestH, 0, Math.PI, Math.PI * 2);
            ctx.fill();

            if (distantWave.shockRadius > 0) {
                ctx.save();
                ctx.strokeStyle = `rgba(180, 245, 255, ${Math.max(0, wAlpha * 0.4)})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(wx, wy + 6, distantWave.shockRadius, distantWave.shockRadius * 0.28, 0, 0, Math.PI);
                ctx.stroke();
                ctx.restore();
            }
        }

        // 4. LE SABLE EN BAS DE L'ÉCRAN (départ du joueur + Alexis assis)
        const sandGrad = ctx.createLinearGradient(0, shorelineY - 6, 0, height);
        sandGrad.addColorStop(0.0, '#10253A');
        sandGrad.addColorStop(0.14, '#1D222B');
        sandGrad.addColorStop(0.45, '#252326');
        sandGrad.addColorStop(1.0, '#19171A');
        ctx.fillStyle = sandGrad;
        ctx.fillRect(0, shorelineY, width, height - shorelineY);

        // Ligne d'écume fine et irisée entre le sable et le film d'eau
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.22)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 16) {
            const sy = shorelineY + Math.sin(x * 0.03 + t * 1.8) * 2.5;
            if (x === 0) ctx.moveTo(x, sy);
            else ctx.lineTo(x, sy);
        }
        ctx.stroke();
        ctx.restore();

        // Empreintes de pas dans le sable
        for (let i = sandFootprints.length - 1; i >= 0; i--) {
            const fp = sandFootprints[i];
            fp.life -= dt * 0.25;
            if (fp.life <= 0) {
                sandFootprints.splice(i, 1);
                continue;
            }
            ctx.fillStyle = `rgba(8, 12, 18, ${fp.life * 0.45})`;
            ctx.beginPath();
            ctx.ellipse(fp.x, fp.y, 3.2, 5.2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. ONDES ET PARTICULES DE PHYTOPLANCTON BLEU TURQUOISE
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        // Ondes concentriques turquoise dans l'eau
        for (let i = planktonRipples.length - 1; i >= 0; i--) {
            const rp = planktonRipples[i];
            rp.rx += (rp.maxRx - rp.rx) * dt * 2.5;
            rp.ry = rp.rx * 0.42;
            rp.alpha -= dt * 0.36;
            if (rp.alpha <= 0.01) {
                planktonRipples.splice(i, 1);
                continue;
            }
            ctx.strokeStyle = `rgba(0, 245, 212, ${rp.alpha * 0.72})`;
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(rp.x, rp.y, rp.rx, rp.ry, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Particules lumineuses de phytoplancton
        for (let i = planktonParticles.length - 1; i >= 0; i--) {
            const pt = planktonParticles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vx *= 0.94;
            pt.vy *= 0.94;
            pt.life -= dt;
            if (pt.life <= 0) {
                planktonParticles.splice(i, 1);
                continue;
            }
            const a = Math.min(1, pt.life / 0.8) * 0.55;
            const pGrad = ctx.createRadialGradient(pt.x, pt.y, 0.2, pt.x, pt.y, pt.r * 2.6);
            pGrad.addColorStop(0, `rgba(200, 255, 248, ${a})`);
            pGrad.addColorStop(0.45, `rgba(0, 245, 212, ${a * 0.65})`);
            pGrad.addColorStop(1, 'rgba(0, 190, 255, 0)');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.r * 2.6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Aura bioluminescente bleu turquoise adoucie autour de Clara dans l'eau
        const inWater = player.y < shorelineY && player.hugBlend < 0.3;
        if (inWater) {
            const auraRadius = 30 + player.glowIntensity * 28;
            const auraAlpha = 0.12 + player.glowIntensity * 0.26;
            const waterContactY = player.y + 8;
            const auraGrad = ctx.createRadialGradient(
                player.x, waterContactY, 3,
                player.x, waterContactY, auraRadius
            );
            auraGrad.addColorStop(0.0, `rgba(170, 255, 246, ${auraAlpha})`);
            auraGrad.addColorStop(0.42, `rgba(0, 245, 212, ${auraAlpha * 0.68})`);
            auraGrad.addColorStop(0.75, `rgba(0, 180, 255, ${auraAlpha * 0.28})`);
            auraGrad.addColorStop(1, 'rgba(0, 150, 255, 0)');
            ctx.fillStyle = auraGrad;
            ctx.beginPath();
            ctx.ellipse(player.x, waterContactY, auraRadius, auraRadius * 0.52, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 6. DESSIN D'ALEXIS & CLARA (soit en câlin assis côte à côte sur la plage, soit séparés)
        if (player.hugBlend > 0.35) {
            drawMidnightSeatedHug(alexis, player, t);
        } else if (alexis.y < player.y) {
            drawMidnightAlexisSeated(alexis, player, t);
            drawMidnightClara(player, t);
        } else {
            drawMidnightClara(player, t);
            drawMidnightAlexisSeated(alexis, player, t);
        }

        // Petits coeurs flottants au-dessus du câlin
        for (let i = hugHearts.length - 1; i >= 0; i--) {
            const hh = hugHearts[i];
            hh.x += hh.vx * dt;
            hh.y += hh.vy * dt;
            hh.life -= dt * 0.65;
            if (hh.life <= 0) {
                hugHearts.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = clamp(hh.life, 0, 1) * 0.85;
            ctx.fillStyle = '#FF758F';
            ctx.font = `${Math.round(hh.size)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♥', hh.x, hh.y);
            ctx.restore();
        }

        ctx.restore();
    }

    // Dessine une coupe de cheveux bruns naturelle, harmonieuse et élégante pour Alexis
    function drawAlexisHair(lookX, headY) {
        const hairGrad = ctx.createLinearGradient(lookX, headY - 10, lookX, headY + 6);
        hairGrad.addColorStop(0, '#4A2E1D');
        hairGrad.addColorStop(0.55, '#341E11');
        hairGrad.addColorStop(1, '#24130A');
        ctx.fillStyle = hairGrad;

        ctx.beginPath();
        ctx.moveTo(lookX - 8.2, headY + 1.5);
        ctx.bezierCurveTo(lookX - 9.4, headY - 4.5, lookX - 6.5, headY - 10.2, lookX, headY - 10.4);
        ctx.bezierCurveTo(lookX + 6.5, headY - 10.2, lookX + 9.4, headY - 4.5, lookX + 8.2, headY + 1.5);
        ctx.quadraticCurveTo(lookX + 6.2, headY + 5.2, lookX + 3.4, headY + 5.8);
        ctx.quadraticCurveTo(lookX, headY + 6.4, lookX - 3.4, headY + 5.8);
        ctx.quadraticCurveTo(lookX - 6.2, headY + 5.2, lookX - 8.2, headY + 1.5);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(115, 76, 48, 0.38)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.arc(lookX - 2.5, headY - 3, 4.5, Math.PI * 1.1, Math.PI * 1.85);
        ctx.moveTo(lookX + 1.5, headY - 7.2);
        ctx.quadraticCurveTo(lookX + 5.2, headY - 4.5, lookX + 4.8, headY + 1);
        ctx.stroke();
    }

    // Dessine Alexis assis seul sur la plage (plus fin, élégant et harmonieux, tout beige couleur peau)
    function drawMidnightAlexisSeated(ax, clara, t) {
        const persp = 0.78 + 0.28 * ((ax.y - horizonY) / Math.max(100, height - horizonY));
        const skinBase = '#E5C0A1';
        const skinShade = '#D4AA88';
        const skinHighlight = '#F0D1B7';

        const lookDx = clamp((clara.x - ax.x) * 0.014, -2.8, 2.8);
        const breath = Math.sin(t * 1.8) * 0.45;

        ctx.save();
        ctx.translate(ax.x, ax.y);
        ctx.scale(persp, persp);

        // Ombre douce sur le sable
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.beginPath();
        ctx.ellipse(0, 12, 14, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jambes repliées naturellement vers l'avant (genoux relevés en douceur devant lui)
        ctx.fillStyle = skinShade;
        ctx.beginPath();
        ctx.ellipse(-5.8, 3.5, 3.6, 7.2, -0.22, 0, Math.PI * 2);
        ctx.ellipse(5.8, 3.5, 3.6, 7.2, 0.22, 0, Math.PI * 2);
        ctx.fill();

        // Bras gauche en appui léger et naturel sur le sable, bras droit posé sur son genou
        ctx.strokeStyle = skinShade;
        ctx.lineWidth = 3.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-8.8, -17 + breath);
        ctx.quadraticCurveTo(-11.5, -5, -10.2, 9.5);
        ctx.moveTo(8.8, -17 + breath);
        ctx.quadraticCurveTo(11.2, -7, 7.5, 1.5);
        ctx.stroke();

        // Dos d'Alexis : silhouette fine, élancée et athlétique (entièrement beige)
        const torsoGrad = ctx.createLinearGradient(-9, -22, 9, 10);
        torsoGrad.addColorStop(0, skinHighlight);
        torsoGrad.addColorStop(0.55, skinBase);
        torsoGrad.addColorStop(1, skinShade);
        ctx.fillStyle = torsoGrad;

        ctx.beginPath();
        ctx.moveTo(-9.2, -18.5 + breath);
        ctx.quadraticCurveTo(0, -21 + breath, 9.2, -18.5 + breath);
        ctx.bezierCurveTo(9.0, -10, 7.4, -1, 7.0, 8.5);
        ctx.quadraticCurveTo(0, 12, -7.0, 8.5);
        ctx.bezierCurveTo(-7.4, -1, -9.0, -10, -9.2, -18.5 + breath);
        ctx.closePath();
        ctx.fill();

        // Assise / hanches fines posées sur le sable
        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.ellipse(0, 8.8, 7.4, 3.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sillon discret et fin de la colonne vertébrale
        ctx.strokeStyle = 'rgba(165, 115, 84, 0.28)';
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(0, -16 + breath);
        ctx.lineTo(0, 4.5);
        ctx.stroke();

        // Cou fin et tête bien proportionnée
        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.roundRect(-2.6 + lookDx * 0.25, -24.5 + breath, 5.2, 6.8, 2);
        ctx.fill();

        const headX = lookDx * 0.45;
        const headY = -30.5 + breath;
        ctx.beginPath();
        ctx.arc(headX, headY, 8.0, 0, Math.PI * 2);
        ctx.fill();

        // Coupe de cheveux bruns soignée
        drawAlexisHair(headX, headY);

        ctx.restore();
    }

    // Dessine Clara assise tout contre Alexis sur le sable en train de lui faire un câlin
    function drawMidnightSeatedHug(ax, clara, t) {
        const persp = 0.78 + 0.28 * ((ax.y - horizonY) / Math.max(100, height - horizonY));
        const alexisSkin = '#E5C0A1';
        const alexisShade = '#D4AA88';
        const alexisHighlight = '#F0D1B7';

        const claraSkin = '#E6C1A3';
        const claraShade = '#D7AD8C';
        const claraHighlight = '#F1D2B8';

        const sway = Math.sin(t * 1.5) * 0.6;
        const breath = Math.sin(t * 1.9) * 0.4;

        ctx.save();
        ctx.translate(ax.x + 7 * persp, ax.y);
        ctx.scale(persp, persp);

        // Ombre commune sur le sable sous le couple enlacé
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.beginPath();
        ctx.ellipse(0, 12.5, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jambes repliées d'Alexis (à gauche) et de Clara (à droite)
        ctx.fillStyle = alexisShade;
        ctx.beginPath();
        ctx.ellipse(-11.5, 3.8, 3.4, 7, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = claraShade;
        ctx.beginPath();
        ctx.ellipse(11.5, 4.2, 3.3, 6.8, 0.22, 0, Math.PI * 2);
        ctx.fill();

        // --- CORPS D'ALEXIS (à gauche, penché tendrement vers Clara) ---
        const aGrad = ctx.createLinearGradient(-15, -22, -1, 10);
        aGrad.addColorStop(0, alexisHighlight);
        aGrad.addColorStop(0.55, alexisSkin);
        aGrad.addColorStop(1, alexisShade);
        ctx.fillStyle = aGrad;

        ctx.beginPath();
        ctx.moveTo(-15.2 + sway * 0.3, -18.5 + breath);
        ctx.quadraticCurveTo(-6.5 + sway * 0.3, -21 + breath, 1.8 + sway * 0.3, -17.5 + breath);
        ctx.bezierCurveTo(1.5, -9, 0.2, 0, -0.5, 8.5);
        ctx.quadraticCurveTo(-7.2, 12, -13.8, 8.5);
        ctx.bezierCurveTo(-14.2, 0, -15.0, -9, -15.2 + sway * 0.3, -18.5 + breath);
        ctx.closePath();
        ctx.fill();

        // Bras gauche d'Alexis posé sur le sable
        ctx.strokeStyle = alexisShade;
        ctx.lineWidth = 3.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-14.5 + sway * 0.3, -16.5 + breath);
        ctx.quadraticCurveTo(-17.5, -5, -16, 9.5);
        ctx.stroke();

        // --- CORPS DE CLARA (assise tout contre Alexis à droite, blottie contre lui) ---
        const cGrad = ctx.createLinearGradient(-1, -20, 15, 10);
        cGrad.addColorStop(0, claraHighlight);
        cGrad.addColorStop(0.55, claraSkin);
        cGrad.addColorStop(1, claraShade);
        ctx.fillStyle = cGrad;

        ctx.beginPath();
        ctx.moveTo(-1.2 + sway * 0.3, -16.8 + breath);
        ctx.quadraticCurveTo(6.5 + sway * 0.3, -19.5 + breath, 13.8 + sway * 0.3, -16.2 + breath);
        ctx.bezierCurveTo(13.2, -8, 12.2, 0, 11.8, 8.8);
        ctx.quadraticCurveTo(5.2, 12.2, -0.8, 8.8);
        ctx.closePath();
        ctx.fill();

        // Courbe des hanches beiges de Clara assise sur le sable
        ctx.fillStyle = claraSkin;
        ctx.beginPath();
        ctx.ellipse(5.8, 9.2, 6.8, 3.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- TÊTE D'ALEXIS (inclinée doucement vers celle de Clara) ---
        const aHeadX = -5.5 + sway * 0.4;
        const aHeadY = -29.8 + breath;
        ctx.fillStyle = alexisSkin;
        ctx.fillRect(aHeadX - 2.4, -24 + breath, 4.8, 6.2);
        ctx.beginPath();
        ctx.arc(aHeadX, aHeadY, 7.9, 0, Math.PI * 2);
        ctx.fill();
        drawAlexisHair(aHeadX, aHeadY);

        // --- TÊTE ET LONGS CHEVEUX BRUNS DE CLARA (posée sur l'épaule d'Alexis) ---
        const cHeadX = 4.2 + sway * 0.4;
        const cHeadY = -27.2 + breath;
        ctx.fillStyle = claraSkin;
        ctx.fillRect(cHeadX - 2.3, -22 + breath, 4.6, 5.8);
        ctx.beginPath();
        ctx.arc(cHeadX, cHeadY, 7.6, 0, Math.PI * 2);
        ctx.fill();

        // Longs cheveux bruns de Clara qui tombent dans son dos
        const hairGrad = ctx.createLinearGradient(cHeadX, cHeadY - 9, cHeadX + 2, 2);
        hairGrad.addColorStop(0, '#4B2E1B');
        hairGrad.addColorStop(0.5, '#382012');
        hairGrad.addColorStop(1, '#27150B');
        ctx.fillStyle = hairGrad;

        ctx.beginPath();
        ctx.arc(cHeadX, cHeadY - 1, 8.3, Math.PI * 0.85, Math.PI * 2.15);
        ctx.bezierCurveTo(cHeadX + 10, cHeadY + 7, cHeadX + 10.5, -6, cHeadX + 8, 2);
        ctx.quadraticCurveTo(cHeadX + 3.5, 5, cHeadX + 0.5, 3);
        ctx.quadraticCurveTo(cHeadX - 3, 5, cHeadX - 6.5, 1.5);
        ctx.bezierCurveTo(cHeadX - 8.5, -6, cHeadX - 8.5, cHeadY + 7, cHeadX - 8.1, cHeadY);
        ctx.closePath();
        ctx.fill();

        // --- BRAS ENLACÉS (CÂLIN) : leurs bras qui s'entourent mutuellement le dos ---
        ctx.strokeStyle = alexisSkin;
        ctx.lineWidth = 3.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0.5 + sway * 0.3, -16.5 + breath);
        ctx.quadraticCurveTo(7.5 + sway * 0.3, -14.5 + breath, 12.8 + sway * 0.3, -11.5 + breath);
        ctx.stroke();

        ctx.strokeStyle = claraSkin;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(0.2 + sway * 0.3, -13.5 + breath);
        ctx.quadraticCurveTo(-7.2 + sway * 0.3, -10.5 + breath, -13.2 + sway * 0.3, -7.5 + breath);
        ctx.stroke();

        ctx.restore();
    }

    function drawMidnightClara(p) {
        const waterProgress = p.y >= shorelineY
            ? 0
            : Math.min(1, (shorelineY - p.y) / Math.max(80, (shorelineY - horizonY) * 0.42));

        const persp = 0.78 + 0.28 * ((p.y - horizonY) / Math.max(100, height - horizonY));

        const speed = Math.hypot(p.vx, p.vy);
        const legSwing = speed > 8 ? Math.sin(p.walkCycle) * 5.5 : 0;
        const armSwing = speed > 8 ? Math.cos(p.walkCycle) * 4.5 : 0;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(persp, persp);

        const waterLineLocalY = 29 - waterProgress * 26;

        // Ombre douce sur le sable quand elle est hors de l'eau
        if (waterProgress < 0.2) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
            ctx.beginPath();
            ctx.ellipse(0, 28, 12, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Clip au-dessus de la surface de l'eau pour que ses jambes s'immergent jusqu'aux fesses maximum
        ctx.save();
        ctx.beginPath();
        ctx.rect(-60, -80, 120, waterLineLocalY + 80);
        ctx.clip();

        const skinBase = '#E6C1A3';
        const skinShade = '#D7AD8C';
        const skinHighlight = '#F1D2B8';

        // Jambes beiges
        ctx.strokeStyle = skinBase;
        ctx.lineWidth = 6.2;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(-4.8, 3);
        ctx.lineTo(-5.2 - legSwing * 0.2, 26 + legSwing * 0.45);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(4.8, 3);
        ctx.lineTo(5.2 + legSwing * 0.2, 26 - legSwing * 0.45);
        ctx.stroke();

        // Bras beiges
        ctx.strokeStyle = skinShade;
        ctx.lineWidth = 4.6;
        ctx.beginPath();
        ctx.moveTo(-11, -26);
        ctx.quadraticCurveTo(-15, -14, -12.5, -3 + armSwing);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(11, -26);
        ctx.quadraticCurveTo(15, -14, 12.5, -3 - armSwing);
        ctx.stroke();

        // Dos et taille (entièrement beige couleur peau)
        const bodyGrad = ctx.createLinearGradient(-11, -30, 11, 5);
        bodyGrad.addColorStop(0, skinHighlight);
        bodyGrad.addColorStop(0.6, skinBase);
        bodyGrad.addColorStop(1, skinShade);
        ctx.fillStyle = bodyGrad;

        ctx.beginPath();
        ctx.moveTo(-11.5, -28);
        ctx.quadraticCurveTo(0, -31, 11.5, -28);
        ctx.lineTo(8.5, -10);
        ctx.quadraticCurveTo(10.5, -2, 9.8, 3);
        ctx.lineTo(-9.8, 3);
        ctx.quadraticCurveTo(-10.5, -2, -8.5, -10);
        ctx.closePath();
        ctx.fill();

        // Courbe des hanches / fesses (couleur peau beige)
        ctx.fillStyle = skinBase;
        ctx.beginPath();
        ctx.arc(-4.6, 1.2, 5.4, 0, Math.PI * 2);
        ctx.arc(4.6, 1.2, 5.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(168, 118, 86, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(0, -4);
        ctx.stroke();

        // Cou et Tête
        ctx.fillStyle = skinBase;
        ctx.fillRect(-3.2, -36, 6.4, 8);
        ctx.beginPath();
        ctx.arc(0, -43, 9.5, 0, Math.PI * 2);
        ctx.fill();

        // LONGS CHEVEUX BRUNS
        const sway = p.hairSway;
        const hairGrad = ctx.createLinearGradient(0, -53, 0, -6);
        hairGrad.addColorStop(0, '#4B2E1B');
        hairGrad.addColorStop(0.5, '#382012');
        hairGrad.addColorStop(1, '#27150B');
        ctx.fillStyle = hairGrad;

        ctx.beginPath();
        ctx.arc(0, -44.5, 10.4, Math.PI * 0.85, Math.PI * 2.15);
        ctx.bezierCurveTo(12.5, -34, 13 + sway * 0.7, -18, 9.5 + sway, -8);
        ctx.quadraticCurveTo(4 + sway, -4, 0 + sway * 0.9, -6.5);
        ctx.quadraticCurveTo(-4 + sway, -4, -9.5 + sway, -8);
        ctx.bezierCurveTo(-13 + sway * 0.7, -18, -12.5, -34, -10.2, -43);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(120, 78, 48, 0.45)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-4, -48);
        ctx.quadraticCurveTo(-6 + sway * 0.5, -26, -5 + sway, -10);
        ctx.moveTo(4, -48);
        ctx.quadraticCurveTo(6 + sway * 0.5, -26, 5 + sway, -10);
        ctx.stroke();

        ctx.restore();

        // Ligne d'eau lumineuse bleu turquoise adoucie autour de ses jambes / fesses
        if (waterProgress > 0.02) {
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            const glowAlpha = 0.24 + p.glowIntensity * 0.30;
            ctx.strokeStyle = `rgba(0, 245, 212, ${glowAlpha})`;
            ctx.lineWidth = 1.9;
            ctx.beginPath();
            ctx.ellipse(0, waterLineLocalY, 13, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        ctx.restore();
    }

    function loop(now) {
        if (!isRunning) return;
        const dt = clamp((now - lastTime) / 1000, 0.001, 0.05);
        lastTime = now;

        // 1. Calcul de la vitesse et direction de Clara (tactile, souris ou clavier)
        let desiredVx = 0;
        let desiredVy = 0;
        let wantsToLeaveHug = false;

        if (!stargazePhase) {
            if (player.targetX !== null && player.targetY !== null) {
                const distTargetFromAlexis = Math.hypot(player.targetX - (alexis.x + 14), player.targetY - alexis.y);
                if (player.isHugging && distTargetFromAlexis > 42) {
                    wantsToLeaveHug = true;
                }
                const dx = player.targetX - player.x;
                const dy = player.targetY - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 6) {
                    const factor = Math.min(1, dist / 42);
                    desiredVx = (dx / dist) * PLAYER_MAX_SPEED * factor;
                    desiredVy = (dy / dist) * PLAYER_MAX_SPEED * factor;
                }
            } else {
                const kx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
                const ky = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
                const kLen = Math.hypot(kx, ky);
                if (kLen > 0) {
                    desiredVx = (kx / kLen) * PLAYER_MAX_SPEED;
                    desiredVy = (ky / kLen) * PLAYER_MAX_SPEED;
                    if (player.isHugging) {
                        const moveAwayDot = kx * (player.x - alexis.x) + ky * (player.y - alexis.y);
                        if (moveAwayDot > 0 || ky < 0) {
                            wantsToLeaveHug = true;
                        }
                    }
                }
            }
        }

        if (wantsToLeaveHug && !stargazePhase) {
            player.isHugging = false;
            postSwimHugTimer = 0;
            if (hasPlayedInWater) {
                nightAudio.pauseRomanticMusic();
            }
        }

        // Transition fluide du ciel étoilé pendant la suite (stargazePhase)
        if (stargazePhase) {
            skyExpandBlend += (1 - skyExpandBlend) * Math.min(1, dt * 2.1);
            horizonY = baseHorizonY + (height * 0.76 - baseHorizonY) * skyExpandBlend;
            shorelineY = baseShorelineY + (height * 0.86 - baseShorelineY) * skyExpandBlend;
            alexis.x = width * (0.36 + 0.12 * skyExpandBlend);
            alexis.y = shorelineY + (height - shorelineY) * 0.48;
            player.isHugging = true;
        }

        if (lastArcDrawProgress < 1) {
            lastArcDrawProgress = Math.min(1, lastArcDrawProgress + dt * 2.8);
        }

        // Distance entre Clara et la place assise juste à droite d'Alexis sur le sable
        const seatX = alexis.x + 14;
        const seatY = alexis.y;
        const distToSeat = Math.hypot(player.x - seatX, player.y - seatY);

        if (!player.isHugging && player.y >= shorelineY - 8 && distToSeat < 34 && !wantsToLeaveHug) {
            player.isHugging = true;
            // Dès que Clara revient vers Alexis après avoir joué dans l'eau : lance la petite musique calme !
            if (hasPlayedInWater) {
                nightAudio.startRomanticMusic();
            }
        }

        if (player.isHugging) {
            player.hugBlend += (1 - player.hugBlend) * Math.min(1, dt * 8);
            player.x += (seatX - player.x) * Math.min(1, dt * 10);
            player.y += (seatY - player.y) * Math.min(1, dt * 10);
            player.vx *= 0.6;
            player.vy *= 0.6;

            hugHeartTimer -= dt;
            if (hugHeartTimer <= 0) {
                hugHeartTimer = 0.75 + Math.random() * 0.45;
                hugHearts.push({
                    x: alexis.x + 7 + (Math.random() - 0.5) * 18,
                    y: alexis.y - 34,
                    vx: (Math.random() - 0.5) * 10,
                    vy: -18 - Math.random() * 10,
                    size: 11 + Math.random() * 4,
                    life: 1.25
                });
            }

            // Déclenchement de la suite : uniquement APRÈS qu'elle est allée jouer dans l'eau,
            // qu'elle est revenue faire un câlin (musique calme lancée), et après une douce pause (4.5s)
            if (hasPlayedInWater && !stargazePhase) {
                if (nightAudio.getMusicMode() === 'idle') {
                    nightAudio.startRomanticMusic();
                }
                postSwimHugTimer += dt;
                if (postSwimHugTimer >= POST_SWIM_HUG_DELAY_SEC) {
                    stargazePhase = true;
                    stargazeIdleTimer = 0;
                    // N'affiche aucun texte tout de suite : on attend 10 secondes si elle ne comprend pas toute seule
                    fsHint.style.opacity = '0';
                }
            }
        } else {
            player.hugBlend += (0 - player.hugBlend) * Math.min(1, dt * 9);
            player.vx += (desiredVx - player.vx) * Math.min(1, dt * 10);
            player.vy += (desiredVy - player.vy) * Math.min(1, dt * 10);

            player.x = clamp(player.x + player.vx * dt, 26, width - 26);
            player.y = clamp(player.y + player.vy * dt, horizonY + 26, height - 30);
        }

        // Si l'écran est tourné vers le ciel et qu'elle n'a toujours pas touché les étoiles après 10 secondes,
        // affiche uniquement « touche les étoiles la haut » en plus petit
        if (stargazePhase && constellationProgress === 0 && !finaleShown) {
            stargazeIdleTimer += dt;
            if (stargazeIdleTimer >= STARGAZE_HINT_DELAY_SEC) {
                fsHint.textContent = UI_TEXTS.MIDNIGHT_SWIM.STARGAZE_HINT;
                fsHint.style.fontSize = '0.75rem';
                fsHint.style.opacity = '1';
            }
        }

        // Dès que les 12 étoiles du cœur sont complétées : fermeture finale, musique qui s'emballe,
        // contemplation sous les étoiles puis retour au menu après 16s
        if (stargazePhase && constellationProgress >= HEART_STAR_COUNT && !finaleShown) {
            closingArcProgress = Math.min(1, closingArcProgress + dt * 2.1);
            if (closingArcProgress >= 0.85) {
                heartRevealBlend = Math.min(1, heartRevealBlend + dt * 1.1);
            }
            if (heartRevealBlend >= 1) {
                constellationCompletedTimer += dt;
                if (constellationCompletedTimer >= CONSTELLATION_RETURN_MENU_SEC) {
                    finaleShown = true;
                    closeFullscreenGame();
                    closeModal();
                    return;
                }
            }
        }

        const speed = Math.hypot(player.vx, player.vy);
        if (speed > 5 && !player.isHugging) {
            player.walkCycle += dt * (speed * 0.085);
        }
        const targetHairSway = clamp(-player.vx * 0.045, -7, 7);
        player.hairSway += (targetHairSway - player.hairSway) * Math.min(1, dt * 8);

        const inWater = player.y < shorelineY && !player.isHugging;

        // 2. Aura et traînée de phytoplancton bleu turquoise
        if (inWater) {
            waterPlayTime += dt;
            if (waterPlayTime >= MIN_WATER_PLAY_SEC && !hasPlayedInWater) {
                hasPlayedInWater = true;
            }
            if (!hasUnlockedSouvenir) {
                unlockMidnightSouvenir();
                fsHint.style.opacity = '0';
            }

            const moveFactor = Math.min(1, speed / 95);
            const targetGlow = 0.14 + moveFactor * 0.72;
            player.glowIntensity += (targetGlow - player.glowIntensity) * Math.min(1, dt * 6);

            stepDistAccum += speed * dt;
            if (speed > 12) {
                spawnPlankton(player.x, player.y + 8, player.vx, player.vy, Math.ceil(1 + moveFactor * 3));
                if (stepDistAccum > 26) {
                    stepDistAccum = 0;
                    spawnPlanktonRipple(player.x, player.y + 8, 0.65 + moveFactor * 0.45);
                }
            }
        } else {
            player.glowIntensity *= Math.max(0, 1 - dt * 4);
            stepDistAccum += speed * dt;
            if (speed > 12 && stepDistAccum > 22 && !player.isHugging) {
                stepDistAccum = 0;
                sandFootprints.push({
                    x: player.x + (Math.random() - 0.5) * 6,
                    y: player.y + 24,
                    life: 1.0
                });
            }
        }

        // 3. Étoiles filantes périodiques (plus fréquentes quand le cœur brille au climax)
        nextShootingStarTimer -= dt;
        if (nextShootingStarTimer <= 0) {
            const climaxActive = constellationProgress >= HEART_STAR_COUNT;
            nextShootingStarTimer = climaxActive
                ? (1.1 + Math.random() * 1.4)
                : ((stargazePhase ? 2.2 : 4.5) + Math.random() * (stargazePhase ? 2.5 : 5.5));
            const startX = width * (0.15 + Math.random() * 0.7);
            const startY = horizonY * (0.08 + Math.random() * 0.45);
            const dir = Math.random() < 0.5 ? 1 : -1;
            shootingStars.push({
                x: startX,
                y: startY,
                vx: dir * (220 + Math.random() * 140),
                vy: 95 + Math.random() * 75,
                life: 0.65 + Math.random() * 0.35
            });
        }

        // 4. Vagues au loin qui s'explosent contre le sol avec un bruit énorme et très grave dans le silence
        if (inWater) {
            nextBoomWaveTimer -= dt;
            if (nextBoomWaveTimer <= 0 && !distantWave) {
                nextBoomWaveTimer = 9.5 + Math.random() * 4.5;
                distantWave = {
                    xNorm: 0.22 + Math.random() * 0.56,
                    widthNorm: 0.36 + Math.random() * 0.22,
                    crestH: 18,
                    alpha: 1.0,
                    shockRadius: 12
                };
                screenTremor = 1.3;

                nightAudio.triggerWaveBoom();
                if (navigator.vibrate) {
                    navigator.vibrate([85, 35, 130]);
                }
            }
        }

        if (distantWave) {
            distantWave.shockRadius += dt * 205;
            distantWave.alpha -= dt * 0.38;
            if (distantWave.alpha <= 0) {
                distantWave = null;
            }
        }

        if (screenTremor > 0) {
            screenTremor = Math.max(0, screenTremor - dt * 1.35);
        }

        syncMidnightStateAttributes(inWater);
        drawMidnightScene(now, dt);
        animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    setActiveGameCleanup(() => {
        isRunning = false;
        cancelAnimationFrame(animId);
        if (fsStatsEl) fsStatsEl.style.display = '';
        if (fsTimer) fsTimer.style.display = '';
        fsHint.style.fontSize = '';
        fsHint.style.pointerEvents = '';
        fsHint.style.cursor = '';
        fsHint.onclick = null;
        delete fsOverlay.dataset.midnightPhase;
        delete fsOverlay.dataset.constellationProgress;
        delete fsOverlay.dataset.musicMode;
        nightAudio.dispose();
        canvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        canvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', resizeCanvas);
    });
}
