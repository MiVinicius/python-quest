/**
 * ChallengeController.js
 * Gerencia a ativação de desafios Time Attack com escolha tática entre 3 Cards 3D,
 * aplicação de cronômetro, bônus dinâmicos, registro de acertos no perfil e penalidades.
 */
export class ChallengeController {
  constructor(challengeModel, challengeView, cardsView, gameStateModel, soundView, statusView, userProfileModel) {
    this.model = challengeModel;
    this.view = challengeView;
    this.cardsView = cardsView;
    this.gameState = gameStateModel;
    this.sound = soundView;
    this.statusView = statusView;
    this.profileModel = userProfileModel;

    this.activeCardData = null;
    this.onChallengeEvent = null; // (type: 'start'|'result', data) => void
    this.setupListeners();
  }

  setupListeners() {
    this.view.onAnswer((selectedIndex) => {
      this.handleAnswer(selectedIndex);
    });

    this.view.onTimeout(() => {
      this.handleTimeout();
    });

    if (this.cardsView) {
      this.cardsView.onCardChosen((cardData) => {
        this.startChallengeWithCard(cardData);
      });
    }
  }

  normalizeDiff(raw = '') {
    return String(raw)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  async triggerChallenge(entity = 'player') {
    return new Promise((resolve) => {
      this.onCompleteResolve = resolve;

      if (entity === 'player') {
        this.gameState.setPhase('challenge');
        this.sound.playChallengeAlert();
        this.gameState.addLog('Arena', 'Você caiu em uma Casa de Desafio! Escolha sua carta tática...', 'warning');

        // Seleciona candidatos para os 3 tiers normalizando strings do desafios.json
        // e priorizando perguntas ainda não sorteadas na sessão atual (usedIds)
        const pickFromPool = (pool) => {
          if (!pool.length) return this.model.getRandomChallenge();
          let available = pool.filter(q => !this.model.usedIds.has(q.id));
          if (!available.length) {
            pool.forEach(q => this.model.usedIds.delete(q.id));
            available = pool;
          }
          return available[Math.floor(Math.random() * available.length)];
        };

        const easy = this.model.challenges.filter(q => {
          const d = this.normalizeDiff(q.dificuldade || q.difficulty);
          return d === 'facil' || d === 'iniciante' || d === 'easy';
        });
        const med = this.model.challenges.filter(q => {
          const d = this.normalizeDiff(q.dificuldade || q.difficulty);
          return d === 'medio' || d === 'intermediario' || d === 'medium' || d === 'normal';
        });
        const hard = this.model.challenges.filter(q => {
          const d = this.normalizeDiff(q.dificuldade || q.difficulty);
          return d === 'dificil' || d === 'avancado' || d === 'hard';
        });

        const candidateQuestions = [
          pickFromPool(easy),
          pickFromPool(med),
          pickFromPool(hard)
        ];

        if (this.cardsView) {
          this.cardsView.showCardsSelection(candidateQuestions);
        } else {
          this.startChallengeWithCard({
            bonus: 2,
            penalty: 0,
            question: candidateQuestions[0],
            tierName: 'Comum'
          });
        }
      } else {
        resolve();
      }
    });
  }

  startChallengeWithCard(cardData) {
    this.activeCardData = cardData;
    this.model.currentChallenge = cardData.question;
    if (cardData.question && cardData.question.id && this.model.usedIds) {
      this.model.usedIds.add(cardData.question.id);
    }

    this.view.show(cardData.question, 25);

    if (this.onChallengeEvent) {
      this.onChallengeEvent('start', {
        question: cardData.question,
        tierName: cardData.tierName,
        bonus: cardData.bonus,
        penalty: cardData.penalty
      });
    }

    this.view.onClose(() => {
      this.gameState.setPhase('waiting_roll');
      if (this.onCompleteResolve) {
        const cb = this.onCompleteResolve;
        this.onCompleteResolve = null;
        cb();
      }
    });
  }

  handleAnswer(selectedIndex) {
    const result = this.model.checkAnswer(selectedIndex);
    this.view.displayFeedback(result);

    const bonus = this.activeCardData ? this.activeCardData.bonus : 2;
    const penalty = this.activeCardData ? this.activeCardData.penalty : 0;
    const tierName = this.activeCardData ? this.activeCardData.tierName : 'Padrão';

    if (result.correct) {
      this.sound.playCompileSuccess();
      this.gameState.playerBoost = bonus;
      this.gameState.addLog('Você', `Acertou o desafio da Carta [${tierName}]! Ganhou +${bonus} de bônus no próximo dado! 🚀`, 'success');
      
      if (this.profileModel) {
        this.profileModel.recordChallenge(true);
      }
    } else {
      this.sound.playCompileError();
      if (penalty > 0) {
        this.gameState.advancePlayer(-penalty);
        this.gameState.addLog('Você', `Errou a Carta [${tierName}]! Sofreu penalidade de recuo de ${penalty} casa(s). ⚠️`, 'danger');
      } else {
        this.gameState.addLog('Você', `Errou a Carta [${tierName}], mas como era carta Comum, não sofreu penalidade! 🛡️`, 'info');
      }

      if (this.profileModel) {
        this.profileModel.recordChallenge(false);
      }
    }

    this.statusView.updateStatusBadges(
      this.gameState.playerBoost,
      this.gameState.playerStunned,
      this.gameState.botStunned,
      false,
      this.gameState.botBoost
    );

    if (this.onChallengeEvent) {
      this.onChallengeEvent('result', {
        selectedIndex: parseInt(selectedIndex, 10),
        correctIndex: result.correctIndex,
        correct: result.correct,
        timeout: false,
        bonus,
        penalty,
        newPos: this.gameState.playerPos
      });
    }
  }

  handleTimeout() {
    const feedback = {
      correct: false,
      timeout: true,
      correctIndex: this.model.currentChallenge ? this.model.currentChallenge.resposta_correta : 0,
      explanation: 'O tempo de 25 segundos esgotou antes da resposta ser enviada.',
      author: this.model.currentChallenge ? this.model.currentChallenge.autor : ''
    };

    this.view.displayFeedback(feedback);
    this.sound.playCompileError();
    this.gameState.playerStunned = true;
    this.gameState.addLog('Tempo', 'Tempo esgotado no Time Attack! Você foi atordoado e perderá o próximo turno.', 'danger');
    
    if (this.profileModel) {
      this.profileModel.recordChallenge(false);
    }
    
    this.statusView.updateStatusBadges(
      this.gameState.playerBoost,
      this.gameState.playerStunned,
      this.gameState.botStunned,
      false,
      this.gameState.botBoost
    );

    if (this.onChallengeEvent) {
      this.onChallengeEvent('result', {
        selectedIndex: null,
        correctIndex: feedback.correctIndex,
        correct: false,
        timeout: true,
        newPos: this.gameState.playerPos
      });
    }
  }
}
