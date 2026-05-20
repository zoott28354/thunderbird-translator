"use strict";

(() => {
  if (window.__translatorComposerLoaded) return;
  window.__translatorComposerLoaded = true;

  console.log("[Composer] Content script loaded");

  const port = browser.runtime.connect({ name: "translator-composer" });
  const pendingRequests = new Map();
  let nextRequestId = 0;

  let savedSelection = "";
  let savedRange = null;

  // --- Keep selection updated ---
  // In a designMode document, selectionchange fires normally.

  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const text = sel.toString().trim();
      if (text) {
        savedSelection = text;
        savedRange = sel.getRangeAt(0).cloneRange();
      }
    }
  });

  // --- Port messages ---

  port.onMessage.addListener(async (message) => {
    // Translate API response
    if (message.id != null && pendingRequests.has(message.id)) {
      const { resolve, reject } = pendingRequests.get(message.id);
      pendingRequests.delete(message.id);
      if (message.success) resolve(message.translated);
      else reject(new Error(message.error));
      return;
    }

    // Translate selection command from popup (via background)
    if (message.command === "doTranslateSelection") {
      if (!savedSelection || !savedRange) {
        port.postMessage({
          command: "translateSelectionDone",
          reqId: message.reqId,
          success: false,
          error: "No text selected — highlight text in the email body first",
        });
        return;
      }

      try {
        const translated = await sendTranslateRequest(savedSelection);

        // Restore selection and replace in-place (execCommand preserves undo)
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
        document.execCommand("insertText", false, translated);

        savedSelection = "";
        savedRange = null;

        port.postMessage({ command: "translateSelectionDone", reqId: message.reqId, success: true });
      } catch (e) {
        port.postMessage({
          command: "translateSelectionDone",
          reqId: message.reqId,
          success: false,
          error: e.message,
        });
      }
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

  console.log("[Composer] Ready");
})();
