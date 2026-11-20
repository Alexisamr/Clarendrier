/**
 * ============================================================================
 * FONCTIONS UTILITAIRES PURES (TEXTE, MATHS, COULEURS, AUDIO, DATES)
 * ============================================================================
 */

const FRENCH_ARTICLE_PREFIX_REGEX = /^(le |la |l'|les |un |une |au |aux |du |de la |de l'|des )/i;
const DIACRITICS_REGEX = /[\u0300-\u036f]/g;
const CURLY_APOSTROPHE_REGEX = /[’‘`]/g;
const PUNCTUATION_TO_SPACE_REGEX = /['\-_.,;:!?()"]/g;
const MULTI_SPACE_REGEX = /\s+/g;
const UINT32_MAX_PLUS_ONE = 0xFFFFFFFF + 1;

/**
 * Normalise une réponse texte (minuscules, sans accents, apostrophes unifiées, sans article initial).
 */
export function normalizeAnswer(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(DIACRITICS_REGEX, '')
        .replace(CURLY_APOSTROPHE_REGEX, "'")
        .replace(MULTI_SPACE_REGEX, ' ')
        .trim()
        .replace(FRENCH_ARTICLE_PREFIX_REGEX, '')
        .trim();
}

/**
 * Normalise une réponse pour la recherche souple par mots-clés (remplace la ponctuation par des espaces).
 */
export function normalizeForKeywordMatch(str) {
    return normalizeAnswer(str)
        .replace(PUNCTUATION_TO_SPACE_REGEX, ' ')
        .replace(MULTI_SPACE_REGEX, ' ')
        .trim();
}

/**
 * Génère un nombre flottant aléatoire cryptographique dans [0, 1[.
 */
export function getCryptoRandomFloat() {
    if (window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint32Array(1);
        window.crypto.getRandomValues(arr);
        return arr[0] / UINT32_MAX_PLUS_ONE;
    }
    return Math.random();
}

/**
 * Interpole linéairement deux couleurs RGB [r, g, b] selon t dans [0, 1].
 */
export function lerpColor(c1, c2, t) {
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
    return `rgb(${r},${g},${b})`;
}

/**
 * Restreint une valeur numérique entre min et max.
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Formate la date courante au format court français (JJ/MM HH:MM).
 */
export function formatFrenchShortDate(date = new Date()) {
    return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Crée ou reprend un contexte Web Audio API.
 */
export function createOrResumeAudioContext(existingCtx, onInit) {
    try {
        let ctx = existingCtx;
        if (!ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) return null;
            ctx = new AudioContextClass();
            if (typeof onInit === 'function') {
                onInit(ctx);
            }
        }
        if (ctx.state === 'suspended') {
            ctx.resume();
        }
        return ctx;
    } catch {
        return null;
    }
}

/**
 * Ferme proprement un contexte Web Audio API s'il est ouvert.
 */
export function closeAudioContextSafely(audioCtx) {
    if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
    }
}
