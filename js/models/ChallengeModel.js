/**
 * ChallengeModel.js
 * Gerencia o catálogo de perguntas e desafios de programação Python.
 * Suporta resiliência offline (desafios.json local) e carregamento dinâmico via GitHub Raw.
 */
export class ChallengeModel {
  constructor() {
    this.challenges = [];
    this.usedIds = new Set();
    this.currentChallenge = null;
    this.dataSource = 'Local (desafios.json)';
    this.remoteUrl = 'https://raw.githubusercontent.com/comunidade/python-quest/main/desafios.json';
  }

  async loadChallenges(customUrl = null) {
    const url = customUrl || './desafios.json';
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        this.challenges = data;
        this.dataSource = customUrl ? 'GitHub Raw (Remoto)' : 'Local (desafios.json)';
        return { success: true, count: this.challenges.length, source: this.dataSource };
      }
      throw new Error('Formato de dados inválido');
    } catch (err) {
      console.warn('Falha ao carregar desafios de:', url, err.message);
      // Fallback para arquivo local se a URL customizada falhou
      if (customUrl && url !== './desafios.json') {
        return this.loadChallenges('./desafios.json');
      }
      return { success: false, error: err.message };
    }
  }

  getRandomChallenge() {
    if (this.challenges.length === 0) return null;

    let available = this.challenges.filter(c => !this.usedIds.has(c.id));
    if (available.length === 0) {
      this.usedIds.clear();
      available = this.challenges;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    this.currentChallenge = available[randomIndex];
    this.usedIds.add(this.currentChallenge.id);

    return this.currentChallenge;
  }

  checkAnswer(selectedIndex) {
    if (!this.currentChallenge) return { correct: false };

    const isCorrect = (parseInt(selectedIndex, 10) === this.currentChallenge.resposta_correta);
    return {
      correct: isCorrect,
      correctIndex: this.currentChallenge.resposta_correta,
      explanation: this.currentChallenge.explicacao,
      author: this.currentChallenge.autor
    };
  }
}
