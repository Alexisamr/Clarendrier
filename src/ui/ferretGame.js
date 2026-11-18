/**
 * ============================================================================
 * MINI-JEU PLEIN ÉCRAN HAUTE DÉFINITION : LE SUNSET DU CAP FERRET (JOUR 4)
 * - Piste sinueuse (virages serrés dans la dune + ralentissement hors-piste)
 * - Obstacle spécial : Mamie à vélo qui se retourne et tangue là où elle regarde
 * - Superpouvoir : Le Vélo Blanc (difficile à attraper, Clara monte dessus, vitesse x2.2 + invincibilité)
 * ============================================================================
 */

import { UI_TEXTS } from '../data/calendarData.js';
import { lerpColor, clamp } from '../utils/helpers.js';
import {
    stopActiveGame,
    setActiveGameCleanup,
    markGameWon
} from '../logic/state.js';
import {
    fsOverlay,
    fsCloseBtn,
    fsStatTitle,
    fsAltText,
    fsAltBar,
    fsTimer,
    fsHint,
    fsEndCard,
    fsEndBadge,
    fsEndTitle,
    fsEndDesc,
    fsEndBtn,
    ferretCanvas
} from './dom.js';
import { openModal } from './modal.js';

const TOTAL_GAME_TIME_SEC = 45;
const MAX_LIVES = 3;
const BIKE_DURATION_SEC = 4.5;
const NORMAL_CLIMB_SPEED = 2.5;
const BIKE_CLIMB_SPEED = 5.2;
const OFF_TRACK_CLIMB_SPEED = 0.08;
const OBSTACLE_SPAWN_INTERVAL = 0.80;
const GRANDMA_SPAWN_INTERVAL = 3.8;
const FIRST_WHITE_BIKE_TIME = 11.0;
const SECOND_WHITE_BIKE_TIME = 26.5;

export function closeFullscreenGame() {
    stopActiveGame();
    fsOverlay.classList.remove('active');
    fsOverlay.setAttribute('aria-hidden', 'true');
    fsEndCard.classList.remove('visible');
}

export function initFullscreenGameListeners() {
    if (fsCloseBtn) {
        fsCloseBtn.addEventListener('click', closeFullscreenGame);
    }
}

