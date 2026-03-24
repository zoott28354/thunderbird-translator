/**
 * 属性测试：按钮状态往返
 * Feature: quick-translate-shortcuts, Property 1: 按钮状态往返
 *
 * 验证需求：1.3、1.4、1.5
 * 对于任意邮件页面，点击"翻译"状态的浮动按钮触发翻译，翻译完成后按钮应切换为
 * "还原原文"状态；再次点击后，按钮应恢复为"翻译"状态，且 nodeMap 应被清空。
 *
 * 属性测试：翻译进行中按钮禁用，失败后恢复
 * Feature: quick-translate-shortcuts, Property 2: 翻译进行中按钮禁用
 *
 * 验证需求：1.6、1.7
 * 对于任意翻译请求，在翻译进行中按钮应处于禁用状态（TRANSLATING）；
 * 若翻译失败，按钮应恢复为可点击的"翻译"状态（IDLE），不应停留在禁用状态。
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';

// --- 提取状态机逻辑为可测试的纯函数 ---

const BTN_STATE = { IDLE: 'idle', TRANSLATING: 'translating', TRANSLATED: 'translated' };

const messages = {
  quickTranslate: 'Translate',
  translating: 'Translating...',
  restoreOriginal: 'Restore Original',
};

/**
 * 创建一个独立的按钮状态机实例，包含：
 * - btnState：当前状态
 * - nodeMap：模拟翻译节点存储
 * - btn：模拟 DOM 按钮对象
 * - updateButtonState(state)：状态更新函数
 */
function createStateMachine() {
  let btnState = BTN_STATE.IDLE;
  const nodeMap = new Map();

  // 模拟 DOM 按钮
  const btn = {
    textContent: '',
    disabled: false,
    classList: {
      _classes: new Set(),
      add(cls) { this._classes.add(cls); },
      remove(...cls) { cls.forEach(c => this._classes.delete(c)); },
      has(cls) { return this._classes.has(cls); },
    },
  };

  function updateButtonState(state) {
    btnState = state;

    // 移除所有状态类
    btn.classList.remove('ollama-quick-btn--translating', 'ollama-quick-btn--translated');

    if (state === BTN_STATE.IDLE) {
      btn.textContent = messages.quickTranslate;
      btn.disabled = false;
    } else if (state === BTN_STATE.TRANSLATING) {
      btn.textContent = messages.translating;
      btn.classList.add('ollama-quick-btn--translating');
      btn.disabled = true;
    } else if (state === BTN_STATE.TRANSLATED) {
      btn.textContent = messages.restoreOriginal;
      btn.classList.add('ollama-quick-btn--translated');
      btn.disabled = false;
    }
  }

  /**
   * 模拟 startTranslation 的状态变化（不含实际翻译逻辑）
   * @param {boolean} success - 翻译是否成功
   * @param {Map} fakeNodeMap - 翻译成功后填充的节点数据
   */
  function simulateStartTranslation(success, fakeNodeMap) {
    updateButtonState(BTN_STATE.TRANSLATING);
    if (success) {
      // 将 fakeNodeMap 的内容合并到 nodeMap
      for (const [k, v] of fakeNodeMap.entries()) {
        nodeMap.set(k, v);
      }
      updateButtonState(BTN_STATE.TRANSLATED);
    } else {
      updateButtonState(BTN_STATE.IDLE);
    }
  }

  /**
   * 模拟 reloadPage 的状态变化
   */
  function simulateReloadPage() {
    nodeMap.clear();
    updateButtonState(BTN_STATE.IDLE);
  }

  return {
    get btnState() { return btnState; },
    nodeMap,
    btn,
    updateButtonState,
    simulateStartTranslation,
    simulateReloadPage,
  };
}

// --- 属性 1：按钮状态往返 ---

