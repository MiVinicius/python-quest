/**
 * CodingController.js
 * Coordena a montagem de blocos com a restrição de energia do dado,
 * validando a sintaxe lógica e autorizando o movimento do jogador.
 */
export class CodingController {
  constructor(blockModel, workspaceView, diceModel, gameStateModel, soundView) {
    this.blockModel = blockModel;
    this.workspaceView = workspaceView;
    this.diceModel = diceModel;
    this.gameState = gameStateModel;
    this.sound = soundView;

    this.onValidExecutionCallback = null;

    this.setupEvents();
  }

  setupEvents() {
    this.workspaceView.onExecute(() => {
      this.handleExecute();
    });

    this.workspaceView.onBlockChanged(() => {
      this.sound.playBlockSnap();
    });
  }

  unlockCoding() {
    this.workspaceView.setExecuteDisabled(false);
  }

  lockCoding() {
    this.workspaceView.setExecuteDisabled(true);
  }

  handleExecute() {
    if (this.gameState.currentTurn !== 'player' || this.gameState.phase !== 'coding') {
      this.gameState.addLog('Sistema', 'Aguarde a rolagem do dado para programar seu movimento.', 'warning');
      return;
    }

    const diceTotal = this.gameState.lastDiceValue;
    const validation = this.blockModel.validateAgainstDice(diceTotal);

    if (validation.valid) {
      this.sound.playCompileSuccess();
      this.gameState.addLog('Compilador', `Status 200 OK: ${validation.message}`, 'success');
      this.lockCoding();
      
      if (this.onValidExecutionCallback) {
        this.onValidExecutionCallback(validation.steps, validation.actions);
      }
    } else {
      this.sound.playCompileError();
      this.gameState.addLog('Compilador', `Erro de Lógica: ${validation.message}`, 'danger');
    }
  }

  onValidExecution(callback) {
    this.onValidExecutionCallback = callback;
  }
}
