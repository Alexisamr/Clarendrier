/**
 * Passe DEV_MODE à `false` avant de lui donner le site en décembre.
 */
const DEV_MODE = true;

const STORAGE_KEY = 'advent_opened_days_v1';
const GAMES_WON_KEY = 'advent_games_won_v1';

// Contenu des 24 jours
const calendarData = Array.from({ length: 24 }, (_, i) => {
    const day = i + 1;

    // JOUR 4 : Premier mini-jeu (Cap Ferret)
    if (day === 4) {
        return {
            day: 4,
            title: "Le Sunset du Ferret",
            game: "ferret",
            content: `Bravo, tu es arrivée en haut de la dune juste à temps pour le coucher de soleil (et sans pomme de pin dans le pied).<br><br>Voici ta vraie surprise du 4 décembre...`
        };
    }

    // JOUR 20 : Emplacement réservé pour le 2e mini-jeu de fin décembre
    if (day === 20) {
        return {
            day: 20,
            title: "Défi de fin décembre",
            game: null, // On activera le 2e jeu ici quand tu voudras
            content: `Surprise du 20 décembre.`
        };
    }

    return {
        day: day,
        title: `Surprise du ${day} décembre`,
        content: `Voici le petit mot ou l'indice pour la journée du ${day} décembre.`
    };
});

let openedDays = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let gamesWon = JSON.parse(localStorage.getItem(GAMES_WON_KEY)) || [];
let activeGameCleanup = null;

const gridEl = document.getElementById('calendar-grid');
const progressTextEl = document.getElementById('progress-text');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalDay = document.getElementById('modal-day');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const toastEl = document.getElementById('toast');

let toastTimeout;

function isDayUnlocked(dayNumber) {
    if (DEV_MODE) return true;
    const now = new Date();
    return now.getMonth() === 11 && now.getDate() >= dayNumber;
}

