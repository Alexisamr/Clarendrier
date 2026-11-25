/**
 * ============================================================================
 * MODALE DU JOUR (BOTTOM SHEET / DIALOG) & RACCOURCIS CLAVIER GLOBAUX
 * ============================================================================
 */

import { ASSET_PATHS, UI_TEXTS } from '../data/calendarData.js';
import {
    hasWonGame,
    markGameWon,
    isCardScratched,
    saveAndSyncQuizAnswer
} from '../logic/state.js';
import {
    modalOverlay,
    modalClose,
    modalDay,
    modalBody,
    fsScratchOverlay,
    fsCouponOverlay,
    fsQuizOverlay,
    fsOverlay
} from './dom.js';
import { launchFullscreenQuiz, closeFullscreenQuiz } from './quiz.js';
import { launchFullscreenCoupon, closeFullscreenCoupon } from './coupon.js';
import {
    getNormalizedScratchCards,
    launchFullscreenScratchCard,
    closeFullscreenScratchCard
} from './scratchCard.js';
import { launchFullscreenFerretGame, closeFullscreenGame } from './ferretGame.js';
import { launchFullscreenMidnightSwim } from './midnightSwim.js';
import { launchFullscreenLuckyWheel } from './luckyWheel.js';
import { launchFullscreenMuseumGame } from './museumGame.js';

const MOBILE_USER_AGENT_REGEX = /iPhone|iPad|iPod|Android/i;
const SPOTIFY_FALLBACK_DELAY_MS = 650;
const DEFAULT_SPOTIFY_WEB_URL = 'https://open.spotify.com/track/5fdNHVZHbWB1AaXk4RBGVD';

export function closeModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
}

function renderFerretModalContent(item, hasWon) {
    if (hasWon) {
        const msgDiv = document.createElement('div');
        msgDiv.style.marginBottom = '18px';
        msgDiv.style.fontFamily = 'var(--font-serif)';
        msgDiv.style.fontSize = '1.3rem';
        msgDiv.style.fontWeight = '600';
        msgDiv.innerHTML = item.content;
        modalBody.appendChild(msgDiv);
    }

    const launchBox = document.createElement('div');
    launchBox.className = 'game-launch-box';
    launchBox.innerHTML = `
            <div class="game-launch-sun"></div>
            <div class="game-launch-content">
                <span class="game-launch-tag">${item.gameSubtitle}</span>
                <h3 class="game-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>${hasWon ? '↺ Rejouer en plein écran' : '▶ Lancer en plein écran'}</span>
                </div>
            </div>
        `;
    launchBox.addEventListener('click', () => {
        launchFullscreenFerretGame(item);
    });
    modalBody.appendChild(launchBox);
}

function renderQuizModalContent(item, hasWon) {
    if (hasWon) {
        const wonWrap = document.createElement('div');
        wonWrap.style.marginBottom = '16px';
        wonWrap.innerHTML = `
                <div class="fs-quiz-photo-frame" style="margin: 4px 0 12px;">
                    <img src="${item.finalImage || ASSET_PATHS.QUIZ_FINAL_CAP}" alt="Souvenir Cap Ferret" class="fs-quiz-photo" style="max-height: 240px;" />
                </div>
                <div style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; color: var(--text-primary);">
                    ${item.finalMessage}
                </div>
            `;
        modalBody.appendChild(wonWrap);
    }

    const quizBox = document.createElement('div');
    quizBox.className = 'quiz-launch-box';
    quizBox.innerHTML = `
            <div class="quiz-launch-content">
                <span class="quiz-launch-tag">${item.gameSubtitle}</span>
                <h3 class="quiz-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>${hasWon ? '↺ Refaire le quiz en plein écran' : '▶ Commencer le quiz'}</span>
                </div>
            </div>
        `;
    quizBox.addEventListener('click', () => {
        launchFullscreenQuiz(item);
    });
    modalBody.appendChild(quizBox);
}

