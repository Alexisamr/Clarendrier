/**
 * ============================================================================
 * PHYSIQUE GRAVITAIRE DES BOULES DE NOËL SUSPENDUES (PENDULE + ÉLASTICITÉ)
 * - Réagit à la vitesse de défilement (scroll lent = léger balancement,
 *   scroll brusque = grande oscillation + rebond sur le fil doré)
 * - Fonctionne aussi au glissement tactile (même en haut/bas de page)
 *   et à l'inclinaison du téléphone
 * ============================================================================
 */

import { clamp } from '../utils/helpers.js';

const PENDULUM_CONFIGS = [
    {
        id: 'pendulum-left-main',
        pivotX: 26,
        baseThreadY: 66,
        length: 85,
        damping: 2.7,
        eccentricity: 1.0,
        bounceScale: 1.0,
        phase: 0.2
    },
    {
        id: 'pendulum-left-star',
        pivotX: 56,
        baseThreadY: 42,
        length: 51,
        damping: 3.0,
        eccentricity: -1.15,
        bounceScale: 0.7,
        phase: 1.9
    },
    {
        id: 'pendulum-right-drop',
        pivotX: 22,
        baseThreadY: 48,
        length: 61,
        damping: 2.9,
        eccentricity: 1.1,
        bounceScale: 0.75,
        phase: 3.4
    },
    {
        id: 'pendulum-right-main',
        pivotX: 50,
        baseThreadY: 76,
        length: 94,
        damping: 2.6,
        eccentricity: -1.0,
        bounceScale: 1.0,
        phase: 4.8
    }
];

const GRAVITY = 900;        // constante de gravité (px/s²)
const SPRING_K = 180;       // raideur élastique du fil doré
const SPRING_DAMP = 9.5;    // amortissement du rebond vertical
const MAX_ANGLE = 0.29;     // ~16.5° max
const MAX_OMEGA = 3.2;      // vitesse angulaire max
const MAX_VEL_Y = 65;       // vitesse verticale max sur le fil
const MIN_BOUNCE_Y = -3.2;
const MAX_BOUNCE_Y = 4.5;
const RECENT_SCROLL_WINDOW_MS = 28;

