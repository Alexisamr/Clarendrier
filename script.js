/**
 * Passe DEV_MODE à `false` avant de lui donner le site en décembre.
 */
const DEV_MODE = true;

const STORAGE_KEY = 'advent_opened_days_v1';
const GAMES_WON_KEY = 'advent_games_won_v1';
const GATE_AUTH_KEY = 'advent_gate_auth_v1';
const QUIZ_ANSWERS_KEY = 'advent_quiz_ete_answers_v1';
// Canal privé cloud (sans inscription) permettant à Alexis de recevoir et lire à distance
// ce que Clara tape sur son téléphone aux questions libres 1 et 4 :
const QUIZ_SYNC_TOPIC = 'clarendrier_alexis_clara_quiz_2025_v1';

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

/* =========================================================================
   ASSIGNATION FACILE DES SURPRISES PAR JOUR
   - Pour déplacer n'importe quelle surprise vers un autre jour plus tard
     (ex: mettre la surprise du jour 4 au jour 20), change simplement le numéro ici !
   ========================================================================= */
const DAY_ASSIGNMENTS = {
    1: 'spotify_just_two_of_us', // Jour 1 : Petit mot secret cliquable -> Spotify « Just the Two of Us »
    2: 'coupon_massage',         // Jour 2 : Ticket à découper « Bon pour un massage de tout le corps »
    3: 'quiz_ete',               // Jour 3 : Quiz « Tu te souviens de notre été ? »
    4: 'ferret_dune',            // Jour 4 : Mini-jeu « L'Ascension de la Dune » (Cap Ferret)
    5: 'coupon_chanson',         // Jour 5 : Ticket à découper « Bon pour une chanson à 2 où JE chante »
    6: 'scratch_photo_1'         // Jour 6 : Carte à gratter réaliste avec « image1.png »
};

/* =========================================================================
   CATALOGUE DES SURPRISES INTERCHANGEABLES
   ========================================================================= */
const SCRATCHED_CARDS_KEY = 'advent_scratched_cards_v1';

const SURPRISES_CATALOG = {
    scratch_photo_1: {
        game: "scratch_card",
        gameTitle: "Tickets d'Or à Gratter",
        gameSubtitle: "Surprise cachée • 2 Cartes à gratter",
        imageSrc: "/assets/image1.png",
        cards: [
            {
                id: "day6_img1",
                label: "Carte n°1",
                imageSrc: "/assets/image1.png",
                revealThreshold: 55,
                caption: ""
            },
            {
                id: "day6_img2",
                label: "Carte n°2",
                imageSrc: "/assets/image2.png",
                captionThreshold: 50,
                revealThreshold: 50,
                caption: "Notre première sortie tout les deux 😭"
            }
        ],
        content: "Notre première sortie tout les deux 😭"
    },

    spotify_just_two_of_us: {
        game: "spotify_link",
        secretKicker: "Petit mot secret",
        secretLabel: "Clique sur moi, surprise",
        spotifyUri: "spotify:track:5fdNHVZHbWB1AaXk4RBGVD",
        spotifyWebUrl: "https://open.spotify.com/track/5fdNHVZHbWB1AaXk4RBGVD",
        content: "Clique sur moi, surprise"
    },

    coupon_massage: {
        game: "coupon",
        theme: "red",
        gameTitle: "Ticket Cadeau à Découper",
        gameSubtitle: "Bon Exclusif • Ticket à découper",
        couponBadge: "BON CADEAU EXCLUSIF • N° 01",
        couponTitle: "Bon pour un massage de tout le corps",
        couponClause: "",
        couponStamp: "VALABLE À VIE • SUR SIMPLE DEMANDE ❤️",
        content: "Bon pour un massage de tout le corps"
    },

    coupon_chanson: {
        game: "coupon",
        theme: "pine",
        gameTitle: "Ticket Cadeau à Découper",
        gameSubtitle: "Bon Exclusif • Ticket à découper",
        couponBadge: "BON CADEAU EXCLUSIF • N° 02",
        couponTitle: "Bon pour une chanson à 2 où JE chante (chippie va)",
        couponClause: "(je choisie la musique parcontre hein faut pas abuser du loup qui se cache dans la bergerie)",
        couponStamp: "BON OFFICIEL • APPROUVÉ ❤️",
        content: "Bon pour une chanson à 2 où JE chante (chippie va)"
    },

    quiz_ete: {
        game: "quiz_ete",
        gameTitle: "Tu te souviens de notre été ?",
        gameSubtitle: "Quiz Souvenirs • 4 Questions",
        finalImage: "/assets/cap.png",
        finalMessage: "quizz terminé a demain ! (ce bunker dans mon cœur vrmt)",
        content: `quizz terminé a demain ! (ce bunker dans mon cœur vrmt)`,
        questions: [
            {
                id: "q1_mont_lachat",
                shortTitle: "Question 1 • Livre d'Or de la Croix du Mont Lachat (Annecy)",
                question: "Première question sérieuse (promis les autres ne le sont pas) Que pense tu que j'ai mis dans le livre d'Or de la Croix du Mont Lachat à coté d'Annecy ?",
                type: "text",
                placeholder: "Écris ce que tu penses ici...",
                feedback: "C'est bien noté dans mon petit carnet ❤️"
            },
            {
                id: "q2_arrivee_cap",
                shortTitle: "Question 2 • Arrivée au Cap",
                question: "Quel est la première chose que j'ai faite en arrivant au cap ?",
                type: "choice",
                options: [
                    {
                        label: "Je me suis enfuis (ta grand mère me faisait trop peur)",
                        isCorrect: false,
                        feedback: "alors oui c'est vrai ta grand mère me fait peur mais c'est pas ça."
                    },
                    {
                        label: "un bon petit pipi",
                        isCorrect: false,
                        feedback: "nan ça c'était sur le bunker (heureusement que tu m'a aidé (j'aurais besoin de ton aide de nouveau))"
                    },
                    {
                        label: "un bon gros caca",
                        isCorrect: false,
                        feedback: "malheureusement non je suis trop bien élever pour m'abaisser a ce niveau de répugnantise (spoiler : ruben va le faire à jade)"
                    },
                    {
                        label: "aucune de ces trois réponses",
                        isCorrect: true,
                        feedback: "Bonne réponse mais désolé ça n'était aucune de ces réponses moi même je m'en souviens plus mais regarde ce que je t'ai mis quand tu met les mauvaises réponses."
                    }
                ]
            },
            {
                id: "q3_mot_maxime",
                shortTitle: "Question 3 • Le mot de Maxime",
                question: "Quel était la mot préférer de Maxime durant ce séjour.",
                type: "choice",
                options: [
                    {
                        label: "alcool",
                        isCorrect: false,
                        feedback: "eh nan c'est toi ça (t'es mon alcoolique à moi)"
                    },
                    {
                        label: "eh mamie",
                        isCorrect: true,
                        feedback: "Bonne réponse ! C'était bien « eh mamie » !"
                    },
                    {
                        label: "finalement",
                        isCorrect: false,
                        feedback: "nan ça c'est mon mot pref."
                    }
                ]
            },
            {
                id: "q4_prochaines_vacances",
                shortTitle: "Question 4 • Nos prochaines vacances tous les deux",
                question: "Quand est-ce qu'on re part en vaccances tout les deux ?",
                type: "text",
                placeholder: "Dis-moi quand...",
                feedback: "C'est promis, je note ça précieusement ❤️"
            }
        ]
    },

    ferret_dune: {
        game: "ferret",
        gameTitle: "L'Ascension de la Dune",
        gameSubtitle: "Défi Cap Ferret",
        content: `Merci pour ces vacances au Cap Ferret ❤️`
    }
};

