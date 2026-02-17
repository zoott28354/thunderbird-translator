# Contributing to Thunderbird Ollama Translator

🇬🇧 English | 🇮🇹 [Italiano](CONTRIBUTING.it.md)

Thank you for your interest in contributing to Thunderbird Ollama Translator! 🎉

## How to Contribute

### Reporting Bugs 🐛

If you find a bug:

1. **Check existing issues** - Make sure it hasn't been reported already
2. **Open a new issue** with:
   - **Clear title** - Describe the problem briefly
   - **Steps to reproduce** - How to trigger the bug
   - **Expected behavior** - What should happen
   - **Actual behavior** - What actually happens
   - **Console logs** - Open Thunderbird console (Ctrl+Shift+I) and copy relevant `[Translator]` messages
   - **Environment**:
     - Thunderbird version
     - Operating System
     - Ollama version (if using Ollama)
     - Model used (if using Ollama)

### Suggesting Features 💡

Have an idea to improve the addon?

1. **Check existing issues** - Maybe someone suggested it already
2. **Open a new issue** with:
   - **Clear title** - Describe the feature
   - **Use case** - Why is this useful?
   - **Proposed solution** - How would it work?

### Code Contributions 🔧

Want to fix a bug or implement a feature?

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/thunderbird-ollama-translator.git
   cd thunderbird-ollama-translator
   ```
3. **Create a branch**:
   ```bash
   git checkout -b fix/my-bug-fix
   # or
   git checkout -b feature/my-new-feature
   ```
4. **Make your changes**
5. **Test thoroughly**:
   - Test with HTML emails
   - Test with plain text emails
   - Test with different languages
   - Test "Show Original" functionality
   - Check console for errors
6. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Fix: Description of your fix"
   # or
   git commit -m "Feature: Description of your feature"
   ```
7. **Push to your fork**:
   ```bash
   git push origin fix/my-bug-fix
   ```
8. **Open a Pull Request** on GitHub

### Code Style Guidelines

- **Use vanilla JavaScript** - No frameworks/libraries
- **Comment complex logic** - Explain "why", not "what"
- **Use meaningful variable names**
- **Follow existing patterns** - Look at how similar code is written
- **Keep functions focused** - One function, one responsibility
- **Add console.log for debugging** - Use `[Translator]` prefix for consistency

### Development Setup

1. **Install Thunderbird** (version 128+)
2. **Enable debugging**:
   - Open Thunderbird
   - `Tools > Developer Tools > Debug Add-ons`
   - Click "Load Temporary Add-on"
   - Select `manifest.json` from your local repository
3. **Make changes** to the code
4. **Reload the addon**:
   - In Debug Add-ons page, click "Reload"
5. **Test** by translating emails

### File Structure

```
thunderbird-ollama-translator/
├── background.js           # Menu creation, API calls, port communication
├── content/
│   └── translator.js       # Text extraction, DOM manipulation, translation logic
├── options/
│   ├── options.html        # Settings UI
│   └── options.js          # Settings logic
├── _locales/               # Translations for the addon UI
│   ├── en/messages.json
│   ├── it/messages.json
│   └── ...
├── icons/                  # Addon icons
├── manifest.json           # Thunderbird addon manifest
├── README.md               # User documentation
├── DEVELOPMENT.md          # Technical documentation
└── LICENSE                 # MIT License

```

### Key Code Locations

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed technical documentation, including:
- Architecture overview
- Translation strategies (hybrid: HTML blocks vs plain text nodes)
- Recent fixes and their explanations
- Testing checklist

### Translation Contributions 🌍

Want to add support for a new language in the addon UI?

1. **Copy** `_locales/en/messages.json` to `_locales/YOUR_LANG/messages.json`
   - Use ISO 639-1 language codes (e.g., `ja` for Japanese, `zh` for Chinese)
2. **Translate** all message strings
3. **Update** `manifest.json` to include your language in `default_locale` (if needed)
4. **Test** by changing Thunderbird's language to your new language
5. **Submit a Pull Request**

### Questions?

Feel free to:
- **Open an issue** for questions
- **Read** [DEVELOPMENT.md](DEVELOPMENT.md) for technical details
- **Check** existing issues for similar questions

## Code of Conduct

- **Be respectful** - Treat everyone with kindness
- **Be constructive** - Provide helpful feedback
- **Be patient** - We're all learning
- **Be inclusive** - Everyone is welcome

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🙏
