"use strict";

const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "llama3.2";

const TRANSLATE_PROMPT = `Translate the following text to Italian.
Rules:
- Only output the translation, nothing else
- Preserve the original formatting
- Do not add notes or explanations
- If the text is already in Italian, return it unchanged

Text: `;

// --- Settings ---

async function getSettings() {
  const defaults = { ollamaUrl: DEFAULT_OLLAMA_URL, model: DEFAULT_MODEL };
  const stored = await messenger.storage.local.get(defaults);
  return stored;
}

// --- Context Menu ---

function createContextMenu() {
  try {
    messenger.menus.create({
      id: "translate-italian",
      title: "Traduci in italiano",
      contexts: ["all"],
    });
    console.log("[Translator] Menu created successfully");
  } catch (e) {
    console.warn("[Translator] Menu creation warning:", e.message);
  }
}

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
          title: "Mostra originale",
          contexts: ["all"],
        });
      } catch (_) {
        messenger.menus.update("toggle-original", {
          title: "Mostra originale",
          visible: true,
        });
      }
    }
  });
});

// --- Ollama API ---

async function translateText(text, settings) {
  const { ollamaUrl, model } = settings;
  const url = `${ollamaUrl}/api/generate`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: TRANSLATE_PROMPT + text,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.response.trim();
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
  if (info.menuItemId === "translate-italian") {
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
      title: showingOriginal ? "Mostra traduzione" : "Mostra originale",
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
    await messenger.storage.local.set({
      ollamaUrl: message.ollamaUrl,
      model: message.model,
    });
    return { success: true };
  }
});

// --- Initialization ---

createContextMenu();
