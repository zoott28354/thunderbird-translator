"use strict";

(() => {
  // Avoid double-injection
  if (window.__ollamaTranslatorLoaded) return;
  window.__ollamaTranslatorLoaded = true;

  console.log("[Translator Content Script] Loaded");

  const SKIP_TAGS = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "IFRAME", "OBJECT", "EMBED",
    "SVG", "MATH", "CODE", "PRE", "TEXTAREA", "INPUT",
  ]);

  const BLOCK_TAGS = new Set([
    "P", "DIV", "TD", "TH", "LI", "H1", "H2", "H3", "H4", "H5", "H6",
    "BLOCKQUOTE", "CAPTION", "DT", "DD", "FIGCAPTION", "ARTICLE", "SECTION",
    "HEADER", "FOOTER", "TR",
  ]);

  const MIN_TEXT_LENGTH = 3;

  // Storage for original/translated text per node
  const nodeMap = new Map(); // textNode -> { original, translated }

  let toastEl = null;
  let toastTimeout = null;

  // Translation messages - will be loaded from background
  let messages = {
    "translateButton": "🌐 Translate",
    "noText": "No text to translate",
    "translating": "Translating...",
    "success": "Translation complete!",
    "errorUnreachable": "Error: Server unreachable",
    "error": "Translation error"
  };

  // --- Port to background ---

  const port = browser.runtime.connect({ name: "translator" });
  console.log("[Translator Content Script] Connecting to background...");

  // Pending translation requests: id -> { resolve, reject }
  const pendingRequests = new Map();
  let nextRequestId = 0;

  port.onMessage.addListener((message) => {
    console.log("[Translator Content Script] Received message:", message.command || message.id);
    
    // Response with translation messages
    if (message.command === "messages") {
      messages = message.data;
      console.log("[Translator Content Script] Messages loaded");
      createTranslateButton();
      return;
    }

    // Response to a translate request
    if (message.id != null && pendingRequests.has(message.id)) {
      const { resolve, reject } = pendingRequests.get(message.id);
      pendingRequests.delete(message.id);
      if (message.success) {
        resolve(message.translated);
      } else {
        reject(new Error(message.error));
      }
      return;
    }

    // Commands from background
    if (message.command === "startTranslation") {
      console.log("[Translator Content Script] Starting translation...");
      startTranslation();
    } else if (message.command === "toggleOriginal") {
      console.log("[Translator Content Script] Toggling original/translation");
      toggleText(message.showOriginal);
    }
  });

  // Request translation messages from background
  port.postMessage({ command: "getMessages" });

  // Create button when DOM is ready
  if (document.body) {
    createTranslateButton();
  } else {
    document.addEventListener("DOMContentLoaded", createTranslateButton);
  }

  function sendTranslateRequest(text) {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, { resolve, reject });
      port.postMessage({ command: "translate", id, text });
    });
  }

  // --- Toast Overlay ---

  function createToast() {
    if (toastEl) return toastEl;
    toastEl = document.createElement("div");
    toastEl.id = "ollama-translator-toast";
    toastEl.className = "ollama-toast";
    document.body.appendChild(toastEl);
    return toastEl;
  }

  function showToast(text, autoHide = false) {
    const toast = createToast();
    toast.textContent = text;
    toast.classList.add("ollama-toast-visible");
    toast.classList.remove("ollama-toast-hidden");

    if (toastTimeout) {
      clearTimeout(toastTimeout);
      toastTimeout = null;
    }

    if (autoHide) {
      toastTimeout = setTimeout(() => {
        toast.classList.remove("ollama-toast-visible");
        toast.classList.add("ollama-toast-hidden");
      }, 2000);
    }
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
    const blocks = new Map(); // blockElement -> { id, text, nodes[] }
    let blockId = 0;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          let parent = node.parentElement;
          while (parent) {
            if (SKIP_TAGS.has(parent.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            parent = parent.parentElement;
          }

          const text = node.textContent.trim();
          if (text.length < MIN_TEXT_LENGTH) {
            return NodeFilter.FILTER_REJECT;
          }

          if (!isVisible(node)) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    while (walker.nextNode()) {
      const textNode = walker.currentNode;
      const blockParent = getBlockParent(textNode);

      if (!blocks.has(blockParent)) {
        blocks.set(blockParent, {
          id: blockId++,
          text: "",
          nodes: [],
        });
      }

      const block = blocks.get(blockParent);
      block.nodes.push(textNode);
      block.text += (block.text ? " " : "") + textNode.textContent.trim();
    }

    return Array.from(blocks.values());
  }

  // --- UI Button for Translation ---

  function createTranslateButton() {
    if (document.getElementById("ollama-translate-btn")) {
      return; // Already exists
    }

    const btn = document.createElement("button");
    btn.id = "ollama-translate-btn";
    btn.className = "ollama-translate-btn";
    btn.textContent = messages.translateButton;
    btn.style.cssText = `
      position: fixed;
      top: 60px;
      right: 20px;
      padding: 8px 16px;
      background: #0060df;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    btn.addEventListener("click", () => {
      console.log("[Translator] Translate button clicked");
      startTranslation();
    });

    btn.addEventListener("mouseover", () => {
      btn.style.background = "#003eaa";
    });

    btn.addEventListener("mouseout", () => {
      btn.style.background = "#0060df";
    });

    document.body.appendChild(btn);
    console.log("[Translator] Translate button added to page");
  }

  // Create button immediately and also when page loads
  createTranslateButton();
  window.addEventListener("load", createTranslateButton);

  // --- Translation Logic ---

  function applyTranslation(block, translatedText) {
    if (block.nodes.length === 1) {
      const node = block.nodes[0];
      nodeMap.set(node, {
        original: node.textContent,
        translated: translatedText,
      });
      node.textContent = translatedText;
    } else {
      for (let i = 0; i < block.nodes.length; i++) {
        const node = block.nodes[i];
        nodeMap.set(node, {
          original: node.textContent,
          translated: i === 0 ? translatedText : "",
        });
        node.textContent = i === 0 ? translatedText : "";
      }
    }
  }

  async function startTranslation() {
    const blocks = extractTextBlocks();

    if (blocks.length === 0) {
      showToast(messages.noText, true);
      return;
    }

    console.log(`[Translator] Starting translation of ${blocks.length} blocks`);
    showToast(messages.translating);

    try {
      // Combine ALL text blocks into one for better context
      const allText = blocks.map(b => b.text).join("\n\n");
      console.log(`[Translator] Total text length: ${allText.length} characters`);

      // Translate everything at once
      const fullTranslation = await sendTranslateRequest(allText);
      console.log(`[Translator] Got full translation, applying to blocks...`);

      // Split the translation back into blocks (by double newlines)
      const translatedParts = fullTranslation.split("\n\n");

      // Apply translations to blocks
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        let translatedText = translatedParts[i]?.trim() || block.text;
        applyTranslation(block, translatedText);
      }

      showToast(messages.success, true);
    } catch (e) {
      console.error("[Translator] Translation failed:", e);
      if (e.message.includes("Failed to fetch") || e.message.includes("NetworkError")) {
        showToast(messages.errorUnreachable, true);
      } else {
        showToast(messages.error, true);
      }
      return;
    }

    // Notify background that translation is complete (for toggle menu)
    port.postMessage({ command: "translationComplete" });
  }

  // --- Toggle Original / Translation ---

  function toggleText(showOriginal) {
    for (const [node, texts] of nodeMap) {
      node.textContent = showOriginal ? texts.original : texts.translated;
    }
  }
})();
