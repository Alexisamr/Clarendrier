import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MUSEUM_LOOP_CONFIG,
    MUSEUM_CARTELS,
    MUSEUM_OBJECTIVE_CONFIG,
    MUSEUM_HALL_CARAVAN,
    MUSEUM_LED_CONFIG
} from '../data/museumGameConfig.js';
import {
    wrapLoopPosition,
    shortestLoopDelta,
    getLoopProgress,
    createMuseumGameState,
    stepMuseumPlayer,
    findNearestCartel,
    markCartelVisited,
    evaluateMuseumObjective,
    sampleMuseumLedColor
} from './museumGameLogic.js';

test('wrapLoopPosition and shortestLoopDelta handle circular museum seam seamlessly', () => {
    const L = MUSEUM_LOOP_CONFIG.LOOP_LENGTH; // 4800

    assert.equal(wrapLoopPosition(0, L), 0);
    assert.equal(wrapLoopPosition(L, L), 0);
    assert.equal(wrapLoopPosition(L + 125, L), 125);
    assert.equal(wrapLoopPosition(-40, L), L - 40);

    // Shortest delta across 0 / 4800 boundary
    assert.equal(shortestLoopDelta(L - 30, 20, L), 50);
    assert.equal(shortestLoopDelta(20, L - 30, L), -50);
    assert.equal(shortestLoopDelta(1000, 1200, L), 200);
});

test('walking a full circular loop returns cleanly to start and increments lap count', () => {
    let state = createMuseumGameState(MUSEUM_LOOP_CONFIG);
    assert.equal(state.playerPos, 0);
    assert.equal(state.lapsCompleted, 0);

    // Simulate walking right for enough time to complete 1 full loop (~22 seconds at 240 px/s)
    const steps = 700;
    const dt = 0.032;
    for (let i = 0; i < steps; i++) {
        state = stepMuseumPlayer(state, 1, dt, MUSEUM_LOOP_CONFIG);
    }

    assert.equal(state.facing, 1);
    assert.equal(state.isWalking, true);
    assert.ok(state.lapsCompleted >= 1, 'Completing a full circumference increments lapsCompleted');
    assert.ok(state.playerPos >= 0 && state.playerPos < MUSEUM_LOOP_CONFIG.LOOP_LENGTH);

    // Companion (Alexis) smoothly trails behind Clara within expected distance
    const distBetween = Math.abs(
        shortestLoopDelta(state.companionPos, state.playerPos, MUSEUM_LOOP_CONFIG.LOOP_LENGTH)
    );
    assert.ok(distBetween > 15 && distBetween < 90, `Companion distance ${distBetween} should stay close`);

    // Stopping brings velocity smoothly back to 0
    for (let i = 0; i < 40; i++) {
        state = stepMuseumPlayer(state, 0, 0.032, MUSEUM_LOOP_CONFIG);
    }
    assert.equal(state.velocity, 0);
    assert.equal(state.isWalking, false);
});

test('getLoopProgress maps circular loop coordinates to all 4 wings cleanly', () => {
    const L = MUSEUM_LOOP_CONFIG.LOOP_LENGTH;
    assert.equal(getLoopProgress(0, L).wingLabel, 'Aile Nord');
    assert.equal(getLoopProgress(L * 0.3, L).wingLabel, 'Rotonde Est');
    assert.equal(getLoopProgress(L * 0.6, L).wingLabel, 'Aile Sud');
    assert.equal(getLoopProgress(L * 0.85, L).wingLabel, 'Rotonde Ouest');
    assert.ok(Math.abs(getLoopProgress(L * 0.5, L).angleRad - Math.PI) < 0.001);
});

test('findNearestCartel detects nearby cartels including across the circular wrap seam', () => {
    const L = MUSEUM_LOOP_CONFIG.LOOP_LENGTH;
    const firstCartel = MUSEUM_CARTELS[0];

    const nearFirst = findNearestCartel(firstCartel.loopPosition - 40, MUSEUM_CARTELS, L, 96);
    assert.ok(nearFirst);
    assert.equal(nearFirst.cartel.id, firstCartel.id);

    // Seam test: custom cartel placed near 0 while player stands at L - 25
    const seamCartels = [{ id: 'seam_panel', loopPosition: 20 }];
    const acrossSeam = findNearestCartel(L - 25, seamCartels, L, 96);
    assert.ok(acrossSeam);
    assert.equal(acrossSeam.cartel.id, 'seam_panel');
    assert.equal(acrossSeam.delta, 45);
});

