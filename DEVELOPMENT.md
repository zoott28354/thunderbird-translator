# Thunderbird Ollama Translator - Documentazione Sviluppo

## 📊 Stato Attuale (v1.0.0)

### ✅ Funzionamenti

- [x] Traduzione email in italiano
- [x] Menu contestuale "Traduci in italiano"
- [x] Pulsante floating azzurro nella email
- [x] Parallellizzazione della trauzione (batch da 10 blocchi)
- [x] Contesto completo (tutto il testo tradotto in una richiesta)
- [x] Toggle originale/traduzione
- [x] Impostazioni persistenti (URL e modello)
- [x] Test di connessione a Ollama
- [x] Interfaccia opzioni semplice
- [x] Toast notifications (messaggi in basso a destra)
- [x] Supporto per più servizi di traduzione (Ollama, Google Translate, LibreTranslate)
- [x] Traduzione in più lingue
- [x] Interfaccia utente localizzata

### 🔧 Architettura

```
manifest.json (v2)
├── background.js
│   ├── Menu contestuale ("Traduci in italiano")
│   ├── Script injection dinamico
│   ├── Comunicazione port-based con content script
│   ├── Richieste API a Ollama
│   └── Gestione settings (storage)
│
├── content/translator.js
│   ├── Estrazione blocchi di testo
│   ├── Pulsante floating
│   ├── Port di comunicazione
│   ├── Applicazione traduzioni al DOM
│   └── Toggle originale/tradotto
│
└── options/
    ├── options.html
    ├── options.js
    └── options.css (css inline in html)
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

## 🐛 Problemi Noti

| Problema | Soluzione | Priorità |
|----------|-----------|----------|
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
- **Content script iniettato dinamicamente** perché content_scripts statici non funzionavano
- **Una richiesta per tutta l'email** per preservare il contesto (non blocco per blocco)
- **Port-based communication** per mantenere connessione persistente tra content e background
- **localStorage locale** per evitare espensioni a cloud

## 👤 Contatti & Credits

- **Author**: giulio
- **License**: MIT
- **Created**: Febbraio 2026
- **Status**: Stable (v1.0.0)

---

**Last Updated**: 12 Febbraio 2026
