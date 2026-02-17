# Thunderbird Ollama Translator - Documentazione Sviluppo

## 📊 Stato Attuale (v2.0.0)

### ✅ Funzionalità Implementate

- [x] **Servizi di traduzione multipli**:
  - [x] Ollama (locale, privato)
  - [x] Google Translate (online, gratuito)
  - [x] LibreTranslate (online, open-source)
- [x] **Traduzione multilingua** (10 lingue supportate)
- [x] **Interfaccia multilingue** (7 lingue): 🇮🇹 IT, 🇬🇧 EN, 🇩🇪 DE, 🇫🇷 FR, 🇪🇸 ES, 🇵🇹 PT, 🇷🇺 RU
- [x] **Menu contestuale per servizio** - 3 menu parent separati (Ollama, Google, LibreTranslate)
- [x] **Lingua indipendente per servizio** - Ogni servizio ricorda la propria lingua target
- [x] **Evidenziazione grassetto** - Lingua selezionata mostrata in bold nel menu
- [x] Pulsante floating azzurro nella email
- [x] Contesto completo (tutto il testo tradotto in una richiesta)
- [x] Toggle originale/traduzione
- [x] Impostazioni persistenti (servizio, URL, modello, lingua per servizio)
- [x] Test di connessione a Ollama
- [x] Interfaccia opzioni avanzata
- [x] Toast notifications (messaggi in basso a destra)
- [x] Interfaccia utente localizzata (en, it, de)
- [x] **Traduzioni multiple** - Preserva testo originale tra traduzioni successive
- [x] **CORS permissions** - Accesso a servizi esterni configurato correttamente
- [x] **Logging dettagliato** - Per debugging e sviluppo

### 🔧 Architettura

```
manifest.json (v2)
├── permissions: messagesRead, messagesModify, menus, storage, tabs
├── host_permissions: localhost, translate.google.com, translate.fedilab.app, etc.
│
├── background.js
│   ├── Menu contestuale per servizio (3 parent menu separati)
│   │   ├── "Traduci con Ollama" → 10 lingue (ollamaTargetLang)
│   │   ├── "Traduci con Google Translate" → 10 lingue (googleTargetLang)
│   │   └── "Traduci con LibreTranslate" → 10 lingue (libreTargetLang)
│   ├── Evidenziazione bold per lingua selezionata per servizio
│   ├── Script injection dinamico
│   ├── Comunicazione port-based con content script
│   ├── Richieste API:
│   │   ├── translateWithOllama() → localhost:11434
│   │   ├── translateWithGoogle() → translate.google.com (concatena segmenti multipli)
│   │   └── translateWithLibreTranslate() → fallback multi-instance (fedilab.app, etc.)
│   ├── Gestione settings (storage con lingua per servizio)
│   ├── Internazionalizzazione (i18n messages)
│   └── Logging dettagliato
│
├── content/translator.js
│   ├── Estrazione blocchi di testo (extractTextBlocks)
│   ├── NodeMap preservation (preserva testo originale)
│   ├── Pulsante floating
│   ├── Port di comunicazione
│   ├── Applicazione traduzioni al DOM (applyTranslation)
│   ├── Toggle originale/tradotto
│   └── Logging dettagliato
│
├── options/
│   ├── options.html (UI con service selector, language selector)
│   ├── options.js (load models, test connection, save settings)
│   └── options.css (css inline in html)
│
└── _locales/
    ├── en/messages.json
    ├── it/messages.json
    └── de/messages.json
```

### 📡 Flusso Dati

1. User clicca "Traduci" → Menu onClicked
2. Background inietta `translator.js` nella tab
3. Content script si connette con `runtime.connect()`
4. Background inietta comando `startTranslation`
5. Content script estrae bloochi di testo
6. Combina tutto il testo
7. Manda a Ollama in UNA richiesta (per contesto)
8. Riceve traduzione
9. Divide per blocchi e applica al DOM
10. Mostra toast "Traduzione completata"

## 🚀 Possibili Miglioramenti Futuri

### Priority 1: Esperienze Utente

- [ ] **Barra di progresso reale** - Mostrare % completamento (non solo "Traduzione in corso...")
- [ ] **Cancellazione traduzione mid-process** - Bottone stop durante la traduzione
- [ ] **Tasto scorciatoia keyboard** - Es. Ctrl+Alt+T per tradurre
- [ ] **Auto-traduzione** - Opzione per tradurre automaticamente quando apri un'email
- [ ] **Traduci solo il corpo** - Opzione per non tradurre subject/headers

### Priority 2: Funzionalità

- [ ] **Altre lingue** - Permettere di scegliere la lingua di destinazione (non solo italiano)
- [ ] **Traduzione in tempo reale** - Mentre scrivi una risposta
- [ ] **Memoria traduzioni** - Cache per non ritradurre lo stesso testo
- [ ] **Storico traduzioni** - Log di cosa è stato tradotto
- [ ] **Suggerimenti di modelli** - Raccomandare il modello migliore per velocità/accuratezza

