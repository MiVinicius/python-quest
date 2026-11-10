/**
 * DiceModel.js
 * Lógica matemática do dado D6 e cálculo de bônus acumulados.
 */
export class DiceModel {
  constructor() {
    this.lastRoll = 0;
    this.lastTotal = 0;
    this.bonus = 0;
  }

  setBonus(bonus) {
    this.bonus = bonus;
  }

  roll(customBonus = 0) {
    this.lastRoll = Math.floor(Math.random() * 6) + 1;
    const appliedBonus = this.bonus + customBonus;
    this.lastTotal = this.lastRoll + appliedBonus;
    this.bonus = 0; // consome o bônus após a rolagem

    return {
      roll: this.lastRoll,
      bonus: appliedBonus,
      total: this.lastTotal
    };
  }

  getLastResult() {
    return {
      roll: this.lastRoll,
      bonus: this.bonus,
      total: this.lastTotal
    };
  }
}
