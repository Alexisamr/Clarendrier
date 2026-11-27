/**
 * ============================================================================
 * LOGIQUE PURE DU PORTAIL D'ACCÈS (PROGRAMMATION PAR DATE & VALIDATION)
 * ============================================================================
 */

import { normalizeAnswer, normalizeForKeywordMatch } from '../utils/helpers.js';

const TRAILING_PUNCTUATION_REGEX = /[!?.]+$/g;
const LEADING_DATE_PHRASE_REGEX = /^(c'est le |c est le |le )/i;

/**
 * Indique si une case du calendrier (1..24) est accessible à la date donnée.
 */
export function isDayUnlockedForDate(
    dayNumber,
    date = new Date(),
    { devMode = false, devUnlockAll = false, unlockYear = 2026, unlockMonthIndex = 11 } = {}
) {
    if (devMode || devUnlockAll) return true;
    const year = date.getFullYear();
    if (year > unlockYear) return true;
    if (year < unlockYear) return false;
    return date.getMonth() === unlockMonthIndex && date.getDate() >= dayNumber;
}

/**
 * Retourne la question programmée pour la date donnée (et uniquement ce jour-là),
 * ou `null` s'il n'y a aucune question ce jour-là ou si Clara y a déjà répondu.
 */
export function getScheduledGateQuestionForDate(
    questions,
    answeredIds = [],
    date = new Date(),
    unlockYear = 2026,
    unlockMonthIndex = 11
) {
    if (!Array.isArray(questions) || !questions.length) return null;

    if (date.getFullYear() !== unlockYear || date.getMonth() !== unlockMonthIndex) {
        return null;
    }

    const dayOfMonth = date.getDate();
    const answeredSet = new Set(Array.isArray(answeredIds) ? answeredIds : []);

    const match = questions.find((q) => q && q.scheduledDay === dayOfMonth);
    if (!match) return null;
    if (answeredSet.has(match.id)) return null;

    return match;
}

/**
 * Retourne la question à afficher lorsqu'on rouvre manuellement l'écran de vérification
 * depuis le menu dev (question du jour si active, sinon première question non répondue ou 1ère question).
 */
export function getPreviewGateQuestion(
    questions,
    answeredIds = [],
    date = new Date(),
    unlockYear = 2026,
    unlockMonthIndex = 11,
    fallbackQuestion = null
) {
    const scheduled = getScheduledGateQuestionForDate(
        questions,
        answeredIds,
        date,
        unlockYear,
        unlockMonthIndex
    );
    if (scheduled) return scheduled;

    if (Array.isArray(questions) && questions.length > 0) {
        const answeredSet = new Set(Array.isArray(answeredIds) ? answeredIds : []);
        const nextUnanswered = questions.find((q) => q && !answeredSet.has(q.id));
        return nextUnanswered || questions[0];
    }

    return fallbackQuestion;
}

function matchesDateVariants(dateConfig, normalizedInput) {
    if (!dateConfig) return false;

    const cleaned = (normalizedInput || '')
        .replace(TRAILING_PUNCTUATION_REGEX, '')
        .replace(LEADING_DATE_PHRASE_REGEX, '')
        .trim();

    if (!cleaned) return false;

    const dayNum = String(dateConfig.day);
    const dayPattern = `0?${dayNum}`;
    const yearsPattern = Array.isArray(dateConfig.years) && dateConfig.years.length > 0
        ? `(?:${dateConfig.years.join('|')})`
        : '(?:\\d{2}|\\d{4})';

    const monthNumbers = [];
    const monthNames = [];

    (dateConfig.months || []).forEach((m) => {
        if (typeof m.num === 'number') {
            const n = String(m.num);
            monthNumbers.push(`0?${n}`);
        }
        if (Array.isArray(m.names)) {
            m.names.forEach((name) => {
                const normName = normalizeAnswer(name);
                if (normName) monthNames.push(normName);
            });
        }
    });

    if (monthNumbers.length > 0) {
        const numericRegex = new RegExp(
            `^${dayPattern}\\s*[/\\-.\\s]\\s*(?:${monthNumbers.join('|')})(?:\\s*[/\\-.\\s]\\s*${yearsPattern})?$`
        );
        if (numericRegex.test(cleaned)) return true;
    }

    if (monthNames.length > 0) {
        const textualRegex = new RegExp(
            `^${dayPattern}\\s*(?:${monthNames.join('|')})(?:\\s+${yearsPattern})?$`
        );
        if (textualRegex.test(cleaned)) return true;
    }

    return false;
}

/**
 * Vérifie si la saisie utilisateur valide la question d'accès (mot passe-partout,
 * réponse exacte normalisée, mots-clés souples ou variantes de date).
 */
export function isGateAnswerValid(activeQuestion, rawOrNormalizedInput, masterPasswords = []) {
    const normalizedInput = normalizeAnswer(rawOrNormalizedInput);
    if (!normalizedInput) return false;

    const isMasterPassword = (masterPasswords || []).some(
        (pwd) => normalizeAnswer(pwd) === normalizedInput
    );
    if (isMasterPassword) return true;

    if (!activeQuestion) return false;

    if (Array.isArray(activeQuestion.answers)) {
        const exactMatch = activeQuestion.answers.some(
            (ans) => normalizeAnswer(ans) === normalizedInput
        );
        if (exactMatch) return true;
    }

    if (activeQuestion.acceptedDateVariants && matchesDateVariants(activeQuestion.acceptedDateVariants, normalizedInput)) {
        return true;
    }

    if (Array.isArray(activeQuestion.acceptedKeywords) && activeQuestion.acceptedKeywords.length > 0) {
        const cleanedInput = normalizeForKeywordMatch(normalizedInput);
        return activeQuestion.acceptedKeywords.some((kw) => {
            const cleanedKw = normalizeForKeywordMatch(kw);
            return cleanedKw && cleanedInput.includes(cleanedKw);
        });
    }

    return false;
}

/**
 * Retourne le message d'erreur personnalisé si la réponse correspond à un piège connu (ex: "rose").
 */
export function getGateCustomError(activeQuestion, rawOrNormalizedInput) {
    if (!activeQuestion || !activeQuestion.customErrors) return null;
    const normalizedInput = normalizeAnswer(rawOrNormalizedInput);
    for (const [key, message] of Object.entries(activeQuestion.customErrors)) {
        if (normalizeAnswer(key) === normalizedInput) {
            return message;
        }
    }
    return null;
}
