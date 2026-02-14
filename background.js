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

let menuCreated = false;

async function createContextMenu() {
  try {
    const result = await messenger.storage.local.get(["targetLanguage"]);
    const defaultLang = result.targetLanguage || DEFAULT_TARGET_LANGUAGE;

    // Remove all existing menus first (only if already created)
    if (menuCreated) {
      await messenger.menus.removeAll();
    }

    // Create parent menu item
    const translateTitle = browser.i18n.getMessage("translateTo") || "Translate to";
    await messenger.menus.create({
      id: "translate-parent",
      title: `${translateTitle} ▶`,
      contexts: ["all"],
    });

    // Create submenu for each language
    const languages = Object.keys(LANGUAGE_NAMES);
    for (const langCode of languages) {
      const langName = LANGUAGE_NAMES[langCode];
      const isDefault = langCode === defaultLang;

      await messenger.menus.create({
        id: `translate-to-${langCode}`,
        parentId: "translate-parent",
        title: isDefault ? `✓ ${langName}` : `  ${langName}`,
        contexts: ["all"],
      });
    }

    menuCreated = true;
    console.log(`[Translator] Menu created with ${languages.length} language options. Default: ${LANGUAGE_NAMES[defaultLang]}`);
  } catch (e) {
    console.warn("[Translator] Error in createContextMenu:", e.message);
  }
}

// --- Initialize context menu on startup and install ---
messenger.runtime.onStartup.addListener(() => {
  console.log("[Translator] Extension started, creating menu");
  createContextMenu();
});

messenger.runtime.onInstalled.addListener(() => {
  console.log("[Translator] Extension installed, creating menu");
  createContextMenu();
});

// --- Update context menu when settings change ---
messenger.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.targetLanguage) {
    console.log("[Translator] Target language changed, updating menu");
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
      console.log(`[Translator] Received translate request, id: ${message.id}, text length: ${message.text?.length || 0}`);
      try {
        let settings = await getSettings();

        // Override targetLanguage if provided in message (from menu selection)
        if (message.targetLanguage) {
          settings = { ...settings, targetLanguage: message.targetLanguage };
          console.log(`[Translator] Using target language from menu: ${message.targetLanguage}`);
        } else if (currentSessionLanguage) {
          settings = { ...settings, targetLanguage: currentSessionLanguage };
          console.log(`[Translator] Using current session language: ${currentSessionLanguage}`);
        }

        console.log(`[Translator] Settings loaded:`, settings);
        const translated = await translateText(message.text, settings);
        console.log(`[Translator] Translation completed, sending response. Translated length: ${translated?.length || 0}`);
        port.postMessage({ id: message.id, success: true, translated });
        console.log(`[Translator] Response sent to content script`);
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
  console.log("[Translator] Google Translate called with target:", targetLanguage);

  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetLanguage,
    dt: "t",
    q: text,
  });

  const url = `https://translate.google.com/translate_a/single?${params}`;
  console.log("[Translator] Google Translate URL:", url);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  console.log("[Translator] Google Translate response status:", response.status);

  if (!response.ok) {
    throw new Error(`Google Translate error: ${response.status}`);
  }

  const data = await response.json();
  console.log("[Translator] Google Translate response data:", JSON.stringify(data).substring(0, 200));

  // Google Translate returns: [[[translated_part1, original_part1, ...], [translated_part2, original_part2, ...]], ...]
  // We need to concatenate all translated parts from data[0]
  if (data && data[0] && Array.isArray(data[0])) {
    const translatedParts = [];

    for (const part of data[0]) {
      if (part && part[0]) {
        translatedParts.push(part[0]);
      }
    }

    if (translatedParts.length > 0) {
      const translated = translatedParts.join("").trim();
      console.log(`[Translator] Google Translate result: ${translatedParts.length} parts, total length: ${translated.length}`);
      console.log("[Translator] First 100 chars:", translated.substring(0, 100));
      return translated;
    }
  }

  throw new Error("Invalid response from Google Translate");
}

// --- LibreTranslate API (free public instance) ---

async function translateWithLibreTranslate(text, targetLanguage) {
  console.log("[Translator] LibreTranslate called with target:", targetLanguage);

  // Try multiple LibreTranslate instances
  const instances = [
    "https://translate.fedilab.app/translate",
    "https://libretranslate.com/translate",
    "https://translate.argosopentech.com/translate",
  ];

  let lastError = null;

  for (const url of instances) {
    try {
      console.log("[Translator] Trying LibreTranslate instance:", url);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: "auto",
          target: targetLanguage,
        }),
      });

      console.log("[Translator] LibreTranslate response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log("[Translator] LibreTranslate error response:", errorText);
        throw new Error(`LibreTranslate error: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      console.log("[Translator] LibreTranslate response data:", JSON.stringify(data).substring(0, 200));

      if (data && data.translatedText) {
        console.log("[Translator] LibreTranslate result:", data.translatedText.substring(0, 100));
        return data.translatedText.trim();
      }

      if (data && data.error) {
        throw new Error(`LibreTranslate API error: ${data.error}`);
      }

      throw new Error("Invalid response from LibreTranslate: missing translatedText field");
    } catch (e) {
      console.warn(`[Translator] LibreTranslate instance ${url} failed:`, e.message);
      lastError = e;
      // Try next instance
    }
  }

  // All instances failed
  throw new Error(`LibreTranslate: All instances failed. Last error: ${lastError.message}`);
}

// --- Main Translation Function ---

async function translateText(text, settings) {
  const { service, targetLanguage } = settings;

  console.log(`[Translator] translateText called - service: ${service}, target: ${targetLanguage}, text length: ${text.length}`);

  try {
    let result;
    switch (service) {
      case "ollama":
        result = await translateWithOllama(text, settings);
        break;
      case "google":
        result = await translateWithGoogle(text, targetLanguage);
        break;
      case "libretranslate":
        result = await translateWithLibreTranslate(text, targetLanguage);
        break;
      default:
        throw new Error(`Unknown service: ${service}`);
    }
    console.log(`[Translator] Translation successful, result length: ${result?.length || 0}`);
    return result;
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

// --- Current Session Language (runtime only, not persisted) ---
let currentSessionLanguage = null;

// --- Event Handlers ---

messenger.menus.onClicked.addListener(async (info, tab) => {
  // Check if it's a language submenu item
  if (info.menuItemId.startsWith("translate-to-")) {
    const targetLang = info.menuItemId.replace("translate-to-", "");
    console.log(`[Translator] Translate to '${targetLang}' (${LANGUAGE_NAMES[targetLang]}) menu clicked`);

    // Save the selected language for this session
    currentSessionLanguage = targetLang;

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
          console.log("[Translator] Sending startTranslation command with target:", targetLang);
          activePort.postMessage({
            command: "startTranslation",
            targetLanguage: targetLang // Pass the selected language
          });
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
