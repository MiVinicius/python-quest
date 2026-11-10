/**
 * SoundView.js
 * Efeitos sonoros sintetizados nativamente via Web Audio API.
 * Não requer arquivos externos de áudio e funciona instantaneamente em qualquer browser.
 */
export class SoundView {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.15) {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      // Ignora silenciosamente se o áudio não estiver liberado
    }
  }

  playDiceRoll() {
    if (this.muted) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(200 + Math.random() * 300, 'square', 0.05, 0.08);
      }, i * 60);
    }
  }

  playBlockSnap() {
    this.playTone(520, 'sine', 0.08, 0.12);
  }

  playCompileSuccess() {
    this.playTone(440, 'triangle', 0.1, 0.15);
    setTimeout(() => this.playTone(660, 'triangle', 0.12, 0.15), 100);
    setTimeout(() => this.playTone(880, 'triangle', 0.2, 0.2), 200);
  }

  playCompileError() {
    this.playTone(220, 'sawtooth', 0.15, 0.2);
    setTimeout(() => this.playTone(165, 'sawtooth', 0.25, 0.2), 120);
  }

  playStep() {
    this.playTone(330, 'sine', 0.06, 0.1);
  }

  playChallengeAlert() {
    this.playTone(700, 'square', 0.15, 0.2);
    setTimeout(() => this.playTone(880, 'square', 0.2, 0.2), 150);
  }

  playVictory() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.25), idx * 150);
    });
  }
}
