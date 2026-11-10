/**
 * GameController.js
 * Orquestrador principal da aplicação Python Quest.
 * Integração reativa com:
 * - Perfil do Jogador e Carreira (UserProfileModel)
 * - Tela Inicial e Navegação (HomeView)
 * - Ações Ricas Além do Avançar (Pular, Escudo try/except, Loop Turbo)
 * - Desafios de Código Táticos com Cards 3D
 * - Multiplayer Online Realtime P2P (WebRTC PeerJS + BroadcastChannel)
 */
export class GameController {
  constructor({
    gameState,
    boardModel,
    diceModel,
    blockModel,
    botModel,
    challengeModel,
    userProfileModel,
    onlineModel,
    boardView,
    diceView,
    workspaceView,
    challengeView,
    statusView,
    soundView,
    homeView,
    codingController,
    challengeController
  }) {
    this.gameState = gameState;
    this.boardModel = boardModel;
    this.diceModel = diceModel;
    this.blockModel = blockModel;
    this.botModel = botModel;
    this.challengeModel = challengeModel;
    this.userProfile = userProfileModel;
    this.onlineModel = onlineModel;

    this.boardView = boardView;
    this.diceView = diceView;
    this.workspaceView = workspaceView;
    this.challengeView = challengeView;
    this.statusView = statusView;
    this.sound = soundView;
    this.homeView = homeView;

    this.codingCtrl = codingController;
    this.challengeCtrl = challengeController;

    this.gameMode = 'Solo vs CPU';
    this.isOnline = false;
    this.playerRole = 'solo'; // 'solo' | 'host' | 'guest'
    this.roomCode = null;
    this.opponentName = 'CyberBot';
    this.opponentAvatar = '🤖';
    this.myInfo = null;
    this.opponentInfo = null;
  }

