"use strict";

function translatePage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = browser.i18n.getMessage(key);
  });
  document.querySelectorAll("[title-i18n]").forEach((el) => {
    const key = el.getAttribute("title-i18n");
    el.setAttribute("title", browser.i18n.getMessage(key));
  });
}

const urlInput = document.getElementById("ollamaUrl");
const modelSelect = document.getElementById("model");
const ollamaApiKeyInput = document.getElementById("ollamaApiKey");
const libreUrlInput = document.getElementById("libreUrl");
const libreApiKeyInput = document.getElementById("libreApiKey");
const refreshBtn = document.getElementById("refreshModels");
const testBtn = document.getElementById("testConnection");
const saveBtn = document.getElementById("save");
const statusDiv = document.getElementById("status");

function showStatus(messageKey, isError, replacements = {}) {
  const message = browser.i18n.getMessage(messageKey, Object.values(replacements));
  statusDiv.textContent = message;
  statusDiv.className = "status " + (isError ? "error" : "success");
}

function clearStatus() {
  statusDiv.className = "status";
  statusDiv.textContent = "";
}

async function loadSettings() {
  const settings = await browser.storage.local.get({
    ollamaUrl: "http://localhost:11434",
    model: "",
    ollamaApiKey: "",
    libreUrl: "https://libretranslate.com",
    libreApiKey: "",
  });

  urlInput.value = settings.ollamaUrl;
  ollamaApiKeyInput.value = settings.ollamaApiKey;
  libreUrlInput.value = settings.libreUrl;
  libreApiKeyInput.value = settings.libreApiKey;
  await loadModels(settings.model);
}

async function loadModels(selectedModel, ollamaUrl) {
  const result = await browser.runtime.sendMessage({ command: "getModels", ollamaUrl });

  modelSelect.innerHTML = "";

  if (!result.success) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = browser.i18n.getMessage("cannotLoadModels");
    modelSelect.appendChild(opt);

    if (selectedModel) {
      const saved = document.createElement("option");
      saved.value = selectedModel;
      saved.textContent = selectedModel + " " + browser.i18n.getMessage("saved");
      saved.selected = true;
      modelSelect.appendChild(saved);
    }
    return;
  }

  if (result.models.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = browser.i18n.getMessage("noModelsFound");
    modelSelect.appendChild(opt);
    return;
  }

  for (const name of result.models) {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    if (name === selectedModel) opt.selected = true;
    modelSelect.appendChild(opt);
  }

  if (selectedModel && !result.models.includes(selectedModel)) {
    const saved = document.createElement("option");
    saved.value = selectedModel;
    saved.textContent = selectedModel + " " + browser.i18n.getMessage("notFound");
    saved.selected = true;
    modelSelect.prepend(saved);
  }
}

refreshBtn.addEventListener("click", async () => {
  clearStatus();
  await loadModels(modelSelect.value, urlInput.value.trim());
  showStatus("modelsRefreshed", false);
});

testBtn.addEventListener("click", async () => {
  clearStatus();
  const url = urlInput.value.trim();
  if (!url) {
    showStatus("urlRequired", true);
    return;
  }

  const result = await browser.runtime.sendMessage({ command: "testConnection", ollamaUrl: url });

  if (result.success) {
    showStatus("connectionSuccess", false, { count: result.models.length });
    await loadModels(modelSelect.value, url);
  } else {
    showStatus("connectionFailed", true, { error: result.error });
  }
});

saveBtn.addEventListener("click", async () => {
  clearStatus();

  const ollamaUrl = urlInput.value.trim();
  const model = modelSelect.value;
  const ollamaApiKey = ollamaApiKeyInput.value.trim();
  const libreUrl = libreUrlInput.value.trim();
  const libreApiKey = libreApiKeyInput.value.trim();

  if (!ollamaUrl) {
    showStatus("urlRequired", true);
    return;
  }

  await browser.runtime.sendMessage({ command: "saveSettings", ollamaUrl, model, ollamaApiKey, libreUrl, libreApiKey });
  showStatus("settingsSaved", false);
});

translatePage();
loadSettings();
