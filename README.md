# Thunderbird Ollama Translator

Un addon per Thunderbird che traduce le email in italiano usando un'istanza locale di Ollama.

## 🚀 Caratteristiche

- **Traduzione locale** - Non invia dati online, tutto rimane sul tuo PC
- **Supporta tutti i modelli Ollama** - Llama, Mistral, Neural Chat, ecc.
- **Interfaccia semplice** - Fai clic destro sulla email e seleziona "Traduci in italiano"
- **Pulsante veloce** - Alternativa al menu contestuale
- **Toggle** - Passa facilmente tra testo originale e tradotto
- **Impostazioni persistenti** - Le tue configurazioni si salvano automaticamente

## 📋 Requisiti

1. **Ollama** - Installato e in esecuzione sul tuo PC
   - Scarica da: https://ollama.ai
   - Deve essere in esecuzione sulla porta `11434`

2. **Un modello Ollama** - Scaricato e caricato
   - Esempi: `ollama pull llama3.2` o `ollama pull mistral`

3. **Thunderbird** - Versione 128 o superiore

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

2. **Inserisci l'URL di Ollama**:
   - Default: `http://localhost:11434`
   - Se Ollama è su un'altra macchina, usa il suo IP

3. **Testa la connessione**:
   - Clicca **"Test connessione"**
   - Se va bene, vedrai il numero di modelli disponibili

4. **Seleziona il modello**:
   - Scegli il modello che vuoi usare
   - I modelli più veloci: `llama3.2`, `mistral`
   - I modelli più accurati: `llama2`, `neural-chat`

5. **Salva**:
   - Clicca **"Salva"**

## 🎯 Come Usare

### Metodo 1: Menu Contestuale
1. **Apri una email** in inglese
2. **Fai clic destro** sul corpo del testo
3. Seleziona **"Traduci in italiano"**
4. Attendi il messaggio "Traduzione completata"

### Metodo 2: Pulsante Veloce
1. **Apri una email** in inglese
2. Guarda l'**angolo in alto a destra** della email
3. Clicca il **pulsante blu** 🌐 **"Traduci in italiano"**
4. Attendi il completamento

### Toggle Originale/Traduzione
- Dopo la traduzione, fai **clic destro** sul testo
- Seleziona **"Mostra originale"** per tornare all'inglese
- Seleziona di nuovo **"Mostra traduzione"** per ritornare all'italiano

## 🔒 Sicurezza

### ✅ Cosa è Sicuro
- **Nessun dato inviato online** - Tutto viene elaborato localmente da Ollama
- **Connection locale** - Comunica solo con `localhost:11434`
- **Nessuna traccia** - Non ci sono statistiche, tracking o log remoti
- **Nessuna credenziale** - Non salva password o informazioni sensibili
- **Permessi minimi** - Accede solo al testo della email per tradurre

### 🛡️ Permessi Richiesti
- `messagesRead` - Legge il contenuto della email (per tradurre)
- `menus` - Aggiunge il menu contestuale
- `storage` - Salva le impostazioni
- `tabs` - Inietta lo script nella email

Nessun accesso a:
- ❌ Rubrica, calendario, chat
- ❌ Account credentials
- ❌ Database Thunderbird
- ❌ File system
- ❌ Internet (solo localhost)

## 🚨 Troubleshooting

### Il menu "Traduci in italiano" non appare
- Verifica che Ollama sia in esecuzione: `curl http://localhost:11434/api/tags`
- Ricarica l'addon: Menu > Tools > Add-ons > Ollama Translator > Ricarica
- Prova un'altra email

### "Errore: Ollama non raggiungibile"
- Avvia Ollama: `ollama serve`
- Verifica che sia sulla porta 11434
- Controlla l'URL nelle impostazioni

### La traduzione è lenta
- Verifica che il modello sia completamente caricato in memoria
- Modelli veloci: llama3.2, mistral (~4GB)
- Modelli lenti: llama2, neural-chat (~7GB+)

### La traduzione non è accurata
- Prova un modello diverso
- Modelli consigliati per italiano: `llama3.2`, `neural-chat`
- Più grande è il modello, più accurato (ma più lento)

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