  async init() {
    this.statusView.init();
    this.statusView.onRestart(() => this.restartGame());

    // Terminal de eventos reativo
    this.gameState.onLog((entry) => {
      this.statusView.addLog(entry);
    });

    // Eventos do dado
    this.diceView.onRollClick(() => this.handlePlayerRoll());

    // Execução de blocos compilados
    this.codingCtrl.onValidExecution((steps, actions) => this.handlePlayerMove(steps, actions));

    // Repassa ao oponente (multiplayer) o desafio que o jogador está respondendo
    this.challengeCtrl.onChallengeEvent = (type, data) => {
      if (this.isOnline && this.onlineModel) {
        this.onlineModel.sendTurnAction(type === 'start' ? 'CHALLENGE_START' : 'CHALLENGE_RESULT', data);
      }
    };

    // Ouvinte de eventos remotos do Multiplayer Online
    if (this.onlineModel) {
      this.onlineModel.onStateChange((event) => {
        if (event.type === 'REMOTE_ACTION' && this.isOnline) {
          this.handleRemoteAction(event);
        }
      });
    }

    // Botão de retornar à Home
    const backBtn = document.getElementById('backToHomeBtn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (confirm('Deseja sair da corrida e voltar ao Menu Principal?')) {
          this.returnToHome();
        }
      });
    }

    // Carrega o catálogo de desafios
    const loadResult = await this.challengeModel.loadChallenges();
    if (loadResult.success) {
      this.gameState.addLog('Sistema', `Catálogo carregado: ${loadResult.count} desafios de Python ativos (${loadResult.source}).`, 'info');
    }

    // Atualiza dados do jogador a partir do perfil
    this.syncPlayerIdentity();
    if (this.userProfile) {
      this.userProfile.onChange(() => this.syncPlayerIdentity());
    }
  }

  startDemoGame() {
    this.gameMode = 'Demonstração (22 Casas)';
    this.isOnline = false;
    this.isDemo = true;
    this.playerRole = 'solo';
    this.opponentName = 'CyberBot';
    this.opponentAvatar = '🤖';

    const totalTiles = this.boardModel.setBoardMode('demo');
    this.gameState.setTotalTiles(totalTiles);
    this.boardView.rebuildBoard();

    // Exibe controles Solo e badge indicativo do Modo Demonstração
    const diffSelect = document.getElementById('difficultySelect');
    const restartBtn = document.getElementById('restartTopBtn');
    const roomBadge = document.getElementById('roomCodeBadge');
    const roomBadgeText = document.getElementById('roomCodeBadgeText');
    if (diffSelect) diffSelect.style.display = 'inline-block';
    if (restartBtn) restartBtn.style.display = 'inline-block';
    if (roomBadge) roomBadge.style.display = 'inline-flex';
    if (roomBadgeText) roomBadgeText.textContent = '🎯 Modo Demonstração (22 Casas)';

    this.syncPlayerIdentity();
    this.restartGame();
    this.gameState.addLog(
      'Demonstração',
      `🎯 Modo Demonstração iniciado (Trilha reduzida de ${totalTiles} casas contra o ${this.opponentName})! Ideal para avaliação rápida de todas as mecânicas.`,
      'success'
    );
  }

  startSoloGame() {
    this.gameMode = 'Solo vs CPU';
    this.isOnline = false;
    this.isDemo = false;
    this.playerRole = 'solo';
    this.opponentName = 'CyberBot';
    this.opponentAvatar = '🤖';

    const totalTiles = this.boardModel.setBoardMode('full');
    this.gameState.setTotalTiles(totalTiles);
    this.boardView.rebuildBoard();

    // Restaura botões Solo (Dificuldade e Reiniciar) e esconde crachá de sala
    const diffSelect = document.getElementById('difficultySelect');
    const restartBtn = document.getElementById('restartTopBtn');
    const roomBadge = document.getElementById('roomCodeBadge');
    if (diffSelect) diffSelect.style.display = 'inline-block';
    if (restartBtn) restartBtn.style.display = 'inline-block';
    if (roomBadge) roomBadge.style.display = 'none';

    this.syncPlayerIdentity();
    this.restartGame();
    this.gameState.addLog('Python Quest', `Partida Solo iniciada contra o ${this.opponentName} (64 Casas)!`, 'info');
  }

  startOnlineGame(roomCode, playerRole, hostInfo, guestInfo) {
    this.gameMode = 'Multiplayer Online';
    this.isOnline = true;
    this.isDemo = false;
    this.roomCode = roomCode;
    this.playerRole = playerRole; // 'host' ou 'guest'

    const totalTiles = this.boardModel.setBoardMode('full');
    this.gameState.setTotalTiles(totalTiles);
    this.boardView.rebuildBoard();

    // Oculta botões que não fazem sentido no modo multiplayer e exibe crachá da sala
    const diffSelect = document.getElementById('difficultySelect');
    const restartBtn = document.getElementById('restartTopBtn');
    const roomBadge = document.getElementById('roomCodeBadge');
    const roomBadgeText = document.getElementById('roomCodeBadgeText');
    if (diffSelect) diffSelect.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'none';
    if (roomBadge) roomBadge.style.display = 'inline-flex';
    if (roomBadgeText) roomBadgeText.textContent = `Sala: ${roomCode}`;

    const isHost = (playerRole === 'host');
    this.myInfo = isHost ? hostInfo : guestInfo;
    this.opponentInfo = isHost ? guestInfo : hostInfo;

    this.opponentName = this.opponentInfo ? this.opponentInfo.nickname : (isHost ? 'Convidado' : 'Anfitrião');
    this.opponentAvatar = this.opponentInfo ? this.opponentInfo.avatar : '🦊';

    this.syncPlayerIdentity();
    this.gameState.reset();
    this.blockModel.clear();
    this.workspaceView.updateUI();
    this.diceView.hideEnergy();
    this.updateAllViews();
    this.boardView.centerOnTile(1, false);

    this.gameState.addLog('Multiplayer', `Conectado à sala ${roomCode}! Você é: ${isHost ? 'Host (Você joga primeiro)' : 'Convidado'}`, 'success');

    if (isHost) {
      this.startPlayerTurn();
    } else {
      // Convidado aguarda o primeiro turno do Host
      this.gameState.currentTurn = 'bot';
      this.diceView.setDisabled(true);
      this.codingCtrl.lockCoding();
      this.workspaceView.setSpectatorMode(true, {
        name: this.opponentName,
        avatar: this.opponentAvatar,
        phase: 'thinking'
      });
      this.boardView.showOpponentWindow({
        avatar: this.opponentAvatar,
        name: this.opponentName,
        sub: 'Multiplayer Online',
        phase: '🧠 Aguardando...',
        tickerText: `Aguardando a jogada inicial de ${this.opponentName}...`
      });
      this.updateAllViews();
      this.gameState.addLog('Multiplayer', `Aguardando a jogada inicial de ${this.opponentName}...`, 'info');
    }
  }

  async handleRemoteAction(event) {
    if (!this.isOnline || event.senderRole === this.playerRole) return;

    const action = event.actionName;
    const payload = event.payload || {};

    if (action === 'ROLL') {
      this.sound.playDiceRoll();
      this.workspaceView.setSpectatorMode(true, {
        name: this.opponentName,
        avatar: this.opponentAvatar,
        phase: 'rolling',
        roll: payload.roll,
        bonus: payload.bonus || 0,
        total: payload.total
      });
      this.boardView.showOpponentWindow({
        avatar: this.opponentAvatar,
        name: this.opponentName,
        sub: 'Multiplayer Online',
        phase: '🎲 Rolando Dado...',
        dice: payload.roll,
        steps: payload.total,
        tickerText: `${this.opponentName} rolou ${payload.roll}${payload.bonus > 0 ? ` (+${payload.bonus})` : ''} = ${payload.total} passos.`
      });
      await this.diceView.animateRoll(payload.roll, payload.bonus || 0);
      this.gameState.addLog('Multiplayer', `${this.opponentName} rolou o dado: ${payload.roll}${payload.bonus > 0 ? ` (+${payload.bonus})` : ''} = ${payload.total} passos.`, 'info');
    } else if (action === 'MOVE') {
      const oldPos = this.gameState.botPos;
      const targetPos = payload.newPos;
      this.gameState.botPos = targetPos;

      // Exibe os blocos e o código Python do oponente remoto no workspace e na janela flutuante sobre o tabuleiro!
      this.workspaceView.setSpectatorMode(true, {
        name: this.opponentName,
        avatar: this.opponentAvatar,
        phase: 'executing',
        steps: payload.steps,
        code: payload.code,
        formula: payload.formula,
        blocks: payload.blocks
      });

      this.boardView.showOpponentWindow({
        avatar: this.opponentAvatar,
        name: this.opponentName,
        sub: 'Multiplayer Online',
        phase: '⚡ Executando Algoritmo',
        steps: payload.steps,
        blocks: payload.blocks,
        formula: payload.formula,
        pythonCode: payload.code,
        tickerText: `Executando algoritmo: avançando ${payload.steps} casas...`
      });

      this.gameState.addLog('Multiplayer', `${this.opponentName} compilou seu algoritmo e moveu ${payload.steps} passo(s)...`, 'info');

      this.boardView.centerOnTile(oldPos, true);

      await this.boardView.animateStepByStep('bot', oldPos, targetPos, (curr, i, stepDiff) => {
        this.sound.playStep();
        this.statusView.updateProgress(this.gameState.playerPos, curr, this.gameState.TOTAL_TILES);
        this.boardView.updateOpponentTicker(`Movendo para Casa ${curr}... (Passo ${i + 1} de ${stepDiff})`);
      });

      if (targetPos >= this.gameState.TOTAL_TILES) {
        this.handleGameOver('bot');
      }
    } else if (action === 'CHALLENGE_START') {
      this.boardView.showOpponentChallenge({
        avatar: this.opponentAvatar,
        name: this.opponentName,
        sub: 'Multiplayer Online',
        question: payload.question,
        tierName: payload.tierName,
        rewardText: `Acerto: +${payload.bonus ?? 2} boost • Erro: ${payload.penalty > 0 ? `recua ${payload.penalty}` : 'sem penalidade'}`
      });
      this.boardView.startOpponentThinking();
      this.gameState.addLog('Multiplayer', `${this.opponentName} caiu em um Desafio e está respondendo...`, 'warning');
    } else if (action === 'CHALLENGE_RESULT') {
      let resultText;
      if (payload.timeout) resultText = `⏰ ${this.opponentName} não respondeu a tempo e foi atordoado!`;
      else if (payload.correct) resultText = `✅ ${this.opponentName} acertou e ganhou +${payload.bonus ?? 2} de boost!`;
      else resultText = `❌ ${this.opponentName} errou${payload.penalty > 0 ? ` e recuou ${payload.penalty} casa(s)` : ''}.`;

      this.boardView.revealOpponentAnswer({
        selectedIndex: payload.selectedIndex,
        correctIndex: payload.correctIndex,
        correct: payload.correct,
        timeout: payload.timeout,
        resultText
      });
      this.gameState.addLog('Multiplayer', resultText, payload.correct ? 'warning' : 'info');

      if (typeof payload.newPos === 'number' && payload.newPos !== this.gameState.botPos) {
        this.gameState.botPos = payload.newPos;
        this.updateAllViews();
      }
    } else if (action === 'END_TURN') {
      if (this.gameState.phase === 'game_over') return;
      this.gameState.roundCount = payload.round || this.gameState.roundCount;
      this.gameState.addLog('Multiplayer', `É a sua vez de jogar! Role o dado.`, 'success');
      this.startPlayerTurn();
    }
  }

  syncPlayerIdentity() {
    const data = this.userProfile ? this.userProfile.data : { avatar: '🐍', nickname: 'Você' };

    const avatarEl = document.getElementById('playerAvatarIcon');
    const nameEl = document.getElementById('playerNameDisplay');
    const trackPawn = document.getElementById('raceTrackPlayer');

    if (avatarEl) avatarEl.textContent = data.avatar;
    if (nameEl) nameEl.textContent = data.nickname;
    if (trackPawn) trackPawn.textContent = data.avatar;

    const opAvatarEl = document.getElementById('opponentAvatarIcon');
    const opNameEl = document.getElementById('opponentNameDisplay');
    const opTrackPawn = document.getElementById('raceTrackBot');

    if (opAvatarEl) opAvatarEl.textContent = this.opponentAvatar;
    if (opNameEl) opNameEl.textContent = this.opponentName;
    if (opTrackPawn) opTrackPawn.textContent = this.opponentAvatar;

    this.boardView.setPlayerProfile(data.avatar, data.nickname);
    this.boardView.setOpponentProfile(this.opponentAvatar, this.opponentName);
  }

  returnToHome() {
    this.gameState.setPhase('game_over');
    if (this.onlineModel) {
      this.onlineModel.leaveRoom();
    }
    this.boardView.hideOpponentWindow();
    // Restaura visualização padrão dos botões do cabeçalho
    const diffSelect = document.getElementById('difficultySelect');
    const restartBtn = document.getElementById('restartTopBtn');
    const roomBadge = document.getElementById('roomCodeBadge');
    if (diffSelect) diffSelect.style.display = 'inline-block';
    if (restartBtn) restartBtn.style.display = 'inline-block';
    if (roomBadge) roomBadge.style.display = 'none';

    if (this.homeView) {
      this.homeView.showHomeScreen();
    }
  }

  updateAllViews() {
    this.statusView.updateProgress(this.gameState.playerPos, this.gameState.botPos, this.gameState.TOTAL_TILES);
    this.statusView.updateTurn(this.gameState.currentTurn, this.gameState.roundCount, this.isOnline, this.opponentName);
    
    // Atualiza crachás de status (Boost, Stun e Escudo)
    this.statusView.updateStatusBadges(
      this.gameState.playerBoost,
      this.gameState.playerStunned,
      this.gameState.botStunned,
      this.isOnline,
      this.gameState.botBoost
    );

    if (this.gameState.playerShielded) {
      const badge = document.getElementById('playerStatusBadge');
      if (badge) {
        badge.className = 'badge-status badge-boost';
        badge.innerHTML = '🛡️ Escudo Ativo (try/except)';
      }
    }

    this.boardView.updatePawns(this.gameState.playerPos, this.gameState.botPos);
    if (this.workspaceView) {
      this.workspaceView.updateUI();
    }
  }

  startPlayerTurn() {
    if (this.gameState.phase === 'game_over') return;

    this.gameState.currentTurn = 'player';
    if (this.workspaceView) {
      this.workspaceView.setSpectatorMode(false);
    }
    this.boardView.hideOpponentWindow();
    this.updateAllViews();

    // Centraliza a visão no peão do jogador
    this.boardView.centerOnTile(this.gameState.playerPos, true);
    this.diceView.hideEnergy();

    if (this.gameState.playerStunned) {
      this.gameState.playerStunned = false;
      this.gameState.addLog('Você', 'Você se recuperou do atordoamento (Stun), mas perdeu a vez!', 'danger');
      this.updateAllViews();

      if (this.isOnline) {
        if (this.onlineModel) {
          this.onlineModel.sendTurnAction('END_TURN', { round: this.gameState.roundCount });
        }
        this.gameState.currentTurn = 'bot';
        this.diceView.setDisabled(true);
        this.codingCtrl.lockCoding();
        this.boardView.showOpponentWindow({
          avatar: this.opponentAvatar,
          name: this.opponentName,
          sub: 'Multiplayer Online',
          phase: '🧠 Aguardando...',
          tickerText: `Aguardando a vez de ${this.opponentName}...`
        });
        this.updateAllViews();
        this.gameState.addLog('Multiplayer', `Aguardando a vez de ${this.opponentName}...`, 'info');
      } else {
        setTimeout(() => this.startBotTurn(), 1200);
      }
      return;
    }

    this.gameState.setPhase('waiting_roll');
    this.diceModel.setBonus(this.gameState.playerBoost);
    this.diceView.setBonus(this.gameState.playerBoost);
    this.diceView.setDisabled(false);
    this.codingCtrl.lockCoding();

    this.gameState.addLog('Você', 'Sua vez! Clique em "Rolar Dado" para gerar sua energia de código.', 'info');
  }

  async handlePlayerRoll() {
    if (this.gameState.currentTurn !== 'player' || this.gameState.phase !== 'waiting_roll') return;

    this.sound.playDiceRoll();
    const result = this.diceModel.roll();
    await this.diceView.animateRoll(result.roll, result.bonus);

    this.gameState.setRollData(result.roll, result.bonus, result.total);
    this.gameState.playerBoost = 0;
    this.gameState.setPhase('coding');

    this.gameState.addLog('Você', `Dado rolou ${result.roll} ${result.bonus > 0 ? `(+${result.bonus} de bônus)` : ''} = ${result.total} passos. Monte seus blocos!`, 'info');

    // Notifica o oponente online
    if (this.isOnline && this.onlineModel) {
      this.onlineModel.sendTurnAction('ROLL', { roll: result.roll, bonus: result.bonus, total: result.total });
    }

    this.codingCtrl.unlockCoding();
    this.updateAllViews();
  }

  async handlePlayerMove(steps, actions = []) {
    this.gameState.setPhase('moving');
    this.diceView.hideEnergy();

    // Processa modificadores e ações avançadas
    const hasShield = actions && actions.some(a => a.actionKind === 'shield');
    const hasJump = actions && actions.some(a => a.actionKind === 'jump');
    const conditionalActions = actions ? actions.filter(a => a.actionKind === 'conditional') : [];

    if (hasShield) {
      this.gameState.playerShielded = true;
      this.gameState.addLog('Você', '🛡️ Escudo de Proteção (try...except BugTrap) armado! O próximo bug será ignorado.', 'info');
    }

    if (conditionalActions.length > 0) {
      const evaluatedConds = new Set();
      const pureRoll = this.gameState.lastDiceRoll || this.gameState.lastDiceValue;
      const baseSteps = steps;

      for (const conditionalAction of conditionalActions) {
        const cond = conditionalAction.condition;
        if (evaluatedConds.has(cond)) continue;
        evaluatedConds.add(cond);

        let conditionMet = false;
        let condDesc = '';
        let condDetail = '';

        if (cond === 'oponente_a_frente') {
          conditionMet = (this.gameState.botPos > this.gameState.playerPos);
          condDesc = 'oponente.a_frente';
          condDetail = conditionMet 
            ? `Oponente na casa ${this.gameState.botPos} está à frente de Você na casa ${this.gameState.playerPos}`
            : `Oponente na casa ${this.gameState.botPos} NÃO está à frente de Você na casa ${this.gameState.playerPos}`;
        } else if (cond === 'dado_par') {
          conditionMet = (pureRoll % 2 === 0);
          condDesc = 'dado % 2 == 0';
          condDetail = conditionMet
            ? `dado rolado foi ${pureRoll} (PAR: ${pureRoll} % 2 == 0 é True)`
            : `dado rolado foi ${pureRoll} (ÍMPAR: ${pureRoll} % 2 == 1 != 0 é False)`;
        } else if (cond === 'dado_impar') {
          conditionMet = (pureRoll % 2 !== 0);
          condDesc = 'dado % 2 != 0';
          condDetail = conditionMet
            ? `dado rolado foi ${pureRoll} (ÍMPAR: ${pureRoll} % 2 != 0 é True)`
            : `dado rolado foi ${pureRoll} (PAR: ${pureRoll} % 2 == 0 é False)`;
        } else if (cond === 'casa_com_bug') {
          const targetTile = this.boardModel ? this.boardModel.getTile(this.gameState.playerPos + baseSteps) : null;
          conditionMet = Boolean(targetTile && (targetTile.type === 'trap' || targetTile.type === 'bug'));
          condDesc = 'proxima_casa.tem_bug()';
          condDetail = conditionMet
            ? `a casa de destino ${this.gameState.playerPos + baseSteps} contém um Bug!`
            : `a casa de destino ${this.gameState.playerPos + baseSteps} é livre de bugs.`;
        }

        if (conditionMet) {
          steps += 1;
          this.sound.playCompileSuccess();
          this.gameState.addLog('Você', `🔀 Condicional [if ${condDesc}] VERDADEIRA! (${condDetail}). Bônus de +1 PASSO contabilizado com sucesso! Total a mover: ${steps} casas. 🧠`, 'success');
        } else {
          this.gameState.addLog('Você', `🔀 Condicional [if ${condDesc}] FALSA: ${condDetail}. Nenhum passo bônus foi concedido desta vez.`, 'warning');
        }
      }
    }

    if (hasJump) {
      this.gameState.addLog('Você', `🦘 Pulo acrobático de ${steps} casas executado com sucesso!`, 'info');
    }

    const oldPos = this.gameState.playerPos;
    const newPos = this.gameState.advancePlayer(steps);

    if (this.userProfile) {
      this.userProfile.addTilesTraveled(newPos - oldPos);
    }

    this.gameState.addLog('Você', `Executando ${steps} passo(s) programados no tabuleiro...`, 'info');

    // Notifica o oponente online com dados completos da jogada
    if (this.isOnline && this.onlineModel) {
      const tree = this.blockModel.evaluateTree();
      this.onlineModel.sendTurnAction('MOVE', { 
        steps, 
        newPos, 
        shielded: this.gameState.playerShielded,
        jumped: hasJump,
        code: this.blockModel.toPythonCode(),
        formula: tree.formula,
        blocks: this.blockModel.rootBlocks
      });
    }

    await this.boardView.animateStepByStep('player', oldPos, newPos, (curr) => {
      this.sound.playStep();
      this.statusView.updateProgress(curr, this.gameState.botPos, this.gameState.TOTAL_TILES);
    });

    // Limpa workspace após compilar e mover
    this.blockModel.clear();
    this.workspaceView.updateUI();

    await this.handleTileLanding('player', newPos, { jumped: hasJump });
  }

  async handleTileLanding(entity, tileNumber, options = {}) {
    const tile = this.boardModel.getTile(tileNumber);
    if (!tile) return;
    const jumped = Boolean(options.jumped);

    // Vitória
    if (tileNumber >= this.gameState.TOTAL_TILES) {
      this.handleGameOver(entity);
      return;
    }

    // Atalhos
    if (tile.type === 'shortcut' && tile.effect) {
      const extraSteps = tile.effect.steps;
      this.boardView.triggerTileEffect(tileNumber, 'shortcut');
      this.sound.playCompileSuccess();
      this.gameState.addLog(entity === 'player' ? 'Você' : this.opponentName, `Pisou em um ${tile.label}! Avançando mais ${extraSteps} casas! ⚡`, 'success');

      const currentPos = entity === 'player' ? this.gameState.playerPos : this.gameState.botPos;
      const targetPos = entity === 'player' ? this.gameState.advancePlayer(extraSteps) : this.gameState.advanceBot(extraSteps);

      if (entity === 'player' && this.userProfile) {
        this.userProfile.addTilesTraveled(targetPos - currentPos);
      }

      await this.boardView.animateStepByStep(entity, currentPos, targetPos, (curr) => {
        this.sound.playStep();
        this.statusView.updateProgress(
          entity === 'player' ? curr : this.gameState.playerPos,
          entity === 'bot' ? curr : this.gameState.botPos,
          this.gameState.TOTAL_TILES
        );
      });

      if (targetPos >= this.gameState.TOTAL_TILES) {
        this.handleGameOver(entity);
        return;
      }
    }

    // Armadilhas / Bugs
    else if (tile.type === 'trap' && tile.effect) {
      if (jumped) {
        this.boardView.triggerTileEffect(tileNumber, 'shortcut');
        this.sound.playCompileSuccess();
        this.gameState.addLog(
          entity === 'player' ? 'Você' : this.opponentName,
          `🦘 O Pulo Acrobático (pular) saltou por cima do ${tile.label}! Armadilha evitada com sucesso!`,
          'success'
        );
        this.updateAllViews();
      } else if (entity === 'player' && this.gameState.playerShielded) {
        this.gameState.playerShielded = false;
        this.boardView.triggerTileEffect(tileNumber, 'shortcut');
        this.sound.playCompileSuccess();
        this.gameState.addLog('Você', `🛡️ O Escudo Protetor (try...except) absorveu o ${tile.label}! Penalidade completamente anulada!`, 'success');
        
        if (this.userProfile) {
          this.userProfile.unlockAchievement('shield_master');
        }
        this.updateAllViews();
      } else {
        const penaltySteps = tile.effect.steps;
        this.boardView.triggerTileEffect(tileNumber, 'trap');
        this.sound.playCompileError();
        this.gameState.addLog(entity === 'player' ? 'Você' : this.opponentName, `Caiu em uma armadilha: ${tile.label}! Recuando ${Math.abs(penaltySteps)} casas! 🐛`, 'danger');

        const currentPos = entity === 'player' ? this.gameState.playerPos : this.gameState.botPos;
        const targetPos = entity === 'player' ? this.gameState.advancePlayer(penaltySteps) : this.gameState.advanceBot(penaltySteps);

        await this.boardView.animateStepByStep(entity, currentPos, targetPos, (curr) => {
          this.sound.playStep();
          this.statusView.updateProgress(
            entity === 'player' ? curr : this.gameState.playerPos,
            entity === 'bot' ? curr : this.gameState.botPos,
            this.gameState.TOTAL_TILES
          );
        });
      }
    }

    // Desafios de Código Táticos com Cards
    else if (tile.type === 'challenge') {
      this.boardView.triggerTileEffect(tileNumber, 'challenge');
      if (entity === 'player') {
        await this.challengeCtrl.triggerChallenge('player');
      } else if (!this.isOnline) {
        await this.runBotChallenge();
      }
    }

    // Fim do turno
    this.updateAllViews();
    if (this.gameState.phase !== 'game_over') {
      if (entity === 'player') {
        if (this.isOnline) {
          // Em multiplayer online, avisa o oponente que o turno acabou e aguarda
          if (this.onlineModel) {
            this.onlineModel.sendTurnAction('END_TURN', { round: this.gameState.roundCount });
          }
          this.gameState.currentTurn = 'bot';
          this.diceView.setDisabled(true);
          this.codingCtrl.lockCoding();
          if (this.workspaceView) {
            this.workspaceView.setSpectatorMode(true, {
              name: this.opponentName,
              avatar: this.opponentAvatar,
              phase: 'thinking'
            });
          }
          this.boardView.showOpponentWindow({
            avatar: this.opponentAvatar,
            name: this.opponentName,
            sub: 'Multiplayer Online',
            phase: '🧠 Aguardando...',
            tickerText: `Turno finalizado. Aguardando a jogada de ${this.opponentName}...`
          });
          this.updateAllViews();
          this.gameState.addLog('Multiplayer', `Turno finalizado. Aguardando a jogada de ${this.opponentName}...`, 'info');
        } else {
          // Solo vs CPU: aciona o CyberBot
          setTimeout(() => this.startBotTurn(), 800);
        }
      } else {
        setTimeout(() => this.startPlayerTurn(), 800);
      }
    }
  }

  /**
   * CPU responde um desafio real, exibido na janela flutuante sobre o tabuleiro:
   * pergunta + opções → "pensando" → escolha → acerto/erro.
   */
  async runBotChallenge() {
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const question = this.challengeModel.getRandomChallenge();
    const botSolved = this.botModel.answerChallenge();

    if (question && Array.isArray(question.opcoes) && question.opcoes.length > 0) {
      this.boardView.showOpponentChallenge({
        avatar: this.opponentAvatar,
        name: this.opponentName,
        sub: 'Inteligência Artificial',
        question,
        tierName: question.dificuldade || 'Desafio',
        rewardText: 'Acerto: +2 boost • Erro: Stun (perde a vez)'
      });
      this.gameState.addLog('CPU', `${this.opponentName} caiu em um Desafio e está analisando as opções...`, 'warning');
      this.boardView.startOpponentThinking();

      await wait(2200 + Math.random() * 1200);

      const correctIndex = question.resposta_correta;
      let selectedIndex = correctIndex;
      if (!botSolved) {
        const wrong = question.opcoes.map((_, i) => i).filter(i => i !== correctIndex);
        selectedIndex = wrong[Math.floor(Math.random() * wrong.length)];
      }

      const resultText = botSolved
        ? `✅ ${this.opponentName} acertou e ganhou +2 de boost!`
        : `❌ ${this.opponentName} errou e foi atordoado (perde a próxima vez)!`;

      this.boardView.revealOpponentAnswer({ selectedIndex, correctIndex, correct: botSolved, resultText });
      if (botSolved) this.sound.playCompileSuccess?.();
      else this.sound.playCompileError?.();
    }

    if (botSolved) {
      this.gameState.addLog('CPU', `O ${this.opponentName} acertou o desafio Python e ganhou boost! 🤖`, 'warning');
      this.gameState.botBoost = 2;
    } else {
      this.gameState.addLog('CPU', `O ${this.opponentName} falhou na compilação do desafio e foi atordoado!`, 'info');
      this.gameState.botStunned = true;
    }

    // Tempo para o jogador ler o resultado
    if (question) await wait(3000);
  }

  async startBotTurn() {
    if (this.gameState.phase === 'game_over' || this.isOnline) return;

    this.gameState.currentTurn = 'bot';
    this.gameState.setPhase('moving');
    this.diceView.hideEnergy();
    this.diceView.setDisabled(true);
    this.codingCtrl.lockCoding();
    this.updateAllViews();

    if (this.gameState.botStunned) {
      this.gameState.botStunned = false;
      this.gameState.addLog('CPU', `${this.opponentName} está se reiniciando do Stun e pulou esta rodada.`, 'info');
      this.updateAllViews();
      setTimeout(() => this.startPlayerTurn(), 1200);
      return;
    }

    // 1. Inicia Modo Espectador e abre a Janela Flutuante sobre o Tabuleiro (Fase 1: Pensando)
    if (this.workspaceView) {
      this.workspaceView.setSpectatorMode(true, {
        name: this.opponentName,
        avatar: this.opponentAvatar,
        phase: 'thinking'
      });
    }

    this.boardView.showOpponentWindow({
      avatar: this.opponentAvatar,
      name: this.opponentName,
      sub: 'Inteligência Artificial',
      phase: '🧠 Analisando Trilha...',
      tickerText: `${this.opponentName} está calculando as melhores jogadas...`
    });

    this.gameState.addLog('CPU', `${this.opponentName} está analisando algoritmos e rolando o dado...`, 'info');
    await new Promise(r => setTimeout(r, 650));

    // 2. Rola o dado (Fase 2: Rolando) e aplica botBoost se ativo
    const botRoll = Math.floor(Math.random() * 6) + 1;
    const botBonus = this.gameState.botBoost || 0;
    const totalBotEnergy = botRoll + botBonus;
    this.gameState.botBoost = 0;

    if (this.workspaceView) {
      this.workspaceView.setSpectatorMode(true, {
        name: this.opponentName,
        avatar: this.opponentAvatar,
        phase: 'rolling',
        roll: totalBotEnergy
      });
    }

    this.boardView.showOpponentWindow({
      avatar: this.opponentAvatar,
      name: this.opponentName,
      sub: 'Inteligência Artificial',
      phase: '🎲 Rolando Dado...',
      dice: botBonus > 0 ? `${botRoll}+${botBonus}` : botRoll,
      steps: totalBotEnergy,
      tickerText: `Dado sorteado: ${botRoll}${botBonus > 0 ? ` (+${botBonus} boost) = ${totalBotEnergy}` : ''}. Preparando algoritmos...`
    });

    this.sound.playDiceRoll();
    await this.diceView.animateRoll(botRoll, botBonus);

    // 3. Monta algoritmo e exibe no Workspace e na Janela Flutuante (Fase 3: Codificando)
    if (this.workspaceView) {
      this.workspaceView.setSpectatorMode(true, {
        name: this.opponentName,
        avatar: this.opponentAvatar,
        phase: 'coding',
        roll: totalBotEnergy
      });
    }

    this.boardView.showOpponentWindow({
      avatar: this.opponentAvatar,
      name: this.opponentName,
      sub: 'Inteligência Artificial',
      phase: '💻 Programando Algoritmo...',
      dice: botBonus > 0 ? `${botRoll}+${botBonus}` : botRoll,
      steps: totalBotEnergy,
      tickerText: `Montando blocos e otimizando código Python...`
    });

    await new Promise(r => setTimeout(r, 700));

    const decision = this.botModel.decideTurn(totalBotEnergy, {
      botPos: this.gameState.botPos,
      playerPos: this.gameState.playerPos,
      boardModel: this.boardModel
    });

    // 4. Exibe os blocos e o código Python compilado da CPU no Workspace e na Janela Flutuante!
    if (this.workspaceView) {
      this.workspaceView.setSpectatorMode(true, {
        name: this.opponentName,
        avatar: this.opponentAvatar,
        phase: 'executing',
        steps: decision.steps,
        code: decision.simulatedCode,
        formula: decision.formula,
        blocks: decision.blocks
      });
    }

    this.boardView.showOpponentWindow({
      avatar: this.opponentAvatar,
      name: this.opponentName,
      sub: 'Inteligência Artificial',
      phase: '⚡ Executando no Tabuleiro',
      dice: botBonus > 0 ? `${botRoll}+${botBonus}` : botRoll,
      steps: decision.steps,
      blocks: decision.blocks,
      formula: decision.formula,
      pythonCode: decision.simulatedCode,
      tickerText: `Algoritmo compilado com sucesso! Iniciando corrida...`
    });

    this.gameState.addLog('CPU', `${this.opponentName} compilou:\n${decision.simulatedCode.replace('\n', ' ')}`, 'info');

    // Pausa para o jogador ler o código da CPU antes de mover
    await new Promise(r => setTimeout(r, 900));

    // 5. Move o peão da CPU no tabuleiro com rastreamento de câmera e ticker dinâmico
    this.boardView.centerOnTile(this.gameState.botPos, true);

    const oldPos = this.gameState.botPos;
    const newPos = this.gameState.advanceBot(decision.steps);

    await this.boardView.animateStepByStep('bot', oldPos, newPos, (curr, i, stepDiff) => {
      this.sound.playStep();
      this.statusView.updateProgress(this.gameState.playerPos, curr, this.gameState.TOTAL_TILES);
      this.boardView.updateOpponentTicker(`Movendo para Casa ${curr}... (Passo ${i + 1} de ${stepDiff})`);
    });

    await this.handleTileLanding('bot', newPos, { jumped: decision.jumped });
  }

  handleGameOver(winner) {
    this.gameState.setPhase('game_over');
    this.sound.playVictory();
    this.boardView.hideOpponentWindow();
    
    const isPlayer = (winner === 'player' || winner === 'p1');
    const winnerName = isPlayer ? (this.userProfile ? this.userProfile.data.nickname : 'Você') : this.opponentName;
    
    this.gameState.addLog('Fim de Jogo', `A corrida acabou! Vencedor: ${winnerName}! 🏆`, 'success');
    this.statusView.showGameOver(winner, this.gameState.roundCount, this.isOnline, winnerName);

    if (this.userProfile) {
      this.userProfile.recordMatch(winner, this.gameState.roundCount, this.gameMode, this.opponentName);
    }
  }

  restartGame() {
    this.gameState.reset();
    this.blockModel.clear();
    this.workspaceView.updateUI();
    this.diceView.hideEnergy();
    this.boardView.hideOpponentWindow();
    this.updateAllViews();
    this.boardView.centerOnTile(1, false);
    this.gameState.addLog('Sistema', 'Corrida pronta na Casa 1.', 'info');
    if (!this.isOnline || this.playerRole === 'host') {
      this.startPlayerTurn();
    }
  }
}
