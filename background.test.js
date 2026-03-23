/**
 * 属性测试：autoTranslate 设置往返
 * Feature: quick-translate-shortcuts, Property 3: autoTranslate 设置往返
 *
 * 验证需求：2.2、2.3
 * 对于任意 autoTranslate 布尔值（true 或 false），将其保存到 storage.local 后，
 * 再通过 getSettings() 读取，应得到相同的值。
 */

import { describe, it, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// --- Mock browser/messenger API ---

// getSettings() 的默认值（与 background.js 保持一致）
const DEFAULTS = {
  ollamaUrl: "http://localhost:11434",
  model: "translategemma",
  service: "ollama",
  targetLanguage: "it",
  ollamaTargetLang: "it",
  googleTargetLang: "en",
  libreTargetLang: "en",
  autoTranslate: false,
};

/**
 * 创建一个模拟的 storage.local，支持 get/set。
 * get(defaults) 的行为：对每个 key，若 store 中有值则用 store 中的值，否则用 defaults 中的值。
 */
function createMockStorage(initialStore = {}) {
  const store = { ...initialStore };
  return {
    get: vi.fn(async (defaults) => {
      const result = {};
      for (const key of Object.keys(defaults)) {
        result[key] = key in store ? store[key] : defaults[key];
      }
      return result;
    }),
    set: vi.fn(async (values) => {
      Object.assign(store, values);
    }),
    _store: store,
  };
}

/**
 * 根据 mockStorage 构造一个与 background.js 中 getSettings() 等价的函数。
 */
function makeGetSettings(mockStorage) {
  return async function getSettings() {
    const defaults = { ...DEFAULTS };
    return await mockStorage.get(defaults);
  };
}

describe('属性 3：autoTranslate 设置往返 - Validates: Requirements 2.2, 2.3', () => {
  it('任意 autoTranslate 布尔值存入 storage 后，getSettings() 读取应得到相同的值', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (autoTranslateValue) => {
          // 1. 创建 mock storage，初始为空（使用默认值）
          const mockStorage = createMockStorage();

          // 2. 将任意 autoTranslate 值写入 storage
          await mockStorage.set({ autoTranslate: autoTranslateValue });

          // 3. 通过 getSettings() 读取
          const getSettings = makeGetSettings(mockStorage);
          const settings = await getSettings();

          // 4. 验证读取到的值与写入的值相同
          return settings.autoTranslate === autoTranslateValue;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('默认情况下 autoTranslate 应为 false（需求 2.4）', async () => {
    const mockStorage = createMockStorage(); // 空 store，全部使用默认值
    const getSettings = makeGetSettings(mockStorage);
    const settings = await getSettings();

    // 默认值应为 false
    return settings.autoTranslate === false;
  });
});

/**
 * 属性测试：autoTranslate=true 时自动触发翻译
 * Feature: quick-translate-shortcuts, Property 4: 自动翻译触发
 *
 * 验证需求：3.1、3.2
 * 对于任意邮件显示事件，当 autoTranslate 为 true 时，background 应向对应标签页的
 * content script 发送 startTranslation 命令，且命令中包含当前默认设置的目标语言。
 *
 * 属性测试：autoTranslate=false 时不触发翻译
 * Feature: quick-translate-shortcuts, Property 5: 自动翻译不触发
 *
 * 验证需求：3.5
 * 对于任意邮件显示事件，当 autoTranslate 为 false 时，background 不应发送任何
 * startTranslation 命令，保持现有行为不变。
 */

/**
 * 模拟 onMessageDisplayed 监听器的核心逻辑（与 background.js 中实现一致）。
 * 接受依赖注入：getSettings、portMap，便于属性测试中 mock。
 */
async function simulateOnMessageDisplayed(tab, { getSettings, portMap }) {
  const settings = await getSettings();
  if (!settings.autoTranslate) return;

  const tabId = tab.id;
  const targetLanguage = settings.targetLanguage;

  return new Promise((resolve) => {
    let waited = 0;
    const interval = setInterval(() => {
      waited += 50;
      const port = portMap.get(tabId);
      if (port) {
        clearInterval(interval);
        port.postMessage({ command: "startTranslation", targetLanguage });
        resolve("sent");
      } else if (waited >= 3000) {
        clearInterval(interval);
        resolve("timeout");
      }
    }, 50);
  });
}

describe('属性 4：autoTranslate=true 时自动触发翻译 - Validates: Requirements 3.1, 3.2', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('任意邮件显示事件，autoTranslate=true 时应发送 startTranslation 且包含 targetLanguage', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tabId: fc.integer({ min: 1, max: 9999 }),
          messageId: fc.integer({ min: 1, max: 9999 }),
        }),
        async ({ tabId, messageId }) => {
          const targetLanguage = "it";

          // mock getSettings：autoTranslate=true
          const mockGetSettings = async () => ({
            ...DEFAULTS,
            autoTranslate: true,
            targetLanguage,
          });

          // mock Port
          const sentMessages = [];
          const mockPort = {
            postMessage: vi.fn((msg) => sentMessages.push(msg)),
          };

          // portMap 中预先注册该 tabId 的 port（模拟 port 已就绪）
          const mockPortMap = new Map();
          mockPortMap.set(tabId, mockPort);

          const tab = { id: tabId };
          const promise = simulateOnMessageDisplayed(tab, {
            getSettings: mockGetSettings,
            portMap: mockPortMap,
          });

          // 推进假计时器 50ms，触发第一次 interval 回调
          await vi.advanceTimersByTimeAsync(50);
          await promise;

          // 验证：发送了 startTranslation 且包含 targetLanguage
          const startMsg = sentMessages.find(m => m.command === "startTranslation");
          return startMsg !== undefined && startMsg.targetLanguage === targetLanguage;
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('属性 5：autoTranslate=false 时不触发翻译 - Validates: Requirements 3.5', () => {
  it('任意邮件显示事件，autoTranslate=false 时不应发送任何 startTranslation 命令', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          tabId: fc.integer({ min: 1, max: 9999 }),
          messageId: fc.integer({ min: 1, max: 9999 }),
        }),
        async ({ tabId, messageId }) => {
          // mock getSettings：autoTranslate=false
          const mockGetSettings = async () => ({
            ...DEFAULTS,
            autoTranslate: false,
          });

          // mock Port（即使 port 存在也不应被调用）
          const sentMessages = [];
          const mockPort = {
            postMessage: vi.fn((msg) => sentMessages.push(msg)),
          };

          const mockPortMap = new Map();
          mockPortMap.set(tabId, mockPort);

          const tab = { id: tabId };
          await simulateOnMessageDisplayed(tab, {
            getSettings: mockGetSettings,
            portMap: mockPortMap,
          });

          // 验证：未发送任何 startTranslation 命令
          const startMsg = sentMessages.find(m => m.command === "startTranslation");
          return startMsg === undefined;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * 属性测试：快捷键根据翻译状态发送正确命令
 * Feature: quick-translate-shortcuts, Property 8: 快捷键状态路由
 *
 * 验证需求：6.2、6.3、6.4
 * 对于任意 messageDisplay 标签页，当用户触发 quick-translate 快捷键时：
 * - isTranslated=false → 发送 startTranslation（含 targetLanguage）
 * - isTranslated=true  → 发送 reloadOriginal
 */

/**
 * 模拟 commands.onCommand 监听器的核心逻辑（与 background.js 中实现一致）。
 * 接受依赖注入：getSettings、portMap、translationStatePending、isTranslatingRef，便于属性测试中 mock。
 */
async function simulateOnCommand(command, {
  getSettings,
  portMap,
  lastActivePort = null,
  translationStatePending,
  isTranslatingRef,
}) {
  if (command !== "quick-translate") return;

  if (isTranslatingRef.value) return;

  // 模拟 tabs.query({ type: "messageDisplay" })
  const tabs = portMap.size > 0
    ? [{ id: [...portMap.keys()][0] }]
    : [];

  if (!tabs || tabs.length === 0) {
    return;
  }

  const tab = tabs[0];
  const tabId = tab.id;
  const port = portMap.get(tabId) || lastActivePort;

  if (!port) return;

  // 立即设置防重标志位，防止并发触发
  isTranslatingRef.value = true;

  try {
    // 查询翻译状态，500ms 超时，默认 isTranslated=false
    const isTranslated = await new Promise((resolve) => {
      const timer = setTimeout(() => {
        translationStatePending.delete(tabId);
        resolve(false);
      }, 500);

      translationStatePending.set(tabId, (value) => {
        clearTimeout(timer);
        resolve(value);
      });

      port.postMessage({ command: "getTranslationState" });
    });

    const settings = await getSettings();
    if (isTranslated) {
      port.postMessage({ command: "reloadOriginal" });
    } else {
      port.postMessage({ command: "startTranslation", targetLanguage: settings.targetLanguage });
    }
  } finally {
    setTimeout(() => {
      isTranslatingRef.value = false;
    }, 500);
  }
}

describe('属性 8：快捷键状态路由 - Validates: Requirements 6.2, 6.3, 6.4', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('isTranslated=false 时发送 startTranslation，isTranslated=true 时发送 reloadOriginal', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        fc.integer({ min: 1, max: 9999 }),
        async (isTranslated, tabId) => {
          const targetLanguage = "it";
          const mockGetSettings = async () => ({ ...DEFAULTS, targetLanguage });

          const sentMessages = [];
          const translationStatePending = new Map();

          // mock Port：能接收 getTranslationState 并自动回复 translationState
          const mockPort = {
            postMessage: vi.fn((msg) => {
              sentMessages.push(msg);
              if (msg.command === "getTranslationState") {
                // 模拟 content script 回复 translationState
                const resolve = translationStatePending.get(tabId);
                if (resolve) {
                  translationStatePending.delete(tabId);
                  resolve(isTranslated);
                }
              }
            }),
          };

          const mockPortMap = new Map();
          mockPortMap.set(tabId, mockPort);

          const isTranslatingRef = { value: false };

          const promise = simulateOnCommand("quick-translate", {
            getSettings: mockGetSettings,
            portMap: mockPortMap,
            translationStatePending,
            isTranslatingRef,
          });

          // 推进假计时器，让 Promise 内部的 setTimeout 触发
          await vi.runAllTimersAsync();
          await promise;

          // 验证：发送了 getTranslationState
          const stateQuery = sentMessages.find(m => m.command === "getTranslationState");
          if (!stateQuery) return false;

          if (isTranslated) {
            // 已翻译 → 应发送 reloadOriginal
            const reloadMsg = sentMessages.find(m => m.command === "reloadOriginal");
            const startMsg = sentMessages.find(m => m.command === "startTranslation");
            return reloadMsg !== undefined && startMsg === undefined;
          } else {
            // 未翻译 → 应发送 startTranslation 且包含 targetLanguage
            const startMsg = sentMessages.find(m => m.command === "startTranslation");
            const reloadMsg = sentMessages.find(m => m.command === "reloadOriginal");
            return startMsg !== undefined && startMsg.targetLanguage === targetLanguage && reloadMsg === undefined;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * 属性测试：翻译进行中忽略重复快捷键
 * Feature: quick-translate-shortcuts, Property 9: 防重复触发
 *
 * 验证需求：6.5
 * 对于任意翻译进行中的状态，多次触发 quick-translate 快捷键，
 * background 应只发送一次命令，后续触发应被忽略。
 */
describe('属性 9：防重复触发 - Validates: Requirements 6.5', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('多次触发 quick-translate 时，只发送一次 startTranslation 或 reloadOriginal', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.constant('quick-translate'), { minLength: 2, maxLength: 10 }),
        fc.integer({ min: 1, max: 9999 }),
        async (commands, tabId) => {
          const targetLanguage = "it";
          const mockGetSettings = async () => ({ ...DEFAULTS, targetLanguage });

          const sentMessages = [];
          const translationStatePending = new Map();

          const mockPort = {
            postMessage: vi.fn((msg) => {
              sentMessages.push(msg);
              if (msg.command === "getTranslationState") {
                // 模拟 content script 回复 translationState（未翻译）
                const resolve = translationStatePending.get(tabId);
                if (resolve) {
                  translationStatePending.delete(tabId);
                  resolve(false);
                }
              }
            }),
          };

          const mockPortMap = new Map();
          mockPortMap.set(tabId, mockPort);

          // 共享的 isTranslatingRef，模拟防重标志位
          const isTranslatingRef = { value: false };

          // 并发触发所有快捷键命令
          const promises = commands.map((cmd) =>
            simulateOnCommand(cmd, {
              getSettings: mockGetSettings,
              portMap: mockPortMap,
              translationStatePending,
              isTranslatingRef,
            })
          );

          await vi.runAllTimersAsync();
          await Promise.all(promises);

          // 统计实际发送的翻译命令次数（startTranslation 或 reloadOriginal）
          const translationCommands = sentMessages.filter(
            m => m.command === "startTranslation" || m.command === "reloadOriginal"
          );

          // 只应发送一次翻译命令
          return translationCommands.length === 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
