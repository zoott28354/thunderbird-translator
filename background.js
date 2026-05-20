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
  return messenger.storage.local.get({
    ollamaUrl: DEFAULT_OLLAMA_URL,
    model: DEFAULT_MODEL,
    service: DEFAULT_SERVICE,
    ollamaTargetLang: "en",
    googleTargetLang: "en",
    libreTargetLang: "en",
    libreUrl: DEFAULT_LIBRE_URL,
    ollamaApiKey: "",
    libreApiKey: "",
  });
}

// --- Register content scripts ---

if (messenger.messageDisplayScripts) {
  messenger.messageDisplayScripts.register({
    js: [{ file: "content/translator.js" }],
  }).then(() => {
    console.log("[Translator] messageDisplayScripts registered");
  }).catch(e => {
    console.warn("[Translator] messageDisplayScripts.register failed:", e.message);
  });
}

if (messenger.composeScripts) {
  messenger.composeScripts.register({
    js: [{ file: "content/composer.js" }],
  }).then(() => {
    console.log("[Translator] composeScripts registered");
  }).catch(e => {
    console.warn("[Translator] composeScripts.register failed:", e.message);
  });
}

// --- Port management ---

const portMap      = new Map(); // tabId    → port  (read mode)
const framePortMap = new Map(); // "tabId-frameId" → port
const composePortMap = new Map(); // windowId → port  (compose mode)
let lastActivePort = null;

// Pending requests from popup: reqId → { resolve, reject, timeoutId }
const pendingPopupRequests = new Map();
let nextPopupReqId = 0;

function sendToActivePort(command, extra = {}) {
  return new Promise((resolve, reject) => {
    if (!lastActivePort) { reject(new Error("No active content script")); return; }
    const reqId = nextPopupReqId++;
    const timeoutId = setTimeout(() => {
      pendingPopupRequests.delete(reqId);
      reject(new Error("Content script timeout"));
    }, 30000);
    pendingPopupRequests.set(reqId, { resolve, reject, timeoutId });
    lastActivePort.postMessage({ command, reqId, ...extra });
  });
}

function sendToComposePort(windowId, command, extra = {}) {
  return new Promise((resolve, reject) => {
    const port = composePortMap.get(windowId);
    if (!port) { reject(new Error("No compose content script for this window")); return; }
    const reqId = nextPopupReqId++;
    const timeoutId = setTimeout(() => {
      pendingPopupRequests.delete(reqId);
      reject(new Error("Compose script timeout"));
    }, 30000);
    pendingPopupRequests.set(reqId, { resolve, reject, timeoutId });
    port.postMessage({ command, reqId, ...extra });
  });
}

function resolvePending(reqId, result) {
  const pending = pendingPopupRequests.get(reqId);
  if (!pending) return;
  clearTimeout(pending.timeoutId);
  pendingPopupRequests.delete(reqId);
  pending.resolve(result);
}

messenger.runtime.onConnect.addListener((port) => {

  // --- Read-mode content script ---
  if (port.name === "translator") {
    const tabId   = port.sender?.tab?.id ?? null;
    const frameId = port.sender?.frameId ?? 0;
    const fKey    = `${tabId}-${frameId}`;

    if (tabId != null) portMap.set(tabId, port);
    framePortMap.set(fKey, port);
    lastActivePort = port;

    port.onDisconnect.addListener(() => {
      if (tabId != null && portMap.get(tabId) === port) portMap.delete(tabId);
      framePortMap.delete(fKey);
      if (lastActivePort === port) {
        lastActivePort = portMap.size > 0 ? [...portMap.values()].at(-1) : null;
      }
    });

    port.onMessage.addListener(async (message) => {
      // Translate API request
      if (message.command === "translate") {
        try {
          const settings = await getSettings();
          const translated = await translateText(message.text, settings);
          port.postMessage({ id: message.id, success: true, translated });
        } catch (e) {
          port.postMessage({ id: message.id, success: false, error: e.message });
        }
        return;
      }
      // Response to popup command
      if (["translateDone", "revertDone", "stateDone"].includes(message.command)) {
        resolvePending(message.reqId, message);
        return;
      }

      // Badge updates from content script (auto-translate feedback)
      if (message.command === "setBadge") {
        messenger.messageDisplayAction.setBadgeText({ tabId, text: "..." });
        messenger.messageDisplayAction.setBadgeBackgroundColor({ tabId, color: "#f90" });
        return;
      }
      if (message.command === "clearBadge") {
        if (message.success) {
          messenger.messageDisplayAction.setBadgeText({ tabId, text: "✓" });
          messenger.messageDisplayAction.setBadgeBackgroundColor({ tabId, color: "#1a7f37" });
          setTimeout(() => messenger.messageDisplayAction.setBadgeText({ tabId, text: "" }), 2000);
        } else {
          messenger.messageDisplayAction.setBadgeText({ tabId, text: "!" });
          messenger.messageDisplayAction.setBadgeBackgroundColor({ tabId, color: "#c00" });
        }
        return;
      }
    });
    return;
  }

  // --- Compose content script ---
  if (port.name === "translator-composer") {
    const windowId = port.sender?.tab?.windowId ?? null;
    if (windowId != null) composePortMap.set(windowId, port);

    port.onDisconnect.addListener(() => {
      if (windowId != null) composePortMap.delete(windowId);
    });

    port.onMessage.addListener(async (message) => {
      // Translate API request
      if (message.command === "translate") {
        try {
          const settings = await getSettings();
          const translated = await translateText(message.text, settings);
          port.postMessage({ id: message.id, success: true, translated });
        } catch (e) {
          port.postMessage({ id: message.id, success: false, error: e.message });
        }
        return;
      }
      // Response to popup command
      if (message.command === "translateSelectionDone") {
        resolvePending(message.reqId, message);
      }
    });
    return;
  }
});

