/**
 * ============================================================================
 * LOGIQUE MÉTIER, ÉTAT DE L'APPLICATION & PERSISTANCE (LOCALSTORAGE + CLOUD)
 * ============================================================================
 */

import {
    DEV_MODE,
    CALENDAR_CONFIG,
    STORAGE_KEYS,
    QUIZ_SYNC_TOPIC,
    QUIZ_SYNC_BASE_URL,
    GATE_ADMIN_PASSWORDS,
    GATE_MASTER_PASSWORDS,
    GATE_FALLBACK_QUESTION,
    GATE_QUESTIONS,
    INTRO_ANIMATIONS_SCHEDULE
} from '../data/calendarData.js';
import {
    isDayUnlockedForDate,
    getScheduledGateQuestionForDate,
    getScheduledIntroForDate,
    getPreviewGateQuestion,
    isGateAnswerValid as checkGateAnswerValid,
    getGateCustomError as findGateCustomError
} from './gateLogic.js';
import {
    formatFrenchShortDate
} from '../utils/helpers.js';

/* -------------------------------------------------------------------------
   1. ÉTAT LOCAL CHARGÉ DEPUIS LOCALSTORAGE
   ------------------------------------------------------------------------- */
function readJsonFromStorage(key, fallbackValue) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallbackValue;
    } catch {
        return fallbackValue;
    }
}

export const openedDays = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPENED_DAYS)) || [];
export const gamesWon = JSON.parse(localStorage.getItem(STORAGE_KEYS.GAMES_WON)) || [];
export const scratchedCardIds = JSON.parse(localStorage.getItem(STORAGE_KEYS.SCRATCHED_CARDS) || '[]');

let activeGameCleanup = null;

/* -------------------------------------------------------------------------
   2. GESTION DU CYCLE DE VIE DES MINI-JEUX PLEIN ÉCRAN
   ------------------------------------------------------------------------- */
export function stopActiveGame() {
    if (activeGameCleanup) {
        activeGameCleanup();
        activeGameCleanup = null;
    }
}

export function setActiveGameCleanup(cleanupFn) {
    activeGameCleanup = cleanupFn;
}

/* -------------------------------------------------------------------------
   3. PROGRESSION DES CASES, VICTOIRES & CARTES GRATTÉES
   ------------------------------------------------------------------------- */
export function isDayOpened(dayNumber) {
    return openedDays.includes(dayNumber);
}

export function markDayOpened(dayNumber) {
    if (!openedDays.includes(dayNumber)) {
        openedDays.push(dayNumber);
        localStorage.setItem(STORAGE_KEYS.OPENED_DAYS, JSON.stringify(openedDays));
        return true;
    }
    return false;
}

export function hasWonGame(dayNumber) {
    return gamesWon.includes(dayNumber);
}

export function markGameWon(dayNumber) {
    if (!gamesWon.includes(dayNumber)) {
        gamesWon.push(dayNumber);
        localStorage.setItem(STORAGE_KEYS.GAMES_WON, JSON.stringify(gamesWon));
    }
}

export function isCardScratched(cardId) {
    return scratchedCardIds.includes(cardId);
}

export function markCardScratched(cardId) {
    if (!scratchedCardIds.includes(cardId)) {
        scratchedCardIds.push(cardId);
        localStorage.setItem(STORAGE_KEYS.SCRATCHED_CARDS, JSON.stringify(scratchedCardIds));
    }
}

/* -------------------------------------------------------------------------
   4. LOGIQUE DE DÉVERROUILLAGE PAR DATE (DÉCEMBRE) & OVERRIDE DEV
   ------------------------------------------------------------------------- */
export function isDevUnlockAllDays() {
    try {
        return localStorage.getItem(STORAGE_KEYS.DEV_UNLOCK_ALL) === 'true';
    } catch {
        return false;
    }
}

export function setDevUnlockAllDays(enabled) {
    if (enabled) {
        localStorage.setItem(STORAGE_KEYS.DEV_UNLOCK_ALL, 'true');
    } else {
        localStorage.removeItem(STORAGE_KEYS.DEV_UNLOCK_ALL);
    }
}

export function toggleDevUnlockAllDays() {
    const nextState = !isDevUnlockAllDays();
    setDevUnlockAllDays(nextState);
    return nextState;
}

export function isDayUnlocked(dayNumber, date = new Date()) {
    return isDayUnlockedForDate(dayNumber, date, {
        devMode: DEV_MODE,
        devUnlockAll: isDevUnlockAllDays(),
        unlockYear: CALENDAR_CONFIG.UNLOCK_YEAR,
        unlockMonthIndex: CALENDAR_CONFIG.UNLOCK_MONTH_INDEX
    });
}

/* -------------------------------------------------------------------------
   5. LOGIQUE DU PORTAIL D'ACCÈS (GATE PROGRAMMÉE PAR JOUR)
   ------------------------------------------------------------------------- */
