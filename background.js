"use strict";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2";
const DEFAULT_SERVICE = "ollama";
const DEFAULT_TARGET_LANGUAGE = "it";

const LANGUAGE_NAMES = {
  it: "italiano",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ru: "Русский",
  ja: "日本語",
  zh: "中文",
  ko: "한국어",
};

// --- Settings ---

async function getSettings() {
  const defaults = { 
    ollamaUrl: DEFAULT_OLLAMA_URL, 
    model: DEFAULT_MODEL,
    service: DEFAULT_SERVICE,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
  };
  const stored = await messenger.storage.local.get(defaults);
  return stored;
}

// --- Context Menu ---

async function createContextMenu() {
  try {
    const result = await messenger.storage.local.get(["targetLanguage", "service"]);
    const targetLang = result.targetLanguage || DEFAULT_TARGET_LANGUAGE;
    const langName = LANGUAGE_NAMES[targetLang] || targetLang;
    const title = browser.i18n.getMessage("translateTo") + " " + langName;
    
    try {
      messenger.menus.create({
        id: "translate-lang",
        title: title,
        contexts: ["all"],
      });
      console.log("[Translator] Menu created: " + title);
    } catch (e) {
      // Menu exists, update it
      messenger.menus.update("translate-lang", { title });
    }
  } catch (e) {
    console.warn("[Translator] Error in createContextMenu:", e.message);
  }
}

// --- Initialize context menu on startup ---
messenger.runtime.onStartup.addListener(() => {
  createContextMenu();
});

// --- Update context menu when settings change ---
messenger.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.targetLanguage || changes.service)) {
    createContextMenu();
  }
});

// --- Port-based communication with content scripts ---

// Most recent port from a message display content script.
// Each new message display replaces the previous one.
let activePort = null;

messenger.runtime.onConnect.addListener((port) => {
  if (port.name !== "translator") return;

  console.log("[Translator] Content script connected");
  activePort = port;

  port.onDisconnect.addListener(() => {
    console.log("[Translator] Content script disconnected");
    if (activePort === port) {
      activePort = null;
    }
  });

  // Handle messages from content script through the port
  port.onMessage.addListener(async (message) => {
    if (message.command === "getMessages") {
      // Send localized messages to content script
      const getMsg = (key, fallback) => {
        try {
          return browser.i18n?.getMessage(key) || fallback;
        } catch (e) {
          return fallback;
        }
      };
      
      port.postMessage({
        command: "messages",
        data: {
          translateButton: getMsg("translateButton", "🌐 Translate"),
          noText: getMsg("noText", "No text to translate"),
          translating: getMsg("translating", "Translating..."),
          success: getMsg("translationComplete", "Translation complete!"),
          errorUnreachable: "Error: " + getMsg("translationError", "Translation error"),
          error: getMsg("translationError", "Translation error"),
        }
      });
      return;
    }

    if (message.command === "translate") {
      try {
        const settings = await getSettings();
        const translated = await translateText(message.text, settings);
        port.postMessage({ id: message.id, success: true, translated });
      } catch (e) {
        console.error("[Translator] Translation error:", e);
        port.postMessage({ id: message.id, success: false, error: e.message });
      }
    }

    if (message.command === "translationComplete") {
      toggleMenuCreated = true;
      showingOriginal = false;
      try {
        messenger.menus.create({
          id: "toggle-original",
          title: browser.i18n.getMessage("showOriginal"),
          contexts: ["all"],
        });
      } catch (_) {
        messenger.menus.update("toggle-original", {
          title: browser.i18n.getMessage("showOriginal"),
          visible: true,
        });
      }
    }
  });
});

// --- Ollama API ---

async function translateWithOllama(text, settings) {
  const { ollamaUrl, model, targetLanguage } = settings;
  const url = `${ollamaUrl}/api/generate`;

  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  const prompt = `Translate the following text to ${langName}.
Rules:
- Only output the translation, nothing else
- Preserve the original formatting
- Do not add notes or explanations
- If the text is already in ${langName}, return it unchanged

Text: ${text}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response.trim();
}

// --- Google Translate API (non-official, free) ---

async function translateWithGoogle(text, targetLanguage) {
  // Usa l'API di Google Translate non-ufficiale
  // Simula una richiesta come farebbe un browser
  const url = "https://translate.googleapis.com/translate_a/element.js";
  
  // Fallback usando l'API di translate.google.com
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetLanguage,
    dt: "t",
    q: text,
  });

  const response = await fetch(`https://translate.google.com/translate_a/single?${params}`, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Translate error: ${response.status}`);
  }

  const data = await response.json();
  // Array structure: [[[translated_text, original_text, ...]], ...]
  if (data && data[0] && data[0][0] && data[0][0][0]) {
    return data[0][0][0].trim();
  }

  throw new Error("Invalid response from Google Translate");
}

