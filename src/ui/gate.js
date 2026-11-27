/**
 * ============================================================================
 * ÉCRAN D'ACCÈS (GATE : QUESTION SECRÈTE À L'ENTRÉE)
 * ============================================================================
 */

import { UI_TEXTS } from '../data/calendarData.js';
import { normalizeAnswer } from '../utils/helpers.js';
import {
    getScheduledGateQuestion,
    getGatePreviewQuestion,
    getScheduledIntro,
    markGateQuestionAnswered,
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
import { lancerIntroCapFerret } from './intro-capferret.js';
import { lancerIntroMuseum } from './intro-museum.js';

let isGateSubmitBound = false;
let currentActiveQuestion = null;
let isPreviewMode = false;

function playIntroByKey(introKey, callbacks = {}) {
    if (introKey === 'capferret') {
        lancerIntroCapFerret(callbacks);
    } else if (introKey === 'museum') {
        lancerIntroMuseum(callbacks);
    } else {
        playMountainIntro(callbacks);
    }
}

function unlockGateOverlay(instant = false) {
    gateOverlay.style.transition = instant ? 'none' : '';
    gateOverlay.classList.add('unlocked');
    gateOverlay.setAttribute('aria-hidden', 'true');
    if (gateCard) {
        gateCard.style.display = '';
    }
}

function completeGateLogin({ withIntro = false, fallbackIntroKey = 'mountain' } = {}) {
    gateError.textContent = '';
    gateInput.blur();

    const introKey = getScheduledIntro() || fallbackIntroKey;
    if (withIntro && introKey) {
        playIntroByKey(introKey, {
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
        const activeQ = currentActiveQuestion || getScheduledGateQuestion() || getGatePreviewQuestion();
        const userVal = normalizeAnswer(gateInput.value);

        // Mot de passe secret pour Alexis s'il veut ouvrir le Mode Dev dès l'accueil
        if (isGateAdminPassword(userVal)) {
            completeGateLogin({ withIntro: false });
            openSecretAnswersModal();
            return;
        }

        if (isGateAnswerValid(activeQ, userVal)) {
            if (!isPreviewMode && activeQ && activeQ.id) {
                markGateQuestionAnswered(activeQ.id);
            }
            completeGateLogin({ withIntro: true, fallbackIntroKey: 'mountain' });
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

    bindGateFormOnce();

    const scheduledQuestion = getScheduledGateQuestion();
    isPreviewMode = !scheduledQuestion;
    currentActiveQuestion = scheduledQuestion || getGatePreviewQuestion();
    gateQuestionEl.textContent = currentActiveQuestion.question;
    gateInput.value = '';
    gateError.textContent = '';
    gateCard.classList.remove('shake');
    if (gateCard) {
        gateCard.style.display = '';
    }

    gateOverlay.style.transition = '';
    gateOverlay.classList.remove('unlocked');
    gateOverlay.setAttribute('aria-hidden', 'false');
}

export function initGate() {
    if (!gateOverlay || !gateForm) return;

    bindGateFormOnce();

    const scheduledQuestion = getScheduledGateQuestion();
    if (!scheduledQuestion) {
        const scheduledIntro = getScheduledIntro();
        if (scheduledIntro) {
            if (gateCard) {
                gateCard.style.display = 'none';
            }
            playIntroByKey(scheduledIntro, {
                onCovered: () => unlockGateOverlay(true)
            });
        } else {
            unlockGateOverlay(true);
        }
        return;
    }

    isPreviewMode = false;
    currentActiveQuestion = scheduledQuestion;
    if (gateCard) {
        gateCard.style.display = '';
    }
    gateQuestionEl.textContent = currentActiveQuestion.question;
}
