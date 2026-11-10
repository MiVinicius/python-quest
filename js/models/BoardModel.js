/**
 * BoardModel.js
 * Mapeamento da Trilha em Zigue-Zague Descendente:
 * Suporta:
 * - Modo Completo ('full'): 64 casas (8 ciclos de 6 horizontais + 2 verticais)
 * - Modo Demonstração ('demo'): 22 casas (3 corredores horizontais de 6 casas + 2 descidas de 2 casas),
 *   com alta densidade de desafios, atalhos e bugs para avaliação rápida contra o robô.
 */
export class BoardModel {
  constructor(mode = 'full') {
    this.GRID_COLS = 6;
    this.mode = mode;
    this.TOTAL_TILES = mode === 'demo' ? 22 : 64;
    this.tiles = this.generateTiles(mode);
  }

  setBoardMode(mode = 'full') {
    this.mode = mode === 'demo' ? 'demo' : 'full';
    this.TOTAL_TILES = this.mode === 'demo' ? 22 : 64;
    this.tiles = this.generateTiles(this.mode);
    return this.TOTAL_TILES;
  }

  generateTiles(mode = this.mode) {
    const tiles = {};
    const isDemo = (mode === 'demo');
    const total = isDemo ? 22 : 64;
    this.TOTAL_TILES = total;

    // Atalhos estratégicos
    const shortcuts = isDemo
      ? {
          4: { bonus: 2, label: 'Atalho: Algoritmo O(1) (+2)' },
          13: { bonus: 3, label: 'Atalho: Turbo Cache (+3)' }
        }
      : {
          5: { bonus: 3, label: 'Atalho: Algoritmo O(1) (+3)' },
          19: { bonus: 4, label: 'Atalho: Turbo Cache (+4)' },
          34: { bonus: 3, label: 'Atalho: Refatoração Limpa (+3)' },
          52: { bonus: 4, label: 'Atalho: Otimização de GPU (+4)' }
        };

    // Armadilhas / Bugs
    const traps = isDemo
      ? {
          8: { penalty: 2, label: 'Bug: Memory Leak (-2)' },
          16: { penalty: 3, label: 'Bug: Recursão Infinita (-3)' }
        }
      : {
          12: { penalty: 3, label: 'Bug: Memory Leak (-3)' },
          26: { penalty: 4, label: 'Bug: Recursão Infinita (-4)' },
          44: { penalty: 3, label: 'Bug: NullPointerException (-3)' },
          59: { penalty: 5, label: 'Bug Crítico: Kernel Panic (-5)' }
        };

    // Casas de Desafio Python (alta densidade no modo Demo para avaliação rápida)
    const challenges = isDemo
      ? [3, 6, 10, 12, 15, 18, 20]
      : [4, 7, 10, 14, 17, 21, 25, 29, 32, 36, 40, 43, 47, 50, 54, 58, 62];

    for (let i = 1; i <= total; i++) {
      let type = 'normal';
      let effect = null;
      let label = `Casa ${i}`;

      if (i === 1) {
        type = 'start';
        label = isDemo ? 'Largada: Início da Demonstração' : 'Largada: Início da Corrida';
      } else if (i === total) {
        type = 'goal';
        label = isDemo ? `Meta Demo: Python Master (Casa ${total})` : `Meta: Python Master (Casa ${total})`;
      } else if (shortcuts[i]) {
        type = 'shortcut';
        effect = { steps: shortcuts[i].bonus };
        label = shortcuts[i].label;
      } else if (traps[i]) {
        type = 'trap';
        effect = { steps: -traps[i].penalty };
        label = traps[i].label;
      } else if (challenges.includes(i)) {
        type = 'challenge';
        label = 'Arena de Desafio Python!';
      }

      // Cálculo da coordenada no zigue-zague de 6 na linha + 2 na coluna:
      const zeroIdx = i - 1;
      const cycle = Math.floor(zeroIdx / 8);
      const posInCycle = zeroIdx % 8; // 0 a 7

      let row = 1;
      let col = 1;
      let flowDirection = 'right'; // 'right' | 'down' | 'left'

      if (posInCycle < 6) {
        row = cycle * 3 + 1;
        if (cycle % 2 === 0) {
          col = posInCycle + 1;
          flowDirection = posInCycle === 5 ? 'down' : 'right';
        } else {
          col = 6 - posInCycle;
          flowDirection = posInCycle === 5 ? 'down' : 'left';
        }
      } else {
        const step = posInCycle - 6; // 0 ou 1
        row = cycle * 3 + 2 + step;
        col = (cycle % 2 === 0) ? 6 : 1;
        flowDirection = (step === 1) ? (cycle % 2 === 0 ? 'left' : 'right') : 'down';
      }

      if (i === total) {
        flowDirection = 'right';
      }

      tiles[i] = {
        number: i,
        type,
        effect,
        label,
        row,
        col,
        flowDirection
      };
    }

    return tiles;
  }

  getTile(number) {
    return this.tiles[number] || null;
  }
}
