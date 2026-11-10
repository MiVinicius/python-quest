/**
 * ChallengeModalView.js
 * Modal de Desafio Time Attack com contagem regressiva,
 * formatação de código Python, botões de alternativa e feedback explicativo.
 */
export class ChallengeModalView {
  constructor() {
    this.modalOverlay = null;
    this.timerBar = null;
    this.timerText = null;
    this.questionTitle = null;
    this.codeBlock = null;
    this.optionsContainer = null;
    this.feedbackArea = null;
    this.closeBtn = null;
    
    this.timerInterval = null;
    this.timeLeft = 20;
    this.totalTime = 20;

    this.onAnswerCallback = null;
    this.onTimeoutCallback = null;
    this.onCloseCallback = null;

    this.render();
  }

  render() {
    let modal = document.getElementById('challengeModalOverlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'challengeModalOverlay';
      modal.className = 'modal-overlay hidden';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card challenge-card">
        <div class="modal-header">
          <div class="modal-title-group">
            <span class="modal-icon">⚡</span>
            <div>
              <h2 class="modal-title">Desafio Python - Time Attack!</h2>
              <span id="challengeMetaBadge" class="badge-meta">Categoria: Geral | Fácil</span>
            </div>
          </div>
          <div class="timer-box">
            <span class="timer-icon">⏱️</span>
            <span id="challengeTimerText" class="timer-digits">20s</span>
          </div>
        </div>

        <div class="timer-progress-container">
          <div id="challengeTimerBar" class="timer-bar" style="width: 100%;"></div>
        </div>

        <div class="modal-body">
          <p id="challengeQuestionText" class="question-text">Carregando pergunta...</p>
          
          <pre id="challengeCodePre" class="code-box"><code id="challengeCodeBlock"></code></pre>

          <div id="challengeOptionsList" class="options-grid"></div>

          <div id="challengeFeedback" class="challenge-feedback hidden">
            <div id="feedbackIcon" class="feedback-icon"></div>
            <div class="feedback-content">
              <h4 id="feedbackTitle" class="feedback-title"></h4>
              <p id="feedbackExplanation" class="feedback-desc"></p>
              <span id="feedbackAuthor" class="feedback-author"></span>
            </div>
            <button id="challengeContinueBtn" class="btn-primary btn-sm">Continuar Corrida ⏩</button>
          </div>
        </div>
      </div>
    `;

    this.modalOverlay = modal;
    this.timerBar = document.getElementById('challengeTimerBar');
    this.timerText = document.getElementById('challengeTimerText');
    this.questionTitle = document.getElementById('challengeQuestionText');
    this.metaBadge = document.getElementById('challengeMetaBadge');
    this.codeBlock = document.getElementById('challengeCodeBlock');
    this.codePre = document.getElementById('challengeCodePre');
    this.optionsContainer = document.getElementById('challengeOptionsList');
    this.feedbackArea = document.getElementById('challengeFeedback');
    this.feedbackIcon = document.getElementById('feedbackIcon');
    this.feedbackTitle = document.getElementById('feedbackTitle');
    this.feedbackDesc = document.getElementById('feedbackExplanation');
    this.feedbackAuthor = document.getElementById('feedbackAuthor');
    this.continueBtn = document.getElementById('challengeContinueBtn');

    this.continueBtn.addEventListener('click', () => {
      this.close();
      if (this.onCloseCallback) this.onCloseCallback();
    });
  }

  show(challenge, durationSeconds = 20) {
    if (!this.modalOverlay) return;

    this.totalTime = durationSeconds;
    this.timeLeft = durationSeconds;
    this.feedbackArea.classList.add('hidden');
    this.continueBtn.classList.add('hidden');
    this.optionsContainer.innerHTML = '';

    this.metaBadge.textContent = `${challenge.categoria || 'Geral'} • Dificuldade: ${challenge.dificuldade || 'Média'}`;
    this.questionTitle.textContent = challenge.pergunta;

    if (challenge.codigo && challenge.codigo.trim() !== '') {
      this.codePre.style.display = 'block';
      this.codeBlock.textContent = challenge.codigo;
    } else {
      this.codePre.style.display = 'none';
    }

    const letters = ['A', 'B', 'C', 'D'];
    challenge.opcoes.forEach((opcao, idx) => {
      const btn = document.createElement('button');
      btn.className = 'option-btn';
      btn.innerHTML = `
        <span class="option-letter">${letters[idx] || (idx + 1)}</span>
        <span class="option-text">${opcao}</span>
      `;
      btn.addEventListener('click', () => {
        this.stopTimer();
        if (this.onAnswerCallback) {
          this.onAnswerCallback(idx);
        }
      });
      this.optionsContainer.appendChild(btn);
    });

    this.modalOverlay.classList.remove('hidden');
    this.startTimer();
  }

  startTimer() {
    this.stopTimer();
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timeLeft -= 1;
      this.updateTimerDisplay();

      if (this.timeLeft <= 0) {
        this.stopTimer();
        if (this.onTimeoutCallback) {
          this.onTimeoutCallback();
        }
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerDisplay() {
    const percentage = Math.max(0, (this.timeLeft / this.totalTime) * 100);
    this.timerBar.style.width = `${percentage}%`;
    this.timerText.textContent = `${this.timeLeft}s`;

    if (this.timeLeft <= 5) {
      this.timerBar.style.backgroundColor = 'var(--color-danger)';
      this.timerText.classList.add('pulse-urgent');
    } else {
      this.timerBar.style.backgroundColor = 'var(--color-warning)';
      this.timerText.classList.remove('pulse-urgent');
    }
  }

  displayFeedback(result) {
    this.stopTimer();
    
    // Desabilita as opções e marca a correta e incorreta
    const buttons = this.optionsContainer.querySelectorAll('.option-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === result.correctIndex) {
        btn.classList.add('option-correct');
      } else {
        btn.classList.add('option-disabled');
      }
    });

    this.feedbackArea.classList.remove('hidden');
    this.continueBtn.classList.remove('hidden');

    if (result.correct) {
      this.feedbackArea.className = 'challenge-feedback feedback-success';
      this.feedbackIcon.textContent = '🎉';
      this.feedbackTitle.textContent = 'Resposta Correta! Boost Ativado!';
    } else {
      this.feedbackArea.className = 'challenge-feedback feedback-error';
      this.feedbackIcon.textContent = '⚠️';
      this.feedbackTitle.textContent = result.timeout ? 'Tempo Esgotado!' : 'Resposta Incorreta!';
    }

    this.feedbackDesc.textContent = result.explanation || '';
    this.feedbackAuthor.textContent = result.author ? `Contribuição de: ${result.author}` : '';
  }

  close() {
    this.stopTimer();
    if (this.modalOverlay) {
      this.modalOverlay.classList.add('hidden');
    }
  }

  onAnswer(cb) {
    this.onAnswerCallback = cb;
  }

  onTimeout(cb) {
    this.onTimeoutCallback = cb;
  }

  onClose(cb) {
    this.onCloseCallback = cb;
  }
}
