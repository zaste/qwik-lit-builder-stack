# 🚨 Problemas de Dependencias y Soluciones

## Resumen de Problemas Encontrados

Este proyecto ha tenido múltiples problemas de dependencias que han sido identificados y resueltos:

### 1. Paquetes Obsoletos o Renombrados

#### ❌ @builder.io/qwik-labs
- **Estado**: DEPRECATED / NO EXISTE (404)
- **Solución**: Removido completamente del proyecto
- **Cambios**:
  - Eliminado de `package.json`
  - Eliminado import de `vite.config.ts` (qwikInsights)

#### ❌ @supabase/auth-helpers-qwik
- **Estado**: RENOMBRADO / NO EXISTE (404)
- **Solución**: Reemplazado por `@supabase/ssr`
- **Cambios**:
  - `@supabase/auth-helpers-qwik` → `@supabase/ssr@^0.3.0`

#### ⚠️ @builder.io/sdk-qwik versión antigua
- **Problema**: Versión 0.0.5 incompatible con Qwik 1.14.1
- **Solución**: Actualizado a versión 0.21.1
- **Cambios**:
  - `@builder.io/sdk-qwik@^0.0.5` → `@builder.io/sdk-qwik@^0.21.1`

### 2. Problemas con Adaptadores de Qwik City

#### ❌ Imports incorrectos
- **Problema**: Se intentaba usar `default` exports cuando son named exports
- **Solución**: Usar los nombres correctos de las funciones exportadas
- **Cambios en `src/adapters/index.ts`**:
  ```typescript
  // ❌ Incorrecto
  { default: cloudflareAdapter }
  
  // ✅ Correcto
  cfModule.cloudflarePagesAdapter
  vercelModule.vercelEdgeAdapter
  nodeModule.nodeServerAdapter
  staticModule.staticAdapter
  ```

### 3. El Problema Principal: isolated-vm

#### 🔴 isolated-vm
- **Qué es**: Módulo nativo de Node.js requerido por `@builder.io/sdk-qwik@^0.21.1`
- **Problemas**:
  - Requiere compilación C++
  - Necesita Python y herramientas de compilación
  - Causa timeouts de 6-7 minutos en entornos sandboxed
  - No funciona en: Jules (Google AI), Codex (OpenAI), algunos Codespaces

## Soluciones Implementadas

### 1. Mover Builder.io a optionalDependencies
```json
"optionalDependencies": {
  "@builder.io/sdk": "^2.1.0",
  "@builder.io/sdk-qwik": "^0.21.1"
}
```

### 2. Configurar .npmrc para prevenir builds nativos
```
fallback-to-build=false
```

### 3. Helper seguro para Builder.io
Creado `src/lib/builder.tsx` que detecta si Builder.io está disponible y proporciona fallbacks.

### 4. Vite config adaptativo
El `vite.config.ts` ahora detecta si Builder.io está instalado antes de intentar optimizarlo.

## Comandos de Instalación

### Para entornos normales (con soporte C++):
```bash
pnpm install
```

### Para entornos problemáticos (sin soporte C++):
```bash
pnpm install --no-optional
```

### Si la instalación se cuelga:
```bash
# Limpiar todo
pnpm clean:all

# Instalar sin opcionales
pnpm install --no-optional
```

## Entornos Conocidos con Problemas

- ❌ Jules (Google AI)
- ❌ Codex (OpenAI)  
- ⚠️ GitHub Codespaces (puede funcionar con configuración adicional)
- ⚠️ Contenedores Docker sin build tools
- ⚠️ Entornos CI/CD básicos

## Entornos que Funcionan

- ✅ Desarrollo local con Node.js 20+
- ✅ Máquinas con Python y C++ instalados
- ✅ GitHub Actions con setup correcto
- ✅ Vercel
- ✅ Cloudflare Pages (sin Builder.io local)

## Verificar Estado de Instalación

Para verificar qué está instalado correctamente:

```bash
# Ver todas las dependencias instaladas
pnpm list

# Verificar si Builder.io está instalado
pnpm list @builder.io/sdk-qwik

# Si muestra "missing" o error, está en optionalDependencies y no se instaló
```

## Trabajar sin Builder.io

Si Builder.io no se puede instalar:

1. La aplicación funcionará sin CMS visual
2. Usa Supabase para contenido dinámico
3. Considera alternativas como:
   - Contenido estático en archivos
   - Strapi o Directus (headless CMS)
   - Contentful o Sanity (SaaS)

## Recomendaciones

1. **Para desarrollo**: Usa una máquina local con las herramientas necesarias
2. **Para CI/CD**: Usa `pnpm install --no-optional` para evitar problemas
3. **Para producción**: Builder.io puede funcionar sin instalación local si usas su API directamente
4. **Para contenido**: Considera usar Supabase que ya está incluido

## Notas Técnicas

- `isolated-vm` es requerido por Builder.io para ejecutar código JavaScript de forma segura
- El timeout ocurre durante el intento de compilación, no durante la descarga
- `fallback-to-build=false` debería prevenir la compilación, pero algunos entornos lo ignoran
- La versión 0.21.1 de `@builder.io/sdk-qwik` es la última compatible con Qwik 1.x
