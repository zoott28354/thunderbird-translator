# Thunderbird Translator
**(Local Ollama · OpenAI Compatible API (oMLX, vLLM) · Google Translate · LibreTranslate)**

<p align="center">
  <img src="preview.png" alt="Thunderbird Translator Preview" width="600">
</p>

---

A Thunderbird addon that replaces the email body with its translation (in-place) into multiple languages using Ollama local, Google Translate, or LibreTranslate (Euro-friendly).

## ✨ Features

- 🏠 **Local translation** - With Ollama: no data sent online, everything stays on your PC
- 🤖 **Supports all Ollama models** - Translategemma, Llama, Mistral, Neural Chat, etc.
- 🔌 **OpenAI Compatible API** - Connect to oMLX, vLLM, LocalAI, LM Studio, or any OpenAI-compatible server
- 🌐 **Multiple translation services** - Ollama, OpenAI Compatible API, Google Translate, LibreTranslate
- 🌍 **Multi-language translation** - Supports 10 languages: Italian, English, Spanish, French, German, Portuguese, Russian, Japanese, Chinese, Korean
- 🖱️ **Simple interface** - Right-click on email and choose service and language
- ⌨️ **Keyboard shortcut** - Press `Alt+W` (Windows/Linux) or `Option+W` (macOS) to instantly translate or restore the original
- 🔄 **Auto-translate** - Automatically translate every email as soon as it's opened (enable in settings)
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

### For OpenAI Compatible API (oMLX, vLLM, LocalAI, LM Studio)

1. **An OpenAI-compatible server** running locally or remotely
   - oMLX: https://github.com/jundot/omlx (macOS, Apple Silicon)
   - vLLM: https://github.com/vllm-project/vllm
   - LocalAI: https://github.com/mudler/LocalAI
   - LM Studio: https://lmstudio.ai

2. **Model downloaded** in your server
   - Example for oMLX: Download any MLX model from HuggingFace

3. **Server URL** (e.g., `http://localhost:8000` for oMLX)

4. **API Key** (optional, only if your server requires authentication)

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
   - **Service**: Ollama (local) / OpenAI Compatible API (oMLX, vLLM, etc.) / Google Translate / LibreTranslate
   - **Language**: Italian, English, Spanish, French, German, Portuguese, Russian, Japanese, Chinese, Korean

### 3. Configure your selected service

#### If using Ollama: REQUIRED Configuration

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

#### If using OpenAI Compatible API (oMLX, vLLM, LocalAI, etc.)

1. **Base URL**: Enter your server's base URL
   - oMLX default: `http://localhost:8000`
   - vLLM default: `http://localhost:8000`
   - LocalAI default: `http://localhost:8080`

2. **Model Name**: Enter the exact model name as shown in your server
   - For oMLX: Any downloaded MLX model (e.g., `Qwen3-Coder-Next-8bit`)
   - For vLLM: Any supported model (e.g., `Qwen/Qwen2.5-7B-Instruct`)

3. **API Key** (optional): Only required if your server requires authentication
   - oMLX: Set via `--api-key` flag when starting server
   - Leave empty if no authentication is required

4. **Test connection**: Click "Test Connection" to verify that your server is reachable

#### 4. Save
   - Click "Save"

## 🎯 How to Use

### Context Menu (Recommended)
1. **Open an email** you want to translate
2. **Right-click** on the email body
3. **Choose the translation service**:
   - **"Translate with Ollama"** → Local and private translation (requires Ollama installed)
   - **"Translate with OpenAI Compatible API"** → Connect to oMLX, vLLM, LocalAI, LM Studio, etc.
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

## ⌨️ Keyboard Shortcut

Press `Alt+W` (Windows/Linux) or `Option+W` (macOS) to **toggle translation** on the currently displayed email — one press to translate, another to restore the original.

**Scope and requirements:**
- Works only when an email is open in the **message display area** (preview pane or separate window)
- The shortcut has **no effect** in the folder list, message list, or compose window
- If a translation is already in progress, the shortcut is ignored until it completes
- The default shortcut can be changed in Thunderbird: **Menu > Tools > Add-ons > Manage Extension Shortcuts**

> **Note**: After installing or updating the addon, Thunderbird must be restarted (or the addon fully reinstalled) for the shortcut to be registered.

## 🔄 Auto-Translate

Enable **"Auto-translate on open"** in the addon settings to automatically translate every email as soon as you open it, using the currently selected service and language.

- Go to **Menu > Tools > Add-ons > "Thunderbird Translator" > Preferences**
- Check **"Auto-translate on open"**
- Click **Save**

## 🔒 Security

### ✅ What is Secure
- **Ollama mode**: 100% local — no data sent online, everything processed on your PC
- **OpenAI Compatible API mode**: Data is sent to your configured server (local or remote). When running locally (oMLX, vLLM, LocalAI), data stays on your machine.
- **Google Translate / LibreTranslate mode**: Email text is sent to external servers for translation (no other data is shared)
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
- **Host permissions**:
  - `http://localhost/*`, `http://*/*`, `https://*/*` - For local Ollama and OpenAI Compatible API servers
  - `https://translate.google.com/*` - Google Translate API
  - `https://translate.fedilab.app/*` - LibreTranslate instance

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

### v1.7.0
- **OpenAI Compatible API support**: Connect to oMLX, vLLM, LocalAI, LM Studio, or any OpenAI-compatible server
  - New service option "OpenAI Compatible API" in the context menu
  - Configurable Base URL, Model Name, and optional API Key
  - Supports servers running on `http://localhost:8000` (oMLX default) or any custom endpoint
  - Uses OpenAI's `/v1/chat/completions` endpoint for maximum compatibility

### v1.6.0
- **Keyboard shortcut** (`Alt+W` / `Option+W`): toggle translation on the current email; works only when an email is displayed in the preview pane or a separate window
- **Auto-translate on open**: new option in settings to automatically translate every email as soon as it's opened
- **Quick-translate floating button**: a small button appears on the email body for one-click translate / restore
- Fix: `autoTranslate` setting was not persisted when saving from the options page

### v1.5.0
- Deterministic tab/preview routing — translating from a separate email tab no longer interferes with the preview pane (and vice versa)
- Context menu now appears only in the email body (not in folder pane or message list)
- Programmatic `messageDisplayScripts` registration for broad Thunderbird compatibility (128 ESR to 147+)

### v1.0.0
- Initial release with Ollama, Google Translate, and LibreTranslate support

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
