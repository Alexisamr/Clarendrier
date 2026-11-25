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
import { closeModal } from './modal.js';
import { reopenGate } from './gate.js';
import { lancerIntroCapFerret } from './intro-capferret.js';
import { lancerIntroMuseum } from './intro-museum.js';

const SECRET_TRIGGER_TAPS = 3;
const SECRET_TRIGGER_RESET_MS = 650;

function createSecretActionButtons() {
    const wrapper = document.createElement('div');
    wrapper.className = 'secret-actions-group';

    const gateBtn = document.createElement('button');
    gateBtn.type = 'button';
    gateBtn.className = 'btn-sober';
    gateBtn.textContent = "Revenir à l'écran de vérification";
    gateBtn.addEventListener('click', () => {
        closeModal();
        reopenGate();
    });

    const capFerretBtn = document.createElement('button');
    capFerretBtn.type = 'button';
    capFerretBtn.className = 'btn-sober';
    capFerretBtn.textContent = "Tester l'intro Cap Ferret";
    capFerretBtn.addEventListener('click', () => {
        closeModal();
        lancerIntroCapFerret();
    });

    const museumBtn = document.createElement('button');
    museumBtn.type = 'button';
    museumBtn.className = 'btn-sober';
    museumBtn.textContent = "Tester l'intro Muséum";
    museumBtn.addEventListener('click', () => {
        closeModal();
        lancerIntroMuseum();
    });

    wrapper.appendChild(gateBtn);
    wrapper.appendChild(capFerretBtn);
    wrapper.appendChild(museumBtn);
    return wrapper;
}

export async function openSecretAnswersModal() {
    modalDay.textContent = UI_TEXTS.SECRET_NOTEBOOK_TITLE;
    modalBody.innerHTML = '';

    const loadingList = document.createElement('div');
    loadingList.className = 'secret-answers-list';
    loadingList.appendChild(createSecretActionButtons());

    const loadingMsg = document.createElement('div');
    loadingMsg.className = 'secret-notebook-status';
    loadingMsg.textContent = UI_TEXTS.SECRET_NOTEBOOK_LOADING;
    loadingList.appendChild(loadingMsg);

    modalBody.appendChild(loadingList);
    modalBody.scrollTop = 0;
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');

    const entries = await fetchMergedQuizAnswers();
    if (!modalOverlay.classList.contains('active')) return;

    const listEl = document.createElement('div');
    listEl.className = 'secret-answers-list';
    listEl.appendChild(createSecretActionButtons());

    if (!entries.length) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'secret-notebook-empty';
        emptyMsg.innerHTML = UI_TEXTS.SECRET_NOTEBOOK_EMPTY;
        listEl.appendChild(emptyMsg);

        modalBody.innerHTML = '';
        modalBody.appendChild(listEl);
        modalBody.scrollTop = 0;
        return;
    }

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
    modalBody.scrollTop = 0;
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
