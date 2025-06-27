## 🚨 Problema con Builder.io SDK

### El Problema

Las dependencias de Builder.io (`@builder.io/sdk` y `@builder.io/sdk-qwik`) requieren el paquete `isolated-vm`, que es un módulo nativo de Node.js que:

- Requiere compilación C++ 
- Necesita Python y herramientas de compilación del sistema
- Puede causar timeouts durante la instalación en ciertos entornos
- Es problemático en entornos sandboxed o CI/CD

### Solución Implementada

He movido las dependencias de Builder.io a `optionalDependencies` en el `package.json`. Esto significa:

1. **La instalación no fallará** si Builder.io no puede instalarse
2. **El proyecto funcionará** sin la integración CMS
3. **Puedes usar Builder.io** si tu entorno lo soporta

### Cómo Usar Builder.io (Opcional)

#### Opción 1: Instalación Normal
Si tu entorno soporta módulos nativos:
```bash
pnpm install
```

#### Opción 2: Sin Builder.io
Para omitir Builder.io completamente:
```bash
pnpm install --no-optional
```

#### Opción 3: Forzar Instalación
Si necesitas Builder.io y quieres forzar la instalación:
```bash
# Instalar herramientas de compilación primero
# En Ubuntu/Debian:
sudo apt-get install build-essential python3

# En macOS:
xcode-select --install

# Luego instalar con configuración específica
pnpm config set node-gyp-build-from-source true
pnpm install
```

### Verificar si Builder.io está Disponible

En tu código, puedes verificar si Builder.io está disponible:

```typescript
// src/lib/builder.ts
let builderSDK: any = null;

try {
  builderSDK = await import('@builder.io/sdk-qwik');
} catch (e) {
  console.warn('Builder.io SDK not available, CMS features disabled');
}

export const hasBuilderSupport = () => builderSDK !== null;
export const getBuilderSDK = () => builderSDK;
```

### Entornos Problemáticos Conocidos

- GitHub Codespaces (puede funcionar con configuración adicional)
- Algunos contenedores Docker ligeros
- Entornos CI/CD sin herramientas de compilación
- Sandboxes de desarrollo en línea

### Alternativas

Si necesitas un CMS pero Builder.io no funciona en tu entorno:

1. **Usar Supabase** para contenido dinámico (ya incluido)
2. **Contenido estático** en archivos Markdown
3. **Headless CMS alternativo** como Strapi o Directus
4. **Contentful** o **Sanity** como servicios externos

### Para Desarrollo Local

Si estás desarrollando localmente y necesitas Builder.io:

1. Asegúrate de tener Node.js 20+ instalado
2. Instala herramientas de compilación de tu sistema
3. Usa `pnpm install` normalmente
4. Si falla, usa `pnpm install --no-optional` y continúa sin CMS

### Reportar Problemas

Si encuentras problemas con esta configuración:
1. Intenta primero sin Builder.io: `pnpm install --no-optional`
2. Si necesitas Builder.io, abre un issue con:
   - Tu sistema operativo
   - Versión de Node.js
   - Error completo de instalación