### Priority 3: Performance

- [ ] **Streaming delle risposte** - Iniziare a mostrare il testo mentre Ollama risponde
- [ ] **Compressione del testo** - Rimuovere spazi extra prima di mandare a Ollama
- [ ] **Worker thread** - Estrarre testo in un web worker per non bloccare
- [ ] **Cache locale** - Salvare traduzioni frequenti

### Priority 4: Developer Experience

- [ ] **Test automatizzati** - Unit test per funzioni critiche
- [ ] **Build tool** - Script per creare il .xpi automaticamente
- [ ] **Logging strutturato** - Livelli di log (debug, info, error)
- [ ] **Type checking** - Aggiungere JSDoc o TypeScript

## 🔑 Key Code Locations

### Cambaire URL Ollama Default
**File**: `background.js:3`
```javascript
const DEFAULT_OLLAMA_URL = "http://localhost:11434";
```

### Cambiare Prompt di Traduzione
**File**: `background.js:6-13`
```javascript
const TRANSLATE_PROMPT = `Translate the following text to Italian. ...`;
```

### Cambiare Contesti del Menu
**File**: `background.js:25-31`
```javascript
messenger.menus.create({
  id: "translate-italian",
  title: "Traduci in italiano",
  contexts: ["all"],  // ← Cambiare qui
});
```

### Estrazione Testo e Setup Blocchi
**File**: `content/translator.js:100-170`
```javascript
function extractTextBlocks() { ... }
```

### Logica Traduzione
**File**: `content/translator.js:220-285`
```javascript
async function startTranslation() { ... }
```

### Stile Pulsante Floating
**File**: `content/translator.js:173-195`
```javascript
btn.style.cssText = `...`  // ← Modificare CSS qui
```

## 🐛 Problemi Risolti (v2.0.0)

| Problema | Stato | Commit |
|----------|-------|--------|
| CORS errors per Google/LibreTranslate | ✅ RISOLTO | 20bec9a |
| Google Translate parsava solo primo segmento | ✅ RISOLTO | 20bec9a |
| LibreTranslate richiedeva API key | ✅ RISOLTO | 20bec9a |
| Traduzioni multiple non funzionavano | ✅ RISOLTO | 20bec9a |
| Ollama 403 Forbidden | ✅ RISOLTO (docs) | 20bec9a |
| Menu contestuale hardcoded in italiano | ✅ RISOLTO | 29d5498 |
| Interfaccia solo in 3 lingue | ✅ RISOLTO | 29d5498 |
| **Email plain text non tradotte** | ✅ RISOLTO | 9086524 / eb41d79 |
| **Link tradotti da Ollama (output errato)** | ✅ RISOLTO | 3402f89 / 6ec704f |
| **Menu "Mostra originale" con caratteri strani** | ✅ RISOLTO | 64b2e34 / ba62dd9 |
| **"Mostra originale" mostra header raw email** | ✅ RISOLTO | 9cd60fa / 010d5a0 |

### Dettagli Fix Recenti (Febbraio 2026)

#### Plain Text Email Detection (9086524 / eb41d79)
- **Problema**: Email `Content-Type: text/plain` (es. GitHub notifications) non venivano tradotte correttamente. Il testo veniva duplicato o mancante.
- **Root Cause**: Condizione di rilevamento `blocks.length === 1` falliva perché Thunderbird include header email come blocchi separati. Le email plain text hanno 9 blocchi (header + contenuto), non 1.
- **Soluzione**: Rilevare blocchi tramite `parent.tagName === 'PRE'` invece di contare blocchi totali. Strategia ibrida:
  - Blocchi con parent PRE → `translateNodeByNode()` (preserva paragrafi)
  - Blocchi HTML → `translateByBlocks()` (performance)

#### Link Translation Skip (3402f89 / 6ec704f)
- **Problema**: URL come `https://github.com/settings/tokens` venivano inviati a Ollama, che restituiva le istruzioni del prompt invece della traduzione.
- **Root Cause**: Nodi con parent `<A>` non erano filtrati. Ollama si confondeva ricevendo URL come testo da tradurre.
- **Soluzione**: Skippa nodi con `parent.tagName === 'A'` o che matchano regex `/^https?:\/\/[^\s]+$/` in `translateNodeByNode()`.

#### Menu i18n API (64b2e34 / ba62dd9)
- **Problema**: Menu "Mostra originale" mostrava caratteri strani invece del testo localizzato.
- **Root Cause**: Usava `browser.i18n.getMessage()` invece di `messenger.i18n.getMessage()`. Thunderbird usa `messenger.*` APIs.
- **Soluzione**: Replace globale `browser.i18n` → `messenger.i18n` per consistenza.

