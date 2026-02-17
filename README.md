# Thunderbird Translator
**(Local Ollama · Google Translate · LibreTranslate)**

🇬🇧 [English](./README.md) | 🇮🇹 [Italiano](./README.it.md) | 🇫🇷 [Français](./README.fr.md) | 🇪🇸 [Español](./README.es.md) | 🇩🇪 [Deutsch](./README.de.md) | 🇵🇹 [Português](./README.pt.md) | 🇷🇺 [Русский](./README.ru.md)

---

A Thunderbird addon that translates emails into multiple languages using Ollama, Google Translate, or LibreTranslate.

## ✨ Features

- 🏠 **Local translation** - With Ollama: no data sent online, everything stays on your PC
- 🤖 **Supports all Ollama models** - Llama, Mistral, Neural Chat, etc.
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

3. **Thunderbird** version 128 or higher

⚠️ **Important note**: Before using Ollama, you'll need to configure `OLLAMA_ORIGINS` (see "Initial Configuration" section below).

### For Google Translate or LibreTranslate (online, free)

- **No requirements** - They work immediately
- **Internet connection** required

## 📦 Installation

### Method 1: XPI File (Recommended)

1. **Download** the `thunderbird-ollama-translator.xpi` file
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
   - Menu > Tools > Add-ons > "Ollama Translator" > Preferences

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

**Linux/Mac (permanent):**
```bash
echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
source ~/.bashrc
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
- **No data sent online** - Everything is processed locally by Ollama
- **Local connection** - Communicates only with `localhost:11434`
- **No tracking** - No statistics, tracking, or remote logs
- **No credentials** - Doesn't save passwords or sensitive information
- **Minimal permissions** - Only accesses email text for translation

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

### "Error: Ollama error: 403 Forbidden" ⚠️

**CAUSE**: Ollama blocks requests from browser extensions for security reasons.

**COMPLETE SOLUTION**:

1. **Stop Ollama** if it's running (Ctrl+C in the terminal where `ollama serve` is running)

2. **Configure the environment variable** (recommended value for security):

   **Windows (CMD):**
   ```cmd
   setx OLLAMA_ORIGINS "moz-extension://*"
   ```

   **Linux/Mac:**
   ```bash
   echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
   source ~/.bashrc
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
