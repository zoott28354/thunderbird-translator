# Thunderbird Translator
**(Local Ollama · Google Translate · LibreTranslate)**

🇬🇧 [English](./README.md) | 🇮🇹 [Italiano](./README.it.md) | 🇫🇷 [Français](./README.fr.md) | 🇪🇸 [Español](./README.es.md) | 🇩🇪 [Deutsch](./README.de.md) | 🇵🇹 [Português](./README.pt.md) | 🇷🇺 [Русский](./README.ru.md)

---

Une extension Thunderbird qui traduit les emails dans plusieurs langues en utilisant Ollama, Google Translate ou LibreTranslate.

## ✨ Fonctionnalités

- 🏠 **Traduction locale** - Avec Ollama : aucune donnée envoyée en ligne, tout reste sur votre PC
- 🤖 **Compatible avec tous les modèles Ollama** - Llama, Mistral, Neural Chat, etc.
- 🌐 **Plusieurs services de traduction** - Ollama, Google Translate, LibreTranslate
- 🌍 **Traduction multilingue** - Prend en charge 10 langues : italien, anglais, espagnol, français, allemand, portugais, russe, japonais, chinois, coréen
- 🖱️ **Interface simple** - Clic droit sur l'email et choisissez le service et la langue
- 💾 **Paramètres persistants** - Vos configurations sont enregistrées automatiquement
- 🌐 **Interface multilingue** - L'extension est disponible en 7 langues : 🇮🇹 Italien, 🇬🇧 Anglais, 🇩🇪 Allemand, 🇫🇷 Français, 🇪🇸 Espagnol, 🇵🇹 Portugais, 🇷🇺 Russe (s'adapte automatiquement à la langue de Thunderbird)

## 📋 Prérequis

### Pour Ollama (local, plus privé)

1. **Ollama** installé sur votre PC
   - Téléchargez depuis : https://ollama.ai

2. **Un modèle Ollama** téléchargé
   - Recommandé : `ollama pull translategemma` (3GB, optimisé)
   - Alternatives : `llama3.2`, `mistral`

3. **Thunderbird** 140x (esr)

⚠️ **Note importante** : Avant d'utiliser Ollama, vous devrez configurer `OLLAMA_ORIGINS` (voir la section "Configuration initiale" ci-dessous).

### Pour Google Translate ou LibreTranslate (en ligne, gratuit)

- **Aucun prérequis** - Ils fonctionnent immédiatement
- **Connexion Internet** requise

## 📦 Installation

### Méthode 1 : Fichier XPI (Recommandée)

1. **Téléchargez** le fichier `thunderbird-translator.xpi`
2. **Ouvrez Thunderbird**
3. Allez dans **Menu > Outils > Modules complémentaires**
4. Cliquez sur l'icône d'engrenage ⚙️ en haut à droite
5. Sélectionnez **"Installer un module depuis un fichier..."**
6. Sélectionnez le fichier `.xpi`
7. Confirmez l'installation

### Méthode 2 : Depuis un dossier (Développement)

1. Extrayez les fichiers dans un dossier
2. Ouvrez Thunderbird
3. Appuyez sur **Ctrl+Shift+A** (ou depuis Menu > Outils > Modules complémentaires)
4. Cliquez sur l'icône d'engrenage ⚙️
5. Sélectionnez **"Déboguer les modules"**
6. Cliquez sur **"Charger un module temporaire..."**
7. Sélectionnez le fichier `manifest.json` depuis le dossier

## ⚙️ Configuration initiale

### 1. Ouvrir les paramètres de l'extension
   - Menu > Outils > Modules complémentaires > "Thunderbird Translator" > Préférences

### 2. Choisir le service et la langue
   - **Service** : Ollama (local) / Google Translate / LibreTranslate
   - **Langue** : Italien, Anglais, Espagnol, Français, Allemand, Portugais, Russe, Japonais, Chinois, Coréen

### 3. Si vous utilisez Ollama : Configuration OBLIGATOIRE

#### ⚠️ Configurer OLLAMA_ORIGINS

**Pourquoi est-ce nécessaire ?**
Pour des raisons de sécurité, Ollama bloque les requêtes provenant des extensions de navigateur. Vous devez explicitement autoriser Thunderbird.

**Valeur recommandée (plus sécurisée) :**
```
OLLAMA_ORIGINS=moz-extension://*
```
Autorise uniquement les extensions Firefox/Thunderbird à accéder à Ollama. Bloque tous les sites web externes.

**Comment configurer :**

**Windows (CMD) :**
```cmd
setx OLLAMA_ORIGINS "moz-extension://*"
```
Ensuite, fermez et rouvrez le terminal et démarrez Ollama :
```cmd
ollama serve
```