#### Show Original Text Restoration (9cd60fa / 010d5a0)
- **Problema**: Click su "Mostra originale" mostrava header MIME raw (`X-Mozilla-Status: 0001`, `Delivered-To`, etc.) invece dell'email formattata.
- **Root Cause**: `location.reload()` in Thunderbird message display ricarica il sorgente raw `.eml` invece di re-renderizzare HTML/plain text.
- **Soluzione**: Invece di reload, ripristinare direttamente dal `nodeMap`:
  ```javascript
  for (const [node, data] of nodeMap.entries()) {
    if (document.body.contains(node)) {
      node.textContent = data.original;
    }
  }
  nodeMap.clear();
  ```
  Vantaggi: Istantaneo, preserva scroll, nessun header raw, preserva layout.

## 🐛 Problemi Noti (da risolvere)

| Problema | Soluzione Proposta | Priorità |
|----------|-------------------|----------|
| Email lunghe (>1MB) | Aumentare timeout Ollama | Bassa |
| Modelli lenti bloccano la UI | Usare worker thread | Media |
| Toast a volte non appare | Aggiungere fallback HTML | Bassa |
| Cache del modello non gestito | Aggiungere cleanup schedule | Bassa |

## 🧪 Testing Manuale

### Checklist Pre-Release

- [ ] Email in inglese si traduce correttamente
- [ ] Toggle originale/traduzione funziona
- [ ] Impostazioni si salvano tra sessioni
- [ ] Test connessione dice "Connessione riuscita"
- [ ] Disconnettere Ollama → mostra "Ollama non raggiungibile"
- [ ] Email con HTML complesso si traduce
- [ ] Email con attachments non si rompe
- [ ] Cambire modello dai settings → usa nuovo modello

### Test Stress

```
- Email con 100+ blocchi di testo
- Email con link e formattazione
- Email in formato HTML puro
- Tradurre 5 email di seguito
- Cambirare modello durante traduzione
```

## 📦 Build & Release

### Per Creare il .xpi

```bash
# 1. Rimuovi file di debug
rm DEBUG.md
rm -rf .claude/

# 2. Crea ZIP
zip -r thunderbird-ollama-translator.xpi \
  background.js \
  manifest.json \
  README.md \
  content/ \
  icons/ \
  options/

# 3. Rinomina (facoltativo, è già .xpi)
```

### Versionamento

- **Manifest**: `manifest.json:4`
- **Formato**: `MAJOR.MINOR.PATCH`
- **Change**: Aggiorna versione prima di creare .xpi

## 📚 Dipendenze Esterne

| Dipendenza | Versione | Uso |
|------------|----------|-----|
| Ollama API | variabile | Traduzione |
| Thunderbird | >=128.0 | Runtime |
| browser API | v2 | Menu, storage, tab |

**Nessuna dipendenza NPM** - Pure vanilla JavaScript.

## 🔮 Vision Futura

Se il progetto cresce:
1. Aggiungere linguaggi di destinazione (non solo italiano)
2. Supportare più provider AI (non solo Ollama)
3. Creare estensione anche per Firefox
4. Aggiungere plugin per altri client email (Mutt, Kmail)
5. Web version per webmail (Gmail, Outlook)

## 📝 Note Importanti

- **Manifest v2** usato perché Thunderbird 128 non supporta v3
- **Host permissions** richieste esplicitamente nell'array `permissions` (MV2), non in `host_permissions` separato (MV3)
- **Content script iniettato dinamicamente** perché content_scripts statici non funzionavano
- **Una richiesta per tutta l'email** per preservare il contesto (non blocco per blocco)
- **Port-based communication** per mantenere connessione persistente tra content e background
- **localStorage locale** per evitare estensioni a cloud
- **Google Translate parsing**: Concatena array multipli (`data[0]`) perché Google divide testi lunghi in segmenti
- **LibreTranslate fallback**: Sistema multi-instance per resilienza (fedilab.app → libretranslate.com → argosopentech.com)
- **NodeMap preservation**: `extractTextBlocks()` usa sempre testo originale da `nodeMap` per traduzioni successive
- **OLLAMA_ORIGINS**: Necessario configurare `OLLAMA_ORIGINS="*"` per permettere richieste da estensioni browser
- **Storage per servizio**: Ogni servizio ha la propria lingua target salvata (ollamaTargetLang, googleTargetLang, libreTargetLang)
- **Menu HTML bold**: Usa tag `<b>` nei titoli menu per evidenziare lingua selezionata (supportato da Thunderbird menus API)

## 👤 Contatti & Credits

- **Author**: giulio
- **License**: MIT
- **Created**: Febbraio 2026
- **Status**: Stable (v2.0.0)

---

**Last Updated**: 14 Febbraio 2026 (v2.0.0 - menu per servizio, fix settings, translategemma default)
