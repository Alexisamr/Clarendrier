/**
 * ============================================================================
 * MINI-JEU PLEIN ÉCRAN (CASE 22) : LA GRANDE GALERIE DE L'ÉVOLUTION
 * ============================================================================
 * - Exploration 2D vue de côté en boucle circulaire autour du grand hall central
 * - Parallaxe multi-plans : grande verrière, étages de balcons décoratifs,
 *   cortège d'animaux naturalisés, rayons lumineux & poussière, coursive jouable
 * - Mêmes avatars d'Alexis & Clara (vue de côté) marchant côte à côte
 * - Mini-carte circulaire indiquant la progression sur la boucle et les cartels
 * - Panneaux / cartels consultables configurés dans src/data/museumGameConfig.js
 * - Architecture prête pour un futur objectif et une fin de jeu
 * ============================================================================
 */

import {
    MUSEUM_LOOP_CONFIG,
    MUSEUM_CARTELS,
    MUSEUM_OBJECTIVE_CONFIG,
    MUSEUM_HALL_CARAVAN,
    MUSEUM_LED_CONFIG
} from '../data/museumGameConfig.js';
import {
    createMuseumGameState,
    stepMuseumPlayer,
    findNearestCartel,
    markCartelVisited,
    getLoopProgress,
    evaluateMuseumObjective,
    shortestLoopDelta,
    sampleMuseumLedColor,
    splitTextByScientificNames
} from '../logic/museumGameLogic.js';
import {
    stopActiveGame,
    setActiveGameCleanup,
    markGameWon
} from '../logic/state.js';
import {
    fsOverlay,
    fsTimer,
    fsHint,
    fsEndCard,
    fsEndBadge,
    fsEndTitle,
    fsEndDesc,
    fsEndBtn,
    ferretCanvas
} from './dom.js';
import { closeFullscreenGame } from './ferretGame.js';
import { drawSideAlexis, drawSideClara } from './museumGameAvatars.js';
import {
    buildMuseumLayerCache,
    drawVerriereTrussesAndBirds,
    drawCeilingRainbowLeds,
    drawOppositeDecorativeBalconies,
    drawCentralHallCaravan,
    drawGallerySunbeamsAndDust,
    drawPlayableCoursiveAndCartels,
    drawForegroundCoursiveGirder,
    drawCircularMuseumMinimap
} from './museumGameArtwork.js';

const DUST_PARTICLE_COUNT = 44;
const MINIMAP_CSS_SIZE = 78;

function createDustPool(width, height) {
    const pool = [];
    for (let i = 0; i < DUST_PARTICLE_COUNT; i++) {
        pool.push({
            x: Math.random() * Math.max(width, 1440),
            y: Math.random() * Math.max(height * 0.84, 700),
            r: 0.9 + Math.random() * 1.9,
            parallax: 0.25 + Math.random() * 0.55,
            driftSpeed: 0.45 + Math.random() * 0.8,
            fallSpeed: 3.5 + Math.random() * 7.5,
            twinkleSpeed: 1.0 + Math.random() * 2.2,
            phase: Math.random() * Math.PI * 2,
            baseAlpha: 0.22 + Math.random() * 0.48
        });
    }
    return pool;
}

