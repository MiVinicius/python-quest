/**
 * GameStateModel.js
 * Gerencia o estado reativo da corrida entre o Jogador e a CPU.
 */
export class GameStateModel {
  constructor() {
    this.TOTAL_TILES = 64;
    this.logListeners = [];
    this.reset();
  }

  setTotalTiles(total = 64) {
    this.TOTAL_TILES = total;
  }

  reset() {
    this.playerPos = 1;
    this.botPos = 1;
    this.currentTurn = 'player'; // 'player' | 'bot'
    this.phase = 'waiting_roll'; // 'waiting_roll' | 'coding' | 'moving' | 'challenge' | 'game_over'
    
    // Bônus e status
    this.playerBoost = 0; // passos extras na próxima rolagem
    this.playerStunned = false; // se perde o próximo turno
    this.playerShielded = false; // proteção try...except contra próxima armadilha
    this.botBoost = 0;
    this.botStunned = false;
    
    this.roundCount = 1;
    this.winner = null;
    this.lastDiceRoll = 0;
    this.lastDiceBonus = 0;
    this.lastDiceValue = 0;
    this.logs = [];
  }

  onLog(callback) {
    if (typeof callback === 'function') {
      this.logListeners.push(callback);
    }
  }

  addLog(sender, text, type = 'info') {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const entry = { sender, text, type, time };
    this.logs.unshift(entry);
    if (this.logs.length > 60) this.logs.pop();

    // Notifica ouvintes reativos (ex: StatusPanelView terminal)
    this.logListeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Erro no log listener:', err);
      }
    });

    return entry;
  }

  setPhase(newPhase) {
    this.phase = newPhase;
  }

  setRollData(roll, bonus, total) {
    this.lastDiceRoll = roll;
    this.lastDiceBonus = bonus;
    this.lastDiceValue = total;
  }

  setDiceValue(val) {
    this.lastDiceValue = val;
    if (!this.lastDiceRoll) {
      this.lastDiceRoll = val;
    }
  }

  advancePlayer(steps) {
    this.playerPos = Math.min(this.TOTAL_TILES, Math.max(1, this.playerPos + steps));
    if (this.playerPos >= this.TOTAL_TILES) {
      this.winner = 'player';
      this.phase = 'game_over';
    }
    return this.playerPos;
  }

  advanceBot(steps) {
    this.botPos = Math.min(this.TOTAL_TILES, Math.max(1, this.botPos + steps));
    if (this.botPos >= this.TOTAL_TILES) {
      this.winner = 'bot';
      this.phase = 'game_over';
    }
    return this.botPos;
  }

  toggleTurn() {
    if (this.phase === 'game_over') return;

    if (this.currentTurn === 'player') {
      this.currentTurn = 'bot';
    } else {
      this.currentTurn = 'player';
      this.roundCount++;
    }
    this.phase = 'waiting_roll';
  }
}