const calendarData = Array.from({ length: 24 }, (_, i) => {
    const day = i + 1;
    const assignedKey = DAY_ASSIGNMENTS[day];

    if (assignedKey && SURPRISES_CATALOG[assignedKey]) {
        return {
            day,
            surpriseKey: assignedKey,
            ...SURPRISES_CATALOG[assignedKey]
        };
    }

    return {
        day: day,
        game: null,
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

// Éléments Plein Écran (Jeu Dune Cap Ferret)
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

// Éléments Plein Écran (Quiz « Tu te souviens de notre été ? »)
const fsQuizOverlay = document.getElementById('fs-quiz-overlay');
const fsQuizCloseBtn = document.getElementById('fs-quiz-close-btn');
const fsQuizStepLabel = document.getElementById('fs-quiz-step-label');
const fsQuizDots = document.getElementById('fs-quiz-dots');
const fsQuizCard = document.getElementById('fs-quiz-card');
const fsQuizKicker = document.getElementById('fs-quiz-kicker');
const fsQuizQuestion = document.getElementById('fs-quiz-question');
const fsQuizInteraction = document.getElementById('fs-quiz-interaction');
const fsQuizFeedback = document.getElementById('fs-quiz-feedback');
const fsQuizNextBtn = document.getElementById('fs-quiz-next-btn');
const fsQuizFinalCard = document.getElementById('fs-quiz-final-card');
const fsQuizFinalMsg = document.getElementById('fs-quiz-final-msg');
const fsQuizFinishBtn = document.getElementById('fs-quiz-finish-btn');

// Éléments Plein Écran (Tickets / Coupons à découper)
const fsCouponOverlay = document.getElementById('fs-coupon-overlay');
const fsCouponCloseBtn = document.getElementById('fs-coupon-close-btn');
const couponTicket = document.getElementById('coupon-ticket');
const couponStub = document.getElementById('coupon-stub');
const couponSerialLeft = document.getElementById('coupon-serial-left');
const couponSerialRight = document.getElementById('coupon-serial-right');
const couponPerfZone = document.getElementById('coupon-perf-zone');
const couponCutLine = document.getElementById('coupon-cut-line');
const couponScissorsHandle = document.getElementById('coupon-scissors-handle');
const couponBadge = document.getElementById('coupon-badge');
const couponMainTitle = document.getElementById('coupon-main-title');
const couponClause = document.getElementById('coupon-clause');
const couponStamp = document.getElementById('coupon-stamp');
const couponDoneBtn = document.getElementById('coupon-done-btn');
const couponSparkles = document.getElementById('coupon-sparkles');

// Éléments Plein Écran (Carte à gratter virtuelle - Jour 6)
const fsScratchOverlay = document.getElementById('fs-scratch-overlay');
const fsScratchCloseBtn = document.getElementById('fs-scratch-close-btn');
const fsScratchTopLabel = document.getElementById('fs-scratch-top-label');
const scratchCardTabs = document.getElementById('scratch-card-tabs');
const scratchSerial = document.getElementById('scratch-serial');
const scratchHeaderTitle = document.getElementById('scratch-header-title');
const scratchViewport = document.getElementById('scratch-viewport');
const scratchUnderImg = document.getElementById('scratch-under-img');
const scratchFoilCanvas = document.getElementById('scratch-foil-canvas');
const scratchFxCanvas = document.getElementById('scratch-fx-canvas');
const scratchPhotoCaption = document.getElementById('scratch-photo-caption');
const scratchFooterText = document.getElementById('scratch-footer-text');
const scratchDoneBtn = document.getElementById('scratch-done-btn');

let scratchedCardIds = JSON.parse(localStorage.getItem(SCRATCHED_CARDS_KEY) || '[]');

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

        // Mot de passe secret pour Alexis s'il veut voir les réponses de Clara dès l'accueil
        if (userVal === 'alexis' || userVal === 'admin') {
            localStorage.setItem(GATE_AUTH_KEY, JSON.stringify({
                unlockedAt: Date.now()
            }));
            gateError.textContent = '';
            gateInput.blur();
            gateOverlay.style.transition = '';
            gateOverlay.classList.add('unlocked');
            gateOverlay.setAttribute('aria-hidden', 'true');
            openSecretAnswersModal();
            return;
        }

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

/* =========================================================================
   SAUVEGARDE & SYNCHRONISATION À DISTANCE DES RÉPONSES LIBRES DE CLARA
   - Sauvegarde locale dans localStorage
   - Envoi silencieux en arrière-plan sur le canal cloud pour qu'Alexis
     puisse lire les réponses depuis son propre téléphone (en touchant 3 fois
     « Pour ma Clara » en bas de la page ou en tapant "alexis" à l'entrée)
   ========================================================================= */
function getSavedQuizAnswers() {
    try {
        return JSON.parse(localStorage.getItem(QUIZ_ANSWERS_KEY)) || {};
    } catch {
        return {};
    }
}

function saveAndSyncQuizAnswer(questionId, shortTitle, answerText, quizTitle = '') {
    const cleaned = (answerText || '').trim();
    if (!cleaned) return;

    const current = getSavedQuizAnswers();
    const existing = current[questionId];

    // Conserve l'historique de tous les choix cliqués par Clara sur une même question
    const history = (existing && Array.isArray(existing.history)) ? [...existing.history] : [];
    if (history[history.length - 1] !== cleaned) {
        history.push(cleaned);
    }

    const formattedAnswer = history.length > 1
        ? history.map((ans, idx) => `${idx === 0 ? '1er choix' : `Choix ${idx + 1}`} : ${ans}`).join('\n')
        : cleaned;

    const entry = {
        questionId,
        quizTitle,
        shortTitle,
        answer: formattedAnswer,
        history,
        date: new Date().toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }),
        timestamp: Date.now()
    };
    current[questionId] = entry;
    localStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(current));

    // Envoi silencieux sur le canal cloud pour qu'Alexis puisse voir toutes les réponses depuis son téléphone
    try {
        fetch(`https://ntfy.sh/${QUIZ_SYNC_TOPIC}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Title': `Reponse de Clara - ${shortTitle}`
            },
            body: JSON.stringify(entry)
        }).catch(() => {});
    } catch {
        // Ignore si hors-ligne
    }
}

async function openSecretAnswersModal() {
    modalDay.textContent = `Carnet secret • Réponses de Clara`;
    modalBody.innerHTML = `<div style="font-size:0.88rem;color:var(--text-secondary);">Récupération des réponses de Clara…</div>`;
    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');

    const combinedMap = { ...getSavedQuizAnswers() };

    try {
        const res = await fetch(`https://ntfy.sh/${QUIZ_SYNC_TOPIC}/json?poll=1`);
        if (res.ok) {
            const text = await res.text();
            const lines = text.split('\n').filter(Boolean);
            lines.forEach((line) => {
                try {
                    const pkt = JSON.parse(line);
                    if (pkt && pkt.event === 'message' && pkt.message) {
                        const parsed = JSON.parse(pkt.message);
                        if (parsed && parsed.questionId && parsed.answer) {
                            const existing = combinedMap[parsed.questionId];
                            if (!existing || (parsed.timestamp || 0) >= (existing.timestamp || 0)) {
                                combinedMap[parsed.questionId] = parsed;
                            }
                        }
                    }
                } catch {
                    // Ignore ligne malformée
                }
            });
        }
    } catch {
        // Fallback sur localStorage si pas de réseau
    }

    const entries = Object.values(combinedMap).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
    if (!entries.length) {
        modalBody.innerHTML = `
            <div style="padding:12px 0;color:var(--text-secondary);">
                Clara n'a pas encore répondu aux quiz.
                Dès qu'elle cliquera ou écrira une réponse sur son téléphone, tout s'affichera ici !
            </div>
        `;
        return;
    }

    const listEl = document.createElement('div');
    listEl.className = 'secret-answers-list';

    entries.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'secret-answer-item';
        const headerLabel = item.quizTitle
            ? `${item.quizTitle} — ${item.shortTitle || item.questionId}`
            : (item.shortTitle || item.questionId);
        div.innerHTML = `
            <div class="secret-answer-q"></div>
            <div class="secret-answer-a"></div>
            <div class="secret-answer-date">Enregistré le ${item.date || ''}</div>
        `;
        div.querySelector('.secret-answer-q').textContent = headerLabel;
        div.querySelector('.secret-answer-a').textContent = item.answer;
        listEl.appendChild(div);
    });

    modalBody.innerHTML = '';
    modalBody.appendChild(listEl);
}

