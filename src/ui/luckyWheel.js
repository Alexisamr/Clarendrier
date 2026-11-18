/**
 * ============================================================================
 * ROUE DE LA CHANCE HAUTE FIDÉLITÉ (JOUR 9)
 * - Esthétique éditoriale sapin / ivoire / bordeaux / or brossé dans la DA du site
 * - Segments vides pour l'instant (prêts à accueillir du texte plus tard)
 * - Aléatoire cryptographique réel (window.crypto.getRandomValues)
 * - Lancement au doigt (glisser-lancer directement sur la roue) ou via le bouton
 * - Physique réaliste des clous dorés qui percutent le clapet supérieur avec rebond
 *   et synthèse audio Web Audio API (cliquetis horloger/bois/laiton)
 * ============================================================================
 */

import { DEFAULT_WHEEL_SEGMENTS } from '../data/calendarData.js';
import {
    getCryptoRandomFloat,
    clamp,
    createOrResumeAudioContext,
    closeAudioContextSafely
} from '../utils/helpers.js';
import { stopActiveGame, markGameWon } from '../logic/state.js';
import {
    fsWheelOverlay,
    fsWheelCloseBtn,
    wheelCanvas,
    wheelSpinBtn
} from './dom.js';

const WHEEL_SPARKLE_PALETTE = ['#C59B5F', '#FAF0D4', '#9E2A2B', '#1E352B', '#E8D5B5'];
const STOP_CHIME_NOTES = [523.25, 659.25, 783.99, 1046.5];
const CLAPPER_SPRING_K = 260;
const CLAPPER_DAMPING = 18;
const POINTER_TOP_ANGLE = -Math.PI / 2;

let activeWheelCleanup = null;

