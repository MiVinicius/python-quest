/**
 * HomeView.js
 * Gerenciador da Tela Inicial (Menu Hub) do Python Quest:
 * Jogar Solo, Multiplayer Online (Partida Rápida P2P + Salas PY-XXXX),
 * Como Jogar, Histórico de Partidas e Perfil do Usuário (com Exportar/Importar JSON).
 */
export class HomeView {
  constructor(userProfileModel) {
    this.profileModel = userProfileModel;
    
    this.homeScreenEl = null;
    this.gameArenaScreenEl = null;

    // Callbacks
    this.onStartSoloCallback = null;
    this.onStartDemoCallback = null;
    this.onStartMultiplayerCallback = null;
    this.onReturnHomeCallback = null;

    this.init();
  }

  init() {
    this.createDomStructure();
    this.bindEvents();
    this.updateProfileChip();
    
    // Atualiza chip sempre que perfil mudar
    this.profileModel.onChange(() => {
      this.updateProfileChip();
    });
  }

  createDomStructure() {
    this.homeScreenEl = document.getElementById('homeScreen');
    this.gameArenaScreenEl = document.getElementById('gameArenaScreen');

    if (!this.homeScreenEl) return;

    this.homeScreenEl.innerHTML = `
      <div class="home-content-wrapper">
        
        <!-- BARRA SUPERIOR DA HOME -->
        <header class="home-top-bar">
          <div class="home-brand">
            <span class="home-brand-icon">🐍</span>
            <div>
              <h1 class="home-brand-title">PYTHON QUEST</h1>
            </div>
          </div>

          <!-- Quick Chip do Perfil -->
          <div class="user-profile-chip" id="topProfileChip" title="Clique para editar seu perfil">
            <div class="chip-avatar-wrapper" id="topChipAvatar">🐍</div>
            <div class="chip-info">
              <span class="chip-name" id="topChipName">PythonDev</span>
              <span class="chip-stats" id="topChipStats">Vitórias: 0 | 0%</span>
            </div>
          </div>
        </header>

        <!-- SEÇÃO HERO -->
        <section class="home-hero">
          <h2 class="hero-title">
            Domine Algoritmos na Trilha de <span class="highlight-yellow">64 Casas</span> com <span class="highlight-blue">Python</span>
          </h2>
          <p class="hero-desc">
            Monte instruções estruturadas em blocos, aninhe loops <code>for</code>, tome decisões com <code>if</code>, desvie de bugs com <code>try/except</code> e alcance a meta.
          </p>
        </section>

        <!-- GRADE CENTRALIZADA DE OPÇÕES -->
        <section class="home-menu-grid">
          
          <!-- 0. Modo Demonstração (Avaliação Rápida) -->
          <div class="menu-card card-demo" id="menuBtnDemo">
            <div class="menu-card-left">
              <span class="menu-card-icon">🎯</span>
              <div class="menu-card-content">
                <div class="menu-card-heading">
                  <h3 class="menu-card-title">Demonstração</h3>
                  <span class="menu-card-badge badge-cyan">Avaliação Rápida • 22 Casas</span>
                </div>
                <p class="menu-card-desc">Trilha curta contra o robô para testar todas as mecânicas em ~2 min.</p>
              </div>
            </div>
            <div class="menu-card-action">➔</div>
          </div>

          <!-- 1. Jogar Solo vs CPU -->
          <div class="menu-card card-solo" id="menuBtnSolo">
            <div class="menu-card-left">
              <span class="menu-card-icon">🚀</span>
              <div class="menu-card-content">
                <div class="menu-card-heading">
                  <h3 class="menu-card-title">Jogar Solo vs CPU</h3>
                  <span class="menu-card-badge badge-green">64 Casas • Completo</span>
                </div>
                <p class="menu-card-desc">Corrida completa contra o CyberBot com modo espectador em tempo real.</p>
              </div>
            </div>
            <div class="menu-card-action">➔</div>
          </div>

          <!-- 2. Multiplayer Online -->
          <div class="menu-card card-multiplayer" id="menuBtnMultiplayer">
            <div class="menu-card-left">
              <span class="menu-card-icon">🌐</span>
              <div class="menu-card-content">
                <div class="menu-card-heading">
                  <h3 class="menu-card-title">Multiplayer Online</h3>
                  <span class="menu-card-badge badge-purple">Partida Rápida & Salas</span>
                </div>
                <p class="menu-card-desc">Matchmaking automático P2P ou salas privadas com código (PY-XXXX).</p>
              </div>
            </div>
            <div class="menu-card-action">➔</div>
          </div>

          <!-- 3. Como Jogar -->
          <div class="menu-card card-guide" id="menuBtnHowToPlay">
            <div class="menu-card-left">
              <span class="menu-card-icon">📖</span>
              <div class="menu-card-content">
                <div class="menu-card-heading">
                  <h3 class="menu-card-title">Como Jogar</h3>
                </div>
                <p class="menu-card-desc">Regras do tabuleiro, loops aninhados, condicionais e cartas 3D.</p>
              </div>
            </div>
            <div class="menu-card-action">➔</div>
          </div>

          <!-- 4. Histórico de Partidas -->
          <div class="menu-card card-history" id="menuBtnHistory">
            <div class="menu-card-left">
              <span class="menu-card-icon">📊</span>
              <div class="menu-card-content">
                <div class="menu-card-heading">
                  <h3 class="menu-card-title">Histórico & Stats</h3>
                </div>
                <p class="menu-card-desc">Resultados, taxa de vitórias e precisão em desafios.</p>
              </div>
            </div>
            <div class="menu-card-action">➔</div>
          </div>

          <!-- 5. Meu Perfil -->
          <div class="menu-card card-profile" id="menuBtnProfile">
            <div class="menu-card-left">
              <span class="menu-card-icon">👤</span>
              <div class="menu-card-content">
                <div class="menu-card-heading">
                  <h3 class="menu-card-title">Meu Perfil</h3>
                </div>
                <p class="menu-card-desc">Personalize seu nickname, avatar, conquistas e backup JSON.</p>
              </div>
            </div>
            <div class="menu-card-action">➔</div>
          </div>

        </section>

      </div>

      <!-- ================================================================
           MODAIS DO HUB INICIAL
           ================================================================ -->
      
      <!-- MODAL 1: PERFIL DO USUÁRIO & AUTENTICAÇÃO -->
      <div class="home-modal-overlay" id="modalProfile">
        <div class="home-modal-card">
          <div class="home-modal-header">
            <div class="home-modal-title"><span>👤</span> Conta & Perfil do Jogador</div>
            <button class="home-modal-close" data-close="modalProfile">✖</button>
          </div>
          
          <div class="home-modal-body">
            
            <!-- Navegação por Abas (Perfil / Entrar / Criar Conta) -->
            <div class="profile-tabs-nav">
              <button class="profile-tab-btn active" id="tabBtnProfile">👤 Meu Perfil</button>
              <button class="profile-tab-btn" id="tabBtnLogin">🔑 Entrar</button>
              <button class="profile-tab-btn" id="tabBtnRegister">✨ Criar Conta</button>
            </div>

            <!-- ABA 1: MEU PERFIL -->
            <div id="tabContentProfile" class="profile-tab-pane">
              <!-- Banner de Status da Conta -->
              <div id="profileCloudBanner" class="cloud-status-banner cloud-guest">
                <!-- Inserido dinamicamente -->
              </div>

              <div class="profile-input-group" style="margin-top: 14px;">
                <label for="profileNickInput">Seu Apelido no Jogo:</label>
                <input type="text" id="profileNickInput" class="profile-text-input" maxlength="16" placeholder="Digite seu apelido...">
              </div>

              <div class="profile-edit-avatar-section" style="margin-top: 14px;">
                <label>Selecione seu Avatar:</label>
                <div class="avatar-selection-grid" id="avatarGrid">
                  <button class="avatar-option-btn" data-avatar="🐍" data-name="Cyber Snake">
                    <span class="avatar-emoji">🐍</span>
                    <span class="avatar-label">Cyber Snake</span>
                  </button>
                  <button class="avatar-option-btn" data-avatar="🤖" data-name="Bit Bot">
                    <span class="avatar-emoji">🤖</span>
                    <span class="avatar-label">Bit Bot</span>
                  </button>
                  <button class="avatar-option-btn" data-avatar="🦊" data-name="Algo Fox">
                    <span class="avatar-emoji">🦊</span>
                    <span class="avatar-label">Algo Fox</span>
                  </button>
                  <button class="avatar-option-btn" data-avatar="🦅" data-name="Binary Falcon">
                    <span class="avatar-emoji">🦅</span>
                    <span class="avatar-label">Binary Falcon</span>
                  </button>
                  <button class="avatar-option-btn" data-avatar="🐱" data-name="Terminal Cat">
                    <span class="avatar-emoji">🐱</span>
                    <span class="avatar-label">Terminal Cat</span>
                  </button>
                </div>
              </div>

              <div class="profile-stats-section" style="margin-top: 16px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 8px;">Estatísticas de Carreira:</label>
                <div class="profile-stats-grid">
                  <div class="stat-box">
                    <span class="stat-box-val" id="profileStatMatches">0</span>
                    <span class="stat-box-label">Partidas</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-box-val" id="profileStatWins" style="color: #10b981;">0</span>
                    <span class="stat-box-label">Vitórias</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-box-val" id="profileStatWinRate">0%</span>
                    <span class="stat-box-label">Aproveitamento</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-box-val" id="profileStatChallenges">0</span>
                    <span class="stat-box-label">Desafios Feitos</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-box-val" id="profileStatAccuracy" style="color: #f59e0b;">0%</span>
                    <span class="stat-box-label">Acerto Desafios</span>
                  </div>
                  <div class="stat-box">
                    <span class="stat-box-val" id="profileStatBestRound" style="color: #a855f7;">--</span>
                    <span class="stat-box-label">Recorde Rodadas</span>
                  </div>
                </div>
              </div>

              <!-- Badges -->
              <div class="profile-badges-section" style="margin-top: 16px;">
                <label style="font-size: 0.85rem; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 8px;">Conquistas Desbloqueadas:</label>
                <div class="achievements-list" id="profileAchievementsList"></div>
              </div>

              <!-- Portabilidade de Conta (Backup JSON) -->
              <div class="profile-backup-section" style="margin-top: 16px; padding: 12px; background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                  <div>
                    <strong style="font-size: 0.82rem; color: #e2e8f0; display: block;">💾 Backup Portátil do Perfil (.json)</strong>
                    <span style="font-size: 0.74rem; color: #94a3b8;">Exporte seu progresso para usar em outro PC ou navegador no GitHub Pages.</span>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <button type="button" class="btn-ghost btn-xs" id="btnExportProfileJson" title="Baixar arquivo .json com suas conquistas e vitórias">📥 Exportar</button>
                    <button type="button" class="btn-ghost btn-xs" id="btnImportProfileJson" title="Carregar arquivo .json de backup">📤 Importar</button>
                    <input type="file" id="inputImportProfileFile" accept=".json,application/json" style="display: none;">
                  </div>
                </div>
                <div id="backupStatusMsg" class="auth-status-msg hidden" style="margin-top: 8px;"></div>
              </div>

              <div class="home-modal-footer" style="padding: 16px 0 0 0; background: transparent; border: none; margin-top: 14px;">
                <button class="btn-ghost" data-close="modalProfile">Fechar</button>
                <button class="btn-success" id="saveProfileBtn">Salvar Alterações</button>
              </div>
            </div>

            <!-- ABA 2: ENTRAR (LOGIN) -->
            <div id="tabContentLogin" class="profile-tab-pane" style="display: none;">
              <div class="auth-form-card">
                <p class="auth-form-desc">
                  Entre com seu <strong>Nome de Usuário</strong> e <strong>Senha</strong> para carregar seu perfil exclusivo salvo neste navegador (protegido com criptografia SHA-256).
                </p>

                <div id="loginStatusMsg" class="auth-status-msg hidden"></div>

                <div class="profile-input-group">
                  <label for="loginUserInput">Nome de Usuário:</label>
                  <input type="text" id="loginUserInput" class="profile-text-input" placeholder="Ex: dev_python">
                </div>

                <div class="profile-input-group">
                  <label for="loginPassInput">Senha:</label>
                  <input type="password" id="loginPassInput" class="profile-text-input" placeholder="Digite sua senha...">
                </div>

                <button class="btn-primary" id="btnSubmitLogin" style="width: 100%; margin-top: 8px; justify-content: center;">
                  Entrar na Conta
                </button>
              </div>
            </div>

            <!-- ABA 3: CRIAR CONTA (CADASTRO) -->
            <div id="tabContentRegister" class="profile-tab-pane" style="display: none;">
              <div class="auth-form-card">
                <p class="auth-form-desc">
                  Crie sua conta de jogador com hash SHA-256 para separar seu progresso de outros jogadores no mesmo dispositivo e exportar backups!
                </p>

                <div id="regStatusMsg" class="auth-status-msg hidden"></div>

                <div class="profile-input-group">
                  <label for="regUserInput">Nome de Usuário (login único):</label>
                  <input type="text" id="regUserInput" class="profile-text-input" placeholder="Ex: coder_samuel (letras e números)">
                </div>

                <div class="profile-input-group">
                  <label for="regNickInput">Apelido de Exibição:</label>
                  <input type="text" id="regNickInput" class="profile-text-input" placeholder="Ex: Samuel Dev">
                </div>

                <div class="profile-input-group">
                  <label for="regPassInput">Senha (mínimo 4 caracteres):</label>
                  <input type="password" id="regPassInput" class="profile-text-input" placeholder="Crie uma senha...">
                </div>

                <button class="btn-success" id="btnSubmitRegister" style="width: 100%; margin-top: 8px; justify-content: center;">
                  Criar Conta de Jogador
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- MODAL 2: HISTÓRICO DE PARTIDAS -->
      <div class="home-modal-overlay" id="modalHistory">
        <div class="home-modal-card">
          <div class="home-modal-header">
            <div class="home-modal-title"><span>📊</span> Histórico de Partidas Recentes</div>
            <button class="home-modal-close" data-close="modalHistory">✖</button>
          </div>
          <div class="home-modal-body" id="historyTableContainer">
            <!-- Tabela gerada dinamicamente -->
          </div>
          <div class="home-modal-footer">
            <button class="btn-ghost" data-close="modalHistory">Fechar</button>
          </div>
        </div>
      </div>

      <!-- MODAL 3: COMO JOGAR -->
      <div class="home-modal-overlay" id="modalHowToPlay">
        <div class="home-modal-card">
          <div class="home-modal-header">
            <div class="home-modal-title"><span>📖</span> Manual de Regras & Programação</div>
            <button class="home-modal-close" data-close="modalHowToPlay">✖</button>
          </div>
          <div class="home-modal-body" style="font-size: 0.9rem; line-height: 1.6; color: #cbd5e1;">
            <h4 style="color: #38bdf8; margin-bottom: 4px;">🏁 1. O Objetivo</h4>
            <p>Seja o primeiro programador a alcançar ou ultrapassar a <strong>Casa 64</strong> na trilha em zigue-zague.</p>
            
            <h4 style="color: #ffd43b; margin-top: 14px; margin-bottom: 4px;">🎲 2. A Energia do Dado</h4>
            <p>No início do seu turno, role o dado D6 para gerar sua energia de movimento. O total obtido define exatamente quantos passos base seu algoritmo deve computar.</p>

            <h4 style="color: #10b981; margin-top: 14px; margin-bottom: 4px;">🧩 3. Árvore de Blocos & Estruturas Python</h4>
            <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
              <li><strong>🔁 Loop <code>for</code>:</strong> Repete os blocos internos <code>N</code> vezes (suporta loops aninhados <code>for</code> dentro de <code>for</code>!).</li>
              <li><strong>🔀 Condicional <code>if</code>:</strong> Avalia condições em tempo real (<code>dado % 2 == 0</code>, <code>oponente.a_frente</code>, <code>proxima_casa.tem_bug()</code>) e concede <strong>+1 passo bônus extra</strong> se verdadeira!</li>
              <li><strong>➡️ Avançar / 🦘 Pular:</strong> <code>avancar(N)</code> caminha normalmente; <code>pular(N)</code> salta acrobaticamente sobre bugs na casa de destino.</li>
              <li><strong>🛡️ Escudo (<code>try / except</code>):</strong> Arma uma proteção que anula 100% o recuo da próxima armadilha (Bug).</li>
            </ul>

            <h4 style="color: #f59e0b; margin-top: 14px; margin-bottom: 4px;">⚡ 4. Casas Especiais & Cartas 3D</h4>
            <ul style="padding-left: 20px; display: flex; flex-direction: column; gap: 6px;">
              <li><strong>⚡ Atalhos (+3/+4):</strong> Impulsionam seu peão à frente.</li>
              <li><strong>🐛 Bugs (-3/-5):</strong> Forçam recuo imediato (a menos que você use Pulo ou tenha Escudo ativo).</li>
              <li><strong>❓ Desafios de Código:</strong> Escolha entre 3 Cartas 3D (🟢 Comum +2, 🔵 Rara +4, 🟣 Épica +6) e responda dentro do tempo.</li>
            </ul>
          </div>
          <div class="home-modal-footer">
            <button class="btn-success" data-close="modalHowToPlay">Entendi! Bora Jogar</button>
          </div>
        </div>
      </div>

      <!-- MODAL 4: MULTIPLAYER ONLINE -->
      <div class="home-modal-overlay" id="modalMultiplayer">
        <div class="home-modal-card">
          <div class="home-modal-header">
            <div class="home-modal-title"><span>🌐</span> Lobby Multiplayer Online (P2P)</div>
            <button class="home-modal-close" data-close="modalMultiplayer">✖</button>
          </div>
          <div class="home-modal-body">
            
            <!-- DESTAQUE: PARTIDA RÁPIDA (MATCHMAKING AUTOMÁTICO) -->
            <div class="mp-status-banner" style="flex-direction: column; align-items: stretch; gap: 10px; background: linear-gradient(135deg, rgba(16, 185, 129, 0.16), rgba(56, 189, 248, 0.14)); border: 1px solid rgba(52, 211, 153, 0.35);">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span style="font-size: 1.6rem;">⚡</span>
                  <div>
                    <strong style="color: #6ee7b7; font-size: 0.96rem;">Partida Rápida (Matchmaking Automático)</strong>
                    <p style="font-size: 0.78rem; margin: 2px 0 0 0; opacity: 0.9;">Conecte-se automaticamente ao próximo jogador buscando duelo, sem precisar de código!</p>
                  </div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button class="btn-success btn-sm" id="btnQuickMatch">
                    🔍 Buscar Partida Rápida
                  </button>
                  <button class="btn-ghost btn-sm" id="btnCancelQuickMatch" style="display: none; border-color: rgba(239, 68, 68, 0.5); color: #fca5a5;">
                    ✖ Cancelar
                  </button>
                </div>
              </div>
              <div id="mpQuickMatchNotice" style="display: none; font-size: 0.82rem; padding: 8px 12px; background: rgba(15, 23, 42, 0.65); border-radius: 8px; color: #38bdf8; text-align: center;">
                ⏳ Procurando oponente online na fila P2P... (Abra outra aba ou peça para um amigo clicar em Partida Rápida!)
              </div>
            </div>

            <div style="text-align: center; font-size: 0.74rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin: 12px 0 8px 0; font-weight: 700;">
              — Ou jogue com código de sala privada —
            </div>

            <div class="mp-options-container">
              <!-- Opção 1: Criar Sala -->
              <div class="mp-box">
                <h4>Hospedar Sala</h4>
                <p>Gere um código exclusivo e envie para seu amigo conectar.</p>
                <div class="mp-code-display" id="generatedRoomCode">PY-????</div>
                <button class="btn-success btn-sm" id="btnHostRoom" style="width: 100%;">
                  Gerar Sala
                </button>
              </div>

              <!-- Opção 2: Entrar com Código -->
              <div class="mp-box">
                <h4>Entrar em Sala</h4>
                <p>Digite o código recebido do seu amigo para iniciar:</p>
                <input type="text" id="inputJoinCode" class="mp-input-code" placeholder="1018 ou PY-1018" maxlength="10">
                <button class="btn-ghost btn-sm" id="btnJoinRoom" style="width: 100%; border-color: var(--py-blue-light); color: var(--py-blue-light);">
                  Conectar à Sala
                </button>
              </div>
            </div>

            <div id="mpLobbyWaitNotice" style="display: none; text-align: center; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 10px; color: #34d399; font-weight: 600; margin-top: 10px;">
              Aguardando oponente entrar na sala... ⏳
            </div>

          </div>
          <div class="home-modal-footer">
            <button class="btn-ghost" data-close="modalMultiplayer">Fechar</button>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    // Abertura de Modais
    document.getElementById('topProfileChip')?.addEventListener('click', () => this.openProfileModal());
    document.getElementById('menuBtnProfile')?.addEventListener('click', () => this.openProfileModal());
    document.getElementById('menuBtnHistory')?.addEventListener('click', () => this.openHistoryModal());
    document.getElementById('menuBtnHowToPlay')?.addEventListener('click', () => this.openModal('modalHowToPlay'));
    document.getElementById('menuBtnMultiplayer')?.addEventListener('click', () => this.openMultiplayerModal());

    // Iniciar Modo Demonstração
    document.getElementById('menuBtnDemo')?.addEventListener('click', () => {
      this.showGameArena();
      if (this.onStartDemoCallback) this.onStartDemoCallback();
    });

    // Iniciar Jogo Solo
    document.getElementById('menuBtnSolo')?.addEventListener('click', () => {
      this.showGameArena();
      if (this.onStartSoloCallback) this.onStartSoloCallback();
    });

    // Botões de fechar modal genéricos
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close');
        if (modalId === 'modalMultiplayer' && this.onStartMultiplayerCallback) {
          this.onStartMultiplayerCallback({ action: 'cancel_quickmatch' });
          this.resetQuickMatchUI();
        }
        this.closeModal(modalId);
      });
    });

    // Fechar ao clicar fora
    document.querySelectorAll('.home-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          if (overlay.id === 'modalMultiplayer' && this.onStartMultiplayerCallback) {
            this.onStartMultiplayerCallback({ action: 'cancel_quickmatch' });
            this.resetQuickMatchUI();
          }
          overlay.classList.remove('active');
        }
      });
    });

    // Seleção de Avatar no Modal de Perfil
    const avatarBtns = document.querySelectorAll('.avatar-option-btn');
    avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        avatarBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Salvar Perfil
    document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
      const inputNick = document.getElementById('profileNickInput').value;
      const selectedAvatarBtn = document.querySelector('#avatarGrid .avatar-option-btn.selected');
      
      if (inputNick) this.profileModel.updateNickname(inputNick);
      if (selectedAvatarBtn) {
        const emoji = selectedAvatarBtn.getAttribute('data-avatar');
        const name = selectedAvatarBtn.getAttribute('data-name');
        this.profileModel.updateAvatar(emoji, name);
      }

      this.closeModal('modalProfile');
    });

    // Exportar Backup JSON
    document.getElementById('btnExportProfileJson')?.addEventListener('click', () => {
      const jsonStr = this.profileModel.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeNick = (this.profileModel.data.nickname || 'jogador').toLowerCase().replace(/[^a-z0-9_-]/g, '');
      a.href = url;
      a.download = `python-quest-perfil-${safeNick || 'save'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const statusEl = document.getElementById('backupStatusMsg');
      if (statusEl) {
        statusEl.className = 'auth-status-msg status-success';
        statusEl.textContent = 'Backup (.json) exportado com sucesso!';
        statusEl.classList.remove('hidden');
      }
    });

