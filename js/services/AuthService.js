/**
 * AuthService.js
 * Serviço de autenticação 100% Client-Side compatível com GitHub Pages.
 * Suporta múltiplas contas locais protegidas por hash SHA-256 (Web Crypto API)
 * e portabilidade de conta via Exportação/Importação de arquivo JSON.
 */
export class AuthService {
  constructor() {
    this.SESSION_KEY = 'python_quest_logged_user';
    this.ACCOUNTS_DB_KEY = 'python_quest_accounts_db';
    this.currentUser = null;
    this.loadSession();
  }

  loadSession() {
    try {
      const stored = localStorage.getItem(this.SESSION_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Erro ao carregar sessão de usuário:', e);
      this.currentUser = null;
    }
  }

  getAccountsDb() {
    try {
      const raw = localStorage.getItem(this.ACCOUNTS_DB_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Erro ao ler banco de contas local:', e);
      return {};
    }
  }

  saveAccountsDb(db) {
    try {
      localStorage.setItem(this.ACCOUNTS_DB_KEY, JSON.stringify(db));
    } catch (e) {
      console.error('Erro ao salvar banco de contas local:', e);
    }
  }

  isLoggedIn() {
    return Boolean(this.currentUser && this.currentUser.username);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Gera hash SHA-256 seguro para a senha do jogador no navegador.
   * Possui fallback determinístico caso aberto via protocolo sem crypto.subtle.
   */
  async hashPassword(password) {
    const salted = `${password}_pq_secure_salt_2026`;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(salted);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // Fallback FNV-1a 64-bit hex para ambientes restritos
    let h1 = 0xdeadbeef ^ salted.length;
    let h2 = 0x41c6ce57 ^ salted.length;
    for (let i = 0, ch; i < salted.length; i++) {
      ch = salted.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
  }

  sanitizeUsername(raw) {
    if (!raw) return '';
    return raw.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '');
  }

  /**
   * Registra um novo jogador no banco local do navegador.
   */
  async register(usernameRaw, password, nicknameRaw, avatar = '🐍', initialProfile = null) {
    const username = this.sanitizeUsername(usernameRaw);
    if (!username || username.length < 3) {
      return { success: false, message: 'O nome de usuário deve ter pelo menos 3 caracteres (letras, números, _ ou -).' };
    }
    if (!password || password.length < 4) {
      return { success: false, message: 'A senha deve ter no mínimo 4 caracteres.' };
    }

    const nickname = (nicknameRaw && nicknameRaw.trim()) ? nicknameRaw.trim().substring(0, 16) : username;
    const db = this.getAccountsDb();

    if (db[username]) {
      return { success: false, message: `O usuário "@${username}" já existe neste navegador. Faça login ou escolha outro nome.` };
    }

    const passwordHash = await this.hashPassword(password);

    const newUser = {
      username,
      nickname,
      avatar: (initialProfile && initialProfile.avatar) || avatar,
      passwordHash,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      career: (initialProfile && initialProfile.career) ? { ...initialProfile.career } : {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        challengesAnswered: 0,
        challengesCorrect: 0,
        challengeAccuracy: 0,
        currentChallengeStreak: 0,
        tilesTraveled: 0,
        bestRoundCount: null
      },
      matchHistory: (initialProfile && Array.isArray(initialProfile.matchHistory)) ? [...initialProfile.matchHistory] : [],
      achievements: (initialProfile && Array.isArray(initialProfile.achievements)) ? [...initialProfile.achievements] : null
    };

    db[username] = newUser;
    this.saveAccountsDb(db);

    this.currentUser = {
      username: newUser.username,
      nickname: newUser.nickname,
      avatar: newUser.avatar
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));

    const safeUser = { ...newUser };
    delete safeUser.passwordHash;

    return {
      success: true,
      user: safeUser,
      message: `Conta @${username} criada com sucesso! Bem-vindo, ${nickname}!`
    };
  }

  /**
   * Autentica o jogador no cofre local.
   */
  async login(usernameRaw, password) {
    const username = this.sanitizeUsername(usernameRaw);
    if (!username || !password) {
      return { success: false, message: 'Informe seu usuário e senha.' };
    }

    const db = this.getAccountsDb();
    const userData = db[username];

    if (!userData) {
      return { success: false, message: `Usuário "@${username}" não encontrado neste dispositivo. Crie uma conta ou importe seu backup (.json)!` };
    }

    const passwordHash = await this.hashPassword(password);
    if (userData.passwordHash !== passwordHash) {
      return { success: false, message: 'Senha incorreta. Verifique e tente novamente.' };
    }

    this.currentUser = {
      username: userData.username,
      nickname: userData.nickname || userData.username,
      avatar: userData.avatar || '🐍'
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));

    const safeUser = { ...userData };
    delete safeUser.passwordHash;

    return {
      success: true,
      user: safeUser,
      message: `Login realizado com sucesso! Bem-vindo de volta, ${userData.nickname || username}!`
    };
  }

  logout() {
    this.currentUser = null;
    try {
      localStorage.removeItem(this.SESSION_KEY);
    } catch (e) {}
    return { success: true, message: 'Sessão encerrada com sucesso.' };
  }

  /**
   * Sincroniza estatísticas, conquistas e histórico do jogador com a conta ativa.
   */
  async syncUserData(profileData) {
    if (!this.isLoggedIn()) return;

    try {
      const username = this.currentUser.username;
      const db = this.getAccountsDb();
      if (!db[username]) return;

      db[username] = {
        ...db[username],
        nickname: profileData.nickname,
        avatar: profileData.avatar,
        career: profileData.career,
        matchHistory: profileData.matchHistory || [],
        achievements: profileData.achievements || db[username].achievements,
        updatedAt: Date.now()
      };

      this.saveAccountsDb(db);

      this.currentUser = {
        username,
        nickname: profileData.nickname,
        avatar: profileData.avatar
      };
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(this.currentUser));
    } catch (err) {
      console.warn('Falha ao sincronizar conta local:', err);
    }
  }

  /**
   * Carrega os dados mais recentes da conta logada.
   */
  async fetchCloudProfile(usernameRaw) {
    const username = this.sanitizeUsername(usernameRaw || (this.currentUser && this.currentUser.username));
    if (!username) return null;

    const db = this.getAccountsDb();
    const userData = db[username];
    if (!userData) return null;

    const safeUser = { ...userData };
    delete safeUser.passwordHash;
    return safeUser;
  }
}

export const authService = new AuthService();