export function closeFullscreenLuckyWheel() {
    if (activeWheelCleanup) {
        activeWheelCleanup();
        activeWheelCleanup = null;
    }
    if (fsWheelOverlay) {
        fsWheelOverlay.classList.remove('active');
        fsWheelOverlay.setAttribute('aria-hidden', 'true');
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

    let size = 320;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    function resizeWheelCanvas() {
        const rect = wheelCanvas.getBoundingClientRect();
        size = Math.max(260, Math.round(Math.min(rect.width || 320, rect.height || 320)));
        wheelCanvas.width = size * dpr;
        wheelCanvas.height = size * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeWheelCanvas();
    window.addEventListener('resize', resizeWheelCanvas);

    // État physique de la roue et du clapet supérieur
    let wheelAngle = getCryptoRandomFloat() * Math.PI * 2;
    let wheelOmega = 0; // Vitesse angulaire (rad/s)
    let isSpinning = false;
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

    wheelSpinBtn.disabled = false;

    // Synthèse sonore Web Audio API : cliquetis horloger / bois & laiton à chaque clou + carillon doux à l'arrêt
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
            const normSpeed = Math.min(1, speedAbs / 18);

            // 1. Impact boisé/mat du clapet (triangle court)
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

            // 2. Légère résonance métallique dorée (clou en laiton)
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

    function playWheelStopChime() {
        const ac = ensureWheelAudio();
        if (!ac) return;
        try {
            STOP_CHIME_NOTES.forEach((freq, idx) => {
                const start = ac.currentTime + idx * 0.075;
                const osc = ac.createOscillator();
                const gain = ac.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, start);

                gain.gain.setValueAtTime(0.001, start);
                gain.gain.linearRampToValueAtTime(0.075, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0008, start + 0.75);

                osc.connect(gain);
                gain.connect(ac.destination);
                osc.start(start);
                osc.stop(start + 0.8);
            });
        } catch {
            // Ignore
        }
    }

    function spawnWinSparkles(cx, cy, r) {
        for (let i = 0; i < 34; i++) {
            const angle = POINTER_TOP_ANGLE + (Math.random() - 0.5) * 1.4;
            const dist = r * (0.25 + Math.random() * 0.65);
            const spd = 25 + Math.random() * 75;
            sparkles.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                vx: Math.cos(angle) * spd + (Math.random() - 0.5) * 35,
                vy: Math.sin(angle) * spd - 20,
                size: 2.2 + Math.random() * 3.2,
                color: WHEEL_SPARKLE_PALETTE[Math.floor(Math.random() * WHEEL_SPARKLE_PALETTE.length)],
                life: 0.85 + Math.random() * 0.5
            });
        }
    }

    // Lance la roue avec une impulsion véritablement aléatoire (cryptographique)
    function triggerRandomSpin(direction = 1, baseImpulse = 0) {
        ensureWheelAudio();
        winningSegmentIndex = -1;
        winGlowPulse = 0;

        // Vitesse initiale aléatoire entre 15.5 et 25.5 rad/s + bruit cryptographique fin
        const r1 = getCryptoRandomFloat();
        const r2 = getCryptoRandomFloat();
        const randomOmega = 16.0 + r1 * 9.5 + r2 * 2.2 + Math.min(6, Math.abs(baseImpulse) * 0.25);

        wheelOmega = (direction >= 0 ? 1 : -1) * randomOmega;
        isSpinning = true;
        wheelSpinBtn.disabled = true;
    }

    wheelSpinBtn.onclick = () => {
        if (isSpinning) return;
        triggerRandomSpin(1, 0);
    };

    // Interaction directe au doigt / souris sur la roue (tourner manuellement et lancer d'un coup de doigt)
    function getPointerAngleFromCenter(clientX, clientY) {
        const rect = wheelCanvas.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(clientY - cy, clientX - cx);
    }

    const onPointerDown = (clientX, clientY) => {
        if (isSpinning && Math.abs(wheelOmega) > 3.5) return;
        ensureWheelAudio();
        isDragging = true;
        isSpinning = false;
        winningSegmentIndex = -1;
        wheelOmega = 0;
        smoothedDragOmega = 0;
        dragLastPointerAngle = getPointerAngleFromCenter(clientX, clientY);
        dragLastTime = performance.now();
    };

    const onPointerMove = (clientX, clientY) => {
        if (!isDragging) return;
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
        if (Math.abs(smoothedDragOmega) > 1.3) {
            const dir = smoothedDragOmega >= 0 ? 1 : -1;
            triggerRandomSpin(dir, smoothedDragOmega);
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

    function getSegmentUnderPointer(angle) {
        const rel = ((POINTER_TOP_ANGLE - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        return Math.floor(rel / sliceAngle) % numSegments;
    }

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

        // Filet intérieur de la couronne dorée
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

            // Légère patine radiale pour donner du relief à chaque quartier
            const sliceGrad = ctx.createRadialGradient(0, 0, hubRadius, 0, 0, rimInnerRadius);
            sliceGrad.addColorStop(0, 'rgba(0, 0, 0, 0.08)');
            sliceGrad.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
            sliceGrad.addColorStop(1, 'rgba(0, 0, 0, 0.12)');
            ctx.fillStyle = sliceGrad;
            ctx.fill();

            // Si c'est le quartier gagnant à l'arrêt : douce lueur dorée
            if (i === winningSegmentIndex) {
                const highlightAlpha = 0.22 + 0.12 * Math.sin(winGlowPulse * 5);
                ctx.fillStyle = `rgba(255, 232, 175, ${highlightAlpha})`;
                ctx.fill();
            }

            // Filet doré séparateur entre les quartiers
            ctx.strokeStyle = '#C59B5F';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(startA) * (rimInnerRadius - 1), Math.sin(startA) * (rimInnerRadius - 1));
            ctx.stroke();

            // Fin liseré d'arche dorée et petite étoile filigranée dans chaque quartier
            ctx.save();
            ctx.rotate(midA);
            const isDarkSlice = seg.color === '#1E352B' || seg.color === '#9E2A2B';
            ctx.fillStyle = isDarkSlice ? 'rgba(232, 213, 181, 0.72)' : 'rgba(197, 155, 95, 0.78)';
            ctx.font = '10px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✦', rimInnerRadius - 18, 0);

            if (seg.label) {
                ctx.fillStyle = seg.textColor || (isDarkSlice ? '#FAF7F2' : '#1A211E');
                ctx.font = '600 13px Cormorant Garamond, Georgia, serif';
                ctx.textAlign = 'right';
                ctx.fillText(seg.label, rimInnerRadius - 30, 0);
            }
            ctx.restore();
        }

        // Filet circulaire intérieur gravé près du bord des quartiers
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

        // Étoile centrale dorée qui tourne doucement avec la roue
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

        // Ombre du clapet
        ctx.fillStyle = 'rgba(26, 33, 30, 0.25)';
        ctx.beginPath();
        ctx.moveTo(-9, -2);
        ctx.lineTo(9, -2);
        ctx.lineTo(0, 24);
        ctx.closePath();
        ctx.fill();

        // Corps du clapet (bordeaux & bordure or)
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

        // Rivet supérieur en or
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

        if (isSpinning && !isDragging) {
            wheelAngle += wheelOmega * dt;

            // Frottement fluide et progressif (longue décélération pleine de suspense)
            const speed = Math.abs(wheelOmega);
            const dragCoeff = speed > 4 ? 0.52 : (speed > 1.2 ? 0.68 : 0.95);
            wheelOmega *= Math.exp(-dragCoeff * dt);

            // Ralentissement supplémentaire dû à la résistance mécanique des clous à basse vitesse
            if (speed < 0.22) {
                wheelOmega = 0;
                isSpinning = false;
                wheelSpinBtn.disabled = false;
                winningSegmentIndex = getSegmentUnderPointer(wheelAngle);
                playWheelStopChime();
                spawnWinSparkles(size / 2, size / 2 + 8, size * 0.43);
                markGameWon(item.day);
            }
        }

        // Détection du passage des clous sous le clapet à 12h (-PI/2)
        const normalizedPegPos = (((POINTER_TOP_ANGLE - wheelAngle) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const currentPegIndex = Math.floor(normalizedPegPos / pegStepAngle);

        if (currentPegIndex !== lastPegIndex) {
            const currentSpeed = isDragging ? Math.abs(smoothedDragOmega) : Math.abs(wheelOmega);
            const spinDir = (isDragging ? smoothedDragOmega : wheelOmega) >= 0 ? 1 : -1;
            const kickStrength = Math.min(0.62, 0.16 + (currentSpeed / 22) * 0.46);

            // Le clapet est poussé dans le sens de rotation de la roue
            clapperAngle = -spinDir * kickStrength;
            clapperOmega = -spinDir * currentSpeed * 0.35;

            playPegClickSound(currentSpeed);
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
        cancelAnimationFrame(animId);
        closeAudioContextSafely(audioCtx);
        window.removeEventListener('resize', resizeWheelCanvas);
        wheelCanvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        wheelCanvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
}
