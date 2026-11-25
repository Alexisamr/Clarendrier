import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HEART_STAR_COUNT,
    HEART_STAR_ANGLES,
    getSmoothHeartPoint,
    getHeartLayout,
    getHeartStars,
    sampleHeartArc,
    evaluateSkyTouch,
    getConstellationMusicState
} from './midnightConstellation.js';

test('generates 12 evenly distributed stars starting at the bottom heart tip', () => {
    assert.equal(HEART_STAR_ANGLES.length, HEART_STAR_COUNT);
    assert.equal(HEART_STAR_COUNT, 12);

    const stars = getHeartStars(500, 300, 10);
    assert.equal(stars.length, 12);

    // Star 0 sits at the bottom tip (x = centerX, y > centerY)
    assert.ok(Math.abs(stars[0].x - 500) < 0.01);
    assert.ok(stars[0].y > 450);

    // Star 6 sits symmetrically at the top center cleft (x ≈ centerX, y < centerY)
    assert.ok(Math.abs(stars[6].x - 500) < 1.5);
    assert.ok(stars[6].y < 300);

    // Consecutive chord distances should be reasonably uniform (no tight clumping)
    const dists = [];
    for (let i = 0; i < stars.length; i++) {
        const a = stars[i];
        const b = stars[(i + 1) % stars.length];
        dists.push(Math.hypot(b.x - a.x, b.y - a.y));
    }
    const minDist = Math.min(...dists);
    const maxDist = Math.max(...dists);
    assert.ok(maxDist / minDist < 1.35, `Expected uniform spacing, got ratio ${maxDist / minDist}`);
});

test('evaluateSkyTouch detects hits, misses with guiding target, milestones, and completion', () => {
    const layout = getHeartLayout(400, 620);
    const stars = getHeartStars(layout.centerX, layout.centerY, layout.heartScale);

    // Miss far away returns guiding target star without advancing
    const miss = evaluateSkyTouch(10, 10, 0, stars, layout.hitRadius);
    assert.equal(miss.hit, false);
    assert.equal(miss.nextIndex, 0);
    assert.equal(miss.targetStar.index, 0);

    // Hit near star 0 advances to 1
    const hit0 = evaluateSkyTouch(stars[0].x + 12, stars[0].y - 8, 0, stars, layout.hitRadius);
    assert.equal(hit0.hit, true);
    assert.equal(hit0.nextIndex, 1);
    assert.equal(hit0.isMilestone, false);
    assert.equal(hit0.isComplete, false);

    // Star 3 (4th star) is a milestone
    const hit3 = evaluateSkyTouch(stars[3].x, stars[3].y, 3, stars, layout.hitRadius);
    assert.equal(hit3.hit, true);
    assert.equal(hit3.isMilestone, true);
    assert.equal(hit3.isComplete, false);

    // Final star (index 11) completes the heart
    const hitFinal = evaluateSkyTouch(stars[11].x, stars[11].y, 11, stars, layout.hitRadius);
    assert.equal(hitFinal.hit, true);
    assert.equal(hitFinal.nextIndex, 12);
    assert.equal(hitFinal.isMilestone, true);
    assert.equal(hitFinal.isComplete, true);
});

test('sampleHeartArc returns continuous curve points between consecutive stars', () => {
    const pts = sampleHeartArc(HEART_STAR_ANGLES[0], HEART_STAR_ANGLES[1], 500, 300, 10, 20);
    assert.equal(pts.length, 21);
    const start = getSmoothHeartPoint(HEART_STAR_ANGLES[0], 500, 300, 10);
    const end = getSmoothHeartPoint(HEART_STAR_ANGLES[1], 500, 300, 10);
    assert.ok(Math.hypot(pts[0].x - start.x, pts[0].y - start.y) < 0.001);
    assert.ok(Math.hypot(pts[20].x - end.x, pts[20].y - end.y) < 0.001);
});

test('getConstellationMusicState transitions from calm progression to climax on completion', () => {
    assert.deepEqual(getConstellationMusicState(0, 12, false), { mode: 'calm', progress: 0 });
    assert.deepEqual(getConstellationMusicState(6, 12, false), { mode: 'calm', progress: 0.5 });
    assert.deepEqual(getConstellationMusicState(12, 12, false), { mode: 'climax', progress: 1 });
    assert.deepEqual(getConstellationMusicState(12, 12, true), { mode: 'climax', progress: 1 });
});
