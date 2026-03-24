/**
 * 属性测试：所有语言包完整性
 * Feature: quick-translate-shortcuts, Property 7: 语言包完整性
 *
 * 验证需求：4.3
 * 对于任意已支持的语言包（en、it、de、es、fr、pt、ru），
 * 其 messages.json 应包含 quickTranslate、restoreOriginal、autoTranslateLabel、shortcutHint
 * 四个新增键，且值不为空字符串。
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { describe, it } from 'vitest';
import * as fc from 'fast-check';

const __dirname = dirname(fileURLToPath(import.meta.url));

const LOCALES = ['en', 'it', 'de', 'es', 'fr', 'pt', 'ru'];
const REQUIRED_KEYS = ['quickTranslate', 'restoreOriginal', 'autoTranslateLabel', 'shortcutHint'];

function loadMessages(locale) {
  const filePath = join(__dirname, locale, 'messages.json');
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('属性 7：所有语言包完整性 - Validates: Requirements 4.3', () => {
  it('所有语言包均包含 4 个新增键且值非空', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...LOCALES),
        (locale) => {
          const messages = loadMessages(locale);

          for (const key of REQUIRED_KEYS) {
            // 键必须存在
            if (!(key in messages)) return false;
            // message 字段必须存在且非空
            const msg = messages[key].message;
            if (typeof msg !== 'string' || msg.trim() === '') return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
