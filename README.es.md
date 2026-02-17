# Thunderbird Translator
**(Local Ollama · Google Translate · LibreTranslate)**

🇬🇧 [English](./README.md) | 🇮🇹 [Italiano](./README.it.md) | 🇫🇷 [Français](./README.fr.md) | 🇪🇸 [Español](./README.es.md) | 🇩🇪 [Deutsch](./README.de.md) | 🇵🇹 [Português](./README.pt.md) | 🇷🇺 [Русский](./README.ru.md)

---

Un complemento de Thunderbird que traduce correos electrónicos a múltiples idiomas usando Ollama, Google Translate o LibreTranslate.

## ✨ Características

- 🏠 **Traducción local** - Con Ollama: no se envían datos en línea, todo permanece en tu PC
- 🤖 **Compatible con todos los modelos Ollama** - Llama, Mistral, Neural Chat, etc.
- 🌐 **Múltiples servicios de traducción** - Ollama, Google Translate, LibreTranslate
- 🌍 **Traducción multiidioma** - Soporta 10 idiomas: italiano, inglés, español, francés, alemán, portugués, ruso, japonés, chino, coreano
- 🖱️ **Interfaz simple** - Clic derecho en el correo y elige el servicio e idioma
- 💾 **Configuración persistente** - Tus configuraciones se guardan automáticamente
- 🌐 **Interfaz multilingüe** - El complemento está disponible en 7 idiomas: 🇮🇹 Italiano, 🇬🇧 Inglés, 🇩🇪 Alemán, 🇫🇷 Francés, 🇪🇸 Español, 🇵🇹 Portugués, 🇷🇺 Ruso (se adapta automáticamente al idioma de Thunderbird)

## 📋 Requisitos

### Para Ollama (local, más privado)

1. **Ollama** instalado en tu PC
   - Descarga desde: https://ollama.ai

2. **Un modelo Ollama** descargado
   - Recomendado: `ollama pull translategemma` (3GB, optimizado)
   - Alternativas: `llama3.2`, `mistral`

3. **Thunderbird** versión 128 o superior

⚠️ **Nota importante**: Antes de usar Ollama, necesitarás configurar `OLLAMA_ORIGINS` (ver la sección "Configuración inicial" a continuación).

### Para Google Translate o LibreTranslate (en línea, gratis)

- **Sin requisitos** - Funcionan inmediatamente
- **Conexión a Internet** requerida

## 📦 Instalación

### Método 1: Archivo XPI (Recomendado)

1. **Descarga** el archivo `thunderbird-translator.xpi`
2. **Abre Thunderbird**
3. Ve a **Menú > Herramientas > Complementos**
4. Haz clic en el icono de engranaje ⚙️ en la parte superior derecha
5. Selecciona **"Instalar complemento desde archivo..."**
6. Selecciona el archivo `.xpi`
7. Confirma la instalación

### Método 2: Desde carpeta (Desarrollo)

1. Extrae los archivos a una carpeta
2. Abre Thunderbird
3. Presiona **Ctrl+Shift+A** (o desde Menú > Herramientas > Complementos)
4. Haz clic en el icono de engranaje ⚙️
5. Selecciona **"Depurar complementos"**
6. Haz clic en **"Cargar complemento temporal..."**
7. Selecciona el archivo `manifest.json` de la carpeta

## ⚙️ Configuración inicial

### 1. Abrir configuración del complemento
   - Menú > Herramientas > Complementos > "Thunderbird Translator" > Preferencias

### 2. Elegir servicio e idioma
   - **Servicio**: Ollama (local) / Google Translate / LibreTranslate
   - **Idioma**: Italiano, Inglés, Español, Francés, Alemán, Portugués, Ruso, Japonés, Chino, Coreano

### 3. Si usas Ollama: Configuración OBLIGATORIA

#### ⚠️ Configurar OLLAMA_ORIGINS

**¿Por qué es necesario?**
Por razones de seguridad, Ollama bloquea las solicitudes de extensiones del navegador. Debes autorizar explícitamente a Thunderbird.

**Valor recomendado (más seguro):**
```
OLLAMA_ORIGINS=moz-extension://*
```
Permite solo a las extensiones de Firefox/Thunderbird acceder a Ollama. Bloquea todos los sitios web externos.

**Cómo configurar:**

**Windows (CMD):**
```cmd
setx OLLAMA_ORIGINS "moz-extension://*"
```
Luego cierra y vuelve a abrir el terminal e inicia Ollama:
```cmd
ollama serve
```

