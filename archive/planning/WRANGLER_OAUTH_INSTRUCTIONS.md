# 🔐 **WRANGLER OAUTH EN CODESPACES - GUÍA PASO A PASO**

## 🎯 **MÉTODO OAUTH INTERACTIVO**

### **PASO 1: Iniciar OAuth** 
```bash
# En tu terminal actual:
wrangler login
```

**Resultado esperado**:
- ✅ Mostrará una URL de OAuth 
- ✅ Iniciará servidor local en puerto 8976
- ⚠️ No se abrirá navegador (normal en Codespaces)

### **PASO 2: Copiar URL de OAuth**
La URL será similar a:
```
https://dash.cloudflare.com/oauth2/auth?response_type=code&client_id=54d11594-84e4-41aa-b438-e81b8fa78ee7&redirect_uri=http%3A%2F%2Flocalhost%3A8976%2Foauth%2Fcallback&scope=account%3Aread%20user%3Aread%20workers%3Awrite%20workers_kv%3Awrite%20workers_routes%3Awrite%20workers_scripts%3Awrite%20workers_tail%3Aread%20d1%3Awrite%20pages%3Awrite%20zone%3Aread%20ssl_certs%3Awrite%20ai%3Awrite%20queues%3Awrite%20pipelines%3Awrite%20secrets_store%3Awrite%20containers%3Awrite%20cloudchamber%3Awrite%20offline_access&state=XXX&code_challenge=XXX&code_challenge_method=S256
```

### **PASO 3: Autorizar en Navegador**
1. **Copia la URL completa** de OAuth
2. **Abre en tu navegador local** (fuera de Codespaces)
3. **Login en Cloudflare** si no estás logueado
4. **Autoriza la aplicación** wrangler
5. **Serás redirigido** a una URL localhost que fallará (normal)

### **PASO 4: Capturar Callback URL**
El navegador intentará ir a una URL como:
```
http://localhost:8976/oauth/callback?code=XXXXXX&state=YYYYYY
```
**Copia esta URL completa** (desde http hasta el final)

### **PASO 5: Completar OAuth**
En una **nueva terminal** (manteniendo wrangler login ejecutándose):
```bash
# Reemplaza con tu URL de callback real:
curl "http://localhost:8976/oauth/callback?code=TU_CODIGO_AQUI&state=TU_STATE_AQUI"
```

### **PASO 6: Verificar Autenticación**
```bash
wrangler whoami
```

**Resultado esperado**:
```
 ⛅️ wrangler 4.22.0
───────────────────
Getting User settings...
👋 You are logged in with an OAuth Token, associated with the email 'tu@email.com'!
┌─────────────────┬──────────────────────────────────┐
│ Account Name    │ Tu Account                       │
├─────────────────┼──────────────────────────────────┤
│ Account ID      │ abc123...                        │
└─────────────────┴──────────────────────────────────┘
```

---

## 🔑 **MÉTODO ALTERNATIVO: API TOKEN**

Si el OAuth no funciona, usa API Token:

### **PASO 1: Crear API Token**
1. Ve a: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Usa **"Edit Cloudflare Workers"** template
4. O crea Custom token con permisos:
   - `Account:Cloudflare Pages:Edit`
   - `Zone:Zone:Read` (para tu dominio)
   - `Zone:DNS:Edit` (opcional)

### **PASO 2: Configurar Token**
```bash
# Exportar token como variable de entorno
export CLOUDFLARE_API_TOKEN="tu_token_aqui"

# Verificar
wrangler whoami
```

### **PASO 3: Hacer Token Persistente**
```bash
# Añadir a .env.local (ya en .gitignore)
echo "CLOUDFLARE_API_TOKEN=tu_token_aqui" >> .env.local
```

---

## 🚀 **DESPUÉS DE AUTENTICAR**

Una vez autenticado (OAuth o API Token):

### **Ejecutar Setup Automatizado**
```bash
# Probar autenticación
wrangler whoami

# Ejecutar setup completo  
npm run cloudflare:setup

# Verificar recursos creados
wrangler kv:namespace list
wrangler r2 bucket list
```

### **Continuar con Setup Completo**
```bash
# 1. Generar secrets (si no lo hiciste)
npm run secrets:generate

# 2. Setup Cloudflare resources
npm run cloudflare:setup  

# 3. Upload secrets to GitHub
npm run secrets:upload

# 4. Validar todo
npm run setup:validate
```

---

## 🛠️ **TROUBLESHOOTING**

### **Error: "Failed to open"**
✅ **Normal en Codespaces** - ignora y copia la URL manualmente

### **Error: "Connection refused"**
❌ wrangler login no está corriendo
🔧 **Solución**: Ejecuta `wrangler login` en otra terminal

### **Error: "Invalid callback"**  
❌ URL de callback mal copiada
🔧 **Solución**: Verifica que incluyes `?code=...&state=...`

### **Error: "Token expired"**
❌ Proceso demoró mucho
🔧 **Solución**: Reinicia con `wrangler logout && wrangler login`

---

## ⏱️ **TIEMPO ESTIMADO**

- **OAuth**: 3-5 minutos
- **API Token**: 2-3 minutos  
- **Setup después**: 5-8 minutos

**Total**: ~10 minutos hasta completar automatización

---

*🔐 OAuth guide created: 2025-06-30*  
*🎯 Next: Execute OAuth → Complete automation → Sprint 5 ready*