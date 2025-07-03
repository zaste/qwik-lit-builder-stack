# 🚨 INSTRUCCIONES CRÍTICAS - MIGRACIÓN MANUAL REQUERIDA

## ⚠️ **ACCIÓN INMEDIATA REQUERIDA**

La migración automática falló debido a permisos limitados de la API de Supabase. **Debes ejecutar la migración manualmente** siguiendo estos pasos:

## 📋 **PASOS PARA APLICAR LA MIGRACIÓN**

### 1. **Ir al Supabase Dashboard**
- Abre: https://supabase.com/dashboard
- Selecciona tu proyecto: `wprgiqjcabmhhmwmurcp`
- Ve a: **SQL Editor** (en el menú lateral izquierdo)

### 2. **Ejecutar el Archivo de Migración**
- En el SQL Editor, selecciona **"New query"**
- Copia **TODO** el contenido del archivo: `supabase/migrations/20250703000000_add_missing_tables.sql`
- Pega el contenido en el editor
- Haz clic en **"Run"** o presiona `Ctrl+Enter`

### 3. **Verificar Éxito**
Deberías ver estos mensajes al final:
```
✅ MISSING TABLES MIGRATION COMPLETED!
📋 Added tables: profiles, posts, comments
🔧 Fixed missing columns in existing tables
🛡️ Updated RLS policies for better security
🌱 Added seed data for component library
```

## 🎯 **QUÉ HACE ESTA MIGRACIÓN**

### **Tablas Creadas:**
- ✅ `profiles` - Perfiles de usuario con metadata
- ✅ `posts` - Sistema de blog/posts
- ✅ `comments` - Sistema de comentarios

### **Columnas Añadidas a `pages`:**
- ✅ `meta_data` - Metadata adicional (JSONB)
- ✅ `layout` - Configuración de layout (JSONB)
- ✅ `author_id` - Referencia al usuario autor

### **Políticas RLS Corregidas:**
- ✅ Analytics events: permite inserts anónimos
- ✅ Component library: permite gestión por usuarios autenticados
- ✅ Nuevas tablas: políticas de seguridad apropiadas

### **Índices de Performance:**
- ✅ Optimización de consultas frecuentes
- ✅ Búsquedas por usuario, fecha, estado

### **Funciones y Triggers:**
- ✅ Auto-creación de perfil al registrarse
- ✅ Auto-actualización de timestamps

## ⚡ **DESPUÉS DE LA MIGRACIÓN**

Una vez ejecutada exitosamente:

1. **Vuelve a este terminal**
2. **Ejecuta**: `node scripts/validate-migration.js`
3. **Confirma** que todas las tablas y columnas existen
4. **Continúa** con la siguiente fase de fixes

## 🆘 **SI HAY PROBLEMAS**

### Error: "Permission denied"
- Verifica que tienes permisos de **Owner** o **Admin** en el proyecto
- Contacta al administrador del proyecto si es necesario

### Error: "Function already exists"
- Es normal, la migración usa `CREATE OR REPLACE`
- Continúa con la ejecución

### Error: "Policy already exists"
- Es normal, la migración usa `DROP POLICY IF EXISTS`
- Continúa con la ejecución

## 📞 **SOPORTE**

Si encuentras algún error:
1. Copia el mensaje de error completo
2. Reporta en este chat
3. No ejecutes comandos adicionales hasta recibir instrucciones

---

## ⏳ **TIEMPO ESTIMADO: 2-3 MINUTOS**

Esta migración es **crítica** para el funcionamiento del sistema. Sin ella:
- ❌ Registro de usuarios fallará
- ❌ Sistema de blog no funcionará  
- ❌ APIs de contenido fallarán
- ❌ Analytics tendrán problemas

**¡Ejecuta la migración AHORA para continuar con los fixes!**