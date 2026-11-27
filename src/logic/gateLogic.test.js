import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEV_MODE,
    CALENDAR_CONFIG,
    GATE_QUESTIONS,
    GATE_MASTER_PASSWORDS,
    GATE_FALLBACK_QUESTION
} from '../data/calendarData.js';
import {
    isDayUnlockedForDate,
    getScheduledGateQuestionForDate,
    getPreviewGateQuestion,
    isGateAnswerValid,
    getGateCustomError
} from './gateLogic.js';

test('DEV_MODE is false in delivery mode', () => {
    assert.equal(DEV_MODE, false);
});

test('isDayUnlockedForDate locks all days before Dec 1 and unlocks progressively Dec 1..24 in delivery mode', () => {
    const nov27 = new Date(2026, 10, 27, 12, 0, 0);
    for (let day = 1; day <= 24; day++) {
        assert.equal(
            isDayUnlockedForDate(day, nov27, {
                devMode: DEV_MODE,
                unlockYear: CALENDAR_CONFIG.UNLOCK_YEAR,
                unlockMonthIndex: CALENDAR_CONFIG.UNLOCK_MONTH_INDEX
            }),
            false,
            `Expected day ${day} locked on Nov 27`
        );
    }

    const dec1 = new Date(2026, 11, 1, 12, 0, 0);
    assert.equal(isDayUnlockedForDate(1, dec1, { devMode: false, unlockYear: 2026, unlockMonthIndex: 11 }), true);
    assert.equal(isDayUnlockedForDate(2, dec1, { devMode: false, unlockYear: 2026, unlockMonthIndex: 11 }), false);

    const dec15 = new Date(2026, 11, 15, 12, 0, 0);
    assert.equal(isDayUnlockedForDate(15, dec15, { devMode: false, unlockYear: 2026, unlockMonthIndex: 11 }), true);
    assert.equal(isDayUnlockedForDate(16, dec15, { devMode: false, unlockYear: 2026, unlockMonthIndex: 11 }), false);

    const dec24 = new Date(2026, 11, 24, 12, 0, 0);
    assert.equal(isDayUnlockedForDate(24, dec24, { devMode: false, unlockYear: 2026, unlockMonthIndex: 11 }), true);

    const jan2027 = new Date(2027, 0, 5, 12, 0, 0);
    assert.equal(isDayUnlockedForDate(24, jan2027, { devMode: false, unlockYear: 2026, unlockMonthIndex: 11 }), true);

    // Dev unlock-all override unlocks all 24 days even before Dec 1, and restoring false re-locks them
    for (let day = 1; day <= 24; day++) {
        assert.equal(
            isDayUnlockedForDate(day, nov27, { devMode: false, devUnlockAll: true, unlockYear: 2026, unlockMonthIndex: 11 }),
            true
        );
        assert.equal(
            isDayUnlockedForDate(day, nov27, { devMode: false, devUnlockAll: false, unlockYear: 2026, unlockMonthIndex: 11 }),
            false
        );
    }
});

test('gate questions are scheduled strictly on Dec 1, 5, 10, 15, and 20 of 2026 and nowhere else', () => {
    assert.equal(GATE_QUESTIONS.length, 5);
    assert.deepEqual(
        GATE_QUESTIONS.map((q) => q.scheduledDay),
        [1, 5, 10, 15, 20]
    );

    // Before December (27/11/2026 -> 30/11/2026): no question blocks entry
    for (let day = 27; day <= 30; day++) {
        const novDate = new Date(2026, 10, day, 12, 0, 0);
        assert.equal(
            getScheduledGateQuestionForDate(GATE_QUESTIONS, [], novDate, CALENDAR_CONFIG.UNLOCK_YEAR, CALENDAR_CONFIG.UNLOCK_MONTH_INDEX),
            null
        );
    }

    // All 24 days of December 2026
    const scheduledDays = new Set([1, 5, 10, 15, 20]);
    for (let day = 1; day <= 24; day++) {
        const decDate = new Date(2026, 11, day, 12, 0, 0);
        const q = getScheduledGateQuestionForDate(
            GATE_QUESTIONS,
            [],
            decDate,
            CALENDAR_CONFIG.UNLOCK_YEAR,
            CALENDAR_CONFIG.UNLOCK_MONTH_INDEX
        );
        if (scheduledDays.has(day)) {
            assert.ok(q, `Expected a scheduled question on December ${day}`);
            assert.equal(q.scheduledDay, day);
        } else {
            assert.equal(q, null, `Expected no scheduled question on December ${day}`);
        }
    }
});

