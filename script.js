/**
 * ============================================================================
 * POINT D'ENTRÉE PRINCIPAL — CLARENDRIER
 * ============================================================================
 * Architecture modulaire :
 *  - src/data/calendarData.js : Toutes les données modifiables (cases, textes, dates, images)
 *  - src/logic/state.js       : Logique de déverrouillage, localStorage & synchronisation cloud
 *  - src/utils/helpers.js     : Fonctions utilitaires pures (maths, couleurs, audio, texte)
 *  - src/ui/*                 : Rendu de l'interface, modales et mini-jeux plein écran
 * ============================================================================
 */

import { initGate } from './src/ui/gate.js';
import { renderGrid } from './src/ui/calendarGrid.js';
import { initHangingBaublesPhysics } from './src/ui/hangingBaubles.js';
import { initModalAndEscapeListeners } from './src/ui/modal.js';
import { initSecretFooterTrigger } from './src/ui/secretNotebook.js';
import { initQuizListeners } from './src/ui/quiz.js';
import { initCouponListeners } from './src/ui/coupon.js';
import { initScratchCardListeners } from './src/ui/scratchCard.js';
import { initFullscreenGameListeners } from './src/ui/ferretGame.js';
import { initLuckyWheelListeners } from './src/ui/luckyWheel.js';

initQuizListeners();
initCouponListeners();
initScratchCardListeners();
initFullscreenGameListeners();
initLuckyWheelListeners();
initModalAndEscapeListeners();
initSecretFooterTrigger();

initGate();
renderGrid();
initHangingBaublesPhysics();