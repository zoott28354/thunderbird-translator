"use strict";

const urlInput = document.getElementById("ollamaUrl");
const modelSelect = document.getElementById("model");
const refreshBtn = document.getElementById("refreshModels");
const testBtn = document.getElementById("testConnection");
const saveBtn = document.getElementById("save");
const statusDiv = document.getElementById("status");

function showStatus(message, isError) {
  statusDiv.textContent = message;
  statusDiv.className = "status " + (isError ? "error" : "success");
}

function clearStatus() {
  statusDiv.className = "status";
  statusDiv.textContent = "";
}

async function loadSettings() {
  const settings = await browser.runtime.sendMessage({ command: "getSettings" });
  urlInput.value = settings.ollamaUrl || "http://localhost:11434";

  // Try to load models
  await loadModels(settings.model);
}

async function loadModels(selectedModel) {
  const result = await browser.runtime.sendMessage({ command: "getModels" });

  modelSelect.innerHTML = "";

  if (!result.success) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- Impossibile caricare i modelli --";
    modelSelect.appendChild(opt);

    // If we have a saved model, add it as an option anyway
    if (selectedModel) {
      const saved = document.createElement("option");
      saved.value = selectedModel;
      saved.textContent = selectedModel + " (salvato)";
      saved.selected = true;
      modelSelect.appendChild(saved);
    }
    return;
  }

  if (result.models.length === 0) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- Nessun modello installato --";
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

  // If no match, select first
  if (selectedModel && !result.models.includes(selectedModel)) {
    const saved = document.createElement("option");
    saved.value = selectedModel;
    saved.textContent = selectedModel + " (non trovato)";
    saved.selected = true;
    modelSelect.prepend(saved);
  }
}

refreshBtn.addEventListener("click", async () => {
  clearStatus();
  const currentModel = modelSelect.value;
  await loadModels(currentModel);
  showStatus("Lista modelli aggiornata", false);
});

testBtn.addEventListener("click", async () => {
  clearStatus();
  const url = urlInput.value.trim();
  if (!url) {
    showStatus("Inserisci l'URL del server Ollama", true);
    return;
  }

  const result = await browser.runtime.sendMessage({
    command: "testConnection",
    ollamaUrl: url,
  });

  if (result.success) {
    showStatus(`Connessione riuscita! ${result.models.length} modelli trovati.`, false);
    await loadModels(modelSelect.value);
  } else {
    showStatus("Connessione fallita: " + result.error, true);
  }
});

saveBtn.addEventListener("click", async () => {
  clearStatus();
  const ollamaUrl = urlInput.value.trim();
  const model = modelSelect.value;

  if (!ollamaUrl) {
    showStatus("Inserisci l'URL del server Ollama", true);
    return;
  }
  if (!model) {
    showStatus("Seleziona un modello", true);
    return;
  }

  await browser.runtime.sendMessage({
    command: "saveSettings",
    ollamaUrl,
    model,
  });

  showStatus("Impostazioni salvate", false);
});

// Load settings on page open
loadSettings();
