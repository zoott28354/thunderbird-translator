# Thunderbird Translator
**(Local Ollama · Google Translate · LibreTranslate)**

🇬🇧 [English](./README.md) | 🇮🇹 [Italiano](./README.it.md) | 🇫🇷 [Français](./README.fr.md) | 🇪🇸 [Español](./README.es.md) | 🇩🇪 [Deutsch](./README.de.md) | 🇵🇹 [Português](./README.pt.md) | 🇷🇺 [Русский](./README.ru.md)

---

Eine Thunderbird-Erweiterung, die E-Mails in mehrere Sprachen übersetzt mit Ollama, Google Translate oder LibreTranslate.

## ✨ Funktionen

- 🏠 **Lokale Übersetzung** - Mit Ollama: keine Daten online gesendet, alles bleibt auf Ihrem PC
- 🤖 **Unterstützt alle Ollama-Modelle** - Llama, Mistral, Neural Chat, etc.
- 🌐 **Mehrere Übersetzungsdienste** - Ollama, Google Translate, LibreTranslate
- 🌍 **Mehrsprachige Übersetzung** - Unterstützt 10 Sprachen: Italienisch, Englisch, Spanisch, Französisch, Deutsch, Portugiesisch, Russisch, Japanisch, Chinesisch, Koreanisch
- 🖱️ **Einfache Benutzeroberfläche** - Rechtsklick auf E-Mail und wählen Sie Dienst und Sprache
- 💾 **Persistente Einstellungen** - Ihre Konfigurationen werden automatisch gespeichert
- 🌐 **Mehrsprachige Benutzeroberfläche** - Die Erweiterung ist in 7 Sprachen verfügbar: 🇮🇹 Italienisch, 🇬🇧 Englisch, 🇩🇪 Deutsch, 🇫🇷 Französisch, 🇪🇸 Spanisch, 🇵🇹 Portugiesisch, 🇷🇺 Russisch (passt sich automatisch an die Sprache von Thunderbird an)

## 📋 Voraussetzungen

### Für Ollama (lokal, privater)

1. **Ollama** auf Ihrem PC installiert
   - Download von: https://ollama.ai

2. **Ein Ollama-Modell** heruntergeladen
   - Empfohlen: `ollama pull translategemma` (3GB, optimiert)
   - Alternativen: `llama3.2`, `mistral`

3. **Thunderbird** Version 128 oder höher

⚠️ **Wichtiger Hinweis**: Bevor Sie Ollama verwenden, müssen Sie `OLLAMA_ORIGINS` konfigurieren (siehe Abschnitt "Erstkonfiguration" unten).

### Für Google Translate oder LibreTranslate (online, kostenlos)

- **Keine Voraussetzungen** - Sie funktionieren sofort
- **Internetverbindung** erforderlich

## 📦 Installation

### Methode 1: XPI-Datei (Empfohlen)

1. **Laden Sie** die Datei `thunderbird-translator.xpi` herunter
2. **Öffnen Sie Thunderbird**
3. Gehen Sie zu **Menü > Extras > Add-ons**
4. Klicken Sie oben rechts auf das Zahnradsymbol ⚙️
5. Wählen Sie **"Add-on aus Datei installieren..."**
6. Wählen Sie die `.xpi`-Datei
7. Bestätigen Sie die Installation

### Methode 2: Aus Ordner (Entwicklung)

1. Extrahieren Sie die Dateien in einen Ordner
2. Öffnen Sie Thunderbird
3. Drücken Sie **Strg+Umschalt+A** (oder über Menü > Extras > Add-ons)
4. Klicken Sie auf das Zahnradsymbol ⚙️
5. Wählen Sie **"Add-ons debuggen"**
6. Klicken Sie auf **"Temporäres Add-on laden..."**
7. Wählen Sie die Datei `manifest.json` aus dem Ordner

## ⚙️ Erstkonfiguration

### 1. Öffnen Sie die Erweiterungseinstellungen
   - Menü > Extras > Add-ons > "Thunderbird Translator" > Einstellungen

### 2. Wählen Sie Dienst und Sprache
   - **Dienst**: Ollama (lokal) / Google Translate / LibreTranslate
   - **Sprache**: Italienisch, Englisch, Spanisch, Französisch, Deutsch, Portugiesisch, Russisch, Japanisch, Chinesisch, Koreanisch

### 3. Bei Verwendung von Ollama: ERFORDERLICHE Konfiguration

#### ⚠️ OLLAMA_ORIGINS konfigurieren

**Warum ist es erforderlich?**
Aus Sicherheitsgründen blockiert Ollama Anfragen von Browser-Erweiterungen. Sie müssen Thunderbird explizit autorisieren.

**Empfohlener Wert (sicherer):**
```
OLLAMA_ORIGINS=moz-extension://*
```
Erlaubt nur Firefox/Thunderbird-Erweiterungen, auf Ollama zuzugreifen. Blockiert alle externen Websites.

**So konfigurieren Sie:**

**Windows (CMD):**
```cmd
setx OLLAMA_ORIGINS "moz-extension://*"
```
Dann schließen und öffnen Sie das Terminal erneut und starten Sie Ollama:
```cmd
ollama serve
```

**Linux/Mac (permanent):**
```bash
echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
source ~/.bashrc
ollama serve
```

