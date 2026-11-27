/**
 * ============================================================================
 * MENU DEV D'ALEXIS (TESTS D'ANIMATIONS, RETOUR VÉRIFICATION & RÉPONSES QCM)
 * - Accessible en touchant 3 fois rapidement « Pour ma Clara » en bas de page
 *   ou en tapant "alexis" / "admin" sur l'écran d'accueil.
 * ============================================================================
 */

import { SURPRISES_CATALOG, UI_TEXTS } from '../data/calendarData.js';
import {
    fetchMergedQuizAnswers,
    isDevUnlockAllDays,
    toggleDevUnlockAllDays
} from '../logic/state.js';
import { modalDay, modalBody, modalOverlay, footerEl } from './dom.js';
import { closeModal } from './modal.js';
import { renderGrid } from './calendarGrid.js';
import { showToast } from './toast.js';
import { reopenGate } from './gate.js';
import { playMountainIntro } from './intro-montagne.js';
import { lancerIntroCapFerret } from './intro-capferret.js';
import { lancerIntroMuseum } from './intro-museum.js';

const SECRET_TRIGGER_TAPS = 3;
const SECRET_TRIGGER_RESET_MS = 650;

const QCM_QUESTION_IDS = new Set(
    (SURPRISES_CATALOG.quiz_ete?.questions || []).map((q) => q.id)
);

let devModalSessionId = 0;

function getUnlockToggleLabel(isUnlockedAll) {
    return isUnlockedAll
        ? 'Verrouiller les cases selon la date'
        : 'Déverrouiller toutes les cases';
}

function createSecretActionButtons() {
    const wrapper = document.createElement('div');
    wrapper.className = 'secret-actions-group';

    const toggleDaysBtn = document.createElement('button');
    toggleDaysBtn.type = 'button';
    toggleDaysBtn.className = 'btn-sober';
    toggleDaysBtn.textContent = getUnlockToggleLabel(isDevUnlockAllDays());
    toggleDaysBtn.addEventListener('click', () => {
        const unlockedAll = toggleDevUnlockAllDays();
        renderGrid();
        closeModal();
        showToast(
            unlockedAll
                ? 'Toutes les cases sont déverrouillées'
                : 'Cases verrouillées selon la date'
        );
    });

    const gateBtn = document.createElement('button');
    gateBtn.type = 'button';
    gateBtn.className = 'btn-sober';
    gateBtn.textContent = "Revenir à l'écran de vérification";
    gateBtn.addEventListener('click', () => {
        closeModal();
        reopenGate();
    });

    const mountainBtn = document.createElement('button');
    mountainBtn.type = 'button';
    mountainBtn.className = 'btn-sober';
    mountainBtn.textContent = "Tester l'intro Montagne";
    mountainBtn.addEventListener('click', () => {
        closeModal();
        playMountainIntro();
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

    wrapper.appendChild(toggleDaysBtn);
    wrapper.appendChild(gateBtn);
    wrapper.appendChild(mountainBtn);
    wrapper.appendChild(capFerretBtn);
    wrapper.appendChild(museumBtn);
    return wrapper;
}

export async function openSecretAnswersModal() {
    const currentSessionId = ++devModalSessionId;
    modalDay.textContent = UI_TEXTS.DEV_MENU_TITLE;
    modalBody.innerHTML = '';

    const containerEl = document.createElement('div');
    containerEl.className = 'secret-answers-list';
    containerEl.appendChild(createSecretActionButtons());

    modalBody.appendChild(containerEl);
    modalBody.scrollTop = 0;
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');

    const entries = await fetchMergedQuizAnswers();
    const qcmEntries = entries.filter((item) => item && QCM_QUESTION_IDS.has(item.questionId));

    if (
        currentSessionId !== devModalSessionId ||
        !modalOverlay.classList.contains('active') ||
        modalDay.textContent !== UI_TEXTS.DEV_MENU_TITLE ||
        !qcmEntries.length
    ) {
        return;
    }

    const actionsGroup = containerEl.querySelector('.secret-actions-group');
    if (actionsGroup) {
        actionsGroup.classList.add('has-qcm-answers');
    }

    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'secret-qcm-section-title';
    sectionTitle.textContent = UI_TEXTS.DEV_MENU_QCM_SECTION_TITLE;
    containerEl.appendChild(sectionTitle);

    qcmEntries.forEach((item) => {
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
        containerEl.appendChild(div);
    });
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
