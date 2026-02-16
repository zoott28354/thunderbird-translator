"use strict";

(() => {
  // Avoid double-injection
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
    "HEADER", "FOOTER", "TR",
  ]);

  const MIN_TEXT_LENGTH = 3;

  // Storage for original/translated text per node
  const nodeMap = new Map(); // textNode -> { original, translated }

  let toastEl = null;
  let toastTimeout = null;

  // Translation messages - will be loaded from background
  let messages = {
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

  // Current target language (set by menu selection)
  let targetLanguage = null;

  port.onMessage.addListener((message) => {
    console.log("[Translator Content Script] Received message:", message.command || `id:${message.id}`, message);

    // Response with translation messages
    if (message.command === "messages") {
      messages = message.data;
      console.log("[Translator Content Script] Messages loaded");
      createTranslateButton();
      return;
    }

    // Response to a translate request
    if (message.id != null && pendingRequests.has(message.id)) {
      console.log(`[Translator Content Script] Processing translation response for id ${message.id}`);
      const { resolve, reject } = pendingRequests.get(message.id);
      pendingRequests.delete(message.id);
      if (message.success) {
        console.log(`[Translator Content Script] Translation successful, length: ${message.translated?.length || 0}`);
        resolve(message.translated);
      } else {
        console.log(`[Translator Content Script] Translation failed:`, message.error);
        reject(new Error(message.error));
      }
      return;
    } else if (message.id != null) {
      console.warn(`[Translator Content Script] Received response for unknown request id: ${message.id}`);
    }

    // Commands from background
    if (message.command === "startTranslation") {
      console.log("[Translator Content Script] Starting translation...");
      // Save target language if provided
      if (message.targetLanguage) {
        targetLanguage = message.targetLanguage;
        console.log(`[Translator Content Script] Target language set to: ${targetLanguage}`);
      }
      startTranslation();
    } else if (message.command === "toggleOriginal") {
      console.log("[Translator Content Script] Toggling original/translation");
      toggleText(message.showOriginal);
    }
  });

  // Request translation messages from background
  port.postMessage({ command: "getMessages" });

  function sendTranslateRequest(text) {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, { resolve, reject });

      // Include targetLanguage if set
      const message = { command: "translate", id, text };
      if (targetLanguage) {
        message.targetLanguage = targetLanguage;
      }

      port.postMessage(message);
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

      // Use original text if this node was previously translated
      const nodeData = nodeMap.get(textNode);
      const textToUse = nodeData && nodeData.original ? nodeData.original : textNode.textContent.trim();

      block.text += (block.text ? " " : "") + textToUse;
    }

    return Array.from(blocks.values());
  }

  // --- Translation Logic ---

  function applyTranslation(block, translatedText) {
    if (block.nodes.length === 1) {
      const node = block.nodes[0];
      const existingData = nodeMap.get(node);

      // Preserve original text if already translated before
      nodeMap.set(node, {
        original: existingData && existingData.original ? existingData.original : node.textContent,
        translated: translatedText,
      });
      node.textContent = translatedText;
    } else {
      for (let i = 0; i < block.nodes.length; i++) {
        const node = block.nodes[i];
        const existingData = nodeMap.get(node);

        // Preserve original text if already translated before
        nodeMap.set(node, {
          original: existingData && existingData.original ? existingData.original : node.textContent,
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
    console.log(`[Translator] Using ${nodeMap.size} previously translated nodes`);
    showToast(messages.translating);

    try {
      // Combine ALL text blocks into one for better context
      const allText = blocks.map(b => b.text).join("\n\n");
      console.log(`[Translator] Total text length: ${allText.length} characters`);
      console.log(`[Translator] First 100 chars to translate:`, allText.substring(0, 100));

      // Translate everything at once
      const fullTranslation = await sendTranslateRequest(allText);
      console.log(`[Translator] Got full translation (length: ${fullTranslation?.length || 0}), applying to blocks...`);
      console.log(`[Translator] First 200 chars of translation:`, fullTranslation?.substring(0, 200));

      // Split the translation back into blocks (by double newlines)
      const translatedParts = fullTranslation.split("\n\n");
      console.log(`[Translator] Split into ${translatedParts.length} parts`);

      // Apply translations to blocks
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        let translatedText = translatedParts[i]?.trim() || block.text;
        console.log(`[Translator] Applying translation to block ${i}: "${translatedText.substring(0, 50)}..."`);
        applyTranslation(block, translatedText);
      }

      console.log(`[Translator] Translation applied to ${blocks.length} blocks`);
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