/* =========================================================================
   QUIZ PLEIN ÉCRAN : SYSTÈME GÉNÉRIQUE POUR TOUS LES QUIZ / QCM
   ========================================================================= */
function closeFullscreenQuiz() {
    fsQuizOverlay.classList.remove('active');
    fsQuizOverlay.setAttribute('aria-hidden', 'true');
}

if (fsQuizCloseBtn) {
    fsQuizCloseBtn.addEventListener('click', closeFullscreenQuiz);
}
if (fsQuizFinishBtn) {
    fsQuizFinishBtn.addEventListener('click', closeFullscreenQuiz);
}

function launchFullscreenQuiz(item) {
    stopActiveGame();
    const questions = item.questions || [];
    if (!questions.length) return;

    let currentIndex = 0;

    fsQuizOverlay.classList.add('active');
    fsQuizOverlay.setAttribute('aria-hidden', 'false');
    fsQuizCard.hidden = false;
    fsQuizFinalCard.hidden = true;

    function renderDots() {
        fsQuizDots.innerHTML = '';
        questions.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.className = 'fs-quiz-dot';
            if (idx < currentIndex) dot.classList.add('done');
            else if (idx === currentIndex) dot.classList.add('active');
            fsQuizDots.appendChild(dot);
        });
    }

    function renderCurrentQuestion() {
        const q = questions[currentIndex];
        const qTitle = q.shortTitle || `Question ${currentIndex + 1}`;
        const quizTitle = item.gameTitle || `Jour ${item.day}`;

        fsQuizStepLabel.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
        fsQuizKicker.textContent = item.gameTitle || 'Tu te souviens de notre été ?';
        fsQuizQuestion.textContent = q.question;
        fsQuizInteraction.innerHTML = '';
        fsQuizFeedback.hidden = true;
        fsQuizFeedback.textContent = '';
        fsQuizFeedback.className = 'fs-quiz-feedback';
        fsQuizNextBtn.hidden = true;
        fsQuizNextBtn.textContent = (currentIndex === questions.length - 1)
            ? 'Voir la surprise finale'
            : 'Passer à la question suivante';

        renderDots();

        if (q.type === 'text') {
            const saved = getSavedQuizAnswers()[q.id];
            const textarea = document.createElement('textarea');
            textarea.className = 'quiz-textarea';
            textarea.placeholder = q.placeholder || 'Écris ta réponse ici...';
            if (saved && saved.answer) {
                textarea.value = Array.isArray(saved.history) && saved.history.length
                    ? saved.history[saved.history.length - 1]
                    : saved.answer;
            }

            const validateBtn = document.createElement('button');
            validateBtn.type = 'button';
            validateBtn.className = 'btn-sober';
            validateBtn.textContent = 'Valider ma réponse';

            const handleValidate = () => {
                const val = textarea.value.trim();
                if (!val) {
                    fsQuizFeedback.hidden = false;
                    fsQuizFeedback.className = 'fs-quiz-feedback is-wrong';
                    fsQuizFeedback.textContent = 'Écris un petit mot avant de valider 😊';
                    textarea.focus();
                    return;
                }

                saveAndSyncQuizAnswer(q.id, qTitle, val, quizTitle);
                textarea.blur();

                fsQuizFeedback.hidden = false;
                fsQuizFeedback.className = 'fs-quiz-feedback is-correct';
                fsQuizFeedback.textContent = q.feedback || 'Réponse enregistrée ❤️';
                validateBtn.hidden = true;
                fsQuizNextBtn.hidden = false;
            };

            validateBtn.addEventListener('click', handleValidate);
            fsQuizInteraction.appendChild(textarea);
            fsQuizInteraction.appendChild(validateBtn);
        } else if (q.type === 'choice') {
            let hasUnlockedNext = false;

            q.options.forEach((opt) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'quiz-option-btn';
                btn.textContent = opt.label;

                btn.addEventListener('click', () => {
                    // Enregistre chaque clic de Clara (son 1er choix + les suivants) dans le Carnet secret
                    saveAndSyncQuizAnswer(q.id, qTitle, opt.label, quizTitle);

                    // On laisse les boutons cliquables même après avoir trouvé la bonne réponse
                    // pour que Clara puisse lire les phrases drôles des mauvaises réponses !
                    Array.from(fsQuizInteraction.querySelectorAll('.quiz-option-btn')).forEach((b) => {
                        if (b !== btn && !b.dataset.correctClicked) {
                            b.classList.remove('selected-wrong');
                        }
                    });

                    fsQuizFeedback.hidden = false;
                    fsQuizFeedback.textContent = opt.feedback;

                    if (opt.isCorrect) {
                        btn.classList.remove('selected-wrong');
                        btn.classList.add('selected-correct');
                        btn.dataset.correctClicked = 'true';
                        fsQuizFeedback.className = 'fs-quiz-feedback is-correct';
                        hasUnlockedNext = true;
                        fsQuizNextBtn.hidden = false;
                    } else {
                        btn.classList.add('selected-wrong');
                        fsQuizFeedback.className = 'fs-quiz-feedback is-wrong';
                        if (hasUnlockedNext) {
                            fsQuizNextBtn.hidden = false;
                        }
                    }
                });

                fsQuizInteraction.appendChild(btn);
            });
        }
    }

    fsQuizNextBtn.onclick = () => {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderCurrentQuestion();
        } else {
            // Fin du quiz : on enregistre la victoire et on ouvre la pop-up finale avec cap.png
            if (!gamesWon.includes(item.day)) {
                gamesWon.push(item.day);
                localStorage.setItem(GAMES_WON_KEY, JSON.stringify(gamesWon));
            }
            fsQuizStepLabel.textContent = 'Quiz terminé !';
            fsQuizDots.innerHTML = '';
            questions.forEach(() => {
                const dot = document.createElement('span');
                dot.className = 'fs-quiz-dot done';
                fsQuizDots.appendChild(dot);
            });

            fsQuizCard.hidden = true;
            fsQuizFinalCard.hidden = false;
            if (fsQuizFinalMsg) {
                fsQuizFinalMsg.textContent = item.finalMessage || 'quizz terminé a demain ! (ce bunker dans mon cœur vrmt)';
            }

            // Met à jour la modale du jour en arrière-plan
            openModal(item);
        }
    };

    renderCurrentQuestion();
}

/* =========================================================================
   TICKETS / COUPONS À DÉCOUPER EN PLEIN ÉCRAN (JOURS 2 & 5)
   ========================================================================= */
let activeCouponCleanup = null;

function closeFullscreenCoupon() {
    if (activeCouponCleanup) {
        activeCouponCleanup();
        activeCouponCleanup = null;
    }
    if (fsCouponOverlay) {
        fsCouponOverlay.classList.remove('active');
        fsCouponOverlay.setAttribute('aria-hidden', 'true');
    }
}