export function getAnsweredGateQuestionIds() {
    const saved = readJsonFromStorage(STORAGE_KEYS.GATE_ANSWERED_QUESTIONS, []);
    return Array.isArray(saved) ? saved : [];
}

export function markGateQuestionAnswered(questionId) {
    if (!questionId) return;
    const answered = getAnsweredGateQuestionIds();
    if (!answered.includes(questionId)) {
        answered.push(questionId);
        localStorage.setItem(STORAGE_KEYS.GATE_ANSWERED_QUESTIONS, JSON.stringify(answered));
    }
}

export function getScheduledGateQuestion(date = new Date()) {
    return getScheduledGateQuestionForDate(
        GATE_QUESTIONS,
        getAnsweredGateQuestionIds(),
        date,
        CALENDAR_CONFIG.UNLOCK_YEAR,
        CALENDAR_CONFIG.UNLOCK_MONTH_INDEX
    );
}

export function getGatePreviewQuestion(date = new Date()) {
    return getPreviewGateQuestion(
        GATE_QUESTIONS,
        getAnsweredGateQuestionIds(),
        date,
        CALENDAR_CONFIG.UNLOCK_YEAR,
        CALENDAR_CONFIG.UNLOCK_MONTH_INDEX,
        GATE_FALLBACK_QUESTION
    );
}

export function getScheduledIntro(date = new Date()) {
    return getScheduledIntroForDate(
        INTRO_ANIMATIONS_SCHEDULE,
        date,
        CALENDAR_CONFIG.UNLOCK_YEAR,
        CALENDAR_CONFIG.UNLOCK_MONTH_INDEX
    );
}

export function isGateAdminPassword(normalizedInput) {
    return GATE_ADMIN_PASSWORDS.includes(normalizedInput);
}

export function isGateAnswerValid(activeQuestion, normalizedInput) {
    return checkGateAnswerValid(activeQuestion, normalizedInput, GATE_MASTER_PASSWORDS);
}

export function getGateCustomError(activeQuestion, normalizedInput) {
    return findGateCustomError(activeQuestion, normalizedInput);
}

/* -------------------------------------------------------------------------
   6. SAUVEGARDE & SYNCHRONISATION À DISTANCE DES RÉPONSES DE CLARA
   ------------------------------------------------------------------------- */
export function getSavedQuizAnswers() {
    return readJsonFromStorage(STORAGE_KEYS.QUIZ_ANSWERS, {});
}

export function saveAndSyncQuizAnswer(questionId, shortTitle, answerText, quizTitle = '') {
    const cleaned = (answerText || '').trim();
    if (!cleaned) return;

    const current = getSavedQuizAnswers();
    const existing = current[questionId];

    // Conserve l'historique de tous les choix cliqués par Clara sur une même question
    const history = (existing && Array.isArray(existing.history)) ? [...existing.history] : [];
    if (history[history.length - 1] !== cleaned) {
        history.push(cleaned);
    }

    const formattedAnswer = history.length > 1
        ? history.map((ans, idx) => `${idx === 0 ? '1er choix' : `Choix ${idx + 1}`} : ${ans}`).join('\n')
        : cleaned;

    const entry = {
        questionId,
        quizTitle,
        shortTitle,
        answer: formattedAnswer,
        history,
        date: formatFrenchShortDate(),
        timestamp: Date.now()
    };
    current[questionId] = entry;
    localStorage.setItem(STORAGE_KEYS.QUIZ_ANSWERS, JSON.stringify(current));

    // Envoi silencieux sur le canal cloud pour qu'Alexis puisse voir toutes les réponses depuis son téléphone
    try {
        fetch(`${QUIZ_SYNC_BASE_URL}/${QUIZ_SYNC_TOPIC}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Title': `Reponse de Clara - ${shortTitle}`
            },
            body: JSON.stringify(entry)
        }).catch(() => {});
    } catch {
        // Ignore si hors-ligne
    }
}

export async function fetchMergedQuizAnswers() {
    const combinedMap = { ...getSavedQuizAnswers() };

    try {
        const res = await fetch(`${QUIZ_SYNC_BASE_URL}/${QUIZ_SYNC_TOPIC}/json?poll=1`);
        if (res.ok) {
            const text = await res.text();
            const lines = text.split('\n').filter(Boolean);
            lines.forEach((line) => {
                try {
                    const pkt = JSON.parse(line);
                    if (pkt && pkt.event === 'message' && pkt.message) {
                        const parsed = JSON.parse(pkt.message);
                        if (parsed && parsed.questionId && parsed.answer) {
                            const existing = combinedMap[parsed.questionId];
                            if (!existing || (parsed.timestamp || 0) >= (existing.timestamp || 0)) {
                                combinedMap[parsed.questionId] = parsed;
                            }
                        }
                    }
                } catch {
                    // Ignore ligne malformée
                }
            });
        }
    } catch {
        // Fallback sur localStorage si pas de réseau
    }

    return Object.values(combinedMap).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}
