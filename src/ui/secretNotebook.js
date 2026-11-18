/**
 * ============================================================================
 * CARNET SECRET D'ALEXIS (LECTURE DES RÉPONSES ET ACTIONS DE CLARA)
 * - Accessible en touchant 3 fois rapidement « Pour ma Clara » en bas de page
 *   ou en tapant "alexis" / "admin" sur l'écran d'accueil.
 * ============================================================================
 */

import { UI_TEXTS } from '../data/calendarData.js';
import { fetchMergedQuizAnswers } from '../logic/state.js';
import { modalDay, modalBody, modalOverlay, footerEl } from './dom.js';

const SECRET_TRIGGER_TAPS = 3;
const SECRET_TRIGGER_RESET_MS = 650;

export async function openSecretAnswersModal() {
    modalDay.textContent = UI_TEXTS.SECRET_NOTEBOOK_TITLE;
    modalBody.innerHTML = `<div style="font-size:0.88rem;color:var(--text-secondary);">${UI_TEXTS.SECRET_NOTEBOOK_LOADING}</div>`;
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');

    const entries = await fetchMergedQuizAnswers();
    if (!entries.length) {
        modalBody.innerHTML = UI_TEXTS.SECRET_NOTEBOOK_EMPTY;
        return;
    }

    const listEl = document.createElement('div');
    listEl.className = 'secret-answers-list';

    entries.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'secret-answer-item';
        const headerLabel = item.quizTitle
            ? `${item.quizTitle} — ${item.shortTitle || item.questionId}`
            : (item.shortTitle || item.questionId);
        div.innerHTML = `
            <div class="secret-answer-q"></div>
            <div class="secret-answer-a"></div>
            <div class="secret-answer-date">Enregistré le ${item.date || ''}</div>
        `;
        div.querySelector('.secret-answer-q').textContent = headerLabel;
        div.querySelector('.secret-answer-a').textContent = item.answer;
        listEl.appendChild(div);
    });

    modalBody.innerHTML = '';
    modalBody.appendChild(listEl);
}

export function initSecretFooterTrigger() {
    if (!footerEl) return;

    let tapCount = 0;
    let tapTimer = null;

    footerEl.addEventListener('click', () => {
        tapCount++;
        clearTimeout(tapTimer);
        if (tapCount >= SECRET_TRIGGER_TAPS) {
            tapCount = 0;
            openSecretAnswersModal();
        } else {
            tapTimer = setTimeout(() => {
                tapCount = 0;
            }, SECRET_TRIGGER_RESET_MS);
        }
    });
}
