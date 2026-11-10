/**
 * DiceView.js
 * Renderização e animação 3D com CSS do dado D6 e controle claro e legível da energia de passos.
 */
export class DiceView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.diceEl = null;
    this.valueDisplayEl = null;
    this.bonusDetailEl = null;
    this.preBonusBadgeEl = null;
    this.energyContainerEl = null;
    this.rollBtn = null;
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="dice-module">
        <div class="dice-scene">
          <div class="dice-cube" id="diceCube">
            <div class="dice-face face-1"><span class="dot"></span></div>
            <div class="dice-face face-2"><span class="dot"></span><span class="dot"></span></div>
            <div class="dice-face face-3"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>
            <div class="dice-face face-4"><div class="dot-col"><span class="dot"></span><span class="dot"></span></div><div class="dot-col"><span class="dot"></span><span class="dot"></span></div></div>
            <div class="dice-face face-5"><div class="dot-col"><span class="dot"></span><span class="dot"></span></div><div class="dot-col"><span class="dot"></span></div><div class="dot-col"><span class="dot"></span><span class="dot"></span></div></div>
            <div class="dice-face face-6"><div class="dot-col"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div><div class="dot-col"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div></div>
          </div>
        </div>

        <div class="dice-controls">
          <div class="roll-btn-group">
            <button id="rollDiceBtn" class="btn-primary roll-btn">
              <span class="btn-icon">🎲</span>
              <span class="btn-text">Rolar Dado</span>
            </button>
            <div id="dicePreBonusBadge" class="badge-pre-bonus hidden">⚡ Boost Ativo (+2)</div>
          </div>
          
          <!-- Container de Energia: Total de Passos e Detalhe Claro -->
          <div id="diceEnergyStatus" class="dice-energy-card energy-hidden">
            <div class="energy-row">
              <span class="energy-label">⚡ Passos a Programar:</span>
              <span id="diceValueDisplay" class="energy-total-value">0</span>
            </div>
            <div id="diceBonusDetail" class="energy-breakdown hidden">
              (🎲 0 no dado + ⚡ 0 de boost)
            </div>
          </div>
        </div>
      </div>
    `;

    this.diceEl = document.getElementById('diceCube');
    this.energyContainerEl = document.getElementById('diceEnergyStatus');
    this.valueDisplayEl = document.getElementById('diceValueDisplay');
    this.bonusDetailEl = document.getElementById('diceBonusDetail');
    this.preBonusBadgeEl = document.getElementById('dicePreBonusBadge');
    this.rollBtn = document.getElementById('rollDiceBtn');
  }

  setBonus(bonus) {
    if (!this.preBonusBadgeEl) return;
    if (bonus > 0) {
      this.preBonusBadgeEl.textContent = `⚡ Boost +${bonus} no próximo dado!`;
      this.preBonusBadgeEl.classList.remove('hidden');
    } else {
      this.preBonusBadgeEl.classList.add('hidden');
    }
  }

  showEnergy(finalValue, bonus = 0) {
    if (!this.energyContainerEl) return;
    const total = finalValue + bonus;

    // Exibe o total com destaque indiscutível
    this.valueDisplayEl.textContent = `${total} ${total === 1 ? 'passo' : 'passos'}`;

    // Se houve bônus, exibe o detalhamento logo abaixo de forma limpa e sem quebrar números
    if (bonus > 0) {
      this.bonusDetailEl.textContent = `🎲 ${finalValue} do dado + ⚡ ${bonus} de boost`;
      this.bonusDetailEl.classList.remove('hidden');
    } else {
      this.bonusDetailEl.classList.add('hidden');
    }

    // Oculta o badge de pré-bônus pois já foi aplicado nesta rolagem
    if (this.preBonusBadgeEl) {
      this.preBonusBadgeEl.classList.add('hidden');
    }

    this.energyContainerEl.classList.remove('energy-hidden');
    this.energyContainerEl.classList.add('pulse-number');
    setTimeout(() => this.energyContainerEl.classList.remove('pulse-number'), 400);
  }

  hideEnergy() {
    if (!this.energyContainerEl) return;
    this.energyContainerEl.classList.add('energy-hidden');
    if (this.bonusDetailEl) this.bonusDetailEl.classList.add('hidden');
    this.valueDisplayEl.textContent = '-';
  }

  setDisabled(disabled) {
    if (this.rollBtn) {
      this.rollBtn.disabled = disabled;
      if (disabled) {
        this.rollBtn.classList.add('btn-disabled');
      } else {
        this.rollBtn.classList.remove('btn-disabled');
      }
    }
  }

  animateRoll(finalValue, bonus = 0) {
    return new Promise((resolve) => {
      this.setDisabled(true);
      if (!this.diceEl) {
        resolve(finalValue + bonus);
        return;
      }

      this.diceEl.classList.add('is-rolling');
      this.hideEnergy();

      // Mapeamento corrigido das rotações 3D para cada face:
      // O cubo deve girar no ângulo inverso da orientação da face para deixá-la voltada à tela.
      // Face 1: rotateY(0deg)   -> Cubo: rotateY(0deg)
      // Face 2: rotateY(180deg) -> Cubo: rotateY(180deg)
      // Face 3: rotateY(-90deg) -> Cubo: rotateY(90deg)
      // Face 4: rotateY(90deg)  -> Cubo: rotateY(-90deg)
      // Face 5: rotateX(-90deg) -> Cubo: rotateX(90deg)
      // Face 6: rotateX(90deg)  -> Cubo: rotateX(-90deg)
      const faceRotations = {
        1: 'rotateX(0deg) rotateY(0deg)',
        2: 'rotateY(180deg)',
        3: 'rotateY(90deg)',
        4: 'rotateY(-90deg)',
        5: 'rotateX(90deg)',
        6: 'rotateX(-90deg)'
      };

      setTimeout(() => {
        this.diceEl.classList.remove('is-rolling');
        const targetRotation = faceRotations[finalValue] || 'rotateX(0deg) rotateY(0deg)';
        this.diceEl.style.transform = targetRotation;

        this.showEnergy(finalValue, bonus);
        const total = finalValue + bonus;
        resolve(total);
      }, 700);
    });
  }

  onRollClick(callback) {
    if (this.rollBtn) {
      this.rollBtn.addEventListener('click', callback);
    }
  }
}
