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
  let toolbarLabel = null;
  let toolbarBtn = null;
  let toolbarStatus = null;
  let isTranslated = false;
  let translationCached = false;

  const SERVICE_NAMES = {
    ollama: "Ollama",
    google: "Google Translate",
    libretranslate: "LibreTranslate",
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
  let targetLanguage = null;

  port.onMessage.addListener((message) => {
    console.log("[Translator Content Script] Received message:", message.command || `id:${message.id}`, message);

    if (message.command === "messages") {
      messages = message.data;
      console.log("[Translator Content Script] Messages loaded");
      return;
    }

    if (message.id != null && pendingRequests.has(message.id)) {
      console.log(`[Translator Content Script] Processing translation response for id ${message.id}`);
      const { resolve, reject } = pendingRequests.get(message.id);
      pendingRequests.delete(message.id);
      if (message.success) {
        resolve(message.translated);
      } else {
        reject(new Error(message.error));
      }
      return;
    } else if (message.id != null) {
      console.warn(`[Translator Content Script] Received response for unknown request id: ${message.id}`);
    }

    if (message.command === "startTranslation") {
      console.log("[Translator Content Script] Starting translation...");
      if (message.targetLanguage) {
        targetLanguage = message.targetLanguage;
        console.log(`[Translator Content Script] Target language set to: ${targetLanguage}`);
      }
      startTranslation();
    } else if (message.command === "reloadOriginal") {
      console.log("[Translator Content Script] Reloading original email");
      reloadPage();
    }
  });

  port.postMessage({ command: "getMessages" });

  function sendTranslateRequest(text) {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, { resolve, reject });
      const message = { command: "translate", id, text };
      if (targetLanguage) message.targetLanguage = targetLanguage;
      port.postMessage(message);
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
      "align-items": "center",
      "box-sizing": "border-box",
      "padding": "5px 0",
      "margin": "0",
      "font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "font-size": "13px",
      "line-height": "1",
    });

    toolbarLabel = document.createElement("span");
    toolbarLabel.id = "translator-toolbar-label";
    applyInlineLayout(toolbarLabel, {
      "margin-left": "12px",
      "padding": "2px 7px",
      "border-radius": "3px",
      "font-size": "11px",
      "white-space": "nowrap",
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

    toolbarEl.appendChild(toolbarLabel);
    toolbarEl.appendChild(toolbarBtn);
    toolbarEl.appendChild(toolbarStatus);

    if (document.body) {
      document.body.insertBefore(toolbarEl, document.body.firstChild);
      requestAnimationFrame(() => {
        const height = toolbarEl.getBoundingClientRect().height || 32;
        document.body.style.setProperty("padding-top", (height + 8) + "px", "important");
        document.body.style.setProperty("margin-top", "0", "important");
      });
    }

    updateToolbarLabel();
  }

  function updateToolbarLabel() {
    if (!toolbarLabel) return;
    browser.storage.local.get({ service: "ollama" }).then(({ service }) => {
      toolbarLabel.textContent = SERVICE_NAMES[service] || service;
    });
  }

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.service) updateToolbarLabel();
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
          // Skip the toolbar itself
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

    // Re-apply cached translation without a service call
    if (translationCached && nodeMap.size > 0) {
      for (const [node, data] of nodeMap.entries()) {
        if (document.body.contains(node) && data.translated) {
          node.textContent = data.translated;
        }
      }
      isTranslated = true;
      setToolbarButton("Show Original");
      setToolbarStatus(messages.success, "success");
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
    } catch (e) {
      console.error("[Translator] Translation failed:", e);
      const msg = (e.message.includes("Failed to fetch") || e.message.includes("NetworkError"))
        ? messages.errorUnreachable
        : messages.error;
      setToolbarStatus(msg, "error");
      setToolbarButton("Translate");
    }

    port.postMessage({ command: "translationComplete" });
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

    // Keep nodeMap intact so the next Translate click can re-apply from cache
    isTranslated = false;
    setToolbarButton("Translate");
    setToolbarStatus("", "");
    console.log(`[Translator] Restored ${restored} nodes, ${detached} detached`);
  }

  // Only show toolbar if email language differs from target language
  function initToolbar() {
    browser.storage.local.get({ service: "ollama", ollamaTargetLang: "en", googleTargetLang: "en", libreTargetLang: "en" }).then((settings) => {
      const serviceKey = { ollama: "ollamaTargetLang", google: "googleTargetLang", libretranslate: "libreTargetLang" };
      const targetLang = settings[serviceKey[settings.service] || "ollamaTargetLang"] || "en";
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