function updateProgress() {
    const count = openedDays.length;
    progressTextEl.textContent = `${count} sur 24 ${count > 1 ? 'découverts' : 'découvert'}`;
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

function openModal(item, forceGame = false) {
    stopActiveGame();
    modalDay.textContent = `${item.day} Décembre`;
    modalTitle.textContent = item.title;

    const hasBeatenGame = gamesWon.includes(item.day);

    // Si la case contient le jeu du Ferret et qu'elle ne l'a pas encore gagné (ou veut rejouer)
    if (item.game === 'ferret' && (!hasBeatenGame || forceGame)) {
        renderFerretGame(item);
    } else {
        renderDayContent(item);
    }

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
}

function renderDayContent(item) {
    modalBody.innerHTML = `<div>${item.content}</div>`;
    if (item.game) {
        const replayBtn = document.createElement('button');
        replayBtn.className = 'btn-replay';
        replayBtn.textContent = '↺ Rejouer à l’ascension de la dune';
        replayBtn.addEventListener('click', () => openModal(item, true));
        modalBody.appendChild(replayBtn);
    }
}

function closeModal() {
    stopActiveGame();
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
}

/* =========================================================
   MINI-JEU 1 : L'ASCENSION DE LA DUNE (CAP FERRET)
   ========================================================= */
function renderFerretGame(item) {
    modalBody.innerHTML = `
        <div class="game-wrapper">
            <p class="game-intro">
                Le soleil plonge derrière l'océan ! Glisse ton doigt à gauche ou à droite pour grimper la dune et éviter les pièges du chemin.
            </p>
            <div class="game-hud">
                <span id="ferret-alt">Sommet : 0%</span>
                <span id="ferret-sun">Soleil : 20s</span>
            </div>
            <div class="game-canvas-container">
                <canvas id="ferret-canvas" width="320" height="270"></canvas>
                <div class="game-feedback" id="ferret-feedback"></div>
            </div>
            <div id="ferret-action" style="width: 100%;"></div>
        </div>
    `;

    const canvas = document.getElementById('ferret-canvas');
    const ctx = canvas.getContext('2d');
    const altEl = document.getElementById('ferret-alt');
    const sunEl = document.getElementById('ferret-sun');
    const feedbackEl = document.getElementById('ferret-feedback');
    const actionContainer = document.getElementById('ferret-action');

    let animId;
    let isRunning = true;
    let gameWon = false;

    let altitude = 0; // Objectif : 100
    let timeLeft = 20; // 20 secondes avant la nuit
    let lastTime = performance.now();
    let spawnTimer = 0;
    let sandOffset = 0;

    // Joueuse (en bas de l'écran)
    const player = {
        x: canvas.width / 2,
        targetX: canvas.width / 2,
        y: 225,
        radius: 13
    };

    const obstacles = [];
    const OBSTACLE_TYPES = [
        { emoji: '🌲', speed: 115, penalty: -9, text: 'Aïe ! Pomme de pin sous le pied !' },
        { emoji: '🚲', speed: 135, penalty: -12, text: 'Bloqué par un touriste en Fatbike !' },
        { emoji: '🦪', speed: 105, penalty: -10, text: 'Outch, une coquille d’huître !' },
        { emoji: '🩴', speed: 120, penalty: -7, text: 'Trébuché sur une claquette perdue !' },
        { emoji: '🧁', speed: 125, penalty: +14, text: 'Canelé tout chaud : +14% !', bonus: true }
    ];

    let feedbackTimeout;
    function showFeedback(msg) {
        feedbackEl.textContent = msg;
        feedbackEl.classList.add('visible');
        clearTimeout(feedbackTimeout);
        feedbackTimeout = setTimeout(() => {
            feedbackEl.classList.remove('visible');
        }, 1200);
    }

    // Contrôles tactiles iPhone & souris
    function handleMove(clientX) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const relX = (clientX - rect.left) * scaleX;
        // Garde la joueuse sur le chemin de sable (entre les pins)
        player.targetX = Math.max(48, Math.min(canvas.width - 48, relX));
    }

    const onTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };
    const onTouchStart = (e) => {
        if (e.touches.length > 0) handleMove(e.touches[0].clientX);
    };
    const onMouseMove = (e) => {
        if (e.buttons === 1) handleMove(e.clientX);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);

    function spawnObstacle() {
        const isBonus = Math.random() < 0.22;
        const pool = isBonus
            ? OBSTACLE_TYPES.filter(o => o.bonus)
            : OBSTACLE_TYPES.filter(o => !o.bonus);
        const type = pool[Math.floor(Math.random() * pool.length)];

        obstacles.push({
            x: 52 + Math.random() * (canvas.width - 104),
            y: 78, // Apparaît au sommet de la dune
            ...type
        });
    }

    function drawScene(sunProgress) {
        // 1. Ciel qui s'assombrit au fil du coucher de soleil (0 = doré, 1 = crépuscule)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, 95);
        if (sunProgress < 0.65) {
            skyGrad.addColorStop(0, '#D88C7A');
            skyGrad.addColorStop(1, '#F3C68F');
        } else {
            skyGrad.addColorStop(0, '#2C3E50');
            skyGrad.addColorStop(1, '#C06C84');
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, 95);

        // 2. Soleil qui descend dans l'océan
        const sunY = 28 + sunProgress * 52;
        ctx.fillStyle = '#FFF6E5';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, sunY, 20, 0, Math.PI * 2);
        ctx.fill();

        // 3. Océan Atlantique à l'horizon
        ctx.fillStyle = '#3B596A';
        ctx.fillRect(0, 68, canvas.width, 28);

        // Reflet du soleil sur l'eau
        if (sunProgress < 0.92) {
            ctx.fillStyle = 'rgba(255, 246, 229, 0.35)';
            ctx.fillRect(canvas.width / 2 - 14, 72, 28, 6);
        }

        // 4. La Dune du Cap Ferret
        ctx.fillStyle = '#E6D7C3';
        ctx.beginPath();
        ctx.moveTo(0, 88);
        ctx.quadraticCurveTo(canvas.width / 2, 74, canvas.width, 88);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Chemin central dans le sable
        ctx.fillStyle = '#EFE5D8';
        ctx.beginPath();
        ctx.moveTo(95, 82);
        ctx.lineTo(225, 82);
        ctx.lineTo(290, canvas.height);
        ctx.lineTo(30, canvas.height);
        ctx.closePath();
        ctx.fill();

        // Petits grains de sable qui défilent pour donner l'effet de montée
        ctx.fillStyle = '#D2C0A8';
        for (let i = 0; i < 6; i++) {
            const grainY = 95 + ((sandOffset + i * 32) % 170);
            const grainX = 75 + ((i * 37) % 170);
            ctx.fillRect(grainX, grainY, 3, 3);
        }

        // Silhouettes sobres de pins maritimes sur les bords
        ctx.fillStyle = '#2C3E35';
        [18, 302].forEach((bx) => {
            ctx.beginPath();
            ctx.arc(bx, 110, 22, 0, Math.PI * 2);
            ctx.arc(bx, 165, 26, 0, Math.PI * 2);
            ctx.arc(bx, 230, 30, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    function loop(now) {
        if (!isRunning) return;
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        timeLeft = Math.max(0, timeLeft - dt);
        // Elle grimpe de 6.2% par seconde si elle évite les obstacles
        altitude = Math.min(100, altitude + dt * 6.2);
        sandOffset += dt * 95;

        player.x += (player.targetX - player.x) * 0.22;

        spawnTimer += dt;
        if (spawnTimer > 0.65) {
            spawnObstacle();
            spawnTimer = 0;
        }

        const sunProgress = 1 - (timeLeft / 20);
        drawScene(sunProgress);

        // Mise à jour et dessin des obstacles
        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.y += obs.speed * dt;
            ctx.fillText(obs.emoji, obs.x, obs.y);

            // Collision avec la joueuse
            const dist = Math.hypot(obs.x - player.x, obs.y - player.y);
            if (dist < player.radius + 11) {
                altitude = Math.max(0, Math.min(100, altitude + obs.penalty));
                showFeedback(obs.text);
                obstacles.splice(i, 1);
                continue;
            }

            if (obs.y > canvas.height + 20) {
                obstacles.splice(i, 1);
            }
        }

        // Dessin de la joueuse (silhouette de dos avec chapeau d'été)
        ctx.fillStyle = '#2C3E35';
        ctx.beginPath();
        ctx.arc(player.x, player.y + 8, 9, Math.PI, 0);
        ctx.fill();

        // Chapeau de paille
        ctx.fillStyle = '#D4A373';
        ctx.beginPath();
        ctx.ellipse(player.x, player.y - 4, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#BC6C25';
        ctx.beginPath();
        ctx.arc(player.x, player.y - 6, 6, Math.PI, 0);
        ctx.fill();

        // HUD
        altEl.textContent = `Sommet : ${Math.floor(altitude)}%`;
        sunEl.textContent = `Soleil : ${Math.ceil(timeLeft)}s`;

        // Victoire : Sommet atteint !
        if (altitude >= 100) {
            isRunning = false;
            gameWon = true;
            drawScene(0.35); // Beau coucher de soleil dégagé
            showFeedback('Sommet atteint ! Quel sunset ✨');

            if (!gamesWon.includes(item.day)) {
                gamesWon.push(item.day);
                localStorage.setItem(GAMES_WON_KEY, JSON.stringify(gamesWon));
            }

            actionContainer.innerHTML = `
                <button class="btn-sober" id="btn-unlock-msg">
                    Admirer le sunset & lire le mot du jour
                </button>
            `;
            document.getElementById('btn-unlock-msg').addEventListener('click', () => {
                renderDayContent(item);
            });
            return;
        }

        // Défaite : Le soleil est couché
        if (timeLeft <= 0) {
            isRunning = false;
            drawScene(1);
            showFeedback('Il fait nuit noire sur le Bassin...');
            actionContainer.innerHTML = `
                <button class="btn-sober" id="btn-retry-game">
                    Retenter l'ascension avant la nuit
                </button>
            `;
            document.getElementById('btn-retry-game').addEventListener('click', () => {
                renderFerretGame(item);
            });
            return;
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
    };
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

        card.innerHTML = `
            <span class="day-number">${item.day}</span>
            <span class="day-dot"></span>
        `;

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
                updateProgress();
            }

            openModal(item);
        });

        gridEl.appendChild(card);
    });

    updateProgress();
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

renderGrid();