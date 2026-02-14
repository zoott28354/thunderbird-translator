# Thunderbird Ollama Translator #

Un addon per Thunderbird che traduce le email in italiano usando un'istanza locale di Ollama.

## 🚀 Caratteristiche

- **Traduzione locale** - Non invia dati online, tutto rimane sul tuo PC
- **Supporta tutti i modelli Ollama** - Llama, Mistral, Neural Chat, ecc.
- **Supporta diversi servizi di traduzione** - Ollama, Google Translate, LibreTranslate
- **Traduzione in più lingue** - Non solo italiano, ma anche English, Español, Français, Deutsch, e altre
- **Interfaccia semplice** - Fai clic destro sulla email e seleziona "Traduci in italiano"
- **Pulsante veloce** - Alternativa al menu contestuale
- **Toggle** - Passa facilmente tra testo originale e tradotto
- **Impostazioni persistenti** - Le tue configurazioni si salvano automaticamente
- **Interfaccia multilingue** - L'addon è disponibile in 7 lingue: 🇮🇹 Italiano, 🇬🇧 English, 🇩🇪 Deutsch, 🇫🇷 Français, 🇪🇸 Español, 🇵🇹 Português, 🇷🇺 Русский (si adatta automaticamente alla lingua di Thunderbird)

## 📋 Requisiti

### Per usare Ollama (locale, più privato)

1. **Ollama** - Installato e in esecuzione sul tuo PC
   - Scarica da: https://ollama.ai
   - Deve essere in esecuzione sulla porta `11434` (default)

