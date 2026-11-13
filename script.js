/**
 * Passe DEV_MODE à `false` avant de lui donner le site en décembre.
 */
const DEV_MODE = true;

const STORAGE_KEY = 'advent_opened_days_v1';
const GAMES_WON_KEY = 'advent_games_won_v1';

const calendarData = Array.from({ length: 24 }, (_, i) => {
    const day = i + 1;

    if (day === 4) {
        return {
            day: 4,
            title: "Le Sunset du Ferret",
            game: "ferret",
            gameTitle: "L'Ascension de la Dune",
            gameSubtitle: "Défi Cap Ferret • 22 secondes",
            content: `Bravo, tu es arrivée en haut de la dune juste à temps pour voir le soleil plonger dans l'océan (et sans aucune pomme de pin sous le pied).<br><br>Voici ta surprise du 4 décembre...`
        };
    }

    if (day === 20) {
        return {
            day: 20,
            title: "Défi de fin décembre",
            game: null,
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

/* Ouvre la modale du jour avec la petite box cliquable pour le jeu */
function openModal(item) {
    modalDay.textContent = `${item.day} Décembre`;
    modalTitle.textContent = item.title;
    modalBody.innerHTML = '';

    const hasWon = gamesWon.includes(item.day);

    if (item.game === 'ferret') {
        if (hasWon) {
            const msgDiv = document.createElement('div');
            msgDiv.style.marginBottom = '18px';
            msgDiv.innerHTML = item.content;
            modalBody.appendChild(msgDiv);
        } else {
            const introP = document.createElement('p');
            introP.style.color = 'var(--text-secondary)';
            introP.style.fontSize = '0.9rem';
            introP.textContent = "Pour débloquer ton mot du jour, grimpe en haut de la dune avant que le soleil ne disparaisse derrière l'océan :";
            modalBody.appendChild(introP);
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
    const totalTime = 22;
    let timeLeft = totalTime;
    let lastTime = performance.now();

    let worldScroll = 0;
    let spawnTimer = 0;
    let runCycle = 0;
    let screenShake = 0;

    const player = {
        lanePos: 0,
        targetLanePos: 0,
        x: width / 2,
        y: height * 0.80
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

    const OBSTACLE_TYPES = [
        { emoji: '🌲', label: 'Pomme de pin !', penalty: -9, speed: 0.42, bonus: false, color: '#8C5A3C' },
        { emoji: '🚲', label: 'Touriste en Fatbike !', penalty: -12, speed: 0.48, bonus: false, color: '#3E5C76' },
        { emoji: '🦪', label: 'Coquille d’huître !', penalty: -10, speed: 0.40, bonus: false, color: '#7D8597' },
        { emoji: '🩴', label: 'Claquette perdue !', penalty: -7, speed: 0.45, bonus: false, color: '#E07A5F' },
        { emoji: '🧁', label: 'Canelé +14% ✨', penalty: +14, speed: 0.44, bonus: true, color: '#F4A261' }
    ];

    function updateTargetFromX(clientX) {
        fsHint.style.opacity = '0';
        const norm = (clientX / width) * 2 - 1;
        player.targetLanePos = Math.max(-0.85, Math.min(0.85, norm * 1.15));
    }

    const onTouchStart = (e) => {
        if (e.touches.length > 0) updateTargetFromX(e.touches[0].clientX);
    };
    const onTouchMove = (e) => {
        e.preventDefault();
        if (e.touches.length > 0) updateTargetFromX(e.touches[0].clientX);
    };
    const onMouseMove = (e) => {
        if (e.buttons === 1) updateTargetFromX(e.clientX);
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', resizeCanvas);

    function spawnObstacle() {
        const isBonus = Math.random() < 0.24;
        const pool = OBSTACLE_TYPES.filter(o => o.bonus === isBonus);
        const type = pool[Math.floor(Math.random() * pool.length)];

        obstacles.push({
            lane: (Math.random() * 1.5) - 0.75,
            progress: 0.02,
            ...type
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

        // 1. Structure en béton inclinée dans la dune
        ctx.save();
        ctx.rotate(-0.15); // Incliné vers l'océan comme les vrais blockhaus du Ferret

        // Ombre portée du bunker sur le sable
        ctx.fillStyle = 'rgba(40, 32, 24, 0.25)';
        ctx.beginPath();
        ctx.ellipse(8, 28, 62, 14, 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Face latérale droite (dans l'ombre)
        ctx.fillStyle = lerpColor([118, 112, 104], [62, 60, 58], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(36, -32);
        ctx.lineTo(58, -22);
        ctx.lineTo(54, 28);
        ctx.lineTo(36, 30);
        ctx.closePath();
        ctx.fill();

        // Face principale en béton brut
        ctx.fillStyle = lerpColor([168, 160, 148], [94, 90, 86], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(-48, -28);
        ctx.lineTo(36, -32);
        ctx.lineTo(36, 30);
        ctx.lineTo(-46, 28);
        ctx.closePath();
        ctx.fill();

        // Toit massif biseauté (casemate)
        ctx.fillStyle = lerpColor([188, 178, 164], [110, 105, 98], sunProgress * 0.8);
        ctx.beginPath();
        ctx.moveTo(-52, -28);
        ctx.lineTo(-40, -44);
        ctx.lineTo(44, -45);
        ctx.lineTo(58, -22);
        ctx.lineTo(36, -32);
        ctx.closePath();
        ctx.fill();

        // Fente d'observation sombre (visière du blockhaus)
        ctx.fillStyle = '#1E1D1B';
        ctx.fillRect(-30, -24, 48, 7);
        // Ombre sous la casquette en béton
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(-48, -28, 84, 4);

        // --- TAGS & GRAFFITIS COLORÉS SUR LE BÉTON ---
        // Splash / Vague street-art turquoise à gauche
        ctx.fillStyle = 'rgba(46, 196, 182, 0.85)';
        ctx.beginPath();
        ctx.arc(-26, 2, 13, 0, Math.PI * 2);
        ctx.arc(-14, 6, 10, 0, Math.PI * 2);
        ctx.fill();

        // Fond de tag rose/magenta + jaune solaire
        ctx.fillStyle = 'rgba(255, 93, 143, 0.85)';
        ctx.beginPath();
        ctx.roundRect(-18, -11, 44, 18, 6);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 190, 11, 0.85)';
        ctx.beginPath();
        ctx.arc(22, 6, 9, 0, Math.PI * 2);
        ctx.fill();

        // Petites coulures de bombe de peinture
        ctx.fillStyle = 'rgba(255, 93, 143, 0.85)';
        ctx.fillRect(-8, 7, 2.2, 8);
        ctx.fillRect(10, 7, 2, 6);
        ctx.fillStyle = 'rgba(46, 196, 182, 0.85)';
        ctx.fillRect(-28, 14, 2, 7);

        // Lettrage Graffiti "FERRET"
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

        // Petit tag coeur blanc/rouge sur le flanc droit
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#FFE5EC';
        ctx.fillText('♥', 45, -2);

        // Fissures et grain du vieux béton
        ctx.strokeStyle = 'rgba(40, 36, 32, 0.35)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-38, -28);
        ctx.lineTo(-33, -12);
        ctx.lineTo(-36, -4);
        ctx.stroke();

        ctx.restore(); // Fin de l'inclinaison du bunker

        // 2. Bourrelet de sable par-dessus la base pour l'effet "ensablé dans la dune"
        ctx.fillStyle = lerpColor([226, 203, 172], [138, 123, 108], sunProgress * 0.7);
        ctx.beginPath();
        ctx.moveTo(-68, 26);
        ctx.quadraticCurveTo(-10, 8, 66, 24);
        ctx.lineTo(66, 42);
        ctx.lineTo(-68, 42);
        ctx.closePath();
        ctx.fill();

        // Quelques oyats (herbes de dune) qui poussent au pied du bunker
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

    function drawEnvironment(sunProgress, dt) {
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

        // Reflets dorés animés sur l'eau
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

        // 6. BUNKER TAGUÉ DU CAP FERRET (sur le flanc haut gauche de la dune)
        const bunkerProgress = altitude / 100; // Se rapproche doucement pendant la montée
        const bunkerX = width * 0.20 - bunkerProgress * 8;
        const bunkerY = crestY + 34 + bunkerProgress * 28;
        const bunkerScale = (Math.min(width, 430) / 390) * (0.82 + bunkerProgress * 0.16);
        drawCapFerretBunker(bunkerX, bunkerY, bunkerScale, sunProgress);

        // 7. Chemin central en perspective + Caillebotis en bois
        const pathTopW = width * 0.22;
        const pathBotW = width * 0.86;
        const pathHeight = height - crestY;

        ctx.fillStyle = lerpColor([243, 229, 208], [168, 152, 136], sunProgress * 0.7);
        ctx.beginPath();
        ctx.moveTo(sunX - pathTopW / 2, crestY);
        ctx.lineTo(sunX + pathTopW / 2, crestY);
        ctx.lineTo(sunX + pathBotW / 2, height);
        ctx.lineTo(sunX - pathBotW / 2, height);
        ctx.closePath();
        ctx.fill();

        // Lattes de caillebotis qui défilent en perspective
        const numSlats = 14;
        for (let i = 0; i < numSlats; i++) {
            const rawP = ((i / numSlats) + (worldScroll * 0.55)) % 1;
            const p = Math.pow(rawP, 1.65);
            const slatY = crestY + p * pathHeight;
            const currentPathW = pathTopW + p * (pathBotW - pathTopW);
            const slatW = currentPathW * 0.62;
            const slatH = Math.max(1.5, p * 6.5);

            ctx.fillStyle = `rgba(138, 118, 98, ${0.25 + p * 0.45})`;
            ctx.beginPath();
            ctx.roundRect(sunX - slatW / 2, slatY, slatW, slatH, 2);
            ctx.fill();
        }

        // 8. Pins maritimes et oyats sur les bords
        pines.forEach((pine) => {
            pine.progress = (pine.progress + dt * 0.28) % 1;
            // Évite de dessiner un pin pile devant le bunker en haut à gauche
            if (pine.side === -1 && pine.progress < 0.34) return;

            const p = Math.pow(pine.progress, 1.6);
            const py = crestY + p * pathHeight;
            const currentPathW = pathTopW + p * (pathBotW - pathTopW);
            const px = sunX + pine.side * (currentPathW * 0.58 + p * 35);
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

    function drawPlayer(dt) {
        runCycle += dt * 14;
        const bobY = Math.abs(Math.sin(runCycle)) * 4;
        const tilt = (player.targetLanePos - player.lanePos) * 0.35;

        const px = player.x;
        const py = player.y - bobY;

        if (Math.sin(runCycle) > 0.85 && isRunning) {
            particles.push({
                x: px + (Math.random() * 14 - 7),
                y: player.y + 18,
                vx: (Math.random() - 0.5) * 25,
                vy: 15 + Math.random() * 20,
                life: 0.6,
                color: 'rgba(210, 185, 150, 0.7)',
                size: 4 + Math.random() * 3
            });
        }

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(tilt);

        ctx.fillStyle = 'rgba(44, 35, 25, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 20 + bobY, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FAF6F0';
        ctx.beginPath();
        ctx.moveTo(-11, -2);
        ctx.lineTo(11, -2);
        ctx.lineTo(16, 17);
        ctx.lineTo(-16, 17);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#3B281E';
        ctx.beginPath();
        ctx.arc(0, -10, 10, 0, Math.PI * 2);
        ctx.fill();

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

        ctx.restore();
    }

    function finishGame(won) {
        isRunning = false;

        if (won) {
            if (!gamesWon.includes(item.day)) {
                gamesWon.push(item.day);
                localStorage.setItem(GAMES_WON_KEY, JSON.stringify(gamesWon));
            }
            addParticles(width / 2, height * 0.35, '#FFE099', 28);

            fsEndBadge.textContent = 'Sommet de la Dune • Cap Ferret';
            fsEndTitle.textContent = 'Quel Sunset ! ✨';
            fsEndDesc.textContent = "Tu es arrivée tout en haut juste avant que le soleil ne plonge dans l'Atlantique.";
            fsEndBtn.textContent = 'Découvrir mon mot du 4 décembre';
            fsEndBtn.onclick = () => {
                closeFullscreenGame();
                openModal(item);
            };
        } else {
            fsEndBadge.textContent = 'Trop tard...';
            fsEndTitle.textContent = 'Il fait nuit noire';
            fsEndDesc.textContent = "Les pommes de pin et les touristes en Fatbike t'ont ralentie dans le sable mou !";
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

        if (isRunning) {
            timeLeft = Math.max(0, timeLeft - dt);
            altitude = Math.min(100, altitude + dt * 5.8);
            worldScroll += dt;

            spawnTimer += dt;
            if (spawnTimer > 0.62) {
                spawnObstacle();
                spawnTimer = 0;
            }
        }

        ctx.save();
        if (screenShake > 0) {
            const dx = (Math.random() - 0.5) * screenShake;
            const dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
            screenShake = Math.max(0, screenShake - dt * 28);
        }

        const sunProgress = 1 - (timeLeft / totalTime);
        const geom = drawEnvironment(isRunning ? sunProgress : (altitude >= 100 ? 0.35 : 1), dt);

        player.lanePos += (player.targetLanePos - player.lanePos) * 0.18;
        player.y = height * 0.81;
        const playerPathWidth = geom.pathTopW + 0.81 * (geom.pathBotW - geom.pathTopW);
        player.x = geom.sunX + player.lanePos * (playerPathWidth * 0.42);

        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            if (isRunning) {
                obs.progress += obs.speed * dt;
            }

            const p = Math.pow(obs.progress, 1.55);
            const oy = geom.crestY + p * geom.pathHeight;
            const currentW = geom.pathTopW + p * (geom.pathBotW - geom.pathTopW);
            const ox = geom.sunX + obs.lane * (currentW * 0.42);
            const scale = 0.38 + p * 0.85;
            const radius = 20 * scale;

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

            if (isRunning && Math.hypot(ox - player.x, oy - player.y) < radius + 16) {
                altitude = Math.max(0, Math.min(100, altitude + obs.penalty));

                popups.push({
                    x: ox,
                    y: oy - 15,
                    text: obs.label,
                    bonus: obs.bonus,
                    life: 1.0
                });

                if (obs.bonus) {
                    addParticles(ox, oy, '#FFD166', 16);
                } else {
                    screenShake = 9;
                    addParticles(ox, oy, '#D4A373', 10);
                }

                obstacles.splice(i, 1);
                continue;
            }

            if (oy > height + 50) {
                obstacles.splice(i, 1);
            }
        }

        drawPlayer(dt);

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
            ctx.font = '600 13px Inter, sans-serif';
            const textW = ctx.measureText(pop.text).width;
            ctx.fillStyle = pop.bonus ? '#2C3E35' : '#1C1B19';
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
        fsTimer.textContent = `☀️ ${Math.ceil(timeLeft)}s`;

        if (isRunning) {
            if (altitude >= 100) {
                finishGame(true);
            } else if (timeLeft <= 0) {
                finishGame(false);
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
        window.removeEventListener('resize', resizeCanvas);
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