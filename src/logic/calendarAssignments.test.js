import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarData, DAY_ASSIGNMENTS, SURPRISES_CATALOG } from '../data/calendarData.js';

test('calendarData maps all 24 days to the exact requested app gifts, physical gifts, and empty days', () => {
    assert.equal(calendarData.length, 24);

    const byDay = (d) => calendarData.find((item) => item.day === d);

    // Exact app-gift day mapping
    assert.equal(byDay(1).surpriseKey, 'spotify_just_two_of_us');
    assert.equal(byDay(3).surpriseKey, 'quiz_ete');
    assert.equal(byDay(4).surpriseKey, 'coupon_chanson');
    assert.equal(byDay(5).surpriseKey, 'ferret_dune');
    assert.equal(byDay(7).surpriseKey, 'scratch_photo_1');
    assert.equal(byDay(9).surpriseKey, 'coupon_spiderman');
    assert.equal(byDay(12).surpriseKey, 'midnight_swim');
    assert.equal(byDay(14).surpriseKey, 'scratch_photo_2');
    assert.equal(byDay(16).surpriseKey, 'coupon_massage');
    assert.equal(byDay(20).surpriseKey, 'lucky_wheel');
    assert.equal(byDay(22).surpriseKey, 'museum_gallery');

    // Exact physical gift days
    const physicalDays = calendarData.filter((i) => i.giftKind === 'physical').map((i) => i.day);
    assert.deepEqual(physicalDays, [2, 6, 8, 11, 13, 17, 19, 21, 24]);

    assert.match(byDay(2).content, /chocolats et bonbons/i);
    assert.match(byDay(6).content, /porte-clé bracelet fait main/i);
    assert.match(byDay(8).content, /Ferrero Rocher/i);
    assert.match(byDay(11).content, /t-shirt I Love AA/i);
    assert.equal(byDay(13).content, '');
    assert.equal(byDay(13).cardNote, 'vide');
    assert.match(byDay(17).content, /bonbon \/ chocolats/i);
    assert.match(byDay(19).content, /lettre avec photo de nous deux/i);
    assert.match(byDay(21).content, /bracelet fait main/i);
    assert.equal(
        byDay(24).content,
        "Lettre malo + photo de nous deux avec dedans 3 raison de pourquoi je t'aime (et enfaite y'en a partout dans la carte) + (jbl go 4)"
    );

    // Exact 'à faire' notes on days 2, 6, 17, 19, 21, and 24
    const todoDays = calendarData.filter((i) => i.cardNote === 'à faire').map((i) => i.day);
    assert.deepEqual(todoDays, [2, 6, 17, 19, 21, 24]);

    // Exact 'vide' notes on days 10, 13, 15, 18, and 23
    const videDays = calendarData.filter((i) => i.cardNote === 'vide').map((i) => i.day);
    assert.deepEqual(videDays, [10, 13, 15, 18, 23]);
    videDays.forEach((d) => {
        assert.equal(byDay(d).content, '');
    });

    // Exact empty/unassigned days
    const emptyDays = calendarData.filter((i) => i.giftKind === 'empty').map((i) => i.day);
    assert.deepEqual(emptyDays, [10, 15, 18, 23]);
    emptyDays.forEach((d) => {
        assert.equal(DAY_ASSIGNMENTS[d], undefined);
        assert.equal(byDay(d).isEmpty, true);
        assert.equal(byDay(d).cardNote, 'vide');
        assert.equal(byDay(d).content, '');
    });

    // Exact app gift days
    const appDays = calendarData.filter((i) => i.giftKind === 'app').map((i) => i.day);
    assert.deepEqual(appDays, [1, 3, 4, 5, 7, 9, 12, 14, 16, 20, 22]);

    // Massage coupon updated text
    assert.equal(SURPRISES_CATALOG.coupon_massage.couponTitle, 'Bon pour un EENORME massage');
    assert.equal(byDay(16).couponTitle, 'Bon pour un EENORME massage');
});
