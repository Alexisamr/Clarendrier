/**
 * ============================================================================
 * AFFICHAGE DE LA GRILLE DES 24 CASES DU CALENDRIER DE L'AVENT
 * ============================================================================
 */

import { calendarData, CALENDAR_CONFIG, UI_TEXTS } from '../data/calendarData.js';
import { isDayOpened, markDayOpened, isDayUnlocked } from '../logic/state.js';
import { gridEl } from './dom.js';
import { showToast } from './toast.js';
import { openModal } from './modal.js';

function getDay24CardMarkup(day) {
    return `
                <svg class="day-24-flank left" width="32" height="38" viewBox="0 0 32 38" fill="none" aria-hidden="true">
                    <path d="M16 4L7 16H12L4 28H13.5V34H18.5V28H28L20 16H25L16 4Z" fill="#2C4A3E" stroke="#C59B5F" stroke-width="0.9"/>
                    <circle cx="16" cy="3.5" r="2" fill="#E8D5B5"/>
                    <circle cx="13" cy="19" r="1.8" fill="#9E2A2B"/>
                    <circle cx="19" cy="23" r="1.8" fill="#C59B5F"/>
                    <circle cx="12" cy="25" r="1.5" fill="#E8D5B5"/>
                </svg>
                <span class="day-kicker">${UI_TEXTS.CARD_KICKER_DAY_24}</span>
                <span class="day-number">${day}</span>
                <svg class="day-24-flank right" width="32" height="38" viewBox="0 0 32 38" fill="none" aria-hidden="true">
                    <path d="M16 4L7 16H12L4 28H13.5V34H18.5V28H28L20 16H25L16 4Z" fill="#2C4A3E" stroke="#C59B5F" stroke-width="0.9"/>
                    <circle cx="16" cy="3.5" r="2" fill="#E8D5B5"/>
                    <circle cx="19" cy="18" r="1.8" fill="#9E2A2B"/>
                    <circle cx="13" cy="23" r="1.8" fill="#C59B5F"/>
                    <circle cx="20" cy="25" r="1.5" fill="#9E2A2B"/>
                </svg>
            `;
}

function getDay23CardMarkup(day) {
    return `
                <span class="day-kicker">${UI_TEXTS.CARD_KICKER_DAY_23}</span>
                <span class="day-number">${day}</span>
            `;
}

function getStandardCardMarkup(day) {
    return `
                <span class="day-kicker">${UI_TEXTS.CARD_KICKER_DEFAULT}</span>
                <span class="day-number">${day}</span>
            `;
}

export function renderGrid() {
    gridEl.innerHTML = '';

    calendarData.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'day-card';
        const isDay23 = item.day === CALENDAR_CONFIG.DAY_23;
        const isChristmasEve = item.day === CALENDAR_CONFIG.CHRISTMAS_EVE_DAY;
        if (isDay23) card.classList.add('day-23');
        if (isChristmasEve) card.classList.add('day-24');

        const isOpened = isDayOpened(item.day);
        const unlocked = isDayUnlocked(item.day);

        if (isOpened) {
            card.classList.add('opened');
        } else if (unlocked) {
            card.classList.add('available');
        } else {
            card.classList.add('locked');
        }

        if (isChristmasEve) {
            card.innerHTML = getDay24CardMarkup(item.day);
        } else if (isDay23) {
            card.innerHTML = getDay23CardMarkup(item.day);
        } else {
            card.innerHTML = getStandardCardMarkup(item.day);
        }

        card.addEventListener('click', () => {
            if (!unlocked) {
                showToast(UI_TEXTS.LOCKED_DAY_TOAST(item.day));
                return;
            }

            if (markDayOpened(item.day)) {
                card.classList.remove('available');
                card.classList.add('opened');
            }

            openModal(item);
        });

        gridEl.appendChild(card);
    });
}