**Alternative Option** (wenn Sie auch lokale Anwendungen benötigen):
```
OLLAMA_ORIGINS=moz-extension://*,http://localhost:11434
```

#### 4. URL und Modell konfigurieren
   - **Ollama-URL**: `http://localhost:11434` (Standard)
   - **Verbindung testen**: Klicken Sie, um zu überprüfen, ob Ollama erreichbar ist
   - **Modell**: Wählen Sie `translategemma` (empfohlen) oder ein anderes installiertes Modell

#### 5. Speichern
   - Klicken Sie auf "Speichern"

## 🎯 Verwendung

### Kontextmenü (Empfohlen)
1. **Öffnen Sie eine E-Mail**, die Sie übersetzen möchten
2. **Rechtsklick** auf den E-Mail-Inhalt
3. **Wählen Sie den Übersetzungsdienst**:
   - **"Mit Ollama übersetzen"** → Lokale und private Übersetzung (erfordert installiertes Ollama)
   - **"Mit Google Translate übersetzen"** → Kostenlose Online-Übersetzung
   - **"Mit LibreTranslate übersetzen"** → Open-Source-Online-Übersetzung
4. **Wählen Sie die Zielsprache** aus dem Untermenü
   - Die ausgewählte Sprache wird **fett** angezeigt
   - Diese Wahl wird zum Standard für diesen Dienst
5. Warten Sie auf die Nachricht "Übersetzung abgeschlossen"

**Beispiel**: Wenn Sie "Mit Google Translate übersetzen > Español" wählen, werden alle nachfolgenden Übersetzungen mit Google Translate auf Spanisch sein (bis Sie eine andere Sprache wählen).

### Original anzeigen
- Nach der Übersetzung **Rechtsklick** auf den Text
- Wählen Sie **"Original anzeigen"**, um den Originaltext wiederherzustellen

## 🔒 Sicherheit

### ✅ Was sicher ist
- **Keine Daten online gesendet** - Alles wird lokal von Ollama verarbeitet
- **Lokale Verbindung** - Kommuniziert nur mit `localhost:11434`
- **Kein Tracking** - Keine Statistiken, Tracking oder Remote-Protokolle
- **Keine Anmeldeinformationen** - Speichert keine Passwörter oder sensible Informationen
- **Minimale Berechtigungen** - Greift nur auf E-Mail-Text für die Übersetzung zu

### 🛡️ Erforderliche Berechtigungen
- `messagesRead` - Liest E-Mail-Inhalt (für Übersetzung)
- `messagesModify` - Ändert angezeigten Text (um Übersetzung anzuzeigen)
- `menus` - Fügt Kontextmenü hinzu
- `storage` - Speichert Einstellungen
- `tabs` - Injiziert Skript in E-Mail
- **Host-Berechtigungen** (nur bei Verwendung von Google Translate oder LibreTranslate):
  - `https://translate.google.com/*` - Google Translate API
  - `https://translate.fedilab.app/*` - LibreTranslate-Instanz
  - `http://localhost/*` - Für lokales Ollama

Kein Zugriff auf:
- ❌ Adressbuch, Kalender, Chat
- ❌ Konto-Anmeldeinformationen
- ❌ Thunderbird-Datenbank
- ❌ Dateisystem (außer localhost für Ollama)

## 🚨 Fehlerbehebung

### "Fehler: Ollama-Fehler: 403 Forbidden" ⚠️

**URSACHE**: Ollama blockiert aus Sicherheitsgründen Anfragen von Browser-Erweiterungen.

**VOLLSTÄNDIGE LÖSUNG**:

1. **Stoppen Sie Ollama**, falls es läuft (Strg+C im Terminal, wo `ollama serve` läuft)

2. **Konfigurieren Sie die Umgebungsvariable** (empfohlener Wert für Sicherheit):

   **Windows (CMD):**
   ```cmd
   setx OLLAMA_ORIGINS "moz-extension://*"
   ```

   **Linux/Mac:**
   ```bash
   echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Schließen und öffnen Sie das Terminal erneut**, dann starten Sie Ollama:
   ```bash
   ollama serve
   ```

4. **Überprüfen Sie die Konfiguration**:
   - Öffnen Sie Thunderbird
   - Gehen Sie zu den Erweiterungseinstellungen
   - Klicken Sie auf "Verbindung testen"
   - Sollte "Verbindung erfolgreich: X Modelle verfügbar" anzeigen

**Hinweis**: `moz-extension://*` erlaubt nur Firefox/Thunderbird-Erweiterungen den Zugriff auf Ollama und blockiert externe Websites (sicherer).

## 📝 Lizenz

MIT License - Frei zu verwenden, zu ändern und zu verteilen.

## 🤝 Support

Wenn Sie Probleme haben:
1. **Öffnen Sie die Konsole** (Strg+Umschalt+I in einem Thunderbird-Tab)
2. **Rechtsklick** auf die E-Mail > Wählen Sie Dienst und Übersetzungssprache
3. **Suchen Sie nach blauen Nachrichten** `[Translator]` in der Konsole
4. **Kopieren Sie Fehlermeldungen** und teilen Sie sie

---

**Viel Spaß beim Übersetzen!** 🎉
