/**
 * app.js
 * Ponto de entrada da aplicação Python Quest.
 * Inicializa Models, Views, Controllers e dispara o loop principal.
 */
import { GameStateModel } from './models/GameStateModel.js';
import { BoardModel } from './models/BoardModel.js';
import { DiceModel } from './models/DiceModel.js';
import { BlockProgramModel } from './models/BlockProgramModel.js';
import { BotModel } from './models/BotModel.js';
import { ChallengeModel } from './models/ChallengeModel.js';
import { UserProfileModel } from './models/UserProfileModel.js';
import { OnlineMultiplayerModel } from './models/OnlineMultiplayerModel.js';

import { BoardView } from './views/BoardView.js';
import { DiceView } from './views/DiceView.js';
import { BlockWorkspaceView } from './views/BlockWorkspaceView.js';
import { ChallengeModalView } from './views/ChallengeModalView.js';
import { ChallengeCardsView } from './views/ChallengeCardsView.js';
import { StatusPanelView } from './views/StatusPanelView.js';
import { SoundView } from './views/SoundView.js';
import { HomeView } from './views/HomeView.js?v=0.3.2';

import { CodingController } from './controllers/CodingController.js';
import { ChallengeController } from './controllers/ChallengeController.js';
import { GameController } from './controllers/GameController.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Instanciação dos Models
  const userProfile = new UserProfileModel();
  const onlineModel = new OnlineMultiplayerModel();
  const gameState = new GameStateModel();
  const boardModel = new BoardModel();
  const diceModel = new DiceModel();
  const blockModel = new BlockProgramModel();
  const botModel = new BotModel('normal');
  const challengeModel = new ChallengeModel();

  // 2. Instanciação das Views
  const soundView = new SoundView();
  const homeView = new HomeView(userProfile);
  const boardView = new BoardView('boardContainer', boardModel);
  const diceView = new DiceView('diceContainer');
  const workspaceView = new BlockWorkspaceView('workspaceContainer', blockModel, gameState, boardModel);
  const challengeView = new ChallengeModalView();
  const cardsView = new ChallengeCardsView('challengeCardsModal');
  const statusView = new StatusPanelView();

  // 3. Instanciação dos Sub-Controllers
  const codingController = new CodingController(
    blockModel,
    workspaceView,
    diceModel,
    gameState,
    soundView
  );

  const challengeController = new ChallengeController(
    challengeModel,
    challengeView,
    cardsView,
    gameState,
    soundView,
    statusView,
    userProfile
  );

  // 4. Instanciação e Inicialização do Controller Principal
  const gameController = new GameController({
    gameState,
    boardModel,
    diceModel,
    blockModel,
    botModel,
    challengeModel,
    userProfileModel: userProfile,
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
  });

  gameController.init();

  // Ouvinte único de conexão de oponente no lobby (para Salas Criadas e Partida Rápida)
  onlineModel.onStateChange((event) => {
    if (event.type === 'OPPONENT_CONNECTED' && event.room) {
      homeView.resetQuickMatchUI();
      homeView.closeModal('modalMultiplayer');
      homeView.showGameArena();
      gameController.startOnlineGame(
        event.room.code,
        'host',
        event.room.host,
        event.room.guest
      );
    }
  });

  // 5. Conexão das Ações da Tela Inicial (Home Hub)
  homeView.onStartDemo(() => {
    gameController.startDemoGame();
  });

  homeView.onStartSolo(() => {
    gameController.startSoloGame();
  });

  homeView.onStartMultiplayer(async (data) => {
    if (data.action === 'cancel_quickmatch') {
      onlineModel.cancelQuickMatch();
      return;
    }

    if (data.action === 'quickmatch') {
      try {
        const result = await onlineModel.startQuickMatch(userProfile.data);
        if (!result) return;

        if (result.mode === 'matched_as_guest' && result.room) {
          homeView.resetQuickMatchUI();
          homeView.closeModal('modalMultiplayer');
          homeView.showGameArena();
          gameController.startOnlineGame(
            result.roomCode,
            'guest',
            result.room.host,
            result.room.guest
          );
        } else if (result.mode === 'waiting_as_host') {
          homeView.setLobbyRoomCode(result.roomCode);
        }
      } catch (err) {
        console.error('Erro na Partida Rápida:', err);
        homeView.resetQuickMatchUI();
      }
      return;
    }

    if (data.action === 'create') {
      try {
        const room = await onlineModel.createRoom(userProfile.data);
        homeView.setLobbyRoomCode(room.code);
      } catch (err) {
        console.error('Erro ao criar sala:', err);
        alert('Erro ao criar sala multiplayer.');
      }
    } else if (data.action === 'join') {
      try {
        const result = await onlineModel.joinRoom(data.roomCode, userProfile.data);
        if (result.success) {
          homeView.closeModal('modalMultiplayer');
          homeView.showGameArena();
          gameController.startOnlineGame(data.roomCode, 'guest', result.room.host, result.room.guest);
        } else {
          alert(result.message || 'Código de sala inválido ou não encontrado.');
          homeView.resetJoinButton();
        }
      } catch (err) {
        console.error('Erro ao entrar na sala:', err);
        alert('Erro ao conectar à sala multiplayer.');
        homeView.resetJoinButton();
      }
    }
  });

  // Configurações globais da barra de ferramentas (Áudio Mute, Dificuldade, etc.)
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      const isMuted = soundView.toggleMute();
      soundToggleBtn.textContent = isMuted ? '🔇 Mudo' : '🔊 Som';
    });
  }

  const restartTopBtn = document.getElementById('restartTopBtn');
  if (restartTopBtn) {
    restartTopBtn.addEventListener('click', () => {
      if (confirm('Deseja reiniciar a corrida do início?')) {
        gameController.restartGame();
      }
    });
  }

  const difficultySelect = document.getElementById('difficultySelect');
  if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
      botModel.setDifficulty(e.target.value);
      gameState.addLog('Config', `Dificuldade da CPU ajustada para: ${e.target.value.toUpperCase()}`, 'info');
    });
  }

  // Desbloqueia contexto de áudio no primeiro clique do usuário
  document.body.addEventListener('click', () => {
    soundView.init();
  }, { once: true });
});