if (fsCouponCloseBtn) {
    fsCouponCloseBtn.addEventListener('click', closeFullscreenCoupon);
}
if (couponDoneBtn) {
    couponDoneBtn.addEventListener('click', closeFullscreenCoupon);
}

function spawnCouponSparkles() {
    if (!couponSparkles) return;
    couponSparkles.innerHTML = '';
    const colors = ['#C59B5F', '#E8D5B5', '#9E2A2B', '#1E352B', '#F7D046'];

    for (let i = 0; i < 28; i++) {
        const dot = document.createElement('span');
        dot.className = 'coupon-sparkle-dot';
        const angle = (Math.PI * 2 * i) / 28 + (Math.random() - 0.5) * 0.3;
        const dist = 55 + Math.random() * 120;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist - 20;
        dot.style.left = `${45 + (Math.random() - 0.5) * 30}%`;
        dot.style.top = '38%';
        dot.style.backgroundColor = colors[i % colors.length];
        dot.style.setProperty('--tx', `${tx.toFixed(1)}px`);
        dot.style.setProperty('--ty', `${ty.toFixed(1)}px`);
        couponSparkles.appendChild(dot);
    }
}

function launchFullscreenCoupon(item) {
    stopActiveGame();
    if (activeCouponCleanup) {
        activeCouponCleanup();
        activeCouponCleanup = null;
    }

    fsCouponOverlay.classList.add('active');
    fsCouponOverlay.setAttribute('aria-hidden', 'false');

    // Configuration visuelle du ticket selon le jour
    couponTicket.classList.remove('is-torn', 'theme-pine');
    if (item.theme === 'pine') {
        couponTicket.classList.add('theme-pine');
    }

    couponStub.style.transform = '';
    couponStub.style.opacity = '';
    couponSerialLeft.textContent = `N° 00${item.day}`;
    couponSerialRight.textContent = `${item.day} DÉC.`;
    couponBadge.textContent = item.couponBadge || 'BON CADEAU EXCLUSIF';
    couponMainTitle.textContent = item.couponTitle || item.content;

    if (item.couponClause) {
        couponClause.hidden = false;
        couponClause.textContent = item.couponClause;
    } else {
        couponClause.hidden = true;
        couponClause.textContent = '';
    }

    couponStamp.textContent = item.couponStamp || 'VALABLE À VIE ❤️';
    couponDoneBtn.hidden = true;

    let cutProgress = 0; // 0 à 1
    let isDragging = false;
    let isTorn = false;

    function updateCutVisuals(progress) {
        cutProgress = Math.max(0, Math.min(1, progress));
        const pct = cutProgress * 100;
        couponCutLine.style.width = `${pct.toFixed(1)}%`;

        // Déplace les ciseaux le long de la ligne pointillée (de 22px à largeur - 22px)
        const rect = couponPerfZone.getBoundingClientRect();
        const minX = 22;
        const maxX = Math.max(minX + 10, rect.width - 22);
        const handleX = minX + (maxX - minX) * cutProgress;
        couponScissorsHandle.style.left = `${handleX.toFixed(1)}px`;

        if (!isTorn) {
            // Le talon supérieur se soulève et s'incline au fur et à mesure qu'on découpe
            const liftY = -cutProgress * 12;
            const tiltDeg = cutProgress * 4.5;
            couponStub.style.transform = `translateY(${liftY.toFixed(1)}px) rotate(${tiltDeg.toFixed(2)}deg)`;
        }
    }

    function completeTearOff() {
        if (isTorn) return;
        isTorn = true;
        isDragging = false;
        updateCutVisuals(1);

        couponStub.style.transform = '';
        couponTicket.classList.add('is-torn');
        couponDoneBtn.hidden = false;
        spawnCouponSparkles();

        if (!gamesWon.includes(item.day)) {
            gamesWon.push(item.day);
            localStorage.setItem(GAMES_WON_KEY, JSON.stringify(gamesWon));
        }

        // Enregistre aussi dans le carnet secret que Clara a découpé son bon !
        saveAndSyncQuizAnswer(
            `coupon_jour_${item.day}`,
            `Bon découpé (Jour ${item.day})`,
            `Ticket découpé : « ${item.couponTitle} »`,
            `Surprise Jour ${item.day}`
        );

        // Met à jour la modale du jour en arrière-plan
        openModal(item);
    }

    function handlePointerX(clientX) {
        if (isTorn) return;
        const rect = couponPerfZone.getBoundingClientRect();
        const pad = 22;
        const usableW = Math.max(40, rect.width - pad * 2);
        const rel = (clientX - (rect.left + pad)) / usableW;

        // Empêche de sauter directement à 100% en cliquant tout à droite sans glisser
        if (rel - cutProgress > 0.45) {
            updateCutVisuals(cutProgress + 0.22);
        } else if (rel > cutProgress) {
            updateCutVisuals(rel);
        }

        if (cutProgress >= 0.86) {
            completeTearOff();
        }
    }

    const onTouchStart = (e) => {
        if (isTorn) return;
        isDragging = true;
        if (e.touches && e.touches.length > 0) {
            handlePointerX(e.touches[0].clientX);
        }
    };

    const onTouchMove = (e) => {
        if (!isDragging || isTorn) return;
        if (e.touches && e.touches.length > 0) {
            handlePointerX(e.touches[0].clientX);
        }
    };

    const onTouchEnd = () => {
        isDragging = false;
    };

    const onMouseDown = (e) => {
        if (isTorn) return;
        isDragging = true;
        handlePointerX(e.clientX);
    };

    const onMouseMove = (e) => {
        if (!isDragging || isTorn) return;
        handlePointerX(e.clientX);
    };

    const onMouseUp = () => {
        isDragging = false;
    };

    // Permet aussi de tapoter les ciseaux pour avancer cran par cran si besoin
    const onScissorsClick = () => {
        if (isTorn) return;
        updateCutVisuals(cutProgress + 0.28);
        if (cutProgress >= 0.86) {
            completeTearOff();
        }
    };

    couponPerfZone.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    couponPerfZone.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    couponScissorsHandle.addEventListener('click', onScissorsClick);

    requestAnimationFrame(() => updateCutVisuals(0));

    activeCouponCleanup = () => {
        couponPerfZone.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        couponPerfZone.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        couponScissorsHandle.removeEventListener('click', onScissorsClick);
    };
}

