"use strict";

// --- Internationalization ---

function translatePage() {
  // Traduci tutti gli elementi con data-i18n
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = browser.i18n.getMessage(key);
  });

  // Traduci gli attributi title
  document.querySelectorAll("[title-i18n]").forEach((el) => {
    const key = el.getAttribute("title-i18n");
    el.setAttribute("title", browser.i18n.getMessage(key));
  });
}

const serviceSelect = document.getElementById("service");
const targetLanguageSelect = document.getElementById("targetLanguage");
const ollamaSection = document.getElementById("ollamaSection");
const urlInput = document.getElementById("ollamaUrl");
const modelSelect = document.getElementById("model");
const refreshBtn = document.getElementById("refreshModels");
const testBtn = document.getElementById("testConnection");
const saveBtn = document.getElementById("save");
const statusDiv = document.getElementById("status");

// Mostra/nascondi la sezione Ollama
serviceSelect.addEventListener("change", () => {
  ollamaSection.style.display = serviceSelect.value === "ollama" ? "block" : "none";
});

function showStatus(messageKey, isError, replacements = {}) {
  let message = browser.i18n.getMessage(messageKey, Object.values(replacements));
  statusDiv.textContent = message;
  statusDiv.className = "status " + (isError ? "error" : "success");
}

function clearStatus() {
  statusDiv.className = "status";
  statusDiv.textContent = "";
}

async function loadSettings() {
  const settings = await browser.runtime.sendMessage({ command: "getSettings" });
  
  serviceSelect.value = settings.service || "ollama";
  targetLanguageSelect.value = settings.targetLanguage || "it";
  urlInput.value = settings.ollamaUrl || "http://localhost:11434";
  
  // Mostra/nascondi la sezione Ollama
  ollamaSection.style.display = serviceSelect.value === "ollama" ? "block" : "none";

  // Carica modelli solo se Ollama
  if (serviceSelect.value === "ollama") {
    await loadModels(settings.model);
  }
}

async function loadModels(selectedModel) {
  const result = await browser.runtime.sendMessage({ command: "getModels" });

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
    if (name === selectedModel) {
      opt.selected = true;
    }
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
  const currentModel = modelSelect.value;
  await loadModels(currentModel);
  showStatus("modelsRefreshed", false);
});

testBtn.addEventListener("click", async () => {
  clearStatus();
  const url = urlInput.value.trim();
  if (!url) {
    showStatus("urlRequired", true);
    return;
  }

  const result = await browser.runtime.sendMessage({
    command: "testConnection",
    ollamaUrl: url,
  });

  if (result.success) {
    showStatus("connectionSuccess", false, { count: result.models.length });
    await loadModels(modelSelect.value);
  } else {
    showStatus("connectionFailed", true, { error: result.error });
  }
});

saveBtn.addEventListener("click", async () => {
  clearStatus();
  
  const service = serviceSelect.value;
  const targetLanguage = targetLanguageSelect.value;

  let settings = { service, targetLanguage };

  // Se Ollama è selezionato, valida i campi Ollama
  if (service === "ollama") {
    const ollamaUrl = urlInput.value.trim();
    const model = modelSelect.value;

    if (!ollamaUrl) {
      showStatus("urlRequired", true);
      return;
    }
    if (!model) {
      showStatus("modelRequired", true);
      return;
    }

    settings.ollamaUrl = ollamaUrl;
    settings.model = model;
  }

  await browser.runtime.sendMessage({
    command: "saveSettings",
    ...settings,
  });

  showStatus("settingsSaved", false);
});

// Traduci la pagina al caricamento
translatePage();

// Carica le impostazioni all'apertura della pagina
loadSettings();
