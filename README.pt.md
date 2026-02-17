# Thunderbird Translator
**(Local Ollama · Google Translate · LibreTranslate)**

🇬🇧 [English](./README.md) | 🇮🇹 [Italiano](./README.it.md) | 🇫🇷 [Français](./README.fr.md) | 🇪🇸 [Español](./README.es.md) | 🇩🇪 [Deutsch](./README.de.md) | 🇵🇹 [Português](./README.pt.md) | 🇷🇺 [Русский](./README.ru.md)

---

Um complemento do Thunderbird que traduz emails para vários idiomas usando Ollama, Google Translate ou LibreTranslate.

## ✨ Funcionalidades

- 🏠 **Tradução local** - Com Ollama: nenhum dado enviado online, tudo fica no seu PC
- 🤖 **Suporta todos os modelos Ollama** - Llama, Mistral, Neural Chat, etc.
- 🌐 **Múltiplos serviços de tradução** - Ollama, Google Translate, LibreTranslate
- 🌍 **Tradução multilíngue** - Suporta 10 idiomas: italiano, inglês, espanhol, francês, alemão, português, russo, japonês, chinês, coreano
- 🖱️ **Interface simples** - Clique com o botão direito no email e escolha o serviço e o idioma
- 💾 **Configurações persistentes** - Suas configurações são salvas automaticamente
- 🌐 **Interface multilíngue** - O complemento está disponível em 7 idiomas: 🇮🇹 Italiano, 🇬🇧 Inglês, 🇩🇪 Alemão, 🇫🇷 Francês, 🇪🇸 Espanhol, 🇵🇹 Português, 🇷🇺 Russo (adapta-se automaticamente ao idioma do Thunderbird)

## 📋 Requisitos

### Para Ollama (local, mais privado)

1. **Ollama** instalado no seu PC
   - Baixe em: https://ollama.ai

2. **Um modelo Ollama** baixado
   - Recomendado: `ollama pull translategemma` (3GB, otimizado)
   - Alternativas: `llama3.2`, `mistral`

3. **Thunderbird** versão 128 ou superior

⚠️ **Nota importante**: Antes de usar o Ollama, você precisará configurar `OLLAMA_ORIGINS` (veja a seção "Configuração inicial" abaixo).

### Para Google Translate ou LibreTranslate (online, grátis)

- **Sem requisitos** - Funcionam imediatamente
- **Conexão com a Internet** necessária

## 📦 Instalação

### Método 1: Arquivo XPI (Recomendado)

1. **Baixe** o arquivo `thunderbird-ollama-translator.xpi`
2. **Abra o Thunderbird**
3. Vá para **Menu > Ferramentas > Complementos**
4. Clique no ícone de engrenagem ⚙️ no canto superior direito
5. Selecione **"Instalar complemento de um arquivo..."**
6. Selecione o arquivo `.xpi`
7. Confirme a instalação

### Método 2: Da pasta (Desenvolvimento)

1. Extraia os arquivos para uma pasta
2. Abra o Thunderbird
3. Pressione **Ctrl+Shift+A** (ou do Menu > Ferramentas > Complementos)
4. Clique no ícone de engrenagem ⚙️
5. Selecione **"Depurar complementos"**
6. Clique em **"Carregar complemento temporário..."**
7. Selecione o arquivo `manifest.json` da pasta

## ⚙️ Configuração inicial

### 1. Abrir configurações do complemento
   - Menu > Ferramentas > Complementos > "Ollama Translator" > Preferências

### 2. Escolher serviço e idioma
   - **Serviço**: Ollama (local) / Google Translate / LibreTranslate
   - **Idioma**: Italiano, Inglês, Espanhol, Francês, Alemão, Português, Russo, Japonês, Chinês, Coreano

### 3. Se usar Ollama: Configuração OBRIGATÓRIA

#### ⚠️ Configurar OLLAMA_ORIGINS

**Por que é necessário?**
Por motivos de segurança, o Ollama bloqueia solicitações de extensões do navegador. Você deve autorizar explicitamente o Thunderbird.

**Valor recomendado (mais seguro):**
```
OLLAMA_ORIGINS=moz-extension://*
```
Permite apenas extensões do Firefox/Thunderbird acessarem o Ollama. Bloqueia todos os sites externos.

**Como configurar:**

**Windows (CMD):**
```cmd
setx OLLAMA_ORIGINS "moz-extension://*"
```
Depois feche e reabra o terminal e inicie o Ollama:
```cmd
ollama serve
```