test('cartel visits and extensible objective evaluation behave correctly', () => {
    assert.ok(MUSEUM_CARTELS.length >= 6, 'Gallery should have multiple configurable cartels');
    assert.equal(MUSEUM_OBJECTIVE_CONFIG.enabled, false, 'Default mode is open free exploration');

    let visited = [];
    visited = markCartelVisited(visited, MUSEUM_CARTELS[0].id);
    visited = markCartelVisited(visited, MUSEUM_CARTELS[0].id); // idempotent
    assert.equal(visited.length, 1);

    const freeEval = evaluateMuseumObjective(visited, 1, MUSEUM_CARTELS, MUSEUM_OBJECTIVE_CONFIG);
    assert.equal(freeEval.visitedCount, 1);
    assert.equal(freeEval.totalCount, MUSEUM_CARTELS.length);
    assert.equal(freeEval.isComplete, false);

    // When objective is later enabled with visit_all_cartels, completing all cartels triggers completion
    const allIds = MUSEUM_CARTELS.map((c) => c.id);
    const enabledEval = evaluateMuseumObjective(allIds, 1, MUSEUM_CARTELS, {
        ...MUSEUM_OBJECTIVE_CONFIG,
        enabled: true,
        mode: 'visit_all_cartels',
        requiredCartelIds: allIds
    });
    assert.equal(enabledEval.isComplete, true);
    assert.equal(enabledEval.progressRatio, 1);

    // Hall caravan covers all key iconic species
    const species = new Set(MUSEUM_HALL_CARAVAN.map((a) => a.kind));
    ['elephant', 'giraffe', 'zebra', 'rhino', 'lion', 'antelope', 'ostrich'].forEach((k) => {
        assert.ok(species.has(k), `Missing iconic hall species: ${k}`);
    });
});

test('hall caravan is densely populated with zero identical animals placed side-by-side', () => {
    assert.ok(MUSEUM_HALL_CARAVAN.length >= 36, `Expected denser caravan, got ${MUSEUM_HALL_CARAVAN.length}`);

    // 1. Check no two adjacent animals on the SAME plane share the same kind (including circular wrap)
    for (const plane of ['far', 'mid']) {
        const sorted = MUSEUM_HALL_CARAVAN
            .filter((a) => a.plane === plane)
            .sort((a, b) => a.loopNorm - b.loopNorm);
        assert.ok(sorted.length >= 18, `Expected at least 18 animals on ${plane} plane`);
        for (let i = 0; i < sorted.length; i++) {
            const curr = sorted[i];
            const next = sorted[(i + 1) % sorted.length];
            assert.notEqual(
                curr.kind,
                next.kind,
                `Same species adjacent on ${plane} plane: ${curr.id} (${curr.kind}) next to ${next.id}`
            );
        }
    }

    // 2. Check no two immediate neighbors across BOTH planes combined share the same kind (including wrap)
    const allSorted = [...MUSEUM_HALL_CARAVAN].sort((a, b) => a.loopNorm - b.loopNorm);
    for (let i = 0; i < allSorted.length; i++) {
        const curr = allSorted[i];
        const next = allSorted[(i + 1) % allSorted.length];
        assert.notEqual(
            curr.kind,
            next.kind,
            `Same species adjacent across hall: ${curr.id} (${curr.kind}) next to ${next.id}`
        );
    }
});

test('sampleMuseumLedColor holds each rainbow color for 15-20s then cross-fades smoothly', () => {
    assert.ok(
        MUSEUM_LED_CONFIG.HOLD_SECONDS >= 15 && MUSEUM_LED_CONFIG.HOLD_SECONDS <= 20,
        'LED hold duration must stay within 15-20 seconds'
    );
    assert.ok(MUSEUM_LED_CONFIG.COLORS.length >= 6, 'Rainbow palette should contain full spectrum');

    const hold = MUSEUM_LED_CONFIG.HOLD_SECONDS;
    const trans = MUSEUM_LED_CONFIG.TRANSITION_SECONDS;
    const step = hold + trans;
    const c0 = MUSEUM_LED_CONFIG.COLORS[0].rgb;
    const c1 = MUSEUM_LED_CONFIG.COLORS[1].rgb;

    // During hold plateau (0s and 14s): color stays locked on first color with blend = 0
    const start = sampleMuseumLedColor(0, MUSEUM_LED_CONFIG);
    const lateHold = sampleMuseumLedColor(hold - 1, MUSEUM_LED_CONFIG);
    assert.equal(start.isTransitioning, false);
    assert.equal(lateHold.isTransitioning, false);
    assert.deepEqual([start.r, start.g, start.b], c0);
    assert.deepEqual([lateHold.r, lateHold.g, lateHold.b], c0);

    // Mid-transition (hold + trans/2): smooth cosine blend = 0.5, exact midpoint RGB
    const mid = sampleMuseumLedColor(hold + trans * 0.5, MUSEUM_LED_CONFIG);
    assert.equal(mid.isTransitioning, true);
    assert.ok(Math.abs(mid.blend - 0.5) < 0.001);
    assert.equal(mid.r, Math.round((c0[0] + c1[0]) * 0.5));
    assert.equal(mid.g, Math.round((c0[1] + c1[1]) * 0.5));
    assert.equal(mid.b, Math.round((c0[2] + c1[2]) * 0.5));

    // After transition completes: cleanly lands on next rainbow color
    const nextColor = sampleMuseumLedColor(step + 0.5, MUSEUM_LED_CONFIG);
    assert.equal(nextColor.colorIndex, 1);
    assert.equal(nextColor.isTransitioning, false);
    assert.deepEqual([nextColor.r, nextColor.g, nextColor.b], c1);

    // Full rainbow cycle wraps seamlessly back to color 0
    const wrapped = sampleMuseumLedColor(step * MUSEUM_LED_CONFIG.COLORS.length + 0.2, MUSEUM_LED_CONFIG);
    assert.equal(wrapped.colorIndex, 0);
    assert.deepEqual([wrapped.r, wrapped.g, wrapped.b], c0);
});