2. **⚠️ CONFIGURAZIONE OBBLIGATORIA - OLLAMA_ORIGINS**

   **Perché è necessario?**
   Per motivi di sicurezza, Ollama blocca le richieste da estensioni browser. Devi configurare la variabile d'ambiente `OLLAMA_ORIGINS="*"` per permettere all'addon di comunicare con Ollama.

   **Come configurarlo:**

   **Windows PowerShell (temporaneo - solo per la sessione corrente):**
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ollama serve
   ```

   **Windows PowerShell (permanente):**
   ```powershell
   # Imposta la variabile d'ambiente permanentemente
   [System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')

   # Riavvia Ollama
   ollama serve
   ```

   **Linux/Mac (temporaneo):**
   ```bash
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

   **Linux/Mac (permanente - aggiungi al tuo ~/.bashrc o ~/.zshrc):**
   ```bash
   echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc
   source ~/.bashrc
   ollama serve
   ```

   **⚠️ Nota sulla sicurezza:**
   `OLLAMA_ORIGINS="*"` permette a qualsiasi origine di accedere a Ollama. Se preferisci maggiore sicurezza, puoi specificare solo l'estensione:
   ```bash
   OLLAMA_ORIGINS="moz-extension://*"
   ```

3. **Un modello Ollama** - Scaricato e caricato
   - **Raccomandato**: `ollama pull translategemma` (3GB, ottimizzato per traduzioni)
   - Alternative: `ollama pull llama3.2` o `ollama pull mistral`

4. **Thunderbird** - Versione 128 o superiore

### Per usare Google Translate o LibreTranslate (online, gratuiti)

- **Nessun requisito** - Funzionano immediatamente
- **Connessione internet** richiesta
- Google Translate: API non ufficiale (gratuita ma potrebbe avere limiti)
- LibreTranslate: Istanza pubblica gratuita (translate.fedilab.app)

## 📦 Installazione

### Metodo 1: File XPI (Raccomandato)

1. **Scarica** il file `thunderbird-ollama-translator.xpi`
2. **Apri Thunderbird**
3. Vai a **Menu > Tools > Add-ons**
4. Clicca l'engranaggio ⚙️ in alto a destra
5. Seleziona **"Install Add-on from file..."**
6. Seleziona il file `.xpi`
7. Confema l'installazione

### Metodo 2: Da Cartella (Sviluppo)

1. Estrai i file in una cartella
2. Apri Thunderbird
3. Premi **Ctrl+Shift+A** (oppure da Menu > Tools > Add-ons)
4. Clicca l'engranaggio ⚙️
5. Seleziona **"Debug Add-ons"**
6. Clicca **"Load Temporary Add-on..."**
7. Seleziona il file `manifest.json` dalla cartella

## ⚙️ Configurazione Iniziale

1. **Apri le impostazioni dell'addon**:
   - Vai a **Menu > Tools > Add-ons**
   - Cerca "Ollama Translator"
   - Clicca su **"Preferences"**

2. **Scegli il servizio di traduzione**:
   - **Ollama** (locale, privato) - Richiede installazione
   - **Google Translate** (online, gratuito) - Funziona subito
   - **LibreTranslate** (online, open-source) - Funziona subito

3. **Scegli la lingua di destinazione**:
   - Italiano, English, Español, Français, Deutsch, Português, Русский, 日本語, 中文, 한국어

### Se usi Ollama:

4. **⚠️ PRIMO PASSO OBBLIGATORIO - Configura OLLAMA_ORIGINS**:

   **Prima** di usare l'addon con Ollama, devi configurare questa variabile d'ambiente (vedi sezione "Requisiti" sopra per istruzioni dettagliate).

   Verifica rapida - apri PowerShell/Terminal:
   ```bash
   # Windows PowerShell:
   $env:OLLAMA_ORIGINS="*"
   ollama serve

   # Linux/Mac:
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

   **Senza questa configurazione, riceverai l'errore "403 Forbidden"!**

5. **Inserisci l'URL di Ollama**:
   - Default: `http://localhost:11434`
   - Se Ollama è su un'altra macchina, usa il suo IP

6. **Testa la connessione**:
   - Clicca **"Test connessione"**
   - Se va bene, vedrai il numero di modelli disponibili

7. **Seleziona il modello**:
   - **Raccomandato**: `translategemma` (ottimizzato per traduzioni, veloce)
   - Alternative veloci: `llama3.2`, `mistral`
   - Alternative accurate: `llama2`, `neural-chat`

8. **Salva**:
   - Clicca **"Salva"**

## 🎯 Come Usare

### Menu Contestuale (Raccomandato)
1. **Apri una email** che vuoi tradurre
2. **Fai clic destro** sul corpo del testo
3. **Scegli il servizio** di traduzione:
   - **"Traduci con Ollama"** → Traduzione locale e privata (richiede Ollama installato)
   - **"Traduci con Google Translate"** → Traduzione online gratuita
   - **"Traduci con LibreTranslate"** → Traduzione online open-source
4. **Seleziona la lingua** di destinazione dal sottomenu
   - La lingua selezionata apparirà in **grassetto**
   - Questa scelta diventa il default per quel servizio
5. Attendi il messaggio "Traduzione completata"

**Esempio**: Se selezioni "Traduci con Google Translate > Español", tutte le successive traduzioni con Google Translate saranno in spagnolo (finché non scegli un'altra lingua).

### Metodo Alternativo: Pulsante Veloce
1. **Apri una email**
2. Guarda l'**angolo in alto a destra** della email
3. Clicca il **pulsante blu** 🌐 **"Translate"**
4. Verrà usato il servizio e la lingua configurati nelle impostazioni

### Toggle Originale/Traduzione
- Dopo la traduzione, fai **clic destro** sul testo
- Seleziona **"Mostra originale"** per vedere il testo originale
- Seleziona di nuovo **"Mostra traduzione"** per tornare alla traduzione

## 🔒 Sicurezza

### ✅ Cosa è Sicuro
- **Nessun dato inviato online** - Tutto viene elaborato localmente da Ollama
- **Connection locale** - Comunica solo con `localhost:11434`
- **Nessuna traccia** - Non ci sono statistiche, tracking o log remoti
- **Nessuna credenziale** - Non salva password o informazioni sensibili
- **Permessi minimi** - Accede solo al testo della email per tradurre

### 🛡️ Permessi Richiesti
- `messagesRead` - Legge il contenuto della email (per tradurre)
- `messagesModify` - Modifica il testo visualizzato (per mostrare la traduzione)
- `menus` - Aggiunge il menu contestuale
- `storage` - Salva le impostazioni
- `tabs` - Inietta lo script nella email
- **Host permissions** (solo se usi Google Translate o LibreTranslate):
  - `https://translate.google.com/*` - API Google Translate
  - `https://translate.fedilab.app/*` - Istanza LibreTranslate
  - `http://localhost/*` - Per Ollama locale

Nessun accesso a:
- ❌ Rubrica, calendario, chat
- ❌ Account credentials
- ❌ Database Thunderbird
- ❌ File system (eccetto localhost per Ollama)

## 🚨 Troubleshooting

### Il menu "Traduci in [lingua]" non appare
- Ricarica l'addon: Menu > Tools > Add-ons > Ollama Translator > Ricarica
- Prova un'altra email
- Controlla che l'addon sia abilitato

### "Errore: Ollama error: 403 Forbidden" ⚠️

**CAUSA**: Ollama blocca le richieste dalle estensioni browser per motivi di sicurezza.

**SOLUZIONE COMPLETA**:

1. **Ferma Ollama** se è in esecuzione (Ctrl+C nel terminale dove gira `ollama serve`)

2. **Configura la variabile d'ambiente**:

   **Windows PowerShell (permanente - RACCOMANDATO):**
   ```powershell
   # Imposta variabile d'ambiente permanente
   [System.Environment]::SetEnvironmentVariable('OLLAMA_ORIGINS', '*', 'User')

   # Verifica che sia impostata
   [System.Environment]::GetEnvironmentVariable('OLLAMA_ORIGINS', 'User')
   # Dovrebbe mostrare: *
   ```

   **Windows PowerShell (temporaneo - solo questa sessione):**
   ```powershell
   $env:OLLAMA_ORIGINS="*"
   ```

   **Linux/Mac (permanente - RACCOMANDATO):**
   ```bash
   echo 'export OLLAMA_ORIGINS="*"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Riavvia Ollama**:
   ```bash
   ollama serve
   ```

4. **Verifica la configurazione**:
   - Apri Thunderbird
   - Vai nelle impostazioni dell'addon
   - Clicca "Test connessione"
   - Dovrebbe mostrare "Connessione riuscita: X modelli disponibili"

**Nota**: Se usi `moz-extension://*` invece di `*`, funzionerà solo per le estensioni Firefox/Thunderbird (più sicuro).

### "Errore: Ollama non raggiungibile"
- Avvia Ollama: `ollama serve`
- Verifica che sia sulla porta 11434: `curl http://localhost:11434/api/tags`
- Controlla l'URL nelle impostazioni

### Google Translate non traduce tutto il testo
- **RISOLTO** nella versione corrente (concatena tutti i segmenti)
- Se il problema persiste, ricarica l'addon

### La prima traduzione funziona ma le successive no
- **RISOLTO** nella versione corrente (preserva testo originale)
- Il bug è stato corretto nel commit più recente

### LibreTranslate da errore "API key required"
- **RISOLTO** nella versione corrente (usa istanza gratuita fedilab.app)
- L'addon prova automaticamente 3 istanze diverse

### La traduzione è lenta (solo Ollama)
- Verifica che il modello sia completamente caricato in memoria
- Modelli veloci: translategemma (~3GB), llama3.2, mistral (~4GB)
- Modelli lenti: llama2, neural-chat (~7GB+)

### La traduzione non è accurata
- Prova un servizio diverso (Google Translate è molto accurato)
- Per Ollama: prova un modello diverso
- **Raccomandato**: `translategemma` (specializzato per traduzioni)
- Alternative: `llama3.2`, `neural-chat`

## 📊 Performance

- **Email corta** (~5KB): 5-10 secondi
- **Email media** (~50KB): 20-40 secondi
- **Email lunga** (~500KB): 2-5 minuti

*I tempi dipendono dal modello e dalla velocità di lettura/scrittura del disco.*

## 🔧 Per Sviluppatori

### Disabilitare i log di debug
Se vuoi una versione più "pulita" senza i messaggi `[Translator]` nella console:
1. Apri `background.js` e `content/translator.js`
2. Rimuovi le righe con `console.log("[Translator]"`

### Cambiare il modello di default
Nel file `background.js`, modifica:
```javascript
const DEFAULT_MODEL = "llama3.2";  // Cambia qui
```

### Personalizzare il prompt di traduzione
Nel file `background.js`, modifica:
```javascript
const TRANSLATE_PROMPT = `Translate the following text to Italian. ...`;
```

## 📝 Licenza

MIT License - Libero di usare, modificare e distribuire.

## 🤝 Supporto

Se hai problemi:
1. **Apri la console** (Ctrl+Shift+I in una scheda Thunderbird)
2. **Fai clic destro** sulla email > Traduci in italiano
3. **Guarda i messaggi blu** `[Translator]` nella console
4. **Copia i messaggi di errore** e condividili

---

**Buona traduzione!** 🎉
