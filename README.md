# Thunderbird Translator
**(Local Ollama · Google Translate · LibreTranslate)**

<p align="center">
  <img src="preview.png" alt="Thunderbird Translator Preview" width="600">
</p>

---

A Thunderbird addon that replaces the email body with its translation (in-place) into multiple languages using Ollama local, Google Translate, or LibreTranslate (Euro-friendly).

## ✨ Features

- 🏠 **Local translation** - With Ollama: no data sent online, everything stays on your PC
- 🤖 **Supports all Ollama models** - Translategemma, Llama, Mistral, Neural Chat, etc.
- 🌐 **Multiple translation services** - Ollama, Google Translate, LibreTranslate
- 🌍 **Multi-language translation** - Supports 10 languages: Italian, English, Spanish, French, German, Portuguese, Russian, Japanese, Chinese, Korean
- 🖱️ **Simple interface** - Right-click on email and choose service and language
- 💾 **Persistent settings** - Your configurations are saved automatically
- 🌐 **Multilingual interface** - The addon is available in 7 languages: 🇮🇹 Italian, 🇬🇧 English, 🇩🇪 German, 🇫🇷 French, 🇪🇸 Spanish, 🇵🇹 Portuguese, 🇷🇺 Russian (automatically adapts to Thunderbird's language)

## 📋 Requirements

### For Ollama (local, more private)

1. **Ollama** installed on your PC
   - Download from: https://ollama.ai

2. **An Ollama model** downloaded
   - Recommended: `ollama pull translategemma` (3GB, optimized)
   - Alternatives: `llama3.2`, `mistral`

3. **Thunderbird** 128 or later (ESR and non-ESR)

⚠️ **Important note**: Before using Ollama, you'll need to configure `OLLAMA_ORIGINS` (see "Initial Configuration" section below).

### For Google Translate or LibreTranslate (online, free)

- **No requirements** - They work immediately
- **Internet connection** required

## 📦 Installation

### Method 1: XPI File (Recommended)

1. **Download** the `thunderbird-translator.xpi` file
2. **Open Thunderbird**
3. Go to **Menu > Tools > Add-ons**
4. Click the gear icon ⚙️ in the top right
5. Select **"Install Add-on from file..."**
6. Select the `.xpi` file
7. Confirm installation

### Method 2: From Folder (Development)

1. Extract files to a folder
2. Open Thunderbird
3. Press **Ctrl+Shift+A** (or from Menu > Tools > Add-ons)
4. Click the gear icon ⚙️
5. Select **"Debug Add-ons"**
6. Click **"Load Temporary Add-on..."**
7. Select the `manifest.json` file from the folder

## ⚙️ Initial Configuration

### 1. Open addon settings
   - Menu > Tools > Add-ons > "Thunderbird Translator" > Preferences

### 2. Choose service and language
   - **Service**: Ollama (local) / Google Translate / LibreTranslate
   - **Language**: Italian, English, Spanish, French, German, Portuguese, Russian, Japanese, Chinese, Korean

### 3. If using Ollama: REQUIRED Configuration

#### ⚠️ Configure OLLAMA_ORIGINS

**Why is it needed?**
For security reasons, Ollama blocks requests from browser extensions. You must explicitly authorize Thunderbird.

**Recommended value (more secure):**
```
OLLAMA_ORIGINS=moz-extension://*
```
Allows only Firefox/Thunderbird extensions to access Ollama. Blocks all external websites.

**How to configure:**

**Windows (CMD):**
```cmd
setx OLLAMA_ORIGINS "moz-extension://*"
```
Then close and reopen the terminal and start Ollama:
```cmd
ollama serve
```

**Linux (permanent):**
```bash
echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
source ~/.bashrc
ollama serve
```

**macOS (permanent):**
```bash
echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.zshrc
source ~/.zshrc
ollama serve
```

**Alternative option** (if you also need local apps):
```
OLLAMA_ORIGINS=moz-extension://*,http://localhost:11434
```

#### 4. Configure URL and model
   - **Ollama URL**: `http://localhost:11434` (default)
   - **Test connection**: Click to verify that Ollama is reachable
   - **Model**: Select `translategemma` (recommended) or another installed model

#### 5. Save
   - Click "Save"

## 🎯 How to Use

### Context Menu (Recommended)
1. **Open an email** you want to translate
2. **Right-click** on the email body
3. **Choose the translation service**:
   - **"Translate with Ollama"** → Local and private translation (requires Ollama installed)
   - **"Translate with Google Translate"** → Free online translation
   - **"Translate with LibreTranslate"** → Open-source online translation
4. **Select the target language** from the submenu
   - The selected language will appear in **bold**
   - This choice becomes the default for that service
5. Wait for the message "Translation completed"

**Example**: If you select "Translate with Google Translate > Español", all subsequent translations with Google Translate will be in Spanish (until you choose another language).

### Show Original
- After translation, **right-click** on the text
- Select **"Show Original"** to restore the original text

## 🔒 Security

### ✅ What is Secure
- **Ollama mode**: 100% local — no data sent online, everything processed on your PC
- **Google Translate / LibreTranslate mode**: email text is sent to external servers for translation (no other data is shared)
- **No tracking** - No statistics, tracking, or remote logs
- **No credentials** - Doesn't save passwords or sensitive information
- **Minimal permissions** - Only accesses email text for translation

> **Want total privacy?** Use the Ollama-only version: [Thunderbird Ollama Translator](https://github.com/zoott28354/thunderbird-ollama-translator) — zero external connections, everything stays on your machine.

### 🛡️ Required Permissions
- `messagesRead` - Reads email content (for translation)
- `messagesModify` - Modifies displayed text (to show translation)
- `menus` - Adds context menu
- `storage` - Saves settings
- `tabs` - Injects script into email
- **Host permissions** (only if using Google Translate or LibreTranslate):
  - `https://translate.google.com/*` - Google Translate API
  - `https://translate.fedilab.app/*` - LibreTranslate instance
  - `http://localhost/*` - For local Ollama

No access to:
- ❌ Address book, calendar, chat
- ❌ Account credentials
- ❌ Thunderbird database
- ❌ File system (except localhost for Ollama)

## 🚨 Troubleshooting

### LibreTranslate: random errors or slow responses

LibreTranslate uses free public instances. The addon automatically tries 3 instances in sequence — if one fails, it moves to the next. Random errors (timeouts, 429 rate-limit, 503 server down) are normal and expected with free public instances. Simply retry after a few seconds.

### "Error: Ollama error: 403 Forbidden" ⚠️

**CAUSE**: Ollama blocks requests from browser extensions for security reasons.

**COMPLETE SOLUTION**:

1. **Stop Ollama** if it's running (Ctrl+C in the terminal where `ollama serve` is running)

2. **Configure the environment variable** (recommended value for security):

   **Windows (CMD):**
   ```cmd
   setx OLLAMA_ORIGINS "moz-extension://*"
   ```

   **Linux:**
   ```bash
   echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
   source ~/.bashrc
   ```

   **macOS:**
   ```bash
   echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Close and reopen the terminal**, then start Ollama:
   ```bash
   ollama serve
   ```

4. **Verify the configuration**:
   - Open Thunderbird
   - Go to addon settings
   - Click "Test connection"
   - Should show "Connection successful: X models available"

**Note**: `moz-extension://*` allows only Firefox/Thunderbird extensions to access Ollama, blocking external websites (more secure).

## 📜 Changelog

### v1.5.0
- **Fix**: Deterministic tab/preview routing — translating from a separate email tab no longer interferes with the preview pane (and vice versa). Uses `menus.onShown` + `framePortMap` for exact frame-level targeting.
- **Fix**: Removed `message_display_scripts` manifest key (caused warnings on Thunderbird 147+). Content script is now registered programmatically via `messageDisplayScripts.register()`.

### v1.4.0
- **Fix**: Added programmatic `messageDisplayScripts` registration for broader Thunderbird version compatibility.

### v1.3.0
- **Fix**: Context menu now appears only in the email body (not in folder pane or message list).
- Versioned XPI filenames.

### v1.2.0
- **Fix**: Port-based tab routing with `portMap` for multi-tab support.

### v1.0.0
- Initial release with Ollama, Google Translate, and LibreTranslate support.

## 📝 License

MIT License - Free to use, modify and distribute.

## 🤝 Support

If you have problems:
1. **Open the console** (Ctrl+Shift+I in a Thunderbird tab)
2. **Right-click** on the email > Select service and translation language
3. **Look for blue messages** `[Translator]` in the console
4. **Copy error messages** and share them

---

**Happy translating!** 🎉
