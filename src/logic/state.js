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
    GATE_REMEMBER_HOURS,
    QUESTION_ROTATION_HOURS,
    GATE_ADMIN_PASSWORDS,
    GATE_MASTER_PASSWORDS,
    GATE_FALLBACK_QUESTION,
    GATE_QUESTIONS
} from '../data/calendarData.js';
import {
    normalizeAnswer,
    normalizeForKeywordMatch,
    formatFrenchShortDate
} from '../utils/helpers.js';

const MS_PER_HOUR = 3600 * 1000;

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
   4. LOGIQUE DE DÉVERROUILLAGE PAR DATE (DÉCEMBRE)
   ------------------------------------------------------------------------- */
export function isDayUnlocked(dayNumber) {
    if (DEV_MODE) return true;
    const now = new Date();
    return now.getMonth() === CALENDAR_CONFIG.UNLOCK_MONTH_INDEX && now.getDate() >= dayNumber;
}

/* -------------------------------------------------------------------------
   5. LOGIQUE DU PORTAIL D'ACCÈS (GATE)
   ------------------------------------------------------------------------- */
export function getActiveGateQuestion() {
    if (!GATE_QUESTIONS.length) {
        return GATE_FALLBACK_QUESTION;
    }
    const rotationMs = Math.max(1, QUESTION_ROTATION_HOURS) * MS_PER_HOUR;
    const index = Math.floor(Date.now() / rotationMs) % GATE_QUESTIONS.length;
    return GATE_QUESTIONS[index];
}

export function isGateSessionValid() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.GATE_AUTH);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || typeof data.unlockedAt !== 'number') return false;
        const rememberMs = Math.max(1, GATE_REMEMBER_HOURS) * MS_PER_HOUR;
        return (Date.now() - data.unlockedAt) < rememberMs;
    } catch {
        return false;
    }
}

export function saveGateSession() {
    localStorage.setItem(STORAGE_KEYS.GATE_AUTH, JSON.stringify({
        unlockedAt: Date.now()
    }));
}

export function isGateAdminPassword(normalizedInput) {
    return GATE_ADMIN_PASSWORDS.includes(normalizedInput);
}

export function isGateAnswerValid(activeQuestion, normalizedInput) {
    const isMasterPassword = GATE_MASTER_PASSWORDS.some(
        (pwd) => normalizeAnswer(pwd) === normalizedInput
    );
    if (isMasterPassword) return true;

    const exactMatch = activeQuestion.answers.some(
        (ans) => normalizeAnswer(ans) === normalizedInput
    );
    if (exactMatch) return true;

    if (Array.isArray(activeQuestion.acceptedKeywords) && activeQuestion.acceptedKeywords.length > 0) {
        const cleanedInput = normalizeForKeywordMatch(normalizedInput);
        return activeQuestion.acceptedKeywords.some((kw) => {
            const cleanedKw = normalizeForKeywordMatch(kw);
            return cleanedKw && cleanedInput.includes(cleanedKw);
        });
    }

    return false;
}

export function getGateCustomError(activeQuestion, normalizedInput) {
    if (!activeQuestion || !activeQuestion.customErrors) return null;
    for (const [key, message] of Object.entries(activeQuestion.customErrors)) {
        if (normalizeAnswer(key) === normalizedInput) {
            return message;
        }
    }
    return null;
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