function renderCouponModalContent(item, hasWon) {
    if (hasWon) {
        const miniCard = document.createElement('div');
        miniCard.className = 'coupon-mini-preview';
        miniCard.innerHTML = `
                <div class="coupon-mini-title"></div>
                ${item.couponClause ? '<div class="coupon-mini-clause"></div>' : ''}
            `;
        miniCard.querySelector('.coupon-mini-title').textContent = item.couponTitle;
        if (item.couponClause) {
            miniCard.querySelector('.coupon-mini-clause').textContent = item.couponClause;
        }
        modalBody.appendChild(miniCard);
    }

    const couponBox = document.createElement('div');
    couponBox.className = 'coupon-launch-box';
    if (item.theme === 'pine') {
        couponBox.style.background = 'linear-gradient(145deg, #1E352B 0%, #15271F 100%)';
        couponBox.style.boxShadow = '0 14px 30px -8px rgba(30, 53, 43, 0.28)';
    }
    couponBox.innerHTML = `
            <div class="quiz-launch-content">
                <h3 class="quiz-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>${hasWon ? '✂️ Revoir mon bon cadeau' : '✂️ Découper mon bon cadeau'}</span>
                </div>
            </div>
        `;
    couponBox.addEventListener('click', () => {
        launchFullscreenCoupon(item);
    });
    modalBody.appendChild(couponBox);
}

function renderSpotifyModalContent(item) {
    const noteLink = document.createElement('a');
    noteLink.className = 'secret-music-note';
    noteLink.href = item.spotifyWebUrl || DEFAULT_SPOTIFY_WEB_URL;
    noteLink.target = '_blank';
    noteLink.rel = 'noopener noreferrer';
    noteLink.innerHTML = `
            <div class="secret-music-seal" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.3 9.2L21.5 11.5L14.3 13.8L12 21L9.7 13.8L2.5 11.5L9.7 9.2L12 2Z" fill="#E8D5B5"/>
                </svg>
            </div>
            <span class="secret-music-kicker">${item.secretKicker || 'Petit mot secret'}</span>
            <span class="secret-music-title">${item.secretLabel || 'Clique sur moi, surprise'}</span>
        `;

    noteLink.addEventListener('click', (e) => {
        markGameWon(item.day);

        saveAndSyncQuizAnswer(
            `spotify_jour_${item.day}`,
            `Surprise musicale (Jour ${item.day})`,
            `A cliqué sur « ${item.secretLabel || 'Clique sur moi, surprise'} » (Just the Two of Us)`,
            `Surprise Jour ${item.day}`
        );

        // Sur téléphone (iPhone / Android), ouvre directement l'application Spotify sur la musique
        const isMobile = MOBILE_USER_AGENT_REGEX.test(navigator.userAgent || '');
        if (isMobile && item.spotifyUri) {
            e.preventDefault();
            window.location.href = item.spotifyUri;
            setTimeout(() => {
                if (!document.hidden) {
                    window.location.href = item.spotifyWebUrl;
                }
            }, SPOTIFY_FALLBACK_DELAY_MS);
        }
    });

    modalBody.appendChild(noteLink);
}