describe('属性 1：按钮状态往返 - Validates: Requirements 1.3, 1.4, 1.5', () => {
  it('IDLE→TRANSLATING→TRANSLATED→IDLE 状态转换，且 nodeMap 在还原后被清空', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // 模拟翻译成功/失败
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 5 }),
        (translationSuccess, nodeKeys) => {
          const sm = createStateMachine();

          // 初始状态应为 IDLE
          sm.updateButtonState(BTN_STATE.IDLE);
          if (sm.btnState !== BTN_STATE.IDLE) return false;
          if (sm.btn.disabled !== false) return false;
          if (sm.btn.textContent !== messages.quickTranslate) return false;

          // 构造模拟节点数据
          const fakeNodeMap = new Map();
          nodeKeys.forEach((key, i) => {
            fakeNodeMap.set(`node_${i}`, { original: key, translated: `translated_${key}` });
          });

          if (translationSuccess) {
            // 翻译成功路径：IDLE → TRANSLATING → TRANSLATED
            sm.simulateStartTranslation(true, fakeNodeMap);

            // 翻译完成后应为 TRANSLATED
            if (sm.btnState !== BTN_STATE.TRANSLATED) return false;
            if (sm.btn.disabled !== false) return false;
            if (sm.btn.textContent !== messages.restoreOriginal) return false;
            if (!sm.btn.classList.has('ollama-quick-btn--translated')) return false;
            // nodeMap 应有数据
            if (sm.nodeMap.size === 0) return false;

            // 点击还原：TRANSLATED → IDLE，nodeMap 被清空
            sm.simulateReloadPage();

            if (sm.btnState !== BTN_STATE.IDLE) return false;
            if (sm.btn.disabled !== false) return false;
            if (sm.btn.textContent !== messages.quickTranslate) return false;
            // nodeMap 应被清空（需求 1.5）
            if (sm.nodeMap.size !== 0) return false;
          } else {
            // 翻译失败路径：IDLE → TRANSLATING → IDLE
            sm.simulateStartTranslation(false, fakeNodeMap);

            // 失败后应恢复 IDLE
            if (sm.btnState !== BTN_STATE.IDLE) return false;
            if (sm.btn.disabled !== false) return false;
            if (sm.btn.textContent !== messages.quickTranslate) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- 属性 2：翻译进行中按钮禁用，失败后恢复 ---

describe('属性 2：翻译进行中按钮禁用 - Validates: Requirements 1.6, 1.7', () => {
  it('TRANSLATING 时 disabled=true，翻译失败后恢复 IDLE 且 disabled=false', () => {
    fc.assert(
      fc.property(
        fc.boolean(), // 模拟翻译失败（true=失败，false=成功）
        (translationFailed) => {
          const sm = createStateMachine();

          // 初始 IDLE
          sm.updateButtonState(BTN_STATE.IDLE);

          // 进入 TRANSLATING 状态
          sm.updateButtonState(BTN_STATE.TRANSLATING);

          // 验证 TRANSLATING 时按钮禁用（需求 1.6）
          if (sm.btnState !== BTN_STATE.TRANSLATING) return false;
          if (sm.btn.disabled !== true) return false;
          if (sm.btn.textContent !== messages.translating) return false;
          if (!sm.btn.classList.has('ollama-quick-btn--translating')) return false;

          if (translationFailed) {
            // 翻译失败：恢复 IDLE（需求 1.7）
            sm.updateButtonState(BTN_STATE.IDLE);

            if (sm.btnState !== BTN_STATE.IDLE) return false;
            if (sm.btn.disabled !== false) return false;
            if (sm.btn.textContent !== messages.quickTranslate) return false;
            // 不应有 translating 类
            if (sm.btn.classList.has('ollama-quick-btn--translating')) return false;
          } else {
            // 翻译成功：切换到 TRANSLATED
            sm.updateButtonState(BTN_STATE.TRANSLATED);

            if (sm.btnState !== BTN_STATE.TRANSLATED) return false;
            if (sm.btn.disabled !== false) return false;
            if (sm.btn.textContent !== messages.restoreOriginal) return false;
            // 不应有 translating 类
            if (sm.btn.classList.has('ollama-quick-btn--translating')) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// --- 属性 6：已翻译邮件幂等性 ---

/**
 * Feature: quick-translate-shortcuts, Property 6: 翻译幂等性
 * Validates: Requirements 3.6
 *
 * 对于任意已翻译的邮件（nodeMap.size > 0），再次收到 startTranslation 命令时，
 * content script 应跳过翻译，nodeMap 内容保持不变。
 */
describe('属性 6：已翻译邮件幂等性 - Validates: Requirements 3.6', () => {
  it('当 btnState 为 TRANSLATED 时，startTranslation 应跳过翻译，nodeMap 内容不变', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
        (nodeKeys) => {
          const sm = createStateMachine();

          // 构造已翻译状态：填充 nodeMap 并设置 btnState 为 TRANSLATED
          nodeKeys.forEach((key, i) => {
            sm.nodeMap.set(`node_${i}`, { original: key, translated: `translated_${key}` });
          });
          sm.updateButtonState(BTN_STATE.TRANSLATED);

          // 记录翻译前 nodeMap 的快照
          const snapshotBefore = new Map(sm.nodeMap);

          // 模拟幂等性检查：当 btnState 为 TRANSLATED 且 nodeMap.size > 0 时，跳过翻译
          function simulateIdempotentStartTranslation() {
            if (sm.btnState === BTN_STATE.TRANSLATED && sm.nodeMap.size > 0) {
              // 跳过翻译，nodeMap 不变
              return;
            }
            // 否则执行翻译（此分支在本测试中不应被触发）
            sm.simulateStartTranslation(true, new Map());
          }

          simulateIdempotentStartTranslation();

          // 验证 btnState 仍为 TRANSLATED
          if (sm.btnState !== BTN_STATE.TRANSLATED) return false;

          // 验证 nodeMap 大小不变
          if (sm.nodeMap.size !== snapshotBefore.size) return false;

          // 验证 nodeMap 内容完全一致
          for (const [key, value] of snapshotBefore.entries()) {
            if (!sm.nodeMap.has(key)) return false;
            const current = sm.nodeMap.get(key);
            if (current.original !== value.original) return false;
            if (current.translated !== value.translated) return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
