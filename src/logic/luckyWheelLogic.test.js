import test from 'node:test';
import assert from 'node:assert/strict';
import {
    WHEEL_SEGMENTS,
    INITIAL_TURNS,
    createWheelSessionState,
    resolveNextSpinOutcome,
    computeTargetSpinTrajectory,
    getSegmentUnderPointer,
    sampleSpinCurve,
    formatRemainingTurnsText
} from './luckyWheelLogic.js';

test('wheel contains 4 white, 2 green, and 2 red segments with all requested prizes', () => {
    const whites = WHEEL_SEGMENTS.filter((s) => s.colorType === 'white');
    const greens = WHEEL_SEGMENTS.filter((s) => s.colorType === 'green');
    const reds = WHEEL_SEGMENTS.filter((s) => s.colorType === 'red');

    assert.equal(WHEEL_SEGMENTS.length, 8);
    assert.equal(whites.length, 4);
    assert.equal(greens.length, 2);
    assert.equal(reds.length, 2);

    assert.deepEqual(
        whites.map((s) => s.prizeText.toLowerCase()).sort(),
        [
            '1 bisous',
            'surprise',
            "t'as encore le droit de rejouer (je suis vraiment sympa quand même)",
            'tu gagnes tout mon respect'
        ].sort()
    );

    assert.deepEqual(
        greens.map((s) => s.prizeText.toLowerCase()).sort(),
        [
            'attaque de bisous sur demande',
            "t'as le droit de rejouer"
        ].sort()
    );

    assert.deepEqual(
        reds.map((s) => s.prizeText.toLowerCase()).sort(),
        [
            'chasse au trésor maison',
            "mystery date (tu choisis la date, je m'occupe du reste)"
        ].sort()
    );
});

test('follows the exact 5-spin scripted sequence and remaining turns count before random red finish', () => {
    let state = createWheelSessionState();
    assert.equal(state.turnsRemaining, INITIAL_TURNS);
    assert.equal(state.turnsRemaining, 3);

    // Spin 1: white « tu gagnes tout mon respect », loses 1 turn -> 2 left
    const spin1 = resolveNextSpinOutcome(state, WHEEL_SEGMENTS, 0.1);
    assert.equal(spin1.segment.id, 'white_respect');
    assert.equal(spin1.segment.colorType, 'white');
    assert.equal(spin1.nextState.turnsRemaining, 2);
    assert.equal(spin1.nextState.finished, false);
    state = spin1.nextState;

    // Spin 2: green « t'as le droit de rejouer », keeps 2 turns
    const spin2 = resolveNextSpinOutcome(state, WHEEL_SEGMENTS, 0.9);
    assert.equal(spin2.segment.id, 'green_replay');
    assert.equal(spin2.segment.colorType, 'green');
    assert.equal(spin2.nextState.turnsRemaining, 2);
    assert.equal(spin2.nextState.finished, false);
    state = spin2.nextState;

    // Spin 3: green « attaque de bisous sur demande », loses 1 turn -> 1 left
    const spin3 = resolveNextSpinOutcome(state, WHEEL_SEGMENTS, 0.2);
    assert.equal(spin3.segment.id, 'green_kisses');
    assert.equal(spin3.segment.colorType, 'green');
    assert.equal(spin3.nextState.turnsRemaining, 1);
    assert.equal(spin3.nextState.finished, false);
    state = spin3.nextState;

    // Spin 4: white « t'as encore le droit de rejouer (...) », keeps 1 turn
    const spin4 = resolveNextSpinOutcome(state, WHEEL_SEGMENTS, 0.8);
    assert.equal(spin4.segment.id, 'white_replay');
    assert.equal(spin4.segment.colorType, 'white');
    assert.equal(spin4.nextState.turnsRemaining, 1);
    assert.equal(spin4.nextState.finished, false);
    state = spin4.nextState;

    // Spin 5a (randomFloat < 0.5): red « Chasse au trésor maison » -> 0 turns, finished
    const spin5a = resolveNextSpinOutcome(state, WHEEL_SEGMENTS, 0.12);
    assert.equal(spin5a.segment.id, 'red_treasure');
    assert.equal(spin5a.segment.colorType, 'red');
    assert.equal(spin5a.isFinalRandomRed, true);
    assert.equal(spin5a.nextState.turnsRemaining, 0);
    assert.equal(spin5a.nextState.finished, true);
    assert.equal(spin5a.nextState.wonPrizes.length, 3);

    // Spin 5b (randomFloat >= 0.5): red « Mystery date (...) » -> 0 turns, finished
    const spin5b = resolveNextSpinOutcome(state, WHEEL_SEGMENTS, 0.78);
    assert.equal(spin5b.segment.id, 'red_mystery');
    assert.equal(spin5b.segment.colorType, 'red');
    assert.equal(spin5b.isFinalRandomRed, true);
    assert.equal(spin5b.nextState.turnsRemaining, 0);
    assert.equal(spin5b.nextState.finished, true);

    // Spin 6: locked once turnsRemaining is 0
    assert.equal(resolveNextSpinOutcome(spin5a.nextState, WHEEL_SEGMENTS, 0.5), null);
});

test('computeTargetSpinTrajectory always lands inside the target segment in both directions', () => {
    const startAngles = [0, 0.73, Math.PI, 4.91, -2.15];

    for (const startAngle of startAngles) {
        for (let targetIdx = 0; targetIdx < WHEEL_SEGMENTS.length; targetIdx++) {
            for (const dir of [1, -1]) {
                for (const offset of [0.22, 0.5, 0.78]) {
                    const traj = computeTargetSpinTrajectory(
                        startAngle,
                        targetIdx,
                        WHEEL_SEGMENTS.length,
                        dir,
                        offset,
                        5
                    );
                    const landed = getSegmentUnderPointer(traj.endAngle, WHEEL_SEGMENTS.length);
                    assert.equal(
                        landed,
                        targetIdx,
                        `Expected segment ${targetIdx}, got ${landed} (start=${startAngle}, dir=${dir}, offset=${offset})`
                    );
                    assert.ok(dir > 0 ? traj.totalDelta > Math.PI * 6 : traj.totalDelta < -Math.PI * 6);
                }
            }
        }
    }
});

test('sampleSpinCurve starts at startAngle, finishes at endAngle with 0 velocity, and formats turns text', () => {
    const traj = computeTargetSpinTrajectory(1.2, 4, WHEEL_SEGMENTS.length, 1, 0.5, 5);
    const start = sampleSpinCurve(traj.startAngle, traj.totalDelta, 0, 4.8);
    const mid = sampleSpinCurve(traj.startAngle, traj.totalDelta, 0.5, 4.8);
    const end = sampleSpinCurve(traj.startAngle, traj.totalDelta, 1, 4.8);

    assert.equal(start.angle, traj.startAngle);
    assert.ok(start.omega > 15);
    assert.ok(mid.angle > start.angle && mid.angle < end.angle);
    assert.ok(Math.abs(end.angle - traj.endAngle) < 1e-9);
    assert.equal(end.omega, 0);
    assert.equal(end.done, true);

    assert.equal(formatRemainingTurnsText(3), 'Il te reste 3 tours');
    assert.equal(formatRemainingTurnsText(2), 'Il te reste 2 tours');
    assert.equal(formatRemainingTurnsText(1), 'Il te reste 1 tour');
    assert.equal(formatRemainingTurnsText(0), 'Il te reste 0 tour');
});