    // Importar Backup JSON
    const importBtn = document.getElementById('btnImportProfileJson');
    const importInput = document.getElementById('inputImportProfileFile');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const res = this.profileModel.importBackupJSON(String(reader.result || ''));
          const statusEl = document.getElementById('backupStatusMsg');
          if (statusEl) {
            statusEl.className = `auth-status-msg ${res.success ? 'status-success' : 'status-error'}`;
            statusEl.textContent = res.message;
            statusEl.classList.remove('hidden');
          }
          if (res.success) {
            this.openProfileModal();
          }
        };
        reader.readAsText(file);
        importInput.value = '';
      });
    }

    // Navegação por Abas do Modal de Perfil
    const tabBtnProfile = document.getElementById('tabBtnProfile');
    const tabBtnLogin = document.getElementById('tabBtnLogin');
    const tabBtnRegister = document.getElementById('tabBtnRegister');

    const paneProfile = document.getElementById('tabContentProfile');
    const paneLogin = document.getElementById('tabContentLogin');
    const paneRegister = document.getElementById('tabContentRegister');

    const switchTab = (activeTab) => {
      [tabBtnProfile, tabBtnLogin, tabBtnRegister].forEach(b => b?.classList.remove('active'));
      [paneProfile, paneLogin, paneRegister].forEach(p => { if (p) p.style.display = 'none'; });

      if (activeTab === 'login') {
        tabBtnLogin?.classList.add('active');
        if (paneLogin) paneLogin.style.display = 'block';
      } else if (activeTab === 'register') {
        tabBtnRegister?.classList.add('active');
        if (paneRegister) paneRegister.style.display = 'block';
      } else {
        tabBtnProfile?.classList.add('active');
        if (paneProfile) paneProfile.style.display = 'block';
      }
    };

    tabBtnProfile?.addEventListener('click', () => switchTab('profile'));
    tabBtnLogin?.addEventListener('click', () => switchTab('login'));
    tabBtnRegister?.addEventListener('click', () => switchTab('register'));

    // Submissão de Login
    document.getElementById('btnSubmitLogin')?.addEventListener('click', async () => {
      const userInput = document.getElementById('loginUserInput');
      const passInput = document.getElementById('loginPassInput');
      const msgEl = document.getElementById('loginStatusMsg');
      const btn = document.getElementById('btnSubmitLogin');

      const user = userInput?.value.trim();
      const pass = passInput?.value;

      if (!user || !pass) {
        if (msgEl) {
          msgEl.className = 'auth-status-msg status-error';
          msgEl.textContent = 'Preencha seu usuário e senha.';
          msgEl.classList.remove('hidden');
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Autenticando...';

      const res = await this.profileModel.login(user, pass);
      btn.disabled = false;
      btn.textContent = 'Entrar na Conta';

      if (msgEl) {
        msgEl.className = `auth-status-msg ${res.success ? 'status-success' : 'status-error'}`;
        msgEl.textContent = res.message;
        msgEl.classList.remove('hidden');
      }

      if (res.success) {
        setTimeout(() => {
          switchTab('profile');
          this.openProfileModal();
        }, 600);
      }
    });

    // Submissão de Cadastro
    document.getElementById('btnSubmitRegister')?.addEventListener('click', async () => {
      const userInput = document.getElementById('regUserInput');
      const nickInput = document.getElementById('regNickInput');
      const passInput = document.getElementById('regPassInput');
      const msgEl = document.getElementById('regStatusMsg');
      const btn = document.getElementById('btnSubmitRegister');

      const user = userInput?.value.trim();
      const nick = nickInput?.value.trim() || user;
      const pass = passInput?.value;
      const avatar = this.profileModel.data.avatar || '🐍';

      if (!user || !pass) {
        if (msgEl) {
          msgEl.className = 'auth-status-msg status-error';
          msgEl.textContent = 'Informe um usuário e uma senha de pelo menos 4 caracteres.';
          msgEl.classList.remove('hidden');
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Criando Conta...';

      const res = await this.profileModel.register(user, pass, nick, avatar);
      btn.disabled = false;
      btn.textContent = 'Criar Conta de Jogador';

      if (msgEl) {
        msgEl.className = `auth-status-msg ${res.success ? 'status-success' : 'status-error'}`;
        msgEl.textContent = res.message;
        msgEl.classList.remove('hidden');
      }

      if (res.success) {
        setTimeout(() => {
          switchTab('profile');
          this.openProfileModal();
        }, 700);
      }
    });

    // ⚡ Ação Partida Rápida (Matchmaking Automático)
    const btnQuickMatch = document.getElementById('btnQuickMatch');
    const btnCancelQuickMatch = document.getElementById('btnCancelQuickMatch');
    const quickMatchNotice = document.getElementById('mpQuickMatchNotice');

    if (btnQuickMatch) {
      btnQuickMatch.addEventListener('click', () => {
        btnQuickMatch.disabled = true;
        btnQuickMatch.textContent = '⏳ Buscando Oponente...';
        if (btnCancelQuickMatch) btnCancelQuickMatch.style.display = 'inline-flex';
        if (quickMatchNotice) quickMatchNotice.style.display = 'block';

        if (this.onStartMultiplayerCallback) {
          this.onStartMultiplayerCallback({ action: 'quickmatch' });
        }
      });
    }

    if (btnCancelQuickMatch) {
      btnCancelQuickMatch.addEventListener('click', () => {
        this.resetQuickMatchUI();
        if (this.onStartMultiplayerCallback) {
          this.onStartMultiplayerCallback({ action: 'cancel_quickmatch' });
        }
      });
    }

    // Ações Multiplayer (Criar / Entrar com código)
    const btnHost = document.getElementById('btnHostRoom');
    if (btnHost) {
      btnHost.addEventListener('click', () => {
        btnHost.disabled = true;
        btnHost.textContent = 'Gerando...';
        if (this.onStartMultiplayerCallback) {
          this.onStartMultiplayerCallback({ action: 'create' });
        }
      });
    }

    const btnJoin = document.getElementById('btnJoinRoom');
    if (btnJoin) {
      btnJoin.addEventListener('click', () => {
        let code = document.getElementById('inputJoinCode').value.trim().toUpperCase();
        if (!code) {
          alert('Por favor, informe o código da sala (Ex: 1018 ou PY-1018).');
          return;
        }

        if (/^\d{4}$/.test(code)) {
          code = `PY-${code}`;
        } else if (/^PY\d{4}$/.test(code)) {
          code = `PY-${code.substring(2)}`;
        }

        if (!code.startsWith('PY-') || code.length < 6) {
          alert('Por favor, informe um código válido de 4 dígitos (Ex: 1018 ou PY-1018).');
          return;
        }

        btnJoin.disabled = true;
        btnJoin.textContent = 'Conectando...';
        if (this.onStartMultiplayerCallback) {
          this.onStartMultiplayerCallback({ action: 'join', roomCode: code });
        }
      });
    }
  }

  resetQuickMatchUI() {
    const btnQuickMatch = document.getElementById('btnQuickMatch');
    const btnCancelQuickMatch = document.getElementById('btnCancelQuickMatch');
    const quickMatchNotice = document.getElementById('mpQuickMatchNotice');
    if (btnQuickMatch) {
      btnQuickMatch.disabled = false;
      btnQuickMatch.textContent = '🔍 Buscar Partida Rápida';
    }
    if (btnCancelQuickMatch) btnCancelQuickMatch.style.display = 'none';
    if (quickMatchNotice) quickMatchNotice.style.display = 'none';
  }

  setLobbyRoomCode(code) {
    const el = document.getElementById('generatedRoomCode');
    if (el) el.textContent = code;
    const wait = document.getElementById('mpLobbyWaitNotice');
    if (wait) wait.style.display = 'block';
    const btnHost = document.getElementById('btnHostRoom');
    if (btnHost) {
      btnHost.disabled = false;
      btnHost.textContent = 'Sala Criada!';
    }
  }

  resetJoinButton() {
    const btnJoin = document.getElementById('btnJoinRoom');
    if (btnJoin) {
      btnJoin.disabled = false;
      btnJoin.textContent = 'Conectar à Sala';
    }
  }

  updateProfileChip() {
    const data = this.profileModel.data;
    const chipAvatar = document.getElementById('topChipAvatar');
    const chipName = document.getElementById('topChipName');
    const chipStats = document.getElementById('topChipStats');

    if (chipAvatar) chipAvatar.textContent = data.avatar;
    if (chipName) chipName.textContent = data.nickname;
    if (chipStats) {
      chipStats.textContent = `Vitórias: ${data.career.wins} | ${data.career.winRate}%`;
    }
  }

  openProfileModal() {
    const data = this.profileModel.data;

    // Reseta abas para abrir diretamente em Meu Perfil
    const tabBtnProfile = document.getElementById('tabBtnProfile');
    const tabBtnLogin = document.getElementById('tabBtnLogin');
    const tabBtnRegister = document.getElementById('tabBtnRegister');
    const paneProfile = document.getElementById('tabContentProfile');
    const paneLogin = document.getElementById('tabContentLogin');
    const paneRegister = document.getElementById('tabContentRegister');

    [tabBtnProfile, tabBtnLogin, tabBtnRegister].forEach(b => b?.classList.remove('active'));
    [paneProfile, paneLogin, paneRegister].forEach(p => { if (p) p.style.display = 'none'; });
    tabBtnProfile?.classList.add('active');
    if (paneProfile) paneProfile.style.display = 'block';

    const backupMsg = document.getElementById('backupStatusMsg');
    if (backupMsg) backupMsg.classList.add('hidden');

    // Banner de Conta Ativa
    const banner = document.getElementById('profileCloudBanner');
    if (banner) {
      if (data.isLoggedIn && data.username) {
        banner.className = 'cloud-status-banner cloud-logged';
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">🔐</span>
            <div>
              <strong>Conta Ativa: @${data.username}</strong>
              <p>Progresso criptografado e salvo neste dispositivo 🟢</p>
            </div>
          </div>
          <button id="btnLogoutUser" class="btn-ghost btn-xs" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">Sair</button>
        `;
        document.getElementById('btnLogoutUser')?.addEventListener('click', () => {
          this.profileModel.logout();
          this.openProfileModal();
        });
      } else {
        banner.className = 'cloud-status-banner cloud-guest';
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">👤</span>
            <div>
              <strong>Modo Convidado</strong>
              <p>Crie uma conta local para separar seu perfil ou exporte seu backup (.json)!</p>
            </div>
          </div>
          <button id="btnPromptLogin" class="btn-primary btn-xs">Entrar / Criar Conta</button>
        `;
        document.getElementById('btnPromptLogin')?.addEventListener('click', () => {
          tabBtnLogin?.click();
        });
      }
    }
    
    // Preenche input e avatar selecionado
    const input = document.getElementById('profileNickInput');
    if (input) input.value = data.nickname;

    const avatarBtns = document.querySelectorAll('.avatar-option-btn');
    avatarBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-avatar') === data.avatar);
    });

    // Preenche stats
    document.getElementById('profileStatMatches').textContent = data.career.matchesPlayed;
    document.getElementById('profileStatWins').textContent = data.career.wins;
    document.getElementById('profileStatWinRate').textContent = `${data.career.winRate}%`;
    document.getElementById('profileStatChallenges').textContent = data.career.challengesAnswered;
    document.getElementById('profileStatAccuracy').textContent = `${data.career.challengeAccuracy}%`;
    document.getElementById('profileStatBestRound').textContent = data.career.bestRoundCount ? `${data.career.bestRoundCount} rodadas` : '--';

    // Preenche badges
    const badgesContainer = document.getElementById('profileAchievementsList');
    if (badgesContainer) {
      badgesContainer.innerHTML = data.achievements.map(a => `
        <div class="achievement-item ${a.unlocked ? 'unlocked' : ''}">
          <span class="achievement-icon">${a.icon}</span>
          <div class="achievement-info">
            <span class="achievement-title">${a.title}</span>
            <span class="achievement-desc">${a.desc}</span>
          </div>
          <span class="achievement-status-badge ${a.unlocked ? 'status-unlocked' : 'status-locked'}">
            ${a.unlocked ? 'Desbloqueado ✓' : 'Bloqueado 🔒'}
          </span>
        </div>
      `).join('');
    }

    this.openModal('modalProfile');
  }

  openHistoryModal() {
    const history = this.profileModel.data.matchHistory;
    const container = document.getElementById('historyTableContainer');
    
    if (!container) return;

    if (!history || history.length === 0) {
      container.innerHTML = `
        <div class="history-empty-msg">
          <span style="font-size: 2.5rem; display: block; margin-bottom: 10px;">📜</span>
          Nenhuma partida registrada ainda!<br>
          Jogue sua primeira corrida contra o CyberBot para registrar seu histórico.
        </div>
      `;
    } else {
      container.innerHTML = `
        <table class="history-table">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Modo</th>
              <th>Oponente</th>
              <th>Rodadas</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            ${history.map(m => `
              <tr>
                <td>${m.date}</td>
                <td><span style="font-family: var(--font-code); color: #38bdf8;">${m.mode}</span></td>
                <td>${m.oponent}</td>
                <td>${m.rounds}</td>
                <td>
                  <span style="font-weight: 700; color: ${m.result === 'Vitória' ? '#10b981' : '#ef4444'};">
                    ${m.result === 'Vitória' ? '🏆 ' + m.result : '❌ ' + m.result}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    this.openModal('modalHistory');
  }

  openMultiplayerModal() {
    this.resetQuickMatchUI();
    this.openModal('modalMultiplayer');
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('active');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
  }

  showHomeScreen() {
    if (this.gameArenaScreenEl) {
      this.gameArenaScreenEl.classList.remove('screen-active');
      this.gameArenaScreenEl.style.display = 'none';
    }
    if (this.homeScreenEl) {
      this.homeScreenEl.style.display = 'flex';
      this.homeScreenEl.offsetHeight;
      this.homeScreenEl.classList.add('screen-active');
    }
  }

  showGameArena() {
    if (this.homeScreenEl) {
      this.homeScreenEl.classList.remove('screen-active');
      this.homeScreenEl.style.display = 'none';
    }
    if (this.gameArenaScreenEl) {
      this.gameArenaScreenEl.style.display = 'flex';
      this.gameArenaScreenEl.offsetHeight;
      this.gameArenaScreenEl.classList.add('screen-active');
    }
  }

  onStartSolo(callback) {
    this.onStartSoloCallback = callback;
  }

  onStartDemo(callback) {
    this.onStartDemoCallback = callback;
  }

  onStartMultiplayer(callback) {
    this.onStartMultiplayerCallback = callback;
  }
}