**Linux/Mac (permanent) :**
```bash
echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
source ~/.bashrc
ollama serve
```

**Option alternative** (si vous avez également besoin d'applications locales) :
```
OLLAMA_ORIGINS=moz-extension://*,http://localhost:11434
```

#### 4. Configurer l'URL et le modèle
   - **URL Ollama** : `http://localhost:11434` (par défaut)
   - **Tester la connexion** : Cliquez pour vérifier qu'Ollama est accessible
   - **Modèle** : Sélectionnez `translategemma` (recommandé) ou un autre modèle installé

#### 5. Enregistrer
   - Cliquez sur "Enregistrer"

## 🎯 Comment utiliser

### Menu contextuel (Recommandé)
1. **Ouvrez un email** que vous souhaitez traduire
2. **Clic droit** sur le corps de l'email
3. **Choisissez le service de traduction** :
   - **"Traduire avec Ollama"** → Traduction locale et privée (nécessite Ollama installé)
   - **"Traduire avec Google Translate"** → Traduction en ligne gratuite
   - **"Traduire avec LibreTranslate"** → Traduction en ligne open-source
4. **Sélectionnez la langue cible** dans le sous-menu
   - La langue sélectionnée apparaîtra en **gras**
   - Ce choix devient la langue par défaut pour ce service
5. Attendez le message "Traduction terminée"

**Exemple** : Si vous sélectionnez "Traduire avec Google Translate > Español", toutes les traductions suivantes avec Google Translate seront en espagnol (jusqu'à ce que vous choisissiez une autre langue).

### Afficher l'original
- Après la traduction, **clic droit** sur le texte
- Sélectionnez **"Afficher l'original"** pour restaurer le texte original

## 🔒 Sécurité

### ✅ Ce qui est sécurisé
- **Aucune donnée envoyée en ligne** - Tout est traité localement par Ollama
- **Connexion locale** - Communique uniquement avec `localhost:11434`
- **Aucun suivi** - Pas de statistiques, suivi ou journaux distants
- **Aucun identifiant** - N'enregistre pas de mots de passe ou d'informations sensibles
- **Permissions minimales** - Accède uniquement au texte des emails pour la traduction

### 🛡️ Permissions requises
- `messagesRead` - Lit le contenu des emails (pour la traduction)
- `messagesModify` - Modifie le texte affiché (pour afficher la traduction)
- `menus` - Ajoute le menu contextuel
- `storage` - Enregistre les paramètres
- `tabs` - Injecte le script dans l'email
- **Permissions d'hôte** (uniquement si vous utilisez Google Translate ou LibreTranslate) :
  - `https://translate.google.com/*` - API Google Translate
  - `https://translate.fedilab.app/*` - Instance LibreTranslate
  - `http://localhost/*` - Pour Ollama local

Aucun accès à :
- ❌ Carnet d'adresses, calendrier, chat
- ❌ Identifiants de compte
- ❌ Base de données Thunderbird
- ❌ Système de fichiers (sauf localhost pour Ollama)

## 🚨 Dépannage

### "Erreur : Erreur Ollama : 403 Forbidden" ⚠️

**CAUSE** : Ollama bloque les requêtes provenant des extensions de navigateur pour des raisons de sécurité.

**SOLUTION COMPLÈTE** :

1. **Arrêtez Ollama** s'il est en cours d'exécution (Ctrl+C dans le terminal où `ollama serve` est en cours d'exécution)

2. **Configurez la variable d'environnement** (valeur recommandée pour la sécurité) :

   **Windows (CMD) :**
   ```cmd
   setx OLLAMA_ORIGINS "moz-extension://*"
   ```

   **Linux/Mac :**
   ```bash
   echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Fermez et rouvrez le terminal**, puis démarrez Ollama :
   ```bash
   ollama serve
   ```

4. **Vérifiez la configuration** :
   - Ouvrez Thunderbird
   - Allez dans les paramètres de l'extension
   - Cliquez sur "Tester la connexion"
   - Devrait afficher "Connexion réussie : X modèles disponibles"

**Note** : `moz-extension://*` autorise uniquement les extensions Firefox/Thunderbird à accéder à Ollama, bloquant les sites web externes (plus sécurisé).

## 📝 Licence

MIT License - Libre d'utilisation, de modification et de distribution.

## 🤝 Support

Si vous rencontrez des problèmes :
1. **Ouvrez la console** (Ctrl+Shift+I dans un onglet Thunderbird)
2. **Clic droit** sur l'email > Sélectionnez le service et la langue de traduction
3. **Recherchez les messages bleus** `[Translator]` dans la console
4. **Copiez les messages d'erreur** et partagez-les

---

**Bonne traduction !** 🎉