function renderScratchCardModalContent(item) {
    const cards = getNormalizedScratchCards(item, 'Carte à gratter');
    let anyScratched = false;

    // Affiche les cartes déjà grattées dans la modale
    cards.forEach((card, idx) => {
        if (isCardScratched(card.id)) {
            anyScratched = true;
            const wonWrap = document.createElement('div');
            wonWrap.style.marginBottom = '18px';
            wonWrap.innerHTML = `
                    <div class="fs-quiz-photo-frame" style="margin: 4px 0 8px;">
                        <img src="${card.imageSrc}" alt="Souvenir découvert ${idx + 1}" class="fs-quiz-photo" style="max-height: 290px; width: 100%; object-fit: cover;" />
                    </div>
                    ${card.caption ? `<div style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">${card.caption}</div>` : ''}
                `;
            modalBody.appendChild(wonWrap);
        }
    });

    cards.forEach((card, idx) => {
        const cardScratched = isCardScratched(card.id);
        const scratchBox = document.createElement('div');
        scratchBox.className = 'scratch-launch-box';
        scratchBox.innerHTML = `
                <div class="quiz-launch-content">
                    <span class="quiz-launch-tag">${cards.length > 1 ? `Ticket ${idx + 1} sur ${cards.length}` : item.gameSubtitle}</span>
                    <h3 class="quiz-launch-title">${cards.length > 1 ? `${card.label} à Gratter` : item.gameTitle}</h3>
                    <div class="game-launch-cta">
                        <span>${cardScratched ? `🪙 Regratter la ${card.label.toLowerCase()}` : `🪙 Gratter la ${card.label.toLowerCase()} en plein écran`}</span>
                    </div>
                </div>
            `;
        scratchBox.addEventListener('click', () => {
            launchFullscreenScratchCard(item, idx);
        });
        modalBody.appendChild(scratchBox);
    });

    if (anyScratched) {
        const closeBtnBottom = document.createElement('button');
        closeBtnBottom.type = 'button';
        closeBtnBottom.className = 'btn-sober';
        closeBtnBottom.style.marginTop = '16px';
        closeBtnBottom.textContent = 'Fermer';
        closeBtnBottom.addEventListener('click', closeModal);
        modalBody.appendChild(closeBtnBottom);
    }
}

function renderMidnightSwimModalContent(item, hasWon) {
    const launchBox = document.createElement('div');
    launchBox.className = 'midnight-launch-box';
    launchBox.innerHTML = `
            <div class="midnight-launch-glow"></div>
            <div class="game-launch-content">
                <span class="game-launch-tag">${item.gameSubtitle}</span>
                <h3 class="game-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>${hasWon ? '✨ Retourner au bain de minuit' : '🌌 Plonger dans la nuit étoilée'}</span>
                </div>
            </div>
        `;
    launchBox.addEventListener('click', () => {
        launchFullscreenMidnightSwim(item);
    });
    modalBody.appendChild(launchBox);
}

function renderLuckyWheelModalContent(item) {
    const wheelBox = document.createElement('div');
    wheelBox.className = 'wheel-launch-box';
    wheelBox.innerHTML = `
            <div class="game-launch-content">
                ${item.gameSubtitle ? `<span class="game-launch-tag">${item.gameSubtitle}</span>` : ''}
                <h3 class="game-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>✨ Faire tourner la roue</span>
                </div>
            </div>
        `;
    wheelBox.addEventListener('click', () => {
        closeModal();
        launchFullscreenLuckyWheel(item);
    });
    modalBody.appendChild(wheelBox);
}

function renderMuseumGalleryModalContent(item, hasWon) {
    const launchBox = document.createElement('div');
    launchBox.className = 'museum-launch-box';
    launchBox.innerHTML = `
            <div class="museum-launch-arch" aria-hidden="true"></div>
            <div class="game-launch-content">
                <span class="game-launch-tag">${item.gameSubtitle}</span>
                <h3 class="game-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>${hasWon ? '↺ Retourner dans la galerie' : '▶ Entrer dans le Muséum'}</span>
                </div>
            </div>
        `;
    launchBox.addEventListener('click', () => {
        closeModal();
        launchFullscreenMuseumGame(item);
    });
    modalBody.appendChild(launchBox);
}

/* Ouvre la modale du jour avec la petite box cliquable pour le jeu, le quiz ou le coupon */
export function openModal(item) {
    modalDay.textContent = UI_TEXTS.MODAL_DAY_TITLE(item.day);
    modalBody.innerHTML = '';

    const hasWon = hasWonGame(item.day);

    if (item.game === 'ferret') {
        renderFerretModalContent(item, hasWon);
    } else if (item.game === 'quiz_ete') {
        renderQuizModalContent(item, hasWon);
    } else if (item.game === 'coupon') {
        renderCouponModalContent(item, hasWon);
    } else if (item.game === 'spotify_link') {
        renderSpotifyModalContent(item);
    } else if (item.game === 'scratch_card') {
        renderScratchCardModalContent(item);
    } else if (item.game === 'midnight_swim') {
        renderMidnightSwimModalContent(item, hasWon);
    } else if (item.game === 'lucky_wheel') {
        renderLuckyWheelModalContent(item);
    } else if (item.game === 'museum_gallery') {
        renderMuseumGalleryModalContent(item, hasWon);
    } else {
        modalBody.innerHTML = `<div>${item.content}</div>`;
    }

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        modalBody.scrollTop = 0;
    });
}

export function initModalAndEscapeListeners() {
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (fsScratchOverlay && fsScratchOverlay.classList.contains('active')) {
                closeFullscreenScratchCard();
            } else if (fsCouponOverlay && fsCouponOverlay.classList.contains('active')) {
                closeFullscreenCoupon();
            } else if (fsQuizOverlay && fsQuizOverlay.classList.contains('active')) {
                closeFullscreenQuiz();
            } else if (fsOverlay.classList.contains('active')) {
                closeFullscreenGame();
            } else if (modalOverlay.classList.contains('active')) {
                closeModal();
            }
        }
    });
}
