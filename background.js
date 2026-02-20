"use strict";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "translategemma";
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

// Convert text to Unicode bold (for menu highlighting)
function toBold(text) {
  const boldMap = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶',
    'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿',
    's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜',
    'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥',
    'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵',
    'á': 'á', 'é': 'é', 'í': 'í', 'ó': 'ó', 'ú': 'ú', 'ñ': 'ñ', 'ü': 'ü',
    'Á': 'Á', 'É': 'É', 'Í': 'Í', 'Ó': 'Ó', 'Ú': 'Ú', 'Ñ': 'Ñ', 'Ü': 'Ü',
    'à': 'à', 'è': 'è', 'ì': 'ì', 'ò': 'ò', 'ù': 'ù',
    'ç': 'ç', 'Ç': 'Ç'
  };
  return text.split('').map(char => boldMap[char] || char).join('');
}

// --- Settings ---

async function getSettings() {
  const defaults = {
    ollamaUrl: DEFAULT_OLLAMA_URL,
    model: DEFAULT_MODEL,
    service: DEFAULT_SERVICE,
    targetLanguage: DEFAULT_TARGET_LANGUAGE,
    ollamaTargetLang: DEFAULT_TARGET_LANGUAGE,
    googleTargetLang: "en",
    libreTargetLang: "en",
  };
  const stored = await messenger.storage.local.get(defaults);
  return stored;
}

// --- Context Menu ---

let menuCreated = false;

async function createContextMenu() {
  try {
    const settings = await getSettings();
    const { ollamaTargetLang, googleTargetLang, libreTargetLang } = settings;

    // Remove all existing menus first (only if already created)
    if (menuCreated) {
      await messenger.menus.removeAll();
    }

    const languages = Object.keys(LANGUAGE_NAMES);

    // Create Ollama menu with language submenus
    await messenger.menus.create({
      id: "translate-ollama-parent",
      title: messenger.i18n.getMessage("contextMenuTitle"),
      contexts: ["all"],
    });

    for (const langCode of languages) {
      const langName = LANGUAGE_NAMES[langCode];
      const isSelected = langCode === ollamaTargetLang;
      const title = isSelected ? toBold(langName) : langName;

      await messenger.menus.create({
        id: `ollama-${langCode}`,
        parentId: "translate-ollama-parent",
        title: title,
        contexts: ["all"],
      });
    }

    // Create Google Translate menu with language submenus
    await messenger.menus.create({
      id: "translate-google-parent",
      title: "Traduci con Google Translate",
      contexts: ["all"],
    });

    for (const langCode of languages) {
      const langName = LANGUAGE_NAMES[langCode];
      const isSelected = langCode === googleTargetLang;
      const title = isSelected ? toBold(langName) : langName;

      await messenger.menus.create({
        id: `google-${langCode}`,
        parentId: "translate-google-parent",
        title: title,
        contexts: ["all"],
      });
    }

    // Create LibreTranslate menu with language submenus
    await messenger.menus.create({
      id: "translate-libre-parent",
      title: "Traduci con LibreTranslate",
      contexts: ["all"],
    });

    for (const langCode of languages) {
      const langName = LANGUAGE_NAMES[langCode];
      const isSelected = langCode === libreTargetLang;
      const title = isSelected ? toBold(langName) : langName;

      await messenger.menus.create({
        id: `libre-${langCode}`,
        parentId: "translate-libre-parent",
        title: title,
        contexts: ["all"],
      });
    }

    menuCreated = true;
    console.log(`[Translator] Menu created with 3 services, each with ${languages.length} language options`);
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
  if (area === "local" && (changes.ollamaTargetLang || changes.googleTargetLang || changes.libreTargetLang)) {
    console.log("[Translator] Service language changed, updating menu");
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
          return messenger.i18n?.getMessage(key) || fallback;
        } catch (e) {
          return fallback;
        }
      };
      
      port.postMessage({
        command: "messages",
        data: {
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
      try {
        await messenger.menus.create({
          id: "toggle-original",
          title: messenger.i18n.getMessage("showOriginal"),
          contexts: ["all"],
        });
      } catch (_) {
        messenger.menus.update("toggle-original", {
          title: messenger.i18n.getMessage("showOriginal"),
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
    if (response.status === 404) {
      throw new Error(`Ollama model "${model}" not found. Please run: ollama pull ${model}`);
    }
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

// --- Event Handlers ---

messenger.menus.onClicked.addListener(async (info, tab) => {
  // Check if it's a service-specific language menu item
  let service = null;
  let targetLang = null;

  if (info.menuItemId.startsWith("ollama-")) {
    service = "ollama";
    targetLang = info.menuItemId.replace("ollama-", "");
  } else if (info.menuItemId.startsWith("google-")) {
    service = "google";
    targetLang = info.menuItemId.replace("google-", "");
  } else if (info.menuItemId.startsWith("libre-")) {
    service = "libretranslate";
    targetLang = info.menuItemId.replace("libre-", "");
  }

  if (service && targetLang) {
    console.log(`[Translator] ${service} - Translate to '${targetLang}' (${LANGUAGE_NAMES[targetLang]}) menu clicked`);

    // Save the selected language permanently for this service
    const storageKey = service === "ollama" ? "ollamaTargetLang" :
                       service === "google" ? "googleTargetLang" :
                       "libreTargetLang";

    await messenger.storage.local.set({
      [storageKey]: targetLang,
      service: service,
      targetLanguage: targetLang // Keep this for backward compatibility
    });

    console.log(`[Translator] Saved ${storageKey} = ${targetLang}, service = ${service}`);

    // Use the tab passed directly by the menu click event
    if (!tab || !tab.id) {
      console.error("[Translator] No tab found in menu click event");
      return;
    }

    const activeTab = tab;
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
            targetLanguage: targetLang
          });
        } else {
          console.error("[Translator] Still no active port after injection");
        }
      }, 100);
    } catch (e) {
      console.error("[Translator] Error injecting content script:", e);
    }
  } else if (info.menuItemId === "toggle-original") {
    if (activePort) {
      activePort.postMessage({
        command: "reloadOriginal",
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
    const targetLang = message.targetLanguage || DEFAULT_TARGET_LANGUAGE;
    const service = message.service || DEFAULT_SERVICE;

    // Update service-specific language based on current service
    const storageData = {
      service: service,
      targetLanguage: targetLang,
      ollamaUrl: message.ollamaUrl,
      model: message.model,
    };

    // Update the appropriate service-specific language
    if (service === "ollama") {
      storageData.ollamaTargetLang = targetLang;
    } else if (service === "google") {
      storageData.googleTargetLang = targetLang;
    } else if (service === "libretranslate") {
      storageData.libreTargetLang = targetLang;
    }

    await messenger.storage.local.set(storageData);

    // Ricrea il menu con la nuova lingua
    createContextMenu();

    return { success: true };
  }
});

// --- Initialization ---

createContextMenu();
