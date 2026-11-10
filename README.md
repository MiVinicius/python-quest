# 🐍 Python Quest (V0.3)

> **Sorte no dado, lógica nos blocos, estratégia nas cartas e duelos P2P online.**  
> Uma corrida de 64 casas com programação visual hierárquica em blocos traduzida para Python em tempo real, enfrentando bots inteligentes ou outros jogadores via Matchmaking Automático (**Partida Rápida**) e salas privadas.

---

## 🌟 Destaques da Versão 0.3

- 🎯 **Novo Modo Demonstração (22 Casas vs Robô)**: Versão compacta de avaliação rápida (3 corredores em zigue-zague com alta densidade de desafios, atalhos e bugs), projetada para que avaliadores experimentem todas as mecânicas do jogo contra a IA em 2 a 3 minutos.
- 🏠 **Menu Hub Inicial Completo**: Navegação centralizada com *Demonstração*, *Jogar Solo vs CPU*, *Multiplayer Online*, *Como Jogar*, *Histórico & Stats* e *Meu Perfil*.
- 🔐 **Contas de Jogador (SHA-256) & Backup Portátil (`.json`)**: Crie múltiplos perfis protegidos por senha criptografada (`Web Crypto API`), desbloqueie conquistas, escolha entre 5 avatares (🐍 Cyber Snake, 🤖 Bit Bot, 🦊 Algo Fox, 🦅 Binary Falcon e 🐱 Terminal Cat) e exporte/importe seu progresso em `.json` para jogar em qualquer dispositivo.
- 🧩 **Árvore Sintática (AST) Hierárquica de Blocos**:
  - **🔁 Loop `for` (`for i in range(N):`)**: Suporta aninhamento real (`for` dentro de `for` com variáveis `i, j, k, n` por escopo).
  - **🔀 Condicional `if`**: Avaliação em tempo real com *Live Badge* (`🟢 True` / `⚪ False`) para `dado % 2 == 0`, `dado % 2 != 0`, `oponente.a_frente` e `proxima_casa.tem_bug()`, concedendo **+1 passo bônus tático** quando verdadeira.
  - **➡️ Avançar (`player.avancar(N)`)**: Movimento padrão pela trilha.
  - **🦘 Pular (`player.pular(distancia=N)`)**: Salto acrobático que evita armadilhas (Bugs) na casa de pouso.
  - **🛡️ Escudo (`try: player.ativar_escudo() except BugTrapException: pass`)**: Blindagem que anula 100% o recuo do próximo Bug.
- 👁️ **Modo Espectador Duplo & Janela Flutuante Arrastável**: Durante o turno do oponente (CPU ou jogador online), acompanhe em tempo real a rolagem do dado, a montagem dos blocos, o código Python com *Syntax Highlighting* e veja o adversário analisando e respondendo às alternativas dos Desafios ao vivo!
- 🃏 **Cards de Desafios 3D Colecionáveis (45 Questões Balanceadas)**: Ao cair em casas de desafio, escolha entre 3 cartas holográficas categorizadas do catálogo (`🟢 Comum +2`, `🔵 Rara +4` e `🟣 Épica +6`), com **45 desafios reais de Python** (15 Fáceis, 15 Médios e 15 Difíceis) e sorteio inteligente sem repetição na partida.
- ⚡ **Multiplayer Serverless P2P (Partida Rápida + Salas `PY-XXXX`)**: Duelos síncronos em tempo real via **WebRTC DataChannel (PeerJS)** entre computadores diferentes e **BroadcastChannel** (`< 1ms`) entre abas locais — **100% compatível com GitHub Pages e sem necessidade de configurar banco de dados externo**.

---

## 🎯 Mecânicas Centrais do Jogo

1. **A Energia do Dado e a Compilação de Blocos:**
   - No início do turno, role o dado D6 para gerar sua **energia de passos**.
   - Arraste ou clique nos blocos da paleta para construir seu algoritmo (combinando loops `for`, condicionais `if`, avanços, pulos e escudos).
   - O compilador avalia recursivamente a árvore de blocos (`evaluateTree`), verifica se o total de passos bate com a energia do dado e traduz tudo para código Python PEP 8 com *Syntax Highlighting*.

2. **A Trilha em Zigue-Zague Descendente (64 Casas ou 22 Casas no Modo Demonstração):**
   - ⚡ **Atalhos (+3/+4 casas):** Impulsionam seu peão à frente.
   - 🐛 **Bugs (-3/-5 casas):** Provocam erro e recuo (anulados se você usar **Pular** ou tiver um **Escudo `try/except`** ativo!).
   - ❓ **Casas de Desafio:** Escolha uma carta 3D e resolva o problema de código Python no modo *Time Attack* (25s).
   - 🏆 **Meta (Casa 64 ou Casa 22 na Demo):** O primeiro a alcançar a casa final conquista o título de *Python Master*.

---

## 🏛️ Arquitetura do Projeto: Model-View-Controller (MVC)

O projeto é estruturado como uma **Single Page Application (SPA)** em **Vanilla JavaScript (ES Modules)**, pronta para hospedagem estática direta no **GitHub Pages**:

