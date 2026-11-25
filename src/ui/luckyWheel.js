/**
 * ============================================================================
 * ROUE DE LA CHANCE HAUTE FIDÉLITÉ (JOUR 9)
 * - Esthétique éditoriale sapin / ivoire / bordeaux / or brossé dans la DA du site
 * - 3 tours affichés au-dessus de la roue (« Il te reste X tour(s) »)
 * - Déroulement dirigé sur les 4 premiers lancers puis hasard cryptographique
 *   réel entre les 2 cases rouges au dernier tour
 * - Animation plein écran : la couleur de la case gagnante envahit tout l'écran
 *   avant la révélation du texte du lot
 * - Physique réaliste des clous dorés qui percutent le clapet supérieur + audio
 * ============================================================================
 */

import { DEFAULT_WHEEL_SEGMENTS } from '../data/calendarData.js';
import {
    POINTER_TOP_ANGLE,
    createWheelSessionState,
    resolveNextSpinOutcome,
    computeTargetSpinTrajectory,
    sampleSpinCurve,
    formatRemainingTurnsText,
    getRevealKickerText,
    getRevealStatusText
} from '../logic/luckyWheelLogic.js';
import {
    getCryptoRandomFloat,
    clamp,
    createOrResumeAudioContext,
    closeAudioContextSafely
} from '../utils/helpers.js';
import { stopActiveGame, markGameWon, saveAndSyncQuizAnswer } from '../logic/state.js';
import {
    fsWheelOverlay,
    fsWheelCloseBtn,
    wheelCanvas,
    wheelSpinBtn,
    wheelTurnsCounter,
    wheelSummary,
    wheelRevealOverlay,
    wheelRevealParticles,
    wheelRevealKicker,
    wheelRevealTitle,
    wheelRevealSubtext,
    wheelRevealBtn
} from './dom.js';

const WHEEL_SPARKLE_PALETTE = ['#C59B5F', '#FAF0D4', '#9E2A2B', '#1E352B', '#E8D5B5'];
const WHITE_CHIME_NOTES = [523.25, 659.25, 783.99];
const GREEN_CHIME_NOTES = [523.25, 659.25, 783.99, 1046.5];
const RED_FANFARE_NOTES = [440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51];
const CLAPPER_SPRING_K = 260;
const CLAPPER_DAMPING = 18;
const REVEAL_FLOOD_DELAY_MS = 520;
const REVEAL_TEXT_DELAY_MS = 460;

let activeWheelCleanup = null;

export function closeFullscreenLuckyWheel() {
    if (activeWheelCleanup) {
        activeWheelCleanup();
        activeWheelCleanup = null;
    }
    if (fsWheelOverlay) {
        fsWheelOverlay.classList.remove('active');
        fsWheelOverlay.setAttribute('aria-hidden', 'true');
        delete fsWheelOverlay.dataset.wheelStep;
        delete fsWheelOverlay.dataset.turnsRemaining;
        delete fsWheelOverlay.dataset.wheelState;
        delete fsWheelOverlay.dataset.lastPrizeId;
        delete fsWheelOverlay.dataset.lastPrizeColor;
    }
}

export function initLuckyWheelListeners() {
    if (fsWheelCloseBtn) {
        fsWheelCloseBtn.addEventListener('click', closeFullscreenLuckyWheel);
    }
}

