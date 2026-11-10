/**
 * BlockWorkspaceView.js
 * Interface hierárquica de programação em blocos com suporte a:
 * - Loops aninhados (for dentro de for)
 * - Condicionais if com avaliação em tempo real (Live Badge)
 * - Comandos sequenciais posicionáveis
 * - Drag & Drop avançado com áreas de indentação + Clique rápido
 * - Reordenação rápida via botões ⬆️ ⬇️
 * - Avaliação de fórmulas em tempo real e Syntax Highlighting de Python
 */
export class BlockWorkspaceView {
  constructor(containerId, blockProgramModel, gameStateModel = null, boardModel = null) {
    this.container = document.getElementById(containerId);
    this.model = blockProgramModel;
    this.gameState = gameStateModel;
    this.boardModel = boardModel;
    
    this.onExecuteCallback = null;
    this.onBlockChangedCallback = null;
    this.isSpectatorMode = false;

    this.render();
    this.setupEvents();
  }

  /**
   * Aplica Syntax Highlighting seguro ao código Python gerado.
   */
  formatPythonSyntax(rawCode = '') {
    const escapeHtml = (str) => String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return String(rawCode)
      .split('\n')
      .map((line) => {
        const commentIdx = line.indexOf('#');
        let codePart = commentIdx !== -1 ? line.slice(0, commentIdx) : line;
        const commentPart = commentIdx !== -1 ? line.slice(commentIdx) : '';

        let html = escapeHtml(codePart);

        // Destaca keywords Python
        html = html.replace(
          /\b(for|in|range|if|try|except|pass|True|False)\b/g,
          '<span class="py-kw">$1</span>'
        );

        // Destaca exceções
        html = html.replace(
          /\b(BugTrapException)\b/g,
          '<span class="py-exc">$1</span>'
        );

        // Destaca métodos
        html = html.replace(
          /\.(avancar|pular|ativar_escudo|passo_bonus|tem_bug|acelerar)\b/g,
          '.<span class="py-fn">$1</span>'
        );

        // Destaca números
        html = html.replace(
          /\b(\d+)\b/g,
          '<span class="py-num">$1</span>'
        );

        if (commentPart) {
          html += `<span class="py-comment">${escapeHtml(commentPart)}</span>`;
        }

        return html;
      })
      .join('\n');
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="workspace-card">
        <div class="workspace-header">
          <div class="header-left">
            <span class="icon">🧩</span>
            <h3>Painel de Instruções</h3>
          </div>
          <button id="clearWorkspaceBtn" class="btn-ghost btn-xs" title="Limpar todos os blocos">
            🗑️ Limpar
          </button>
        </div>

        <!-- Banner do Modo Espectador (Jogada do Oponente) -->
        <div id="spectatorBanner" class="spectator-banner" style="display: none;">
          <div class="spectator-badge-title">
            <span class="spectator-pulse">👁️</span>
            <span id="spectatorOpponentName">Turno do Oponente</span>
          </div>
          <span id="spectatorStatusText" class="spectator-status-badge">Aguardando jogada...</span>
        </div>

        <!-- Paleta com Blocos Arrastáveis -->
        <div class="block-palette-section">
          <span class="section-tag">Paleta de Blocos (Arraste ou clique para adicionar):</span>
          <div class="tokens-palette" id="paletteBlocks">
            
            <!-- 1. Loop for -->
            <button class="token-block token-loop-for" draggable="true" data-type="loop_for" data-default-val="2" title="Loop repetidor: for i in range(N)">
              <div class="token-top-row">
                <span class="token-icon">🔁</span>
                <span class="token-label">Loop for</span>
              </div>
              <span class="token-sublabel">for i in range(2):</span>
            </button>

            <!-- 2. Avançar -->
            <button class="token-block token-action-forward" draggable="true" data-type="action_forward" data-default-val="1" title="Avançar casas normais">
              <div class="token-top-row">
                <span class="token-icon">➡️</span>
                <span class="token-label">Avançar</span>
              </div>
              <span class="token-sublabel">player.avancar(N)</span>
            </button>

            <!-- 3. Pular -->
            <button class="token-block token-action-jump" draggable="true" data-type="action_jump" data-default-val="1" title="Pular direto ignorando armadilhas">
              <div class="token-top-row">
                <span class="token-icon">🦘</span>
                <span class="token-label">Pular</span>
              </div>
              <span class="token-sublabel">player.pular(N)</span>
            </button>

            <!-- 4. Escudo -->
            <button class="token-block token-action-shield" draggable="true" data-type="action_shield" data-default-val="0" title="Blindagem try/except contra bugs">
              <div class="token-top-row">
                <span class="token-icon">🛡️</span>
                <span class="token-label">Escudo</span>
              </div>
              <span class="token-sublabel">try / except</span>
            </button>

            <!-- 5. Condicional if -->
            <button class="token-block token-conditional-if" draggable="true" data-type="conditional_if" data-condition="dado_par" title="Decisão Tática: if condicao: (+1 passo bônus)">
              <div class="token-top-row">
                <span class="token-icon">🔀</span>
                <span class="token-label">Condicional if</span>
              </div>
              <span class="token-sublabel">if dado % 2 == 0:</span>
            </button>

          </div>
        </div>

        <!-- Janela de Linha de Execução -->
        <div class="workspace-dropzone-section">
          <div class="dropzone-header">
            <span class="section-tag">Linha de Execução & Algoritmo:</span>
            <span id="blockCountBadge" class="badge-step-count">0 passos</span>
          </div>

          <div class="tokens-dropzone" id="workspaceDropzone" data-parent-id="root">
            <div class="dropzone-empty" id="dropzoneEmpty">
              <span class="empty-icon">💡</span>
              <p>Arraste ou clique nos blocos! Você pode aninhar <strong>for dentro de for</strong> ou usar <strong>if</strong>.</p>
            </div>
            <div class="tokens-chain" id="dropzoneList"></div>
          </div>
        </div>

        <!-- Preview do Código Python -->
        <div class="python-preview-section">
          <div class="preview-header">
            <span class="terminal-title">🐍 Tradução em Python:</span>
            <span class="badge-lang">Python 3.12</span>
          </div>
          <pre class="python-code-view"><code id="pythonCodeDisplay"># Arraste blocos para montar seu algoritmo...</code></pre>
        </div>

        <!-- Botão Executar -->
        <div class="workspace-actions">
          <button id="executeCodeBtn" class="btn-success btn-execute">
            <span class="btn-icon">⚡</span>
            <span class="btn-text">Executar Código</span>
          </button>
        </div>
      </div>
    `;

    this.dropzoneListEl = document.getElementById('dropzoneList');
    this.dropzoneEmptyEl = document.getElementById('dropzoneEmpty');
    this.pythonCodeEl = document.getElementById('pythonCodeDisplay');
    this.executeBtn = document.getElementById('executeCodeBtn');
    this.clearBtn = document.getElementById('clearWorkspaceBtn');
    this.stepCountBadge = document.getElementById('blockCountBadge');
    this.spectatorBannerEl = document.getElementById('spectatorBanner');
    this.spectatorOpponentNameEl = document.getElementById('spectatorOpponentName');
    this.spectatorStatusTextEl = document.getElementById('spectatorStatusText');
  }

  setupEvents() {
    const palette = document.getElementById('paletteBlocks');
    const rootDropzone = document.getElementById('workspaceDropzone');

    // 1. Clique rápido na paleta adiciona à raiz
    palette.addEventListener('click', (e) => {
      if (this.isSpectatorMode) return;
      const blockEl = e.target.closest('.token-block');
      if (!blockEl) return;
      const type = blockEl.getAttribute('data-type');
      const val = parseInt(blockEl.getAttribute('data-default-val'), 10) || 1;
      const cond = blockEl.getAttribute('data-condition') || (type === 'conditional_if' ? 'dado_par' : null);

      this.model.addBlock({ type, value: val, condition: cond });
      this.updateUI();
      if (this.onBlockChangedCallback) this.onBlockChangedCallback();
    });

    // 2. Drag Start na paleta
    palette.addEventListener('dragstart', (e) => {
      if (this.isSpectatorMode) {
        e.preventDefault();
        return;
      }
      const blockEl = e.target.closest('.token-block');
      if (!blockEl) return;
      const type = blockEl.getAttribute('data-type');
      const val = parseInt(blockEl.getAttribute('data-default-val'), 10) || 1;
      const cond = blockEl.getAttribute('data-condition') || (type === 'conditional_if' ? 'dado_par' : null);

      e.dataTransfer.setData('application/json', JSON.stringify({
        isNew: true,
        type,
        value: val,
        condition: cond
      }));
      e.dataTransfer.effectAllowed = 'copy';
    });

    // 3. Suporte a Drag & Drop em qualquer container (raiz, loop body ou if body)
    rootDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      const targetBody = e.target.closest('.loop-body-dropzone, .if-body-dropzone') || rootDropzone;
      targetBody.classList.add('drag-active');
      e.dataTransfer.dropEffect = 'copy';
    });

    rootDropzone.addEventListener('dragleave', (e) => {
      const targetBody = e.target.closest('.loop-body-dropzone, .if-body-dropzone') || rootDropzone;
      targetBody.classList.remove('drag-active');
    });

    rootDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      rootDropzone.classList.remove('drag-active');
      document.querySelectorAll('.loop-body-dropzone, .if-body-dropzone').forEach(el => el.classList.remove('drag-active'));

      if (this.isSpectatorMode) return;

      try {
        const raw = e.dataTransfer.getData('application/json');
        if (!raw) return;
        const data = JSON.parse(raw);

        const innerContainer = e.target.closest('.loop-body-dropzone, .if-body-dropzone');
        const parentId = innerContainer ? innerContainer.getAttribute('data-parent-id') : null;

        if (data.isNew && data.type) {
          this.model.addBlock({ type: data.type, value: data.value, condition: data.condition }, parentId);
          this.updateUI();
          if (this.onBlockChangedCallback) this.onBlockChangedCallback();
        }
      } catch (err) {
        console.warn('Erro ao processar drop:', err);
      }
    });

    // Limpar
    this.clearBtn.addEventListener('click', () => {
      this.model.clear();
      this.updateUI();
      if (this.onBlockChangedCallback) this.onBlockChangedCallback();
    });

    // Executar
    this.executeBtn.addEventListener('click', () => {
      if (this.onExecuteCallback) this.onExecuteCallback();
    });
  }

  updateUI() {
    if (this.isSpectatorMode) return;
    this.dropzoneListEl.innerHTML = '';
    const rootBlocks = this.model.rootBlocks;

    if (rootBlocks.length === 0) {
      this.dropzoneEmptyEl.style.display = 'flex';
      this.stepCountBadge.textContent = '0 passos';
      this.stepCountBadge.className = 'badge-step-count';
    } else {
      this.dropzoneEmptyEl.style.display = 'none';

      // Renderiza árvore de blocos
      this.renderBlockList(rootBlocks, this.dropzoneListEl, 0);
      this.updateCodeAndSteps();
    }

    this.pythonCodeEl.innerHTML = this.formatPythonSyntax(this.model.toPythonCode());
  }

  /**
   * Renderiza recursivamente listas de blocos (raiz ou filhos de um loop).
   */
  renderBlockList(blocks, containerEl, depth = 0) {
    const loopVars = ['i', 'j', 'k', 'n'];
    const currentVar = loopVars[depth % loopVars.length];

    blocks.forEach((block, index) => {
      if (block.type === 'loop_for') {
        const loopCard = document.createElement('div');
        loopCard.className = 'chain-loop-card';
        loopCard.setAttribute('data-id', block.id);

        loopCard.innerHTML = `
          <div class="loop-header">
            <div class="loop-title-group">
              <span>🔁</span>
              <span>for ${currentVar} in range(</span>
              <input type="number" class="block-input-number" min="1" max="10" value="${block.value}" data-id="${block.id}" title="Repetições do loop">
              <span>):</span>
            </div>
            <div class="block-actions-controls">
              <button class="btn-move-token" data-action="up" data-id="${block.id}" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>⬆️</button>
              <button class="btn-move-token" data-action="down" data-id="${block.id}" title="Mover para baixo" ${index === blocks.length - 1 ? 'disabled' : ''}>⬇️</button>
              <button class="btn-remove-token" data-id="${block.id}" title="Remover loop">✖</button>
            </div>
          </div>
          <div class="loop-body-dropzone" data-parent-id="${block.id}">
            ${(!block.children || block.children.length === 0) 
              ? `<div class="loop-empty-placeholder">➕ Arraste blocos para dentro deste loop for (ou outro loop aninhado)...</div>` 
              : ''}
          </div>
        `;

        if (block.children && block.children.length > 0) {
          const bodyContainer = loopCard.querySelector('.loop-body-dropzone');
          this.renderBlockList(block.children, bodyContainer, depth + 1);
        }

        this.bindCardEvents(loopCard, block);
        containerEl.appendChild(loopCard);

      } else if (block.type === 'conditional_if') {
        const ifCard = document.createElement('div');
        ifCard.className = 'chain-if-card';
        ifCard.setAttribute('data-id', block.id);

        const condStatus = this.evaluateConditionPreview(block.condition);

        ifCard.innerHTML = `
          <div class="if-header">
            <div class="if-title-group" style="flex-wrap: wrap; gap: 6px;">
              <span>🔀</span>
              <span>if</span>
              <select class="block-select-condition" data-id="${block.id}" title="Escolha a condição">
                <option value="dado_par" ${block.condition === 'dado_par' ? 'selected' : ''}>dado % 2 == 0 (Par)</option>
                <option value="dado_impar" ${block.condition === 'dado_impar' ? 'selected' : ''}>dado % 2 != 0 (Ímpar)</option>
                <option value="oponente_a_frente" ${block.condition === 'oponente_a_frente' ? 'selected' : ''}>oponente.a_frente</option>
                <option value="casa_com_bug" ${block.condition === 'casa_com_bug' ? 'selected' : ''}>proxima_casa.tem_bug()</option>
              </select>
              <span>:</span>
              <span class="cond-live-badge ${condStatus.isTrue ? 'badge-cond-true' : 'badge-cond-false'}" title="${condStatus.tooltip}">
                ${condStatus.isTrue ? '🟢' : '⚪'} ${condStatus.text}
              </span>
            </div>
            <div class="block-actions-controls">
              <button class="btn-move-token" data-action="up" data-id="${block.id}" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>⬆️</button>
              <button class="btn-move-token" data-action="down" data-id="${block.id}" title="Mover para baixo" ${index === blocks.length - 1 ? 'disabled' : ''}>⬇️</button>
              <button class="btn-remove-token" data-id="${block.id}" title="Remover if">✖</button>
            </div>
          </div>
          <div class="if-body-dropzone" data-parent-id="${block.id}">
            ${(!block.children || block.children.length === 0) 
              ? `<div class="loop-empty-placeholder" style="color: #fde68a;">⚡ Se a condição for True, executa <strong>player.passo_bonus()</strong> (+1 passo extra)! (Opcional: arraste mais ações aqui dentro)</div>` 
              : ''}
          </div>
        `;

        if (block.children && block.children.length > 0) {
          const bodyContainer = ifCard.querySelector('.if-body-dropzone');
          this.renderBlockList(block.children, bodyContainer, depth + 1);
        }

        this.bindCardEvents(ifCard, block);
        containerEl.appendChild(ifCard);

      } else {
        // Bloco de Ação Simples
        const actionCard = document.createElement('div');
        actionCard.className = `chain-action-card card-${block.type.replace('_', '-')}`;
        actionCard.setAttribute('data-id', block.id);

        let icon = '➡️';
        let codeLabel = '';
        let showInput = true;

        switch (block.type) {
          case 'action_forward':
            icon = '➡️';
            codeLabel = 'player.avancar';
            break;
          case 'action_jump':
            icon = '🦘';
            codeLabel = 'player.pular';
            break;
          case 'action_shield':
            icon = '🛡️';
            codeLabel = 'player.ativar_escudo';
            showInput = false;
            break;
          case 'action_turbo':
            icon = '⚡';
            codeLabel = 'player.acelerar';
            break;
        }

        actionCard.innerHTML = `
          <div class="block-code-label">
            <span>${icon}</span>
            <span>${codeLabel}(</span>
            ${showInput ? `<input type="number" class="block-input-number" min="1" max="10" value="${block.value}" data-id="${block.id}">` : ''}
            <span>)</span>
          </div>
          <div class="block-actions-controls">
            <button class="btn-move-token" data-action="up" data-id="${block.id}" title="Mover para cima" ${index === 0 ? 'disabled' : ''}>⬆️</button>
            <button class="btn-move-token" data-action="down" data-id="${block.id}" title="Mover para baixo" ${index === blocks.length - 1 ? 'disabled' : ''}>⬇️</button>
            <button class="btn-remove-token" data-id="${block.id}" title="Remover bloco">✖</button>
          </div>
        `;

        this.bindCardEvents(actionCard, block);
        containerEl.appendChild(actionCard);
      }
    });
  }

  /**
   * Conecta eventos aos inputs, botões de mover e remover de cada bloco.
   */
  bindCardEvents(cardEl, block) {
    // 1. Mudança de número
    const numInput = cardEl.querySelector(`.block-input-number[data-id="${block.id}"]`);
    if (numInput) {
      numInput.addEventListener('change', (ev) => {
        this.model.updateBlockValue(block.id, ev.target.value);
        this.updateUI();
        if (this.onBlockChangedCallback) this.onBlockChangedCallback();
      });
    }

    // 1.1 Mudança de condição no if
    const condSelect = cardEl.querySelector(`.block-select-condition[data-id="${block.id}"]`);
    if (condSelect) {
      const handleCondChange = (ev) => {
        this.model.updateBlockCondition(block.id, ev.target.value);
        this.updateUI();
        if (this.onBlockChangedCallback) this.onBlockChangedCallback();
      };
      condSelect.addEventListener('change', handleCondChange);
      condSelect.addEventListener('input', handleCondChange);
    }

    // 2. Botão Mover para cima/baixo
    cardEl.querySelectorAll(`.btn-move-token[data-id="${block.id}"]`).forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const action = btn.getAttribute('data-action');
        if (this.model.moveBlock(block.id, action)) {
          this.updateUI();
          if (this.onBlockChangedCallback) this.onBlockChangedCallback();
        }
      });
    });

    // 3. Botão Remover
    const removeBtn = cardEl.querySelector(`.btn-remove-token[data-id="${block.id}"]`);
    if (removeBtn) {
      removeBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.model.removeBlock(block.id);
        this.updateUI();
        if (this.onBlockChangedCallback) this.onBlockChangedCallback();
      });
    }
  }

  updateCodeAndSteps() {
    const tree = this.model.evaluateTree();
    this.stepCountBadge.textContent = `${tree.formula} = ${tree.totalSteps} passo(s)`;
    this.pythonCodeEl.innerHTML = this.formatPythonSyntax(this.model.toPythonCode());
  }

  setExecuteDisabled(disabled) {
    if (this.executeBtn) {
      this.executeBtn.disabled = disabled;
      if (disabled) {
        this.executeBtn.classList.add('btn-disabled');
      } else {
        this.executeBtn.classList.remove('btn-disabled');
      }
    }
  }

  onExecute(callback) {
    this.onExecuteCallback = callback;
  }

  onBlockChanged(callback) {
    this.onBlockChangedCallback = callback;
  }

  evaluateConditionPreview(condition) {
    const rawRoll = this.gameState ? (this.gameState.lastDiceRoll || this.gameState.lastDiceValue) : 0;

    if (condition === 'dado_par') {
      if (rawRoll <= 0) {
        return { isTrue: false, text: 'Rolar dado p/ avaliar', tooltip: 'Aguardando rolagem do dado' };
      }
      const isTrue = (rawRoll % 2 === 0);
      return {
        isTrue,
        text: isTrue ? `dado=${rawRoll} (PAR) ➔ True (+1 passo)` : `dado=${rawRoll} (ÍMPAR) ➔ False`,
        tooltip: isTrue ? `${rawRoll} % 2 == 0 é Verdadeiro!` : `${rawRoll} % 2 == 1 != 0 (Dica: use dado % 2 != 0)`
      };
    }

    if (condition === 'dado_impar') {
      if (rawRoll <= 0) {
        return { isTrue: false, text: 'Rolar dado p/ avaliar', tooltip: 'Aguardando rolagem do dado' };
      }
      const isTrue = (rawRoll % 2 !== 0);
      return {
        isTrue,
        text: isTrue ? `dado=${rawRoll} (ÍMPAR) ➔ True (+1 passo)` : `dado=${rawRoll} (PAR) ➔ False`,
        tooltip: isTrue ? `${rawRoll} % 2 != 0 é Verdadeiro!` : `${rawRoll} % 2 == 0 (Dica: use dado % 2 == 0)`
      };
    }

    if (condition === 'oponente_a_frente') {
      const botPos = this.gameState ? this.gameState.botPos : 1;
      const playerPos = this.gameState ? this.gameState.playerPos : 1;
      const isTrue = (botPos > playerPos);
      return {
        isTrue,
        text: isTrue ? `Oponente=${botPos} > Você=${playerPos} ➔ True (+1)` : `Oponente atrás ➔ False`,
        tooltip: isTrue ? 'O oponente está à frente na trilha!' : 'O oponente está atrás ou empatado com você.'
      };
    }

    if (condition === 'casa_com_bug') {
      const playerPos = this.gameState ? this.gameState.playerPos : 1;
      const treeSteps = this.model ? this.model.evaluateTree().totalSteps : 0;
      const checkSteps = treeSteps > 0 ? treeSteps : rawRoll;

      if (checkSteps <= 0) {
        return {
          isTrue: false,
          text: 'Rolar dado p/ verificar destino',
          tooltip: 'Verifica se a casa de destino (posição + passos) contém um Bug'
        };
      }

      const maxTile = this.boardModel ? this.boardModel.TOTAL_TILES : 64;
      const targetPos = Math.min(maxTile, playerPos + checkSteps);
      const tile = this.boardModel ? this.boardModel.getTile(targetPos) : null;
      const isTrue = Boolean(tile && (tile.type === 'trap' || tile.type === 'bug'));

      return {
        isTrue,
        text: isTrue ? `Casa ${targetPos} tem Bug! ➔ True (+1)` : `Casa ${targetPos} sem Bug ➔ False`,
        tooltip: isTrue
          ? `A casa ${targetPos} possui uma armadilha (${tile.label})!`
          : `A casa ${targetPos} é livre de bugs.`
      };
    }

    return { isTrue: false, text: 'Condição', tooltip: '' };
  }

  /**
   * Ativa ou desativa o Modo Espectador para exibir a jogada e código do oponente.
   */
  setSpectatorMode(active, data = {}) {
    this.isSpectatorMode = active;
    const containerCard = this.container ? this.container.querySelector('.workspace-card') : null;
    
    if (active) {
      if (containerCard) containerCard.classList.add('workspace-spectator-mode');
      if (this.clearBtn) this.clearBtn.disabled = true;
      if (this.executeBtn) {
        this.executeBtn.disabled = true;
        this.executeBtn.innerHTML = `
          <span class="btn-icon">👁️</span>
          <span class="btn-text">${data.name || 'Oponente'} jogando...</span>
        `;
      }
      
      if (this.spectatorBannerEl) {
        this.spectatorBannerEl.style.display = 'flex';
        if (this.spectatorOpponentNameEl) {
          this.spectatorOpponentNameEl.innerHTML = `${data.avatar || '🤖'} Turno de <strong>${data.name || 'Oponente'}</strong>`;
        }
        if (this.spectatorStatusTextEl) {
          let phaseMsg = 'Aguardando jogada...';
          if (data.phase === 'thinking') phaseMsg = '🧠 Analisando tabuleiro...';
          if (data.phase === 'rolling') phaseMsg = `🎲 Rolou o dado: ${data.roll} passos!`;
          if (data.phase === 'coding') phaseMsg = `⚡ Programando blocos (${data.roll} passos)...`;
          if (data.phase === 'executing') phaseMsg = `✅ Código Compilado (${data.steps || 0} passos)!`;
          this.spectatorStatusTextEl.textContent = phaseMsg;
        }
      }

      if (data.blocks && data.blocks.length > 0) {
        this.dropzoneListEl.innerHTML = '';
        this.dropzoneEmptyEl.style.display = 'none';
        this.renderBlockList(data.blocks, this.dropzoneListEl, 0);
        
        const formula = data.formula || `${data.steps} passos`;
        this.stepCountBadge.textContent = `${data.name || 'Oponente'}: ${formula} = ${data.steps} passo(s)`;
        this.stepCountBadge.className = 'badge-step-count badge-opponent-step';
      } else if (data.phase === 'thinking' || data.phase === 'rolling' || data.phase === 'coding') {
        this.dropzoneListEl.innerHTML = `
          <div class="spectator-thinking-box">
            <div class="spectator-spinner"></div>
            <span>${data.name || 'Oponente'} está montando sua estratégia de código...</span>
          </div>
        `;
        this.dropzoneEmptyEl.style.display = 'none';
        this.stepCountBadge.textContent = `${data.name || 'Oponente'}: pensando...`;
        this.stepCountBadge.className = 'badge-step-count badge-opponent-step';
      }

      if (data.code) {
        this.pythonCodeEl.innerHTML = this.formatPythonSyntax(`# 👁️ Código compilado por ${data.name || 'Oponente'}:\n${data.code}`);
      } else if (data.phase === 'thinking' || data.phase === 'rolling' || data.phase === 'coding') {
        this.pythonCodeEl.innerHTML = this.formatPythonSyntax(`# Aguardando ${data.name || 'Oponente'} compilar seu script em Python...`);
      }
    } else {
      if (containerCard) containerCard.classList.remove('workspace-spectator-mode');
      if (this.spectatorBannerEl) this.spectatorBannerEl.style.display = 'none';
      if (this.clearBtn) this.clearBtn.disabled = false;
      if (this.executeBtn) {
        this.executeBtn.disabled = false;
        this.executeBtn.innerHTML = `
          <span class="btn-icon">⚡</span>
          <span class="btn-text">Executar Código</span>
        `;
      }
      this.stepCountBadge.className = 'badge-step-count';
      this.updateUI();
    }
  }
}