export function launchFullscreenMuseumGame(item) {
    stopActiveGame();

    fsOverlay.classList.add('active');
    fsOverlay.setAttribute('aria-hidden', 'false');
    fsEndCard.classList.remove('visible');

    // Masque les éléments HUD des autres jeux (Dune) et laisse la croix de fermeture active
    const fsStatsEl = document.querySelector('.fs-stats');
    if (fsStatsEl) fsStatsEl.style.display = 'none';
    if (fsTimer) fsTimer.style.display = 'none';
    if (fsHint) {
        fsHint.textContent = '';
        fsHint.style.opacity = '0';
    }

    const canvas = ferretCanvas;
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let layerCache = null;

    // Création de la couche HUD légère spécifique au Muséum
    const museumUi = document.createElement('div');
    museumUi.className = 'museum-game-ui';
    museumUi.innerHTML = `
        <div class="museum-minimap-cluster" aria-label="Mini-carte de la Grande Galerie">
            <canvas class="museum-minimap-canvas" width="156" height="156" aria-hidden="true"></canvas>
            <div class="museum-minimap-meta">
                <span class="museum-wing-label" data-role="wing-label">Aile Nord</span>
                <span class="museum-meta-sep" aria-hidden="true">·</span>
                <span class="museum-cartel-count" data-role="cartel-count">0 / ${MUSEUM_CARTELS.length}</span>
            </div>
        </div>

        <div class="museum-bottom-controls">
            <button type="button" class="museum-nav-btn" data-dir="-1" aria-label="Marcher vers la gauche">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
            </button>

            <button type="button" class="museum-interact-btn" data-role="interact-btn" hidden aria-label="Lire">
                <span class="museum-interact-label" data-role="interact-label">Lire</span>
            </button>

            <button type="button" class="museum-nav-btn" data-dir="1" aria-label="Marcher vers la droite">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
        </div>

        <p class="museum-control-hint" data-role="control-hint">
            Maintiens gauche ou droite pour avancer · Approche-toi d'une plaque pour la lire
        </p>

        <div class="museum-cartel-backdrop" data-role="cartel-backdrop" hidden>
            <div class="museum-cartel-card" role="dialog" aria-modal="true" aria-labelledby="museum-cartel-title">
                <div class="museum-cartel-header">
                    <span class="museum-cartel-number" data-role="cartel-number">N° 01</span>
                    <button type="button" class="museum-cartel-close" data-role="cartel-close" aria-label="Fermer">&times;</button>
                </div>
                <div class="museum-cartel-scroll" data-role="cartel-scroll">
                    <h3 class="museum-cartel-title" id="museum-cartel-title" data-role="cartel-title"></h3>
                    <div class="museum-cartel-divider" aria-hidden="true"></div>
                    <div class="museum-cartel-body" data-role="cartel-body"></div>
                </div>
            </div>
        </div>
    `;
    fsOverlay.appendChild(museumUi);

    const minimapCanvas = museumUi.querySelector('.museum-minimap-canvas');
    const minimapCtx = minimapCanvas.getContext('2d');
    const wingLabelEl = museumUi.querySelector('[data-role="wing-label"]');
    const cartelCountEl = museumUi.querySelector('[data-role="cartel-count"]');
    const interactBtn = museumUi.querySelector('[data-role="interact-btn"]');
    const interactLabelEl = museumUi.querySelector('[data-role="interact-label"]');
    const controlHintEl = museumUi.querySelector('[data-role="control-hint"]');
    const navLeftBtn = museumUi.querySelector('[data-dir="-1"]');
    const navRightBtn = museumUi.querySelector('[data-dir="1"]');

    const cartelBackdrop = museumUi.querySelector('[data-role="cartel-backdrop"]');
    const cartelCloseBtn = museumUi.querySelector('[data-role="cartel-close"]');
    const cartelScrollEl = museumUi.querySelector('[data-role="cartel-scroll"]');
    const cartelNumEl = museumUi.querySelector('[data-role="cartel-number"]');
    const cartelTitleEl = museumUi.querySelector('[data-role="cartel-title"]');
    const cartelBodyEl = museumUi.querySelector('[data-role="cartel-body"]');

    let state = createMuseumGameState(MUSEUM_LOOP_CONFIG);
    let dustPool = createDustPool(width, height);
    let currentScreenCartels = [];
    let nearestCartel = null;
    let hasMovedOnce = false;
    let isRunning = true;
    let animId = null;
    let elapsed = 0;
    let lastTime = performance.now();

    // Entrées unifiées (clavier + boutons tactiles + maintien direct sur le canvas)
    const keys = { left: false, right: false };
    let buttonDir = 0;
    let canvasHoldDir = 0;
    let canvasPointerId = null;
    let pointerDownPos = null;
    let lastMinimapWing = '';
    let lastVisitedCount = -1;
    let lastNearCartelId = null;
    let lastMinimapPos = -9999;
    let lastMinimapVisited = -1;

    function resizeCanvases() {
        width = window.innerWidth;
        height = window.innerHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 1.5);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        layerCache = buildMuseumLayerCache(width, height, dpr, ctx);

        const mmScale = Math.min(window.devicePixelRatio || 1, 2);
        minimapCanvas.width = Math.round(MINIMAP_CSS_SIZE * mmScale);
        minimapCanvas.height = Math.round(MINIMAP_CSS_SIZE * mmScale);
        minimapCtx.setTransform(mmScale, 0, 0, mmScale, 0, 0);
        lastMinimapPos = -9999;
    }
    resizeCanvases();

    function clearHeldInputs() {
        keys.left = false;
        keys.right = false;
        buttonDir = 0;
        canvasHoldDir = 0;
        canvasPointerId = null;
        pointerDownPos = null;
        navLeftBtn.classList.remove('is-pressed');
        navRightBtn.classList.remove('is-pressed');
    }

    let lastDataSyncKey = '';

    function syncDataAttributes() {
        const progress = getLoopProgress(state.playerPos, MUSEUM_LOOP_CONFIG.LOOP_LENGTH);
        const posStr = String(Math.round(state.playerPos));
        const wingStr = progress.wingId;
        const visitedStr = String(state.visitedCartelIds.length);
        const lapsStr = String(state.lapsCompleted);
        const nearStr = nearestCartel ? nearestCartel.cartel.id : '';
        const openStr = state.activeCartelId || '';
        const syncKey = `${posStr}|${wingStr}|${visitedStr}|${lapsStr}|${nearStr}|${openStr}`;
        if (syncKey === lastDataSyncKey) return;
        lastDataSyncKey = syncKey;

        fsOverlay.dataset.museumActive = 'true';
        fsOverlay.dataset.museumPos = posStr;
        fsOverlay.dataset.museumWing = wingStr;
        fsOverlay.dataset.museumVisited = visitedStr;
        fsOverlay.dataset.museumLaps = lapsStr;
        fsOverlay.dataset.museumNearCartel = nearStr;
        fsOverlay.dataset.museumOpenCartel = openStr;
    }

    function renderFormattedCartelText(targetEl, text, scientificNames) {
        targetEl.textContent = '';
        const segments = splitTextByScientificNames(text, scientificNames);
        segments.forEach((seg) => {
            if (seg.italic) {
                const em = document.createElement('em');
                em.className = 'museum-scientific-name';
                em.textContent = seg.text;
                targetEl.appendChild(em);
            } else {
                targetEl.appendChild(document.createTextNode(seg.text));
            }
        });
    }

    function renderFormattedCartelBody(targetEl, text, scientificNames) {
        targetEl.textContent = '';
        const paragraphs = String(text || '').split(/\n{2,}/).filter(Boolean);
        paragraphs.forEach((paraText) => {
            const p = document.createElement('p');
            renderFormattedCartelText(p, paraText, scientificNames);
            targetEl.appendChild(p);
        });
    }

    function openCartelModal(cartel) {
        if (!cartel) return;
        clearHeldInputs();

        state = {
            ...state,
            activeCartelId: cartel.id,
            visitedCartelIds: markCartelVisited(state.visitedCartelIds, cartel.id)
        };

        cartelNumEl.textContent = `N° ${cartel.number}`;
        renderFormattedCartelText(cartelTitleEl, cartel.title, cartel.scientificNames);
        renderFormattedCartelBody(cartelBodyEl, cartel.body, cartel.scientificNames);

        cartelBackdrop.hidden = false;
        if (cartelScrollEl) cartelScrollEl.scrollTop = 0;
        interactBtn.hidden = true;
        if (controlHintEl) controlHintEl.classList.add('is-hidden');

        syncDataAttributes();
        cartelCloseBtn.focus();
    }

    function closeCartelModal() {
        if (!state.activeCartelId) return;
        state = {
            ...state,
            activeCartelId: null
        };
        cartelBackdrop.hidden = true;

        // Évaluation prête pour un futur objectif / fin de jeu
        const evaluation = evaluateMuseumObjective(
            state.visitedCartelIds,
            state.lapsCompleted,
            MUSEUM_CARTELS,
            MUSEUM_OBJECTIVE_CONFIG
        );
        if (evaluation.isComplete && !state.objectiveCompleted) {
            state = { ...state, objectiveCompleted: true };
            if (item && item.day) markGameWon(item.day);
            showFutureObjectiveEndCard();
        }

        syncDataAttributes();
    }

    function showFutureObjectiveEndCard() {
        if (!fsEndCard) return;
        fsEndBadge.style.display = 'inline-block';
        fsEndBadge.textContent = MUSEUM_OBJECTIVE_CONFIG.completionBadge;
        fsEndTitle.textContent = MUSEUM_OBJECTIVE_CONFIG.completionTitle;
        fsEndDesc.textContent = MUSEUM_OBJECTIVE_CONFIG.completionMessage;
        fsEndBtn.textContent = MUSEUM_OBJECTIVE_CONFIG.completionButtonLabel;
        fsEndBtn.onclick = () => {
            fsEndCard.classList.remove('visible');
        };
        fsEndCard.classList.add('visible');
    }

    function getActiveMoveDirection() {
        if (state.activeCartelId) return 0;
        if (keys.left && !keys.right) return -1;
        if (keys.right && !keys.left) return 1;
        if (buttonDir !== 0) return buttonDir;
        if (canvasHoldDir !== 0) return canvasHoldDir;
        return 0;
    }

    // --- Écouteurs Clavier ---
    const onKeyDown = (e) => {
        if (!isRunning) return;

        if (e.key === 'Escape' && state.activeCartelId) {
            e.preventDefault();
            e.stopImmediatePropagation();
            closeCartelModal();
            return;
        }

        if (state.activeCartelId) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
                e.preventDefault();
                closeCartelModal();
            }
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'q' || e.key === 'Q') {
            keys.left = true;
            hasMovedOnce = true;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = true;
            hasMovedOnce = true;
        } else if ((e.key === 'e' || e.key === 'E' || e.key === 'Enter' || e.key === ' ') && nearestCartel) {
            e.preventDefault();
            openCartelModal(nearestCartel.cartel);
        }
    };

    const onKeyUp = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'q' || e.key === 'Q') {
            keys.left = false;
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            keys.right = false;
        }
    };

    // --- Écouteurs Boutons Tactiles Gauche / Droite ---
    function bindNavButton(btn, dir) {
        const start = (e) => {
            if (state.activeCartelId) return;
            e.preventDefault();
            buttonDir = dir;
            hasMovedOnce = true;
            btn.classList.add('is-pressed');
        };
        const stop = () => {
            if (buttonDir === dir) buttonDir = 0;
            btn.classList.remove('is-pressed');
        };
        btn.addEventListener('pointerdown', start);
        btn.addEventListener('pointerup', stop);
        btn.addEventListener('pointercancel', stop);
        btn.addEventListener('pointerleave', stop);
        return () => {
            btn.removeEventListener('pointerdown', start);
            btn.removeEventListener('pointerup', stop);
            btn.removeEventListener('pointercancel', stop);
            btn.removeEventListener('pointerleave', stop);
        };
    }
    const unbindLeftBtn = bindNavButton(navLeftBtn, -1);
    const unbindRightBtn = bindNavButton(navRightBtn, 1);

    // --- Écouteurs Tactile / Souris directs sur le Canvas ---
    const onCanvasPointerDown = (e) => {
        if (!isRunning || state.activeCartelId) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Si le joueur tape directement sur un cartel proche visible, on l'ouvre !
        if (nearestCartel) {
            for (let i = 0; i < currentScreenCartels.length; i++) {
                const b = currentScreenCartels[i];
                if (
                    b.id === nearestCartel.cartel.id &&
                    x >= b.x && x <= b.x + b.w &&
                    y >= b.y && y <= b.y + b.h
                ) {
                    openCartelModal(b.cartel);
                    return;
                }
            }
        }

        canvasPointerId = e.pointerId;
        pointerDownPos = { x, y };
        canvasHoldDir = x >= width * 0.5 ? 1 : -1;
        hasMovedOnce = true;
    };

    const onCanvasPointerMove = (e) => {
        if (canvasPointerId === null || e.pointerId !== canvasPointerId || state.activeCartelId) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (pointerDownPos && Math.abs(x - width * 0.5) > 22) {
            canvasHoldDir = x >= width * 0.5 ? 1 : -1;
        }
    };

    const onCanvasPointerUp = (e) => {
        if (canvasPointerId !== null && e.pointerId === canvasPointerId) {
            canvasPointerId = null;
            canvasHoldDir = 0;
            pointerDownPos = null;
        }
    };

    const onInteractClick = () => {
        if (nearestCartel && !state.activeCartelId) {
            interactBtn.blur();
            openCartelModal(nearestCartel.cartel);
        }
    };

    const onBackdropClick = (e) => {
        if (e.target === cartelBackdrop) {
            closeCartelModal();
        }
    };

    const onBlurOrHide = () => {
        clearHeldInputs();
    };

    interactBtn.addEventListener('click', onInteractClick);
    cartelCloseBtn.addEventListener('click', closeCartelModal);
    cartelBackdrop.addEventListener('click', onBackdropClick);
    canvas.addEventListener('pointerdown', onCanvasPointerDown);
    window.addEventListener('pointermove', onCanvasPointerMove);
    window.addEventListener('pointerup', onCanvasPointerUp);
    window.addEventListener('pointercancel', onCanvasPointerUp);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', resizeCanvases);
    window.addEventListener('blur', onBlurOrHide);
    document.addEventListener('visibilitychange', onBlurOrHide);

    function updateHudDom() {
        const progress = getLoopProgress(state.playerPos, MUSEUM_LOOP_CONFIG.LOOP_LENGTH);

        if (progress.wingLabel !== lastMinimapWing) {
            lastMinimapWing = progress.wingLabel;
            wingLabelEl.textContent = progress.wingLabel;
        }

        const visitedCount = state.visitedCartelIds.length;
        if (visitedCount !== lastVisitedCount) {
            lastVisitedCount = visitedCount;
            cartelCountEl.textContent = `${visitedCount} / ${MUSEUM_CARTELS.length}`;
        }

        const nearId = nearestCartel && !state.activeCartelId ? nearestCartel.cartel.id : null;
        if (nearId !== lastNearCartelId) {
            lastNearCartelId = nearId;
            if (nearId && nearestCartel) {
                interactLabelEl.textContent = 'Lire';
                interactBtn.setAttribute('aria-label', 'Lire');
                interactBtn.hidden = false;
            } else {
                interactBtn.hidden = true;
            }
        }

        if (hasMovedOnce && controlHintEl && !controlHintEl.classList.contains('is-hidden')) {
            controlHintEl.classList.add('is-hidden');
        }
    }

    function renderFrame(now) {
        if (!isRunning) return;

        const rawDt = (now - lastTime) / 1000;
        const dt = Math.min(Math.max(rawDt, 0), 0.05);
        lastTime = now;
        elapsed += dt;

        // 1. Mise à jour simulation (boucle circulaire + Alexis qui suit Clara)
        const moveDir = getActiveMoveDirection();
        state = stepMuseumPlayer(state, moveDir, dt, MUSEUM_LOOP_CONFIG);
        nearestCartel = findNearestCartel(
            state.playerPos,
            MUSEUM_CARTELS,
            MUSEUM_LOOP_CONFIG.LOOP_LENGTH,
            MUSEUM_LOOP_CONFIG.INTERACT_RADIUS
        );

        const layout = layerCache.layout;
        const cameraX = state.totalDistanceSigned;
        const loopLength = MUSEUM_LOOP_CONFIG.LOOP_LENGTH;
        const ledColor = sampleMuseumLedColor(elapsed, MUSEUM_LED_CONFIG);

        // 2. Fond statique pré-rendu (verrière dorée + mur profond + sol du hall central)
        ctx.drawImage(layerCache.backdrop.canvas, 0, 0, width, height);

        // 2B. Lumière des LEDs cachées diffusée à travers le verre de la verrière (fondu 17s + 4.5s)
        drawCeilingRainbowLeds(ctx, width, height, cameraX, elapsed, ledColor, layerCache);

        // 3. Structure vitrée de la verrière, arches en fer & oiseaux en hauteur (parallaxe 0.16x)
        drawVerriereTrussesAndBirds(ctx, width, height, cameraX, elapsed, layerCache);

        // 4. Balcons & coursives en fer ouvragé décoratifs en face (parallaxe 0.30x)
        drawOppositeDecorativeBalconies(ctx, width, cameraX, layerCache);

        // 5. Grand hall central avec le cortège d'animaux naturalisés (parallaxe 0.44x & 0.58x)
        drawCentralHallCaravan(ctx, width, height, cameraX, loopLength, MUSEUM_HALL_CARAVAN, layerCache);

        // 6. Rayons de lumière chaude tamisée (+ léger reflet LED) & poussières flottantes
        drawGallerySunbeamsAndDust(ctx, width, height, cameraX, elapsed, dustPool, layerCache, ledColor);

        // 7. Coursive jouable (1.0x) : balustrade, colonnes, parquet & cartels consultables
        currentScreenCartels = drawPlayableCoursiveAndCartels(
            ctx,
            width,
            height,
            cameraX,
            state.playerPos,
            loopLength,
            elapsed,
            MUSEUM_CARTELS,
            state.visitedCartelIds,
            nearestCartel ? nearestCartel.cartel.id : null,
            layerCache
        );

        // 8. Avatars d'Alexis & Clara côte à côte sur la coursive (vue de côté)
        const claraScreenX = width * 0.5;
        const compDelta = shortestLoopDelta(state.playerPos, state.companionPos, loopLength);
        const alexisScreenX = claraScreenX + compDelta;
        const hairSway = Math.sin(state.walkCycle * 0.7) * (state.isWalking ? 2.2 : 0.6);

        drawSideAlexis(
            ctx,
            alexisScreenX,
            layout.walkwayFloorY - 4,
            layout.avatarScale,
            state.companionWalkCycle,
            state.companionIsWalking,
            state.companionFacing
        );

        drawSideClara(
            ctx,
            claraScreenX,
            layout.walkwayFloorY + 2,
            layout.avatarScale,
            state.walkCycle,
            state.isWalking,
            state.facing,
            hairSway
        );

        // 9. Poutrelle premier plan (parallaxe 1.18x)
        drawForegroundCoursiveGirder(ctx, width, cameraX, layerCache);

        // 10. Mini-carte circulaire (redessinée uniquement quand la position ou les visites changent)
        if (
            Math.abs(state.playerPos - lastMinimapPos) > 0.8 ||
            state.visitedCartelIds.length !== lastMinimapVisited
        ) {
            lastMinimapPos = state.playerPos;
            lastMinimapVisited = state.visitedCartelIds.length;
            drawCircularMuseumMinimap(
                minimapCtx,
                MINIMAP_CSS_SIZE,
                state,
                MUSEUM_CARTELS,
                loopLength
            );
        }
        updateHudDom();
        syncDataAttributes();

        animId = requestAnimationFrame(renderFrame);
    }

    syncDataAttributes();
    animId = requestAnimationFrame(renderFrame);

    // Nettoyage complet garanti à la fermeture du jeu (croix ou Escape)
    setActiveGameCleanup(() => {
        isRunning = false;
        if (animId) cancelAnimationFrame(animId);
        clearHeldInputs();

        unbindLeftBtn();
        unbindRightBtn();
        interactBtn.removeEventListener('click', onInteractClick);
        cartelCloseBtn.removeEventListener('click', closeCartelModal);
        cartelBackdrop.removeEventListener('click', onBackdropClick);
        canvas.removeEventListener('pointerdown', onCanvasPointerDown);
        window.removeEventListener('pointermove', onCanvasPointerMove);
        window.removeEventListener('pointerup', onCanvasPointerUp);
        window.removeEventListener('pointercancel', onCanvasPointerUp);
        window.removeEventListener('keydown', onKeyDown, true);
        window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', resizeCanvases);
        window.removeEventListener('blur', onBlurOrHide);
        document.removeEventListener('visibilitychange', onBlurOrHide);

        if (museumUi.parentNode) {
            museumUi.parentNode.removeChild(museumUi);
        }

        delete fsOverlay.dataset.museumActive;
        delete fsOverlay.dataset.museumPos;
        delete fsOverlay.dataset.museumWing;
        delete fsOverlay.dataset.museumVisited;
        delete fsOverlay.dataset.museumLaps;
        delete fsOverlay.dataset.museumNearCartel;
        delete fsOverlay.dataset.museumOpenCartel;
    });
}

export { closeFullscreenGame };