// --- Translation APIs ---

async function translateWithOllama(text, settings) {
  const { ollamaUrl, model, targetLanguage, ollamaApiKey } = settings;
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

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!response.ok) {
    if (response.status === 404)
      throw new Error(`Ollama model "${model}" not found. Please run: ollama pull ${model}`);
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }
  return (await response.json()).response.trim();
}

async function translateWithGoogle(text, targetLanguage) {
  const params = new URLSearchParams({
    client: "gtx", sl: "auto", tl: targetLanguage, dt: "t", q: text,
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
    const err = await response.text();
    throw new Error(`LibreTranslate error: ${response.status} - ${err.substring(0, 100)}`);
  }
  const data = await response.json();
  if (data?.translatedText) return data.translatedText.trim();
  if (data?.error) throw new Error(`LibreTranslate API error: ${data.error}`);
  throw new Error("Invalid response from LibreTranslate");
}

async function translateText(text, settings) {
  const { service, ollamaTargetLang, googleTargetLang, libreTargetLang, libreUrl, libreApiKey } = settings;
  const targetLang = { ollama: ollamaTargetLang, google: googleTargetLang, libretranslate: libreTargetLang }[service] || "en";
  switch (service) {
    case "ollama":        return translateWithOllama(text, { ...settings, targetLanguage: targetLang });
    case "google":        return translateWithGoogle(text, targetLang);
    case "libretranslate": return translateWithLibreTranslate(text, targetLang, libreUrl, libreApiKey);
    default: throw new Error(`Unknown service: ${service}`);
  }
}

async function getInstalledModels(ollamaUrl) {
  const response = await fetch(`${ollamaUrl || DEFAULT_OLLAMA_URL}/api/tags`);
  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  return (await response.json()).models.map(m => m.name);
}

// --- Message handler (options page + popup) ---

messenger.runtime.onMessage.addListener(async (message) => {
  // Options page
  if (message.command === "getModels") {
    try {
      const settings = await getSettings();
      return { success: true, models: await getInstalledModels(message.ollamaUrl || settings.ollamaUrl) };
    } catch (e) { return { success: false, error: e.message }; }
  }
  if (message.command === "testConnection") {
    try {
      return { success: true, models: await getInstalledModels(message.ollamaUrl) };
    } catch (e) { return { success: false, error: e.message }; }
  }
  if (message.command === "saveSettings") {
    await messenger.storage.local.set({
      ollamaUrl: message.ollamaUrl, model: message.model,
      ollamaApiKey: message.ollamaApiKey,
      libreUrl: message.libreUrl, libreApiKey: message.libreApiKey,
    });
    return { success: true };
  }

  // Popup — read mode
  if (message.command === "popupGetState") {
    try { return await sendToActivePort("getState"); }
    catch (e) { return { success: false, isTranslated: false, error: e.message }; }
  }
  if (message.command === "popupTranslate") {
    try { return await sendToActivePort("doTranslate"); }
    catch (e) { return { success: false, error: e.message }; }
  }
  if (message.command === "popupRevert") {
    try { return await sendToActivePort("doRevert"); }
    catch (e) { return { success: false, error: e.message }; }
  }

  // Popup — compose mode
  if (message.command === "popupTranslateSelection") {
    try { return await sendToComposePort(message.windowId, "doTranslateSelection"); }
    catch (e) { return { success: false, error: e.message }; }
  }
});
