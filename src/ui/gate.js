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
    clearGateSession,
    isGateAdminPassword,
    isGateAnswerValid,
    getGateCustomError
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
import { playMountainIntro } from './intro-montagne.js';

let isGateSubmitBound = false;
let currentActiveQuestion = null;

function unlockGateOverlay(instant = false) {
    gateOverlay.style.transition = instant ? 'none' : '';
    gateOverlay.classList.add('unlocked');
    gateOverlay.setAttribute('aria-hidden', 'true');
}

function completeGateLogin({ withIntro = false } = {}) {
    saveGateSession();
    gateError.textContent = '';
    gateInput.blur();

    if (withIntro) {
        playMountainIntro({
            onCovered: () => unlockGateOverlay(true)
        });
    } else {
        unlockGateOverlay(false);
    }
}

function bindGateFormOnce() {
    if (isGateSubmitBound || !gateForm) return;
    isGateSubmitBound = true;

    gateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const activeQ = currentActiveQuestion || getActiveGateQuestion();
        const userVal = normalizeAnswer(gateInput.value);

        // Mot de passe secret pour Alexis s'il veut voir les réponses de Clara dès l'accueil
        if (isGateAdminPassword(userVal)) {
            completeGateLogin({ withIntro: false });
            openSecretAnswersModal();
            return;
        }

        if (isGateAnswerValid(activeQ, userVal)) {
            completeGateLogin({ withIntro: true });
        } else {
            gateError.textContent = getGateCustomError(activeQ, userVal) || UI_TEXTS.GATE_ERROR;
            gateCard.classList.remove('shake');
            void gateCard.offsetWidth;
            gateCard.classList.add('shake');
            gateInput.select();
        }
    });
}

export function reopenGate() {
    if (!gateOverlay || !gateForm) return;

    clearGateSession();
    bindGateFormOnce();

    currentActiveQuestion = getActiveGateQuestion();
    gateQuestionEl.textContent = currentActiveQuestion.question;
    gateInput.value = '';
    gateError.textContent = '';
    gateCard.classList.remove('shake');

    gateOverlay.style.transition = '';
    gateOverlay.classList.remove('unlocked');
    gateOverlay.setAttribute('aria-hidden', 'false');
}

export function initGate() {
    if (!gateOverlay || !gateForm) return;

    bindGateFormOnce();

    // Si l'appareil a déjà répondu correctement dans les dernières 24h, on déverrouille directement
    if (isGateSessionValid()) {
        unlockGateOverlay(true);
        return;
    }

    currentActiveQuestion = getActiveGateQuestion();
    gateQuestionEl.textContent = currentActiveQuestion.question;
}