/* Ouvre la modale du jour avec la petite box cliquable pour le jeu, le quiz ou le coupon */
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
    } else if (item.game === 'quiz_ete') {
        if (hasWon) {
            const wonWrap = document.createElement('div');
            wonWrap.style.marginBottom = '16px';
            wonWrap.innerHTML = `
                <div class="fs-quiz-photo-frame" style="margin: 4px 0 12px;">
                    <img src="${item.finalImage || '/assets/cap.png'}" alt="Souvenir Cap Ferret" class="fs-quiz-photo" style="max-height: 240px;" />
                </div>
                <div style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; color: var(--text-primary);">
                    ${item.finalMessage}
                </div>
            `;
            modalBody.appendChild(wonWrap);
        }

        const quizBox = document.createElement('div');
        quizBox.className = 'quiz-launch-box';
        quizBox.innerHTML = `
            <div class="quiz-launch-content">
                <span class="quiz-launch-tag">${item.gameSubtitle}</span>
                <h3 class="quiz-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>${hasWon ? '↺ Refaire le quiz en plein écran' : '▶ Commencer le quiz'}</span>
                </div>
            </div>
        `;
        quizBox.addEventListener('click', () => {
            launchFullscreenQuiz(item);
        });
        modalBody.appendChild(quizBox);
    } else if (item.game === 'coupon') {
        if (hasWon) {
            const miniCard = document.createElement('div');
            miniCard.className = 'coupon-mini-preview';
            miniCard.innerHTML = `
                <span class="coupon-mini-kicker">${item.couponBadge || 'BON CADEAU DÉCOUPÉ'}</span>
                <div class="coupon-mini-title"></div>
                ${item.couponClause ? '<div class="coupon-mini-clause"></div>' : ''}
            `;
            miniCard.querySelector('.coupon-mini-title').textContent = item.couponTitle;
            if (item.couponClause) {
                miniCard.querySelector('.coupon-mini-clause').textContent = item.couponClause;
            }
            modalBody.appendChild(miniCard);
        }

        const couponBox = document.createElement('div');
        couponBox.className = 'coupon-launch-box';
        if (item.theme === 'pine') {
            couponBox.style.background = 'linear-gradient(145deg, #1E352B 0%, #15271F 100%)';
            couponBox.style.boxShadow = '0 14px 30px -8px rgba(30, 53, 43, 0.28)';
        }
        couponBox.innerHTML = `
            <div class="quiz-launch-content">
                <span class="quiz-launch-tag">${item.gameSubtitle}</span>
                <h3 class="quiz-launch-title">${item.gameTitle}</h3>
                <div class="game-launch-cta">
                    <span>${hasWon ? '✂️ Revoir / Redécouper mon ticket' : '✂️ Découper mon ticket cadeau'}</span>
                </div>
            </div>
        `;
        couponBox.addEventListener('click', () => {
            launchFullscreenCoupon(item);
        });
        modalBody.appendChild(couponBox);
    } else if (item.game === 'spotify_link') {
        const noteLink = document.createElement('a');
        noteLink.className = 'secret-music-note';
        noteLink.href = item.spotifyWebUrl || 'https://open.spotify.com/track/5fdNHVZHbWB1AaXk4RBGVD';
        noteLink.target = '_blank';
        noteLink.rel = 'noopener noreferrer';
        noteLink.innerHTML = `
            <div class="secret-music-seal" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.3 9.2L21.5 11.5L14.3 13.8L12 21L9.7 13.8L2.5 11.5L9.7 9.2L12 2Z" fill="#E8D5B5"/>
                </svg>
            </div>
            <span class="secret-music-kicker">${item.secretKicker || 'Petit mot secret'}</span>
            <span class="secret-music-title">${item.secretLabel || 'Clique sur moi, surprise'}</span>
        `;

        noteLink.addEventListener('click', (e) => {
            if (!gamesWon.includes(item.day)) {
                gamesWon.push(item.day);
                localStorage.setItem(GAMES_WON_KEY, JSON.stringify(gamesWon));
            }

            saveAndSyncQuizAnswer(
                `spotify_jour_${item.day}`,
                `Surprise musicale (Jour ${item.day})`,
                `A cliqué sur « ${item.secretLabel || 'Clique sur moi, surprise'} » (Just the Two of Us)`,
                `Surprise Jour ${item.day}`
            );

            // Sur téléphone (iPhone / Android), ouvre directement l'application Spotify sur la musique
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
            if (isMobile && item.spotifyUri) {
                e.preventDefault();
                window.location.href = item.spotifyUri;
                setTimeout(() => {
                    if (!document.hidden) {
                        window.location.href = item.spotifyWebUrl;
                    }
                }, 650);
            }
        });

        modalBody.appendChild(noteLink);
    } else if (item.game === 'scratch_card') {
        const cards = Array.isArray(item.cards) && item.cards.length > 0
            ? item.cards
            : [{ id: `day${item.day}_img1`, label: 'Carte à gratter', imageSrc: item.imageSrc || '/assets/image1.png', revealThreshold: 55, caption: '' }];

        let anyScratched = false;

        // Affiche les cartes déjà grattées dans la modale
        cards.forEach((card, idx) => {
            if (scratchedCardIds.includes(card.id)) {
                anyScratched = true;
                const wonWrap = document.createElement('div');
                wonWrap.style.marginBottom = '18px';
                wonWrap.innerHTML = `
                    <div class="fs-quiz-photo-frame" style="margin: 4px 0 8px;">
                        <img src="${card.imageSrc}" alt="Souvenir découvert ${idx + 1}" class="fs-quiz-photo" style="max-height: 290px; width: 100%; object-fit: cover;" />
                    </div>
                    ${card.caption ? `<div style="font-family: var(--font-serif); font-size: 1.25rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">${card.caption}</div>` : ''}
                `;
                modalBody.appendChild(wonWrap);
            }
        });

        cards.forEach((card, idx) => {
            const isCardScratched = scratchedCardIds.includes(card.id);
            const scratchBox = document.createElement('div');
            scratchBox.className = 'scratch-launch-box';
            scratchBox.innerHTML = `
                <div class="quiz-launch-content">
                    <span class="quiz-launch-tag">${cards.length > 1 ? `Ticket ${idx + 1} sur ${cards.length}` : item.gameSubtitle}</span>
                    <h3 class="quiz-launch-title">${cards.length > 1 ? `${card.label} à Gratter` : item.gameTitle}</h3>
                    <div class="game-launch-cta">
                        <span>${isCardScratched ? `🪙 Regratter la ${card.label.toLowerCase()}` : `🪙 Gratter la ${card.label.toLowerCase()} en plein écran`}</span>
                    </div>
                </div>
            `;
            scratchBox.addEventListener('click', () => {
                launchFullscreenScratchCard(item, idx);
            });
            modalBody.appendChild(scratchBox);
        });

        if (anyScratched) {
            const closeBtnBottom = document.createElement('button');
            closeBtnBottom.type = 'button';
            closeBtnBottom.className = 'btn-sober';
            closeBtnBottom.style.marginTop = '16px';
            closeBtnBottom.textContent = 'Fermer';
            closeBtnBottom.addEventListener('click', closeModal);
            modalBody.appendChild(closeBtnBottom);
        }
    } else {
        modalBody.innerHTML = `<div>${item.content}</div>`;
    }

    modalOverlay.classList.add('active');
    modalOverlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
        modalBody.scrollTop = 0;
    });
}

/* =========================================================================
   CARTE À GRATTER VIRTUELLE HAUTE FIDÉLITÉ (JOUR 6 : IMAGE1.PNG & IMAGE2.PNG)
   - Texture métallisée dorée réaliste + médaillon gaufré
   - Bords de grattage crantés façon pièce de monnaie
   - Copeaux d'or physiques qui s'envolent et tombent sous le doigt + pièce 3D
   - Synthèse sonore douce de grattage papier/métal (Web Audio API)
   - Pour image2.png : affiche « Notre première sortie tout les deux 😭 » dès 50% gratté
   ========================================================================= */
let activeScratchCleanup = null;

function closeFullscreenScratchCard() {
    if (activeScratchCleanup) {
        activeScratchCleanup();
        activeScratchCleanup = null;
    }
    if (fsScratchOverlay) {
        fsScratchOverlay.classList.remove('active');
        fsScratchOverlay.setAttribute('aria-hidden', 'true');
    }
}

if (fsScratchCloseBtn) {
    fsScratchCloseBtn.addEventListener('click', closeFullscreenScratchCard);
}

