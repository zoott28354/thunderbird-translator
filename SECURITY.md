# Security Policy

## Supported Versions

Currently supported versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 1.0.x   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### 1. **DO NOT** open a public issue

Security vulnerabilities should not be disclosed publicly until a fix is available.

### 2. Report privately

Please report security vulnerabilities by:
- **Email**: Create a private security advisory on GitHub
- **GitHub**: Use the "Security" tab > "Report a vulnerability" feature

### 3. Include in your report

- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)
- **Your contact information** for follow-up

### 4. Response timeline

- **Initial response**: Within 48 hours
- **Fix timeline**: Depends on severity
  - Critical: 1-7 days
  - High: 7-14 days
  - Medium: 14-30 days
  - Low: 30+ days

### 5. Disclosure policy

We follow **coordinated disclosure**:
1. We'll confirm the vulnerability
2. We'll develop and test a fix
3. We'll release a security update
4. We'll publish a security advisory
5. You'll be credited (if you wish)

## Security Best Practices

When using this addon:

### For Ollama Users (Local Translation)

✅ **Private by design**:
- All translation happens locally on your machine
- No data is sent to external servers
- Your emails remain on your device

⚠️ **Configuration**:
- Only set `OLLAMA_ORIGINS="*"` if you understand the implications
- For tighter security, use specific origins: `OLLAMA_ORIGINS="moz-extension://*"`
- Keep Ollama updated to the latest version

### For Google Translate / LibreTranslate Users (Online Translation)

⚠️ **Data transmission**:
- Email content is sent to external services
- Review the privacy policies of these services:
  - [Google Translate Privacy Policy](https://policies.google.com/privacy)
  - [LibreTranslate](https://libretranslate.com/) instances may have different policies

⚠️ **Sensitive information**:
- **DO NOT** translate emails containing:
  - Passwords or credentials
  - Credit card numbers
  - Social security numbers
  - Medical records
  - Confidential business information

### General Security

🔒 **Permissions**:
- This addon requests minimal permissions
- Review permissions before installation
- See `manifest.json` for full permission list

🔒 **Updates**:
- Keep the addon updated for security patches
- Check the [CHANGELOG.md](CHANGELOG.md) for security-related updates

🔒 **Source code**:
- This is open-source software
- Review the code before installation: [GitHub Repository](https://github.com/zoott28354/thunderbird-ollama-translator)
- Report any suspicious behavior

## Known Security Considerations

### Email Content Extraction

This addon extracts text from emails to translate them. This means:
- ✅ Text content is read from the DOM
- ✅ No access to email attachments
- ✅ No access to email headers (From, To, Subject)
- ✅ No persistent storage of email content
- ✅ Original text is only stored in memory (nodeMap) during active translation

### Network Requests

Depending on the service selected:
- **Ollama**: `http://localhost:11434` (local only)
- **Google Translate**: `https://translate.google.com` (HTTPS encrypted)
- **LibreTranslate**: Multiple instances (HTTPS encrypted)

### Storage

This addon stores:
- ✅ User preferences (service selection, model name, target language)
- ✅ Ollama URL configuration
- ❌ NO email content is stored persistently

All storage uses Thunderbird's `browser.storage.local` API.

## Questions?

For non-security questions, please:
- Open a public issue on GitHub
- Read the [CONTRIBUTING.md](CONTRIBUTING.md) guide

---

**Thank you for helping keep Thunderbird Ollama Translator secure!** 🔒