export function launchFullscreenFerretGame(item) {
    stopActiveGame();
    fsOverlay.classList.add('active');
    fsOverlay.setAttribute('aria-hidden', 'false');
    fsEndCard.classList.remove('visible');
    fsHint.style.opacity = '1';
    const fsStatsEl = document.querySelector('.fs-stats');
    if (fsStatsEl) fsStatsEl.style.display = '';
    if (fsTimer) fsTimer.style.display = '';
    if (fsStatTitle) fsStatTitle.textContent = UI_TEXTS.FERRET_GAME.HUD_TITLE;
    if (fsAltBar) fsAltBar.style.background = 'linear-gradient(90deg, #F6D365 0%, #FDA085 100%)';

    const canvas = ferretCanvas;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();

    let animId;
    let isRunning = true;
    let altitude = 0; // 0 à 100%
    let timeLeft = TOTAL_GAME_TIME_SEC;
    let elapsed = 0;
    let lastTime = performance.now();

    // Système de vies : on meurt au bout de 3 obstacles percutés
    let lives = MAX_LIVES;

    let worldScroll = 0;
    let spawnTimer = 0.25;
    let grandmaTimer = 1.4;
    let whiteBikeSpawnsRemaining = 2;
    let nextWhiteBikeTime = FIRST_WHITE_BIKE_TIME;
    let lastBarrierSide = 1;
    let runCycle = 0;
    let screenShake = 0;
    let offTrackPopupCooldown = 0;

    // État du superpouvoir "Vélo Blanc"
    let bikeTimeLeft = 0;

    const player = {
        screenPos: 0,       // Position horizontale à l'écran (-0.95 à +0.95)
        targetScreenPos: 0,
        x: width / 2,
        y: height * 0.81
    };

    const obstacles = [];
    const popups = [];
    const particles = [];

    // Décor : Pins maritimes qui défilent sur les côtés de la dune
    const pines = Array.from({ length: 10 }, (_, i) => ({
        side: i % 2 === 0 ? -1 : 1,
        progress: (i / 10),
        sizeVar: 0.85 + (i % 3) * 0.15
    }));

    // Calcule le décalage horizontal doux du chemin à une profondeur p (0 = haut, 1 = bas)
    function getPathCurveOffset(p) {
        const maxSwing = Math.min(width * 0.12, 58);
        const wave1 = Math.sin(worldScroll * 1.05 - p * 2.1);
        const wave2 = Math.cos(worldScroll * 0.65 - p * 1.4) * 0.35;
        const envelope = 0.20 + 0.80 * Math.pow(p, 1.15);
        return (wave1 + wave2) * maxSwing * envelope;
    }

    function updateTargetFromX(clientX) {
        fsHint.style.opacity = '0';
        const norm = (clientX / width) * 2 - 1;
        player.targetScreenPos = clamp(norm * 1.12, -0.92, 0.92);
    }

    const onTouchStart = (e) => {
        if (e.touches.length > 0) updateTargetFromX(e.touches[0].clientX);
    };
    const onTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) updateTargetFromX(e.touches[0].clientX);
    };
    const onMouseMove = (e) => {
        updateTargetFromX(e.clientX);
    };
    const onKeyDown = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
            fsHint.style.opacity = '0';
            player.targetScreenPos = Math.max(-0.92, player.targetScreenPos - 0.28);
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            fsHint.style.opacity = '0';
            player.targetScreenPos = Math.min(0.92, player.targetScreenPos + 0.28);
        }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', resizeCanvas);

    /* Apparition d'obstacles moins nombreux mais plus exigeants :
       principalement de vraies barrières en bois de 2 voies de large ! */
    function spawnObstacle() {
        const roll = Math.random();

        if (roll < 0.68) {
            // VRAIE BARRIÈRE EN BOIS DE 2 DE LARGEUR (bloque 2/3 du chemin, laisse 1 passage étroit)
            lastBarrierSide = Math.random() < 0.75 ? -lastBarrierSide : lastBarrierSide;
            const laneStart = lastBarrierSide < 0 ? -0.96 : -0.30;
            const laneEnd = lastBarrierSide < 0 ? 0.30 : 0.96;

            const speedScale = 1 + (altitude / 100) * 0.26;
            obstacles.push({
                kind: 'wooden_barrier',
                laneStart,
                laneEnd,
                lane: (laneStart + laneEnd) / 2,
                progress: 0.02,
                speed: 0.50 * speedScale,
                penalty: -10,
                bonus: false,
                label: 'Barrière en bois ! -1 ❤️'
            });
        } else if (roll < 0.91) {
            // Pomme de pin placée précisément dans le passage ouvert de la dernière barrière
            const speedScale = 1 + (altitude / 100) * 0.26;
            const targetOpenLane = lastBarrierSide < 0 ? 0.62 : -0.62;
            obstacles.push({
                kind: 'standard',
                lane: targetOpenLane + (Math.random() * 0.2 - 0.1),
                progress: 0.02,
                emoji: '🌲',
                label: 'Pomme de pin ! -1 ❤️',
                penalty: -8,
                speed: 0.50 * speedScale,
                bonus: false,
                color: '#8C5A3C'
            });
        } else {
            // Petit bonus Canelé
            obstacles.push({
                kind: 'standard',
                lane: (Math.random() * 1.3) - 0.65,
                progress: 0.02,
                emoji: '🧁',
                label: 'Canelé +5% ✨',
                penalty: +5,
                speed: 0.50,
                bonus: true,
                color: '#F4A261'
            });
        }
    }

    /* Apparition de Mamie à vélo devant nous qui se retourne et tangue ! */
    function spawnGrandmaBike() {
        const startSide = Math.random() < 0.5 ? -1 : 1;
        const startLane = startSide * (0.45 + Math.random() * 0.25);
        const lookDir = -startSide;

        obstacles.push({
            kind: 'grandma',
            lane: startLane,
            startLane,
            lookDir,
            hasTurnedHead: false,
            wobblePhase: Math.random() * Math.PI * 2,
            progress: 0.02,
            speed: 0.31,
            penalty: -12,
            bonus: false,
            label: 'Mamie a tangué sur toi ! -1 ❤️'
        });
    }

    /* Apparition du Vélo Blanc (Superpouvoir difficile à attraper) */
    function spawnWhiteBikePickup() {
        const side = Math.random() < 0.5 ? -1 : 1;
        const baseLane = side * 0.62;

        obstacles.push({
            kind: 'white_bike',
            baseLane,
            lane: baseLane,
            weavePhase: Math.random() * Math.PI * 2,
            progress: 0.02,
            speed: 0.54,
            bonus: true,
            label: '🚲 VÉLO BLANC ACTIVÉ ! ⚡'
        });
    }

    function addParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 110;
            particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 1,
                color,
                size: 3 + Math.random() * 4
            });
        }
    }

    /* Dessine le célèbre Bunker (Blockhaus) ensablé du Cap Ferret avec ses tags */
    function drawCapFerretBunker(bx, by, scale, sunProgress) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(scale, scale);

        ctx.save();
        ctx.rotate(-0.15);

        ctx.fillStyle = 'rgba(40, 32, 24, 0.25)';
        ctx.beginPath();
        ctx.ellipse(8, 28, 62, 14, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = lerpColor([118, 112, 104], [62, 60, 58], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(36, -32);
        ctx.lineTo(58, -22);
        ctx.lineTo(54, 28);
        ctx.lineTo(36, 30);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = lerpColor([168, 160, 148], [94, 90, 86], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(-48, -28);
        ctx.lineTo(36, -32);
        ctx.lineTo(36, 30);
        ctx.lineTo(-46, 28);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = lerpColor([188, 178, 164], [110, 105, 98], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(-52, -28);
        ctx.lineTo(-40, -44);
        ctx.lineTo(44, -45);
        ctx.lineTo(58, -22);
        ctx.lineTo(36, -32);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1E1D1B';
        ctx.fillRect(-30, -24, 48, 7);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(-48, -28, 84, 4);

        ctx.fillStyle = 'rgba(46, 196, 182, 0.85)';
        ctx.beginPath();
        ctx.arc(-26, 2, 13, 0, Math.PI * 2);
        ctx.arc(-14, 6, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 93, 143, 0.85)';
        ctx.beginPath();
        ctx.roundRect(-18, -11, 44, 18, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 190, 11, 0.85)';
        ctx.beginPath();
        ctx.arc(22, 6, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 93, 143, 0.85)';
        ctx.fillRect(-8, 7, 2.2, 8);
        ctx.fillRect(10, 7, 2, 6);
        ctx.fillStyle = 'rgba(46, 196, 182, 0.85)';
        ctx.fillRect(-28, 14, 2, 7);

        ctx.save();
        ctx.rotate(-0.04);
        ctx.font = '900 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#1C1B19';
        ctx.lineWidth = 3;
        ctx.strokeText('FERRET', 3, -2);
        ctx.fillStyle = '#FFFDF7';
        ctx.fillText('FERRET', 3, -2);
        ctx.restore();

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#FFE5EC';
        ctx.fillText('♥', 45, -2);

        ctx.strokeStyle = 'rgba(40, 36, 32, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-38, -28);
        ctx.lineTo(-33, -12);
        ctx.lineTo(-36, -4);
        ctx.stroke();

        ctx.restore();

        ctx.fillStyle = lerpColor([226, 203, 172], [138, 123, 108], sunProgress * 0.7);
        ctx.beginPath();
        ctx.moveTo(-68, 26);
        ctx.quadraticCurveTo(-10, 8, 66, 24);
        ctx.lineTo(66, 42);
        ctx.lineTo(-68, 42);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#5F7353';
        ctx.lineWidth = 1.6;
        [-42, -36, 32, 38].forEach((ox, idx) => {
            ctx.beginPath();
            ctx.moveTo(ox, 20);
            ctx.quadraticCurveTo(ox + (idx % 2 === 0 ? -8 : 8), 5, ox + (idx % 2 === 0 ? -13 : 13), 10);
            ctx.stroke();
        });

        ctx.restore();
    }

    function drawEnvironment(sunProgress, dt, scrollFactor) {
        const horizonY = height * 0.34;
        const crestY = height * 0.40;

        // 1. Ciel dynamique
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        const topColor = lerpColor([209, 113, 102], [25, 34, 54], sunProgress);
        const midColor = lerpColor([244, 162, 110], [115, 75, 109], sunProgress);
        const botColor = lerpColor([255, 218, 158], [214, 114, 96], sunProgress);
        skyGrad.addColorStop(0, topColor);
        skyGrad.addColorStop(0.55, midColor);
        skyGrad.addColorStop(1, botColor);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY + 10);

        // 2. Soleil avec double halo lumineux
        const sunX = width * 0.5;
        const sunY = (height * 0.16) + sunProgress * (horizonY - height * 0.13);
        const sunRadius = Math.min(width, height) * 0.11;

        const haloGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 2.8);
        haloGrad.addColorStop(0, 'rgba(255, 248, 225, 0.95)');
        haloGrad.addColorStop(0.35, 'rgba(255, 205, 135, 0.45)');
        haloGrad.addColorStop(1, 'rgba(255, 160, 110, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFDF6';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Océan Atlantique à l'horizon
        const oceanGrad = ctx.createLinearGradient(0, horizonY - 4, 0, crestY + 10);
        oceanGrad.addColorStop(0, lerpColor([58, 90, 112], [22, 35, 48], sunProgress));
        oceanGrad.addColorStop(1, lerpColor([42, 70, 88], [16, 26, 36], sunProgress));
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, horizonY - 4, width, crestY - horizonY + 15);

        if (sunProgress < 0.94) {
            ctx.fillStyle = 'rgba(255, 232, 185, 0.45)';
            for (let i = 0; i < 6; i++) {
                const waveY = horizonY + 3 + i * 5.5;
                const waveW = (46 - i * 5) * (1 - sunProgress * 0.5);
                const shimmer = Math.sin(worldScroll * 5 + i * 1.7) * 6;
                ctx.fillRect(sunX - waveW / 2 + shimmer, waveY, waveW, 2.2);
            }
        }

        // 4. Silhouette du Phare du Cap Ferret au loin sur la droite
        const lhX = width * 0.84;
        const lhBaseY = horizonY + 2;
        ctx.fillStyle = '#23312B';
        ctx.beginPath();
        ctx.moveTo(lhX - 4, lhBaseY);
        ctx.lineTo(lhX - 2, lhBaseY - 26);
        ctx.lineTo(lhX + 2, lhBaseY - 26);
        ctx.lineTo(lhX + 4, lhBaseY);
        ctx.fill();
        ctx.fillStyle = '#8B3A3A';
        ctx.fillRect(lhX - 2.5, lhBaseY - 31, 5, 5);
        const beamAlpha = 0.15 + Math.sin(worldScroll * 4) * 0.08;
        ctx.fillStyle = `rgba(255, 243, 196, ${beamAlpha})`;
        ctx.beginPath();
        ctx.moveTo(lhX, lhBaseY - 29);
        ctx.lineTo(lhX - 55, lhBaseY - 42);
        ctx.lineTo(lhX - 55, lhBaseY - 18);
        ctx.closePath();
        ctx.fill();

        // 5. Corps de la Dune du Ferret
        const sandGrad = ctx.createLinearGradient(0, crestY, 0, height);
        sandGrad.addColorStop(0, lerpColor([234, 214, 186], [150, 134, 118], sunProgress * 0.7));
        sandGrad.addColorStop(1, lerpColor([212, 186, 152], [115, 102, 88], sunProgress * 0.7));
        ctx.fillStyle = sandGrad;

        ctx.beginPath();
        ctx.moveTo(0, crestY + 8);
        ctx.quadraticCurveTo(width * 0.5, crestY - 14, width, crestY + 8);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Courbes des dunes latérales
        ctx.fillStyle = 'rgba(180, 150, 115, 0.22)';
        ctx.beginPath();
        ctx.moveTo(0, crestY + 40);
        ctx.quadraticCurveTo(width * 0.28, crestY + 95, 0, height * 0.78);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(width, crestY + 55);
        ctx.quadraticCurveTo(width * 0.72, crestY + 110, width, height * 0.82);
        ctx.fill();

        // 6. BUNKER TAGUÉ DU CAP FERRET
        const bunkerProgress = altitude / 100;
        const bunkerX = width * 0.20 - bunkerProgress * 8;
        const bunkerY = crestY + 34 + bunkerProgress * 28;
        const bunkerScale = (Math.min(width, 430) / 390) * (0.82 + bunkerProgress * 0.16);
        drawCapFerretBunker(bunkerX, bunkerY, bunkerScale, sunProgress);

        // 7. Chemin sinueux doux en perspective + Caillebotis en bois
        const pathTopW = width * 0.21;
        const pathBotW = width * 0.74;
        const pathHeight = height - crestY;
        const segments = 28;

        ctx.fillStyle = lerpColor([243, 229, 208], [168, 152, 136], sunProgress * 0.7);
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const p = i / segments;
            const py = crestY + p * pathHeight;
            const w = pathTopW + p * (pathBotW - pathTopW);
            const cx = sunX + getPathCurveOffset(p);
            if (i === 0) ctx.moveTo(cx - w / 2, py);
            else ctx.lineTo(cx - w / 2, py);
        }
        for (let i = segments; i >= 0; i--) {
            const p = i / segments;
            const py = crestY + p * pathHeight;
            const w = pathTopW + p * (pathBotW - pathTopW);
            const cx = sunX + getPathCurveOffset(p);
            ctx.lineTo(cx + w / 2, py);
        }
        ctx.closePath();
        ctx.fill();

        // Bordures de sable mou le long du chemin
        ctx.strokeStyle = 'rgba(165, 135, 100, 0.42)';
        ctx.lineWidth = 2.5;
        [-1, 1].forEach((side) => {
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const p = i / segments;
                const py = crestY + p * pathHeight;
                const w = pathTopW + p * (pathBotW - pathTopW);
                const cx = sunX + getPathCurveOffset(p) + side * (w * 0.5);
                if (i === 0) ctx.moveTo(cx, py);
                else ctx.lineTo(cx, py);
            }
            ctx.stroke();
        });

        // Lattes de caillebotis qui suivent les virages de la piste
        const numSlats = 16;
        for (let i = 0; i < numSlats; i++) {
            const rawP = ((i / numSlats) + (worldScroll * 0.58)) % 1;
            const p = Math.pow(rawP, 1.65);
            const slatY = crestY + p * pathHeight;
            const currentPathW = pathTopW + p * (pathBotW - pathTopW);
            const slatW = currentPathW * 0.66;
            const slatH = Math.max(1.5, p * 6.5);
            const slatCenterX = sunX + getPathCurveOffset(p);

            ctx.fillStyle = `rgba(138, 118, 98, ${0.25 + p * 0.45})`;
            ctx.beginPath();
            ctx.roundRect(slatCenterX - slatW / 2, slatY, slatW, slatH, 2);
            ctx.fill();
        }

        // 8. Pins maritimes et oyats sur les bords
        pines.forEach((pine) => {
            pine.progress = (pine.progress + dt * 0.28 * scrollFactor) % 1;
            if (pine.side === -1 && pine.progress < 0.34) return;

            const p = Math.pow(pine.progress, 1.6);
            const py = crestY + p * pathHeight;
            const currentPathW = pathTopW + p * (pathBotW - pathTopW);
            const px = sunX + getPathCurveOffset(p) + pine.side * (currentPathW * 0.62 + p * 38);
            const scale = (0.25 + p * 0.95) * pine.sizeVar;

            ctx.strokeStyle = '#6B7F5E';
            ctx.lineWidth = 1.5 * scale;
            for (let b = -2; b <= 2; b++) {
                ctx.beginPath();
                ctx.moveTo(px + b * 4 * scale, py);
                ctx.quadraticCurveTo(px + b * 9 * scale, py - 14 * scale, px + b * 13 * scale, py - 8 * scale);
                ctx.stroke();
            }

            ctx.fillStyle = '#4A3728';
            ctx.fillRect(px - 3 * scale, py - 38 * scale, 6 * scale, 38 * scale);

            ctx.fillStyle = '#24382F';
            ctx.beginPath();
            ctx.ellipse(px, py - 42 * scale, 26 * scale, 12 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2F483D';
            ctx.beginPath();
            ctx.ellipse(px - 4 * scale, py - 46 * scale, 20 * scale, 9 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        return { crestY, pathTopW, pathBotW, pathHeight, sunX };
    }

    /* Dessine une VRAIE BARRIÈRE EN BOIS de 2 voies de large */
    function drawWoodenBarrier(leftX, rightX, oy, scale) {
        const w = Math.max(24, rightX - leftX);
        const h = 28 * scale;
        const postW = Math.max(4, 7 * scale);
        const railH = Math.max(3.5, 6.5 * scale);

        ctx.save();

        // Ombre portée de la barrière sur le sable
        ctx.fillStyle = 'rgba(28, 24, 18, 0.26)';
        ctx.beginPath();
        ctx.roundRect(leftX - 2, oy + 2 * scale, w + 4, 8 * scale, 4);
        ctx.fill();

        // Poteaux verticaux en bois (gauche, milieu et droite) plantés dans la dune
        const postsX = [leftX + postW * 0.6, (leftX + rightX) / 2, rightX - postW * 0.6];
        postsX.forEach((px) => {
            ctx.fillStyle = '#5C3D28';
            ctx.beginPath();
            ctx.roundRect(px - postW / 2, oy - h, postW, h + 5 * scale, 2);
            ctx.fill();

            ctx.fillStyle = '#7A5236';
            ctx.fillRect(px - postW / 2, oy - h, postW * 0.45, h + 4 * scale);

            ctx.fillStyle = '#DEC3A1';
            ctx.beginPath();
            ctx.ellipse(px, oy + 4 * scale, postW * 1.1, 3 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Planche horizontale basse en bois
        const bottomRailY = oy - h * 0.42;
        ctx.fillStyle = '#8D6346';
        ctx.strokeStyle = '#4A301E';
        ctx.lineWidth = Math.max(1, 1.3 * scale);
        ctx.beginPath();
        ctx.roundRect(leftX, bottomRailY, w, railH, 2);
        ctx.fill();
        ctx.stroke();

        // Planche horizontale haute en bois avec chevrons / repères de chantier de dune
        const topRailY = oy - h * 0.88;
        ctx.fillStyle = '#9C6F4F';
        ctx.beginPath();
        ctx.roundRect(leftX, topRailY, w, railH * 1.15, 2);
        ctx.fill();
        ctx.stroke();

        // Bandes rouges et blanches d'avertissement sur la planche haute
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(leftX, topRailY, w, railH * 1.15, 2);
        ctx.clip();
        const stripeStep = Math.max(10, 18 * scale);
        for (let sx = leftX - 10; sx < rightX + 10; sx += stripeStep) {
            ctx.fillStyle = 'rgba(158, 42, 43, 0.82)';
            ctx.beginPath();
            ctx.moveTo(sx, topRailY);
            ctx.lineTo(sx + stripeStep * 0.48, topRailY);
            ctx.lineTo(sx + stripeStep * 0.25, topRailY + railH * 1.2);
            ctx.lineTo(sx - stripeStep * 0.23, topRailY + railH * 1.2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Clous sur les poteaux
        ctx.fillStyle = '#2B2118';
        postsX.forEach((px) => {
            ctx.beginPath();
            ctx.arc(px, topRailY + railH * 0.55, Math.max(1, 1.4 * scale), 0, Math.PI * 2);
            ctx.arc(px, bottomRailY + railH * 0.5, Math.max(1, 1.4 * scale), 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    /* Dessine le Vélo Blanc à récupérer sur la piste */
    function drawWhiteBikePickup(ox, oy, scale) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        const pulse = 1 + Math.sin(worldScroll * 8) * 0.1;
        const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 32 * pulse);
        aura.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        aura.addColorStop(0.55, 'rgba(255, 230, 150, 0.55)');
        aura.addColorStop(1, 'rgba(255, 230, 150, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 32 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(30, 53, 43, 0.85)';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(-9, 5, 5.5, 0, Math.PI * 2);
        ctx.arc(9, 5, 5.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-9, 5);
        ctx.lineTo(-2, -4);
        ctx.lineTo(7, -4);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.moveTo(-2, -4);
        ctx.lineTo(-4, -8);
        ctx.moveTo(9, 5);
        ctx.lineTo(6, -8);
        ctx.lineTo(3, -9);
        ctx.stroke();

        ctx.strokeStyle = '#D4A373';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-6.5, -8);
        ctx.lineTo(-1.5, -8);
        ctx.stroke();

        ctx.font = '700 9px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('VÉLO BLANC', 0, -27);

        ctx.restore();
    }

    /* Dessine Mamie à vélo qui se retourne pour nous regarder et tangue ! */
    function drawGrandmaCyclist(ox, oy, scale, obs) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        const wobbleAngle = obs.hasTurnedHead
            ? obs.lookDir * 0.16 + Math.sin(obs.wobblePhase) * 0.12
            : Math.sin(obs.wobblePhase) * 0.03;

        if (obs.hasTurnedHead) {
            ctx.save();
            ctx.strokeStyle = 'rgba(158, 42, 43, 0.75)';
            ctx.fillStyle = 'rgba(158, 42, 43, 0.75)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(0, 14);
            ctx.lineTo(obs.lookDir * 34, 14);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(obs.lookDir * 36, 14);
            ctx.lineTo(obs.lookDir * 29, 10);
            ctx.lineTo(obs.lookDir * 29, 18);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = 'rgba(28, 27, 25, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(wobbleAngle);

        ctx.strokeStyle = '#2B2D42';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(0, 22);
        ctx.stroke();

        ctx.strokeStyle = '#457B9D';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(0, 0);
        ctx.moveTo(-11, -12);
        ctx.quadraticCurveTo(0, -8, 11, -12);
        ctx.stroke();

        ctx.fillStyle = '#D4A373';
        ctx.beginPath();
        ctx.roundRect(-8, -18, 16, 8, 2);
        ctx.fill();

        ctx.fillStyle = '#F1FAEE';
        ctx.beginPath();
        ctx.roundRect(-11, -12, 22, 16, 7);
        ctx.fill();
        ctx.fillStyle = '#457B9D';
        ctx.fillRect(-10, -9, 20, 2.2);
        ctx.fillRect(-10, -4, 20, 2.2);
        ctx.fillRect(-10, 1, 20, 2.2);

        ctx.fillStyle = '#F3D5B5';
        ctx.beginPath();
        ctx.arc(0, -19, 8.5, 0, Math.PI * 2);
        ctx.fill();

        if (obs.hasTurnedHead) {
            ctx.fillStyle = '#D9D9D9';
            ctx.beginPath();
            ctx.arc(-obs.lookDir * 3, -24, 6.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#1D3557';
            ctx.lineWidth = 1.3;
            ctx.strokeRect(obs.lookDir * 2 - 5, -21, 4.2, 3.2);
            ctx.strokeRect(obs.lookDir * 2 + 0.8, -21, 4.2, 3.2);

            ctx.beginPath();
            ctx.arc(obs.lookDir * 2, -16, 2.5, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();

            ctx.save();
            ctx.rotate(-wobbleAngle);
            ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
            const msg = obs.lookDir > 0 ? 'Mamie regarde à droite ➔' : '⬅ Mamie regarde à gauche';
            const tw = ctx.measureText(msg).width;
            ctx.fillStyle = 'rgba(158, 42, 43, 0.92)';
            ctx.beginPath();
            ctx.roundRect(-tw / 2 - 7, -44, tw + 14, 17, 8);
            ctx.fill();
            ctx.fillStyle = '#FAF7F2';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(msg, 0, -35.5);
            ctx.restore();
        } else {
            ctx.fillStyle = '#D8DBE2';
            ctx.beginPath();
            ctx.arc(0, -20, 8.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#C5C9D1';
            ctx.beginPath();
            ctx.arc(0, -26, 4.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawPlayer(dt, isOffTrack) {
        const onBike = bikeTimeLeft > 0;
        // Si Clara est hors du chemin (dans le sable mou), elle s'arrête quasiment !
        const cycleSpeed = onBike ? 22 : (isOffTrack ? 3.2 : 14);
        runCycle += dt * cycleSpeed;
        const bobY = onBike ? Math.sin(runCycle) * 1.8 : Math.abs(Math.sin(runCycle)) * (isOffTrack ? 1.2 : 4);
        const tilt = (player.targetScreenPos - player.screenPos) * (onBike ? 0.45 : 0.35);

        const px = player.x;
        const py = player.y - bobY;

        if ((Math.sin(runCycle) > 0.75 || onBike) && isRunning) {
            particles.push({
                x: px + (Math.random() * 14 - 7),
                y: player.y + 20,
                vx: (Math.random() - 0.5) * (onBike ? 55 : 25),
                vy: 15 + Math.random() * (onBike ? 45 : 20),
                life: onBike ? 0.75 : 0.6,
                color: onBike
                    ? 'rgba(255, 250, 225, 0.9)'
                    : (isOffTrack ? 'rgba(185, 145, 100, 0.85)' : 'rgba(210, 185, 150, 0.7)'),
                size: (onBike ? 4.5 : 4) + Math.random() * 3
            });
        }

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tilt);

        // Aura lumineuse d'invincibilité quand Clara est sur le Vélo Blanc
        if (onBike) {
            const shieldGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 38);
            shieldGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
            shieldGrad.addColorStop(0.65, 'rgba(255, 224, 153, 0.32)');
            shieldGrad.addColorStop(1, 'rgba(255, 224, 153, 0)');
            ctx.fillStyle = shieldGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 38, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ombre portée
        ctx.fillStyle = 'rgba(44, 35, 25, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, 22 + bobY, onBike ? 20 : 18, onBike ? 7 : 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Si Clara a récupéré le Vélo Blanc : on dessine le Vélo Blanc sous elle !
        if (onBike) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-18, -9);
            ctx.quadraticCurveTo(0, -15, 18, -9);
            ctx.stroke();

            ctx.strokeStyle = '#C59B5F';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-20, -8.5);
            ctx.lineTo(-15, -9.5);
            ctx.moveTo(20, -8.5);
            ctx.lineTo(15, -9.5);
            ctx.stroke();
        }

        // T-SHIRT JAUNE DE CLARA
        ctx.fillStyle = '#F7D046';
        ctx.strokeStyle = '#DFB426';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-11, -2);
        ctx.lineTo(11, -2);
        ctx.lineTo(16, 15);
        ctx.lineTo(-16, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Si Clara est sur le Vélo Blanc : cadre blanc arrière, selle et roue blanche qui tourne !
        if (onBike) {
            const pedalOffset = Math.sin(runCycle) * 4;
            ctx.fillStyle = '#D4A373';
            ctx.fillRect(-11, 13 + pedalOffset, 5, 3);
            ctx.fillRect(6, 13 - pedalOffset, 5, 3);

            ctx.fillStyle = '#A67C52';
            ctx.beginPath();
            ctx.ellipse(0, 8, 6.5, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(-7, 9);
            ctx.lineTo(0, 22);
            ctx.lineTo(7, 9);
            ctx.moveTo(0, 8);
            ctx.lineTo(0, 25);
            ctx.stroke();

            ctx.strokeStyle = '#2B2D42';
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.moveTo(0, 14);
            ctx.lineTo(0, 27);
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(0, 26);
            ctx.stroke();
        }

        // Cou et tête de Clara (vue de dos)
        ctx.fillStyle = '#E6C1A3';
        ctx.fillRect(-3, -6, 6, 5);
        ctx.beginPath();
        ctx.arc(0, -11.5, 9, 0, Math.PI * 2);
        ctx.fill();

        // Longs cheveux bruns de Clara (mêmes couleurs et style que dans le Bain de Minuit)
        const sway = clamp(-tilt * 9, -4.5, 4.5) + Math.sin(runCycle * 0.5) * 0.7;
        const hairGrad = ctx.createLinearGradient(0, -21, 0, 10);
        hairGrad.addColorStop(0, '#4B2E1B');
        hairGrad.addColorStop(0.5, '#382012');
        hairGrad.addColorStop(1, '#27150B');
        ctx.fillStyle = hairGrad;

        ctx.beginPath();
        ctx.arc(0, -12.5, 9.8, Math.PI * 0.85, Math.PI * 2.15);
        ctx.bezierCurveTo(11.2, -4, 11.5 + sway * 0.7, 3, 8.5 + sway, 9.5);
        ctx.quadraticCurveTo(3.8 + sway, 12.2, 0 + sway * 0.9, 10.2);
        ctx.quadraticCurveTo(-3.8 + sway, 12.2, -8.5 + sway, 9.5);
        ctx.bezierCurveTo(-11.5 + sway * 0.7, 3, -11.2, -4, -9.6, -11.5);
        ctx.closePath();
        ctx.fill();

        // Reflets bruns doux dans les longueurs
        ctx.strokeStyle = 'rgba(120, 78, 48, 0.45)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(-3.8, -16);
        ctx.quadraticCurveTo(-5.2 + sway * 0.5, -2, -4.5 + sway, 8);
        ctx.moveTo(3.8, -16);
        ctx.quadraticCurveTo(5.2 + sway * 0.5, -2, 4.5 + sway, 8);
        ctx.stroke();

        // Affichage des coeurs (vies) ou du compteur Vélo Blanc au-dessus de Clara
        ctx.rotate(-tilt);
        if (onBike) {
            ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
            ctx.fillStyle = '#1E352B';
            ctx.beginPath();
            ctx.roundRect(-38, -40, 76, 16, 8);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`🚲 ${bikeTimeLeft.toFixed(1)}s ⚡`, 0, -32);
        } else {
            const heartsStr = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, MAX_LIVES - lives));
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(heartsStr, 0, -31);
        }

        ctx.restore();
    }

    function finishGame(won, reason = 'time') {
        isRunning = false;

        if (won) {
            markGameWon(item.day);
            addParticles(width / 2, height * 0.35, '#FFE099', 28);

            // Affichage exactement comme demandé : uniquement le titre de félicitations et le mot avec coeur rouge
            fsEndBadge.style.display = 'none';
            fsEndTitle.textContent = UI_TEXTS.FERRET_GAME.WIN_TITLE;
            fsEndDesc.textContent = UI_TEXTS.FERRET_GAME.WIN_DESC;
            fsEndBtn.textContent = UI_TEXTS.FERRET_GAME.WIN_BTN;
            fsEndBtn.onclick = () => {
                closeFullscreenGame();
                openModal(item);
            };
        } else {
            fsEndBadge.style.display = 'inline-block';
            if (reason === 'lives') {
                fsEndBadge.textContent = UI_TEXTS.FERRET_GAME.LOSS_LIVES_BADGE;
                fsEndTitle.textContent = UI_TEXTS.FERRET_GAME.LOSS_LIVES_TITLE;
                fsEndDesc.textContent = UI_TEXTS.FERRET_GAME.LOSS_LIVES_DESC;
            } else {
                fsEndBadge.textContent = UI_TEXTS.FERRET_GAME.LOSS_TIME_BADGE;
                fsEndTitle.textContent = UI_TEXTS.FERRET_GAME.LOSS_TIME_TITLE;
                fsEndDesc.textContent = UI_TEXTS.FERRET_GAME.LOSS_TIME_DESC;
            }
            fsEndBtn.textContent = UI_TEXTS.FERRET_GAME.RETRY_BTN;
            fsEndBtn.onclick = () => {
                launchFullscreenFerretGame(item);
            };
        }

        fsEndCard.classList.add('visible');
    }

    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // Position du joueur et vérification s'il est sur le chemin sinueux ou dans le sable mou
        player.screenPos += (player.targetScreenPos - player.screenPos) * 0.18;
        player.y = height * 0.81;
        const playerDepthP = 0.81;
        const pathTopW = width * 0.21;
        const pathBotW = width * 0.74;
        const playerPathWidth = pathTopW + playerDepthP * (pathBotW - pathTopW);
        const pathCenterAtPlayer = width * 0.5 + getPathCurveOffset(playerDepthP);

        player.x = width * 0.5 + player.screenPos * (width * 0.43);
        const distFromPathCenter = Math.abs(player.x - pathCenterAtPlayer);
        const isOffTrack = distFromPathCenter > (playerPathWidth * 0.44);

        // Facteur de défilement : presque arrêté (0.06) si hors-piste sans le Vélo Blanc !
        const scrollFactor = bikeTimeLeft > 0 ? 1.85 : (isOffTrack ? 0.06 : 1.0);

        const sunProgress = 1 - (timeLeft / TOTAL_GAME_TIME_SEC);
        const geom = drawEnvironment(isRunning ? sunProgress : (altitude >= 100 ? 0.35 : 1), dt, scrollFactor);

        if (isRunning) {
            timeLeft = Math.max(0, timeLeft - dt);
            elapsed += dt;
            if (bikeTimeLeft > 0) {
                bikeTimeLeft = Math.max(0, bikeTimeLeft - dt);
            }
            if (offTrackPopupCooldown > 0) {
                offTrackPopupCooldown = Math.max(0, offTrackPopupCooldown - dt);
            }

            // Vitesse de montée réduite pour une ascension plus longue et plus intense (~38-40s)
            let climbSpeed = NORMAL_CLIMB_SPEED;
            if (bikeTimeLeft > 0) {
                climbSpeed = BIKE_CLIMB_SPEED;
            } else if (isOffTrack) {
                climbSpeed = OFF_TRACK_CLIMB_SPEED;
                if (offTrackPopupCooldown <= 0) {
                    popups.push({
                        x: player.x,
                        y: player.y - 38,
                        text: UI_TEXTS.FERRET_GAME.OFF_TRACK_POPUP,
                        bonus: false,
                        life: 0.85
                    });
                    offTrackPopupCooldown = 1.25;
                }
            }

            altitude = Math.min(100, altitude + dt * climbSpeed);
            worldScroll += dt * scrollFactor;

            // Obstacles un peu plus rapprochés et rythmés au fil de la montée
            const spawnRateMult = 1 + (altitude / 100) * 0.22;
            spawnTimer += dt * (isOffTrack && bikeTimeLeft <= 0 ? 0.25 : spawnRateMult);
            if (spawnTimer > OBSTACLE_SPAWN_INTERVAL) {
                spawnObstacle();
                spawnTimer = 0;
            }

            grandmaTimer += dt * (isOffTrack && bikeTimeLeft <= 0 ? 0.25 : spawnRateMult);
            if (grandmaTimer > GRANDMA_SPAWN_INTERVAL) {
                spawnGrandmaBike();
                grandmaTimer = 0;
            }

            if (whiteBikeSpawnsRemaining > 0 && elapsed >= nextWhiteBikeTime) {
                spawnWhiteBikePickup();
                whiteBikeSpawnsRemaining--;
                nextWhiteBikeTime = SECOND_WHITE_BIKE_TIME;
            }
        }

        ctx.save();
        if (screenShake > 0) {
            const dx = (Math.random() - 0.5) * screenShake;
            const dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
            screenShake = Math.max(0, screenShake - dt * 28);
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            if (isRunning) {
                const obsScrollMult = bikeTimeLeft > 0 && obs.kind !== 'white_bike'
                    ? 1.35
                    : (isOffTrack ? 0.15 : 1.0);
                obs.progress += obs.speed * dt * obsScrollMult;

                if (obs.kind === 'grandma') {
                    obs.wobblePhase += dt * 10;
                    if (obs.progress >= 0.22 && !obs.hasTurnedHead) {
                        obs.hasTurnedHead = true;
                    }
                    if (obs.hasTurnedHead) {
                        obs.lane += obs.lookDir * 0.92 * dt + Math.sin(obs.wobblePhase) * 0.25 * dt;
                        obs.lane = clamp(obs.lane, -0.92, 0.92);
                    }
                } else if (obs.kind === 'white_bike') {
                    obs.weavePhase += dt * 5.0;
                    obs.lane = obs.baseLane + Math.sin(obs.weavePhase) * 0.46;
                }
            }

            const p = Math.pow(obs.progress, 1.55);
            const oy = geom.crestY + p * geom.pathHeight;
            const currentW = geom.pathTopW + p * (geom.pathBotW - geom.pathTopW);
            const pathCenterX = geom.sunX + getPathCurveOffset(p);
            const ox = pathCenterX + obs.lane * (currentW * 0.44);
            const scale = 0.38 + p * 0.85;
            const radius = (obs.kind === 'grandma' ? 23 : 20) * scale;

            let hit = false;

            if (obs.kind === 'wooden_barrier') {
                const barrierLeftX = pathCenterX + obs.laneStart * (currentW * 0.48);
                const barrierRightX = pathCenterX + obs.laneEnd * (currentW * 0.48);
                drawWoodenBarrier(barrierLeftX, barrierRightX, oy, scale);

                // Collision rectangulaire sur toute la largeur de la vraie barrière en bois (2 voies)
                if (
                    isRunning &&
                    Math.abs(oy - player.y) < 16 * scale + 8 &&
                    player.x >= barrierLeftX - 10 &&
                    player.x <= barrierRightX + 10
                ) {
                    hit = true;
                }
            } else if (obs.kind === 'white_bike') {
                drawWhiteBikePickup(ox, oy, scale);
                if (isRunning && Math.hypot(ox - player.x, oy - player.y) < radius + 16) {
                    hit = true;
                }
            } else if (obs.kind === 'grandma') {
                drawGrandmaCyclist(ox, oy, scale, obs);
                if (isRunning && Math.hypot(ox - player.x, oy - player.y) < radius + 15) {
                    hit = true;
                }
            } else {
                ctx.fillStyle = 'rgba(28, 27, 25, 0.18)';
                ctx.beginPath();
                ctx.ellipse(ox, oy + radius * 0.75, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = obs.bonus ? 'rgba(255, 243, 210, 0.92)' : 'rgba(255, 255, 255, 0.88)';
                ctx.strokeStyle = obs.color;
                ctx.lineWidth = 2 * scale;
                ctx.beginPath();
                ctx.arc(ox, oy, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.font = `${Math.round(22 * scale)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(obs.emoji, ox, oy + 1);

                if (isRunning && Math.hypot(ox - player.x, oy - player.y) < radius + 15) {
                    hit = true;
                }
            }

            if (hit) {
                if (obs.kind === 'white_bike') {
                    bikeTimeLeft = BIKE_DURATION_SEC;
                    addParticles(ox, oy, '#FFFFFF', 24);
                    addParticles(ox, oy, '#FFE099', 16);
                    popups.push({
                        x: ox,
                        y: oy - 18,
                        text: obs.label,
                        bonus: true,
                        life: 1.25
                    });
                } else if (bikeTimeLeft > 0 && !obs.bonus) {
                    addParticles(ox, oy, '#FFFFFF', 16);
                    popups.push({
                        x: player.x,
                        y: oy - 15,
                        text: '🚲 Obstacle franchi !',
                        bonus: true,
                        life: 0.85
                    });
                } else {
                    altitude = clamp(altitude + obs.penalty, 0, 100);

                    popups.push({
                        x: player.x,
                        y: oy - 18,
                        text: obs.label,
                        bonus: obs.bonus,
                        life: 1.05
                    });

                    if (obs.bonus) {
                        addParticles(ox, oy, '#FFD166', 16);
                    } else {
                        lives = Math.max(0, lives - 1);
                        screenShake = 13;
                        addParticles(player.x, oy, '#9E2A2B', 14);
                        addParticles(player.x, oy, '#D4A373', 10);
                    }
                }

                obstacles.splice(i, 1);

                if (isRunning && lives <= 0) {
                    finishGame(false, 'lives');
                }
                continue;
            }

            if (oy > height + 50) {
                obstacles.splice(i, 1);
            }
        }

        drawPlayer(dt, isOffTrack);

        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt * 1.4;
            if (pt.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.life);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        for (let i = popups.length - 1; i >= 0; i--) {
            const pop = popups[i];
            pop.y -= dt * 42;
            pop.life -= dt * 0.95;
            if (pop.life <= 0) {
                popups.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.max(0, pop.life);
            ctx.font = '600 13px Plus Jakarta Sans, sans-serif';
            const textW = ctx.measureText(pop.text).width;
            ctx.fillStyle = pop.bonus ? '#1E352B' : '#9E2A2B';
            ctx.beginPath();
            ctx.roundRect(pop.x - textW / 2 - 10, pop.y - 13, textW + 20, 26, 99);
            ctx.fill();

            ctx.fillStyle = '#FAF8F5';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        }

        ctx.restore();

        const pct = Math.floor(altitude);
        fsAltText.textContent = `${pct}%`;
        fsAltBar.style.width = `${pct}%`;
        fsTimer.textContent = bikeTimeLeft > 0 ? `🚲 ${Math.ceil(timeLeft)}s` : `☀️ ${Math.ceil(timeLeft)}s`;

        if (isRunning) {
            if (altitude >= 100) {
                finishGame(true);
            } else if (timeLeft <= 0) {
                finishGame(false, 'time');
            }
        }

        animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    setActiveGameCleanup(() => {
        isRunning = false;
        cancelAnimationFrame(animId);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', resizeCanvas);
    });
}
