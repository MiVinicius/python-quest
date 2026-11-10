/**
 * BoardView.js
 * Visualização da Trilha em Zigue-Zague Descendente (6 na linha + 2 na coluna).
 * Suporte a arraste bidirecional do tabuleiro, janela flutuante do oponente arrastável (Draggable),
 * Syntax Highlighting Python e câmera com rastreamento automático.
 */
export class BoardView {
  constructor(containerId, boardModel) {
    this.container = document.getElementById(containerId);
    this.boardModel = boardModel;
    this.tileElements = {};
    this.playerAvatar = null;
    this.botAvatar = null;

    this.viewportEl = null;
    this.gridEl = null;

    this.currentPlayerPos = 1;
    this.currentBotPos = 1;

    // Estado do drag-to-scroll do tabuleiro
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.scrollLeftStart = 0;
    this.scrollTopStart = 0;

    this.render();
    this.setupDragToScroll();
    this.setupOpponentWindowDrag();
  }

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
        html = html.replace(
          /\b(for|in|range|if|try|except|pass|True|False)\b/g,
          '<span class="py-kw">$1</span>'
        );
        html = html.replace(
          /\b(BugTrapException)\b/g,
          '<span class="py-exc">$1</span>'
        );
        html = html.replace(
          /\.(avancar|pular|ativar_escudo|passo_bonus|tem_bug|acelerar)\b/g,
          '.<span class="py-fn">$1</span>'
        );
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
      <div class="zigzag-board-wrapper">
        <!-- Barra Superior de Controle e Foco -->
        <div class="board-nav-bar">
          <div class="nav-left">
            <span class="track-info-badge" id="boardTrackInfoBadge">🐍 Trilha Serpenteante (${this.boardModel.TOTAL_TILES} Casas)</span>
            <span class="track-hint">💡 Arraste para inspecionar a descida em zigue-zague</span>
          </div>
          <div class="nav-actions">
            <button id="btnScrollStart" class="btn-ghost btn-sm" title="Ir para a Largada">🔼 Início</button>
            <button id="btnFocusPlayer" class="btn-primary btn-sm" title="Centralizar visão no seu peão">🎯 Focar em Mim</button>
            <button id="btnScrollGoal" class="btn-ghost btn-sm" title="Ir para a Meta">🔽 Meta (${this.boardModel.TOTAL_TILES})</button>
          </div>
        </div>

        <!-- Janela Flutuante Arrastável do Oponente Sobre o Tabuleiro -->
        <div class="opponent-board-modal" id="opponentBoardWindow" style="display: none;">
          <div class="opponent-modal-header" id="opponentModalDragHeader" title="Arraste para mover esta janela">
            <div class="opponent-modal-title">
              <span class="opponent-modal-avatar" id="opModalAvatar">🤖</span>
              <div class="opponent-modal-name-group">
                <span class="opponent-modal-name" id="opModalName">CyberBot</span>
                <span class="opponent-modal-sub" id="opModalSub">Ações em tempo real • ✥ Arrastável</span>
              </div>
            </div>
            <div class="opponent-modal-badges">
              <span class="op-phase-pill" id="opModalPhase">🎲 Rolando Dado...</span>
              <button class="op-minimize-btn" id="opModalMinimizeBtn" title="Minimizar/Expandir">🔽</button>
              <button class="op-close-btn" id="opModalCloseBtn" title="Fechar Janela">✕</button>
            </div>
          </div>
          <div class="opponent-modal-body" id="opModalBody">
            <div class="op-modal-dice-row">
              <div class="op-dice-pill" id="opModalDicePill">🎲 Dado: --</div>
              <div class="op-energy-bar-wrap">
                <div class="op-energy-bar" id="opModalEnergyBar" style="width: 0%;"></div>
              </div>
              <div class="op-energy-count" id="opModalEnergyCount">0 Passos</div>
            </div>
            <div class="op-modal-blocks-section">
              <div class="op-section-label">Blocos Utilizados</div>
              <div class="op-blocks-flow" id="opModalBlocksFlow">
                <span class="op-blocks-empty">Aguardando blocos...</span>
              </div>
            </div>
            <div class="op-modal-code-section">
              <div class="op-code-header">
                <span class="op-code-tag">Código Python</span>
                <span class="op-formula-badge" id="opModalFormula">--</span>
              </div>
              <pre class="op-python-code" id="opModalPythonCode"># Pensando na jogada...</pre>
            </div>
            <div class="op-modal-challenge-section" id="opModalChallenge" style="display: none;">
              <div class="op-challenge-header">
                <span class="op-challenge-tag" id="opChallengeTier">❓ Desafio Python</span>
                <span class="op-challenge-reward" id="opChallengeReward"></span>
              </div>
              <div class="op-challenge-question" id="opChallengeQuestion"></div>
              <pre class="op-challenge-code" id="opChallengeCode"></pre>
              <div class="op-challenge-options" id="opChallengeOptions"></div>
              <div class="op-challenge-result" id="opChallengeResult" style="display: none;"></div>
            </div>
            <div class="op-modal-action-ticker" id="opModalTicker">
              <span>⚡</span>
              <span id="opModalTickerText">Calculando melhor estratégia...</span>
            </div>
          </div>
        </div>