**Linux/Mac (permanente):**
```bash
echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
source ~/.bashrc
ollama serve
```

**Opção alternativa** (se você também precisa de aplicativos locais):
```
OLLAMA_ORIGINS=moz-extension://*,http://localhost:11434
```

#### 4. Configurar URL e modelo
   - **URL do Ollama**: `http://localhost:11434` (padrão)
   - **Testar conexão**: Clique para verificar se o Ollama está acessível
   - **Modelo**: Selecione `translategemma` (recomendado) ou outro modelo instalado

#### 5. Salvar
   - Clique em "Salvar"

## 🎯 Como usar

### Menu de contexto (Recomendado)
1. **Abra um email** que você deseja traduzir
2. **Clique com o botão direito** no corpo do email
3. **Escolha o serviço de tradução**:
   - **"Traduzir com Ollama"** → Tradução local e privada (requer Ollama instalado)
   - **"Traduzir com Google Translate"** → Tradução online gratuita
   - **"Traduzir com LibreTranslate"** → Tradução online de código aberto
4. **Selecione o idioma de destino** do submenu
   - O idioma selecionado aparecerá em **negrito**
   - Esta escolha se torna o padrão para esse serviço
5. Aguarde a mensagem "Tradução concluída"

**Exemplo**: Se você selecionar "Traduzir com Google Translate > Español", todas as traduções subsequentes com Google Translate serão em espanhol (até que você escolha outro idioma).

### Mostrar original
- Após a tradução, **clique com o botão direito** no texto
- Selecione **"Mostrar original"** para restaurar o texto original

## 🔒 Segurança

### ✅ O que é seguro
- **Nenhum dado enviado online** - Tudo é processado localmente pelo Ollama
- **Conexão local** - Comunica-se apenas com `localhost:11434`
- **Sem rastreamento** - Sem estatísticas, rastreamento ou logs remotos
- **Sem credenciais** - Não salva senhas ou informações sensíveis
- **Permissões mínimas** - Acessa apenas o texto do email para tradução

### 🛡️ Permissões necessárias
- `messagesRead` - Lê o conteúdo do email (para tradução)
- `messagesModify` - Modifica o texto exibido (para mostrar a tradução)
- `menus` - Adiciona menu de contexto
- `storage` - Salva configurações
- `tabs` - Injeta script no email
- **Permissões de host** (apenas se usar Google Translate ou LibreTranslate):
  - `https://translate.google.com/*` - API do Google Translate
  - `https://translate.fedilab.app/*` - Instância do LibreTranslate
  - `http://localhost/*` - Para Ollama local

Sem acesso a:
- ❌ Catálogo de endereços, calendário, chat
- ❌ Credenciais de conta
- ❌ Banco de dados do Thunderbird
- ❌ Sistema de arquivos (exceto localhost para Ollama)

## 🚨 Solução de problemas

### "Erro: Erro do Ollama: 403 Forbidden" ⚠️

**CAUSA**: O Ollama bloqueia solicitações de extensões do navegador por motivos de segurança.

**SOLUÇÃO COMPLETA**:

1. **Pare o Ollama** se estiver em execução (Ctrl+C no terminal onde `ollama serve` está rodando)

2. **Configure a variável de ambiente** (valor recomendado para segurança):

   **Windows (CMD):**
   ```cmd
   setx OLLAMA_ORIGINS "moz-extension://*"
   ```

   **Linux/Mac:**
   ```bash
   echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Feche e reabra o terminal**, depois inicie o Ollama:
   ```bash
   ollama serve
   ```

4. **Verifique a configuração**:
   - Abra o Thunderbird
   - Vá para as configurações do complemento
   - Clique em "Testar conexão"
   - Deve mostrar "Conexão bem-sucedida: X modelos disponíveis"

**Nota**: `moz-extension://*` permite apenas extensões do Firefox/Thunderbird acessarem o Ollama, bloqueando sites externos (mais seguro).

## 📝 Licença

MIT License - Livre para usar, modificar e distribuir.

## 🤝 Suporte

Se você tiver problemas:
1. **Abra o console** (Ctrl+Shift+I em uma aba do Thunderbird)
2. **Clique com o botão direito** no email > Selecione serviço e idioma de tradução
3. **Procure por mensagens azuis** `[Translator]` no console
4. **Copie as mensagens de erro** e compartilhe-as

---

**Boa tradução!** 🎉
