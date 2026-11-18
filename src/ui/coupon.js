/**
 * ============================================================================
 * TICKETS / COUPONS À DÉCOUPER EN PLEIN ÉCRAN (JOURS 2, 5 & 10)
 * ============================================================================
 */

import { clamp } from '../utils/helpers.js';
import {
    stopActiveGame,
    markGameWon,
    saveAndSyncQuizAnswer
} from '../logic/state.js';
import {
    fsCouponOverlay,
    fsCouponCloseBtn,
    couponTicket,
    couponStub,
    couponPerfZone,
    couponCutLine,
    couponScissorsHandle,
    couponMainTitle,
    couponClause,
    couponSparkles
} from './dom.js';
import { closeModal } from './modal.js';

const SPARKLE_COLORS = ['#C59B5F', '#E8D5B5', '#9E2A2B', '#1E352B', '#F7D046'];
const SPARKLE_COUNT = 28;
const PERFORATION_PADDING_PX = 22;
const TEAR_COMPLETE_THRESHOLD = 0.86;
const SCISSORS_CLICK_STEP = 0.28;
const MAX_SINGLE_JUMP_DELTA = 0.45;
const CLAMPED_JUMP_INCREMENT = 0.22;

let activeCouponCleanup = null;

export function closeFullscreenCoupon() {
    if (activeCouponCleanup) {
        activeCouponCleanup();
        activeCouponCleanup = null;
    }
    if (fsCouponOverlay) {
        fsCouponOverlay.classList.remove('active');
        fsCouponOverlay.setAttribute('aria-hidden', 'true');
    }
}

export function initCouponListeners() {
    if (fsCouponCloseBtn) {
        fsCouponCloseBtn.addEventListener('click', closeFullscreenCoupon);
    }
}

function spawnCouponSparkles() {
    if (!couponSparkles) return;
    couponSparkles.innerHTML = '';

    for (let i = 0; i < SPARKLE_COUNT; i++) {
        const dot = document.createElement('span');
        dot.className = 'coupon-sparkle-dot';
        const angle = (Math.PI * 2 * i) / SPARKLE_COUNT + (Math.random() - 0.5) * 0.3;
        const dist = 55 + Math.random() * 120;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 20;
        dot.style.left = `${45 + (Math.random() - 0.5) * 30}%`;
        dot.style.top = '38%';
        dot.style.backgroundColor = SPARKLE_COLORS[i % SPARKLE_COLORS.length];
        dot.style.setProperty('--tx', `${tx.toFixed(1)}px`);
        dot.style.setProperty('--ty', `${ty.toFixed(1)}px`);
        couponSparkles.appendChild(dot);
    }
}

export function launchFullscreenCoupon(item) {
    stopActiveGame();
    closeModal();
    if (activeCouponCleanup) {
        activeCouponCleanup();
        activeCouponCleanup = null;
    }

    fsCouponOverlay.classList.add('active');
    fsCouponOverlay.setAttribute('aria-hidden', 'false');

    // Configuration visuelle du ticket selon le jour
    couponTicket.classList.remove('is-torn', 'theme-pine');
    if (item.theme === 'pine') {
        couponTicket.classList.add('theme-pine');
    }

    couponStub.style.transform = '';
    couponStub.style.opacity = '';
    couponMainTitle.textContent = item.couponTitle || item.content;

    if (item.couponClause) {
        couponClause.hidden = false;
        couponClause.textContent = item.couponClause;
    } else {
        couponClause.hidden = true;
        couponClause.textContent = '';
    }

    let cutProgress = 0; // 0 à 1
    let isDragging = false;
    let isTorn = false;

    function updateCutVisuals(progress) {
        cutProgress = clamp(progress, 0, 1);
        const pct = cutProgress * 100;
        couponCutLine.style.width = `${pct.toFixed(1)}%`;

        // Déplace les ciseaux le long de la ligne pointillée (de 22px à largeur - 22px)
        const rect = couponPerfZone.getBoundingClientRect();
        const minX = PERFORATION_PADDING_PX;
        const maxX = Math.max(minX + 10, rect.width - PERFORATION_PADDING_PX);
        const handleX = minX + (maxX - minX) * cutProgress;
        couponScissorsHandle.style.left = `${handleX.toFixed(1)}px`;

        if (!isTorn) {
            // Le talon supérieur se soulève et s'incline au fur et à mesure qu'on découpe
            const liftY = -cutProgress * 12;
            const tiltDeg = cutProgress * 4.5;
            couponStub.style.transform = `translateY(${liftY.toFixed(1)}px) rotate(${tiltDeg.toFixed(2)}deg)`;
        }
    }

    function completeTearOff() {
        if (isTorn) return;
        isTorn = true;
        isDragging = false;
        updateCutVisuals(1);

        couponStub.style.transform = '';
        couponTicket.classList.add('is-torn');
        spawnCouponSparkles();

        markGameWon(item.day);

        // Enregistre aussi dans le carnet secret que Clara a découpé son bon !
        saveAndSyncQuizAnswer(
            `coupon_jour_${item.day}`,
            `Bon découpé (Jour ${item.day})`,
            `Ticket découpé : « ${item.couponTitle} »`,
            `Surprise Jour ${item.day}`
        );
    }

    function handlePointerX(clientX) {
        if (isTorn) return;
        const rect = couponPerfZone.getBoundingClientRect();
        const usableW = Math.max(40, rect.width - PERFORATION_PADDING_PX * 2);
        const rel = (clientX - (rect.left + PERFORATION_PADDING_PX)) / usableW;

        // Empêche de sauter directement à 100% en cliquant tout à droite sans glisser
        if (rel - cutProgress > MAX_SINGLE_JUMP_DELTA) {
            updateCutVisuals(cutProgress + CLAMPED_JUMP_INCREMENT);
        } else if (rel > cutProgress) {
            updateCutVisuals(rel);
        }

        if (cutProgress >= TEAR_COMPLETE_THRESHOLD) {
            completeTearOff();
        }
    }

    const onTouchStart = (e) => {
        if (isTorn) return;
        isDragging = true;
        if (e.touches && e.touches.length > 0) {
            handlePointerX(e.touches[0].clientX);
        }
    };

    const onTouchMove = (e) => {
        if (!isDragging || isTorn) return;
        if (e.touches && e.touches.length > 0) {
            handlePointerX(e.touches[0].clientX);
        }
    };

    const onTouchEnd = () => {
        isDragging = false;
    };

    const onMouseDown = (e) => {
        if (isTorn) return;
        isDragging = true;
        handlePointerX(e.clientX);
    };

    const onMouseMove = (e) => {
        if (!isDragging || isTorn) return;
        handlePointerX(e.clientX);
    };

    const onMouseUp = () => {
        isDragging = false;
    };

    // Permet aussi de tapoter les ciseaux pour avancer cran par cran si besoin
    const onScissorsClick = () => {
        if (isTorn) return;
        updateCutVisuals(cutProgress + SCISSORS_CLICK_STEP);
        if (cutProgress >= TEAR_COMPLETE_THRESHOLD) {
            completeTearOff();
        }
    };

    couponPerfZone.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    couponPerfZone.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    couponScissorsHandle.addEventListener('click', onScissorsClick);

    requestAnimationFrame(() => updateCutVisuals(0));

    activeCouponCleanup = () => {
        couponPerfZone.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        couponPerfZone.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        couponScissorsHandle.removeEventListener('click', onScissorsClick);
    };
}
