/**
 * BlockProgramModel.js
 * Modelo de programação em blocos hierárquico com suporte a:
 * - Loops aninhados (for dentro de for)
 * - Comandos sequenciais (for + avançar)
 * - Posicionamento flexível via Drag & Drop ou ordenação direta
 * - Ações avançadas: Avançar(N), Pular(N), Escudo (try/except), Turbo(N)
 * - Avaliador recursivo de expressões e fórmulas matemáticas
 */
export class BlockProgramModel {
  constructor() {
    this.rootBlocks = [];
  }

  clear() {
    this.rootBlocks = [];
  }

  /**
   * Adiciona um bloco na raiz ou dentro de um loop pai.
   * @param {Object} blockData { type, value }
   * @param {string|null} parentId ID do loop pai (se aninhado)
   * @param {number} insertIndex Posição exata de inserção (-1 para o final)
   */
  addBlock(blockData, parentId = null, insertIndex = -1) {
    const isContainer = (blockData.type === 'loop_for' || blockData.type === 'conditional_if');
    const block = {
      id: blockData.id || `blk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: blockData.type || 'action_forward', // 'loop_for' | 'conditional_if' | 'action_forward' | 'action_jump' | 'action_shield'
      value: (blockData.type === 'action_shield' || blockData.type === 'conditional_if') 
        ? 0 
        : Math.max(1, Math.min(12, parseInt(blockData.value, 10) || (blockData.type === 'loop_for' ? 2 : 1))),
      condition: blockData.type === 'conditional_if' ? (blockData.condition || 'oponente_a_frente') : null,
      children: isContainer ? (blockData.children || []) : []
    };

    if (parentId) {
      const parent = this.findBlock(parentId);
      if (parent && (parent.type === 'loop_for' || parent.type === 'conditional_if')) {
        if (insertIndex >= 0 && insertIndex <= parent.children.length) {
          parent.children.splice(insertIndex, 0, block);
        } else {
          parent.children.push(block);
        }
        return block;
      }
    }

    if (insertIndex >= 0 && insertIndex <= this.rootBlocks.length) {
      this.rootBlocks.splice(insertIndex, 0, block);
    } else {
      this.rootBlocks.push(block);
    }

    return block;
  }

  /**
   * Remove um bloco pelo ID em qualquer nível da árvore.
   */
  removeBlock(id) {
    return this._removeRecursive(id, this.rootBlocks);
  }

  _removeRecursive(id, list) {
    const idx = list.findIndex(b => b.id === id);
    if (idx !== -1) {
      list.splice(idx, 1);
      return true;
    }
    for (const b of list) {
      if (b.children && b.children.length > 0) {
        if (this._removeRecursive(id, b.children)) return true;
      }
    }
    return false;
  }

  /**
   * Move um bloco para cima ou para baixo dentro de sua lista.
   */
  moveBlock(id, direction = 'up') {
    const parentList = this.findParentList(id);
    if (!parentList) return false;

    const idx = parentList.findIndex(b => b.id === id);
    if (idx === -1) return false;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= parentList.length) return false;

    const [moved] = parentList.splice(idx, 1);
    parentList.splice(targetIdx, 0, moved);
    return true;
  }

  /**
   * Atualiza a condição lógica de um bloco conditional_if.
   */
  updateBlockCondition(id, newCondition) {
    const block = this.findBlock(id);
    if (block && block.type === 'conditional_if') {
      block.condition = newCondition;
      return block.condition;
    }
    return null;
  }

  /**
   * Atualiza o valor numérico (passos ou repetições do loop).
   */
  updateBlockValue(id, newValue) {
    const block = this.findBlock(id);
    if (block) {
      const parsed = Math.max(1, Math.min(12, parseInt(newValue, 10) || 1));
      block.value = parsed;
      return parsed;
    }
    return null;
  }

  /**
   * Busca um bloco por ID recursivamente.
   */
  findBlock(id, list = this.rootBlocks) {
    for (const b of list) {
      if (b.id === id) return b;
      if (b.children && b.children.length > 0) {
        const found = this.findBlock(id, b.children);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Encontra a lista (array) onde o bloco está contido.
   */
  findParentList(id, list = this.rootBlocks) {
    if (list.some(b => b.id === id)) return list;
    for (const b of list) {
      if (b.children && b.children.length > 0) {
        const found = this.findParentList(id, b.children);
        if (found) return found;
      }
    }
    return null;
  }

  /**
   * Avalia recursivamente a árvore e retorna o total de passos,
   * a lista de ações ativas e a representação matemática.
   */
  evaluateTree() {
    let totalSteps = 0;
    const actions = [];
    const formulas = [];

    for (const block of this.rootBlocks) {
      const res = this._evaluateNode(block);
      totalSteps += res.steps;
      actions.push(...res.actions);
      if (res.formula) formulas.push(res.formula);
    }

    const formulaString = formulas.length > 0 ? formulas.join(' + ') : '0';

    return {
      totalSteps,
      actions,
      formula: formulaString
    };
  }

  _evaluateNode(node) {
    if (node.type === 'action_forward') {
      const steps = node.value || 1;
      return {
        steps,
        actions: [{ actionKind: 'forward', steps }],
        formula: `${steps}`
      };
    }

    if (node.type === 'action_jump') {
      const steps = node.value || 1;
      return {
        steps,
        actions: [{ actionKind: 'jump', steps }],
        formula: `${steps} [pulo]`
      };
    }

    if (node.type === 'action_shield') {
      return {
        steps: 0,
        actions: [{ actionKind: 'shield', steps: 0 }],
        formula: `0 [escudo]`
      };
    }

    if (node.type === 'conditional_if') {
      let innerSteps = 0;
      const innerActions = [];
      const innerFormulas = [];

      for (const child of node.children) {
        const res = this._evaluateNode(child);
        innerSteps += res.steps;
        innerActions.push(...res.actions);
        if (res.formula) innerFormulas.push(res.formula);
      }

      const condLabels = {
        'oponente_a_frente': 'oponente na frente',
        'dado_par': 'dado par',
        'dado_impar': 'dado ímpar',
        'casa_com_bug': 'casa com bug'
      };
      const label = condLabels[node.condition] || 'se condição';
      const innerStr = innerFormulas.length > 0 ? `${innerFormulas.join(' + ')} (+1 bônus)` : '+1 bônus se True';

      return {
        steps: innerSteps,
        actions: [{ actionKind: 'conditional', condition: node.condition, steps: innerSteps }, ...innerActions],
        formula: `[if ${label}: ${innerStr}]`
      };
    }

    if (node.type === 'loop_for') {
      const times = node.value || 1;
      let innerSteps = 0;
      const innerActions = [];
      const innerFormulas = [];

      for (const child of node.children) {
        const res = this._evaluateNode(child);
        innerSteps += res.steps;
        innerActions.push(...res.actions);
        if (res.formula) innerFormulas.push(res.formula);
      }

      const total = times * innerSteps;
      const multipliedActions = [];
      for (let i = 0; i < times; i++) {
        multipliedActions.push(...innerActions);
      }

      const innerStr = innerFormulas.length > 1
        ? `(${innerFormulas.join(' + ')})`
        : (innerFormulas[0] || '0');

      return {
        steps: total,
        actions: multipliedActions,
        formula: `(${times} × ${innerStr})`
      };
    }

    return { steps: 0, actions: [], formula: '0' };
  }

  evaluate() {
    return this.evaluateTree().totalSteps;
  }

  /**
   * Converte a árvore de blocos para código Python idiomático com indentação PEP 8.
   */
  toPythonCode() {
    if (this.rootBlocks.length === 0) {
      return '# Arraste ou clique nos blocos da paleta para montar seu código!\n# Ex: for i in range(2):\n#         player.avancar(5)';
    }

    return this._generatePythonRecursive(this.rootBlocks, 0);
  }

  _generatePythonRecursive(blocks, indentLevel) {
    const indent = '    '.repeat(indentLevel);
    const lines = [];

    const loopVars = ['i', 'j', 'k', 'n'];

    for (const b of blocks) {
      if (b.type === 'loop_for') {
        const varName = loopVars[indentLevel % loopVars.length];
        lines.push(`${indent}for ${varName} in range(${b.value}):`);
        if (!b.children || b.children.length === 0) {
          lines.push(`${indent}    pass  # adicione blocos dentro deste loop`);
        } else {
          lines.push(this._generatePythonRecursive(b.children, indentLevel + 1));
        }
      } else if (b.type === 'action_forward') {
        lines.push(`${indent}player.avancar(${b.value})`);
      } else if (b.type === 'action_jump') {
        lines.push(`${indent}player.pular(distancia=${b.value})`);
      } else if (b.type === 'action_shield') {
        lines.push(`${indent}try:\n${indent}    player.ativar_escudo()\n${indent}except BugTrapException:\n${indent}    pass`);
      } else if (b.type === 'conditional_if') {
        const condMap = {
          'dado_par': 'dado % 2 == 0',
          'dado_impar': 'dado % 2 != 0',
          'oponente_a_frente': 'oponente.a_frente',
          'casa_com_bug': 'proxima_casa.tem_bug()'
        };
        const condExpr = condMap[b.condition] || 'dado % 2 == 0';
        lines.push(`${indent}if ${condExpr}:`);
        if (!b.children || b.children.length === 0) {
          lines.push(`${indent}    player.passo_bonus()  # +1 passo extra concedido se True`);
        } else {
          lines.push(this._generatePythonRecursive(b.children, indentLevel + 1));
          lines.push(`${indent}    player.passo_bonus()  # +1 passo bônus tático`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Valida a árvore montada contra a energia do dado.
   */
  validateAgainstDice(diceTotal) {
    if (this.rootBlocks.length === 0) {
      return {
        valid: false,
        steps: 0,
        actions: [],
        message: 'Nenhum bloco montado! Adicione blocos de movimento ou loops.'
      };
    }

    const { totalSteps, actions, formula } = this.evaluateTree();
    const hasMovement = actions.some(a => a.actionKind !== 'shield');

    if (!hasMovement && actions.some(a => a.actionKind === 'shield')) {
      return {
        valid: false,
        steps: 0,
        actions,
        message: 'O Escudo foi programado, mas você também precisa programar o movimento com a energia do dado!'
      };
    }

    if (totalSteps === diceTotal) {
      return {
        valid: true,
        steps: totalSteps,
        actions,
        formula,
        message: `Excelente! Seu algoritmo computa exatamente ${totalSteps} passos (${formula} = ${totalSteps}). Compilação 200 OK!`
      };
    } else if (totalSteps > diceTotal) {
      return {
        valid: false,
        steps: totalSteps,
        actions,
        formula,
        message: `Energia excedida: seu algoritmo gera ${totalSteps} passos (${formula}), mas o dado requer exatamente ${diceTotal} passos!`
      };
    } else {
      return {
        valid: false,
        steps: totalSteps,
        actions,
        formula,
        message: `Passos insuficientes: seu algoritmo gera ${totalSteps} passos (${formula}), mas a energia requerida é de ${diceTotal} passos (faltam ${diceTotal - totalSteps})!`
      };
    }
  }

  // Compatibilidade com código legado se houver chamadas a blocks
  get blocks() {
    return this.rootBlocks;
  }
}
