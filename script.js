// =========================================================
// MODE TEST : Laisse sur "true" pendant que tu crées le site.
// Passe-le sur "false" juste avant le 1er décembre !
// =========================================================
const DEV_MODE = true;

// =========================================================
// CONTENU DES 24 JOURS (Tu n'as plus qu'à personnaliser ça)
// =========================================================
const calendarData = [
  {
    day: 1,
    title: "Joyeux 1er Décembre ❤️",
    image: "assets/icon.webp", // Remplace par "assets/jour1.webp" quand tu veux
    coupon: "",
    text: "Bienvenue dans ton calendrier de l'Avent sur-mesure ! Chaque matin jusqu'à Noël, tu pourras débloquer une nouvelle case ici."
  },
  {
    day: 2,
    title: "Bon Cadeau Spécial 🎟️",
    image: "",
    coupon: "BON POUR : Un massage de 20 minutes (sans râler)",
    text: "Prends une capture d'écran de ce bon, tu peux l'utiliser quand tu veux ce mois-ci !"
  },
  {
    day: 3,
    title: "Un de mes souvenirs préférés",
    image: "",
    coupon: "",
    text: "Ajoute ici une photo de vous deux et une petite anecdote sur ce moment."
  },
  // Les jours 4 à 24 se génèrent automatiquement ci-dessous si tu ne les as pas encore remplis
];

// Complète automatiquement jusqu'à 24 pour que ta grille soit complète tout de suite
for (let i = calendarData.length + 1; i <= 24; i++) {
  calendarData.push({
    day: i,
    title: i === 24 ? "Joyeux Réveillon mon amour ✨" : `Surprise du ${i} Décembre`,
    image: "",
    coupon: i === 10 ? "BON POUR : Soirée resto ou film de ton choix" : "",
    text: `Contenu du jour ${i} à venir... ❤️`
  });
}

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
  const isDecember = now.getMonth() === 11; // 11 = Décembre en JS
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
    void cardElement.offsetWidth; // Relance l'animation CSS
    cardElement.classList.add("shake");

    const now = new Date();
    const diff = item.day - now.getDate();
    const msg = now.getMonth() === 11 && diff > 0
      ? `Bien tenté ! Encore ${diff} jour${diff > 1 ? "s" : ""} à attendre 😘`
      : `Patience... rendez-vous le ${item.day} décembre ! 🎄`;
    showToast(msg);
    return;
  }

  // Première ouverture : confettis + sauvegarde
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