export function initHangingBaublesPhysics() {
    const pendulums = [];

    PENDULUM_CONFIGS.forEach((cfg) => {
        const groupEl = document.getElementById(cfg.id);
        if (!groupEl) return;
        const threadEl = groupEl.querySelector('.bauble-thread');
        const bobEl = groupEl.querySelector('.bauble-bob');
        groupEl.style.transformOrigin = `${cfg.pivotX}px 0px`;

        pendulums.push({
            ...cfg,
            groupEl,
            threadEl,
            bobEl,
            angle: 0,       // angle en radians
            omega: 0,       // vitesse angulaire (rad/s)
            bounceY: 0,     // élongation verticale du fil (px)
            velY: 0         // vitesse verticale sur le fil (px/s)
        });
    });

    if (!pendulums.length) return;

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let lastScrollEventTime = 0;
    let tiltTargetAngle = 0; // inclinaison réelle du téléphone (si dispo)

    // Applique une impulsion proportionnelle mais mesurée à la vitesse du mouvement
    function applyWindowImpulse(dy, dx = 0) {
        const absDy = Math.abs(dy);
        const absDx = Math.abs(dx);
        if (absDy < 0.5 && absDx < 0.5) return;

        const nonLinearY = Math.sign(dy) * Math.min(48, Math.pow(absDy, 1.08));

        pendulums.forEach((p) => {
            const swingSign = Math.abs(p.omega) > 0.35
                ? Math.sign(p.omega) * Math.sign(dy || 1)
                : Math.sign(dy || 1) * p.eccentricity;

            // Impulsion angulaire légèrement réduite
            const angularKick = (nonLinearY * 0.011 * swingSign + dx * 0.0075) * (75 / p.length);
            p.omega = clamp(p.omega + angularKick, -MAX_OMEGA, MAX_OMEGA);

            // Impulsion verticale légèrement réduite sur le fil doré
            const verticalKick = -nonLinearY * 0.55 * p.bounceScale;
            p.velY = clamp(p.velY + verticalKick, -MAX_VEL_Y, MAX_VEL_Y);
        });
    }

    // 1. Écoute du scroll natif (inclut l'inertie iOS après avoir lâché le doigt)
    window.addEventListener('scroll', () => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        const dy = currentY - lastScrollY;
        lastScrollY = currentY;
        lastScrollEventTime = performance.now();

        if (Math.abs(dy) > 0.5) {
            applyWindowImpulse(dy, 0);
        }
    }, { passive: true });

    // 2. Écoute du geste tactile sur mobile (pour réagir même en butée haute/basse ou petit écran)
    let lastTouchY = null;
    let lastTouchX = null;

    window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
            lastTouchY = e.touches[0].clientY;
            lastTouchX = e.touches[0].clientX;
        }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (!e.touches || e.touches.length === 0 || lastTouchY === null) return;
        const y = e.touches[0].clientY;
        const x = e.touches[0].clientX;
        const fingerDy = lastTouchY - y;
        const fingerDx = x - lastTouchX;
        lastTouchY = y;
        lastTouchX = x;

        const now = performance.now();
        const scrolledRecently = (now - lastScrollEventTime) < RECENT_SCROLL_WINDOW_MS;

        if (!scrolledRecently) {
            applyWindowImpulse(fingerDy * 0.30, fingerDx * 0.18);
        } else if (Math.abs(fingerDx) > 0.9) {
            applyWindowImpulse(0, fingerDx * 0.15);
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        lastTouchY = null;
        lastTouchX = null;
    }, { passive: true });

    // 3. Support molette / trackpad sur ordinateur (même en butée de page)
    window.addEventListener('wheel', (e) => {
        const now = performance.now();
        if ((now - lastScrollEventTime) > RECENT_SCROLL_WINDOW_MS) {
            applyWindowImpulse(e.deltaY * 0.13, e.deltaX * 0.08);
        }
    }, { passive: true });

    // 4. Support gyroscope / inclinaison du téléphone (si disponible)
    window.addEventListener('deviceorientation', (e) => {
        if (typeof e.gamma === 'number') {
            const clampedGamma = clamp(e.gamma, -25, 25);
            tiltTargetAngle = (clampedGamma * Math.PI) / 180 * 0.16;
        }
    }, { passive: true });

    // Boucle physique 60fps (pendule amorti + ressort vertical)
    let lastFrameTime = performance.now();

    function stepPhysics(now) {
        const dt = clamp((now - lastFrameTime) / 1000, 0.004, 0.035);
        lastFrameTime = now;
        const t = now * 0.001;

        for (let i = 0; i < pendulums.length; i++) {
            const p = pendulums[i];

            // Très léger souffle ambiant au repos
            const ambientAngle = Math.sin(t * 0.95 + p.phase) * 0.007;
            const targetEq = tiltTargetAngle + ambientAngle;

            // Équation du pendule sous gravité : d²θ/dt² = -(g / L) * sin(θ - θ_eq) - damping * ω
            const alpha = -(GRAVITY / p.length) * Math.sin(p.angle - targetEq) - p.damping * p.omega;
            p.omega += alpha * dt;
            p.angle += p.omega * dt;

            // Butées souples si l'angle dépasse la limite maximale
            if (p.angle > MAX_ANGLE) {
                p.angle = MAX_ANGLE;
                p.omega *= -0.35;
            } else if (p.angle < -MAX_ANGLE) {
                p.angle = -MAX_ANGLE;
                p.omega *= -0.35;
            }

            // Force centrifuge douce sur le fil
            const centrifugalPull = Math.min(2, (p.omega * p.omega * p.length) * 0.006);

            // Ressort vertical (rebond sur le fil doré)
            const accY = -SPRING_K * (p.bounceY - centrifugalPull) - SPRING_DAMP * p.velY;
            p.velY += accY * dt;
            p.bounceY = clamp(p.bounceY + p.velY * dt, MIN_BOUNCE_Y, MAX_BOUNCE_Y);

            const deg = (p.angle * 180) / Math.PI;
            p.groupEl.style.transform = `rotate(${deg.toFixed(2)}deg)`;

            if (p.bobEl) {
                p.bobEl.style.transform = `translate3d(0, ${p.bounceY.toFixed(2)}px, 0)`;
            }
            if (p.threadEl) {
                p.threadEl.setAttribute('y2', (p.baseThreadY + p.bounceY).toFixed(2));
            }
        }

        requestAnimationFrame(stepPhysics);
    }

    requestAnimationFrame(stepPhysics);
}
