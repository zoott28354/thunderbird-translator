# Changelog

All notable changes to Thunderbird Ollama Translator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-17

### Added
- **Multiple translation services**: Ollama (local), Google Translate (online), LibreTranslate (online)
- **Separate context menus per service**: 3 parent menus (Ollama, Google, LibreTranslate)
- **Per-service language preference**: Each service remembers its own target language
- **Bold highlighting**: Selected language shown in bold in context menu
- **7 UI languages**: Italian, English, German, French, Spanish, Portuguese, Russian
- **10 target languages**: IT, EN, ES, FR, DE, PT, RU, JA, ZH, KO
- **Multi-instance fallback** for LibreTranslate (fedilab.app → libretranslate.com → argosopentech.com)

### Fixed
- **Plain text email detection** (commit 9086524 / eb41d79)
  - Fixed translation of `Content-Type: text/plain` emails (e.g., GitHub notifications)
  - Implemented hybrid strategy: PRE blocks use node-by-node, HTML blocks use block translation
  - Removed PRE from SKIP_TAGS, added to BLOCK_TAGS

- **Link translation interference** (commit 3402f89 / 6ec704f)
  - Fixed URLs being sent to Ollama causing garbled output
  - Added skip logic for nodes with parent `<A>` or matching URL regex

- **Menu i18n API** (commit 64b2e34 / ba62dd9)
  - Fixed "Show Original" menu showing garbled characters
  - Changed `browser.i18n` → `messenger.i18n` for Thunderbird compatibility

- **Show Original functionality** (commit 9cd60fa / 010d5a0)
  - Fixed "Show Original" showing raw MIME headers instead of formatted email
  - Replaced `location.reload()` with direct nodeMap restoration
  - Now instant, preserves scroll position, preserves layout

- **Verbose logging cleanup** (commit 7d6435e / 4d0fad0)
  - Removed diagnostic logging for cleaner console output
  - Kept essential operation logs for debugging

- **CORS permissions** for external services (Google Translate, LibreTranslate)
- **Multiple translations preservation**: NodeMap always uses original text for successive translations
- **Google Translate parsing**: Concatenates multiple segments correctly

### Changed
- **Default model**: Changed to `translategemma` (optimized for translation)
- **Context menu structure**: Separated by service instead of mixed languages
- **Storage schema**: Per-service language preferences (ollamaTargetLang, googleTargetLang, libreTargetLang)

## [1.0.0] - 2026-02-14

### Added
- Initial release
- **Ollama integration** for local, private translation
- **Single language support** (Italian only)
- **Context menu** in Thunderbird email view
- **Floating translate button**
- **Toggle** between original and translated text
- **Toast notifications**
- **Settings page** with:
  - Ollama URL configuration
  - Model selection
  - Connection test
- **NodeMap preservation** for original text storage
- **Block-based translation** for better context
- **Port-based communication** between content script and background

### Technical
- Manifest v2 (required for Thunderbird 128)
- Dynamic content script injection
- TreeWalker for text extraction
- Persistent storage for settings

---

## Release Notes

### v2.0.0 - Major Update

This release focuses on **multi-service support**, **internationalization**, and **critical bug fixes** for plain text emails and menu functionality.

**Highlights**:
- 🌐 Choose between 3 translation services (Ollama, Google, LibreTranslate)
- 🇬🇧🇮🇹🇩🇪🇫🇷🇪🇸🇵🇹🇷🇺 UI available in 7 languages
- 📧 Plain text emails (GitHub notifications, etc.) now translate correctly
- 🔗 Links no longer interfere with translation
- ⚡ "Show Original" is now instant and preserves layout
- 🎯 Each service remembers its own preferred language

**Breaking Changes**: None - settings from v1.0.0 will be preserved

**Migration**: Existing Ollama settings will continue to work. New service options (Google, LibreTranslate) are available in the settings page.

### v1.0.0 - Initial Release

First stable release with Ollama support and Italian translation.

---

For detailed technical information about fixes, see [DEVELOPMENT.md](DEVELOPMENT.md).
