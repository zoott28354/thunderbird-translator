"use strict";

const LANG_STORAGE_KEY = {
  ollama: "ollamaTargetLang",
  google: "googleTargetLang",
  libretranslate: "libreTargetLang",
};

const serviceEl   = document.getElementById("service");
const langEl      = document.getElementById("lang");
const actionBtn   = document.getElementById("action-btn");
const statusEl    = document.getElementById("status");
const autoCheck   = document.getElementById("auto-translate");
const autoLabel   = document.getElementById("auto-label");

let isCompose = false;

function setStatus(text, type = "") {
  statusEl.textContent = text;
  statusEl.className = type;
}

function setBtn(text, disabled = false) {
  actionBtn.textContent = text;
  actionBtn.disabled = disabled;
}

async function init() {
  // Detect context: compose window vs. mail/read window
  const win = await browser.windows.getCurrent();
  isCompose = (win.type === "messageCompose");

  // Load stored service + language
  const s = await browser.storage.local.get({
    service: "google",
    ollamaTargetLang: "en",
    googleTargetLang: "en",
    libreTargetLang: "en",
  });
  serviceEl.value = s.service;
  const langKey = LANG_STORAGE_KEY[s.service] || "googleTargetLang";
  langEl.value = s[langKey];

  if (isCompose) {
    setBtn("Translate Selection");
  } else {
    // Show auto-translate checkbox only in read mode
    autoLabel.classList.add("visible");
    const stored = await browser.storage.local.get({ autoTranslate: false });
    autoCheck.checked = stored.autoTranslate;

    // Query current translation state from the active content script
    try {
      const state = await browser.runtime.sendMessage({ command: "popupGetState" });
      setBtn(state.isTranslated ? "Show Original" : "Translate");
    } catch (e) {
      setBtn("Translate");
    }
  }
}

serviceEl.addEventListener("change", async () => {
  await browser.storage.local.set({ service: serviceEl.value });
  const langKey = LANG_STORAGE_KEY[serviceEl.value] || "googleTargetLang";
  const s = await browser.storage.local.get({ [langKey]: "en" });
  langEl.value = s[langKey];
});

langEl.addEventListener("change", async () => {
  const langKey = LANG_STORAGE_KEY[serviceEl.value] || "ollamaTargetLang";
  await browser.storage.local.set({ [langKey]: langEl.value });
});

actionBtn.addEventListener("click", async () => {
  const prevText = actionBtn.textContent;
  setBtn(prevText, true);
  setStatus("Translating...");

  try {
    let result;

    if (isCompose) {
      const win = await browser.windows.getCurrent();
      result = await browser.runtime.sendMessage({
        command: "popupTranslateSelection",
        windowId: win.id,
      });
    } else {
      const shouldRevert = (prevText === "Show Original");
      result = await browser.runtime.sendMessage({
        command: shouldRevert ? "popupRevert" : "popupTranslate",
      });
    }

    if (result && result.success) {
      setStatus("Done", "success");
      setBtn(isCompose ? "Translate Selection" : (result.isTranslated ? "Show Original" : "Translate"));
    } else {
      setStatus(result?.error || "Translation failed", "error");
      setBtn(prevText);
    }
  } catch (e) {
    setStatus(e.message || "Error", "error");
    setBtn(prevText);
  }
});

autoCheck.addEventListener("change", async () => {
  await browser.storage.local.set({ autoTranslate: autoCheck.checked });
  // If just enabled and email isn't translated yet, translate immediately
  if (autoCheck.checked) {
    const state = await browser.runtime.sendMessage({ command: "popupGetState" }).catch(() => null);
    if (state && !state.isTranslated) {
      actionBtn.click();
    }
  }
});

init();