```
python-quest/
├── .gitignore                     # Regras de exclusão do Git
├── .nojekyll                      # Garante entrega direta dos módulos ES6 no GitHub Pages
├── index.html                     # Esqueleto semântico da SPA
├── README.md                      # Documentação completa
├── DESIGN.md                      # Especificação de Design System ("Kinetic Terminal")
├── desafios.json                  # Catálogo open-source com 45 questões Python (Fácil/Médio/Difícil)
├── css/
│   ├── styles.css                 # Design System, tabuleiro, janela arrastável e syntax highlighting
│   ├── blocks.css                 # Paleta e árvore hierárquica de blocos (for / if / ações)
│   ├── home.css                   # Menu Hub, abas de autenticação e modais
│   └── cards.css                  # Cards holográficos 3D de desafio
└── js/
    ├── app.js                     # Ponto de entrada e injeção de dependências
    ├── services/
    │   └── AuthService.js         # Cofre local de contas (SHA-256) e portabilidade JSON
    ├── models/
    │   ├── GameStateModel.js      # Estado reativo (posições, turnos, boosts, escudos)
    │   ├── BoardModel.js          # Mapeamento do zigue-zague (64 casas padrão / 22 casas Demo)
    │   ├── DiceModel.js           # Matemática do dado D6 e bônus
    │   ├── BlockProgramModel.js   # AST hierárquica de blocos, avaliador e gerador Python
    │   ├── BotModel.js            # IA da CPU (detecção de bugs, loops e desafios)
    │   ├── ChallengeModel.js      # Catálogo e validação de respostas
    │   ├── UserProfileModel.js    # Perfil, conquistas, streaks e backup JSON
    │   └── OnlineMultiplayerModel.js # Matchmaking P2P (WebRTC PeerJS + BroadcastChannel)
    ├── views/
    │   ├── HomeView.js            # Renderização do Menu Hub, Login/Cadastro e Lobby P2P
    │   ├── BoardView.js           # Tabuleiro, peões, câmera e janela flutuante arrastável
    │   ├── DiceView.js            # Animação do dado 3D e medidor de energia
    │   ├── BlockWorkspaceView.js  # Workspace de blocos, Live Badge condicional e Python preview
    │   ├── ChallengeCardsView.js  # Apresentação dos 3 cards holográficos 3D
    │   ├── ChallengeModalView.js  # Modal interativo do desafio com cronômetro
    │   ├── StatusPanelView.js     # Placar, terminal de eventos e game over
    │   └── SoundView.js           # Síntese sonora procedural (Web Audio API)
    └── controllers/
        ├── GameController.js      # Orquestrador do fluxo da corrida Solo, Demo e Online
        ├── CodingController.js    # Validação da árvore de blocos vs energia do dado
        └── ChallengeController.js # Controle dos desafios e distribuição de recompensas
```

---

## 🌐 Como Publicar no GitHub Pages (Custo Zero & Zero Configuração)

Como o projeto não depende de banco de dados proprietário nem expõe chaves privadas de API, publicá-lo no **GitHub Pages** leva menos de 1 minuto:

1. Suba este repositório para o seu **GitHub**.
2. No repositório do GitHub, clique em **Settings** ➔ **Pages** (no menu lateral esquerdo).
3. Em **Build and deployment** ➔ **Source**, selecione **Deploy from a branch**.
4. Escolha a branch **`main`** (ou `master`), pasta **`/ (root)`** e clique em **Save**.
5. Aguarde alguns segundos e acesse a URL gerada (`https://seu-usuario.github.io/nome-do-repositorio/`)!
   - O modo **Solo vs CPU**, o **Multiplayer Online (Partida Rápida & Salas `PY-XXXX`)** via WebRTC P2P e o **Sistema de Contas com Backup JSON** já funcionarão automaticamente via HTTPS.

---

## 🚀 Como Executar o Projeto Localmente

Por utilizar **ES Modules** nativos do JavaScript, sirva os arquivos via servidor HTTP local:

### Opção 1: Usando Python
```bash
python -m http.server 8000
```
Acesse no navegador: `http://localhost:8000`

### Opção 2: Usando Node.js / npx
```bash
npx serve .
```

### Opção 3: Extensão Live Server (VS Code / Antigravity IDE)
Clique com o botão direito no arquivo `index.html` e selecione **"Open with Live Server"**.

> 💡 **Dica para testar o Multiplayer localmente:** Abra duas abas em `http://localhost:8000` e clique em **"⚡ Buscar Partida Rápida"** nas duas abas (ou crie uma sala `PY-XXXX` em uma aba e conecte na outra).

---

## 🐙 Como Contribuir com Novos Desafios (Open Source)

O catálogo de perguntas do jogo conta atualmente com **45 questões** (`py-001` a `py-045`) e pode ser expandido por qualquer desenvolvedor:

1. Faça um **Fork** deste repositório.
2. Abra o arquivo [`desafios.json`](./desafios.json) e adicione uma nova questão (`"dificuldade": "facil" | "medio" | "dificil"`):
   ```json
   {
     "id": "py-046",
     "categoria": "Compreensão de Conjuntos",
     "dificuldade": "medio",
     "pergunta": "Quantos elementos terá o conjunto resultante?",
     "codigo": "s = {x % 3 for x in range(6)}\nprint(len(s))",
     "opcoes": ["6", "3", "2", "1"],
     "resposta_correta": 1,
     "explicacao": "O operador % 3 gera apenas os restos 0, 1 e 2. Como conjuntos (sets) eliminam duplicatas, restam 3 elementos.",
     "autor": "@seu-usuario"
   }
   ```
3. Envie um **Pull Request (PR)** com suas alterações!
