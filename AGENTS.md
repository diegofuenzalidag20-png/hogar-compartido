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
   * Siempre que se modifique código JavaScript, HTML o CSS, sube la versión con `python qa-local/subir_version.py N`: cambia la caché de [`sw.js`](./sw.js) y todos los `?v=` (módulos, estilos y registro del service worker) para que los teléfonos de Diego y Soledad descarguen la actualización.

5. **Despliegue y Control de Versiones:**
   * Tras verificar los cambios y ejecutar pruebas, realiza commit y sube los cambios a GitHub con `git push origin main`.

6. **Código dividido en módulos:**
   * `index.html` es solo la estructura (pestañas, tarjetas, ventanas). Los estilos están en `css/app.css` y la lógica en `js/`, cargada **en orden** como scripts clásicos que comparten el ámbito global.
   * Un módulo puede usar funciones de otro **dentro de funciones** o eventos, pero el código que corre al cargar no puede llamar a funciones de un módulo posterior (en ese momento todavía no existen).
   * El grafo de graphify (`graphify-out/`) conoce cada módulo y las llamadas entre ellos. Tras cambiar módulos, reconstrúyelo con `.\qa-local\reconstruir_grafo.ps1` (usa la caché; si cambió un documento, usa `/graphify --update`).

| Módulo | Contenido |
|---|---|
| `js/01-base.js` | Utilidades, ventanas propias (`dialogo`, `confirmar`), pestañas, menú, tema |
| `js/02-presupuesto.js` | Cuentas del presupuesto (`masterAuditItems`), tabla de auditoría, KPIs, paneles de liquidez |
| `js/03-perfil-cofres.js` | `PERFIL_INICIAL`/`userProfile`, sueldos, cofres, Smart Visa |
| `js/04-graficos-inicio.js` | Gráficos del inicio y co-aporte del hipotecario |
| `js/05-registro.js` | Registro rápido de gastos, íconos de trazo, selector Limache/Huasco |
| `js/06-checklist.js` | `CHECKLIST_FIJOS`, `REGLAS_VARIABLES`, Real sumado, ajuste de presupuestos, checklist |
| `js/07-pwa-enlace.js` | Instalar app, payload completo, enlace WhatsApp, respaldo JSON |
| `js/08-nube.js` | Firestore REST, sesión con Google, respaldos diarios, sincronización a tres vías |
| `js/09-gastos.js` | Lista, edición y borrado de gastos, `showToast`, CSV |
| `js/10-sueldos.js` | Ventana de sueldos y horas extras |
| `js/11-historial-cierre.js` | Base de datos de meses, historial, cierre y reapertura |
| `js/12-desplegables.js` | Desplegables con estilo de vidrio |
| `js/13-categorias.js` | `CATEGORIAS_GASTO`, fijo vs variable |
| `js/14-tarjetas.js` | Saldos por cuenta, liquidez, meta, Smart Visa, Mach semanal, análisis por tarjeta |
| `js/15-analisis-mes.js` | Pestaña Análisis y arranque de la app |

7. **Pruebas:** `qa-local/` (fuera de git, tiene datos reales) contiene la batería y `publicar.ps1`; ver `qa-local/LEEME.md` para elegir qué pruebas correr según el cambio.