test('once a scheduled question is answered correctly, it is never asked again', () => {
    const dec1 = new Date(2026, 11, 1, 14, 0, 0);
    const dec5 = new Date(2026, 11, 5, 14, 0, 0);

    const q1 = getScheduledGateQuestionForDate(GATE_QUESTIONS, [], dec1);
    assert.equal(q1.id, 'gate_color');

    // Already answered q1 -> null on Dec 1
    assert.equal(getScheduledGateQuestionForDate(GATE_QUESTIONS, ['gate_color'], dec1), null);

    // Still asks q2 on Dec 5 when only q1 was answered
    const q2 = getScheduledGateQuestionForDate(GATE_QUESTIONS, ['gate_color'], dec5);
    assert.equal(q2.id, 'gate_museum');

    // Already answered q2 -> null on Dec 5
    assert.equal(getScheduledGateQuestionForDate(GATE_QUESTIONS, ['gate_color', 'gate_museum'], dec5), null);
});

test('getPreviewGateQuestion provides a valid preview question when opened from Dev Mode', () => {
    const nov27 = new Date(2026, 10, 27, 12, 0, 0);
    const preview = getPreviewGateQuestion(GATE_QUESTIONS, [], nov27, 2026, 11, GATE_FALLBACK_QUESTION);
    assert.equal(preview.id, 'gate_color');

    const nextPreview = getPreviewGateQuestion(GATE_QUESTIONS, ['gate_color'], nov27, 2026, 11, GATE_FALLBACK_QUESTION);
    assert.equal(nextPreview.id, 'gate_museum');
});

test('Question 1 (color): accepts bleu/Bleu, returns custom error for rose, rejects other colors', () => {
    const qColor = GATE_QUESTIONS[0];

    assert.equal(isGateAnswerValid(qColor, 'bleu', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qColor, 'Bleu', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qColor, 'le bleu', GATE_MASTER_PASSWORDS), true);

    assert.equal(isGateAnswerValid(qColor, 'rose', GATE_MASTER_PASSWORDS), false);
    assert.equal(
        getGateCustomError(qColor, 'rose'),
        "t'es trop prévisible clara. betchise tout ça supplément mentchise."
    );
    assert.equal(
        getGateCustomError(qColor, 'Rose'),
        "t'es trop prévisible clara. betchise tout ça supplément mentchise."
    );

    assert.equal(isGateAnswerValid(qColor, 'vert', GATE_MASTER_PASSWORDS), false);
    assert.equal(isGateAnswerValid(qColor, 'noir', GATE_MASTER_PASSWORDS), false);
});

test('Question 2 (museum): accepts existing museum answers and rejects wrong answers', () => {
    const qMuseum = GATE_QUESTIONS[1];

    assert.equal(isGateAnswerValid(qMuseum, "Muséum d'histoire naturelle", GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qMuseum, "Grande Galerie de l'Évolution", GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qMuseum, 'MNHN', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qMuseum, 'Louvre', GATE_MASTER_PASSWORDS), false);
});

test('Question 3 (dish): accepts tiramisu variants and rejects wrong dishes', () => {
    const qDish = GATE_QUESTIONS[2];

    assert.equal(isGateAnswerValid(qDish, 'tiramisu', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qDish, 'Tiramisu', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qDish, 'du tiramisu', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qDish, 'raclette', GATE_MASTER_PASSWORDS), false);
});

test('Question 4 (trip): accepts Annecy and Pyrénées variants', () => {
    const qTrip = GATE_QUESTIONS[3];

    assert.equal(isGateAnswerValid(qTrip, 'Annecy', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qTrip, 'annecy', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qTrip, 'Pyrénées', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qTrip, 'pyrénées', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qTrip, 'les pyrenees', GATE_MASTER_PASSWORDS), true);
    assert.equal(isGateAnswerValid(qTrip, 'Marseille', GATE_MASTER_PASSWORDS), false);
});

test('Question 5 (anniversary date): accepts 11/04/2006, 11/04, 11 avril, and 11 janvier 2026 variants', () => {
    const qDate = GATE_QUESTIONS[4];

    const validDates = [
        '11/04/2006',
        '11/04/2026',
        '11/04',
        '11/4',
        '11-04',
        '11.04',
        '11 avril',
        '11 avril 2026',
        '11 avril 2006',
        'le 11 avril',
        '11 janvier 2026',
        '11 janvier',
        '11/01/2026',
        '11/01'
    ];
    for (const ans of validDates) {
        assert.equal(isGateAnswerValid(qDate, ans, GATE_MASTER_PASSWORDS), true, `Expected valid date: ${ans}`);
    }

    const invalidDates = ['12/04', '11/05', '15 avril', '25/12/2026', '11/04/1999'];
    for (const ans of invalidDates) {
        assert.equal(isGateAnswerValid(qDate, ans, GATE_MASTER_PASSWORDS), false, `Expected invalid date: ${ans}`);
    }
});

test('master password Clara works on every scheduled question', () => {
    for (const q of GATE_QUESTIONS) {
        assert.equal(isGateAnswerValid(q, 'Clara', GATE_MASTER_PASSWORDS), true);
    }
});
