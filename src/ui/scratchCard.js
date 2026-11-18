/**
 * ============================================================================
 * CARTE À GRATTER VIRTUELLE HAUTE FIDÉLITÉ (JOURS 6 & 7)
 * - Texture métallisée dorée réaliste + médaillon gaufré
 * - Bords de grattage crantés façon pièce de monnaie
 * - Copeaux d'or physiques qui s'envolent et tombent sous le doigt + pièce 3D
 * - Synthèse sonore douce de grattage papier/métal (Web Audio API)
 * ============================================================================
 */

import { ASSET_PATHS } from '../data/calendarData.js';
import { clamp, closeAudioContextSafely } from '../utils/helpers.js';
import {
    stopActiveGame,
    isCardScratched,
    markCardScratched,
    markGameWon,
    saveAndSyncQuizAnswer
} from '../logic/state.js';
import {
    fsScratchOverlay,
    fsScratchCloseBtn,
    fsScratchTopLabel,
    scratchCardTabs,
    scratchSerial,
    scratchHeaderTitle,
    scratchViewport,
    scratchUnderImg,
    scratchFoilCanvas,
    scratchFxCanvas,
    scratchPhotoCaption,
    scratchFooterText,
    scratchDoneBtn
} from './dom.js';
import { openModal } from './modal.js';

const SHAVING_COLORS = ['#E8D5B5', '#C59B5F', '#FFF2D0', '#9E7336', '#D4AF37'];
const COIN_SCRATCH_RADIUS = 25;
const SHAVINGS_GRAVITY = 380;
const DEFAULT_REVEAL_THRESHOLD = 50;
const DEFAULT_CAPTION_THRESHOLD = 50;

let activeScratchCleanup = null;

export function closeFullscreenScratchCard() {
    if (activeScratchCleanup) {
        activeScratchCleanup();
        activeScratchCleanup = null;
    }
    if (fsScratchOverlay) {
        fsScratchOverlay.classList.remove('active');
        fsScratchOverlay.setAttribute('aria-hidden', 'true');
    }
}

export function initScratchCardListeners() {
    if (fsScratchCloseBtn) {
        fsScratchCloseBtn.addEventListener('click', closeFullscreenScratchCard);
    }
}

export function getNormalizedScratchCards(item, defaultLabel = 'Carte n°1') {
    if (Array.isArray(item.cards) && item.cards.length > 0) {
        return item.cards;
    }
    return [
        {
            id: `day${item.day}_img1`,
            label: defaultLabel,
            imageSrc: item.imageSrc || ASSET_PATHS.SCRATCH_DAY6_IMG1,
            revealThreshold: 55,
            caption: ''
        }
    ];
}

