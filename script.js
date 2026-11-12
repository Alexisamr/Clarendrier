// =========================================================
// MODE TEST : Laisse sur "true" pendant que tu crées le site.
// Passe-le sur "false" le 30 novembre !
// =========================================================
const DEV_MODE = true;
// En mode test, choisis quel jour tu veux simuler pour tester sa question (de 1 à 24) :
const SIMULATED_DAY = 1;

// =========================================================
// CONTENU ET QUESTION DE CHAQUE JOUR (1 à 24)
// =========================================================
const calendarData = [
  {
    day: 1,
    question: "Quelle est ma couleur préférée ?",
    answers: ["bleu", "le bleu"], // Toutes les variantes acceptées (en minuscules)
    subtitle: "Joyeux 1er décembre mon amour ❤️", // Change aussi le sous-titre de la page !
    title: "Joyeux 1er Décembre ❤️",
    image: "assets/icon.webp",
    coupon: "",
    text: "Bienvenue dans ton Clarendrier sur-mesure ! Chaque matin jusqu'à Noël, une nouvelle question et une nouvelle surprise t'attendent ici."
  },
  {
    day: 2,
    question: "Quel est le prénom de la plus belle copine du monde ?",
    answers: ["clara", "moi", "c'est moi"],
    subtitle: "Jour 2 : Déjà accro au Clarendrier ? ✨",
    title: "Bon Cadeau Spécial 🎟️",
    image: "",
    coupon: "BON POUR : Un massage de 20 minutes (sans râler)",
    text: "Prends une capture d'écran de ce bon, tu peux l'utiliser quand tu veux ce mois-ci !"
  },
  {
    day: 3,
    question: "Dans quel mois on s'est mis ensemble ?",
    answers: ["janvier", "en janvier"], // Adapte avec votre vrai mois !
    subtitle: "Encore 21 dodos avant Noël 🎄",
    title: "Un de mes souvenirs préférés",
    image: "",
    coupon: "",
    text: "Ajoute ici une photo de vous deux et une petite anecdote sur ce moment."
  }
];

// Complète automatiquement les jours 4 à 24 avec une question par défaut
for (let i = calendarData.length + 1; i <= 24; i++) {
  calendarData.push({
    day: i,
    question: "Quelle est ma couleur préférée ?",
    answers: ["bleu", "le bleu"],
    subtitle: `Jour ${i} : Une petite surprise t'attend ❤️`,
    title: i === 24 ? "Joyeux Réveillon mon amour ✨" : `Surprise du ${i} Décembre`,
    image: "",
    coupon: i === 10 ? "BON POUR : Soirée resto ou film de ton choix" : "",
    text: `Contenu du jour ${i} à venir... ❤️`
  });
}

// =========================================================
// DÉTECTION DU JOUR ACTUEL & ÉNIGME DU JOUR
// =========================================================
function getActiveDayNumber() {
  if (DEV_MODE) return SIMULATED_DAY;
  const now = new Date();
  if (now.getMonth() === 11) {
    return Math.min(now.getDate(), 24); // Entre 1 et 24 en décembre
  }
  return 1; // Avant décembre, prépare le jour 1
}

const activeDayNum = getActiveDayNumber();
const todayConfig = calendarData.find((d) => d.day === activeDayNum) || calendarData[0];

// Met à jour le sous-titre de la page principale selon le jour
document.getElementById("daily-subtitle").textContent = todayConfig.subtitle;

// Gestion du déverrouillage quotidien (une clé par jour : ex "clarendrier_auth_day_1")
const DAILY_AUTH_KEY = `clarendrier_auth_day_${activeDayNum}`;
const authOverlay = document.getElementById("auth-overlay");
const authCard = document.getElementById("auth-card");
const authForm = document.getElementById("auth-form");
const authInput = document.getElementById("auth-input");
const authError = document.getElementById("auth-error");

document.getElementById("auth-day-badge").textContent = `Énigme du ${activeDayNum} Décembre`;
document.getElementById("auth-question").textContent = todayConfig.question;

// Si elle a déjà répondu à la question d'AUJOURD'HUI, on masque l'écran
if (localStorage.getItem(DAILY_AUTH_KEY) === "true") {
  authOverlay.classList.add("hidden");
}

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const userAnswer = authInput.value.trim().toLowerCase();

  if (todayConfig.answers.includes(userAnswer)) {
    localStorage.setItem(DAILY_AUTH_KEY, "true");
    authOverlay.classList.add("hidden");
    authError.classList.add("hidden");

    if (typeof confetti === "function") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#f5d08a", "#ff6b8b", "#ffffff"]
      });
    }
  } else {
    authError.classList.remove("hidden");
    authCard.classList.remove("shake");
    void authCard.offsetWidth;
    authCard.classList.add("shake");
    authInput.value = "";
  }
});

