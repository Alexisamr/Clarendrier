/**
 * Passe DEV_MODE à `false` avant de lui donner le site en décembre.
 * Tant qu'il est sur `true`, tu peux ouvrir toutes les cases pour tester sur VS Code / Vercel.
 */
const DEV_MODE = true;

const STORAGE_KEY = 'advent_opened_days_v1';

// Contenu des 24 jours (facilement personnalisable)
const calendarData = Array.from({ length: 24 }, (_, i) => {
    const day = i + 1;
    return {
        day: day,
        title: `Surprise du ${day} décembre`,
        content: `Voici le petit mot ou l'indice pour la journée du ${day} décembre.`
    };
});

// Récupération des cases déjà ouvertes dans le localStorage de l'iPhone
let openedDays = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const gridEl = document.getElementById('calendar-grid');
const progressTextEl = document.getElementById('progress-text');
const modalOverlay = document.getElementById('modal-overlay');
const modalClose = document.getElementById('modal-close');
const modalDay = document.getElementById('modal-day');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const toastEl = document.getElementById('toast');

let toastTimeout;

// Vérifie si un jour peut être ouvert (Mois de décembre = 11 en JS)
function isDayUnlocked(dayNumber) {
    if (DEV_MODE) return true;
    const now = new Date();
    const currentMonth = now.getMonth(); // 0 = Janvier, 11 = Décembre
    const currentDate = now.getDate();

    return currentMonth === 11 && currentDate >= dayNumber;
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

function openModal(item) {
    modalDay.textContent = `${item.day} Décembre`;
    modalTitle.textContent = item.title;
    modalBody.innerHTML = item.content;
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
}

function closeModal() {
    modalOverlay.classList.remove('active');
    modalOverlay.setAttribute('aria-hidden', 'true');
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

// Fermeture de la modale
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// Initialisation
renderGrid();