        <!-- Viewport do Zigue-Zague -->
        <div class="zigzag-viewport" id="zigzagViewport">
          <div class="zigzag-grid" id="zigzagGrid"></div>
        </div>
      </div>
    `;

    this.viewportEl = document.getElementById('zigzagViewport');
    this.gridEl = document.getElementById('zigzagGrid');

    // Cria os peões
    this.playerAvatar = document.createElement('div');
    this.playerAvatar.className = 'horizontal-pawn pawn-player';
    this.playerAvatar.title = 'Você (Python Dev)';
    this.playerAvatar.innerHTML = `
      <div class="pawn-emoji">🐍</div>
      <div class="pawn-name">VOCÊ</div>
    `;

    this.botAvatar = document.createElement('div');
    this.botAvatar.className = 'horizontal-pawn pawn-bot';
    this.botAvatar.title = 'CPU (CyberBot)';
    this.botAvatar.innerHTML = `
      <div class="pawn-emoji">🤖</div>
      <div class="pawn-name">CPU</div>
    `;

    this.populateGridTiles();
    this.updatePawns(1, 1);

    // Elementos da Janela Flutuante do Oponente Sobre o Tabuleiro
    this.opWindowEl = document.getElementById('opponentBoardWindow');
    this.opModalAvatarEl = document.getElementById('opModalAvatar');
    this.opModalNameEl = document.getElementById('opModalName');
    this.opModalSubEl = document.getElementById('opModalSub');
    this.opModalPhaseEl = document.getElementById('opModalPhase');
    this.opModalDicePillEl = document.getElementById('opModalDicePill');
    this.opModalEnergyBarEl = document.getElementById('opModalEnergyBar');
    this.opModalEnergyCountEl = document.getElementById('opModalEnergyCount');
    this.opModalBlocksFlowEl = document.getElementById('opModalBlocksFlow');
    this.opModalFormulaEl = document.getElementById('opModalFormula');
    this.opModalPythonCodeEl = document.getElementById('opModalPythonCode');
    this.opModalTickerTextEl = document.getElementById('opModalTickerText');
    this.opModalMinimizeBtn = document.getElementById('opModalMinimizeBtn');
    this.opModalCloseBtn = document.getElementById('opModalCloseBtn');
    this.opChallengeEl = document.getElementById('opModalChallenge');
    this.opChallengeTierEl = document.getElementById('opChallengeTier');
    this.opChallengeRewardEl = document.getElementById('opChallengeReward');
    this.opChallengeQuestionEl = document.getElementById('opChallengeQuestion');
    this.opChallengeCodeEl = document.getElementById('opChallengeCode');
    this.opChallengeOptionsEl = document.getElementById('opChallengeOptions');
    this.opChallengeResultEl = document.getElementById('opChallengeResult');
    this.opThinkingTimer = null;

    this.isOpponentWindowMinimized = false;

    if (this.opModalMinimizeBtn) {
      this.opModalMinimizeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleOpponentWindowMinimize();
      });
    }

    if (this.opModalCloseBtn) {
      this.opModalCloseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideOpponentWindow();
      });
    }

    // Botões de navegação rápida
    document.getElementById('btnScrollStart')?.addEventListener('click', () => {
      this.centerOnTile(1, true);
    });
    document.getElementById('btnScrollGoal')?.addEventListener('click', () => {
      this.centerOnTile(this.boardModel.TOTAL_TILES, true);
    });
    document.getElementById('btnFocusPlayer')?.addEventListener('click', () => {
      this.centerOnTile(this.currentPlayerPos, true);
    });
  }

  /**
   * Reconstrói as casas do tabuleiro quando alterna entre Modo Completo (64) e Demonstração (22).
   */
  rebuildBoard() {
    this.populateGridTiles();
    this.updatePawns(1, 1);
    const badge = document.getElementById('boardTrackInfoBadge');
    const goalBtn = document.getElementById('btnScrollGoal');
    const total = this.boardModel.TOTAL_TILES;
    const isDemo = this.boardModel.mode === 'demo';
    if (badge) {
      badge.textContent = isDemo
        ? `🎯 Trilha de Demonstração (${total} Casas vs Robô)`
        : `🐍 Trilha Serpenteante (${total} Casas)`;
    }
    if (goalBtn) {
      goalBtn.textContent = `🔽 Meta (${total})`;
      goalBtn.title = `Ir para a Meta ${total}`;
    }
  }

  populateGridTiles() {
    if (!this.gridEl) return;
    this.gridEl.innerHTML = '';
    this.tileElements = {};

    const tiles = this.boardModel.tiles;
    const total = this.boardModel.TOTAL_TILES;

    for (let i = 1; i <= total; i++) {
      const tile = tiles[i];
      if (!tile) continue;
      const tileCard = document.createElement('div');
      tileCard.className = `zigzag-tile tile-${tile.type}`;
      tileCard.id = `tile-${i}`;
      tileCard.setAttribute('data-tile-number', i);

      tileCard.style.gridRow = `${tile.row}`;
      tileCard.style.gridColumn = `${tile.col}`;

      let icon = '';
      let tag = '';
      if (tile.type === 'start') {
        icon = '🚀';
        tag = 'LARGADA';
      } else if (tile.type === 'goal') {
        icon = '🏆';
        tag = 'META';
      } else if (tile.type === 'shortcut') {
        icon = '⚡';
        tag = `+${tile.effect.steps}`;
      } else if (tile.type === 'trap') {
        icon = '🐛';
        tag = `${tile.effect.steps}`;
      } else if (tile.type === 'challenge') {
        icon = '❓';
        tag = 'DESAFIO';
      }

      let flowArrow = '➔';
      if (tile.flowDirection === 'down') flowArrow = '⬇';
      else if (tile.flowDirection === 'left') flowArrow = '⬅';

      tileCard.innerHTML = `
        <div class="tile-top-row">
          <span class="tile-number-badge">${i}</span>
          <span class="tile-flow-indicator" title="Sentido do caminho">${flowArrow}</span>
          <span class="tile-icon-badge">${icon}</span>
        </div>
        ${tag ? `<div class="tile-type-tag tag-${tile.type}">${tag}</div>` : ''}
        <div class="tile-pawns-container" id="pawns-${i}"></div>
      `;

      this.gridEl.appendChild(tileCard);
      this.tileElements[i] = tileCard;
    }
  }

  /**
   * Permite arrastar a janela flutuante do oponente pelo cabeçalho (mouse e touch).
   */
  setupOpponentWindowDrag() {
    const header = document.getElementById('opponentModalDragHeader');
    const modal = this.opWindowEl;
    if (!header || !modal) return;

    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const startDrag = (clientX, clientY, target) => {
      if (target && target.closest('button')) return;
      const parent = modal.offsetParent || this.container;
      if (!parent) return;

      const modalRect = modal.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();

      dragging = true;
      modal.classList.add('is-window-dragging');

      const currentLeft = modalRect.left - parentRect.left;
      const currentTop = modalRect.top - parentRect.top;

      modal.style.left = `${currentLeft}px`;
      modal.style.top = `${currentTop}px`;
      modal.style.right = 'auto';
      modal.style.transform = 'none';

      offsetX = clientX - currentLeft;
      offsetY = clientY - currentTop;
    };

    const moveDrag = (clientX, clientY) => {
      if (!dragging) return;
      const parent = modal.offsetParent || this.container;
      if (!parent) return;

      const maxLeft = Math.max(0, parent.clientWidth - modal.offsetWidth - 6);
      const maxTop = Math.max(0, parent.clientHeight - modal.offsetHeight - 6);

      const nextLeft = Math.min(maxLeft, Math.max(6, clientX - offsetX));
      const nextTop = Math.min(maxTop, Math.max(6, clientY - offsetY));

      modal.style.left = `${nextLeft}px`;
      modal.style.top = `${nextTop}px`;
    };

    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      modal.classList.remove('is-window-dragging');
    };

    header.addEventListener('mousedown', (e) => {
      startDrag(e.clientX, e.clientY, e.target);
    });
    window.addEventListener('mousemove', (e) => {
      if (dragging) {
        e.preventDefault();
        moveDrag(e.clientX, e.clientY);
      }
    });
    window.addEventListener('mouseup', stopDrag);

    header.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
      }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (dragging && e.touches.length === 1) {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchend', stopDrag);
  }

  setPlayerProfile(emoji = '🐍', nickname = 'VOCÊ') {
    if (this.playerAvatar) {
      this.playerAvatar.innerHTML = `
        <div class="pawn-emoji">${emoji}</div>
        <div class="pawn-name">${nickname.toUpperCase()}</div>
      `;
    }
  }

  setOpponentProfile(emoji = '🤖', nickname = 'CPU') {
    if (this.botAvatar) {
      this.botAvatar.innerHTML = `
        <div class="pawn-emoji">${emoji}</div>
        <div class="pawn-name">${nickname.toUpperCase()}</div>
      `;
    }
  }

  setupDragToScroll() {
    if (!this.viewportEl) return;

    this.viewportEl.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.viewportEl.classList.add('is-dragging');
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.scrollLeftStart = this.viewportEl.scrollLeft;
      this.scrollTopStart = this.viewportEl.scrollTop;
      e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      e.preventDefault();
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      this.viewportEl.scrollLeft = this.scrollLeftStart - dx;
      this.viewportEl.scrollTop = this.scrollTopStart - dy;
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.viewportEl.classList.remove('is-dragging');
      }
    });

    let touchX = 0;
    let touchY = 0;
    let touchScrollX = 0;
    let touchScrollY = 0;

    this.viewportEl.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
        touchScrollX = this.viewportEl.scrollLeft;
        touchScrollY = this.viewportEl.scrollTop;
      }
    }, { passive: true });

    this.viewportEl.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) {
        const dx = e.touches[0].clientX - touchX;
        const dy = e.touches[0].clientY - touchY;
        this.viewportEl.scrollLeft = touchScrollX - dx;
        this.viewportEl.scrollTop = touchScrollY - dy;
      }
    }, { passive: true });
  }

  updatePawns(playerPos, botPos) {
    this.currentPlayerPos = playerPos;
    this.currentBotPos = botPos;

    if (this.playerAvatar.parentElement) {
      this.playerAvatar.parentElement.removeChild(this.playerAvatar);
    }
    if (this.botAvatar.parentElement) {
      this.botAvatar.parentElement.removeChild(this.botAvatar);
    }

    const playerContainer = document.getElementById(`pawns-${playerPos}`);
    const botContainer = document.getElementById(`pawns-${botPos}`);

    if (playerContainer) playerContainer.appendChild(this.playerAvatar);
    if (botContainer) botContainer.appendChild(this.botAvatar);

    this.highlightTile(playerPos, 'player');
    this.highlightTile(botPos, 'bot');
  }

  highlightTile(tileNum, entity) {
    const tile = this.tileElements[tileNum];
    if (!tile) return;
    const highlightClass = entity === 'player' ? 'tile-active-player' : 'tile-active-bot';
    tile.classList.add(highlightClass);
    setTimeout(() => tile.classList.remove(highlightClass), 600);
  }

  /**
   * Centraliza suavemente a visão do viewport na casa informada.
   */
  centerOnTile(tileNumber, smooth = true) {
    const tile = this.tileElements[tileNumber];
    if (!tile || !this.viewportEl) return;

    const tileTop = tile.offsetTop;
    const tileHeight = tile.offsetHeight;
    const viewportHeight = this.viewportEl.offsetHeight;

    const tileLeft = tile.offsetLeft;
    const tileWidth = tile.offsetWidth;
    const viewportWidth = this.viewportEl.offsetWidth;

    const targetTop = tileTop - (viewportHeight / 2) + (tileHeight / 2);
    const targetLeft = tileLeft - (viewportWidth / 2) + (tileWidth / 2);

    this.viewportEl.scrollTo({
      top: Math.max(0, targetTop),
      left: Math.max(0, targetLeft),
      behavior: smooth ? 'smooth' : 'auto'
    });
  }

  toggleOpponentWindowMinimize() {
    if (!this.opWindowEl) return;
    this.isOpponentWindowMinimized = !this.isOpponentWindowMinimized;
    if (this.isOpponentWindowMinimized) {
      this.opWindowEl.classList.add('is-minimized');
      if (this.opModalMinimizeBtn) this.opModalMinimizeBtn.textContent = '🔼';
    } else {
      this.opWindowEl.classList.remove('is-minimized');
      if (this.opModalMinimizeBtn) this.opModalMinimizeBtn.textContent = '🔽';
    }
  }

  showOpponentWindow({
    avatar = '🤖',
    name = 'CyberBot',
    sub = 'Ações em tempo real',
    phase = '🎲 Rolando Dado...',
    dice = null,
    steps = 0,
    maxSteps = 12,
    blocks = [],
    formula = null,
    pythonCode = null,
    tickerText = 'Calculando melhor estratégia...'
  } = {}) {
    if (!this.opWindowEl) return;

    this.stopOpponentThinking();
    this.opWindowEl.classList.remove('challenge-mode');
    if (this.opChallengeEl) this.opChallengeEl.style.display = 'none';

    if (this.opModalAvatarEl) this.opModalAvatarEl.textContent = avatar;
    if (this.opModalNameEl) this.opModalNameEl.textContent = name;
    if (this.opModalSubEl) this.opModalSubEl.textContent = `${sub} • ✥ Arrastável`;
    if (this.opModalPhaseEl) this.opModalPhaseEl.textContent = phase;

    if (this.opModalDicePillEl) {
      this.opModalDicePillEl.textContent = (dice !== null && dice !== undefined) ? `🎲 Dado: ${dice}` : '🎲 Dado: --';
    }

    if (this.opModalEnergyBarEl) {
      const pct = Math.min(100, Math.round((steps / (maxSteps || 12)) * 100));
      this.opModalEnergyBarEl.style.width = `${pct}%`;
    }

    if (this.opModalEnergyCountEl) {
      this.opModalEnergyCountEl.textContent = `${steps} Passos`;
    }

    if (this.opModalBlocksFlowEl) {
      if (blocks && blocks.length > 0) {
        const describe = (b) => {
          const t = b.type || '';
          const v = b.value ?? '';
          if (b.label) return { cls: 'tag-forward', label: b.label };
          if (t.includes('loop')) return { cls: 'tag-loop', label: `🔁 for ×${v}` };
          if (t.includes('jump')) return { cls: 'tag-jump', label: `🦘 pular(${v})` };
          if (t.includes('shield')) return { cls: 'tag-shield', label: '🛡️ try/except' };
          if (t.includes('if') || t.includes('conditional')) {
            return { cls: 'tag-if', label: `🔀 if ${b.condition || v}` };
          }
          return { cls: 'tag-forward', label: `➡️ avancar(${v})` };
        };
        const renderBlock = (b) => {
          const d = describe(b);
          let html = `<span class="op-block-tag ${d.cls}">${d.label}</span>`;
          if (b.children && b.children.length > 0) {
            html += `<span class="op-flow-arrow">{</span>${b.children.map(renderBlock).join('<span class="op-flow-arrow">➔</span>')}<span class="op-flow-arrow">}</span>`;
          }
          return html;
        };
        this.opModalBlocksFlowEl.innerHTML = blocks.map(renderBlock).join('<span class="op-flow-arrow">➔</span>');
      } else {
        this.opModalBlocksFlowEl.innerHTML = '<span class="op-blocks-empty">Aguardando blocos...</span>';
      }
    }

    if (this.opModalFormulaEl) {
      this.opModalFormulaEl.textContent = formula || (steps ? `${steps} passos` : '--');
    }

    if (this.opModalPythonCodeEl) {
      this.opModalPythonCodeEl.innerHTML = this.formatPythonSyntax(pythonCode || '# Pensando na jogada...');
    }

    if (this.opModalTickerTextEl) {
      this.opModalTickerTextEl.textContent = tickerText;
    }

    this.opWindowEl.style.display = 'block';
  }

  updateOpponentTicker(text) {
    if (this.opModalTickerTextEl) {
      this.opModalTickerTextEl.textContent = text;
    }
  }

  /**
   * Exibe na janela flutuante a pergunta do desafio e as opções disponíveis ao oponente.
   */
  showOpponentChallenge({ avatar, name, sub, question, tierName = 'Desafio', rewardText = '' } = {}) {
    if (!this.opWindowEl || !question) return;

    this.showOpponentWindow({
      avatar, name, sub,
      phase: '❓ Respondendo Desafio',
      tickerText: `${name} está lendo a pergunta e analisando as opções...`
    });

    if (this.isOpponentWindowMinimized) this.toggleOpponentWindowMinimize();

    this.opWindowEl.classList.add('challenge-mode');
    this.opChallengeEl.style.display = 'flex';

    this.opChallengeTierEl.textContent = `❓ Desafio • ${tierName}`;
    this.opChallengeRewardEl.textContent = rewardText;
    this.opChallengeQuestionEl.textContent = question.pergunta || '';

    if (question.codigo) {
      this.opChallengeCodeEl.innerHTML = this.formatPythonSyntax(question.codigo);
      this.opChallengeCodeEl.style.display = 'block';
    } else {
      this.opChallengeCodeEl.style.display = 'none';
    }

    this.opChallengeOptionsEl.innerHTML = '';
    (question.opcoes || []).forEach((opt, i) => {
      const row = document.createElement('div');
      row.className = 'op-challenge-option';
      row.dataset.index = i;

      const letter = document.createElement('span');
      letter.className = 'op-option-letter';
      letter.textContent = String.fromCharCode(65 + i);

      const text = document.createElement('span');
      text.className = 'op-option-text';
      text.textContent = opt;

      const mark = document.createElement('span');
      mark.className = 'op-option-mark';

      row.append(letter, text, mark);
      this.opChallengeOptionsEl.appendChild(row);
    });

    this.opChallengeResultEl.style.display = 'none';
    this.opChallengeResultEl.className = 'op-challenge-result';
  }

  /**
   * Anima um cursor "pensando" percorrendo as opções até a resposta ser revelada.
   */
  startOpponentThinking() {
    this.stopOpponentThinking();
    const options = this.opChallengeOptionsEl ? [...this.opChallengeOptionsEl.children] : [];
    if (options.length === 0) return;
    let idx = 0;
    this.opThinkingTimer = setInterval(() => {
      options.forEach(o => o.classList.remove('is-hovering'));
      options[idx % options.length].classList.add('is-hovering');
      idx += Math.random() < 0.3 ? 2 : 1;
    }, 420);
  }

  stopOpponentThinking() {
    if (this.opThinkingTimer) {
      clearInterval(this.opThinkingTimer);
      this.opThinkingTimer = null;
    }
    if (this.opChallengeOptionsEl) {
      [...this.opChallengeOptionsEl.children].forEach(o => o.classList.remove('is-hovering'));
    }
  }

  /**
   * Revela a opção escolhida pelo oponente, a correta e o resultado.
   */
  revealOpponentAnswer({ selectedIndex = null, correctIndex = null, correct = false, timeout = false, resultText = '' } = {}) {
    if (!this.opChallengeOptionsEl) return;
    this.stopOpponentThinking();

    [...this.opChallengeOptionsEl.children].forEach((row) => {
      const i = parseInt(row.dataset.index, 10);
      const mark = row.querySelector('.op-option-mark');
      if (i === selectedIndex) {
        row.classList.add('is-selected', correct ? 'is-correct' : 'is-wrong');
        if (mark) mark.textContent = correct ? '✔ escolheu' : '✖ escolheu';
      } else if (i === correctIndex) {
        row.classList.add('is-correct', 'is-answer');
        if (mark) mark.textContent = '✔ correta';
      } else {
        row.classList.add('is-dimmed');
      }
    });

    let phase = correct ? '✅ Acertou!' : '❌ Errou!';
    if (timeout) phase = '⏰ Tempo Esgotado';
    if (this.opModalPhaseEl) this.opModalPhaseEl.textContent = phase;

    this.opChallengeResultEl.textContent = resultText;
    this.opChallengeResultEl.className = `op-challenge-result ${correct ? 'result-success' : 'result-fail'}`;
    this.opChallengeResultEl.style.display = 'block';

    this.updateOpponentTicker(resultText);
  }

  hideOpponentWindow() {
    this.stopOpponentThinking();
    if (this.opWindowEl) {
      this.opWindowEl.classList.remove('challenge-mode');
      if (this.opChallengeEl) this.opChallengeEl.style.display = 'none';
      this.opWindowEl.style.display = 'none';
      if (this.isOpponentWindowMinimized) {
        this.toggleOpponentWindowMinimize();
      }
    }
  }

  async animateStepByStep(entity, fromPos, toPos, stepCallback) {
    const isForward = toPos >= fromPos;
    const stepDiff = Math.abs(toPos - fromPos);
    let current = fromPos;

    for (let i = 0; i < stepDiff; i++) {
      current = isForward ? current + 1 : current - 1;
      if (entity === 'player') {
        this.updatePawns(current, this.currentBotPos || 1);
      } else {
        this.updatePawns(this.currentPlayerPos || 1, current);
      }

      this.centerOnTile(current, true);

      if (stepCallback) stepCallback(current, i, stepDiff);

      await new Promise(r => setTimeout(r, 260));
    }
  }

  triggerTileEffect(tileNum, effectType) {
    const tile = this.tileElements[tileNum];
    if (!tile) return;
    tile.classList.add(`pulse-${effectType}`);
    setTimeout(() => tile.classList.remove(`pulse-${effectType}`), 1200);
  }
}
