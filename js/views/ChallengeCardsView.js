/**
 * ChallengeCardsView.js
 * Apresentação e escolha tática de 3 Cards Colecionáveis de Desafio 3D:
 * - Card Verde (Fácil / Comum): +2 Passos Bônus | 0 Penalidade
 * - Card Azul/Ciano (Médio / Raro): +4 Passos Bônus | -1 Penalidade
 * - Card Roxo/Dourado (Difícil / Épico): +6 Passos Bônus | -2 Penalidade
 */
export class ChallengeCardsView {
  constructor(modalId = 'challengeCardsModal') {
    this.container = document.getElementById(modalId);
    this.onCardChosenCallback = null;
  }

  showCardsSelection(candidateQuestions) {
    if (!this.container) return;

    const easyQ = candidateQuestions[0] || {};
    const medQ = candidateQuestions[1] || candidateQuestions[0] || {};
    const hardQ = candidateQuestions[2] || candidateQuestions[0] || {};

    const cards = [
      {
        tier: 'easy',
        tierName: 'Comum',
        diffLabel: 'Fácil',
        icon: '🌱',
        bonus: 2,
        penalty: 0,
        question: easyQ
      },
      {
        tier: 'medium',
        tierName: 'Raro',
        diffLabel: 'Médio',
        icon: '💎',
        bonus: 4,
        penalty: 1,
        question: medQ
      },
      {
        tier: 'hard',
        tierName: 'Épico',
        diffLabel: 'Difícil',
        icon: '👑',
        bonus: 6,
        penalty: 2,
        question: hardQ
      }
    ];

    this.container.innerHTML = `
      <div class="cards-modal-wrapper">
        <div class="cards-modal-header">
          <h2 class="cards-modal-title">🃏 Escolha Sua Carta de Desafio</h2>
          <p class="cards-modal-subtitle">
            Você caiu em uma casa de código! Escolha o nível de risco e recompensa para o seu próximo turno:
          </p>
        </div>

        <div class="cards-hand-container">
          ${cards.map((c, idx) => {
            const category = c.question.categoria || c.question.category || 'Python';
            const preview = c.question.pergunta || c.question.title || 'Desafio de Algoritmo';
            return `
            <div class="challenge-card-3d card-tier-${c.tier}" data-index="${idx}">
              <div class="card-top-row">
                <span class="card-rarity-badge">${c.tierName} • ${c.diffLabel}</span>
                <span class="card-category-tag">${category}</span>
              </div>

              <div class="card-art-frame">
                <span class="card-art-icon">${c.icon}</span>
                <div class="card-question-preview">
                  ${preview}
                </div>
              </div>

              <div class="card-rewards-box">
                <span class="reward-win">⚡ +${c.bonus} passos se acertar</span>
                <span class="reward-risk">${c.penalty > 0 ? `⚠️ -${c.penalty} se errar` : '🛡️ Sem risco'}</span>
              </div>

              <button class="btn-pick-card" data-index="${idx}">
                Escolher Carta
              </button>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `;

    this.container.classList.add('active');

    this.container.querySelectorAll('.challenge-card-3d, .btn-pick-card').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(el.getAttribute('data-index'), 10);
        const chosenCard = cards[index];
        if (chosenCard) {
          this.hide();
          if (this.onCardChosenCallback) {
            this.onCardChosenCallback(chosenCard);
          }
        }
      });
    });
  }

  hide() {
    if (this.container) {
      this.container.classList.remove('active');
    }
  }

  onCardChosen(callback) {
    this.onCardChosenCallback = callback;
  }
}
