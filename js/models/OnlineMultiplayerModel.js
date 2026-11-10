/**
 * OnlineMultiplayerModel.js
 * Sistema Multiplayer Serverless 100% compatível com GitHub Pages.
 * Combina:
 * 1. WebRTC Peer-to-Peer (PeerJS DataChannel) para partidas entre computadores diferentes na internet.
 * 2. BroadcastChannel + Storage Events para sincronização instantânea (< 1ms) entre abas no mesmo PC.
 * 3. Matchmaking Automático ("⚡ Partida Rápida") via fila de slots P2P e fila local.
 * 4. Fila sequencial de eventos (seqId + deduplicação) que impede perda de ações consecutivas.
 */
export class OnlineMultiplayerModel {
  constructor() {
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this.roomCode = null;
    this.playerRole = null; // 'host' | 'guest'
    this.connected = false;
    this.isQuickMatchSearching = false;
    this.listeners = [];

    this.outgoingSeqId = 0;
    this.processedActionIds = new Set();

    // WebRTC (PeerJS)
    this.PeerClass = null;
    this.peer = null;
    this.dataConn = null;
    this.mmPeer = null;

    // Canal local para sincronização instantânea entre abas
    this.channel = null;
    this.setupSyncChannel();
  }

  async loadPeerJS() {
    if (this.PeerClass) return this.PeerClass;
    if (typeof window !== 'undefined' && window.Peer) {
      this.PeerClass = window.Peer;
      return this.PeerClass;
    }
    try {
      const mod = await import('https://esm.sh/peerjs@1.5.4');
      this.PeerClass = mod.Peer || mod.default;
      return this.PeerClass;
    } catch (err) {
      console.info('Modo offline/local ativo (PeerJS CDN indisponível): usando BroadcastChannel.');
      return null;
    }
  }

  setupSyncChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel('python_quest_p2p_sync');
        this.channel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', (event) => {
          if (event.key && event.key.startsWith('py_sync_evt_') && event.newValue) {
            try {
              const data = JSON.parse(event.newValue);
              this.handleIncomingMessage(data);
            } catch (e) {}
          }
        });
      }
    } catch (err) {
      console.warn('BroadcastChannel não suportado:', err);
    }
  }

  onStateChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  notifyListeners(data) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error('Erro no multiplayer listener:', e); }
    });
  }

  getPeerRoomId(roomCode) {
    const clean = (roomCode || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return `python-quest-v2-room-${clean}`;
  }

  /**
   * Cria uma sala privada com código PY-XXXX (Host).
   */
  async createRoom(userProfile, customCode = null) {
    this.cleanupPeers();
    this.processedActionIds.clear();
    this.outgoingSeqId = 0;

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    this.roomCode = customCode || `PY-${randomDigits}`;
    this.playerRole = 'host';
    this.connected = true;

    const initialRoomState = {
      code: this.roomCode,
      hostTabId: this.tabId,
      status: 'waiting', // 'waiting' | 'ready' | 'playing' | 'ended'
      host: {
        nickname: userProfile.nickname || 'Host',
        avatar: userProfile.avatar || '🐍',
        role: 'host',
        pos: 1,
        boost: 0,
        shield: false
      },
      guest: null,
      currentTurn: 'host',
      round: 1,
      createdAt: Date.now()
    };

    this.saveLocalRoom(initialRoomState);
    this.broadcastMessage({ type: 'ROOM_CREATED', roomCode: this.roomCode, roomState: initialRoomState });

    // Inicializa Host WebRTC Peer em background para conexões entre diferentes dispositivos
    this.initWebRTCHost(initialRoomState);

    return initialRoomState;
  }

  async initWebRTCHost(roomState) {
    const Peer = await this.loadPeerJS();
    if (!Peer) return;

    try {
      const peerId = this.getPeerRoomId(roomState.code);
      this.peer = new Peer(peerId);

      this.peer.on('connection', (conn) => {
        this.dataConn = conn;
        this.setupDataConnection(conn, roomState);
      });

      this.peer.on('error', (err) => {
        console.debug('Aviso PeerJS Host:', err.type || err.message);
      });
    } catch (e) {
      console.debug('Falha ao iniciar host WebRTC:', e);
    }
  }

  setupDataConnection(conn, roomStateRef = null) {
    conn.on('open', () => {
      // Se somos guest, enviamos nossos dados de entrada
      if (this.playerRole === 'guest' && this.pendingGuestProfile) {
        conn.send({
          type: 'P2P_JOIN_REQUEST',
          roomCode: this.roomCode,
          guest: this.pendingGuestProfile
        });
      }
    });

    conn.on('data', (data) => {
      if (!data || typeof data !== 'object') return;

      if (data.type === 'P2P_JOIN_REQUEST' && this.playerRole === 'host') {
        const room = roomStateRef || this.getLocalRoom(this.roomCode) || {
          code: this.roomCode,
          host: { nickname: 'Host', avatar: '🐍', role: 'host' }
        };
        room.guest = data.guest;
        room.status = 'ready';
        this.saveLocalRoom(room);

        // Confirma entrada para o guest via WebRTC
        conn.send({
          type: 'P2P_JOIN_ACCEPTED',
          roomCode: this.roomCode,
          room
        });

        this.clearQuickMatchQueueIfMine();
        this.notifyListeners({ type: 'OPPONENT_CONNECTED', room });
      } else if (data.type === 'P2P_JOIN_ACCEPTED' && this.playerRole === 'guest') {
        this.saveLocalRoom(data.room);
        if (this.pendingJoinResolve) {
          const resolve = this.pendingJoinResolve;
          this.pendingJoinResolve = null;
          resolve({ success: true, room: data.room });
        }
      } else {
        this.handleIncomingMessage(data);
      }
    });
  }

  /**
   * Conecta a uma sala existente usando o código PY-XXXX (Guest).
   */
  async joinRoom(code, userProfile) {
    this.cleanupPeers();
    this.processedActionIds.clear();
    this.outgoingSeqId = 0;

    let formattedCode = (code || '').toUpperCase().trim();
    if (/^\d{4}$/.test(formattedCode)) {
      formattedCode = `PY-${formattedCode}`;
    } else if (/^PY\d{4}$/.test(formattedCode)) {
      formattedCode = `PY-${formattedCode.substring(2)}`;
    }

    this.roomCode = formattedCode;
    this.playerRole = 'guest';

    const guestProfile = {
      nickname: userProfile.nickname || 'Jogador 2',
      avatar: userProfile.avatar || '🦊',
      role: 'guest',
      pos: 1,
      boost: 0,
      shield: false
    };

    // 1. Verifica primeiro se a sala existe localmente (outra aba no mesmo navegador)
    const localRoom = this.getLocalRoom(formattedCode);
    if (localRoom && localRoom.status === 'waiting') {
      localRoom.guest = guestProfile;
      localRoom.status = 'ready';
      this.connected = true;
      this.saveLocalRoom(localRoom);

      this.broadcastMessage({
        type: 'GUEST_JOINED',
        roomCode: formattedCode,
        guest: guestProfile,
        room: localRoom,
        actionId: `join_${Date.now()}`
      });

      return { success: true, room: localRoom };
    }

    // 2. Se não está na mesma máquina, tenta conectar via WebRTC Peer-to-Peer (GitHub Pages entre PCs diferentes)
    const Peer = await this.loadPeerJS();
    if (!Peer) {
      return {
        success: false,
        message: `Sala ${formattedCode} não encontrada localmente e conexão P2P indisponível.`
      };
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        this.pendingJoinResolve = null;
        resolve(result);
      };

      this.pendingGuestProfile = guestProfile;
      this.pendingJoinResolve = finish;

      try {
        this.peer = new Peer();
        const timeout = setTimeout(() => {
          finish({
            success: false,
            message: `Sala ${formattedCode} não encontrada ou o anfitrião já iniciou a partida.`
          });
        }, 6500);

        this.peer.on('open', () => {
          const hostPeerId = this.getPeerRoomId(formattedCode);
          const conn = this.peer.connect(hostPeerId, { reliable: true });
          this.dataConn = conn;
          this.connected = true;
          this.setupDataConnection(conn);

          conn.on('error', () => {
            clearTimeout(timeout);
            finish({ success: false, message: `Falha ao conectar à sala ${formattedCode}.` });
          });
        });

        this.peer.on('error', () => {
          clearTimeout(timeout);
          finish({
            success: false,
            message: `Sala ${formattedCode} não encontrada ou código inválido.`
          });
        });
      } catch (e) {
        finish({ success: false, message: `Erro ao conectar à sala ${formattedCode}.` });
      }
    });
  }

  /**
   * ⚡ PARTIDA RÁPIDA (Matchmaking Automático sem precisar digitar código).
   * Conecta instantaneamente dois jogadores que clicarem em "Partida Rápida"
   * (seja em abas locais via BroadcastChannel ou em computadores diferentes via slots P2P).
   */
  async startQuickMatch(userProfile) {
    this.isQuickMatchSearching = true;

    // 1. Verifica fila local (outra aba já aguardando Partida Rápida)
    const waitingLocal = this.getQuickMatchWaitingRoom();
    if (waitingLocal && waitingLocal.hostTabId !== this.tabId) {
      this.clearQuickMatchQueue();
      const joinRes = await this.joinRoom(waitingLocal.roomCode, userProfile);
      if (joinRes.success) {
        this.isQuickMatchSearching = false;
        return {
          mode: 'matched_as_guest',
          roomCode: waitingLocal.roomCode,
          room: joinRes.room
        };
      }
    }

    // 2. Tenta encontrar um oponente aguardando nos slots públicos P2P (WebRTC)
    const Peer = await this.loadPeerJS();
    if (Peer) {
      const p2pMatch = await this.tryJoinOrHostP2PMatchmaking(Peer, userProfile);
      if (p2pMatch) {
        return p2pMatch;
      }
    }

    // 3. Fallback local: cria sala e registra na fila de Partida Rápida para a próxima aba conectar
    const room = await this.createRoom(userProfile);
    this.setQuickMatchWaitingRoom(room.code);
    return {
      mode: 'waiting_as_host',
      roomCode: room.code,
      room
    };
  }

  async tryJoinOrHostP2PMatchmaking(Peer, userProfile) {
    const SLOTS = ['pq-mm-2026-slot-1', 'pq-mm-2026-slot-2'];

    for (const slotId of SLOTS) {
      if (!this.isQuickMatchSearching) return null;

      // Tenta assumir o slot como Host da fila P2P:
      // - Se o slot estiver livre (`open`), ficamos aguardando nele como Host!
      // - Se o slot estiver ocupado (`unavailable-id`), significa que já há um jogador esperando nele: conectamos como Guest!
      const slotAttempt = await new Promise((resolve) => {
        let resolved = false;
        const done = (val) => {
          if (!resolved) {
            resolved = true;
            resolve(val);
          }
        };

        try {
          const testPeer = new Peer(slotId);
          const timer = setTimeout(() => done({ status: 'timeout', peer: testPeer }), 2500);

          testPeer.on('open', () => {
            clearTimeout(timer);
            done({ status: 'claimed_host', peer: testPeer });
          });

          testPeer.on('error', (err) => {
            clearTimeout(timer);
            if (err && err.type === 'unavailable-id') {
              try { testPeer.destroy(); } catch (e) {}
              done({ status: 'occupied' });
            } else {
              try { testPeer.destroy(); } catch (e) {}
              done({ status: 'error' });
            }
          });
        } catch (e) {
          done({ status: 'error' });
        }
      });

      if (slotAttempt.status === 'claimed_host') {
        // Assumimos o slot público! Criamos a sala local e escutamos conexões P2P neste slot
        const room = await this.createRoom(userProfile);
        this.setQuickMatchWaitingRoom(room.code);
        this.mmPeer = slotAttempt.peer;

        this.mmPeer.on('connection', (conn) => {
          this.dataConn = conn;
          this.setupDataConnection(conn, room);
          // Assim que o oponente conectar, libera o slot de matchmaking para outros jogadores
          setTimeout(() => {
            if (this.mmPeer) {
              try { this.mmPeer.destroy(); } catch (e) {}
              this.mmPeer = null;
            }
          }, 1500);
        });

        return {
          mode: 'waiting_as_host',
          roomCode: room.code,
          room
        };
      }

      if (slotAttempt.status === 'occupied') {
        // Há um jogador esperando neste slot! Conectamos a ele como Guest
        const joined = await this.connectToMatchmakingSlotAsGuest(Peer, slotId, userProfile);
        if (joined && joined.success) {
          this.isQuickMatchSearching = false;
          return {
            mode: 'matched_as_guest',
            roomCode: joined.room.code,
            room: joined.room
          };
        }
      }
    }

    return null;
  }

  connectToMatchmakingSlotAsGuest(Peer, slotId, userProfile) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (res) => {
        if (!settled) {
          settled = true;
          this.pendingJoinResolve = null;
          resolve(res);
        }
      };

      const guestProfile = {
        nickname: userProfile.nickname || 'Desafiante',
        avatar: userProfile.avatar || '🦊',
        role: 'guest',
        pos: 1,
        boost: 0,
        shield: false
      };

      this.playerRole = 'guest';
      this.pendingGuestProfile = guestProfile;
      this.pendingJoinResolve = (res) => {
        if (res.success && res.room) {
          this.roomCode = res.room.code;
        }
        finish(res);
      };

      try {
        this.peer = new Peer();
        const timer = setTimeout(() => finish({ success: false }), 4000);

        this.peer.on('open', () => {
          const conn = this.peer.connect(slotId, { reliable: true });
          this.dataConn = conn;
          this.connected = true;
          this.setupDataConnection(conn);
        });

        this.peer.on('error', () => {
          clearTimeout(timer);
          finish({ success: false });
        });
      } catch (e) {
        finish({ success: false });
      }
    });
  }

  cancelQuickMatch() {
    this.isQuickMatchSearching = false;
    this.clearQuickMatchQueueIfMine();
    if (this.mmPeer) {
      try { this.mmPeer.destroy(); } catch (e) {}
      this.mmPeer = null;
    }
  }

  getQuickMatchWaitingRoom() {
    try {
      const raw = localStorage.getItem('py_quickmatch_waiting');
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Expira em 45 segundos
      if (Date.now() - data.timestamp > 45000) {
        localStorage.removeItem('py_quickmatch_waiting');
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  setQuickMatchWaitingRoom(roomCode) {
    try {
      localStorage.setItem('py_quickmatch_waiting', JSON.stringify({
        roomCode,
        hostTabId: this.tabId,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }

  clearQuickMatchQueue() {
    try {
      localStorage.removeItem('py_quickmatch_waiting');
    } catch (e) {}
  }

  clearQuickMatchQueueIfMine() {
    const waiting = this.getQuickMatchWaitingRoom();
    if (waiting && waiting.hostTabId === this.tabId) {
      this.clearQuickMatchQueue();
    }
  }

  /**
   * Envia uma ação de turno (ROLL, MOVE, CHALLENGE_START, CHALLENGE_RESULT, END_TURN)
   * com número de sequência único (seqId) para nunca perder eventos rápidos.
   */
  async sendTurnAction(actionType, payload) {
    if (!this.connected || !this.roomCode) return;

    this.outgoingSeqId += 1;
    const now = Date.now();
    const action = {
      type: 'PLAYER_ACTION',
      actionId: `${this.playerRole}_${this.outgoingSeqId}_${now}`,
      seqId: this.outgoingSeqId,
      actionName: actionType,
      roomCode: this.roomCode,
      senderRole: this.playerRole,
      payload,
      timestamp: now
    };

    this.processedActionIds.add(action.actionId);

    // 1. Envia via WebRTC DataChannel (se conectado entre dispositivos diferentes)
    if (this.dataConn && this.dataConn.open) {
      try {
        this.dataConn.send(action);
      } catch (e) {
        console.warn('Erro ao enviar pacote WebRTC:', e);
      }
    }

    // 2. Envia no BroadcastChannel + Storage Event (para abas locais)
    this.broadcastMessage(action);
  }

  handleIncomingMessage(data) {
    if (!data || data.roomCode !== this.roomCode) return;

    if (data.type === 'GUEST_JOINED' && this.playerRole === 'host') {
      if (data.actionId && this.processedActionIds.has(data.actionId)) return;
      if (data.actionId) this.processedActionIds.add(data.actionId);

      const room = data.room || this.getLocalRoom(this.roomCode);
      if (room) {
        room.guest = data.guest;
        room.status = 'ready';
        this.saveLocalRoom(room);
        this.clearQuickMatchQueueIfMine();
        this.notifyListeners({ type: 'OPPONENT_CONNECTED', room });
      }
    } else if (data.type === 'PLAYER_ACTION' && data.senderRole !== this.playerRole) {
      const uniqueKey = data.actionId || `${data.senderRole}_${data.actionName}_${data.timestamp}`;
      if (this.processedActionIds.has(uniqueKey)) return;
      this.processedActionIds.add(uniqueKey);

      this.notifyListeners({ type: 'REMOTE_ACTION', ...data });
    }
  }

  broadcastMessage(message) {
    message.roomCode = this.roomCode;
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (e) {}
    }
    try {
      const key = `py_sync_evt_${this.roomCode}_${message.seqId || Date.now()}`;
      localStorage.setItem(key, JSON.stringify(message));
      setTimeout(() => {
        try { localStorage.removeItem(key); } catch (e) {}
      }, 4000);
    } catch (e) {}
  }

  getLocalRoom(code) {
    try {
      const raw = localStorage.getItem(`py_room_${code}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  saveLocalRoom(roomState) {
    try {
      localStorage.setItem(`py_room_${roomState.code}`, JSON.stringify(roomState));
    } catch (e) {}
  }

  cleanupPeers() {
    if (this.dataConn) {
      try { this.dataConn.close(); } catch (e) {}
      this.dataConn = null;
    }
    if (this.peer) {
      try { this.peer.destroy(); } catch (e) {}
      this.peer = null;
    }
    if (this.mmPeer) {
      try { this.mmPeer.destroy(); } catch (e) {}
      this.mmPeer = null;
    }
  }

  leaveRoom() {
    this.cancelQuickMatch();
    this.cleanupPeers();
    this.connected = false;
    this.roomCode = null;
    this.playerRole = null;
  }
}
