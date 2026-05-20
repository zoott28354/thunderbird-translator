"use strict";

(() => {
  if (window.__ollamaTranslatorLoaded) return;
  window.__ollamaTranslatorLoaded = true;

  console.log("[Translator] Content script loaded");

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
  let isTranslated = false;
  let translationCached = false;

  // --- Port to background ---

  const port = browser.runtime.connect({ name: "translator" });
  const pendingRequests = new Map();
  let nextRequestId = 0;

  port.onMessage.addListener(async (message) => {
    // Translate API response
    if (message.id != null && pendingRequests.has(message.id)) {
      const { resolve, reject } = pendingRequests.get(message.id);
      pendingRequests.delete(message.id);
      if (message.success) resolve(message.translated);
      else reject(new Error(message.error));
      return;
    }

    // Commands from popup (via background)
    if (message.command === "doTranslate") {
      const result = await startTranslation();
      port.postMessage({ command: "translateDone", reqId: message.reqId, isTranslated, ...result });
      return;
    }
    if (message.command === "doRevert") {
      reloadPage();
      port.postMessage({ command: "revertDone", reqId: message.reqId, isTranslated: false, success: true });
      return;
    }
    if (message.command === "getState") {
      port.postMessage({ command: "stateDone", reqId: message.reqId, isTranslated, success: true });
      return;
    }
  });

  function sendTranslateRequest(text) {
    return new Promise((resolve, reject) => {
      const id = nextRequestId++;
      pendingRequests.set(id, { resolve, reject });
      port.postMessage({ command: "translate", id, text });
    });
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
          nodeTranslation += "\n" + translatedLines.slice(block.nodes.length).join("\n");
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
    const fullTranslation = await sendTranslateRequest(allText);
    const translatedParts = fullTranslation.split("\n\n");
    for (let i = 0; i < blocks.length; i++) {
      applyTranslation(blocks[i], translatedParts[i]?.trim() || blocks[i].text);
    }
  }

  async function startTranslation() {
    // Use cache if available
    if (translationCached && nodeMap.size > 0) {
      for (const [node, data] of nodeMap.entries()) {
        if (document.body.contains(node) && data.translated) {
          node.textContent = data.translated;
        }
      }
      isTranslated = true;
      return { success: true };
    }

    const blocks = extractTextBlocks();
    if (blocks.length === 0) return { success: false, error: "No text to translate" };

    try {
      const preBlocks    = blocks.filter(b => b.nodes[0]?.parentElement?.tagName === "PRE");
      const nonPreBlocks = blocks.filter(b => !preBlocks.includes(b));
      for (const block of preBlocks) await translateNodeByNode(block);
      if (nonPreBlocks.length > 0) await translateByBlocks(nonPreBlocks);
      isTranslated = true;
      translationCached = true;
      return { success: true };
    } catch (e) {
      const msg = (e.message.includes("Failed to fetch") || e.message.includes("NetworkError"))
        ? "Server unreachable"
        : e.message;
      return { success: false, error: msg };
    }
  }

  function reloadPage() {
    for (const [node, data] of nodeMap.entries()) {
      try {
        if (document.body.contains(node)) node.textContent = data.original;
      } catch (e) {
        console.error("[Translator] Error restoring node:", e);
      }
    }
    isTranslated = false;
  }

  console.log("[Translator] Ready");
})();
