"use strict";

(() => {
  if (window.__ollamaTranslatorLoaded) return;
  window.__ollamaTranslatorLoaded = true;

  console.log("[Translator Content Script] Loaded");

  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "OBJECT", "EMBED",
    "SVG", "MATH", "CODE", "TEXTAREA", "INPUT",
  ]);

  const BLOCK_TAGS = new Set([
    "P", "DIV", "TD", "TH", "LI", "H1", "H2", "H3", "H4", "H5", "H6",
    "BLOCKQUOTE", "CAPTION", "DT", "DD", "FIGCAPTION", "ARTICLE", "SECTION",
    "HEADER", "FOOTER", "TR", "PRE",
  ]);

  const MIN_TEXT_LENGTH = 3;

  const nodeMap = new Map();

  let toolbarEl = null;
  let toolbarSelect = null;
  let toolbarLangSelect = null;
  let toolbarBtn = null;
  let toolbarStatus = null;
  let toolbarSubjectEl = null;
  let isTranslated = false;
  let translationCached = false;
  let originalSubject = null;
  let translatedSubjectText = null;

  const SERVICE_NAMES = {
    ollama: "Ollama",
    google: "Google Translate",
    libretranslate: "LibreTranslate",
  };

  const LANGUAGE_NAMES = {
    en: "English",
    it: "Italiano",
    es: "Español",
    fr: "Français",
    de: "Deutsch",
    pt: "Português",
    ru: "Русский",
    ja: "日本語",
    zh: "中文",
    ko: "한국어",
  };

  const LANG_STORAGE_KEY = {
    ollama: "ollamaTargetLang",
    google: "googleTargetLang",
    libretranslate: "libreTargetLang",
  };

  let messages = {
    noText: "No text to translate",
    translating: "Translating...",
    success: "Done",
    errorUnreachable: "Error: Server unreachable",
    error: "Translation error",
  };

  // --- Port to background ---

  const port = browser.runtime.connect({ name: "translator" });
  console.log("[Translator Content Script] Connecting to background...");

  const pendingRequests = new Map();
  let nextRequestId = 0;

  port.onMessage.addListener((message) => {
    if (message.command === "messages") {
      messages = message.data;
      console.log("[Translator Content Script] Messages loaded");
      return;
    }

    if (message.command === "subject") {
      originalSubject = message.subject || null;
      return;
    }

    if (message.id != null && pendingRequests.has(message.id)) {
      const { resolve, reject } = pendingRequests.get(message.id);
      pendingRequests.delete(message.id);
      if (message.success) {
        resolve(message.translated);
      } else {
        reject(new Error(message.error));
      }
    }
  });

  port.postMessage({ command: "getMessages" });
  port.postMessage({ command: "getSubject" });

  function sendTranslateRequest(text) {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, { resolve, reject });
      port.postMessage({ command: "translate", id, text });
    });
  }

  // --- Toolbar ---

  function applyInlineLayout(el, styles) {
    for (const [prop, val] of Object.entries(styles)) {
      el.style.setProperty(prop, val, "important");
    }
  }

  function ensureToolbar() {
    if (toolbarEl) return;

    toolbarEl = document.createElement("div");
    toolbarEl.id = "translator-toolbar";
    applyInlineLayout(toolbarEl, {
      "position": "fixed",
      "top": "0",
      "left": "0",
      "right": "0",
      "z-index": "2147483647",
      "display": "flex",
      "flex-wrap": "wrap",
      "align-items": "center",
      "box-sizing": "border-box",
      "padding": "5px 0",
      "margin": "0",
      "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "font-size": "12px",
      "line-height": "1",
      "background": "Canvas",
    });

    // Service dropdown
    toolbarSelect = document.createElement("select");
    toolbarSelect.id = "translator-toolbar-select";
    for (const [value, label] of Object.entries(SERVICE_NAMES)) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      toolbarSelect.appendChild(opt);
    }
    applyInlineLayout(toolbarSelect, {
      "margin-left": "12px",
      "padding": "2px 6px",
      "border-radius": "3px",
      "font-size": "12px",
      "cursor": "pointer",
    });
    toolbarSelect.addEventListener("change", () => {
      browser.storage.local.set({ service: toolbarSelect.value });
      updateLangSelect();
      if (isTranslated) {
        reloadPage();
        nodeMap.clear();
        translationCached = false;
        translatedSubjectText = null;
      }
    });

    // Language dropdown
    toolbarLangSelect = document.createElement("select");
    toolbarLangSelect.id = "translator-toolbar-lang";
    for (const [value, label] of Object.entries(LANGUAGE_NAMES)) {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      toolbarLangSelect.appendChild(opt);
    }
    applyInlineLayout(toolbarLangSelect, {
      "margin-left": "8px",
      "padding": "2px 6px",
      "border-radius": "3px",
      "font-size": "12px",
      "cursor": "pointer",
    });
    toolbarLangSelect.addEventListener("change", () => {
      const langKey = LANG_STORAGE_KEY[toolbarSelect.value] || "ollamaTargetLang";
      browser.storage.local.set({ [langKey]: toolbarLangSelect.value });
      if (isTranslated) {
        reloadPage();
        nodeMap.clear();
        translationCached = false;
        translatedSubjectText = null;
      }
    });

    toolbarBtn = document.createElement("button");
    toolbarBtn.id = "translator-toolbar-btn";
    toolbarBtn.textContent = "Translate";
    applyInlineLayout(toolbarBtn, {
      "margin-left": "16px",
      "padding": "4px 12px",
      "border": "1px solid",
      "border-radius": "4px",
      "font-size": "12px",
      "white-space": "nowrap",
      "cursor": "pointer",
    });
    toolbarBtn.addEventListener("click", () => {
      if (isTranslated) {
        reloadPage();
      } else {
        startTranslation();
      }
    });

    toolbarStatus = document.createElement("span");
    toolbarStatus.id = "translator-toolbar-status";
    applyInlineLayout(toolbarStatus, {
      "margin-left": "16px",
      "font-size": "12px",
    });

    toolbarEl.appendChild(toolbarSelect);
    toolbarEl.appendChild(toolbarLangSelect);
    toolbarEl.appendChild(toolbarBtn);
    toolbarEl.appendChild(toolbarStatus);

    toolbarSubjectEl = document.createElement("div");
    toolbarSubjectEl.id = "translator-toolbar-subject";
    applyInlineLayout(toolbarSubjectEl, {
      "display": "none",
      "flex-basis": "100%",
      "padding": "4px 12px 4px",
      "font-size": "14px",
      "font-weight": "bold",
      "white-space": "nowrap",
      "overflow": "hidden",
      "text-overflow": "ellipsis",
    });
    toolbarEl.appendChild(toolbarSubjectEl);

    if (document.body) {
      document.body.insertBefore(toolbarEl, document.body.firstChild);
      requestAnimationFrame(() => {
        const height = toolbarEl.getBoundingClientRect().height || 32;
        document.body.style.setProperty("padding-top", height + "px", "important");
        document.body.style.setProperty("margin-top", "0", "important");
      });
    }

    updateToolbarSelects();
  }

  function updateBodyPadding() {
    if (!toolbarEl || !document.body) return;
    requestAnimationFrame(() => {
      const height = toolbarEl.getBoundingClientRect().height || 32;
      document.body.style.setProperty("padding-top", height + "px", "important");
    });
  }

  function showSubjectRow(text) {
    if (!toolbarSubjectEl) return;
    toolbarSubjectEl.textContent = (messages.subjectLabel || "Subject:") + " " + text;
    toolbarSubjectEl.style.setProperty("display", "block", "important");
    updateBodyPadding();
  }

  function hideSubjectRow() {
    if (!toolbarSubjectEl) return;
    toolbarSubjectEl.style.setProperty("display", "none", "important");
    updateBodyPadding();
  }

  function updateLangSelect() {
    if (!toolbarSelect || !toolbarLangSelect) return;
    const langKey = LANG_STORAGE_KEY[toolbarSelect.value] || "ollamaTargetLang";
    browser.storage.local.get({ [langKey]: "en" }).then((s) => {
      toolbarLangSelect.value = s[langKey];
    });
  }

  function updateToolbarSelects() {
    if (!toolbarSelect) return;
    browser.storage.local.get({
      service: "google",
      ollamaTargetLang: "en",
      googleTargetLang: "en",
      libreTargetLang: "en",
    }).then((s) => {
      toolbarSelect.value = s.service;
      const langKey = LANG_STORAGE_KEY[s.service] || "googleTargetLang";
      if (toolbarLangSelect) toolbarLangSelect.value = s[langKey];
    });
  }

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.service || changes.ollamaTargetLang || changes.googleTargetLang || changes.libreTargetLang)) {
      updateToolbarSelects();
    }
  });

  function setToolbarStatus(text, type = "") {
    if (!toolbarStatus) return;
    toolbarStatus.textContent = text;
    toolbarStatus.className = type;
  }

  function setToolbarButton(text, disabled = false) {
    if (!toolbarBtn) return;
    toolbarBtn.textContent = text;
    toolbarBtn.disabled = disabled;
  }

  // --- DOM Text Extraction ---

  function getBlockParent(node) {
    let el = node.parentElement;
    while (el && el !== document.body) {
      if (BLOCK_TAGS.has(el.tagName)) return el;
      el = el.parentElement;
    }
    return document.body;
  }

  function isVisible(node) {
    const el = node.parentElement;
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function extractTextBlocks() {
    const blocks = new Map();
    let blockId = 0;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (toolbarEl && toolbarEl.contains(node)) return NodeFilter.FILTER_REJECT;

          let parent = node.parentElement;
          while (parent) {
            if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
            parent = parent.parentElement;
          }

          const text = node.textContent.trim();
          if (text.length < MIN_TEXT_LENGTH) return NodeFilter.FILTER_REJECT;
          if (!isVisible(node)) return NodeFilter.FILTER_REJECT;

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const blockParent = getBlockParent(textNode);

      if (!blocks.has(blockParent)) {
        blocks.set(blockParent, { id: blockId++, text: "", nodes: [] });
      }

      const block = blocks.get(blockParent);
      block.nodes.push(textNode);

      const nodeData = nodeMap.get(textNode);
      const textToUse = nodeData?.original ?? textNode.textContent.trim();
      block.text += (block.text ? "\n" : "") + textToUse;
    }

    return Array.from(blocks.values());
  }

  // --- Translation Logic ---

  function applyTranslation(block, translatedText) {
    if (block.nodes.length === 1) {
      const node = block.nodes[0];
      const existing = nodeMap.get(node);
      nodeMap.set(node, {
        original: existing?.original ?? node.textContent,
        translated: translatedText,
      });
      node.textContent = translatedText;
    } else {
      const translatedLines = translatedText.split("\n").filter(l => l.trim().length > 0);
      for (let i = 0; i < block.nodes.length; i++) {
        const node = block.nodes[i];
        const existing = nodeMap.get(node);
        let nodeTranslation;

        if (i < translatedLines.length) {
          nodeTranslation = translatedLines[i];
        } else if (translatedLines.length > 0) {
          nodeTranslation = translatedLines[translatedLines.length - 1];
        } else {
          nodeTranslation = existing?.original ?? node.textContent;
        }

        if (i === block.nodes.length - 1 && translatedLines.length > block.nodes.length) {
          nodeTranslation = nodeTranslation + "\n" + translatedLines.slice(block.nodes.length).join("\n");
        }

        nodeMap.set(node, {
          original: existing?.original ?? node.textContent,
          translated: nodeTranslation,
        });
        node.textContent = nodeTranslation;
      }
    }
  }

  function isURL(text) {
    return /^https?:\/\/[^\s]+$/.test(text.trim());
  }

  async function translateNodeByNode(block) {
    console.log(`[Translator] Translating ${block.nodes.length} nodes individually`);
    for (let i = 0; i < block.nodes.length; i++) {
      const node = block.nodes[i];
      const existing = nodeMap.get(node);
      const originalText = existing?.original ?? node.textContent.trim();

      if (node.parentElement?.tagName === "A" || isURL(originalText)) continue;
      if (originalText.length < MIN_TEXT_LENGTH) continue;

      const translatedText = await sendTranslateRequest(originalText);
      nodeMap.set(node, { original: originalText, translated: translatedText });
      node.textContent = translatedText;
    }
  }

  async function translateByBlocks(blocks) {
    const allText = blocks.map(b => b.text).join("\n\n");
    console.log(`[Translator] Total text length: ${allText.length} characters`);
    const fullTranslation = await sendTranslateRequest(allText);
    const translatedParts = fullTranslation.split("\n\n");
    for (let i = 0; i < blocks.length; i++) {
      applyTranslation(blocks[i], translatedParts[i]?.trim() || blocks[i].text);
    }
    console.log(`[Translator] Translation applied to ${blocks.length} blocks`);
  }

  async function startTranslation() {
    ensureToolbar();

    if (translationCached && nodeMap.size > 0) {
      for (const [node, data] of nodeMap.entries()) {
        if (document.body.contains(node) && data.translated) {
          node.textContent = data.translated;
        }
      }
      isTranslated = true;
      setToolbarButton("Show Original");
      setToolbarStatus(messages.success, "success");
      if (translatedSubjectText) showSubjectRow(translatedSubjectText);
      return;
    }

    const blocks = extractTextBlocks();

    if (blocks.length === 0) {
      setToolbarStatus(messages.noText, "");
      return;
    }

    console.log(`[Translator] Starting translation of ${blocks.length} blocks`);

    setToolbarButton("Translate", true);
    setToolbarStatus(messages.translating, "");

    try {
      const preBlocks = blocks.filter(b =>
        b.nodes.length > 0 && b.nodes[0].parentElement?.tagName === "PRE"
      );
      const nonPreBlocks = blocks.filter(b => !preBlocks.includes(b));

      for (const block of preBlocks) await translateNodeByNode(block);
      if (nonPreBlocks.length > 0) await translateByBlocks(nonPreBlocks);

      isTranslated = true;
      translationCached = true;
      setToolbarButton("Show Original");
      setToolbarStatus(messages.success, "success");
      console.log("[Translator] Translation complete");

      if (originalSubject) {
        if (translatedSubjectText) {
          showSubjectRow(translatedSubjectText);
        } else {
          try {
            translatedSubjectText = await sendTranslateRequest(originalSubject);
            showSubjectRow(translatedSubjectText);
          } catch (e) {
            console.warn("[Translator] Subject translation failed:", e.message);
          }
        }
      }
    } catch (e) {
      console.error("[Translator] Translation failed:", e);
      const msg = (e.message.includes("Failed to fetch") || e.message.includes("NetworkError"))
        ? messages.errorUnreachable
        : messages.error;
      setToolbarStatus(msg, "error");
      setToolbarButton("Translate");
    }
  }

  function reloadPage() {
    console.log("[Translator] Restoring original email from nodeMap...");
    let restored = 0;
    let detached = 0;

    for (const [node, data] of nodeMap.entries()) {
      try {
        if (document.body.contains(node)) {
          node.textContent = data.original;
          restored++;
        } else {
          detached++;
        }
      } catch (e) {
        console.error("[Translator] Error restoring node:", e);
        detached++;
      }
    }

    isTranslated = false;
    setToolbarButton("Translate");
    setToolbarStatus("", "");
    hideSubjectRow();
    console.log(`[Translator] Restored ${restored} nodes, ${detached} detached`);
  }

  function initToolbar() {
    browser.storage.local.get({
      service: "google",
      ollamaTargetLang: "en",
      googleTargetLang: "en",
      libreTargetLang: "en",
    }).then((settings) => {
      const langKey = LANG_STORAGE_KEY[settings.service] || "ollamaTargetLang";
      const targetLang = settings[langKey] || "en";
      const emailLang = (document.documentElement.lang || document.body?.lang || "").toLowerCase();

      if (emailLang && emailLang.startsWith(targetLang.toLowerCase())) {
        console.log(`[Translator] Email already in target language (${emailLang}), skipping toolbar`);
        return;
      }

      ensureToolbar();
    });
  }

  if (document.body) {
    initToolbar();
  } else {
    document.addEventListener("DOMContentLoaded", initToolbar, { once: true });
  }
})();