// =========================================================
// LOGIQUE DU CALENDRIER ET SAUVEGARDE IPHONE (localStorage)
// =========================================================
const STORAGE_KEY = "advent_opened_days_2026";
let openedDays = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const grid = document.getElementById("calendar-grid");
const modalOverlay = document.getElementById("modal-overlay");
const closeModalBtn = document.getElementById("close-modal");
const toast = document.getElementById("toast");

function canOpenDay(dayNumber) {
  if (DEV_MODE) return true;
  const now = new Date();
  const isDecember = now.getMonth() === 11;
  return isDecember && now.getDate() >= dayNumber;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 2600);
}

function renderGrid() {
  grid.innerHTML = "";
  calendarData.forEach((item) => {
    const isOpened = openedDays.includes(item.day);
    const unlocked = canOpenDay(item.day);

    const card = document.createElement("div");
    card.className = `day-card ${isOpened ? "opened" : ""} ${item.day === 24 ? "day-24" : ""}`;

    let statusIcon = "🔒";
    if (isOpened) statusIcon = "✨";
    else if (unlocked) statusIcon = "🎁";

    card.innerHTML = `
      <span class="day-number">${item.day}</span>
      <span class="day-icon">${statusIcon}</span>
    `;

    card.addEventListener("click", () => handleCardClick(item, card));
    grid.appendChild(card);
  });
}

function handleCardClick(item, cardElement) {
  if (!canOpenDay(item.day)) {
    cardElement.classList.remove("shake");
    void cardElement.offsetWidth;
    cardElement.classList.add("shake");

    const now = new Date();
    const diff = item.day - now.getDate();
    const msg = now.getMonth() === 11 && diff > 0
      ? `Bien tenté ! Encore ${diff} jour${diff > 1 ? "s" : ""} à attendre 😘`
      : `Patience... rendez-vous le ${item.day} décembre ! 🎄`;
    showToast(msg);
    return;
  }

  if (!openedDays.includes(item.day)) {
    openedDays.push(item.day);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(openedDays));
    renderGrid();

    if (typeof confetti === "function") {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ["#f5d08a", "#ff6b8b", "#ffffff"]
      });
    }
  }

  openModal(item);
}

function openModal(item) {
  document.getElementById("modal-day").textContent = `${item.day} Décembre`;
  document.getElementById("modal-title").textContent = item.title;
  document.getElementById("modal-text").textContent = item.text;

  const mediaContainer = document.getElementById("modal-media-container");
  mediaContainer.innerHTML = "";

  if (item.image) {
    mediaContainer.innerHTML += `<img src="${item.image}" alt="Surprise du jour ${item.day}">`;
  }
  if (item.coupon) {
    mediaContainer.innerHTML += `<div class="coupon-box">${item.coupon}</div>`;
  }

  modalOverlay.classList.remove("hidden");
}

closeModalBtn.addEventListener("click", () => modalOverlay.classList.add("hidden"));
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) modalOverlay.classList.add("hidden");
});

// =========================================================
// BOUTON DE RÉINITIALISATION (MODE TEST UNIQUEMENT)
// =========================================================
const devToolbar = document.getElementById("dev-toolbar");
const resetBtn = document.getElementById("reset-btn");

if (DEV_MODE) {
  devToolbar.classList.remove("hidden");
  resetBtn.addEventListener("click", () => {
    localStorage.clear();
    window.location.reload();
  });
}

// =========================================================
// VÉRIFICATION AUTO DES MISES À JOUR SUR L'APP IPHONE
// =========================================================
// Quand elle rouvre l'app depuis son écran d'accueil iPhone le matin,
// on vérifie si le jour a changé pour afficher la nouvelle question !
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    const newDay = getActiveDayNumber();
    if (newDay !== activeDayNum) {
      window.location.reload();
    }
  }
});

// =========================================================
// ANIMATION DE NEIGE DOUCE EN ARRIÈRE-PLAN
// =========================================================
function initSnow() {
  const canvas = document.getElementById("snow-canvas");
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const flakes = Array.from({ length: 45 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 2.5 + 1,
    speed: Math.random() * 0.8 + 0.3,
    drift: Math.random() * 0.6 - 0.3
  }));

  function draw() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.beginPath();
    for (const f of flakes) {
      ctx.moveTo(f.x, f.y);
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      f.y += f.speed;
      f.x += f.drift;
      if (f.y > height) { f.y = -5; f.x = Math.random() * width; }
      if (f.x > width) f.x = 0;
      if (f.x < 0) f.x = width;
    }
    ctx.fill();
    requestAnimationFrame(draw);
  }
  draw();
}

renderGrid();
initSnow();