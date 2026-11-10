/**
 * HomeView.js
 * Gerenciador da Tela Inicial do Python Quest:
 * 1. Primeira página vista: Tela de Criar Conta / Login (Auth Gate).
 * 2. Hub Principal: Demonstração, Jogar Solo vs CPU, Multiplayer Online e Como Jogar no centro.
 * 3. Canto Superior Direito (Perfil): Acesso exclusivo a Meu Perfil, Histórico & Estatísticas e Trocar Conta/Sair.
 */
export class HomeView {
  constructor(userProfileModel) {
    this.profileModel = userProfileModel;

    this.homeScreenEl = null;
    this.gameArenaScreenEl = null;
    this.hasEnteredHub = false;

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
    this.updateAuthGateSessionBanner();

    // Atualiza chip sempre que perfil mudar
    this.profileModel.onChange(() => {
      this.updateProfileChip();
      this.updateAuthGateSessionBanner();
    });
  }

  createDomStructure() {
    this.homeScreenEl = document.getElementById('homeScreen');
    this.gameArenaScreenEl = document.getElementById('gameArenaScreen');

    if (!this.homeScreenEl) return;

    this.homeScreenEl.innerHTML = `
      <!-- ================================================================
           PÁGINA 1: TELA INICIAL DE CRIAR CONTA / LOGIN (PRIMEIRA PÁGINA)
           ================================================================ -->
      <div class="auth-gate-wrapper" id="authGateView">
        <div class="auth-gate-card">
          <div class="auth-gate-brand">
            <span class="home-brand-icon">🐍</span>
            <div>
              <h1 class="home-brand-title">PYTHON QUEST</h1>
              <p class="auth-gate-subtitle">Crie sua conta ou faça login para entrar na arena de algoritmos</p>
            </div>
          </div>

          <!-- Banner rápido caso já exista sessão ativa no navegador -->
          <div id="gateActiveSessionBox" class="gate-session-banner hidden">
            <div class="gate-session-info">
              <span id="gateSessionAvatar" class="gate-session-avatar">🐍</span>
              <div>
                <strong id="gateSessionName">PythonDev</strong>
                <span id="gateSessionUser">@usuario</span>
              </div>
            </div>
            <button type="button" class="btn-success btn-sm" id="btnGateContinueSession">
              Continuar ➔
            </button>
          </div>

          <!-- Abas Criar Conta / Login -->
          <div class="profile-tabs-nav auth-gate-tabs">
            <button type="button" class="profile-tab-btn active" id="gateTabBtnRegister">✨ Criar Conta</button>
            <button type="button" class="profile-tab-btn" id="gateTabBtnLogin">🔑 Fazer Login</button>
          </div>

          <!-- PAINEL 1: CRIAR CONTA -->
          <div id="gatePaneRegister" class="auth-gate-pane">
            <div class="auth-form-card">
              <p class="auth-form-desc">
                Crie sua conta local protegida com criptografia <strong>SHA-256</strong> para salvar suas conquistas, estatísticas e histórico de partidas.
              </p>

              <div id="gateRegStatusMsg" class="auth-status-msg hidden"></div>

              <div class="profile-input-group">
                <label for="gateRegUserInput">Nome de Usuário (login único):</label>
                <input type="text" id="gateRegUserInput" class="profile-text-input" placeholder="Ex: dev_python (letras e números)">
              </div>

              <div class="profile-input-group">
                <label for="gateRegNickInput">Apelido de Exibição:</label>
                <input type="text" id="gateRegNickInput" class="profile-text-input" maxlength="16" placeholder="Ex: Python Master">
              </div>

              <div class="profile-input-group">
                <label>Escolha seu Avatar:</label>
                <div class="avatar-selection-grid gate-avatar-grid" id="gateAvatarGrid">
                  <button type="button" class="avatar-option-btn selected" data-avatar="🐍" data-name="Cyber Snake">
                    <span class="avatar-emoji">🐍</span>
                    <span class="avatar-label">Snake</span>
                  </button>
                  <button type="button" class="avatar-option-btn" data-avatar="🤖" data-name="Bit Bot">
                    <span class="avatar-emoji">🤖</span>
                    <span class="avatar-label">Bot</span>
                  </button>
                  <button type="button" class="avatar-option-btn" data-avatar="🦊" data-name="Algo Fox">
                    <span class="avatar-emoji">🦊</span>
                    <span class="avatar-label">Fox</span>
                  </button>
                  <button type="button" class="avatar-option-btn" data-avatar="🦅" data-name="Binary Falcon">
                    <span class="avatar-emoji">🦅</span>
                    <span class="avatar-label">Falcon</span>
                  </button>
                  <button type="button" class="avatar-option-btn" data-avatar="🐱" data-name="Terminal Cat">
                    <span class="avatar-emoji">🐱</span>
                    <span class="avatar-label">Cat</span>
                  </button>
                </div>
              </div>

              <div class="profile-input-group">
                <label for="gateRegPassInput">Senha (mínimo 4 caracteres):</label>
                <input type="password" id="gateRegPassInput" class="profile-text-input" placeholder="Crie uma senha...">
              </div>

              <button type="button" class="btn-success" id="btnGateSubmitRegister" style="width: 100%; margin-top: 6px; justify-content: center;">
                ✨ Criar Conta e Entrar
              </button>
            </div>
          </div>

          <!-- PAINEL 2: LOGIN -->
          <div id="gatePaneLogin" class="auth-gate-pane" style="display: none;">
            <div class="auth-form-card">
              <p class="auth-form-desc">
                Entre com seu <strong>Nome de Usuário</strong> e <strong>Senha</strong> para carregar seu perfil, histórico e estatísticas.
              </p>

              <div id="gateLoginStatusMsg" class="auth-status-msg hidden"></div>

              <div class="profile-input-group">
                <label for="gateLoginUserInput">Nome de Usuário:</label>
                <input type="text" id="gateLoginUserInput" class="profile-text-input" placeholder="Digite seu usuário...">
              </div>

              <div class="profile-input-group">
                <label for="gateLoginPassInput">Senha:</label>
                <input type="password" id="gateLoginPassInput" class="profile-text-input" placeholder="Digite sua senha...">
              </div>

              <button type="button" class="btn-primary" id="btnGateSubmitLogin" style="width: 100%; margin-top: 6px; justify-content: center;">
                🔑 Entrar na Conta
              </button>
            </div>
          </div>

          <!-- Rodapé da Tela de Autenticação: Modo Convidado -->
          <div class="auth-gate-footer">
            <button type="button" class="btn-ghost btn-sm" id="btnGateGuest">
              👤 Continuar sem conta (Modo Convidado / Avaliação)
            </button>
          </div>
        </div>
      </div>

      <!-- ================================================================
           PÁGINA 2: HUB PRINCIPAL DE JOGO (APÓS LOGIN / CRIAR CONTA)
           ================================================================ -->
      <div class="home-content-wrapper hidden" id="hubMainView">
        
        <!-- BARRA SUPERIOR DA HOME -->
        <header class="home-top-bar">
          <div class="home-brand">
            <span class="home-brand-icon">🐍</span>
            <div>
              <h1 class="home-brand-title">PYTHON QUEST</h1>
            </div>
          </div>

          <!-- PERFIL SUPERIOR DIREITO (Com Menu de Meu Perfil e Histórico & Estatísticas) -->
          <div class="top-profile-menu-container" id="topProfileContainer">
            <div class="user-profile-chip" id="topProfileChip" title="Abrir menu do Perfil, Histórico e Estatísticas">
              <div class="chip-avatar-wrapper" id="topChipAvatar">🐍</div>
              <div class="chip-info">
                <span class="chip-name" id="topChipName">PythonDev</span>
                <span class="chip-stats" id="topChipStats">Vitórias: 0 | 0%</span>
              </div>
              <span class="chip-dropdown-caret">▾</span>
            </div>

            <!-- Dropdown exclusivo no Perfil Superior Direito -->
            <div class="top-profile-dropdown hidden" id="topProfileDropdown">
              <button type="button" class="top-profile-dropdown-item" id="topMenuBtnProfile">
                <span>👤</span>
                <div>
                  <strong>Meu Perfil</strong>
                  <small>Apelido, avatar, conquistas e backup</small>
                </div>
              </button>
              <button type="button" class="top-profile-dropdown-item" id="topMenuBtnHistory">
                <span>📊</span>
                <div>
                  <strong>Histórico & Estatísticas</strong>
                  <small>Desempenho de carreira e partidas</small>
                </div>
              </button>
              <div class="top-profile-dropdown-divider"></div>
              <button type="button" class="top-profile-dropdown-item item-logout" id="topMenuBtnSwitchAccount">
                <span>🔑</span>
                <div>
                  <strong>Criar Conta / Trocar Conta</strong>
                  <small>Voltar para a tela de autenticação</small>
                </div>
              </button>
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

        <!-- GRADE CENTRALIZADA DE OPÇÕES (Apenas Modos de Jogo e Como Jogar) -->
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

        </section>

      </div>

      <!-- ================================================================
           MODAIS DO HUB INICIAL
           ================================================================ -->
      
      <!-- MODAL 1: MEU PERFIL (Acessado pelo Perfil Superior Direito) -->
      <div class="home-modal-overlay" id="modalProfile">
        <div class="home-modal-card">
          <div class="home-modal-header">
            <div class="home-modal-title"><span>👤</span> Meu Perfil</div>
            <button class="home-modal-close" data-close="modalProfile">✖</button>
          </div>
          
          <div class="home-modal-body">
            <!-- Atalho interno entre Meu Perfil e Histórico & Estatísticas -->
            <div class="profile-tabs-nav">
              <button type="button" class="profile-tab-btn active" id="modalSwitchToProfile">👤 Meu Perfil</button>
              <button type="button" class="profile-tab-btn" id="modalSwitchToHistory">📊 Histórico & Estatísticas</button>
            </div>

            <!-- Banner de Status da Conta -->
            <div id="profileCloudBanner" class="cloud-status-banner cloud-guest"></div>

            <div class="profile-input-group" style="margin-top: 8px;">
              <label for="profileNickInput">Seu Apelido no Jogo:</label>
              <input type="text" id="profileNickInput" class="profile-text-input" maxlength="16" placeholder="Digite seu apelido...">
            </div>

            <div class="profile-edit-avatar-section" style="margin-top: 10px;">
              <label>Selecione seu Avatar:</label>
              <div class="avatar-selection-grid" id="avatarGrid">
                <button type="button" class="avatar-option-btn" data-avatar="🐍" data-name="Cyber Snake">
                  <span class="avatar-emoji">🐍</span>
                  <span class="avatar-label">Cyber Snake</span>
                </button>
                <button type="button" class="avatar-option-btn" data-avatar="🤖" data-name="Bit Bot">
                  <span class="avatar-emoji">🤖</span>
                  <span class="avatar-label">Bit Bot</span>
                </button>
                <button type="button" class="avatar-option-btn" data-avatar="🦊" data-name="Algo Fox">
                  <span class="avatar-emoji">🦊</span>
                  <span class="avatar-label">Algo Fox</span>
                </button>
                <button type="button" class="avatar-option-btn" data-avatar="🦅" data-name="Binary Falcon">
                  <span class="avatar-emoji">🦅</span>
                  <span class="avatar-label">Binary Falcon</span>
                </button>
                <button type="button" class="avatar-option-btn" data-avatar="🐱" data-name="Terminal Cat">
                  <span class="avatar-emoji">🐱</span>
                  <span class="avatar-label">Terminal Cat</span>
                </button>
              </div>
            </div>

            <!-- Badges -->
            <div class="profile-badges-section" style="margin-top: 12px;">
              <label style="font-size: 0.85rem; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 8px;">Conquistas Desbloqueadas:</label>
              <div class="achievements-list" id="profileAchievementsList"></div>
            </div>

            <!-- Portabilidade de Conta (Backup JSON) -->
            <div class="profile-backup-section" style="margin-top: 12px; padding: 12px; background: rgba(15, 23, 42, 0.55); border: 1px solid rgba(148, 163, 184, 0.16); border-radius: 10px;">
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

            <div class="home-modal-footer" style="padding: 16px 0 0 0; background: transparent; border: none; margin-top: 10px;">
              <button class="btn-ghost" data-close="modalProfile">Fechar</button>
              <button class="btn-success" id="saveProfileBtn">Salvar Alterações</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MODAL 2: HISTÓRICO & ESTATÍSTICAS (Acessado pelo Perfil Superior Direito) -->
      <div class="home-modal-overlay" id="modalHistory">
        <div class="home-modal-card">
          <div class="home-modal-header">
            <div class="home-modal-title"><span>📊</span> Histórico & Estatísticas</div>
            <button class="home-modal-close" data-close="modalHistory">✖</button>
          </div>
          <div class="home-modal-body">
            <!-- Atalho interno entre Meu Perfil e Histórico & Estatísticas -->
            <div class="profile-tabs-nav">
              <button type="button" class="profile-tab-btn" id="historySwitchToProfile">👤 Meu Perfil</button>
              <button type="button" class="profile-tab-btn active" id="historySwitchToHistory">📊 Histórico & Estatísticas</button>
            </div>

            <div class="profile-stats-section">
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

            <div>
              <label style="font-size: 0.85rem; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 8px;">Partidas Recentes:</label>
              <div id="historyTableContainer"></div>
            </div>
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
            <p>Seja o primeiro programador a alcançar ou ultrapassar a <strong>Casa 64</strong> (ou a <strong>Casa 22</strong> no Modo Demonstração) na trilha em zigue-zague.</p>
            
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
    // =========================================================================
    // 1. EVENTOS DA PRIMEIRA PÁGINA (CRIAR CONTA / LOGIN)
    // =========================================================================
    const gateTabRegister = document.getElementById('gateTabBtnRegister');
    const gateTabLogin = document.getElementById('gateTabBtnLogin');
    const gatePaneRegister = document.getElementById('gatePaneRegister');
    const gatePaneLogin = document.getElementById('gatePaneLogin');

    const switchGateTab = (tab) => {
      if (tab === 'login') {
        gateTabLogin?.classList.add('active');
        gateTabRegister?.classList.remove('active');
        if (gatePaneLogin) gatePaneLogin.style.display = 'block';
        if (gatePaneRegister) gatePaneRegister.style.display = 'none';
      } else {
        gateTabRegister?.classList.add('active');
        gateTabLogin?.classList.remove('active');
        if (gatePaneRegister) gatePaneRegister.style.display = 'block';
        if (gatePaneLogin) gatePaneLogin.style.display = 'none';
      }
    };

    gateTabRegister?.addEventListener('click', () => switchGateTab('register'));
    gateTabLogin?.addEventListener('click', () => switchGateTab('login'));

    // Seleção de avatar na tela inicial de Criar Conta
    const gateAvatarBtns = document.querySelectorAll('#gateAvatarGrid .avatar-option-btn');
    gateAvatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        gateAvatarBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    // Submissão de Criar Conta na Tela Inicial
    document.getElementById('btnGateSubmitRegister')?.addEventListener('click', async () => {
      const userInput = document.getElementById('gateRegUserInput');
      const nickInput = document.getElementById('gateRegNickInput');
      const passInput = document.getElementById('gateRegPassInput');
      const msgEl = document.getElementById('gateRegStatusMsg');
      const btn = document.getElementById('btnGateSubmitRegister');
      const selectedAvatarBtn = document.querySelector('#gateAvatarGrid .avatar-option-btn.selected');

      const user = userInput?.value.trim();
      const nick = nickInput?.value.trim() || user;
      const pass = passInput?.value;
      const avatar = selectedAvatarBtn?.getAttribute('data-avatar') || '🐍';
      const avatarName = selectedAvatarBtn?.getAttribute('data-name') || 'Cyber Snake';

      if (!user || !pass) {
        if (msgEl) {
          msgEl.className = 'auth-status-msg status-error';
          msgEl.textContent = 'Informe um nome de usuário e uma senha de pelo menos 4 caracteres.';
          msgEl.classList.remove('hidden');
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Criando Conta...';

      const res = await this.profileModel.register(user, pass, nick, avatar);
      btn.disabled = false;
      btn.textContent = '✨ Criar Conta e Entrar';

      if (msgEl) {
        msgEl.className = `auth-status-msg ${res.success ? 'status-success' : 'status-error'}`;
        msgEl.textContent = res.message;
        msgEl.classList.remove('hidden');
      }

      if (res.success) {
        this.profileModel.updateAvatar(avatar, avatarName);
        setTimeout(() => {
          this.enterMainHub();
        }, 450);
      }
    });

    // Submissão de Login na Tela Inicial
    const handleGateLogin = async () => {
      const userInput = document.getElementById('gateLoginUserInput');
      const passInput = document.getElementById('gateLoginPassInput');
      const msgEl = document.getElementById('gateLoginStatusMsg');
      const btn = document.getElementById('btnGateSubmitLogin');

      const user = userInput?.value.trim();
      const pass = passInput?.value;

      if (!user || !pass) {
        if (msgEl) {
          msgEl.className = 'auth-status-msg status-error';
          msgEl.textContent = 'Preencha seu nome de usuário e senha.';
          msgEl.classList.remove('hidden');
        }
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Autenticando...';

      const res = await this.profileModel.login(user, pass);
      btn.disabled = false;
      btn.textContent = '🔑 Entrar na Conta';

      if (msgEl) {
        msgEl.className = `auth-status-msg ${res.success ? 'status-success' : 'status-error'}`;
        msgEl.textContent = res.message;
        msgEl.classList.remove('hidden');
      }

      if (res.success) {
        setTimeout(() => {
          this.enterMainHub();
        }, 400);
      }
    };

    document.getElementById('btnGateSubmitLogin')?.addEventListener('click', handleGateLogin);
    document.getElementById('gateLoginPassInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleGateLogin();
    });

    // Continuar com sessão já autenticada ou como convidado
    document.getElementById('btnGateContinueSession')?.addEventListener('click', () => {
      this.enterMainHub();
    });

    document.getElementById('btnGateGuest')?.addEventListener('click', () => {
      this.enterMainHub();
    });

    // =========================================================================
    // 2. MENU DO PERFIL SUPERIOR DIREITO (MEU PERFIL + HISTÓRICO & STATS)
    // =========================================================================
    const topProfileChip = document.getElementById('topProfileChip');
    const topProfileDropdown = document.getElementById('topProfileDropdown');
    const topProfileContainer = document.getElementById('topProfileContainer');

    topProfileChip?.addEventListener('click', (e) => {
      e.stopPropagation();
      topProfileDropdown?.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (topProfileDropdown && !topProfileDropdown.classList.contains('hidden')) {
        if (!topProfileContainer?.contains(e.target)) {
          topProfileDropdown.classList.add('hidden');
        }
      }
    });

    document.getElementById('topMenuBtnProfile')?.addEventListener('click', () => {
      topProfileDropdown?.classList.add('hidden');
      this.openProfileModal();
    });

    document.getElementById('topMenuBtnHistory')?.addEventListener('click', () => {
      topProfileDropdown?.classList.add('hidden');
      this.openHistoryModal();
    });

    document.getElementById('topMenuBtnSwitchAccount')?.addEventListener('click', () => {
      topProfileDropdown?.classList.add('hidden');
      this.showAuthGateScreen();
    });

    // Alternância rápida entre os modais Meu Perfil <-> Histórico & Estatísticas
    document.getElementById('modalSwitchToHistory')?.addEventListener('click', () => {
      this.closeModal('modalProfile');
      this.openHistoryModal();
    });

    document.getElementById('historySwitchToProfile')?.addEventListener('click', () => {
      this.closeModal('modalHistory');
      this.openProfileModal();
    });

    // =========================================================================
    // 3. BOTÕES CENTRAIS DO HUB (DEMONSTRAÇÃO, SOLO, MULTIPLAYER, COMO JOGAR)
    // =========================================================================
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
    const avatarBtns = document.querySelectorAll('#avatarGrid .avatar-option-btn');
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

  enterMainHub() {
    this.hasEnteredHub = true;
    const authGate = document.getElementById('authGateView');
    const hubMain = document.getElementById('hubMainView');
    if (authGate) authGate.classList.add('hidden');
    if (hubMain) hubMain.classList.remove('hidden');
    this.updateProfileChip();
  }

  showAuthGateScreen() {
    this.hasEnteredHub = false;
    const authGate = document.getElementById('authGateView');
    const hubMain = document.getElementById('hubMainView');
    if (hubMain) hubMain.classList.add('hidden');
    if (authGate) authGate.classList.remove('hidden');
    this.updateAuthGateSessionBanner();
  }

  updateAuthGateSessionBanner() {
    const data = this.profileModel.data;
    const box = document.getElementById('gateActiveSessionBox');
    if (!box) return;

    if (data.isLoggedIn && data.username) {
      box.classList.remove('hidden');
      const avatarEl = document.getElementById('gateSessionAvatar');
      const nameEl = document.getElementById('gateSessionName');
      const userEl = document.getElementById('gateSessionUser');
      if (avatarEl) avatarEl.textContent = data.avatar || '🐍';
      if (nameEl) nameEl.textContent = data.nickname || data.username;
      if (userEl) userEl.textContent = `Sessão salva (@${data.username})`;
    } else {
      box.classList.add('hidden');
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
          <button id="btnLogoutUser" class="btn-ghost btn-xs" style="border-color: rgba(239, 68, 68, 0.4); color: #fca5a5;">Sair da Conta</button>
        `;
        document.getElementById('btnLogoutUser')?.addEventListener('click', () => {
          this.profileModel.logout();
          this.closeModal('modalProfile');
          this.showAuthGateScreen();
        });
      } else {
        banner.className = 'cloud-status-banner cloud-guest';
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.3rem;">👤</span>
            <div>
              <strong>Modo Convidado</strong>
              <p>Crie uma conta ou faça login para proteger seu perfil com senha!</p>
            </div>
          </div>
          <button id="btnPromptLogin" class="btn-primary btn-xs">Criar Conta / Login</button>
        `;
        document.getElementById('btnPromptLogin')?.addEventListener('click', () => {
          this.closeModal('modalProfile');
          this.showAuthGateScreen();
        });
      }
    }
    
    // Preenche input e avatar selecionado
    const input = document.getElementById('profileNickInput');
    if (input) input.value = data.nickname;

    const avatarBtns = document.querySelectorAll('#avatarGrid .avatar-option-btn');
    avatarBtns.forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-avatar') === data.avatar);
    });

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
    const data = this.profileModel.data;
    const history = data.matchHistory;
    const container = document.getElementById('historyTableContainer');

    // Preenche estatísticas de carreira no modal Histórico & Estatísticas
    const statMatches = document.getElementById('profileStatMatches');
    const statWins = document.getElementById('profileStatWins');
    const statWinRate = document.getElementById('profileStatWinRate');
    const statChallenges = document.getElementById('profileStatChallenges');
    const statAccuracy = document.getElementById('profileStatAccuracy');
    const statBestRound = document.getElementById('profileStatBestRound');

    if (statMatches) statMatches.textContent = data.career.matchesPlayed;
    if (statWins) statWins.textContent = data.career.wins;
    if (statWinRate) statWinRate.textContent = `${data.career.winRate}%`;
    if (statChallenges) statChallenges.textContent = data.career.challengesAnswered;
    if (statAccuracy) statAccuracy.textContent = `${data.career.challengeAccuracy}%`;
    if (statBestRound) statBestRound.textContent = data.career.bestRoundCount ? `${data.career.bestRoundCount} rodadas` : '--';

    if (container) {
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
    if (this.hasEnteredHub) {
      this.enterMainHub();
    } else {
      this.showAuthGateScreen();
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