export function launchFullscreenScratchCard(item, startCardIndex = 0) {
    stopActiveGame();
    if (activeScratchCleanup) {
        activeScratchCleanup();
        activeScratchCleanup = null;
    }

    const cards = getNormalizedScratchCards(item, 'Carte n°1');
    let currentCardIndex = clamp(startCardIndex, 0, cards.length - 1);

    fsScratchOverlay.classList.add('active');
    fsScratchOverlay.setAttribute('aria-hidden', 'false');

    const foilCtx = scratchFoilCanvas.getContext('2d', { willReadFrequently: true });
    const fxCtx = scratchFxCanvas.getContext('2d');

    let vw = 300;
    let vh = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Synthèse audio Web Audio API pour le bruit réaliste de pièce qui gratte
    let audioCtx = null;
    let scratchGain = null;
    let scratchFilter = null;
    let soundTimeout = null;

    function triggerScratchSound(speed) {
        try {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                audioCtx = new AudioContextClass();

                const bufferSize = audioCtx.sampleRate * 1.5;
                const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = (Math.random() * 2 - 1) * 0.65;
                }

                const whiteNoise = audioCtx.createBufferSource();
                whiteNoise.buffer = noiseBuffer;
                whiteNoise.loop = true;

                scratchFilter = audioCtx.createBiquadFilter();
                scratchFilter.type = 'bandpass';
                scratchFilter.frequency.value = 1600;
                scratchFilter.Q.value = 2.4;

                scratchGain = audioCtx.createGain();
                scratchGain.gain.value = 0;

                whiteNoise.connect(scratchFilter);
                scratchFilter.connect(scratchGain);
                scratchGain.connect(audioCtx.destination);
                whiteNoise.start(0);
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const normSpeed = Math.min(1, speed / 26);
            const targetGain = 0.015 + normSpeed * 0.055;
            const targetFreq = 1200 + normSpeed * 1400;

            scratchFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.02);
            scratchGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.015);

            clearTimeout(soundTimeout);
            soundTimeout = setTimeout(() => {
                if (scratchGain && audioCtx) {
                    scratchGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.03);
                }
            }, 60);
        } catch {
            // Ignore si l'audio est bloqué
        }
    }

    let isScratching = false;
    let isRevealed = false;
    let captionShown = false;
    let lastPt = null;
    let pointerPos = null;
    let strokeCount = 0;
    const shavings = []; // Copeaux de dorure et paillettes

    function renderTabs() {
        if (!scratchCardTabs) return;
        if (cards.length <= 1) {
            scratchCardTabs.hidden = true;
            scratchCardTabs.innerHTML = '';
            return;
        }
        scratchCardTabs.hidden = false;
        scratchCardTabs.innerHTML = '';
        cards.forEach((c, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `scratch-tab-btn${idx === currentCardIndex ? ' active' : ''}`;
            const doneMark = isCardScratched(c.id) ? ' ✨' : '';
            btn.textContent = `${c.label || `Photo ${idx + 1}`}${doneMark}`;
            btn.addEventListener('click', () => {
                if (idx !== currentCardIndex) {
                    loadCard(idx);
                }
            });
            scratchCardTabs.appendChild(btn);
        });
    }

    // Dessine une pellicule dorée métallisée ultra-réaliste
    function renderMetallicGoldFoil(card, idx) {
        const rect = scratchViewport.getBoundingClientRect();
        vw = Math.max(240, Math.round(rect.width));
        vh = Math.max(300, Math.round(rect.height));

        scratchFoilCanvas.width = vw * dpr;
        scratchFoilCanvas.height = vh * dpr;
        foilCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        scratchFxCanvas.width = vw * dpr;
        scratchFxCanvas.height = vh * dpr;
        fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        foilCtx.globalCompositeOperation = 'source-over';

        // 1. Dégradé métallique or brossé en diagonale
        const grad = foilCtx.createLinearGradient(0, 0, vw, vh);
        grad.addColorStop(0.0, '#B78C4C');
        grad.addColorStop(0.18, '#E4C992');
        grad.addColorStop(0.34, '#FAF0D4');
        grad.addColorStop(0.50, '#C59B5F');
        grad.addColorStop(0.68, '#9D7336');
        grad.addColorStop(0.84, '#E8CF9C');
        grad.addColorStop(1.0, '#B68A49');
        foilCtx.fillStyle = grad;
        foilCtx.fillRect(0, 0, vw, vh);

        // 2. Reflet spéculaire secondaire
        const sheen = foilCtx.createRadialGradient(vw * 0.35, vh * 0.28, 10, vw * 0.5, vh * 0.5, vw * 0.85);
        sheen.addColorStop(0, 'rgba(255, 250, 235, 0.38)');
        sheen.addColorStop(0.5, 'rgba(255, 245, 215, 0.08)');
        sheen.addColorStop(1, 'rgba(110, 75, 25, 0.18)');
        foilCtx.fillStyle = sheen;
        foilCtx.fillRect(0, 0, vw, vh);

        // 3. Stries fines d'aluminium/or brossé
        foilCtx.save();
        foilCtx.strokeStyle = 'rgba(255, 252, 240, 0.14)';
        foilCtx.lineWidth = 0.7;
        for (let y = -vh; y < vh * 2; y += 4) {
            foilCtx.beginPath();
            foilCtx.moveTo(0, y);
            foilCtx.lineTo(vw, y + vw * 0.25);
            foilCtx.stroke();
        }
        foilCtx.restore();

        // 4. Grain métallique pailleté (aspect ticket à gratter réel)
        for (let i = 0; i < 1400; i++) {
            const gx = Math.random() * vw;
            const gy = Math.random() * vh;
            const bright = i % 2 === 0;
            foilCtx.fillStyle = bright
                ? `rgba(255, 252, 238, ${0.15 + Math.random() * 0.28})`
                : `rgba(120, 82, 30, ${0.10 + Math.random() * 0.18})`;
            foilCtx.fillRect(gx, gy, 1.3, 1.3);
        }

        // 5. Motif en filigrane d'étoiles de Noël sur la feuille d'or
        foilCtx.save();
        foilCtx.fillStyle = 'rgba(115, 78, 28, 0.18)';
        foilCtx.font = '14px Georgia, serif';
        foilCtx.textAlign = 'center';
        foilCtx.textBaseline = 'middle';
        for (let r = 28; r < vh - 20; r += 44) {
            for (let c = 28; c < vw - 20; c += 44) {
                const offsetX = (Math.floor(r / 44) % 2) * 22;
                if (c + offsetX < vw - 18) {
                    foilCtx.fillText('✦', c + offsetX, r);
                }
            }
        }
        foilCtx.restore();

        // 6. Double filet d'encadrement gravé dans l'or
        foilCtx.save();
        foilCtx.strokeStyle = 'rgba(110, 74, 24, 0.42)';
        foilCtx.lineWidth = 1.5;
        foilCtx.strokeRect(12, 12, vw - 24, vh - 24);
        foilCtx.strokeStyle = 'rgba(255, 250, 235, 0.55)';
        foilCtx.lineWidth = 1;
        foilCtx.strokeRect(16, 16, vw - 32, vh - 32);
        foilCtx.restore();

        // 7. Médaillon central gaufré « GRATTE ICI »
        const cx = vw / 2;
        const cy = vh / 2;
        foilCtx.save();
        foilCtx.beginPath();
        foilCtx.arc(cx, cy, 64, 0, Math.PI * 2);
        foilCtx.fillStyle = idx === 1 ? 'rgba(30, 53, 43, 0.92)' : 'rgba(158, 42, 43, 0.9)';
        foilCtx.fill();
        foilCtx.lineWidth = 2;
        foilCtx.strokeStyle = '#FAF0D4';
        foilCtx.stroke();

        foilCtx.beginPath();
        foilCtx.arc(cx, cy, 58, 0, Math.PI * 2);
        foilCtx.lineWidth = 1;
        foilCtx.setLineDash([3, 3]);
        foilCtx.strokeStyle = 'rgba(232, 213, 181, 0.75)';
        foilCtx.stroke();
        foilCtx.setLineDash([]);

        foilCtx.fillStyle = '#FAF7F2';
        foilCtx.font = '600 11px Plus Jakarta Sans, sans-serif';
        foilCtx.textAlign = 'center';
        foilCtx.fillText(cards.length > 1 ? `✦ CARTE ${idx + 1}/${cards.length} ✦` : '✦ SURPRISE ✦', cx, cy - 16);

        foilCtx.font = 'italic 600 22px Cormorant Garamond, Georgia, serif';
        foilCtx.fillText('Gratte ici', cx, cy + 6);

        foilCtx.fillStyle = '#E8D5B5';
        foilCtx.font = '500 10px Plus Jakarta Sans, sans-serif';
        foilCtx.fillText('AVEC TON DOIGT', cx, cy + 25);
        foilCtx.restore();
    }

    function loadCard(idx) {
        currentCardIndex = idx;
        const card = cards[currentCardIndex];

        isScratching = false;
        isRevealed = false;
        captionShown = false;
        lastPt = null;
        pointerPos = null;
        strokeCount = 0;
        shavings.length = 0;

        scratchUnderImg.src = card.imageSrc || ASSET_PATHS.SCRATCH_DAY6_IMG1;
        scratchSerial.textContent = cards.length > 1
            ? `CARTE ${idx + 1} / ${cards.length} • ÉDITION D'OR`
            : `N° 00${item.day} • ÉDITION D'OR`;
        if (scratchHeaderTitle) {
            scratchHeaderTitle.textContent = card.label ? card.label.toUpperCase() : 'TICKET À GRATTER';
        }
        fsScratchTopLabel.textContent = `${card.label || 'Carte à Gratter'} • 0%`;
        scratchFooterText.textContent = 'Gratte la pellicule dorée avec ton doigt';
        scratchDoneBtn.hidden = true;
        scratchFoilCanvas.classList.remove('revealed');

        if (scratchPhotoCaption) {
            scratchPhotoCaption.hidden = true;
            scratchPhotoCaption.textContent = '';
        }

        renderTabs();
        requestAnimationFrame(() => {
            renderMetallicGoldFoil(card, idx);
        });
    }

    function spawnFoilShavings(x, y, dx, dy, count = 4) {
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 3.2;
            shavings.push({
                x: x + (Math.random() - 0.5) * 18,
                y: y + (Math.random() - 0.5) * 18,
                vx: -dx * 0.14 + spread * 45 + (Math.random() - 0.5) * 50,
                vy: -Math.abs(dy) * 0.12 - 20 - Math.random() * 55,
                sizeW: 2.2 + Math.random() * 3.8,
                sizeH: 1.2 + Math.random() * 2.4,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 14,
                color: SHAVING_COLORS[Math.floor(Math.random() * SHAVING_COLORS.length)],
                life: 0.55 + Math.random() * 0.35,
                maxLife: 0.85
            });
        }
    }

    // Coup de pièce cranté sur la couche d'or (destination-out)
    function stampCoinScratch(x, y, angle) {
        foilCtx.save();
        foilCtx.globalCompositeOperation = 'destination-out';

        // Cercle principal de la pièce
        foilCtx.beginPath();
        foilCtx.arc(x, y, COIN_SCRATCH_RADIUS, 0, Math.PI * 2);
        foilCtx.fill();

        // Micro-stries irrégulières sur les bords pour un effet de grattage ultra-réaliste
        for (let i = 0; i < 7; i++) {
            const a = angle + (i - 3) * 0.42 + (Math.random() - 0.5) * 0.25;
            const rOffset = COIN_SCRATCH_RADIUS * (0.72 + Math.random() * 0.36);
            const bx = x + Math.cos(a) * rOffset;
            const by = y + Math.sin(a) * rOffset;
            foilCtx.beginPath();
            foilCtx.arc(bx, by, 4 + Math.random() * 4.5, 0, Math.PI * 2);
            foilCtx.fill();
        }
        foilCtx.restore();
    }

    function computeScratchedPercentage() {
        const imgData = foilCtx.getImageData(0, 0, scratchFoilCanvas.width, scratchFoilCanvas.height).data;
        let transparentPixels = 0;
        let totalSampled = 0;
        const step = 16 * 4;

        for (let i = 3; i < imgData.length; i += step) {
            totalSampled++;
            if (imgData[i] < 128) {
                transparentPixels++;
            }
        }
        return totalSampled > 0 ? Math.min(100, Math.round((transparentPixels / totalSampled) * 100)) : 0;
    }

    function revealCaptionIfNeeded(card, pct) {
        if (!card.caption || captionShown || !scratchPhotoCaption) return;
        const threshold = card.captionThreshold || DEFAULT_CAPTION_THRESHOLD;
        if (pct >= threshold) {
            captionShown = true;
            scratchPhotoCaption.textContent = card.caption;
            scratchPhotoCaption.hidden = false;
        }
    }

    function unlockCardMilestone(card) {
        if (isRevealed) return;
        isRevealed = true;

        revealCaptionIfNeeded(card, 100);

        // Bouton d'action : s'il y a une 2ème carte après celle-ci, propose de passer à la 2ème carte,
        // tout en laissant Clara continuer de gratter tout le reste de la carte elle-même !
        scratchDoneBtn.hidden = false;
        if (currentCardIndex < cards.length - 1) {
            scratchDoneBtn.textContent = `Passer à la ${cards[currentCardIndex + 1].label.toLowerCase()} à gratter →`;
            scratchDoneBtn.onclick = () => {
                loadCard(currentCardIndex + 1);
            };
        } else {
            scratchDoneBtn.textContent = 'Garder ce souvenir ❤️';
            scratchDoneBtn.onclick = () => {
                closeFullscreenScratchCard();
            };
        }

        markCardScratched(card.id);
        markGameWon(item.day);
        renderTabs();

        saveAndSyncQuizAnswer(
            `scratch_${card.id}`,
            `Carte à gratter (${card.label} - Jour ${item.day})`,
            `A gratté ${card.label} (${card.imageSrc})${card.caption ? ` — "${card.caption}"` : ''}`,
            `Surprise Jour ${item.day}`
        );

        openModal(item);
    }

    function checkProgress() {
        const card = cards[currentCardIndex];
        const pct = computeScratchedPercentage();
        fsScratchTopLabel.textContent = `${card.label || 'Carte à Gratter'} • ${pct}%`;

        if (pct >= 96) {
            scratchFooterText.textContent = '✨ Carte entièrement grattée !';
        } else if (pct >= 50) {
            scratchFooterText.textContent = 'Continue de gratter pour tout découvrir ✨';
        }

        revealCaptionIfNeeded(card, pct);

        const unlockTarget = card.revealThreshold || DEFAULT_REVEAL_THRESHOLD;
        if (pct >= unlockTarget && !isRevealed) {
            unlockCardMilestone(card);
        }
    }

    function scratchTo(clientX, clientY) {
        const rect = scratchViewport.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        pointerPos = { x, y };

        if (!lastPt) {
            stampCoinScratch(x, y, 0);
            spawnFoilShavings(x, y, 0, -10, 3);
            lastPt = { x, y };
            return;
        }

        const dx = x - lastPt.x;
        const dy = y - lastPt.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.5) {
            const angle = Math.atan2(dy, dx);
            const steps = Math.max(1, Math.ceil(dist / 3.5));
            for (let s = 1; s <= steps; s++) {
                const ix = lastPt.x + (dx * s) / steps;
                const iy = lastPt.y + (dy * s) / steps;
                stampCoinScratch(ix, iy, angle);
            }

            spawnFoilShavings(x, y, dx, dy, Math.min(6, Math.ceil(dist / 5)));
            triggerScratchSound(dist);

            if (navigator.vibrate && strokeCount % 6 === 0) {
                navigator.vibrate(5);
            }
        }

        lastPt = { x, y };
        strokeCount++;

        if (strokeCount % 5 === 0) {
            checkProgress();
        }
    }

    // Dessine la pièce d'or inclinée sous le doigt pendant le grattage
    function drawScratchCoin(px, py) {
        fxCtx.save();
        fxCtx.translate(px + 10, py - 10);
        fxCtx.rotate(-0.35);

        // Ombre portée de la pièce
        fxCtx.beginPath();
        fxCtx.ellipse(2, 4, 18, 14, 0, 0, Math.PI * 2);
        fxCtx.fillStyle = 'rgba(20, 18, 15, 0.28)';
        fxCtx.fill();

        // Corps de la pièce en or
        const coinGrad = fxCtx.createLinearGradient(-18, -14, 18, 14);
        coinGrad.addColorStop(0, '#FFF3D1');
        coinGrad.addColorStop(0.45, '#D4AF37');
        coinGrad.addColorStop(1, '#9A7032');
        fxCtx.beginPath();
        fxCtx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
        fxCtx.fillStyle = coinGrad;
        fxCtx.fill();
        fxCtx.lineWidth = 1.5;
        fxCtx.strokeStyle = '#FAF0D4';
        fxCtx.stroke();

        // Cercle intérieur et étoile sur la pièce
        fxCtx.beginPath();
        fxCtx.ellipse(0, 0, 13.5, 10.2, 0, 0, Math.PI * 2);
        fxCtx.lineWidth = 0.8;
        fxCtx.strokeStyle = 'rgba(120, 82, 30, 0.55)';
        fxCtx.stroke();

        fxCtx.fillStyle = '#8C6226';
        fxCtx.font = '11px Georgia, serif';
        fxCtx.textAlign = 'center';
        fxCtx.textBaseline = 'middle';
        fxCtx.fillText('✦', 0, 0.5);
        fxCtx.restore();
    }

    // Boucle d'animation des copeaux d'or et de la pièce de monnaie dorée
    let fxAnimId = null;
    let lastFxTime = performance.now();

    function fxLoop(now) {
        const dt = clamp((now - lastFxTime) / 1000, 0.005, 0.04);
        lastFxTime = now;

        fxCtx.clearRect(0, 0, vw, vh);

        // 1. Mise à jour et dessin des copeaux d'or qui tombent
        for (let i = shavings.length - 1; i >= 0; i--) {
            const sh = shavings[i];
            sh.vy += SHAVINGS_GRAVITY * dt;
            sh.x += sh.vx * dt;
            sh.y += sh.vy * dt;
            sh.rot += sh.vRot * dt;
            sh.life -= dt;

            if (sh.life <= 0) {
                shavings.splice(i, 1);
                continue;
            }

            fxCtx.save();
            fxCtx.translate(sh.x, sh.y);
            fxCtx.rotate(sh.rot);
            fxCtx.globalAlpha = Math.min(1, sh.life / 0.25);
            fxCtx.fillStyle = sh.color;
            fxCtx.fillRect(-sh.sizeW / 2, -sh.sizeH / 2, sh.sizeW, sh.sizeH);
            fxCtx.restore();
        }

        // 2. Dessin de la pièce d'or inclinée sous le doigt pendant le grattage
        if (isScratching && pointerPos) {
            drawScratchCoin(pointerPos.x, pointerPos.y);
        }

        fxAnimId = requestAnimationFrame(fxLoop);
    }

    const onTouchStart = (e) => {
        isScratching = true;
        lastPt = null;
        if (e.touches && e.touches.length > 0) {
            scratchTo(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const onTouchMove = (e) => {
        if (!isScratching) return;
        if (e.touches && e.touches.length > 0) {
            scratchTo(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const onTouchEnd = () => {
        if (!isScratching) return;
        isScratching = false;
        lastPt = null;
        pointerPos = null;
        checkProgress();
    };

    const onMouseDown = (e) => {
        isScratching = true;
        lastPt = null;
        scratchTo(e.clientX, e.clientY);
    };

    const onMouseMove = (e) => {
        if (!isScratching) return;
        scratchTo(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
        onTouchEnd();
    };

    scratchFoilCanvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    scratchFoilCanvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    loadCard(currentCardIndex);
    fxAnimId = requestAnimationFrame(fxLoop);

    activeScratchCleanup = () => {
        cancelAnimationFrame(fxAnimId);
        clearTimeout(soundTimeout);
        closeAudioContextSafely(audioCtx);
        scratchFoilCanvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        scratchFoilCanvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
}
