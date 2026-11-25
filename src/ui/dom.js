/**
 * ============================================================================
 * RÉFÉRENCES CENTRALISÉES AUX ÉLÉMENTS DU DOM
 * ============================================================================
 */

// Grille principale & Modale du jour
export const gridEl = document.getElementById('calendar-grid');
export const modalOverlay = document.getElementById('modal-overlay');
export const modalClose = document.getElementById('modal-close');
export const modalDay = document.getElementById('modal-day');
export const modalBody = document.getElementById('modal-body');
export const toastEl = document.getElementById('toast');
export const footerEl = document.querySelector('.app-footer');

// Éléments Écran d'accès (Gate)
export const gateOverlay = document.getElementById('gate-overlay');
export const gateCard = document.getElementById('gate-card');
export const gateQuestionEl = document.getElementById('gate-question');
export const gateForm = document.getElementById('gate-form');
export const gateInput = document.getElementById('gate-input');
export const gateError = document.getElementById('gate-error');

// Éléments Plein Écran (Jeu Dune Cap Ferret & Bain de Minuit)
export const fsOverlay = document.getElementById('fs-game-overlay');
export const fsCloseBtn = document.getElementById('fs-close-btn');
export const fsStatTitle = document.getElementById('fs-stat-title');
export const fsAltText = document.getElementById('fs-alt-text');
export const fsAltBar = document.getElementById('fs-alt-bar');
export const fsTimer = document.getElementById('fs-timer');
export const fsHint = document.getElementById('fs-hint');
export const fsEndCard = document.getElementById('fs-end-card');
export const fsEndBadge = document.getElementById('fs-end-badge');
export const fsEndTitle = document.getElementById('fs-end-title');
export const fsEndDesc = document.getElementById('fs-end-desc');
export const fsEndBtn = document.getElementById('fs-end-btn');
export const ferretCanvas = document.getElementById('ferret-canvas');

// Éléments Plein Écran (Quiz « Tu te souviens de notre été ? »)
export const fsQuizOverlay = document.getElementById('fs-quiz-overlay');
export const fsQuizCloseBtn = document.getElementById('fs-quiz-close-btn');
export const fsQuizStepLabel = document.getElementById('fs-quiz-step-label');
export const fsQuizDots = document.getElementById('fs-quiz-dots');
export const fsQuizCard = document.getElementById('fs-quiz-card');
export const fsQuizKicker = document.getElementById('fs-quiz-kicker');
export const fsQuizQuestion = document.getElementById('fs-quiz-question');
export const fsQuizInteraction = document.getElementById('fs-quiz-interaction');
export const fsQuizFeedback = document.getElementById('fs-quiz-feedback');
export const fsQuizNextBtn = document.getElementById('fs-quiz-next-btn');
export const fsQuizFinalCard = document.getElementById('fs-quiz-final-card');
export const fsQuizFinalMsg = document.getElementById('fs-quiz-final-msg');
export const fsQuizFinishBtn = document.getElementById('fs-quiz-finish-btn');

// Éléments Plein Écran (Tickets / Coupons à découper)
export const fsCouponOverlay = document.getElementById('fs-coupon-overlay');
export const fsCouponCloseBtn = document.getElementById('fs-coupon-close-btn');
export const couponTicket = document.getElementById('coupon-ticket');
export const couponStub = document.getElementById('coupon-stub');
export const couponPerfZone = document.getElementById('coupon-perf-zone');
export const couponCutLine = document.getElementById('coupon-cut-line');
export const couponScissorsHandle = document.getElementById('coupon-scissors-handle');
export const couponMainTitle = document.getElementById('coupon-main-title');
export const couponClause = document.getElementById('coupon-clause');
export const couponSparkles = document.getElementById('coupon-sparkles');

// Éléments Plein Écran (Carte à gratter virtuelle - Jours 6 & 7)
export const fsScratchOverlay = document.getElementById('fs-scratch-overlay');
export const fsScratchCloseBtn = document.getElementById('fs-scratch-close-btn');
export const fsScratchTopLabel = document.getElementById('fs-scratch-top-label');
export const scratchCardTabs = document.getElementById('scratch-card-tabs');
export const scratchSerial = document.getElementById('scratch-serial');
export const scratchHeaderTitle = document.getElementById('scratch-header-title');
export const scratchViewport = document.getElementById('scratch-viewport');
export const scratchUnderImg = document.getElementById('scratch-under-img');
export const scratchFoilCanvas = document.getElementById('scratch-foil-canvas');
export const scratchFxCanvas = document.getElementById('scratch-fx-canvas');
export const scratchPhotoCaption = document.getElementById('scratch-photo-caption');
export const scratchFooterText = document.getElementById('scratch-footer-text');
export const scratchDoneBtn = document.getElementById('scratch-done-btn');

// Éléments Plein Écran (Roue de la Chance - Jour 9)
export const fsWheelOverlay = document.getElementById('fs-wheel-overlay');
export const fsWheelCloseBtn = document.getElementById('fs-wheel-close-btn');
export const wheelCanvas = document.getElementById('wheel-canvas');
export const wheelSpinBtn = document.getElementById('wheel-spin-btn');
export const wheelTurnsCounter = document.getElementById('wheel-turns-counter');
export const wheelSummary = document.getElementById('wheel-summary');
export const wheelRevealOverlay = document.getElementById('wheel-reveal-overlay');
export const wheelRevealParticles = document.getElementById('wheel-reveal-particles');
export const wheelRevealKicker = document.getElementById('wheel-reveal-kicker');
export const wheelRevealTitle = document.getElementById('wheel-reveal-title');
export const wheelRevealSubtext = document.getElementById('wheel-reveal-subtext');
export const wheelRevealBtn = document.getElementById('wheel-reveal-btn');
