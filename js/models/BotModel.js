/**
 * BotModel.js
 * Inteligência Artificial do oponente (CPU) que simula a rolagem, a montagem lógica e a corrida.
 */
export class BotModel {
  constructor(difficulty = 'normal') {
    this.name = 'CyberBot-v3';
    this.difficulty = difficulty; // 'easy', 'normal', 'hard'
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  /**
   * Simula a montagem de blocos e cálculo de passos do Bot com geração de AST real de blocos.
   */
  decideTurn(diceRoll, context = {}) {
    let successRate = 0.90;
    if (this.difficulty === 'easy') successRate = 0.75;
    if (this.difficulty === 'hard') successRate = 0.98;

    const isSuccess = Math.random() < successRate;
    const steps = isSuccess ? diceRoll : Math.max(1, diceRoll - 1);

    const botPos = context.botPos || 1;
    const boardModel = context.boardModel;
    const targetTile = boardModel ? boardModel.getTile(botPos + steps) : null;
    const hasBugAhead = Boolean(targetTile && (targetTile.type === 'trap' || targetTile.type === 'bug'));

    let blocks = [];
    let formula = `${steps}`;
    let code = '';
    let usedJump = false;

    // Tática avançada: se houver bug à frente, CPU tenta usar pulo acrobático
    if (hasBugAhead && this.difficulty !== 'easy' && Math.random() < 0.75) {
      usedJump = true;
      blocks = [
        {
          id: `bot_blk_${Date.now()}_1`,
          type: 'action_jump',
          value: steps,
          children: []
        }
      ];
      formula = `${steps} [pulo]`;
      code = `# CPU detectou um Bug na casa ${botPos + steps}! Executando pulo:\ncyberbot.pular(distancia=${steps})`;
    } else if (steps > 6) {
      const half = Math.floor(steps / 2);
      const rem = steps - (half * 2);
      blocks = [
        {
          id: `bot_blk_${Date.now()}_1`,
          type: 'loop_for',
          value: 2,
          children: [
            {
              id: `bot_blk_${Date.now()}_2`,
              type: 'action_forward',
              value: half,
              children: []
            }
          ]
        }
      ];
      if (rem > 0) {
        blocks.push({
          id: `bot_blk_${Date.now()}_3`,
          type: 'action_forward',
          value: rem,
          children: []
        });
        formula = `(2 × ${half}) + ${rem}`;
        code = `for i in range(2):\n    cyberbot.avancar(${half})\ncyberbot.avancar(${rem})`;
      } else {
        formula = `(2 × ${half})`;
        code = `for i in range(2):\n    cyberbot.avancar(${half})`;
      }
    } else if (steps === 4) {
      blocks = [
        {
          id: `bot_blk_${Date.now()}_1`,
          type: 'loop_for',
          value: 2,
          children: [
            {
              id: `bot_blk_${Date.now()}_2`,
              type: 'action_forward',
              value: 2,
              children: []
            }
          ]
        }
      ];
      formula = '(2 × 2)';
      code = `for i in range(2):\n    cyberbot.avancar(2)`;
    } else if (steps === 6) {
      blocks = [
        {
          id: `bot_blk_${Date.now()}_1`,
          type: 'loop_for',
          value: 2,
          children: [
            {
              id: `bot_blk_${Date.now()}_2`,
              type: 'action_forward',
              value: 3,
              children: []
            }
          ]
        }
      ];
      formula = '(2 × 3)';
      code = `for i in range(2):\n    cyberbot.avancar(3)`;
    } else if (steps === 5) {
      blocks = [
        {
          id: `bot_blk_${Date.now()}_1`,
          type: 'loop_for',
          value: 2,
          children: [
            {
              id: `bot_blk_${Date.now()}_2`,
              type: 'action_forward',
              value: 2,
              children: []
            }
          ]
        },
        {
          id: `bot_blk_${Date.now()}_3`,
          type: 'action_forward',
          value: 1,
          children: []
        }
      ];
      formula = '(2 × 2) + 1';
      code = `for i in range(2):\n    cyberbot.avancar(2)\ncyberbot.avancar(1)`;
    } else if (steps === 3) {
      if (Math.random() < 0.5) {
        blocks = [
          {
            id: `bot_blk_${Date.now()}_1`,
            type: 'loop_for',
            value: 3,
            children: [
              {
                id: `bot_blk_${Date.now()}_2`,
                type: 'action_forward',
                value: 1,
                children: []
              }
            ]
          }
        ];
        formula = '(3 × 1)';
        code = `for i in range(3):\n    cyberbot.avancar(1)`;
      } else {
        blocks = [
          {
            id: `bot_blk_${Date.now()}_1`,
            type: 'action_forward',
            value: 3,
            children: []
          }
        ];
        formula = '3';
        code = `cyberbot.avancar(3)`;
      }
    } else if (steps === 2) {
      blocks = [
        {
          id: `bot_blk_${Date.now()}_1`,
          type: 'loop_for',
          value: 2,
          children: [
            {
              id: `bot_blk_${Date.now()}_2`,
              type: 'action_forward',
              value: 1,
              children: []
            }
          ]
        }
      ];
      formula = '(2 × 1)';
      code = `for i in range(2):\n    cyberbot.avancar(1)`;
    } else {
      blocks = [
        {
          id: `bot_blk_${Date.now()}_1`,
          type: 'action_forward',
          value: steps,
          children: []
        }
      ];
      formula = `${steps}`;
      code = `cyberbot.avancar(${steps})`;
    }

    return {
      success: isSuccess,
      steps,
      jumped: usedJump,
      blocks,
      formula,
      simulatedCode: code
    };
  }

  /**
   * Simula a resposta do Bot em casas de desafio.
   */
  answerChallenge() {
    let solveRate = 0.70;
    if (this.difficulty === 'easy') solveRate = 0.50;
    if (this.difficulty === 'hard') solveRate = 0.85;

    return Math.random() < solveRate;
  }
}
