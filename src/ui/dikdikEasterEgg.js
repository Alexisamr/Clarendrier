/**
 * ============================================================================
 * EASTER EGG DU PETIT SAPIN EN HAUT DE L'ÉCRAN (DIK-DIK PLEIN ÉCRAN)
 * ============================================================================
 */

import { headerSapinBtn, fsDikdikOverlay, fsDikdikCloseBtn } from './dom.js';

export function openDikdikFullscreen() {
    if (!fsDikdikOverlay) return;
    fsDikdikOverlay.classList.add('active');
    fsDikdikOverlay.setAttribute('aria-hidden', 'false');
}

export function closeDikdikFullscreen() {
    if (!fsDikdikOverlay) return;
    fsDikdikOverlay.classList.remove('active');
    fsDikdikOverlay.setAttribute('aria-hidden', 'true');
}

export function initDikdikEasterEgg() {
    if (headerSapinBtn) {
        headerSapinBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openDikdikFullscreen();
        });
    }

    if (fsDikdikCloseBtn) {
        fsDikdikCloseBtn.addEventListener('click', closeDikdikFullscreen);
    }

    if (fsDikdikOverlay) {
        fsDikdikOverlay.addEventListener('click', (e) => {
            if (e.target === fsDikdikOverlay) {
                closeDikdikFullscreen();
            }
        });
    }
}
