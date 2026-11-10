import { authService } from '../services/AuthService.js';

export class UserProfileModel {
  constructor() {
    this.STORAGE_KEY = 'python_quest_user_profile';
    this.authService = authService;
    this.data = this.getDefaultProfile();
    this.listeners = [];
    this.load();
    this.initAccountSession();
  }

  getDefaultProfile() {
    const session = this.authService ? this.authService.getCurrentUser() : null;
    return {
      username: session ? session.username : null,
      isLoggedIn: Boolean(session),
      nickname: session ? session.nickname : 'PythonDev',
      avatar: session ? session.avatar : '🐍', // 🐍, 🤖, 🦊, 🦅, 🐱
      avatarName: 'Cyber Snake',
      career: {
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
      matchHistory: [],
      achievements: [
        { id: 'first_step', icon: '🚀', title: 'Primeiro Passo', desc: 'Completou a primeira partida no jogo.', unlocked: false },
        { id: 'winner', icon: '🏆', title: 'Python Master', desc: 'Venceu uma corrida alcançando a Casa 64.', unlocked: false },
        { id: 'speed_coder', icon: '⚡', title: 'Speed Coder', desc: 'Venceu uma partida em menos de 12 rodadas.', unlocked: false },
        { id: 'bug_hunter', icon: '🎯', title: 'Bug Hunter', desc: 'Acertou 3 desafios de código sem errar.', unlocked: false },
        { id: 'shield_master', icon: '🛡️', title: 'Try / Except', desc: 'Sobreviveu a um bug usando o Escudo protetor.', unlocked: false }
      ]
    };
  }

  mergeAchievements(savedList) {
    const defaults = this.getDefaultProfile().achievements;
    if (!Array.isArray(savedList)) return defaults;
    return defaults.map(def => {
      const found = savedList.find(a => a.id === def.id);
      return found ? { ...def, unlocked: Boolean(found.unlocked) } : def;
    });
  }

  async initAccountSession() {
    if (this.authService && this.authService.isLoggedIn()) {
      try {
        const accountData = await this.authService.fetchCloudProfile();
        if (accountData) {
          this.data = {
            ...this.data,
            ...accountData,
            username: accountData.username,
            isLoggedIn: true,
            career: { ...this.getDefaultProfile().career, ...(accountData.career || {}) },
            matchHistory: accountData.matchHistory || this.data.matchHistory || [],
            achievements: this.mergeAchievements(accountData.achievements || this.data.achievements)
          };
          this.save(false);
          this.notifyListeners();
        }
      } catch (err) {
        console.warn('Falha ao restaurar dados da conta:', err);
      }
    }
  }

  load() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = {
          ...this.getDefaultProfile(),
          ...parsed,
          career: { ...this.getDefaultProfile().career, ...(parsed.career || {}) },
          achievements: this.mergeAchievements(parsed.achievements)
        };
      }
    } catch (e) {
      console.warn('Falha ao carregar perfil do localStorage, usando padrões:', e);
      this.data = this.getDefaultProfile();
    }
  }

  save(syncToAccount = true) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
      this.notifyListeners();

      if (syncToAccount && this.authService && this.authService.isLoggedIn()) {
        this.authService.syncUserData(this.data);
      }
    } catch (e) {
      console.error('Falha ao salvar perfil:', e);
    }
  }

  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.data); } catch (err) { console.error(err); }
    });
  }

  updateNickname(newNick) {
    if (!newNick || !newNick.trim()) return;
    this.data.nickname = newNick.trim().substring(0, 16);
    this.save();
  }

  updateAvatar(emoji, name = '') {
    this.data.avatar = emoji;
    this.data.avatarName = name || this.getAvatarName(emoji);
    this.save();
  }

  getAvatarName(emoji) {
    switch (emoji) {
      case '🐍': return 'Cyber Snake';
      case '🤖': return 'Bit Bot';
      case '🦊': return 'Algo Fox';
      case '🦅': return 'Binary Falcon';
      case '🐱': return 'Terminal Cat';
      default: return 'Dev Avatar';
    }
  }

  addTilesTraveled(steps) {
    const count = Math.abs(parseInt(steps, 10) || 0);
    if (count <= 0) return;
    this.data.career.tilesTraveled = (this.data.career.tilesTraveled || 0) + count;
    this.save();
  }

  recordMatch(winner, totalRounds, mode = 'Solo vs CPU', oponent = 'CyberBot') {
    const isWin = (winner === 'player' || winner === 'p1');
    const career = this.data.career;

    career.matchesPlayed += 1;
    if (isWin) {
      career.wins += 1;
      if (!career.bestRoundCount || totalRounds < career.bestRoundCount) {
        career.bestRoundCount = totalRounds;
      }
    } else {
      career.losses += 1;
    }

    career.winRate = Math.round((career.wins / career.matchesPlayed) * 100);

    const matchRecord = {
      id: `match_${Date.now()}`,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      mode,
      oponent,
      rounds: totalRounds,
      result: isWin ? 'Vitória' : 'Derrota',
      winnerName: isWin ? this.data.nickname : oponent
    };

    this.data.matchHistory.unshift(matchRecord);
    if (this.data.matchHistory.length > 20) this.data.matchHistory.pop();

    this.checkAchievements(isWin, totalRounds);
    this.save();
  }

  recordChallenge(isCorrect) {
    const career = this.data.career;
    career.challengesAnswered += 1;
    if (isCorrect) {
      career.challengesCorrect += 1;
      career.currentChallengeStreak = (career.currentChallengeStreak || 0) + 1;
      if (career.currentChallengeStreak >= 3) {
        const bugHunter = this.data.achievements.find(a => a.id === 'bug_hunter');
        if (bugHunter && !bugHunter.unlocked) {
          bugHunter.unlocked = true;
        }
      }
    } else {
      career.currentChallengeStreak = 0;
    }
    career.challengeAccuracy = Math.round((career.challengesCorrect / career.challengesAnswered) * 100);
    this.save();
  }

  checkAchievements(isWin, totalRounds) {
    const ach = this.data.achievements;

    const firstStep = ach.find(a => a.id === 'first_step');
    if (firstStep && !firstStep.unlocked) firstStep.unlocked = true;

    if (isWin) {
      const winnerAch = ach.find(a => a.id === 'winner');
      if (winnerAch && !winnerAch.unlocked) winnerAch.unlocked = true;

      if (totalRounds <= 12) {
        const speedAch = ach.find(a => a.id === 'speed_coder');
        if (speedAch && !speedAch.unlocked) speedAch.unlocked = true;
      }
    }
  }

  unlockAchievement(id) {
    const target = this.data.achievements.find(a => a.id === id);
    if (target && !target.unlocked) {
      target.unlocked = true;
      this.save();
      return target;
    }
    return null;
  }

  resetProgress() {
    this.data = this.getDefaultProfile();
    this.save();
  }

  async login(username, password) {
    const res = await this.authService.login(username, password);
    if (res.success && res.user) {
      this.data = {
        ...this.getDefaultProfile(),
        ...res.user,
        username: res.user.username,
        isLoggedIn: true,
        nickname: res.user.nickname || res.user.username,
        avatar: res.user.avatar || '🐍',
        avatarName: this.getAvatarName(res.user.avatar || '🐍'),
        career: { ...this.getDefaultProfile().career, ...(res.user.career || {}) },
        matchHistory: res.user.matchHistory || [],
        achievements: this.mergeAchievements(res.user.achievements)
      };
      this.save(false);
      this.notifyListeners();
    }
    return res;
  }

  async register(username, password, nickname, avatar) {
    // Transfere o progresso atual de convidado para a nova conta criada
    const res = await this.authService.register(username, password, nickname, avatar, this.data);
    if (res.success && res.user) {
      this.data = {
        ...this.getDefaultProfile(),
        ...res.user,
        username: res.user.username,
        isLoggedIn: true,
        nickname: res.user.nickname || res.user.username,
        avatar: res.user.avatar || avatar || '🐍',
        avatarName: this.getAvatarName(res.user.avatar || avatar || '🐍'),
        career: { ...this.getDefaultProfile().career, ...(res.user.career || {}) },
        matchHistory: res.user.matchHistory || [],
        achievements: this.mergeAchievements(res.user.achievements)
      };
      this.save(false);
      this.notifyListeners();
    }
    return res;
  }

  logout() {
    this.authService.logout();
    this.data = this.getDefaultProfile();
    this.save(false);
    this.notifyListeners();
    return { success: true };
  }

  /**
   * Gera string JSON formatada para download de backup do perfil.
   */
  exportBackupJSON() {
    const payload = {
      app: 'Python Quest',
      version: '0.3',
      exportedAt: new Date().toISOString(),
      profile: {
        username: this.data.username || null,
        nickname: this.data.nickname,
        avatar: this.data.avatar,
        avatarName: this.data.avatarName,
        career: this.data.career,
        matchHistory: this.data.matchHistory,
        achievements: this.data.achievements
      }
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Restaura um perfil a partir de um arquivo JSON de backup.
   */
  importBackupJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      const prof = parsed.profile || parsed;
      if (!prof || typeof prof !== 'object' || !prof.career) {
        return { success: false, message: 'Arquivo JSON inválido ou incompatível com o Python Quest.' };
      }

      this.data = {
        ...this.getDefaultProfile(),
        ...this.data,
        nickname: (prof.nickname || 'PythonDev').substring(0, 16),
        avatar: prof.avatar || '🐍',
        avatarName: this.getAvatarName(prof.avatar || '🐍'),
        career: { ...this.getDefaultProfile().career, ...(prof.career || {}) },
        matchHistory: Array.isArray(prof.matchHistory) ? prof.matchHistory : [],
        achievements: this.mergeAchievements(prof.achievements)
      };

      this.save(true);
      return { success: true, message: `Backup de "${this.data.nickname}" importado com sucesso!` };
    } catch (e) {
      return { success: false, message: 'Erro ao ler o arquivo JSON de backup.' };
    }
  }
}