function launchFullscreenScratchCard(item, startCardIndex = 0) {
    stopActiveGame();
    if (activeScratchCleanup) {
        activeScratchCleanup();
        activeScratchCleanup = null;
    }

    const cards = Array.isArray(item.cards) && item.cards.length > 0
        ? item.cards
        : [{ id: `day${item.day}_img1`, label: 'Carte n°1', imageSrc: item.imageSrc || '/assets/image1.png', revealThreshold: 55, caption: '' }];

    let currentCardIndex = Math.max(0, Math.min(cards.length - 1, startCardIndex));

    fsScratchOverlay.classList.add('active');
    fsScratchOverlay.setAttribute('aria-hidden', 'false');

    const foilCtx = scratchFoilCanvas.getContext('2d', { willReadFrequently: true });
    const fxCtx = scratchFxCanvas.getContext('2d');

    let vw = 300;
    let vh = 400;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Synthèse audio Web Audio API pour le bruit réaliste de pièce qui gratte
    let audioCtx = null;
    let scratchGain = null;
    let scratchFilter = null;
    let soundTimeout = null;

    function triggerScratchSound(speed) {
        try {
            if (!audioCtx) {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                audioCtx = new AudioContextClass();

                const bufferSize = audioCtx.sampleRate * 1.5;
                const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
                const output = noiseBuffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    output[i] = (Math.random() * 2 - 1) * 0.65;
                }

                const whiteNoise = audioCtx.createBufferSource();
                whiteNoise.buffer = noiseBuffer;
                whiteNoise.loop = true;

                scratchFilter = audioCtx.createBiquadFilter();
                scratchFilter.type = 'bandpass';
                scratchFilter.frequency.value = 1600;
                scratchFilter.Q.value = 2.4;

                scratchGain = audioCtx.createGain();
                scratchGain.gain.value = 0;

                whiteNoise.connect(scratchFilter);
                scratchFilter.connect(scratchGain);
                scratchGain.connect(audioCtx.destination);
                whiteNoise.start(0);
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const normSpeed = Math.min(1, speed / 26);
            const targetGain = 0.015 + normSpeed * 0.055;
            const targetFreq = 1200 + normSpeed * 1400;

            scratchFilter.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.02);
            scratchGain.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.015);

            clearTimeout(soundTimeout);
            soundTimeout = setTimeout(() => {
                if (scratchGain && audioCtx) {
                    scratchGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.03);
                }
            }, 60);
        } catch {
            // Ignore si l'audio est bloqué
        }
    }

    let isScratching = false;
    let isRevealed = false;
    let captionShown = false;
    let lastPt = null;
    let pointerPos = null;
    let strokeCount = 0;
    const shavings = []; // Copeaux de dorure et paillettes

    function renderTabs() {
        if (!scratchCardTabs) return;
        if (cards.length <= 1) {
            scratchCardTabs.hidden = true;
            scratchCardTabs.innerHTML = '';
            return;
        }
        scratchCardTabs.hidden = false;
        scratchCardTabs.innerHTML = '';
        cards.forEach((c, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `scratch-tab-btn${idx === currentCardIndex ? ' active' : ''}`;
            const doneMark = scratchedCardIds.includes(c.id) ? ' ✨' : '';
            btn.textContent = `${c.label || `Photo ${idx + 1}`}${doneMark}`;
            btn.addEventListener('click', () => {
                if (idx !== currentCardIndex) {
                    loadCard(idx);
                }
            });
            scratchCardTabs.appendChild(btn);
        });
    }

    // Dessine une pellicule dorée métallisée ultra-réaliste
    function renderMetallicGoldFoil(card, idx) {
        const rect = scratchViewport.getBoundingClientRect();
        vw = Math.max(240, Math.round(rect.width));
        vh = Math.max(300, Math.round(rect.height));

        scratchFoilCanvas.width = vw * dpr;
        scratchFoilCanvas.height = vh * dpr;
        foilCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        scratchFxCanvas.width = vw * dpr;
        scratchFxCanvas.height = vh * dpr;
        fxCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        foilCtx.globalCompositeOperation = 'source-over';

        // 1. Dégradé métallique or brossé en diagonale
        const grad = foilCtx.createLinearGradient(0, 0, vw, vh);
        grad.addColorStop(0.0, '#B78C4C');
        grad.addColorStop(0.18, '#E4C992');
        grad.addColorStop(0.34, '#FAF0D4');
        grad.addColorStop(0.50, '#C59B5F');
        grad.addColorStop(0.68, '#9D7336');
        grad.addColorStop(0.84, '#E8CF9C');
        grad.addColorStop(1.0, '#B68A49');
        foilCtx.fillStyle = grad;
        foilCtx.fillRect(0, 0, vw, vh);

        // 2. Reflet spéculaire secondaire
        const sheen = foilCtx.createRadialGradient(vw * 0.35, vh * 0.28, 10, vw * 0.5, vh * 0.5, vw * 0.85);
        sheen.addColorStop(0, 'rgba(255, 250, 235, 0.38)');
        sheen.addColorStop(0.5, 'rgba(255, 245, 215, 0.08)');
        sheen.addColorStop(1, 'rgba(110, 75, 25, 0.18)');
        foilCtx.fillStyle = sheen;
        foilCtx.fillRect(0, 0, vw, vh);

        // 3. Stries fines d'aluminium/or brossé
        foilCtx.save();
        foilCtx.strokeStyle = 'rgba(255, 252, 240, 0.14)';
        foilCtx.lineWidth = 0.7;
        for (let y = -vh; y < vh * 2; y += 4) {
            foilCtx.beginPath();
            foilCtx.moveTo(0, y);
            foilCtx.lineTo(vw, y + vw * 0.25);
            foilCtx.stroke();
        }
        foilCtx.restore();

        // 4. Grain métallique pailleté (aspect ticket à gratter réel)
        for (let i = 0; i < 1400; i++) {
            const gx = Math.random() * vw;
            const gy = Math.random() * vh;
            const bright = i % 2 === 0;
            foilCtx.fillStyle = bright
                ? `rgba(255, 252, 238, ${0.15 + Math.random() * 0.28})`
                : `rgba(120, 82, 30, ${0.10 + Math.random() * 0.18})`;
            foilCtx.fillRect(gx, gy, 1.3, 1.3);
        }

        // 5. Motif en filigrane d'étoiles de Noël sur la feuille d'or
        foilCtx.save();
        foilCtx.fillStyle = 'rgba(115, 78, 28, 0.18)';
        foilCtx.font = '14px Georgia, serif';
        foilCtx.textAlign = 'center';
        foilCtx.textBaseline = 'middle';
        for (let r = 28; r < vh - 20; r += 44) {
            for (let c = 28; c < vw - 20; c += 44) {
                const offsetX = (Math.floor(r / 44) % 2) * 22;
                if (c + offsetX < vw - 18) {
                    foilCtx.fillText('✦', c + offsetX, r);
                }
            }
        }
        foilCtx.restore();

        // 6. Double filet d'encadrement gravé dans l'or
        foilCtx.save();
        foilCtx.strokeStyle = 'rgba(110, 74, 24, 0.42)';
        foilCtx.lineWidth = 1.5;
        foilCtx.strokeRect(12, 12, vw - 24, vh - 24);
        foilCtx.strokeStyle = 'rgba(255, 250, 235, 0.55)';
        foilCtx.lineWidth = 1;
        foilCtx.strokeRect(16, 16, vw - 32, vh - 32);
        foilCtx.restore();

        // 7. Médaillon central gaufré « GRATTE ICI »
        const cx = vw / 2;
        const cy = vh / 2;
        foilCtx.save();
        foilCtx.beginPath();
        foilCtx.arc(cx, cy, 64, 0, Math.PI * 2);
        foilCtx.fillStyle = idx === 1 ? 'rgba(30, 53, 43, 0.92)' : 'rgba(158, 42, 43, 0.9)';
        foilCtx.fill();
        foilCtx.lineWidth = 2;
        foilCtx.strokeStyle = '#FAF0D4';
        foilCtx.stroke();

        foilCtx.beginPath();
        foilCtx.arc(cx, cy, 58, 0, Math.PI * 2);
        foilCtx.lineWidth = 1;
        foilCtx.setLineDash([3, 3]);
        foilCtx.strokeStyle = 'rgba(232, 213, 181, 0.75)';
        foilCtx.stroke();
        foilCtx.setLineDash([]);

        foilCtx.fillStyle = '#FAF7F2';
        foilCtx.font = '600 11px Plus Jakarta Sans, sans-serif';
        foilCtx.textAlign = 'center';
        foilCtx.fillText(cards.length > 1 ? `✦ CARTE ${idx + 1}/${cards.length} ✦` : '✦ SURPRISE ✦', cx, cy - 16);

        foilCtx.font = 'italic 600 22px Cormorant Garamond, Georgia, serif';
        foilCtx.fillText('Gratte ici', cx, cy + 6);

        foilCtx.fillStyle = '#E8D5B5';
        foilCtx.font = '500 10px Plus Jakarta Sans, sans-serif';
        foilCtx.fillText('AVEC TON DOIGT', cx, cy + 25);
        foilCtx.restore();
    }

    function loadCard(idx) {
        currentCardIndex = idx;
        const card = cards[currentCardIndex];

        isScratching = false;
        isRevealed = false;
        captionShown = false;
        lastPt = null;
        pointerPos = null;
        strokeCount = 0;
        shavings.length = 0;

        scratchUnderImg.src = card.imageSrc || '/assets/image1.png';
        scratchSerial.textContent = cards.length > 1
            ? `CARTE ${idx + 1} / ${cards.length} • ÉDITION D'OR`
            : `N° 00${item.day} • ÉDITION D'OR`;
        if (scratchHeaderTitle) {
            scratchHeaderTitle.textContent = card.label ? card.label.toUpperCase() : 'TICKET À GRATTER';
        }
        fsScratchTopLabel.textContent = `${card.label || 'Carte à Gratter'} • 0%`;
        scratchFooterText.textContent = 'Gratte la pellicule dorée avec ton doigt';
        scratchDoneBtn.hidden = true;
        scratchFoilCanvas.classList.remove('revealed');

        if (scratchPhotoCaption) {
            scratchPhotoCaption.hidden = true;
            scratchPhotoCaption.textContent = '';
        }

        renderTabs();
        requestAnimationFrame(() => {
            renderMetallicGoldFoil(card, idx);
        });
    }

    function spawnFoilShavings(x, y, dx, dy, count = 4) {
        const colors = ['#E8D5B5', '#C59B5F', '#FFF2D0', '#9E7336', '#D4AF37'];
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 3.2;
            shavings.push({
                x: x + (Math.random() - 0.5) * 18,
                y: y + (Math.random() - 0.5) * 18,
                vx: -dx * 0.14 + spread * 45 + (Math.random() - 0.5) * 50,
                vy: -Math.abs(dy) * 0.12 - 20 - Math.random() * 55,
                sizeW: 2.2 + Math.random() * 3.8,
                sizeH: 1.2 + Math.random() * 2.4,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 14,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 0.55 + Math.random() * 0.35,
                maxLife: 0.85
            });
        }
    }

    // Coup de pièce cranté sur la couche d'or (destination-out)
    function stampCoinScratch(x, y, angle) {
        foilCtx.save();
        foilCtx.globalCompositeOperation = 'destination-out';
        const radius = 25;

        // Cercle principal de la pièce
        foilCtx.beginPath();
        foilCtx.arc(x, y, radius, 0, Math.PI * 2);
        foilCtx.fill();

        // Micro-stries irrégulières sur les bords pour un effet de grattage ultra-réaliste
        for (let i = 0; i < 7; i++) {
            const a = angle + (i - 3) * 0.42 + (Math.random() - 0.5) * 0.25;
            const rOffset = radius * (0.72 + Math.random() * 0.36);
            const bx = x + Math.cos(a) * rOffset;
            const by = y + Math.sin(a) * rOffset;
            foilCtx.beginPath();
            foilCtx.arc(bx, by, 4 + Math.random() * 4.5, 0, Math.PI * 2);
            foilCtx.fill();
        }
        foilCtx.restore();
    }

    function computeScratchedPercentage() {
        const imgData = foilCtx.getImageData(0, 0, scratchFoilCanvas.width, scratchFoilCanvas.height).data;
        let transparentPixels = 0;
        let totalSampled = 0;
        const step = 16 * 4;

        for (let i = 3; i < imgData.length; i += step) {
            totalSampled++;
            if (imgData[i] < 128) {
                transparentPixels++;
            }
        }
        return totalSampled > 0 ? Math.min(100, Math.round((transparentPixels / totalSampled) * 100)) : 0;
    }

    function revealCaptionIfNeeded(card, pct) {
        if (!card.caption || captionShown || !scratchPhotoCaption) return;
        const threshold = card.captionThreshold || 50;
        if (pct >= threshold) {
            captionShown = true;
            scratchPhotoCaption.textContent = card.caption;
            scratchPhotoCaption.hidden = false;
        }
    }

    function unlockCardMilestone(card) {
        if (isRevealed) return;
        isRevealed = true;

        revealCaptionIfNeeded(card, 100);

        // Bouton d'action : s'il y a une 2ème carte après celle-ci, propose de passer à la 2ème carte,
        // tout en laissant Clara continuer de gratter tout le reste de la carte elle-même !
        scratchDoneBtn.hidden = false;
        if (currentCardIndex < cards.length - 1) {
            scratchDoneBtn.textContent = `Passer à la ${cards[currentCardIndex + 1].label.toLowerCase()} à gratter →`;
            scratchDoneBtn.onclick = () => {
                loadCard(currentCardIndex + 1);
            };
        } else {
            scratchDoneBtn.textContent = 'Garder ce souvenir ❤️';
            scratchDoneBtn.onclick = () => {
                closeFullscreenScratchCard();
            };
        }

        if (!scratchedCardIds.includes(card.id)) {
            scratchedCardIds.push(card.id);
            localStorage.setItem(SCRATCHED_CARDS_KEY, JSON.stringify(scratchedCardIds));
        }

        if (!gamesWon.includes(item.day)) {
            gamesWon.push(item.day);
            localStorage.setItem(GAMES_WON_KEY, JSON.stringify(gamesWon));
        }

        renderTabs();

        saveAndSyncQuizAnswer(
            `scratch_${card.id}`,
            `Carte à gratter (${card.label} - Jour ${item.day})`,
            `A gratté ${card.label} (${card.imageSrc})${card.caption ? ` — "${card.caption}"` : ''}`,
            `Surprise Jour ${item.day}`
        );

        openModal(item);
    }

    function checkProgress() {
        const card = cards[currentCardIndex];
        const pct = computeScratchedPercentage();
        fsScratchTopLabel.textContent = `${card.label || 'Carte à Gratter'} • ${pct}%`;

        if (pct >= 96) {
            scratchFooterText.textContent = '✨ Carte entièrement grattée !';
        } else if (pct >= 50) {
            scratchFooterText.textContent = 'Continue de gratter pour tout découvrir ✨';
        }

        revealCaptionIfNeeded(card, pct);

        const unlockTarget = card.revealThreshold || 50;
        if (pct >= unlockTarget && !isRevealed) {
            unlockCardMilestone(card);
        }
    }

    function scratchTo(clientX, clientY) {
        const rect = scratchViewport.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        pointerPos = { x, y };

        if (!lastPt) {
            stampCoinScratch(x, y, 0);
            spawnFoilShavings(x, y, 0, -10, 3);
            lastPt = { x, y };
            return;
        }

        const dx = x - lastPt.x;
        const dy = y - lastPt.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.5) {
            const angle = Math.atan2(dy, dx);
            const steps = Math.max(1, Math.ceil(dist / 3.5));
            for (let s = 1; s <= steps; s++) {
                const ix = lastPt.x + (dx * s) / steps;
                const iy = lastPt.y + (dy * s) / steps;
                stampCoinScratch(ix, iy, angle);
            }

            spawnFoilShavings(x, y, dx, dy, Math.min(6, Math.ceil(dist / 5)));
            triggerScratchSound(dist);

            if (navigator.vibrate && strokeCount % 6 === 0) {
                navigator.vibrate(5);
            }
        }

        lastPt = { x, y };
        strokeCount++;

        if (strokeCount % 5 === 0) {
            checkProgress();
        }
    }

    // Boucle d'animation des copeaux d'or et de la pièce de monnaie dorée
    let fxAnimId = null;
    let lastFxTime = performance.now();

    function fxLoop(now) {
        const dt = Math.min(0.04, Math.max(0.005, (now - lastFxTime) / 1000));
        lastFxTime = now;

        fxCtx.clearRect(0, 0, vw, vh);

        // 1. Mise à jour et dessin des copeaux d'or qui tombent
        for (let i = shavings.length - 1; i >= 0; i--) {
            const sh = shavings[i];
            sh.vy += 380 * dt; // gravité sur les copeaux
            sh.x += sh.vx * dt;
            sh.y += sh.vy * dt;
            sh.rot += sh.vRot * dt;
            sh.life -= dt;

            if (sh.life <= 0) {
                shavings.splice(i, 1);
                continue;
            }

            fxCtx.save();
            fxCtx.translate(sh.x, sh.y);
            fxCtx.rotate(sh.rot);
            fxCtx.globalAlpha = Math.min(1, sh.life / 0.25);
            fxCtx.fillStyle = sh.color;
            fxCtx.fillRect(-sh.sizeW / 2, -sh.sizeH / 2, sh.sizeW, sh.sizeH);
            fxCtx.restore();
        }

        // 2. Dessin de la pièce d'or inclinée sous le doigt pendant le grattage
        if (isScratching && pointerPos) {
            const px = pointerPos.x;
            const py = pointerPos.y;
            fxCtx.save();
            fxCtx.translate(px + 10, py - 10);
            fxCtx.rotate(-0.35);

            // Ombre portée de la pièce
            fxCtx.beginPath();
            fxCtx.ellipse(2, 4, 18, 14, 0, 0, Math.PI * 2);
            fxCtx.fillStyle = 'rgba(20, 18, 15, 0.28)';
            fxCtx.fill();

            // Corps de la pièce en or
            const coinGrad = fxCtx.createLinearGradient(-18, -14, 18, 14);
            coinGrad.addColorStop(0, '#FFF3D1');
            coinGrad.addColorStop(0.45, '#D4AF37');
            coinGrad.addColorStop(1, '#9A7032');
            fxCtx.beginPath();
            fxCtx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
            fxCtx.fillStyle = coinGrad;
            fxCtx.fill();
            fxCtx.lineWidth = 1.5;
            fxCtx.strokeStyle = '#FAF0D4';
            fxCtx.stroke();

            // Cercle intérieur et étoile sur la pièce
            fxCtx.beginPath();
            fxCtx.ellipse(0, 0, 13.5, 10.2, 0, 0, Math.PI * 2);
            fxCtx.lineWidth = 0.8;
            fxCtx.strokeStyle = 'rgba(120, 82, 30, 0.55)';
            fxCtx.stroke();

            fxCtx.fillStyle = '#8C6226';
            fxCtx.font = '11px Georgia, serif';
            fxCtx.textAlign = 'center';
            fxCtx.textBaseline = 'middle';
            fxCtx.fillText('✦', 0, 0.5);
            fxCtx.restore();
        }

        fxAnimId = requestAnimationFrame(fxLoop);
    }

    const onTouchStart = (e) => {
        isScratching = true;
        lastPt = null;
        if (e.touches && e.touches.length > 0) {
            scratchTo(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const onTouchMove = (e) => {
        if (!isScratching) return;
        if (e.touches && e.touches.length > 0) {
            scratchTo(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    const onTouchEnd = () => {
        if (!isScratching) return;
        isScratching = false;
        lastPt = null;
        pointerPos = null;
        checkProgress();
    };

    const onMouseDown = (e) => {
        isScratching = true;
        lastPt = null;
        scratchTo(e.clientX, e.clientY);
    };

    const onMouseMove = (e) => {
        if (!isScratching) return;
        scratchTo(e.clientX, e.clientY);
    };

    const onMouseUp = () => {
        onTouchEnd();
    };

    scratchFoilCanvas.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    scratchFoilCanvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    loadCard(currentCardIndex);
    fxAnimId = requestAnimationFrame(fxLoop);

    activeScratchCleanup = () => {
        cancelAnimationFrame(fxAnimId);
        clearTimeout(soundTimeout);
        if (audioCtx && audioCtx.state !== 'closed') {
            audioCtx.close().catch(() => {});
        }
        scratchFoilCanvas.removeEventListener('touchstart', onTouchStart);
        window.removeEventListener('touchmove', onTouchMove);
        window.removeEventListener('touchend', onTouchEnd);
        scratchFoilCanvas.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
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
        if (fsScratchOverlay && fsScratchOverlay.classList.contains('active')) {
            closeFullscreenScratchCard();
        } else if (fsCouponOverlay && fsCouponOverlay.classList.contains('active')) {
            closeFullscreenCoupon();
        } else if (fsQuizOverlay && fsQuizOverlay.classList.contains('active')) {
            closeFullscreenQuiz();
        } else if (fsOverlay.classList.contains('active')) {
            closeFullscreenGame();
        } else if (modalOverlay.classList.contains('active')) {
            closeModal();
        }
    }
});

// Astuce discrète pour Alexis : toucher 3 fois rapidement « Pour ma Clara » en bas de la page
// ouvre le carnet avec les réponses libres que Clara a tapées aux questions 1 et 4 !
const footerEl = document.querySelector('.app-footer');
if (footerEl) {
    let tapCount = 0;
    let tapTimer = null;
    footerEl.addEventListener('click', () => {
        tapCount++;
        clearTimeout(tapTimer);
        if (tapCount >= 3) {
            tapCount = 0;
            openSecretAnswersModal();
        } else {
            tapTimer = setTimeout(() => {
                tapCount = 0;
            }, 650);
        }
    });
}

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

    const GRAVITY = 900;        // constante de gravité (px/s²)
    const SPRING_K = 180;       // raideur élastique du fil doré
    const SPRING_DAMP = 9.5;    // amortissement du rebond vertical
    const MAX_ANGLE = 0.29;     // ~16.5° max
    const MAX_OMEGA = 3.2;      // vitesse angulaire max

    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let lastScrollEventTime = 0;
    let tiltTargetAngle = 0;    // inclinaison réelle du téléphone (si dispo)

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
            p.omega = Math.max(-MAX_OMEGA, Math.min(MAX_OMEGA, p.omega + angularKick));

            // Impulsion verticale légèrement réduite sur le fil doré
            const verticalKick = -nonLinearY * 0.55 * p.bounceScale;
            p.velY = Math.max(-65, Math.min(65, p.velY + verticalKick));
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
        const scrolledRecently = (now - lastScrollEventTime) < 28;

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
        if ((now - lastScrollEventTime) > 28) {
            applyWindowImpulse(e.deltaY * 0.13, e.deltaX * 0.08);
        }
    }, { passive: true });

    // 4. Support gyroscope / inclinaison du téléphone (si disponible)
    window.addEventListener('deviceorientation', (e) => {
        if (typeof e.gamma === 'number') {
            const clampedGamma = Math.max(-25, Math.min(25, e.gamma));
            tiltTargetAngle = (clampedGamma * Math.PI) / 180 * 0.16;
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
            p.bounceY += p.velY * dt;
            p.bounceY = Math.max(-3.2, Math.min(4.5, p.bounceY));

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