export function launchFullscreenLuckyWheel(item) {
    stopActiveGame();
    if (activeWheelCleanup) {
        activeWheelCleanup();
        activeWheelCleanup = null;
    }

    fsWheelOverlay.classList.add('active');
    fsWheelOverlay.setAttribute('aria-hidden', 'false');

    const ctx = wheelCanvas.getContext('2d');
    const segments = Array.isArray(item.segments) && item.segments.length > 0
        ? item.segments
        : DEFAULT_WHEEL_SEGMENTS;

    const numSegments = segments.length;
    const sliceAngle = (Math.PI * 2) / numSegments;
    const numPegs = numSegments * 2; // 16 clous dorés autour de la jante
    const pegStepAngle = (Math.PI * 2) / numPegs;

    let size = 318;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    function resizeWheelCanvas() {
        const rect = wheelCanvas.getBoundingClientRect();
        size = Math.max(250, Math.round(Math.min(rect.width || 318, rect.height || 318)));
        wheelCanvas.width = size * dpr;
        wheelCanvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeWheelCanvas();
    window.addEventListener('resize', resizeWheelCanvas);

    // État de la partie (3 tours imposés puis hasard final rouge)
    let sessionState = createWheelSessionState();
    let activeSpin = null; // { outcome, startAngle, totalDelta, durationSec, elapsedSec }
    let wheelState = 'idle'; // 'idle' | 'spinning' | 'revealing' | 'finished'
    let lastSegment = null;

    // État physique de la roue et du clapet supérieur
    let wheelAngle = getCryptoRandomFloat() * Math.PI * 2;
    let wheelOmega = 0;
    let isDragging = false;
    let dragLastPointerAngle = 0;
    let dragLastTime = 0;
    let smoothedDragOmega = 0;

    // Physique du clapet (pointeur en haut à 12h = -PI/2)
    let clapperAngle = 0;
    let clapperOmega = 0;
    let lastPegIndex = Math.floor(((wheelAngle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) / pegStepAngle);

    // Illumination du quartier gagnant et particules dorées à l'arrêt
    let winningSegmentIndex = -1;
    let winGlowPulse = 0;
    const sparkles = [];
    const pendingTimeouts = new Set();

    function scheduleTimeout(fn, ms) {
        const id = setTimeout(() => {
            pendingTimeouts.delete(id);
            fn();
        }, ms);
        pendingTimeouts.add(id);
        return id;
    }

    function clearPendingTimeouts() {
        pendingTimeouts.forEach((id) => clearTimeout(id));
        pendingTimeouts.clear();
    }

    function syncWheelDataAttributes() {
        fsWheelOverlay.dataset.wheelStep = String(sessionState.spinCount);
        fsWheelOverlay.dataset.turnsRemaining = String(sessionState.turnsRemaining);
        fsWheelOverlay.dataset.wheelState = wheelState;
        fsWheelOverlay.dataset.lastPrizeId = lastSegment ? lastSegment.id : '';
        fsWheelOverlay.dataset.lastPrizeColor = lastSegment ? lastSegment.colorType : '';
    }

    function updateTurnsCounterDisplay(animate = false, isBonus = false) {
        if (!wheelTurnsCounter) return;
        wheelTurnsCounter.textContent = formatRemainingTurnsText(sessionState.turnsRemaining);
        wheelTurnsCounter.classList.toggle('is-bonus', Boolean(isBonus && sessionState.turnsRemaining > 0));
        wheelTurnsCounter.classList.toggle('is-done', sessionState.turnsRemaining <= 0);
        if (animate) {
            wheelTurnsCounter.classList.remove('is-updated');
            void wheelTurnsCounter.offsetWidth;
            wheelTurnsCounter.classList.add('is-updated');
            scheduleTimeout(() => {
                wheelTurnsCounter.classList.remove('is-updated');
            }, 340);
        }
    }

    function renderFinishedSummary() {
        if (!wheelSummary) return;
        if (!sessionState.finished || sessionState.wonPrizes.length === 0) {
            wheelSummary.hidden = true;
            wheelSummary.innerHTML = '';
            return;
        }
        const itemsHtml = sessionState.wonPrizes
            .map((prize) => {
                const cls = prize.colorType === 'red'
                    ? 'wheel-summary-item wheel-summary-item--red'
                    : 'wheel-summary-item';
                return `<li class="${cls}">${prize.prizeText}</li>`;
            })
            .join('');
        wheelSummary.innerHTML = `
            <p class="wheel-summary-heading">Tes lots gagnés</p>
            <ul class="wheel-summary-list">${itemsHtml}</ul>
        `;
        wheelSummary.hidden = false;
    }

    function updateSpinControls() {
        const locked = wheelState !== 'idle' || sessionState.finished;
        wheelCanvas.classList.toggle('is-locked', locked);
        if (sessionState.finished) {
            wheelSpinBtn.disabled = false;
            wheelSpinBtn.textContent = 'Fermer';
        } else {
            wheelSpinBtn.disabled = wheelState !== 'idle';
            wheelSpinBtn.textContent = 'Tourner la roue ✨';
        }
    }

    function resetRevealOverlay() {
        if (!wheelRevealOverlay) return;
        wheelRevealOverlay.classList.remove('flooding', 'revealed');
        wheelRevealOverlay.setAttribute('aria-hidden', 'true');
        if (wheelRevealParticles) {
            wheelRevealParticles.innerHTML = '';
        }
    }

    function populateRevealParticles(colorType) {
        if (!wheelRevealParticles) return;
        wheelRevealParticles.innerHTML = '';
        const count = colorType === 'red' ? 28 : (colorType === 'green' ? 14 : 10);
        const colors = colorType === 'white'
            ? ['#C59B5F', '#D9B87A', '#9E2A2B']
            : ['#FAF0D4', '#F3D99B', '#FFFFFF'];

        for (let i = 0; i < count; i++) {
            const dot = document.createElement('span');
            dot.className = 'wheel-reveal-spark';
            const sizePx = colorType === 'red' ? (4 + Math.random() * 6) : (3 + Math.random() * 4);
            dot.style.width = `${sizePx.toFixed(1)}px`;
            dot.style.height = `${sizePx.toFixed(1)}px`;
            dot.style.left = `${(6 + Math.random() * 88).toFixed(1)}%`;
            const topBand = i % 2 === 0
                ? (12 + Math.random() * 20)
                : (70 + Math.random() * 22);
            dot.style.top = `${topBand.toFixed(1)}%`;
            dot.style.background = colors[i % colors.length];
            dot.style.setProperty('--spark-dur', `${(2.2 + Math.random() * 2.0).toFixed(2)}s`);
            dot.style.setProperty('--spark-delay', `${(Math.random() * 1.4).toFixed(2)}s`);
            dot.style.setProperty('--spark-dx', `${((Math.random() - 0.5) * 48).toFixed(0)}px`);
            wheelRevealParticles.appendChild(dot);
        }
    }

    // Initialisation propre de l'interface
    resetRevealOverlay();
    renderFinishedSummary();
    updateTurnsCounterDisplay(false, false);
    updateSpinControls();
    syncWheelDataAttributes();

    // Synthèse sonore Web Audio API : cliquetis horloger + carillon adapté à la couleur gagnante
    let audioCtx = null;

    function ensureWheelAudio() {
        audioCtx = createOrResumeAudioContext(audioCtx);
        return audioCtx;
    }

    function playPegClickSound(speedAbs) {
        const ac = ensureWheelAudio();
        if (!ac) return;
        try {
            const now = ac.currentTime;
            const normSpeed = Math.min(1, speedAbs / 20);

            const osc = ac.createOscillator();
            const gain = ac.createGain();
            osc.type = 'triangle';
            const baseFreq = 520 + normSpeed * 340 + (Math.random() - 0.5) * 25;
            osc.frequency.setValueAtTime(baseFreq, now);
            osc.frequency.exponentialRampToValueAtTime(140, now + 0.028);

            const vol = 0.04 + normSpeed * 0.085;
            gain.gain.setValueAtTime(vol, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

            osc.connect(gain);
            gain.connect(ac.destination);
            osc.start(now);
            osc.stop(now + 0.035);

            const ping = ac.createOscillator();
            const pingGain = ac.createGain();
            ping.type = 'sine';
            ping.frequency.setValueAtTime(2150 + normSpeed * 400, now);
            pingGain.gain.setValueAtTime(vol * 0.22, now);
            pingGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.022);

            ping.connect(pingGain);
            pingGain.connect(ac.destination);
            ping.start(now);
            ping.stop(now + 0.025);
        } catch {
            // Ignore si l'audio est bloqué
        }
    }

    function playWheelWinChime(colorType) {
        const ac = ensureWheelAudio();
        if (!ac) return;
        try {
            const notes = colorType === 'red'
                ? RED_FANFARE_NOTES
                : (colorType === 'green' ? GREEN_CHIME_NOTES : WHITE_CHIME_NOTES);
            const stepDelay = colorType === 'red' ? 0.08 : 0.075;
            const peakVol = colorType === 'red' ? 0.1 : 0.075;
            const tailSec = colorType === 'red' ? 1.25 : 0.75;

            notes.forEach((freq, idx) => {
                const start = ac.currentTime + idx * stepDelay;
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = colorType === 'red' ? 'triangle' : 'sine';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.001, start);
                gain.gain.linearRampToValueAtTime(peakVol, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0008, start + tailSec);

                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(start);
                osc.stop(start + tailSec + 0.05);
            });
        } catch {
            // Ignore
        }
    }

    function spawnWinSparkles(cx, cy, r) {
        for (let i = 0; i < 38; i++) {
            const angle = POINTER_TOP_ANGLE + (Math.random() - 0.5) * 1.5;
            const dist = r * (0.25 + Math.random() * 0.65);
            const spd = 28 + Math.random() * 82;
            sparkles.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                vx: Math.cos(angle) * spd + (Math.random() - 0.5) * 35,
                vy: Math.sin(angle) * spd - 20,
                size: 2.2 + Math.random() * 3.2,
                color: WHEEL_SPARKLE_PALETTE[Math.floor(Math.random() * WHEEL_SPARKLE_PALETTE.length)],
                life: 0.9 + Math.random() * 0.5
            });
        }
    }

    function showFullScreenPrizeReveal(outcome) {
        const seg = outcome.segment;
        const turnsAfter = outcome.nextState.turnsRemaining;
        wheelState = 'revealing';
        syncWheelDataAttributes();

        wheelRevealOverlay.dataset.theme = seg.colorType;
        wheelRevealKicker.textContent = getRevealKickerText(seg);
        wheelRevealTitle.textContent = seg.prizeText;
        wheelRevealSubtext.textContent = getRevealStatusText(seg, turnsAfter);
        wheelRevealBtn.textContent = outcome.nextState.finished
            ? 'Garder mon lot'
            : (seg.consumesTurn ? 'Retour à la roue' : 'Rejouer');

        populateRevealParticles(seg.colorType);
        wheelRevealOverlay.setAttribute('aria-hidden', 'false');

        // Phase 1 : la couleur de la case gagnante envahit tout l'écran
        requestAnimationFrame(() => {
            wheelRevealOverlay.classList.add('flooding');
        });

        // Phase 2 : une fois l'écran rempli de la couleur gagnante, le texte du lot apparaît
        scheduleTimeout(() => {
            wheelRevealOverlay.classList.add('revealed');
        }, REVEAL_TEXT_DELAY_MS);
    }

    wheelRevealBtn.onclick = () => {
        if (wheelState !== 'revealing') return;
        wheelRevealOverlay.classList.remove('revealed');
        wheelRevealOverlay.classList.remove('flooding');
        wheelRevealOverlay.setAttribute('aria-hidden', 'true');

        const wasBonus = lastSegment && !lastSegment.consumesTurn;
        wheelState = sessionState.finished ? 'finished' : 'idle';
        updateTurnsCounterDisplay(true, wasBonus);
        renderFinishedSummary();
        updateSpinControls();
        syncWheelDataAttributes();
    };

    // Lance un tour dirigé (ou aléatoire rouge au dernier tour) avec physique fluide
    function triggerControlledSpin(direction = 1, baseImpulse = 0) {
        if (wheelState !== 'idle' || sessionState.finished) return;

        const outcome = resolveNextSpinOutcome(sessionState, segments, getCryptoRandomFloat());
        if (!outcome) return;

        ensureWheelAudio();
        winningSegmentIndex = -1;
        winGlowPulse = 0;

        // Position naturelle variée à l'intérieur de la case cible (évite les clous de bordure)
        const offsetRatio = 0.25 + getCryptoRandomFloat() * 0.5;
        const extraRotations = Math.min(7, 5 + Math.floor(getCryptoRandomFloat() * 2) + (Math.abs(baseImpulse) > 8 ? 1 : 0));
        const trajectory = computeTargetSpinTrajectory(
            wheelAngle,
            outcome.segmentIndex,
            numSegments,
            direction,
            offsetRatio,
            extraRotations
        );
        const durationSec = 4.35 + getCryptoRandomFloat() * 0.65;

        activeSpin = {
            outcome,
            startAngle: trajectory.startAngle,
            totalDelta: trajectory.totalDelta,
            durationSec,
            startedAtMs: performance.now()
        };

        wheelState = 'spinning';
        updateSpinControls();
        syncWheelDataAttributes();
    }

    wheelSpinBtn.onclick = () => {
        if (sessionState.finished) {
            closeFullscreenLuckyWheel();
            return;
        }
        if (wheelState !== 'idle') return;
        triggerControlledSpin(1, 0);
    };

    // Interaction directe au doigt / souris sur la roue (glisser-lancer fluide)
    function getPointerAngleFromCenter(clientX, clientY) {
        const rect = wheelCanvas.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(clientY - cy, clientX - cx);
    }

    const onPointerDown = (clientX, clientY) => {
        if (wheelState !== 'idle' || sessionState.finished) return;
        ensureWheelAudio();
        isDragging = true;
        winningSegmentIndex = -1;
        wheelOmega = 0;
        smoothedDragOmega = 0;
        dragLastPointerAngle = getPointerAngleFromCenter(clientX, clientY);
        dragLastTime = performance.now();
    };

    const onPointerMove = (clientX, clientY) => {
        if (!isDragging || wheelState !== 'idle') return;
        const now = performance.now();
        const dt = Math.max(0.004, (now - dragLastTime) / 1000);
        const curAngle = getPointerAngleFromCenter(clientX, clientY);
        let delta = curAngle - dragLastPointerAngle;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;

        wheelAngle += delta;
        const instOmega = delta / dt;
        smoothedDragOmega = smoothedDragOmega * 0.6 + instOmega * 0.4;

        dragLastPointerAngle = curAngle;
        dragLastTime = now;
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;
        if (wheelState === 'idle' && Math.abs(smoothedDragOmega) > 1.3) {
            const dir = smoothedDragOmega >= 0 ? 1 : -1;
            triggerControlledSpin(dir, smoothedDragOmega);
        }
    };

    const onTouchStart = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchMove = (e) => {
        if (!isDragging || !e.touches || e.touches.length === 0) return;
        onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => onPointerUp();

    const onMouseDown = (e) => onPointerDown(e.clientX, e.clientY);
    const onMouseMove = (e) => onPointerMove(e.clientX, e.clientY);
    const onMouseUp = () => onPointerUp();

    wheelCanvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    wheelCanvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    function drawWheelScene() {
        ctx.clearRect(0, 0, size, size);

        const cx = size / 2;
        const cy = size / 2 + 8;
        const outerRadius = size * 0.43;
        const rimInnerRadius = outerRadius - 13;
        const hubRadius = outerRadius * 0.19;

        // 1. Ombre portée douce sous la roue
        ctx.save();
        ctx.fillStyle = 'rgba(26, 33, 30, 0.16)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + 10, outerRadius * 0.96, outerRadius * 0.95, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Couronne extérieure en Or Brossé (jante de la roue)
        ctx.save();
        const rimGrad = ctx.createLinearGradient(cx - outerRadius, cy - outerRadius, cx + outerRadius, cy + outerRadius);
        rimGrad.addColorStop(0.0, '#A87D3E');
        rimGrad.addColorStop(0.22, '#E5CA93');
        rimGrad.addColorStop(0.42, '#FFF3D6');
        rimGrad.addColorStop(0.58, '#C59B5F');
        rimGrad.addColorStop(0.78, '#936A30');
        rimGrad.addColorStop(1.0, '#DFC086');

        ctx.fillStyle = rimGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, outerRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(110, 74, 24, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.strokeStyle = '#1E352B';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rimInnerRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 3. Quartiers (segments) de la roue en rotation
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(wheelAngle);

        for (let i = 0; i < numSegments; i++) {
            const startA = i * sliceAngle;
            const endA = startA + sliceAngle;
            const midA = startA + sliceAngle / 2;
            const seg = segments[i];

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, rimInnerRadius - 1, startA, endA);
            ctx.closePath();

            ctx.fillStyle = seg.color;
            ctx.fill();

            const sliceGrad = ctx.createRadialGradient(0, 0, hubRadius, 0, 0, rimInnerRadius);
            sliceGrad.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
            sliceGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
            sliceGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
            ctx.fillStyle = sliceGrad;
            ctx.fill();

            if (i === winningSegmentIndex) {
                const highlightAlpha = 0.25 + 0.14 * Math.sin(winGlowPulse * 5.5);
                ctx.fillStyle = `rgba(255, 232, 175, ${highlightAlpha})`;
                ctx.fill();
            }

            ctx.strokeStyle = '#C59B5F';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(startA) * (rimInnerRadius - 1), Math.sin(startA) * (rimInnerRadius - 1));
            ctx.stroke();

            // Petite étoile filigranée (les lots restent secrets jusqu'à l'arrêt pour garder le suspense)
            ctx.save();
            ctx.rotate(midA);
            const isDarkSlice = seg.colorType === 'green' || seg.colorType === 'red';
            ctx.fillStyle = isDarkSlice ? 'rgba(232, 213, 181, 0.78)' : 'rgba(197, 155, 95, 0.82)';
            ctx.font = '11px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', rimInnerRadius - 20, 0);
            ctx.restore();
        }

        ctx.strokeStyle = 'rgba(197, 155, 95, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, rimInnerRadius - 8, 0, Math.PI * 2);
        ctx.stroke();

        // 4. Clous en laiton doré (16 clous sur la jante qui percutent le clapet)
        const pegRadiusDist = outerRadius - 6.5;
        for (let p = 0; p < numPegs; p++) {
            const pa = p * pegStepAngle;
            const px = Math.cos(pa) * pegRadiusDist;
            const py = Math.sin(pa) * pegRadiusDist;

            ctx.fillStyle = 'rgba(40, 26, 10, 0.45)';
            ctx.beginPath();
            ctx.arc(px + 0.8, py + 1.2, 3.5, 0, Math.PI * 2);
            ctx.fill();

            const pegGrad = ctx.createRadialGradient(px - 1, py - 1, 0.5, px, py, 3.5);
            pegGrad.addColorStop(0, '#FFFDF5');
            pegGrad.addColorStop(0.55, '#E5C687');
            pegGrad.addColorStop(1, '#8C6226');
            ctx.fillStyle = pegGrad;
            ctx.beginPath();
            ctx.arc(px, py, 3.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // 5. Médaillon central (Sceau bordeaux & couronne d'or)
        ctx.save();
        ctx.translate(cx, cy);

        ctx.fillStyle = 'rgba(20, 25, 22, 0.28)';
        ctx.beginPath();
        ctx.arc(0, 3, hubRadius + 2, 0, Math.PI * 2);
        ctx.fill();

        const hubGoldGrad = ctx.createLinearGradient(-hubRadius, -hubRadius, hubRadius, hubRadius);
        hubGoldGrad.addColorStop(0, '#E8CF9C');
        hubGoldGrad.addColorStop(0.5, '#FFF2D2');
        hubGoldGrad.addColorStop(1, '#9E7336');
        ctx.fillStyle = hubGoldGrad;
        ctx.beginPath();
        ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
        ctx.fill();

        const sealGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, hubRadius - 4.5);
        sealGrad.addColorStop(0, '#B53839');
        sealGrad.addColorStop(0.7, '#9E2A2B');
        sealGrad.addColorStop(1, '#6E1B1C');
        ctx.fillStyle = sealGrad;
        ctx.beginPath();
        ctx.arc(0, 0, hubRadius - 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#E8D5B5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, hubRadius - 7.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.rotate(wheelAngle * 0.5);
        ctx.fillStyle = '#FAF0D4';
        ctx.beginPath();
        for (let k = 0; k < 8; k++) {
            const a = (k * Math.PI) / 4;
            const r = k % 2 === 0 ? hubRadius * 0.42 : hubRadius * 0.16;
            if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
            else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // 6. Clapet supérieur (Pointeur à 12h avec rebond physique sur les clous)
        ctx.save();
        const pivotX = cx;
        const pivotY = cy - outerRadius - 6;
        ctx.translate(pivotX, pivotY);
        ctx.rotate(clapperAngle);

        ctx.fillStyle = 'rgba(26, 33, 30, 0.25)';
        ctx.beginPath();
        ctx.moveTo(-9, -2);
        ctx.lineTo(9, -2);
        ctx.lineTo(0, 24);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#9E2A2B';
        ctx.strokeStyle = '#FAF0D4';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-8.5, -4);
        ctx.lineTo(8.5, -4);
        ctx.lineTo(0, 22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#C59B5F';
        ctx.beginPath();
        ctx.arc(0, -3, 5.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF3D6';
        ctx.beginPath();
        ctx.arc(-1.2, -4.2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 7. Particules d'or et d'étoiles à l'arrêt
        for (let i = sparkles.length - 1; i >= 0; i--) {
            const sp = sparkles[i];
            ctx.save();
            ctx.globalAlpha = clamp(sp.life, 0, 1);
            ctx.fillStyle = sp.color;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    let animId = null;
    let lastFrameTime = performance.now();

    function stepWheel(now) {
        const dt = clamp((now - lastFrameTime) / 1000, 0.001, 0.04);
        lastFrameTime = now;

        if (activeSpin && !isDragging) {
            const elapsedSec = Math.max(0, (now - activeSpin.startedAtMs) / 1000);
            const progress = clamp(elapsedSec / activeSpin.durationSec, 0, 1);
            const sample = sampleSpinCurve(
                activeSpin.startAngle,
                activeSpin.totalDelta,
                progress,
                activeSpin.durationSec
            );

            wheelAngle = sample.angle;
            wheelOmega = sample.omega;

            if (sample.done) {
                const finishedOutcome = activeSpin.outcome;
                activeSpin = null;
                wheelOmega = 0;

                winningSegmentIndex = finishedOutcome.segmentIndex;
                lastSegment = finishedOutcome.segment;
                sessionState = finishedOutcome.nextState;

                playWheelWinChime(lastSegment.colorType);
                spawnWinSparkles(size / 2, size / 2 + 8, size * 0.43);

                if (sessionState.finished) {
                    markGameWon(item.day);
                    saveAndSyncQuizAnswer(
                        `roue_chance_jour_${item.day}`,
                        `La Roue de la Chance (Jour ${item.day})`,
                        lastSegment.prizeText,
                        `Lots gagnés : ${sessionState.wonPrizes.map((p) => p.prizeText).join(' • ')}`
                    );
                }

                syncWheelDataAttributes();

                // Courte pause sur la case gagnante illuminée avant la vague de couleur plein écran
                scheduleTimeout(() => {
                    showFullScreenPrizeReveal(finishedOutcome);
                }, REVEAL_FLOOD_DELAY_MS);
            }
        }

        // Détection du passage des clous sous le clapet à 12h (-PI/2)
        const normalizedPegPos = (((POINTER_TOP_ANGLE - wheelAngle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const currentPegIndex = Math.floor(normalizedPegPos / pegStepAngle);

        if (currentPegIndex !== lastPegIndex) {
            const currentSpeed = isDragging ? Math.abs(smoothedDragOmega) : Math.abs(wheelOmega);
            const spinDir = (isDragging ? smoothedDragOmega : wheelOmega) >= 0 ? 1 : -1;
            const kickStrength = Math.min(0.62, 0.16 + (currentSpeed / 22) * 0.46);

            clapperAngle = -spinDir * kickStrength;
            clapperOmega = -spinDir * currentSpeed * 0.35;

            if (currentSpeed > 0.08) {
                playPegClickSound(currentSpeed);
            }
            if (navigator.vibrate && currentSpeed > 0.5) {
                navigator.vibrate(5);
            }
            lastPegIndex = currentPegIndex;
        }

        // Ressort de rappel du clapet supérieur
        const clapperAcc = -CLAPPER_SPRING_K * clapperAngle - CLAPPER_DAMPING * clapperOmega;
        clapperOmega += clapperAcc * dt;
        clapperAngle += clapperOmega * dt;

        if (winningSegmentIndex >= 0) {
            winGlowPulse += dt;
        }

        for (let i = sparkles.length - 1; i >= 0; i--) {
            const sp = sparkles[i];
            sp.x += sp.vx * dt;
            sp.y += sp.vy * dt;
            sp.vy += 90 * dt;
            sp.life -= dt * 0.9;
            if (sp.life <= 0) {
                sparkles.splice(i, 1);
            }
        }

        drawWheelScene();
        animId = requestAnimationFrame(stepWheel);
    }

    animId = requestAnimationFrame(stepWheel);

    activeWheelCleanup = () => {
        clearPendingTimeouts();
        cancelAnimationFrame(animId);
        closeAudioContextSafely(audioCtx);
        resetRevealOverlay();
        if (wheelSummary) {
            wheelSummary.hidden = true;
            wheelSummary.innerHTML = '';
        }
        wheelSpinBtn.onclick = null;
        if (wheelRevealBtn) {
            wheelRevealBtn.onclick = null;
        }
        window.removeEventListener('resize', resizeWheelCanvas);
        wheelCanvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        wheelCanvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
}