// --- LibreTranslate API (free public instance) ---

async function translateWithLibreTranslate(text, targetLanguage) {
  const url = "https://libretranslate.de/translate";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "auto",
      target: targetLanguage,
    }),
  });

  if (!response.ok) {
    throw new Error(`LibreTranslate error: ${response.status}`);
  }

  const data = await response.json();
  if (data && data.translatedText) {
    return data.translatedText.trim();
  }

  throw new Error("Invalid response from LibreTranslate");
}

// --- Main Translation Function ---

async function translateText(text, settings) {
  const { service } = settings;
  
  try {
    switch (service) {
      case "ollama":
        return await translateWithOllama(text, settings);
      case "google":
        return await translateWithGoogle(text, settings.targetLanguage);
      case "libretranslate":
        return await translateWithLibreTranslate(text, settings.targetLanguage);
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  } catch (e) {
    console.error(`[Translator] ${service} error:`, e);
    throw e;
  }
}

async function getInstalledModels(ollamaUrl) {
  const url = `${ollamaUrl || DEFAULT_OLLAMA_URL}/api/tags`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }
  const data = await response.json();
  return data.models.map((m) => m.name);
}

// --- Toggle State ---

let toggleMenuCreated = false;
let showingOriginal = false;

// --- Event Handlers ---

messenger.menus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "translate-lang") {
    console.log("[Translator] 'Traduci' menu clicked. Tab:", tab ? tab.id : "unknown");
    
    // Get the active message tab
    const tabs = await messenger.tabs.query({ active: true, lastFocusedWindow: true });
    if (!tabs.length) {
      console.error("[Translator] No active tab found");
      return;
    }

    const activeTab = tabs[0];
    console.log("[Translator] Injecting content script into tab:", activeTab.id);

    try {
      // Inject the content script
      await messenger.tabs.executeScript(activeTab.id, {
        file: "content/translator.js",
        runAt: "document_start"
      });
      console.log("[Translator] Content script injected successfully");

      // Wait a bit for the script to connect
      setTimeout(() => {
        if (activePort) {
          console.log("[Translator] Sending startTranslation command");
          activePort.postMessage({ command: "startTranslation" });
        } else {
          console.error("[Translator] Still no active port after injection");
        }
      }, 100);
    } catch (e) {
      console.error("[Translator] Error injecting content script:", e);
    }
  } else if (info.menuItemId === "toggle-original") {
    showingOriginal = !showingOriginal;
    messenger.menus.update("toggle-original", {
      title: showingOriginal 
        ? browser.i18n.getMessage("showTranslation") 
        : browser.i18n.getMessage("showOriginal"),
    });
    if (activePort) {
      activePort.postMessage({
        command: "toggleOriginal",
        showOriginal: showingOriginal,
      });
    }
  }
});

// Handle messages from options page (uses runtime.sendMessage, not ports)
messenger.runtime.onMessage.addListener(async (message, sender) => {
  if (message.command === "getModels") {
    try {
      const settings = await getSettings();
      const models = await getInstalledModels(settings.ollamaUrl);
      return { success: true, models };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (message.command === "testConnection") {
    try {
      const url = message.ollamaUrl || DEFAULT_OLLAMA_URL;
      const models = await getInstalledModels(url);
      return { success: true, models };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (message.command === "getSettings") {
    return await getSettings();
  }

  if (message.command === "saveSettings") {
    // Aggiorna il menu quando cambiano le impostazioni
    await messenger.storage.local.set({
      service: message.service || DEFAULT_SERVICE,
      targetLanguage: message.targetLanguage || DEFAULT_TARGET_LANGUAGE,
      ollamaUrl: message.ollamaUrl,
      model: message.model,
    });
    
    // Ricrea il menu con la nuova lingua
    createContextMenu();
    
    return { success: true };
  }
});

// --- Initialization ---

createContextMenu();
