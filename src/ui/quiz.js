/**
 * ============================================================================
 * QUIZ PLEIN ÉCRAN : SYSTÈME GÉNÉRIQUE POUR TOUS LES QUIZ / QCM (JOUR 3)
 * ============================================================================
 */

import {
    stopActiveGame,
    getSavedQuizAnswers,
    saveAndSyncQuizAnswer,
    markGameWon
} from '../logic/state.js';
import {
    fsQuizOverlay,
    fsQuizCloseBtn,
    fsQuizStepLabel,
    fsQuizDots,
    fsQuizCard,
    fsQuizKicker,
    fsQuizQuestion,
    fsQuizInteraction,
    fsQuizFeedback,
    fsQuizNextBtn,
    fsQuizFinalCard,
    fsQuizFinalMsg,
    fsQuizFinishBtn
} from './dom.js';
import { openModal } from './modal.js';

const DEFAULT_QUIZ_KICKER = 'Tu te souviens de notre été ?';
const DEFAULT_FINAL_MESSAGE = 'quizz terminé a demain ! (ce bunker dans mon cœur vrmt)';

export function closeFullscreenQuiz() {
    fsQuizOverlay.classList.remove('active');
    fsQuizOverlay.setAttribute('aria-hidden', 'true');
}

export function initQuizListeners() {
    if (fsQuizCloseBtn) {
        fsQuizCloseBtn.addEventListener('click', closeFullscreenQuiz);
    }
    if (fsQuizFinishBtn) {
        fsQuizFinishBtn.addEventListener('click', closeFullscreenQuiz);
    }
}

export function launchFullscreenQuiz(item) {
    stopActiveGame();
    const questions = item.questions || [];
    if (!questions.length) return;

    let currentIndex = 0;

    fsQuizOverlay.classList.add('active');
    fsQuizOverlay.setAttribute('aria-hidden', 'false');
    fsQuizCard.hidden = false;
    fsQuizFinalCard.hidden = true;

    function renderDots(allDone = false) {
        fsQuizDots.innerHTML = '';
        questions.forEach((_, idx) => {
            const dot = document.createElement('span');
            dot.className = 'fs-quiz-dot';
            if (allDone || idx < currentIndex) dot.classList.add('done');
            else if (idx === currentIndex) dot.classList.add('active');
            fsQuizDots.appendChild(dot);
        });
    }

    function renderTextQuestion(q, qTitle, quizTitle) {
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

        validateBtn.addEventListener('click', () => {
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
        });

        fsQuizInteraction.appendChild(textarea);
        fsQuizInteraction.appendChild(validateBtn);
    }

    function renderChoiceQuestion(q, qTitle, quizTitle) {
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

    function renderCurrentQuestion() {
        const q = questions[currentIndex];
        const qTitle = q.shortTitle || `Question ${currentIndex + 1}`;
        const quizTitle = item.gameTitle || `Jour ${item.day}`;

        fsQuizStepLabel.textContent = `Question ${currentIndex + 1} / ${questions.length}`;
        fsQuizKicker.textContent = item.gameTitle || DEFAULT_QUIZ_KICKER;
        fsQuizQuestion.textContent = q.question;
        fsQuizInteraction.innerHTML = '';
        fsQuizFeedback.hidden = true;
        fsQuizFeedback.textContent = '';
        fsQuizFeedback.className = 'fs-quiz-feedback';
        fsQuizNextBtn.hidden = true;
        fsQuizNextBtn.textContent = (currentIndex === questions.length - 1)
            ? 'Voir la surprise finale'
            : 'Passer à la question suivante';

        renderDots(false);

        if (q.type === 'text') {
            renderTextQuestion(q, qTitle, quizTitle);
        } else if (q.type === 'choice') {
            renderChoiceQuestion(q, qTitle, quizTitle);
        }
    }

    fsQuizNextBtn.onclick = () => {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderCurrentQuestion();
        } else {
            // Fin du quiz : on enregistre la victoire et on ouvre la pop-up finale avec cap.png
            markGameWon(item.day);
            fsQuizStepLabel.textContent = 'Quiz terminé !';
            renderDots(true);

            fsQuizCard.hidden = true;
            fsQuizFinalCard.hidden = false;
            if (fsQuizFinalMsg) {
                fsQuizFinalMsg.textContent = item.finalMessage || DEFAULT_FINAL_MESSAGE;
            }

            // Met à jour la modale du jour en arrière-plan
            openModal(item);
        }
    };

    renderCurrentQuestion();
}
