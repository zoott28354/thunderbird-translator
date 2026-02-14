# Thunderbird Ollama Translator

🇬🇧 [English](README.md) | 🇮🇹 [Italiano](README.it.md) | 🇫🇷 [Français](README.fr.md) | 🇪🇸 [Español](README.es.md) | 🇩🇪 [Deutsch](README.de.md) | 🇵🇹 [Português](README.pt.md) | 🇷🇺 [Русский](README.ru.md)

---

A Thunderbird addon that translates emails to multiple languages using Ollama, Google Translate, or LibreTranslate.

## 🚀 Features

- **Local translation** - Doesn't send data online, everything stays on your PC
- **Supports all Ollama models** - Llama, Mistral, Neural Chat, etc.
- **Supports multiple translation services** - Ollama, Google Translate, LibreTranslate
- **Translation to multiple languages** - Supports 10 languages: Italiano, English, Español, Français, Deutsch, Português, Русский, 日本語, 中文, 한국어
- **Simple interface** - Right-click on the email and select your target language
- **Quick button** - Alternative to context menu
- **Toggle** - Easily switch between original and translated text
- **Persistent settings** - Your configurations are saved automatically
- **Multilingual interface** - The addon is available in 7 languages: 🇮🇹 Italiano, 🇬🇧 English, 🇩🇪 Deutsch, 🇫🇷 Français, 🇪🇸 Español, 🇵🇹 Português, 🇷🇺 Русский (automatically adapts to Thunderbird's language)

## 📋 Requirements

### To use Ollama (local, more private)

1. **Ollama** - Installed and running on your PC
   - Download from: https://ollama.ai
   - Must be running on port `11434` (default)

2. **⚠️ MANDATORY CONFIGURATION - OLLAMA_ORIGINS**

   **Why is it necessary?**
   For security reasons, Ollama blocks requests from browser extensions. You need to configure the environment variable `OLLAMA_ORIGINS="*"` to allow the addon to communicate with Ollama.

   **How to configure it:**

   **Windows PowerShell (temporary - current session only):**
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ollama serve
   ```

   **Windows PowerShell (permanent):**
   ```powershell
   # Set the environment variable permanently
   [System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')

   # Restart Ollama
   ollama serve
   ```

   **Linux/Mac (temporary):**
   ```bash
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

   **Linux/Mac (permanent - add to your ~/.bashrc or ~/.zshrc):**
   ```bash
   echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc
   source ~/.bashrc
   ollama serve
   ```

   **⚠️ Security note:**
   `OLLAMA_ORIGINS="*"` allows any origin to access Ollama. If you prefer more security, you can specify only the extension:
   ```bash
   OLLAMA_ORIGINS="moz-extension://*"
   ```

3. **An Ollama model** - Downloaded and loaded
   - **Recommended**: `ollama pull translategemma` (3GB, optimized for translations)
   - Alternatives: `ollama pull llama3.2` or `ollama pull mistral`

4. **Thunderbird** - Version 128 or higher

### To use Google Translate or LibreTranslate (online, free)

- **No requirements** - Works immediately
- **Internet connection** required
- Google Translate: Unofficial API (free but may have limits)
- LibreTranslate: Free public instance (translate.fedilab.app)

## 📦 Installation

### Method 1: XPI File (Recommended)

1. **Download** the `thunderbird-ollama-translator.xpi` file
2. **Open Thunderbird**
3. Go to **Menu > Tools > Add-ons**
4. Click the gear icon ⚙️ in the top right
5. Select **"Install Add-on from file..."**
6. Select the `.xpi` file
7. Confirm the installation

### Method 2: From Folder (Development)

1. Extract the files to a folder
2. Open Thunderbird
3. Press **Ctrl+Shift+A** (or from Menu > Tools > Add-ons)
4. Click the gear icon ⚙️
5. Select **"Debug Add-ons"**
6. Click **"Load Temporary Add-on..."**
7. Select the `manifest.json` file from the folder

## ⚙️ Initial Configuration

1. **Open the addon settings**:
   - Go to **Menu > Tools > Add-ons**
   - Search for "Ollama Translator"
   - Click on **"Preferences"**

2. **Choose the translation service**:
   - **Ollama** (local, private) - Requires installation
   - **Google Translate** (online, free) - Works immediately
   - **LibreTranslate** (online, open-source) - Works immediately

3. **Choose the target language**:
   - Italiano, English, Español, Français, Deutsch, Português, Русский, 日本語, 中文, 한국어

### If using Ollama:

4. **⚠️ FIRST MANDATORY STEP - Configure OLLAMA_ORIGINS**:

   **Before** using the addon with Ollama, you need to configure this environment variable (see "Requirements" section above for detailed instructions).

   Quick check - open PowerShell/Terminal:
   ```bash
   # Windows PowerShell:
   $env:OLLAMA_ORIGINS="*"
   ollama serve

   # Linux/Mac:
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

   **Without this configuration, you will get a "403 Forbidden" error!**

5. **Enter the Ollama URL**:
   - Default: `http://localhost:11434`
   - If Ollama is on another machine, use its IP

6. **Test the connection**:
   - Click **"Test connection"**
   - If successful, you'll see the number of available models

7. **Select the model**:
   - **Recommended**: `translategemma` (optimized for translations, fast)
   - Fast alternatives: `llama3.2`, `mistral`
   - Accurate alternatives: `llama2`, `neural-chat`

8. **Save**:
   - Click **"Save"**

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
5. Wait for the "Translation complete" message

**Example**: If you select "Translate with Google Translate > Español", all subsequent translations with Google Translate will be in Spanish (until you choose another language).

### Alternative Method: Quick Button
1. **Open an email**
2. Look at the **top right corner** of the email
3. Click the **blue button** 🌐 **"Translate"**
4. The service and language configured in settings will be used

### Toggle Original/Translation
- After translation, **right-click** on the text
- Select **"Show Original"** to see the original text
- Select **"Show Translation"** again to return to the translation

## 🔒 Security

### ✅ What is Secure
- **No data sent online** - Everything is processed locally by Ollama
- **Local connection** - Communicates only with `localhost:11434`
- **No tracking** - No statistics, tracking, or remote logs
- **No credentials** - Doesn't save passwords or sensitive information
- **Minimal permissions** - Only accesses email text to translate

### 🛡️ Required Permissions
- `messagesRead` - Reads email content (to translate)
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

### The "Translate to [language]" menu doesn't appear
- Reload the addon: Menu > Tools > Add-ons > Ollama Translator > Reload
- Try another email
- Check that the addon is enabled

### "Error: Ollama error: 403 Forbidden" ⚠️

**CAUSE**: Ollama blocks requests from browser extensions for security reasons.

**COMPLETE SOLUTION**:

1. **Stop Ollama** if it's running (Ctrl+C in the terminal where `ollama serve` is running)

2. **Configure the environment variable**:

   **Windows PowerShell (permanent - RECOMMENDED):**
   ```powershell
   # Set permanent environment variable
   [System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')

   # Verify it's set
   [System.Environment]::GetEnvironmentVariable('OLLAMA_ORIGINS', 'User')
   # Should display: *
   ```

   **Windows PowerShell (temporary - this session only):**
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ```

   **Linux/Mac (permanent - RECOMMENDED):**
   ```bash
   echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Restart Ollama**:
   ```bash
   ollama serve
   ```

4. **Verify the configuration**:
   - Open Thunderbird
   - Go to addon settings
   - Click "Test connection"
   - Should display "Connection successful: X models available"

**Note**: If you use `moz-extension://*` instead of `*`, it will only work for Firefox/Thunderbird extensions (more secure).

### "Error: Ollama unreachable"
- Start Ollama: `ollama serve`
- Verify it's on port 11434: `curl http://localhost:11434/api/tags`
- Check the URL in settings

### Google Translate doesn't translate all the text
- **FIXED** in current version (concatenates all segments)
- If the problem persists, reload the addon

### The first translation works but subsequent ones don't
- **FIXED** in current version (preserves original text)
- The bug was fixed in the latest commit

### LibreTranslate gives "API key required" error
- **FIXED** in current version (uses free fedilab.app instance)
- The addon automatically tries 3 different instances

### Translation is slow (Ollama only)
- Verify the model is fully loaded into memory
- Fast models: translategemma (~3GB), llama3.2, mistral (~4GB)
- Slow models: llama2, neural-chat (~7GB+)

### Translation is not accurate
- Try a different service (Google Translate is very accurate)
- For Ollama: try a different model
- **Recommended**: `translategemma` (specialized for translations)
- Alternatives: `llama3.2`, `neural-chat`

## 📊 Performance

- **Short email** (~5KB): 5-10 seconds
- **Medium email** (~50KB): 20-40 seconds
- **Long email** (~500KB): 2-5 minutes

*Times depend on the model and disk read/write speed.*

## 🔧 For Developers

### Disable debug logs
If you want a "cleaner" version without `[Translator]` messages in the console:
1. Open `background.js` and `content/translator.js`
2. Remove lines with `console.log("[Translator]"`

### Change the default model
In `background.js`, modify:
```javascript
const DEFAULT_MODEL = "llama3.2";  // Change here
```

### Customize the translation prompt
In `background.js`, modify:
```javascript
const TRANSLATE_PROMPT = `Translate the following text to [target language]. ...`;
```

## 📝 License

MIT License - Free to use, modify, and distribute.

## 🤝 Support

If you have problems:
1. **Open the console** (Ctrl+Shift+I in a Thunderbird tab)
2. **Right-click** on the email > Select translation service and language
3. **Look at the blue messages** `[Translator]` in the console
4. **Copy the error messages** and share them

---

**Happy translating!** 🎉