**Linux/Mac (permanente):**
```bash
echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
source ~/.bashrc
ollama serve
```

**Opción alternativa** (si también necesitas aplicaciones locales):
```
OLLAMA_ORIGINS=moz-extension://*,http://localhost:11434
```

#### 4. Configurar URL y modelo
   - **URL de Ollama**: `http://localhost:11434` (predeterminado)
   - **Probar conexión**: Haz clic para verificar que Ollama es accesible
   - **Modelo**: Selecciona `translategemma` (recomendado) u otro modelo instalado

#### 5. Guardar
   - Haz clic en "Guardar"

## 🎯 Cómo usar

### Menú contextual (Recomendado)
1. **Abre un correo** que deseas traducir
2. **Haz clic derecho** en el cuerpo del correo
3. **Elige el servicio de traducción**:
   - **"Traducir con Ollama"** → Traducción local y privada (requiere Ollama instalado)
   - **"Traducir con Google Translate"** → Traducción en línea gratuita
   - **"Traducir con LibreTranslate"** → Traducción en línea de código abierto
4. **Selecciona el idioma de destino** del submenú
   - El idioma seleccionado aparecerá en **negrita**
   - Esta elección se convierte en el predeterminado para ese servicio
5. Espera el mensaje "Traducción completada"

**Ejemplo**: Si seleccionas "Traducir con Google Translate > Español", todas las traducciones posteriores con Google Translate serán en español (hasta que elijas otro idioma).

### Mostrar original
- Después de la traducción, **haz clic derecho** en el texto
- Selecciona **"Mostrar original"** para restaurar el texto original

## 🔒 Seguridad

### ✅ Lo que es seguro
- **No se envían datos en línea** - Todo es procesado localmente por Ollama
- **Conexión local** - Se comunica solo con `localhost:11434`
- **Sin rastreo** - Sin estadísticas, rastreo o registros remotos
- **Sin credenciales** - No guarda contraseñas ni información sensible
- **Permisos mínimos** - Solo accede al texto del correo para traducción

### 🛡️ Permisos requeridos
- `messagesRead` - Lee el contenido del correo (para traducción)
- `messagesModify` - Modifica el texto mostrado (para mostrar la traducción)
- `menus` - Añade el menú contextual
- `storage` - Guarda la configuración
- `tabs` - Inyecta el script en el correo
- **Permisos de host** (solo si usas Google Translate o LibreTranslate):
  - `https://translate.google.com/*` - API de Google Translate
  - `https://translate.fedilab.app/*` - Instancia de LibreTranslate
  - `http://localhost/*` - Para Ollama local

Sin acceso a:
- ❌ Libreta de direcciones, calendario, chat
- ❌ Credenciales de cuenta
- ❌ Base de datos de Thunderbird
- ❌ Sistema de archivos (excepto localhost para Ollama)

## 🚨 Solución de problemas

### "Error: Error de Ollama: 403 Forbidden" ⚠️

**CAUSA**: Ollama bloquea las solicitudes de extensiones del navegador por razones de seguridad.

**SOLUCIÓN COMPLETA**:

1. **Detén Ollama** si está en ejecución (Ctrl+C en el terminal donde `ollama serve` está ejecutándose)

2. **Configura la variable de entorno** (valor recomendado para seguridad):

   **Windows (CMD):**
   ```cmd
   setx OLLAMA_ORIGINS "moz-extension://*"
   ```

   **Linux/Mac:**
   ```bash
   echo 'export OLLAMA_ORIGINS="moz-extension://*"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Cierra y vuelve a abrir el terminal**, luego inicia Ollama:
   ```bash
   ollama serve
   ```

4. **Verifica la configuración**:
   - Abre Thunderbird
   - Ve a la configuración del complemento
   - Haz clic en "Probar conexión"
   - Debería mostrar "Conexión exitosa: X modelos disponibles"

**Nota**: `moz-extension://*` permite solo a las extensiones de Firefox/Thunderbird acceder a Ollama, bloqueando sitios web externos (más seguro).

## 📝 Licencia

MIT License - Libre de usar, modificar y distribuir.

## 🤝 Soporte

Si tienes problemas:
1. **Abre la consola** (Ctrl+Shift+I en una pestaña de Thunderbird)
2. **Haz clic derecho** en el correo > Selecciona servicio e idioma de traducción
3. **Busca mensajes azules** `[Translator]` en la consola
4. **Copia los mensajes de error** y compártelos

---

**¡Feliz traducción!** 🎉
