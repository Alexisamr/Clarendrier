/**
 * Passe DEV_MODE à `false` avant de lui donner le site en décembre.
 */
const DEV_MODE = true;

const STORAGE_KEY = 'advent_opened_days_v1';
const GAMES_WON_KEY = 'advent_games_won_v1';
const GATE_AUTH_KEY = 'advent_gate_auth_v1';

/* =========================================================================
   CONFIGURATION DE LA QUESTION D'ACCÈS (ROTATION & MÉMORISATION)
   - GATE_REMEMBER_HOURS : durée (en heures) pendant laquelle l'appareil est mémorisé (24h = 1 jour)
   - QUESTION_ROTATION_HOURS : durée (en heures) avant de passer à la question suivante
   - GATE_QUESTIONS : liste des questions et réponses acceptées (insensible aux majuscules/accents)
   ========================================================================= */
const GATE_REMEMBER_HOURS = 24;
const QUESTION_ROTATION_HOURS = 24;

const GATE_QUESTIONS = [
    {
        question: "Quelle est ma couleur préférée ?",
        // Mets ici uniquement ta vraie couleur préférée si tu veux restreindre à une seule réponse :
        answers: [
            "bleu", "vert", "noir", "rouge", "blanc", "rose", "violet",
            "jaune", "orange", "gris", "marron", "beige", "bordeaux",
            "marine", "turquoise", "kaki", "corail", "lavande"
        ]
    }
    // Tu peux ajouter d'autres questions ici qui tourneront toutes les X heures :
    // {
    //     question: "Où avons-nous passé notre premier week-end ?",
    //     answers: ["cap ferret", "ferret", "bordeaux"]
    // }
];

const calendarData = Array.from({ length: 24 }, (_, i) => {
    const day = i + 1;

    if (day === 4) {
        return {
            day: 4,
            game: "ferret",
            gameTitle: "L'Ascension de la Dune",
            gameSubtitle: "Défi Cap Ferret",
            content: `Merci pour ces vacances au Cap Ferret ❤️`
        };
    }

    if (day === 20) {
        return {
            day: 20,
            game: null,
            content: `Voici le petit mot ou l'indice pour la journée du 20 décembre.`
        };
    }

    return {
        day: day,
        content: `Voici le petit mot ou l'indice pour la journée du ${day} décembre.`
    };
});

let openedDays = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let gamesWon = JSON.parse(localStorage.getItem(GAMES_WON_KEY)) || [];
let activeGameCleanup = null;

const gridEl = document.getElementById('calendar-grid');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalDay = document.getElementById('modal-day');
const modalBody = document.getElementById('modal-body');
const toastEl = document.getElementById('toast');

// Éléments Écran d'accès (Gate)
const gateOverlay = document.getElementById('gate-overlay');
const gateCard = document.getElementById('gate-card');
const gateQuestionEl = document.getElementById('gate-question');
const gateForm = document.getElementById('gate-form');
const gateInput = document.getElementById('gate-input');
const gateError = document.getElementById('gate-error');

// Éléments Plein Écran
const fsOverlay = document.getElementById('fs-game-overlay');
const fsCloseBtn = document.getElementById('fs-close-btn');
const fsAltText = document.getElementById('fs-alt-text');
const fsAltBar = document.getElementById('fs-alt-bar');
const fsTimer = document.getElementById('fs-timer');
const fsHint = document.getElementById('fs-hint');
const fsEndCard = document.getElementById('fs-end-card');
const fsEndBadge = document.getElementById('fs-end-badge');
const fsEndTitle = document.getElementById('fs-end-title');
const fsEndDesc = document.getElementById('fs-end-desc');
const fsEndBtn = document.getElementById('fs-end-btn');

let toastTimeout;

function normalizeAnswer(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^(le |la |l'|les |un |une )/i, '')
        .trim();
}

function getActiveGateQuestion() {
    if (!GATE_QUESTIONS.length) {
        return { question: "Quelle est ma couleur préférée ?", answers: ["bleu"] };
    }
    const rotationMs = Math.max(1, QUESTION_ROTATION_HOURS) * 3600 * 1000;
    const index = Math.floor(Date.now() / rotationMs) % GATE_QUESTIONS.length;
    return GATE_QUESTIONS[index];
}

function isGateSessionValid() {
    try {
        const raw = localStorage.getItem(GATE_AUTH_KEY);
        if (!raw) return false;
        const data = JSON.parse(raw);
        if (!data || typeof data.unlockedAt !== 'number') return false;
        const rememberMs = Math.max(1, GATE_REMEMBER_HOURS) * 3600 * 1000;
        return (Date.now() - data.unlockedAt) < rememberMs;
    } catch {
        return false;
    }
}

function initGate() {
    if (!gateOverlay || !gateForm) return;

    // Si l'appareil a déjà répondu correctement dans les dernières 24h, on déverrouille directement
    if (isGateSessionValid()) {
        gateOverlay.style.transition = 'none';
        gateOverlay.classList.add('unlocked');
        gateOverlay.setAttribute('aria-hidden', 'true');
        return;
    }

    const activeQ = getActiveGateQuestion();
    gateQuestionEl.textContent = activeQ.question;

    gateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userVal = normalizeAnswer(gateInput.value);
        const isValid = activeQ.answers.some((ans) => normalizeAnswer(ans) === userVal);

        if (isValid) {
            localStorage.setItem(GATE_AUTH_KEY, JSON.stringify({
                unlockedAt: Date.now()
            }));
            gateError.textContent = '';
            gateInput.blur();
            gateOverlay.style.transition = '';
            gateOverlay.classList.add('unlocked');
            gateOverlay.setAttribute('aria-hidden', 'true');
        } else {
            gateError.textContent = 'Mauvaise réponse, réessaie…';
            gateCard.classList.remove('shake');
            void gateCard.offsetWidth;
            gateCard.classList.add('shake');
            gateInput.select();
        }
    });
}

function isDayUnlocked(dayNumber) {
    if (DEV_MODE) return true;
    const now = new Date();
    return now.getMonth() === 11 && now.getDate() >= dayNumber;
}

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.remove('show');
    }, 2200);
}

function stopActiveGame() {
    if (activeGameCleanup) {
        activeGameCleanup();
        activeGameCleanup = null;
    }
}

/* Ouvre la modale du jour avec la petite box cliquable pour le jeu */
function openModal(item) {
    modalDay.textContent = `${item.day} Décembre`;
    modalBody.innerHTML = '';

    const hasWon = gamesWon.includes(item.day);

    if (item.game === 'ferret') {
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
    } else {
        modalBody.innerHTML = `<div>${item.content}</div>`;
    }

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
}

function closeFullscreenGame() {
    stopActiveGame();
    fsOverlay.classList.remove('active');
    fsOverlay.setAttribute('aria-hidden', 'true');
    fsEndCard.classList.remove('visible');
}

fsCloseBtn.addEventListener('click', closeFullscreenGame);

/* =========================================================================
   MINI-JEU PLEIN ÉCRAN HAUTE DÉFINITION : LE SUNSET DU CAP FERRET
   - Piste sinueuse (virages serrés dans la dune + ralentissement hors-piste)
   - Obstacle spécial : Mamie à vélo qui se retourne et tangue là où elle regarde
   - Superpouvoir : Le Vélo Blanc (difficile à attraper, Clara monte dessus, vitesse x2.2 + invincibilité)
   ========================================================================= */
