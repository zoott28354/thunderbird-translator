"use strict";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "translategemma";
const DEFAULT_SERVICE = "google";
const DEFAULT_LIBRE_URL = "https://libretranslate.com";

const LANGUAGE_NAMES = {
  en: "English",
  it: "italiano",
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
    ollamaTargetLang: "en",
    googleTargetLang: "en",
    libreTargetLang: "en",
    libreUrl: DEFAULT_LIBRE_URL,
    ollamaApiKey: "",
    libreApiKey: "",
  };
  return messenger.storage.local.get(defaults);
}

// --- Register message display script ---

if (messenger.messageDisplayScripts) {
  messenger.messageDisplayScripts.register({
    js: [{ file: "content/translator.js" }],
  }).then(() => {
    console.log("[Translator] messageDisplayScripts registered");
  }).catch(e => {
    console.warn("[Translator] messageDisplayScripts.register failed:", e.message);
  });
}

// --- Port-based communication with content scripts ---

const portMap = new Map();      // tabId → port
const framePortMap = new Map(); // "tabId-frameId" → port
let lastActivePort = null;

function getPortForTab(tabId) {
  if (tabId != null && portMap.has(tabId)) return portMap.get(tabId);
  return lastActivePort;
}

messenger.runtime.onConnect.addListener((port) => {
  if (port.name !== "translator") return;

  const tabId = port.sender?.tab?.id ?? null;
  const frameId = port.sender?.frameId ?? 0;
  const fKey = `${tabId}-${frameId}`;
  console.log("[Translator] Content script connected – tabId:", tabId, "frameId:", frameId, "key:", fKey);

  if (tabId != null) portMap.set(tabId, port);
  framePortMap.set(fKey, port);
  lastActivePort = port;

  port.onDisconnect.addListener(() => {
    console.log("[Translator] Content script disconnected – tabId:", tabId, "frameId:", frameId);
    if (tabId != null && portMap.get(tabId) === port) portMap.delete(tabId);
    framePortMap.delete(fKey);
    if (lastActivePort === port) {
      lastActivePort = portMap.size > 0 ? [...portMap.values()].at(-1) : null;
    }
  });

  port.onMessage.addListener(async (message) => {
    if (message.command === "getSubject") {
      try {
        const msg = await messenger.messageDisplay.getDisplayedMessage(tabId);
        port.postMessage({ command: "subject", subject: msg?.subject || "" });
      } catch (e) {
        console.warn("[Translator] getSubject failed:", e.message);
        port.postMessage({ command: "subject", subject: "" });
      }
      return;
    }

    if (message.command === "getMessages") {
      const getMsg = (key, fallback) => {
        try { return messenger.i18n?.getMessage(key) || fallback; } catch { return fallback; }
      };
      port.postMessage({
        command: "messages",
        data: {
          noText: getMsg("noText", "No text to translate"),
          translating: getMsg("translating", "Translating..."),
          success: getMsg("translationComplete", "Done"),
          errorUnreachable: "Error: " + getMsg("translationError", "Translation error"),
          error: getMsg("translationError", "Translation error"),
          subjectLabel: getMsg("subjectLabel", "Subject:"),
        }
      });
      return;
    }

    if (message.command === "translate") {
      console.log(`[Translator] Translate request id:${message.id}, length:${message.text?.length || 0}`);
      try {
        const settings = await getSettings();
        const translated = await translateText(message.text, settings);
        port.postMessage({ id: message.id, success: true, translated });
      } catch (e) {
        console.error("[Translator] Translation error:", e);
        port.postMessage({ id: message.id, success: false, error: e.message });
      }
    }
  });
});

// --- Ollama API ---

async function translateWithOllama(text, settings) {
  const { ollamaUrl, model, targetLanguage, ollamaApiKey } = settings;
  const url = `${ollamaUrl}/api/generate`;
  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  const prompt = `Translate the following text to ${langName}.
Rules:
- Only output the translation, nothing else
- Preserve the original formatting
- Do not add notes or explanations
- If the text is already in ${langName}, return it unchanged

Text: ${text}`;

  const headers = { "Content-Type": "application/json" };
  if (ollamaApiKey) headers["Authorization"] = `Bearer ${ollamaApiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, prompt, stream: false }),
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
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: targetLanguage,
    dt: "t",
    q: text,
  });

  const response = await fetch(`https://translate.google.com/translate_a/single?${params}`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
  });

  if (!response.ok) throw new Error(`Google Translate error: ${response.status}`);

  const data = await response.json();
  if (data?.[0] && Array.isArray(data[0])) {
    const translated = data[0].filter(p => p?.[0]).map(p => p[0]).join("").trim();
    if (translated) return translated;
  }
  throw new Error("Invalid response from Google Translate");
}

// --- LibreTranslate API ---

async function translateWithLibreTranslate(text, targetLanguage, libreUrl, libreApiKey) {
  const base = (libreUrl || DEFAULT_LIBRE_URL).replace(/\/+$/, "");
  const endpoint = base.endsWith("/translate") ? base : base + "/translate";

  const body = { q: text, source: "auto", target: targetLanguage };
  if (libreApiKey) body.api_key = libreApiKey;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LibreTranslate error: ${response.status} - ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  if (data?.translatedText) return data.translatedText.trim();
  if (data?.error) throw new Error(`LibreTranslate API error: ${data.error}`);
  throw new Error("Invalid response from LibreTranslate");
}

// --- Main Translation Function ---

async function translateText(text, settings) {
  const { service, ollamaTargetLang, googleTargetLang, libreTargetLang, libreUrl, libreApiKey } = settings;
  const targetLang = { ollama: ollamaTargetLang, google: googleTargetLang, libretranslate: libreTargetLang }[service] || "en";

  console.log(`[Translator] translateText – service:${service}, target:${targetLang}, length:${text.length}`);

  switch (service) {
    case "ollama":
      return translateWithOllama(text, { ...settings, targetLanguage: targetLang });
    case "google":
      return translateWithGoogle(text, targetLang);
    case "libretranslate":
      return translateWithLibreTranslate(text, targetLang, libreUrl, libreApiKey);
    default:
      throw new Error(`Unknown service: ${service}`);
  }
}

async function getInstalledModels(ollamaUrl) {
  const response = await fetch(`${ollamaUrl || DEFAULT_OLLAMA_URL}/api/tags`);
  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  const data = await response.json();
  return data.models.map(m => m.name);
}

// --- Options page messages ---

messenger.runtime.onMessage.addListener(async (message) => {
  if (message.command === "getModels") {
    try {
      const settings = await getSettings();
      const url = message.ollamaUrl || settings.ollamaUrl;
      return { success: true, models: await getInstalledModels(url) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (message.command === "testConnection") {
    try {
      return { success: true, models: await getInstalledModels(message.ollamaUrl) };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  if (message.command === "saveSettings") {
    await messenger.storage.local.set({
      ollamaUrl: message.ollamaUrl,
      model: message.model,
      ollamaApiKey: message.ollamaApiKey,
      libreUrl: message.libreUrl,
      libreApiKey: message.libreApiKey,
    });
    return { success: true };
  }
});
