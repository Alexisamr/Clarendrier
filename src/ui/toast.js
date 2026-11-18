/**
 * ============================================================================
 * NOTIFICATION TOAST TEMPORAIRE
 * ============================================================================
 */

import { toastEl } from './dom.js';

const TOAST_DURATION_MS = 2200;
let toastTimeout;

export function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, TOAST_DURATION_MS);
}