function launchFullscreenFerretGame(item) {
    stopActiveGame();
    fsOverlay.classList.add('active');
    fsOverlay.setAttribute('aria-hidden', 'false');
    fsEndCard.classList.remove('visible');
    fsHint.style.opacity = '1';

    const canvas = document.getElementById('ferret-canvas');
    const ctx = canvas.getContext('2d');

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();

    let animId;
    let isRunning = true;
    let altitude = 0; // 0 à 100%
    const totalTime = 26;
    let timeLeft = totalTime;
    let elapsed = 0;
    let lastTime = performance.now();

    // Système de vies : on meurt au bout de 3 obstacles percutés
    const maxLives = 3;
    let lives = maxLives;

    let worldScroll = 0;
    let spawnTimer = 0.25;
    let grandmaTimer = 1.4;
    let whiteBikeSpawnsRemaining = 2;
    let nextWhiteBikeTime = 6.5;
    let lastBarrierSide = 1;
    let runCycle = 0;
    let screenShake = 0;
    let offTrackPopupCooldown = 0;

    // État du superpouvoir "Vélo Blanc"
    let bikeTimeLeft = 0;
    const BIKE_DURATION = 5.2;

    const player = {
        screenPos: 0,       // Position horizontale à l'écran (-0.95 à +0.95)
        targetScreenPos: 0,
        x: width / 2,
        y: height * 0.81
    };

    const obstacles = [];
    const popups = [];
    const particles = [];

    // Décor : Pins maritimes qui défilent sur les côtés de la dune
    const pines = Array.from({ length: 10 }, (_, i) => ({
        side: i % 2 === 0 ? -1 : 1,
        progress: (i / 10),
        sizeVar: 0.85 + (i % 3) * 0.15
    }));

    // Calcule le décalage horizontal doux du chemin à une profondeur p (0 = haut, 1 = bas)
    // Mouvement adouci pour ne pas donner mal à la tête
    function getPathCurveOffset(p) {
        const maxSwing = Math.min(width * 0.12, 58);
        const wave1 = Math.sin(worldScroll * 1.05 - p * 2.1);
        const wave2 = Math.cos(worldScroll * 0.65 - p * 1.4) * 0.35;
        const envelope = 0.20 + 0.80 * Math.pow(p, 1.15);
        return (wave1 + wave2) * maxSwing * envelope;
    }

    function updateTargetFromX(clientX) {
        fsHint.style.opacity = '0';
        const norm = (clientX / width) * 2 - 1;
        player.targetScreenPos = Math.max(-0.92, Math.min(0.92, norm * 1.12));
    }

    const onTouchStart = (e) => {
        if (e.touches.length > 0) updateTargetFromX(e.touches[0].clientX);
    };
    const onTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) updateTargetFromX(e.touches[0].clientX);
    };
    const onMouseMove = (e) => {
        updateTargetFromX(e.clientX);
    };
    const onKeyDown = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'q') {
            fsHint.style.opacity = '0';
            player.targetScreenPos = Math.max(-0.92, player.targetScreenPos - 0.28);
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            fsHint.style.opacity = '0';
            player.targetScreenPos = Math.min(0.92, player.targetScreenPos + 0.28);
        }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', resizeCanvas);

    /* Apparition d'obstacles moins nombreux mais plus exigeants :
       principalement de vraies barrières en bois de 2 voies de large ! */
    function spawnObstacle() {
        const roll = Math.random();

        if (roll < 0.68) {
            // VRAIE BARRIÈRE EN BOIS DE 2 DE LARGEUR (bloque 2/3 du chemin, laisse 1 passage étroit)
            lastBarrierSide = Math.random() < 0.75 ? -lastBarrierSide : lastBarrierSide;
            // Si lastBarrierSide === -1, la barrière couvre la gauche et le centre (de -0.95 à +0.30), passage à droite
            // Si lastBarrierSide === +1, la barrière couvre le centre et la droite (de -0.30 à +0.95), passage à gauche
            const laneStart = lastBarrierSide < 0 ? -0.96 : -0.30;
            const laneEnd = lastBarrierSide < 0 ? 0.30 : 0.96;

            obstacles.push({
                kind: 'wooden_barrier',
                laneStart,
                laneEnd,
                lane: (laneStart + laneEnd) / 2,
                progress: 0.02,
                speed: 0.48,
                penalty: -10,
                bonus: false,
                label: 'Barrière en bois ! -1 ❤️'
            });
        } else if (roll < 0.88) {
            // Pomme de pin placée précisément dans le passage ouvert de la dernière barrière
            const targetOpenLane = lastBarrierSide < 0 ? 0.62 : -0.62;
            obstacles.push({
                kind: 'standard',
                lane: targetOpenLane + (Math.random() * 0.2 - 0.1),
                progress: 0.02,
                emoji: '🌲',
                label: 'Pomme de pin ! -1 ❤️',
                penalty: -8,
                speed: 0.48,
                bonus: false,
                color: '#8C5A3C'
            });
        } else {
            // Petit bonus Canelé
            obstacles.push({
                kind: 'standard',
                lane: (Math.random() * 1.3) - 0.65,
                progress: 0.02,
                emoji: '🧁',
                label: 'Canelé +9% ✨',
                penalty: +9,
                speed: 0.48,
                bonus: true,
                color: '#F4A261'
            });
        }
    }

    /* Apparition de Mamie à vélo devant nous qui se retourne et tangue ! */
    function spawnGrandmaBike() {
        const startSide = Math.random() < 0.5 ? -1 : 1;
        const startLane = startSide * (0.45 + Math.random() * 0.25);
        const lookDir = -startSide;

        obstacles.push({
            kind: 'grandma',
            lane: startLane,
            startLane,
            lookDir,
            hasTurnedHead: false,
            wobblePhase: Math.random() * Math.PI * 2,
            progress: 0.02,
            speed: 0.31,
            penalty: -12,
            bonus: false,
            label: 'Mamie a tangué sur toi ! -1 ❤️'
        });
    }

    /* Apparition du Vélo Blanc (Superpouvoir difficile à attraper) */
    function spawnWhiteBikePickup() {
        const side = Math.random() < 0.5 ? -1 : 1;
        const baseLane = side * 0.62;

        obstacles.push({
            kind: 'white_bike',
            baseLane,
            lane: baseLane,
            weavePhase: Math.random() * Math.PI * 2,
            progress: 0.02,
            speed: 0.54,
            bonus: true,
            label: '🚲 VÉLO BLANC ACTIVÉ ! ⚡'
        });
    }

    function addParticles(x, y, color, count = 12) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 40 + Math.random() * 110;
            particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 30,
                life: 1,
                color,
                size: 3 + Math.random() * 4
            });
        }
    }

    function lerpColor(c1, c2, t) {
        const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
        const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
        const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
        return `rgb(${r},${g},${b})`;
    }

    /* Dessine le célèbre Bunker (Blockhaus) ensablé du Cap Ferret avec ses tags */
    function drawCapFerretBunker(bx, by, scale, sunProgress) {
        ctx.save();
        ctx.translate(bx, by);
        ctx.scale(scale, scale);

        ctx.save();
        ctx.rotate(-0.15);

        ctx.fillStyle = 'rgba(40, 32, 24, 0.25)';
        ctx.beginPath();
        ctx.ellipse(8, 28, 62, 14, 0.1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = lerpColor([118, 112, 104], [62, 60, 58], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(36, -32);
        ctx.lineTo(58, -22);
        ctx.lineTo(54, 28);
        ctx.lineTo(36, 30);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = lerpColor([168, 160, 148], [94, 90, 86], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(-48, -28);
        ctx.lineTo(36, -32);
        ctx.lineTo(36, 30);
        ctx.lineTo(-46, 28);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = lerpColor([188, 178, 164], [110, 105, 98], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(-52, -28);
        ctx.lineTo(-40, -44);
        ctx.lineTo(44, -45);
        ctx.lineTo(58, -22);
        ctx.lineTo(36, -32);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1E1D1B';
        ctx.fillRect(-30, -24, 48, 7);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(-48, -28, 84, 4);

        ctx.fillStyle = 'rgba(46, 196, 182, 0.85)';
        ctx.beginPath();
        ctx.arc(-26, 2, 13, 0, Math.PI * 2);
        ctx.arc(-14, 6, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 93, 143, 0.85)';
        ctx.beginPath();
        ctx.roundRect(-18, -11, 44, 18, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 190, 11, 0.85)';
        ctx.beginPath();
        ctx.arc(22, 6, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 93, 143, 0.85)';
        ctx.fillRect(-8, 7, 2.2, 8);
        ctx.fillRect(10, 7, 2, 6);
        ctx.fillStyle = 'rgba(46, 196, 182, 0.85)';
        ctx.fillRect(-28, 14, 2, 7);

        ctx.save();
        ctx.rotate(-0.04);
        ctx.font = '900 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#1C1B19';
        ctx.lineWidth = 3;
        ctx.strokeText('FERRET', 3, -2);
        ctx.fillStyle = '#FFFDF7';
        ctx.fillText('FERRET', 3, -2);
        ctx.restore();

        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#FFE5EC';
        ctx.fillText('♥', 45, -2);

        ctx.strokeStyle = 'rgba(40, 36, 32, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-38, -28);
        ctx.lineTo(-33, -12);
        ctx.lineTo(-36, -4);
        ctx.stroke();

        ctx.restore();

        ctx.fillStyle = lerpColor([226, 203, 172], [138, 123, 108], sunProgress * 0.7);
        ctx.beginPath();
        ctx.moveTo(-68, 26);
        ctx.quadraticCurveTo(-10, 8, 66, 24);
        ctx.lineTo(66, 42);
        ctx.lineTo(-68, 42);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#5F7353';
        ctx.lineWidth = 1.6;
        [-42, -36, 32, 38].forEach((ox, idx) => {
            ctx.beginPath();
            ctx.moveTo(ox, 20);
            ctx.quadraticCurveTo(ox + (idx % 2 === 0 ? -8 : 8), 5, ox + (idx % 2 === 0 ? -13 : 13), 10);
            ctx.stroke();
        });

        ctx.restore();
    }

    function drawEnvironment(sunProgress, dt, scrollFactor) {
        const horizonY = height * 0.34;
        const crestY = height * 0.40;

        // 1. Ciel dynamique
        const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        const topColor = lerpColor([209, 113, 102], [25, 34, 54], sunProgress);
        const midColor = lerpColor([244, 162, 110], [115, 75, 109], sunProgress);
        const botColor = lerpColor([255, 218, 158], [214, 114, 96], sunProgress);
        skyGrad.addColorStop(0, topColor);
        skyGrad.addColorStop(0.55, midColor);
        skyGrad.addColorStop(1, botColor);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, horizonY + 10);

        // 2. Soleil avec double halo lumineux
        const sunX = width * 0.5;
        const sunY = (height * 0.16) + sunProgress * (horizonY - height * 0.13);
        const sunRadius = Math.min(width, height) * 0.11;

        const haloGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 2.8);
        haloGrad.addColorStop(0, 'rgba(255, 248, 225, 0.95)');
        haloGrad.addColorStop(0.35, 'rgba(255, 205, 135, 0.45)');
        haloGrad.addColorStop(1, 'rgba(255, 160, 110, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFDF6';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 3. Océan Atlantique à l'horizon
        const oceanGrad = ctx.createLinearGradient(0, horizonY - 4, 0, crestY + 10);
        oceanGrad.addColorStop(0, lerpColor([58, 90, 112], [22, 35, 48], sunProgress));
        oceanGrad.addColorStop(1, lerpColor([42, 70, 88], [16, 26, 36], sunProgress));
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, horizonY - 4, width, crestY - horizonY + 15);

        if (sunProgress < 0.94) {
            ctx.fillStyle = 'rgba(255, 232, 185, 0.45)';
            for (let i = 0; i < 6; i++) {
                const waveY = horizonY + 3 + i * 5.5;
                const waveW = (46 - i * 5) * (1 - sunProgress * 0.5);
                const shimmer = Math.sin(worldScroll * 5 + i * 1.7) * 6;
                ctx.fillRect(sunX - waveW / 2 + shimmer, waveY, waveW, 2.2);
            }
        }

        // 4. Silhouette du Phare du Cap Ferret au loin sur la droite
        const lhX = width * 0.84;
        const lhBaseY = horizonY + 2;
        ctx.fillStyle = '#23312B';
        ctx.beginPath();
        ctx.moveTo(lhX - 4, lhBaseY);
        ctx.lineTo(lhX - 2, lhBaseY - 26);
        ctx.lineTo(lhX + 2, lhBaseY - 26);
        ctx.lineTo(lhX + 4, lhBaseY);
        ctx.fill();
        ctx.fillStyle = '#8B3A3A';
        ctx.fillRect(lhX - 2.5, lhBaseY - 31, 5, 5);
        const beamAlpha = 0.15 + Math.sin(worldScroll * 4) * 0.08;
        ctx.fillStyle = `rgba(255, 243, 196, ${beamAlpha})`;
        ctx.beginPath();
        ctx.moveTo(lhX, lhBaseY - 29);
        ctx.lineTo(lhX - 55, lhBaseY - 42);
        ctx.lineTo(lhX - 55, lhBaseY - 18);
        ctx.closePath();
        ctx.fill();

        // 5. Corps de la Dune du Ferret
        const sandGrad = ctx.createLinearGradient(0, crestY, 0, height);
        sandGrad.addColorStop(0, lerpColor([234, 214, 186], [150, 134, 118], sunProgress * 0.7));
        sandGrad.addColorStop(1, lerpColor([212, 186, 152], [115, 102, 88], sunProgress * 0.7));
        ctx.fillStyle = sandGrad;

        ctx.beginPath();
        ctx.moveTo(0, crestY + 8);
        ctx.quadraticCurveTo(width * 0.5, crestY - 14, width, crestY + 8);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();

        // Courbes des dunes latérales
        ctx.fillStyle = 'rgba(180, 150, 115, 0.22)';
        ctx.beginPath();
        ctx.moveTo(0, crestY + 40);
        ctx.quadraticCurveTo(width * 0.28, crestY + 95, 0, height * 0.78);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(width, crestY + 55);
        ctx.quadraticCurveTo(width * 0.72, crestY + 110, width, height * 0.82);
        ctx.fill();

        // 6. BUNKER TAGUÉ DU CAP FERRET
        const bunkerProgress = altitude / 100;
        const bunkerX = width * 0.20 - bunkerProgress * 8;
        const bunkerY = crestY + 34 + bunkerProgress * 28;
        const bunkerScale = (Math.min(width, 430) / 390) * (0.82 + bunkerProgress * 0.16);
        drawCapFerretBunker(bunkerX, bunkerY, bunkerScale, sunProgress);

        // 7. Chemin sinueux doux en perspective + Caillebotis en bois
        const pathTopW = width * 0.21;
        const pathBotW = width * 0.74;
        const pathHeight = height - crestY;
        const segments = 28;

        ctx.fillStyle = lerpColor([243, 229, 208], [168, 152, 136], sunProgress * 0.7);
        ctx.beginPath();
        for (let i = 0; i <= segments; i++) {
            const p = i / segments;
            const py = crestY + p * pathHeight;
            const w = pathTopW + p * (pathBotW - pathTopW);
            const cx = sunX + getPathCurveOffset(p);
            if (i === 0) ctx.moveTo(cx - w / 2, py);
            else ctx.lineTo(cx - w / 2, py);
        }
        for (let i = segments; i >= 0; i--) {
            const p = i / segments;
            const py = crestY + p * pathHeight;
            const w = pathTopW + p * (pathBotW - pathTopW);
            const cx = sunX + getPathCurveOffset(p);
            ctx.lineTo(cx + w / 2, py);
        }
        ctx.closePath();
        ctx.fill();

        // Bordures de sable mou le long du chemin
        ctx.strokeStyle = 'rgba(165, 135, 100, 0.42)';
        ctx.lineWidth = 2.5;
        [-1, 1].forEach((side) => {
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const p = i / segments;
                const py = crestY + p * pathHeight;
                const w = pathTopW + p * (pathBotW - pathTopW);
                const cx = sunX + getPathCurveOffset(p) + side * (w * 0.5);
                if (i === 0) ctx.moveTo(cx, py);
                else ctx.lineTo(cx, py);
            }
            ctx.stroke();
        });

        // Lattes de caillebotis qui suivent les virages de la piste
        const numSlats = 16;
        for (let i = 0; i < numSlats; i++) {
            const rawP = ((i / numSlats) + (worldScroll * 0.58)) % 1;
            const p = Math.pow(rawP, 1.65);
            const slatY = crestY + p * pathHeight;
            const currentPathW = pathTopW + p * (pathBotW - pathTopW);
            const slatW = currentPathW * 0.66;
            const slatH = Math.max(1.5, p * 6.5);
            const slatCenterX = sunX + getPathCurveOffset(p);

            ctx.fillStyle = `rgba(138, 118, 98, ${0.25 + p * 0.45})`;
            ctx.beginPath();
            ctx.roundRect(slatCenterX - slatW / 2, slatY, slatW, slatH, 2);
            ctx.fill();
        }

        // 8. Pins maritimes et oyats sur les bords
        pines.forEach((pine) => {
            pine.progress = (pine.progress + dt * 0.28 * scrollFactor) % 1;
            if (pine.side === -1 && pine.progress < 0.34) return;

            const p = Math.pow(pine.progress, 1.6);
            const py = crestY + p * pathHeight;
            const currentPathW = pathTopW + p * (pathBotW - pathTopW);
            const px = sunX + getPathCurveOffset(p) + pine.side * (currentPathW * 0.62 + p * 38);
            const scale = (0.25 + p * 0.95) * pine.sizeVar;

            ctx.strokeStyle = '#6B7F5E';
            ctx.lineWidth = 1.5 * scale;
            for (let b = -2; b <= 2; b++) {
                ctx.beginPath();
                ctx.moveTo(px + b * 4 * scale, py);
                ctx.quadraticCurveTo(px + b * 9 * scale, py - 14 * scale, px + b * 13 * scale, py - 8 * scale);
                ctx.stroke();
            }

            ctx.fillStyle = '#4A3728';
            ctx.fillRect(px - 3 * scale, py - 38 * scale, 6 * scale, 38 * scale);

            ctx.fillStyle = '#24382F';
            ctx.beginPath();
            ctx.ellipse(px, py - 42 * scale, 26 * scale, 12 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2F483D';
            ctx.beginPath();
            ctx.ellipse(px - 4 * scale, py - 46 * scale, 20 * scale, 9 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        return { crestY, pathTopW, pathBotW, pathHeight, sunX };
    }

    /* Dessine une VRAIE BARRIÈRE EN BOIS de 2 voies de large (pas une bulle !) */
    function drawWoodenBarrier(leftX, rightX, oy, scale) {
        const w = Math.max(24, rightX - leftX);
        const h = 28 * scale;
        const postW = Math.max(4, 7 * scale);
        const railH = Math.max(3.5, 6.5 * scale);

        ctx.save();

        // Ombre portée de la barrière sur le sable
        ctx.fillStyle = 'rgba(28, 24, 18, 0.26)';
        ctx.beginPath();
        ctx.roundRect(leftX - 2, oy + 2 * scale, w + 4, 8 * scale, 4);
        ctx.fill();

        // Poteaux verticaux en bois (gauche, milieu et droite) plantés dans la dune
        const postsX = [leftX + postW * 0.6, (leftX + rightX) / 2, rightX - postW * 0.6];
        postsX.forEach((px) => {
            // Corps du poteau
            ctx.fillStyle = '#5C3D28';
            ctx.beginPath();
            ctx.roundRect(px - postW / 2, oy - h, postW, h + 5 * scale, 2);
            ctx.fill();

            // Côté éclairé du poteau
            ctx.fillStyle = '#7A5236';
            ctx.fillRect(px - postW / 2, oy - h, postW * 0.45, h + 4 * scale);

            // Petit amas de sable au pied du poteau
            ctx.fillStyle = '#DEC3A1';
            ctx.beginPath();
            ctx.ellipse(px, oy + 4 * scale, postW * 1.1, 3 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        // Planche horizontale basse en bois
        const bottomRailY = oy - h * 0.42;
        ctx.fillStyle = '#8D6346';
        ctx.strokeStyle = '#4A301E';
        ctx.lineWidth = Math.max(1, 1.3 * scale);
        ctx.beginPath();
        ctx.roundRect(leftX, bottomRailY, w, railH, 2);
        ctx.fill();
        ctx.stroke();

        // Planche horizontale haute en bois avec chevrons / repères de chantier de dune
        const topRailY = oy - h * 0.88;
        ctx.fillStyle = '#9C6F4F';
        ctx.beginPath();
        ctx.roundRect(leftX, topRailY, w, railH * 1.15, 2);
        ctx.fill();
        ctx.stroke();

        // Bandes rouges et blanches d'avertissement sur la planche haute
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(leftX, topRailY, w, railH * 1.15, 2);
        ctx.clip();
        const stripeStep = Math.max(10, 18 * scale);
        for (let sx = leftX - 10; sx < rightX + 10; sx += stripeStep) {
            ctx.fillStyle = 'rgba(158, 42, 43, 0.82)';
            ctx.beginPath();
            ctx.moveTo(sx, topRailY);
            ctx.lineTo(sx + stripeStep * 0.48, topRailY);
            ctx.lineTo(sx + stripeStep * 0.25, topRailY + railH * 1.2);
            ctx.lineTo(sx - stripeStep * 0.23, topRailY + railH * 1.2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Clous sur les poteaux
        ctx.fillStyle = '#2B2118';
        postsX.forEach((px) => {
            ctx.beginPath();
            ctx.arc(px, topRailY + railH * 0.55, Math.max(1, 1.4 * scale), 0, Math.PI * 2);
            ctx.arc(px, bottomRailY + railH * 0.5, Math.max(1, 1.4 * scale), 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();
    }

    /* Dessine le Vélo Blanc à récupérer sur la piste */
    function drawWhiteBikePickup(ox, oy, scale) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        const pulse = 1 + Math.sin(worldScroll * 8) * 0.1;
        const aura = ctx.createRadialGradient(0, 0, 4, 0, 0, 32 * pulse);
        aura.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        aura.addColorStop(0.55, 'rgba(255, 230, 150, 0.55)');
        aura.addColorStop(1, 'rgba(255, 230, 150, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, 32 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(30, 53, 43, 0.85)';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(-9, 5, 5.5, 0, Math.PI * 2);
        ctx.arc(9, 5, 5.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(-9, 5);
        ctx.lineTo(-2, -4);
        ctx.lineTo(7, -4);
        ctx.lineTo(0, 5);
        ctx.closePath();
        ctx.moveTo(-2, -4);
        ctx.lineTo(-4, -8);
        ctx.moveTo(9, 5);
        ctx.lineTo(6, -8);
        ctx.lineTo(3, -9);
        ctx.stroke();

        ctx.strokeStyle = '#D4A373';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-6.5, -8);
        ctx.lineTo(-1.5, -8);
        ctx.stroke();

        ctx.font = '700 9px Plus Jakarta Sans, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('VÉLO BLANC', 0, -27);

        ctx.restore();
    }

    /* Dessine Mamie à vélo qui se retourne pour nous regarder et tangue ! */
    function drawGrandmaCyclist(ox, oy, scale, obs) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(scale, scale);

        const wobbleAngle = obs.hasTurnedHead
            ? obs.lookDir * 0.16 + Math.sin(obs.wobblePhase) * 0.12
            : Math.sin(obs.wobblePhase) * 0.03;

        if (obs.hasTurnedHead) {
            ctx.save();
            ctx.strokeStyle = 'rgba(158, 42, 43, 0.75)';
            ctx.fillStyle = 'rgba(158, 42, 43, 0.75)';
            ctx.lineWidth = 2;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(0, 14);
            ctx.lineTo(obs.lookDir * 34, 14);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(obs.lookDir * 36, 14);
            ctx.lineTo(obs.lookDir * 29, 10);
            ctx.lineTo(obs.lookDir * 29, 18);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }

        ctx.fillStyle = 'rgba(28, 27, 25, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(wobbleAngle);

        ctx.strokeStyle = '#2B2D42';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 5);
        ctx.lineTo(0, 22);
        ctx.stroke();

        ctx.strokeStyle = '#457B9D';
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.lineTo(0, 0);
        ctx.moveTo(-11, -12);
        ctx.quadraticCurveTo(0, -8, 11, -12);
        ctx.stroke();

        ctx.fillStyle = '#D4A373';
        ctx.beginPath();
        ctx.roundRect(-8, -18, 16, 8, 2);
        ctx.fill();

        ctx.fillStyle = '#F1FAEE';
        ctx.beginPath();
        ctx.roundRect(-11, -12, 22, 16, 7);
        ctx.fill();
        ctx.fillStyle = '#457B9D';
        ctx.fillRect(-10, -9, 20, 2.2);
        ctx.fillRect(-10, -4, 20, 2.2);
        ctx.fillRect(-10, 1, 20, 2.2);

        ctx.fillStyle = '#F3D5B5';
        ctx.beginPath();
        ctx.arc(0, -19, 8.5, 0, Math.PI * 2);
        ctx.fill();

        if (obs.hasTurnedHead) {
            ctx.fillStyle = '#D9D9D9';
            ctx.beginPath();
            ctx.arc(-obs.lookDir * 3, -24, 6.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#1D3557';
            ctx.lineWidth = 1.3;
            ctx.strokeRect(obs.lookDir * 2 - 5, -21, 4.2, 3.2);
            ctx.strokeRect(obs.lookDir * 2 + 0.8, -21, 4.2, 3.2);

            ctx.beginPath();
            ctx.arc(obs.lookDir * 2, -16, 2.5, 0.1 * Math.PI, 0.9 * Math.PI);
            ctx.stroke();

            ctx.save();
            ctx.rotate(-wobbleAngle);
            ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
            const msg = obs.lookDir > 0 ? 'Mamie regarde à droite ➔' : '⬅ Mamie regarde à gauche';
            const tw = ctx.measureText(msg).width;
            ctx.fillStyle = 'rgba(158, 42, 43, 0.92)';
            ctx.beginPath();
            ctx.roundRect(-tw / 2 - 7, -44, tw + 14, 17, 8);
            ctx.fill();
            ctx.fillStyle = '#FAF7F2';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(msg, 0, -35.5);
            ctx.restore();
        } else {
            ctx.fillStyle = '#D8DBE2';
            ctx.beginPath();
            ctx.arc(0, -20, 8.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#C5C9D1';
            ctx.beginPath();
            ctx.arc(0, -26, 4.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawPlayer(dt, isOffTrack) {
        const onBike = bikeTimeLeft > 0;
        // Si Clara est hors du chemin (dans le sable mou), elle s'arrête quasiment !
        const cycleSpeed = onBike ? 22 : (isOffTrack ? 3.2 : 14);
        runCycle += dt * cycleSpeed;
        const bobY = onBike ? Math.sin(runCycle) * 1.8 : Math.abs(Math.sin(runCycle)) * (isOffTrack ? 1.2 : 4);
        const tilt = (player.targetScreenPos - player.screenPos) * (onBike ? 0.45 : 0.35);

        const px = player.x;
        const py = player.y - bobY;

        if ((Math.sin(runCycle) > 0.75 || onBike) && isRunning) {
            particles.push({
                x: px + (Math.random() * 14 - 7),
                y: player.y + 20,
                vx: (Math.random() - 0.5) * (onBike ? 55 : 25),
                vy: 15 + Math.random() * (onBike ? 45 : 20),
                life: onBike ? 0.75 : 0.6,
                color: onBike
                    ? 'rgba(255, 250, 225, 0.9)'
                    : (isOffTrack ? 'rgba(185, 145, 100, 0.85)' : 'rgba(210, 185, 150, 0.7)'),
                size: (onBike ? 4.5 : 4) + Math.random() * 3
            });
        }

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tilt);

        // Aura lumineuse d'invincibilité quand Clara est sur le Vélo Blanc
        if (onBike) {
            const shieldGrad = ctx.createRadialGradient(0, 0, 6, 0, 0, 38);
            shieldGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
            shieldGrad.addColorStop(0.65, 'rgba(255, 224, 153, 0.32)');
            shieldGrad.addColorStop(1, 'rgba(255, 224, 153, 0)');
            ctx.fillStyle = shieldGrad;
            ctx.beginPath();
            ctx.arc(0, 0, 38, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ombre portée
        ctx.fillStyle = 'rgba(44, 35, 25, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, 22 + bobY, onBike ? 20 : 18, onBike ? 7 : 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Si Clara a récupéré le Vélo Blanc : on dessine le Vélo Blanc sous elle !
        if (onBike) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(-18, -9);
            ctx.quadraticCurveTo(0, -15, 18, -9);
            ctx.stroke();

            ctx.strokeStyle = '#C59B5F';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-20, -8.5);
            ctx.lineTo(-15, -9.5);
            ctx.moveTo(20, -8.5);
            ctx.lineTo(15, -9.5);
            ctx.stroke();
        }

        // T-SHIRT JAUNE DE CLARA (remplace le blanc)
        ctx.fillStyle = '#F7D046';
        ctx.strokeStyle = '#DFB426';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-11, -2);
        ctx.lineTo(11, -2);
        ctx.lineTo(16, 15);
        ctx.lineTo(-16, 15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Si Clara est sur le Vélo Blanc : cadre blanc arrière, selle et roue blanche qui tourne !
        if (onBike) {
            const pedalOffset = Math.sin(runCycle) * 4;
            ctx.fillStyle = '#D4A373';
            ctx.fillRect(-11, 13 + pedalOffset, 5, 3);
            ctx.fillRect(6, 13 - pedalOffset, 5, 3);

            ctx.fillStyle = '#A67C52';
            ctx.beginPath();
            ctx.ellipse(0, 8, 6.5, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(-7, 9);
            ctx.lineTo(0, 22);
            ctx.lineTo(7, 9);
            ctx.moveTo(0, 8);
            ctx.lineTo(0, 25);
            ctx.stroke();

            ctx.strokeStyle = '#2B2D42';
            ctx.lineWidth = 4.2;
            ctx.beginPath();
            ctx.moveTo(0, 14);
            ctx.lineTo(0, 27);
            ctx.stroke();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 15);
            ctx.lineTo(0, 26);
            ctx.stroke();
        }

        // Cheveux bruns de Clara
        ctx.fillStyle = '#3B281E';
        ctx.beginPath();
        ctx.arc(0, -10, 10, 0, Math.PI * 2);
        ctx.fill();

        // Chapeau de paille du Cap Ferret
        ctx.fillStyle = '#E2B887';
        ctx.beginPath();
        ctx.ellipse(0, -14, 20, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#2C3E35';
        ctx.beginPath();
        ctx.ellipse(0, -16, 10, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#E9C496';
        ctx.beginPath();
        ctx.arc(0, -17, 9.5, Math.PI, 0);
        ctx.fill();

        // Affichage des coeurs (vies) ou du compteur Vélo Blanc au-dessus de Clara
        ctx.rotate(-tilt);
        if (onBike) {
            ctx.font = '700 10px Plus Jakarta Sans, sans-serif';
            ctx.fillStyle = '#1E352B';
            ctx.beginPath();
            ctx.roundRect(-38, -40, 76, 16, 8);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.2;
            ctx.stroke();
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`🚲 ${bikeTimeLeft.toFixed(1)}s ⚡`, 0, -32);
        } else {
            const heartsStr = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, maxLives - lives));
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(heartsStr, 0, -31);
        }

        ctx.restore();
    }

    function finishGame(won, reason = 'time') {
        isRunning = false;

        if (won) {
            if (!gamesWon.includes(item.day)) {
                gamesWon.push(item.day);
                localStorage.setItem(GAMES_WON_KEY, JSON.stringify(gamesWon));
            }
            addParticles(width / 2, height * 0.35, '#FFE099', 28);

            // Affichage exactement comme demandé : uniquement le titre de félicitations et le mot avec coeur rouge
            fsEndBadge.style.display = 'none';
            fsEndTitle.textContent = "Bravo ! Trop forte t'as terminé le jeu";
            fsEndDesc.textContent = "Merci pour ces vacances au Cap Ferret ❤️";
            fsEndBtn.textContent = 'Fermer';
            fsEndBtn.onclick = () => {
                closeFullscreenGame();
                openModal(item);
            };
        } else {
            fsEndBadge.style.display = 'inline-block';
            if (reason === 'lives') {
                fsEndBadge.textContent = '3 obstacles percutés 💔';
                fsEndTitle.textContent = 'Aïe, chute dans la dune !';
                fsEndDesc.textContent = "Tu t'es pris trop de barrières en bois et d'obstacles pendant la montée !";
            } else {
                fsEndBadge.textContent = 'Trop tard...';
                fsEndTitle.textContent = 'Il fait nuit noire';
                fsEndDesc.textContent = "Le soleil a plongé dans l'océan avant que tu n'atteignes le sommet !";
            }
            fsEndBtn.textContent = "Retenter l'ascension";
            fsEndBtn.onclick = () => {
                launchFullscreenFerretGame(item);
            };
        }

        fsEndCard.classList.add('visible');
    }

    function loop(now) {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        // Position du joueur et vérification s'il est sur le chemin sinueux ou dans le sable mou
        player.screenPos += (player.targetScreenPos - player.screenPos) * 0.18;
        player.y = height * 0.81;
        const playerDepthP = 0.81;
        const pathTopW = width * 0.21;
        const pathBotW = width * 0.74;
        const playerPathWidth = pathTopW + playerDepthP * (pathBotW - pathTopW);
        const pathCenterAtPlayer = width * 0.5 + getPathCurveOffset(playerDepthP);

        player.x = width * 0.5 + player.screenPos * (width * 0.43);
        const distFromPathCenter = Math.abs(player.x - pathCenterAtPlayer);
        const isOffTrack = distFromPathCenter > (playerPathWidth * 0.44);

        // Facteur de défilement : presque arrêté (0.06) si hors-piste sans le Vélo Blanc !
        const scrollFactor = bikeTimeLeft > 0 ? 1.85 : (isOffTrack ? 0.06 : 1.0);

        const sunProgress = 1 - (timeLeft / totalTime);
        const geom = drawEnvironment(isRunning ? sunProgress : (altitude >= 100 ? 0.35 : 1), dt, scrollFactor);

        if (isRunning) {
            timeLeft = Math.max(0, timeLeft - dt);
            elapsed += dt;
            if (bikeTimeLeft > 0) {
                bikeTimeLeft = Math.max(0, bikeTimeLeft - dt);
            }
            if (offTrackPopupCooldown > 0) {
                offTrackPopupCooldown = Math.max(0, offTrackPopupCooldown - dt);
            }

            // Vitesse de montée : quasi à l'arrêt (0.08) quand Clara sort du chemin !
            let climbSpeed = 4.65;
            if (bikeTimeLeft > 0) {
                climbSpeed = 9.8;
            } else if (isOffTrack) {
                climbSpeed = 0.08;
                if (offTrackPopupCooldown <= 0) {
                    popups.push({
                        x: player.x,
                        y: player.y - 38,
                        text: 'Sable mou ! Tu es bloquée, reviens sur le chemin !',
                        bonus: false,
                        life: 0.85
                    });
                    offTrackPopupCooldown = 1.25;
                }
            }

            altitude = Math.min(100, altitude + dt * climbSpeed);
            worldScroll += dt * scrollFactor;

            // Moins d'obstacles, mais espacés proprement et uniquement quand on avance sur le chemin
            spawnTimer += dt * (isOffTrack && bikeTimeLeft <= 0 ? 0.25 : 1.0);
            if (spawnTimer > 0.98) {
                spawnObstacle();
                spawnTimer = 0;
            }

            grandmaTimer += dt * (isOffTrack && bikeTimeLeft <= 0 ? 0.25 : 1.0);
            if (grandmaTimer > 4.6) {
                spawnGrandmaBike();
                grandmaTimer = 0;
            }

            if (whiteBikeSpawnsRemaining > 0 && elapsed >= nextWhiteBikeTime) {
                spawnWhiteBikePickup();
                whiteBikeSpawnsRemaining--;
                nextWhiteBikeTime = 15.6;
            }
        }

        ctx.save();
        if (screenShake > 0) {
            const dx = (Math.random() - 0.5) * screenShake;
            const dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
            screenShake = Math.max(0, screenShake - dt * 28);
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            if (isRunning) {
                const obsScrollMult = bikeTimeLeft > 0 && obs.kind !== 'white_bike'
                    ? 1.35
                    : (isOffTrack ? 0.15 : 1.0);
                obs.progress += obs.speed * dt * obsScrollMult;

                if (obs.kind === 'grandma') {
                    obs.wobblePhase += dt * 10;
                    if (obs.progress >= 0.22 && !obs.hasTurnedHead) {
                        obs.hasTurnedHead = true;
                    }
                    if (obs.hasTurnedHead) {
                        obs.lane += obs.lookDir * 0.92 * dt + Math.sin(obs.wobblePhase) * 0.25 * dt;
                        obs.lane = Math.max(-0.92, Math.min(0.92, obs.lane));
                    }
                } else if (obs.kind === 'white_bike') {
                    obs.weavePhase += dt * 5.0;
                    obs.lane = obs.baseLane + Math.sin(obs.weavePhase) * 0.46;
                }
            }

            const p = Math.pow(obs.progress, 1.55);
            const oy = geom.crestY + p * geom.pathHeight;
            const currentW = geom.pathTopW + p * (geom.pathBotW - geom.pathTopW);
            const pathCenterX = geom.sunX + getPathCurveOffset(p);
            const ox = pathCenterX + obs.lane * (currentW * 0.44);
            const scale = 0.38 + p * 0.85;
            const radius = (obs.kind === 'grandma' ? 23 : 20) * scale;

            let hit = false;

            if (obs.kind === 'wooden_barrier') {
                const barrierLeftX = pathCenterX + obs.laneStart * (currentW * 0.48);
                const barrierRightX = pathCenterX + obs.laneEnd * (currentW * 0.48);
                drawWoodenBarrier(barrierLeftX, barrierRightX, oy, scale);

                // Collision rectangulaire sur toute la largeur de la vraie barrière en bois (2 voies)
                if (
                    isRunning &&
                    Math.abs(oy - player.y) < 16 * scale + 8 &&
                    player.x >= barrierLeftX - 10 &&
                    player.x <= barrierRightX + 10
                ) {
                    hit = true;
                }
            } else if (obs.kind === 'white_bike') {
                drawWhiteBikePickup(ox, oy, scale);
                if (isRunning && Math.hypot(ox - player.x, oy - player.y) < radius + 16) {
                    hit = true;
                }
            } else if (obs.kind === 'grandma') {
                drawGrandmaCyclist(ox, oy, scale, obs);
                if (isRunning && Math.hypot(ox - player.x, oy - player.y) < radius + 15) {
                    hit = true;
                }
            } else {
                ctx.fillStyle = 'rgba(28, 27, 25, 0.18)';
                ctx.beginPath();
                ctx.ellipse(ox, oy + radius * 0.75, radius * 0.9, radius * 0.35, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = obs.bonus ? 'rgba(255, 243, 210, 0.92)' : 'rgba(255, 255, 255, 0.88)';
                ctx.strokeStyle = obs.color;
                ctx.lineWidth = 2 * scale;
                ctx.beginPath();
                ctx.arc(ox, oy, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.font = `${Math.round(22 * scale)}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(obs.emoji, ox, oy + 1);

                if (isRunning && Math.hypot(ox - player.x, oy - player.y) < radius + 15) {
                    hit = true;
                }
            }

            if (hit) {
                if (obs.kind === 'white_bike') {
                    bikeTimeLeft = BIKE_DURATION;
                    addParticles(ox, oy, '#FFFFFF', 24);
                    addParticles(ox, oy, '#FFE099', 16);
                    popups.push({
                        x: ox,
                        y: oy - 18,
                        text: obs.label,
                        bonus: true,
                        life: 1.25
                    });
                } else if (bikeTimeLeft > 0 && !obs.bonus) {
                    addParticles(ox, oy, '#FFFFFF', 16);
                    popups.push({
                        x: player.x,
                        y: oy - 15,
                        text: '🚲 Obstacle franchi !',
                        bonus: true,
                        life: 0.85
                    });
                } else {
                    altitude = Math.max(0, Math.min(100, altitude + obs.penalty));

                    popups.push({
                        x: player.x,
                        y: oy - 18,
                        text: obs.label,
                        bonus: obs.bonus,
                        life: 1.05
                    });

                    if (obs.bonus) {
                        addParticles(ox, oy, '#FFD166', 16);
                    } else {
                        lives = Math.max(0, lives - 1);
                        screenShake = 13;
                        addParticles(player.x, oy, '#9E2A2B', 14);
                        addParticles(player.x, oy, '#D4A373', 10);
                    }
                }

                obstacles.splice(i, 1);

                if (isRunning && lives <= 0) {
                    finishGame(false, 'lives');
                }
                continue;
            }

            if (oy > height + 50) {
                obstacles.splice(i, 1);
            }
        }

        drawPlayer(dt, isOffTrack);

        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt * 1.4;
            if (pt.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.fillStyle = pt.color;
            ctx.globalAlpha = Math.max(0, pt.life);
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        for (let i = popups.length - 1; i >= 0; i--) {
            const pop = popups[i];
            pop.y -= dt * 42;
            pop.life -= dt * 0.95;
            if (pop.life <= 0) {
                popups.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.max(0, pop.life);
            ctx.font = '600 13px Plus Jakarta Sans, sans-serif';
            const textW = ctx.measureText(pop.text).width;
            ctx.fillStyle = pop.bonus ? '#1E352B' : '#9E2A2B';
            ctx.beginPath();
            ctx.roundRect(pop.x - textW / 2 - 10, pop.y - 13, textW + 20, 26, 99);
            ctx.fill();

            ctx.fillStyle = '#FAF8F5';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        }

        ctx.restore();

        const pct = Math.floor(altitude);
        fsAltText.textContent = `${pct}%`;
        fsAltBar.style.width = `${pct}%`;
        fsTimer.textContent = bikeTimeLeft > 0 ? `🚲 ${Math.ceil(timeLeft)}s` : `☀️ ${Math.ceil(timeLeft)}s`;

        if (isRunning) {
            if (altitude >= 100) {
                finishGame(true);
            } else if (timeLeft <= 0) {
                finishGame(false, 'time');
            }
        }

        animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);

    activeGameCleanup = () => {
        isRunning = false;
        cancelAnimationFrame(animId);
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('resize', resizeCanvas);
    };
}

function getCardHolidayMotif(day, item) {
    if (item.game) {
        // Soleil doré / Cap Ferret
        return `
            <svg class="day-deco-svg" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="4" fill="#C59B5F"/>
                <circle cx="8" cy="8" r="6.2" stroke="#C59B5F" stroke-width="1" stroke-dasharray="2 2"/>
            </svg>
        `;
    }

    const mod = day % 5;
    if (mod === 1) {
        // Petite boule de Noël rouge velours et attache dorée
        return `
            <svg class="day-deco-svg" width="13" height="15" viewBox="0 0 14 16" fill="none" aria-hidden="true">
                <rect x="5.2" y="1" width="3.6" height="2" rx="0.6" fill="#C59B5F"/>
                <circle cx="7" cy="9" r="5.2" fill="#9E2A2B" stroke="#C59B5F" stroke-width="0.8"/>
                <circle cx="5.4" cy="7.3" r="1" fill="#FAF7F2" opacity="0.45"/>
            </svg>
        `;
    }
    if (mod === 2) {
        // Petit sapin vert pin avec étoile dorée
        return `
            <svg class="day-deco-svg" width="14" height="15" viewBox="0 0 14 15" fill="none" aria-hidden="true">
                <path d="M7 1.8L3 7.2H5.3L2 11.8H12L8.7 7.2H11L7 1.8Z" fill="#1E352B"/>
                <rect x="6.1" y="11.8" width="1.8" height="2.2" fill="#8C5A3C"/>
                <circle cx="7" cy="1.5" r="1.1" fill="#C59B5F"/>
                <circle cx="6.2" cy="9.2" r="0.9" fill="#9E2A2B"/>
            </svg>
        `;
    }
    if (mod === 3) {
        // Étoile dorée de Noël
        return `
            <svg class="day-deco-svg" width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 1L8.4 5.6L13 7L8.4 8.4L7 13L5.6 8.4L1 7L5.6 5.6L7 1Z" fill="#C59B5F"/>
            </svg>
        `;
    }
    if (mod === 0) {
        // Houx & baies rouges
        return `
            <svg class="day-deco-svg" width="15" height="13" viewBox="0 0 16 14" fill="none" aria-hidden="true">
                <path d="M7.5 8C4.5 4.5 1.5 6 3 9.5C4.5 11 6.5 10 7.5 8Z" fill="#1E352B"/>
                <path d="M8.5 8C11.5 4.5 14.5 6 13 9.5C11.5 11 9.5 10 8.5 8Z" fill="#1E352B"/>
                <circle cx="8" cy="6.2" r="1.8" fill="#9E2A2B"/>
                <circle cx="6.7" cy="8.2" r="1.6" fill="#B83B3B"/>
                <circle cx="9.3" cy="8.2" r="1.6" fill="#9E2A2B"/>
            </svg>
        `;
    }

    // Point classique rouge/doré
    return `<span class="day-dot"></span>`;
}

function renderGrid() {
    gridEl.innerHTML = '';

    calendarData.forEach((item) => {
        const card = document.createElement('div');
        card.className = 'day-card';
        if (item.day === 24) card.classList.add('day-24');

        const isOpened = openedDays.includes(item.day);
        const unlocked = isDayUnlocked(item.day);

        if (isOpened) {
            card.classList.add('opened');
        } else if (unlocked) {
            card.classList.add('available');
        } else {
            card.classList.add('locked');
        }

        if (item.day === 24) {
            card.innerHTML = `
                <svg class="day-24-flank left" width="32" height="38" viewBox="0 0 32 38" fill="none" aria-hidden="true">
                    <path d="M16 4L7 16H12L4 28H13.5V34H18.5V28H28L20 16H25L16 4Z" fill="#2C4A3E" stroke="#C59B5F" stroke-width="0.9"/>
                    <circle cx="16" cy="3.5" r="2" fill="#E8D5B5"/>
                    <circle cx="13" cy="19" r="1.8" fill="#9E2A2B"/>
                    <circle cx="19" cy="23" r="1.8" fill="#C59B5F"/>
                    <circle cx="12" cy="25" r="1.5" fill="#E8D5B5"/>
                </svg>
                <span class="day-kicker">Veille de Noël</span>
                <span class="day-number">${item.day}</span>
                <div class="day-status-row">
                    <svg class="day-deco-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <rect x="6" y="1" width="4" height="2.2" rx="0.7" fill="#C59B5F"/>
                        <circle cx="8" cy="9.2" r="5.5" fill="#9E2A2B" stroke="#E8D5B5" stroke-width="0.9"/>
                        <path d="M8 6L8.8 8.4L11.2 9.2L8.8 10L8 12.4L7.2 10L4.8 9.2L7.2 8.4L8 6Z" fill="#E8D5B5"/>
                    </svg>
                </div>
                <svg class="day-24-flank right" width="32" height="38" viewBox="0 0 32 38" fill="none" aria-hidden="true">
                    <path d="M16 4L7 16H12L4 28H13.5V34H18.5V28H28L20 16H25L16 4Z" fill="#2C4A3E" stroke="#C59B5F" stroke-width="0.9"/>
                    <circle cx="16" cy="3.5" r="2" fill="#E8D5B5"/>
                    <circle cx="19" cy="18" r="1.8" fill="#9E2A2B"/>
                    <circle cx="13" cy="23" r="1.8" fill="#C59B5F"/>
                    <circle cx="20" cy="25" r="1.5" fill="#9E2A2B"/>
                </svg>
            `;
        } else {
            card.innerHTML = `
                <span class="day-kicker">Déc</span>
                <span class="day-number">${item.day}</span>
                <div class="day-status-row">
                    ${getCardHolidayMotif(item.day, item)}
                </div>
            `;
        }

        card.addEventListener('click', () => {
            if (!unlocked) {
                showToast(`Patience… ouverture le ${item.day} décembre`);
                return;
            }

            if (!openedDays.includes(item.day)) {
                openedDays.push(item.day);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(openedDays));
                card.classList.remove('available');
                card.classList.add('opened');
            }

            openModal(item);
        });

        gridEl.appendChild(card);
    });
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (fsOverlay.classList.contains('active')) {
            closeFullscreenGame();
        } else if (modalOverlay.classList.contains('active')) {
            closeModal();
        }
    }
});

/* =========================================================================
   PHYSIQUE GRAVITAIRE DES BOULES DE NOËL SUSPENDUES (PENDULE + ÉLASTICITÉ)
   - Réagit à la vitesse de défilement (scroll lent = léger balancement,
     scroll brusque = grande oscillation + rebond sur le fil doré)
   - Fonctionne aussi au glissement tactile (même en haut/bas de page)
     et à l'inclinaison du téléphone
   ========================================================================= */
function initHangingBaublesPhysics() {
    const configs = [
        {
            id: 'pendulum-left-main',
            pivotX: 26,
            baseThreadY: 66,
            length: 85,
            damping: 1.85,
            eccentricity: 1.0,
            bounceScale: 1.0,
            phase: 0.2
        },
        {
            id: 'pendulum-left-star',
            pivotX: 56,
            baseThreadY: 42,
            length: 51,
            damping: 2.15,
            eccentricity: -1.35,
            bounceScale: 0.75,
            phase: 1.9
        },
        {
            id: 'pendulum-right-drop',
            pivotX: 22,
            baseThreadY: 48,
            length: 61,
            damping: 2.05,
            eccentricity: 1.3,
            bounceScale: 0.82,
            phase: 3.4
        },
        {
            id: 'pendulum-right-main',
            pivotX: 50,
            baseThreadY: 76,
            length: 94,
            damping: 1.75,
            eccentricity: -1.05,
            bounceScale: 1.08,
            phase: 4.8
        }
    ];

    const pendulums = [];

    configs.forEach((cfg) => {
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

    const GRAVITY = 960;        // constante de gravité (px/s²)
    const SPRING_K = 165;       // raideur élastique du fil doré
    const SPRING_DAMP = 6.2;    // amortissement du rebond vertical
    const MAX_ANGLE = 0.76;     // ~43.5° max
    const MAX_OMEGA = 9.5;      // vitesse angulaire max

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let lastScrollEventTime = 0;
    let tiltTargetAngle = 0;    // inclinaison réelle du téléphone (si dispo)

    // Applique une impulsion proportionnelle à la vitesse du mouvement vertical/horizontal
    function applyWindowImpulse(dy, dx = 0) {
        const absDy = Math.abs(dy);
        const absDx = Math.abs(dx);
        if (absDy < 0.1 && absDx < 0.1) return;

        // Réponse non-linéaire : un petit scroll bouge très peu, un coup sec bouge beaucoup
        const nonLinearY = Math.sign(dy) * Math.min(140, Math.pow(absDy, 1.32));

        pendulums.forEach((p) => {
            // Si la boule oscille déjà vite, l'accélération verticale amplifie son élan naturel
            const swingSign = Math.abs(p.omega) > 0.45
                ? Math.sign(p.omega) * Math.sign(dy || 1)
                : Math.sign(dy || 1) * p.eccentricity;

            // Impulsion angulaire (balancement de gauche à droite)
            const angularKick = (nonLinearY * 0.048 * swingSign + dx * 0.032) * (75 / p.length);
            p.omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, p.omega + angularKick));

            // Impulsion verticale (effet de gravité / tirage sur le fil doré)
            const verticalKick = -nonLinearY * 2.35 * p.bounceScale;
            p.velY = Math.max(-240, Math.min(240, p.velY + verticalKick));
        });
    }

    // 1. Écoute du scroll natif (inclut l'inertie iOS après avoir lâché le doigt)
    window.addEventListener('scroll', () => {
        const currentY = window.scrollY || window.pageYOffset || 0;
        const dy = currentY - lastScrollY;
        lastScrollY = currentY;
        lastScrollEventTime = performance.now();

        if (Math.abs(dy) > 0.2) {
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
        const fingerDy = lastTouchY - y; // positif quand on descend dans la page
        const fingerDx = x - lastTouchX;
        lastTouchY = y;
        lastTouchX = x;

        const now = performance.now();
        const scrolledRecently = (now - lastScrollEventTime) < 28;

        // Si la page ne défile pas (ex: déjà tout en haut ou tout en bas), le coup de doigt fait quand même bouger les boules
        if (!scrolledRecently) {
            applyWindowImpulse(fingerDy * 0.72, fingerDx * 0.55);
        } else if (Math.abs(fingerDx) > 0.5) {
            applyWindowImpulse(0, fingerDx * 0.45);
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        lastTouchY = null;
        lastTouchX = null;
    }, { passive: true });

    // 3. Support molette / trackpad sur ordinateur (même en butée de page)
    window.addEventListener('wheel', (e) => {
        const now = performance.now();
        if ((now - lastScrollEventTime) > 28) {
            applyWindowImpulse(e.deltaY * 0.32, e.deltaX * 0.2);
        }
    }, { passive: true });

    // 4. Support gyroscope / inclinaison du téléphone (si disponible)
    window.addEventListener('deviceorientation', (e) => {
        if (typeof e.gamma === 'number') {
            const clampedGamma = Math.max(-35, Math.min(35, e.gamma));
            tiltTargetAngle = (clampedGamma * Math.PI) / 180 * 0.35;
        }
    }, { passive: true });

    // Boucle physique 60fps (pendule amorti + ressort vertical)
    let lastFrameTime = performance.now();

    function stepPhysics(now) {
        const dt = Math.min(0.035, Math.max(0.004, (now - lastFrameTime) / 1000));
        lastFrameTime = now;
        const t = now * 0.001;

        for (let i = 0; i < pendulums.length; i++) {
            const p = pendulums[i];

            // Très léger souffle ambiant au repos pour que les boules restent vivantes
            const ambientAngle = Math.sin(t * 1.15 + p.phase) * 0.014;
            const targetEq = tiltTargetAngle + ambientAngle;

            // Équation du pendule sous gravité : d²θ/dt² = -(g / L) * sin(θ - θ_eq) - damping * ω
            const alpha = -(GRAVITY / p.length) * Math.sin(p.angle - targetEq) - p.damping * p.omega;
            p.omega += alpha * dt;
            p.angle += p.omega * dt;

            // Butées souples si l'angle dépasse la limite maximale
            if (p.angle > MAX_ANGLE) {
                p.angle = MAX_ANGLE;
                p.omega *= -0.45;
            } else if (p.angle < -MAX_ANGLE) {
                p.angle = -MAX_ANGLE;
                p.omega *= -0.45;
            }

            // Force centrifuge du pendule qui tire légèrement sur le fil quand il balance fort
            const centrifugalPull = Math.min(6, (p.omega * p.omega * p.length) * 0.012);

            // Ressort vertical (rebond sur le fil doré)
            const accY = -SPRING_K * (p.bounceY - centrifugalPull) - SPRING_DAMP * p.velY;
            p.velY += accY * dt;
            p.bounceY += p.velY * dt;
            p.bounceY = Math.max(-9, Math.min(14, p.bounceY));

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

initGate();
renderGrid();
initHangingBaublesPhysics();