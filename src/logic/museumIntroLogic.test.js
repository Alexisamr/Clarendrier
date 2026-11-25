import test from 'node:test';
import assert from 'node:assert/strict';
import {
    MUSEUM_INTRO_CONFIG,
    MUSEUM_CARAVAN_SPECIES,
    computeMuseumIntroFrame
} from './museumIntroLogic.js';

test('MUSEUM_INTRO_CONFIG mirrors the exact timing rhythm of the mountain animation', () => {
    assert.equal(MUSEUM_INTRO_CONFIG.TOTAL_DURATION, 7.35);
    assert.equal(MUSEUM_INTRO_CONFIG.FADE_IN_END, 0.45);
    assert.equal(MUSEUM_INTRO_CONFIG.WALK_START, 0.40);
    assert.equal(MUSEUM_INTRO_CONFIG.WALK_END, 3.55);
    assert.equal(MUSEUM_INTRO_CONFIG.GLOW_START, 3.75);
    assert.equal(MUSEUM_INTRO_CONFIG.TREMBLE_START, 4.25);
    assert.equal(MUSEUM_INTRO_CONFIG.SPLIT_START, 4.65);
    assert.equal(MUSEUM_INTRO_CONFIG.SPLIT_END, 6.65);
    assert.equal(MUSEUM_INTRO_CONFIG.BG_FADE_START, 4.75);
    assert.equal(MUSEUM_INTRO_CONFIG.BG_FADE_END, 6.10);
    assert.equal(MUSEUM_INTRO_CONFIG.BLOOM_PEAK, 5.25);
    assert.equal(MUSEUM_INTRO_CONFIG.BLOOM_END, 6.95);
});

test('parallax layers move at strictly distinct speeds across far, mid, and foreground planes', () => {
    const midWalk = computeMuseumIntroFrame(2.0, 390, 844);
    assert.ok(midWalk.approachProgress > 0.5 && midWalk.approachProgress < 1);
    assert.ok(midWalk.parallax.far.scale < midWalk.parallax.mid.scale);
    assert.ok(midWalk.parallax.mid.scale < midWalk.parallax.fg.scale);
    assert.ok(midWalk.parallax.far.lateralFactor < midWalk.parallax.mid.lateralFactor);
    assert.ok(midWalk.parallax.mid.lateralFactor < midWalk.parallax.fg.lateralFactor);
});

test('Alexis and Clara walk forward with exact mountain proportions, pause before the doors, and fade into light', () => {
    const start = computeMuseumIntroFrame(0.40, 390, 844);
    const mid = computeMuseumIntroFrame(1.9, 390, 844);
    const arrived = computeMuseumIntroFrame(3.55, 390, 844);
    const glowing = computeMuseumIntroFrame(4.4, 390, 844);
    const faded = computeMuseumIntroFrame(6.2, 390, 844);

    assert.equal(start.walk.isWalking, true);
    assert.equal(mid.walk.isWalking, true);
    assert.equal(arrived.walk.isWalking, false);

    // Couple moves upward from 0.94h to 0.785h and shrinks slightly in perspective
    assert.ok(Math.abs(start.walk.coupleY - 844 * 0.94) < 0.01);
    assert.ok(Math.abs(arrived.walk.coupleY - 844 * 0.785) < 0.01);
    assert.ok(mid.walk.perspScale < start.walk.perspScale);
    assert.ok(arrived.walk.perspScale < mid.walk.perspScale);

    // Side-by-side symmetry around screen center
    assert.ok(mid.walk.alexisX < 195);
    assert.ok(mid.walk.claraX > 195);
    assert.ok(Math.abs((mid.walk.alexisX + mid.walk.claraX) * 0.5 - 195) < 0.001);

    // Golden backlight rises before doors open, and avatars fade smoothly after split starts
    assert.equal(arrived.doors.glowRise, 0);
    assert.ok(glowing.doors.glowRise > 0.5);
    assert.equal(faded.walk.avatarAlpha, 0);
});

test('museum doors stay shut before SPLIT_START, slide fully open by SPLIT_END, and finish cleanly', () => {
    const beforeSplit = computeMuseumIntroFrame(4.5, 1440, 900);
    const midSplit = computeMuseumIntroFrame(5.65, 1440, 900);
    const endSplit = computeMuseumIntroFrame(6.7, 1440, 900);
    const done = computeMuseumIntroFrame(7.35, 1440, 900);

    assert.equal(beforeSplit.doors.splitProgress, 0);
    assert.equal(beforeSplit.doors.slideOffset, 0);
    assert.equal(beforeSplit.isPassingThrough, false);

    assert.ok(midSplit.doors.splitProgress > 0.4 && midSplit.doors.splitProgress < 0.6);
    assert.ok(midSplit.doors.slideOffset > 300);
    assert.ok(midSplit.bloom.alpha > 0.3);

    assert.equal(endSplit.doors.splitProgress, 1);
    assert.equal(endSplit.isPassingThrough, true);
    assert.equal(endSplit.bgFade, 0);

    assert.equal(done.isFinished, true);
    assert.equal(done.bloom.alpha, 0);
});

test('caravan includes all requested species across 3 depth planes while keeping central aisle clear in foreground', () => {
    const requiredSpecies = ['elephant', 'giraffe', 'zebra', 'rhino', 'lion', 'antelope', 'ostrich', 'bird'];
    const present = new Set(MUSEUM_CARAVAN_SPECIES.map((a) => a.species));
    requiredSpecies.forEach((sp) => {
        assert.ok(present.has(sp), `Missing requested species: ${sp}`);
    });

    const depths = new Set(MUSEUM_CARAVAN_SPECIES.map((a) => a.depth));
    assert.deepEqual([...depths].sort(), ['far', 'fg', 'mid']);

    // Foreground animals stay on left/right flanks so Alexis & Clara walk unobstructed
    const fgAnimals = MUSEUM_CARAVAN_SPECIES.filter((a) => a.depth === 'fg');
    assert.ok(fgAnimals.length >= 4);
    fgAnimals.forEach((a) => {
        assert.ok(a.nx <= 0.24 || a.nx >= 0.76, `Foreground animal ${a.id} encroaches on central aisle`);
    });
});
