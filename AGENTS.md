# 🤖 Instrucciones para Agentes de IA en este Repositorio

> [!IMPORTANT]
> Antes de realizar cualquier acción o responder al usuario, lee atentamente el archivo [`BITACORA.md`](./BITACORA.md).

## Reglas Obligatorias de Operación:

1. **Lectura de Contexto:**
   * Consulta [`BITACORA.md`](./BITACORA.md) para conocer la arquitectura, los módulos, la estructura de datos (`userProfile`, `expenses`, `currentAuditItems`, `remanentes`) y el estado actual de la aplicación.

2. **Registro Obligatorio en la Bitácora:**
   * **Cada modificación que realices DEBE quedar registrada en [`BITACORA.md`](./BITACORA.md)** en la sección de *Historial de Modificaciones*, indicando la fecha, el motivo, la solución técnica y los archivos modificados.

3. **Paridad Absoluta de Código:**
   * Los archivos [`index.html`](./index.html) y [`dashboard_pareja.html`](./dashboard_pareja.html) **DEBEN ser 100% idénticos byte por byte**. Cualquier cambio hecho en uno debe copiarse inmediatamente al otro.

4. **Actualización de Caché PWA:**
   * Siempre que se modifique código JavaScript, HTML o CSS, incrementa la versión de caché en [`sw.js`](./sw.js) (ej: `finanzas-pareja-v28` -> `v29`) y la versión de consulta en el registro de [`index.html`](./index.html) (`sw.js?v=...`) para que los navegadores móviles de Diego y Soledad descarguen la actualización inmediatamente.

5. **Despliegue y Control de Versiones:**
   * Tras verificar los cambios y ejecutar pruebas, realiza commit y sube los cambios a GitHub con `git push origin main`.
