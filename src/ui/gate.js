/**
 * ============================================================================
 * ÉCRAN D'ACCÈS (GATE : QUESTION SECRÈTE À L'ENTRÉE)
 * ============================================================================
 */

import { UI_TEXTS } from '../data/calendarData.js';
import { normalizeAnswer } from '../utils/helpers.js';
import {
    getActiveGateQuestion,
    isGateSessionValid,
    saveGateSession,
    isGateAdminPassword,
    isGateAnswerValid
} from '../logic/state.js';
import {
    gateOverlay,
    gateCard,
    gateQuestionEl,
    gateForm,
    gateInput,
    gateError
} from './dom.js';
import { openSecretAnswersModal } from './secretNotebook.js';

function unlockGateOverlay(instant = false) {
    gateOverlay.style.transition = instant ? 'none' : '';
    gateOverlay.classList.add('unlocked');
    gateOverlay.setAttribute('aria-hidden', 'true');
}

function completeGateLogin() {
    saveGateSession();
    gateError.textContent = '';
    gateInput.blur();
    unlockGateOverlay(false);
}

export function initGate() {
    if (!gateOverlay || !gateForm) return;

    // Si l'appareil a déjà répondu correctement dans les dernières 24h, on déverrouille directement
    if (isGateSessionValid()) {
        unlockGateOverlay(true);
        return;
    }

    const activeQ = getActiveGateQuestion();
    gateQuestionEl.textContent = activeQ.question;

    gateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userVal = normalizeAnswer(gateInput.value);

        // Mot de passe secret pour Alexis s'il veut voir les réponses de Clara dès l'accueil
        if (isGateAdminPassword(userVal)) {
            completeGateLogin();
            openSecretAnswersModal();
            return;
        }

        if (isGateAnswerValid(activeQ, userVal)) {
            completeGateLogin();
        } else {
            gateError.textContent = UI_TEXTS.GATE_ERROR;
            gateCard.classList.remove('shake');
            void gateCard.offsetWidth;
            gateCard.classList.add('shake');
            gateInput.select();
        }
    });
}
