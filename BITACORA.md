# 📋 BITÁCORA Y GUÍA DE ARQUITECTURA TÉCNICA
## Sistema de Finanzas Compartidas — Diego & Soledad (Web App PWA)

> [!IMPORTANT]
> **REGLA FUNDAMENTAL PARA CUALQUIER AGENTE DE IA O DESARROLLADOR:**
> 1. **Registro Obligatorio:** Cualquier modificación, corrección, ajuste de fórmula, adición de campos o nueva funcionalidad realizada en el proyecto **DEBE registrarse inmediatamente en esta bitácora**, al final del documento en la sección [Historial de Modificaciones](#historial-de-modificaciones), detallando la fecha, el motivo, los archivos modificados y el impacto técnico.
> 2. **Paridad Absoluta de Archivos:** `index.html` y `dashboard_pareja.html` **DEBEN ser 100% idénticos byte por byte** en todo momento. Si editas `index.html`, debes replicar exactamente el mismo contenido en `dashboard_pareja.html`.
> 3. **Incremento de Caché PWA:** Todo cambio en el código fuente debe incrementar la versión de caché en `sw.js` (ej: `finanzas-pareja-v28` -> `v29`) y la versión de consulta en el registro de `index.html` (`sw.js?v=...`) para garantizar que las apps móviles de Diego y Soledad se actualicen inmediatamente sin caché obsoleta.
> 4. **Despliegue a GitHub:** Todo cambio confirmado debe subirse a la rama `main` (`git push origin main`) para que GitHub Pages publique la versión activa.

---

## 🌐 1. Resumen y Propósito del Proyecto

Esta aplicación es una **Progressive Web App (PWA) Single Page Application (SPA)** diseñada exclusivamente para que **Diego y Soledad** administren de manera autónoma, intuitiva y 100% digital sus finanzas del hogar, eliminando la necesidad de planillas de cálculo de escritorio.

* **URL de Producción (GitHub Pages):** `https://diegofuenzalidag20-png.github.io/hogar-compartido/`
* **Tecnología:** HTML5, CSS3 Glassmorphism responsivo para móviles, JavaScript vainilla modular, Chart.js para visualización analítica.
* **Persistencia:** Almacenamiento local ultrarrápido en `localStorage` con respaldo y sincronización en tiempo real entre los teléfonos de ambos mediante **Firebase Firestore** (proyecto `hogar-compartido-sync`).
* **Modo Offline:** Funciona sin conexión a internet mediante Service Worker (`sw.js`), sincronizando los cambios una vez recuperada la conectividad.

---

## 🧱 2. Arquitectura de Módulos y Pestañas

La aplicación se organiza en 4 pestañas principales accesibles desde la barra de navegación superior:

```mermaid
flowchart TD
    Nav["Barra de Navegación"]
    Nav --> Tab1["1. Control Mensual (tab-auditoria)"]
    Nav --> Tab2["2. Análisis Mes Actual (tab-mes-actual)"]
    Nav --> Tab3["3. Cuentas & Cofres (tab-cuentas)"]
    Nav --> Tab4["4. Base de Datos & Historial (tab-historico)"]

    Tab1 --> CajaRapida["Caja de Ingreso Rápido de Boletas"]
    Tab1 --> TablaAuditoria["Tabla de Compromisos y Checklist"]
    Tab1 --> TablaGastos["Tabla de Gastos Registrados en Vivo"]

    Tab2 --> KPIs["Scorecards de KPIs del Mes"]
    Tab2 --> Donas3["3 Donas por Categoría (Global, Diego, Soledad)"]
    Tab2 --> TarjetasDonas["Donas por Tarjeta / Cofre (Saldos & Consumo)"]
    Tab2 --> Comparativas["Meta vs Real, Equilibrio Pareja, Fijos vs Variables"]

    Tab3 --> SueldosCofres["Asignación de Sueldos y Cofres"]
    Tab3 --> Remanentes["Casillas de Remanente Mes Pasado"]
    Tab3 --> SmartVisa["Control Tarjeta Smart Visa BancoEstado"]

    Tab4 --> HistorialBD["Base de Datos de Meses Cerrados"]
    Tab4 --> Consolidado26["Histórico Consolidado 26+ Meses"]
```

---

### Pestaña 1: Control Mensual (`tab-auditoria`)
Es el panel operativo cotidiano de la pareja:
1. **Banner del Periodo Financiero en Curso:** Muestra el mes activo (ej: *Noviembre 2026 - Mes Abierto*).
2. **Acciones del Periodo:**
   * 💾 **Guardar en Base de Datos:** Genera una copia de seguridad del mes en curso en la BD.
   * 🚀 **Cerrar Mes y Pasar al Siguiente:** Cierra el periodo actual, audita y traslada los remanentes sobrantes al mes entrante, reinicia gastos y activa el nuevo mes.
   * 📁 **Ver Base de Datos:** Acceso directo a la pestaña de historial.
   * ↩️ **Reabrir Mes Anterior:** Si se cerró un mes por error, este botón permite restaurar el snapshot del mes cerrado.
3. **Caja de Ingreso Rápido de Boletas & Gastos:**
   * **Botones de un solo toque (Auto-relleno):** `💡 Luz`, `💧 Agua`, `🔥 Gas`, `📱 Plan Claro Sole`, `📶 Planes Entel`, `🌐 Internet Hogar`, `🥪 Snack` (Diego con Tenpo), `🛒 Supermercado`, `🏢 Gasto Común`, etc.
   * **Campos del formulario:**
     * `Fecha`: Sugiere automáticamente la **fecha del día de hoy** para agilizar el registro.
     * `¿Quién Pagó?`: Diego, Soledad o 50/50 Compartido.
     * `Categoría`: Incluye todas las categorías familiares y la opción de **"Transferencia a Tercero"**.
     * `Monto ($ CLP)`: Formateador numérico chileno.
     * `Medio de Pago`: Cuenta Fan, Tenpo Diego, Mach Diego, Mercado Pago Diego, Chequera BancoEstado, Tenpo Soledad, Smart Visa, Mercado Pago Soledad, Ahorro BancoEstado o Efectivo.
     * `Detalle / Comercio`: Nombre de la boleta o tienda.
   * **Botón ➕ REGISTRAR BOLETA / GASTO:** Agrega el gasto, recalcula los saldos y actualiza la nube.
   * **Botón 🧹 Limpiar:** Vacía **todas las casillas** del formulario para ingresar un gasto limpio.
4. **Tabla de Gastos Registrados:**
   * Muestra todos los consumos del mes ordenados cronológicamente desde el **día 1 hasta el último día del mes hacia abajo**.
   * Filtros dinámicos en un toque: `Todos`, `Solo Diego`, `Solo Soledad`.
   * Buscador en vivo por comercio/detalle y botón para exportar a CSV.

---

### Pestaña 2: Análisis Mes Actual (`tab-mes-actual`)
Brinda una radiografía financiera integral vinculada a los gastos reales:
1. **Scorecards de KPIs:**
   * Ingresos Familiares del Mes (Suma de sueldos líquidos de Diego y Soledad).
   * Total Gastos Auditados Mes (Suma de gastos en tabla).
   * Desvío vs Presupuesto Meta (Semáforo verde si está bajo la meta, amarillo/rojo si excede).
   * Superávit / Capacidad de Ahorro Libre Familiar.
2. **3 Donas de Desglose de Gastos por Categoría:**
   * **🌐 Global Familiar:** Todos los gastos consolidados.
   * **🔵 Diego:** Gastos asumidos por Diego (+50% compartido).
   * **🟣 Soledad:** Gastos cubiertos por Soledad (+50% compartido).
3. **Análisis de Gastos por Tarjeta / Cuenta (Donas Individuales):**
   * Gráficos de dona individuales para cada medio de pago:
     * Tenpo Prepago Diego, Mach Diego, Mercado Pago Diego, Cuenta Fan Banco de Chile.
     * Chequera Electrónica BancoEstado, Tenpo Soledad, Tarjeta Smart Visa, Mercado Pago Soledad, Cuenta Ahorro Reserva.
   * **Estructura unificada de 3 métricas:**
     * **Si hay remanente del mes pasado:** Muestra `Remanente Previo` + `Transferido Este Mes` = `Disponible Total`.
     * **Si no hay remanente previo:** Muestra `Transferido` - `Gastado` = `Disponible`.
     * **Para Smart Visa:** Muestra `Cupo Total`, `Deuda Actual` y `Cupo Disponible`.
   * **Desglose de categorías de Tenpo Diego:** Separa detalladamente `🚌 Pasajes Bus`, `🥪 Snacks`, `🚗 Uber`, `🚆 Metro Valparaíso`, `💡 Servicios Huasco` y `📦 Otros`.
4. **Gráficos Analíticos Complementarios:**
   * **Presupuesto Meta vs Real en Tabla:** Barras comparativas de lo planificado vs gastado por categoría.
   * **Desembolso Pareja (Diego vs Soledad):** Carga asumida por cada uno vs su saldo libre.
   * **Gastos Fijos vs Variables:** Proporción real de compromisos ineludibles vs consumo del mes.

---

### Pestaña 3: Cuentas & Cofres (`tab-cuentas`)
Define la distribución del dinero líquido al inicio de cada mes y el control de ahorros:
1. **Sueldos Líquidos Percibidos:**
   * Diego: `$1.214.038` (modificable con cálculo de horas extras).
   * Soledad: `$875.000` (modificable).
2. **Cofres de Diego (Distribución desde Cuenta Fan):**
   * `Cuenta Fan (Banco de Chile)`: Cuenta principal para gastos fijos del hogar.
   * `Tenpo Prepago Diego`: Pasajes, Uber, Metro, Turno Huasco. Incluye casilla de **Remanente mes pasado**.
   * `Mach Prepago Diego`: Bolsillo semanal ($35k/semana). Incluye casilla de **Remanente mes pasado**.
   * `Mercado Pago Diego`: Fondo de emergencia con rendimiento diario. Incluye casilla de **Remanente mes pasado**.
3. **Cofres de Soledad (Distribución desde Chequera BancoEstado):**
   * `Chequera Electrónica`: Cuenta principal para cuentas del hogar Limache (~$286k).
   * `Tarjeta Smart Visa (BancoEstado)`: Línea de crédito en cuotas. Control de Cupo Total ($500k), Cuota pagada este mes ($50k), Deuda anterior facturada, compras del mes en vivo, deuda actual y cupo disponible.
   * `Tenpo Prepago Soledad`: Bolsillo personal. Incluye casilla de **Remanente mes pasado**.
   * `Mercado Pago Soledad`: Ahorro diario remunerado. Incluye casilla de **Remanente mes pasado**.
   * `Cuenta Ahorro Reserva (BancoEstado)`: Fondo de reserva protegido. Incluye casilla de **Remanente mes pasado**.
4. **Reactividad Bidireccional:** Modificar cualquier monto en esta pestaña actualiza al instante el gráfico consolidado de cofres (`chartCofres`), guarda en `userProfile` y sincroniza las donas de [Análisis Mes Actual](file:///c:/Users/diego/OneDrive/Escritorio/Proyectos%20personales/Excel%20compartido/index.html).

---

### Pestaña 4: Base de Datos & Historial (`tab-historico`)
1. **Historial de Meses Cerrados y Guardados:** Tarjetas interactivas de cada mes cerrado con totales de ingresos, gastos, superávit y detalle de boletas.
2. **Tabla Histórica Consolidada 26+ Meses:** Historial financiero completo continuo (2024 a 2026) que integra tanto los meses reales auditados como los nuevos meses que se van cerrando en la aplicación.

---

## ⚙️ 3. Lógica del Cierre de Mes y Traspaso de Remanentes

El flujo implementado en `confirmarCierreMes()` asegura que el dinero no se confunda ni se duplique:

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Diego / Soledad
    participant App as Aplicación Web
    participant BD as Base de Datos (Local & Firestore)
    participant Perfil as userProfile (Remanentes)

    Usuario->>App: Clic en "Cerrar Mes y Pasar al Siguiente"
    App->>BD: Guarda el mes actual como "Cerrado" con boletas y gastos reales
    App->>App: Crea Snapshot de seguridad (ultimo_mes_cerrado_backup)
    App->>App: Audita gastos por cuenta del mes que cierra
    App->>Perfil: Calcula sobrante: (Remanente + Aporte) - Gastado
    App->>Perfil: Asigna sobrante a userProfile.remanentes del nuevo mes
    App->>Perfil: Mantiene el presupuesto base mensual intacto (no lo infla)
    App->>App: Avanza currentActiveMonth al mes siguiente
    App->>App: Reinicia boletas variables a 0 y expenses a []
    App->>BD: Registra el nuevo mes como "En Curso"
    App->>Usuario: Muestra notificación de bienvenida al nuevo mes con remanentes listos
```

### Reglas de Cálculo de Remanentes:
* **Mercado Pago & Cuentas de Ahorro:**
  $$\text{Remanente Nuevo Mes} = \max(0, \text{Remanente Anterior} + \text{Aporte Mes Cerrado} - \text{Gastos Registrados})$$
* **Tarjetas Prepago Operativas (Tenpo / Mach):**
  $$\text{Remanente Nuevo Mes} = \max(0, \text{Remanente Anterior} + \text{Presupuesto Mes Cerrado} - \text{Gastos Registrados})$$
* **Tarjeta Smart Visa (Crédito):**
  $$\text{Deuda Arrastrada al Nuevo Mes} = \max(0, \text{Deuda Anterior} + \text{Compras del Mes Cerrado} - \text{Cuota Pagada})$$

---

## 🗄️ 4. Estructura de Datos en LocalStorage y Firestore

| Clave en LocalStorage | Tipo de Dato | Descripción |
| :--- | :--- | :--- |
| `finanzas_user_profile` | Objeto JSON | Perfil financiero (`diegoSalary`, `soledadSalary`, `cofresDiego`, `cofresSoledad`, `remanentes`, `smartVisaConfig`). |
| `app_active_month` | String | Nombre del mes activo actual (ej: `"Noviembre 2026"`). |
| `family_expenses` / `hogar_gastos` | Array JSON | Lista de gastos registrados del mes en curso. |
| `audit_<Mes>` | Array JSON | Lista de boletas y compromisos del mes (`currentAuditItems`). |
| `db_historial_meses` | Array JSON | Historial completo de meses guardados y cerrados. |
| `ultimo_mes_cerrado_backup` | Objeto JSON | Respaldo para poder reabrir el último mes cerrado. |
| `app_theme` | String | Preferencia de tema visual (`"light"` o ausente para dark mode). |

---

## 📜 5. Historial de Modificaciones

> Esta sección es un registro acumulativo. **Cada intervención del agente de IA debe agregar una nueva entrada al inicio de esta lista.**

### [2026-11-02] — Creación de Bitácora Oficial y Resumen de Estado Integral
* **Motivo:** Solicitud del usuario para documentar detalladamente el estado actual del proyecto, la arquitectura funcional y establecer la directriz de registro continuo para futuras sesiones de IA.
* **Archivos Creados / Modificados:**
  * `BITACORA.md` (Archivo creado con documentación completa del sistema).
* **Impacto:** Cualquier agente de IA que inicie una sesión podrá comprender de inmediato las reglas de negocio, la paridad de archivos, el esquema de datos y continuar trabajando sin reiniciar contexto.

### [2026-11-01] — Sincronización en Vivo de Cofres Soledad, Casillas de Remanente Universal y Rollover al Cerrar Mes (v28)
* **Motivo:**
  1. Desconexión en las donas de Soledad al modificar sus cofres en `tab-cuentas`.
  2. Falta de casillas de remanente mes pasado en Tenpo Diego, Mach y Tenpo Soledad.
  3. Al cerrar el mes, el saldo total acumulado de las cuentas se asignaba incorrectamente como un nuevo aporte mensual en lugar de trasladarse al remanente.
* **Solución Técnica:**
  * Se añadieron casillas de `Remanente mes pasado` y `Total Fondos Disponibles` en **Tenpo Diego, Mach Diego y Tenpo Soledad**.
  * Se conectó `updateSoleMargenDisplay()` e `updateSmartVisaDisplay()` con auto-guardado en `userProfile` y sincronización en vivo a `renderCardAnalysis()`.
  * Se integró la cuota mensual de Smart Visa ($50.000) en el total de transferencias de la Chequera de Soledad.
  * Se rediseñó `confirmarCierreMes()` para calcular los saldos sobrantes reales y asignarlos a `userProfile.remanentes` del nuevo mes, manteniendo intacto el presupuesto base de transferencia.
  * Se incorporó la función de auto-recuperación `repararRemanentesSiEsNecesario()`.
  * Incremento de caché en `sw.js` a `finanzas-pareja-v28`.
* **Archivos Modificados:** `index.html`, `dashboard_pareja.html`, `sw.js`.

### [2026-11-01] — Sincronización en la Nube del Mes Activo entre Dispositivos
* **Motivo:** Al cerrar el mes en un dispositivo, el teléfono de la pareja continuaba mostrando el mes anterior.
* **Solución Técnica:**
  * Se integró la clave `activeMonth` en la sincronización continua de Firestore (`hogar-compartido-sync`).
  * Se implementó auto-adopción local del mes activo al recibir datos remotos (`sincronizarMesActivoConBD`).
* **Archivos Modificados:** `index.html`, `dashboard_pareja.html`.

### [2026-10-31] — Corrección del Histórico de la Base de Datos y Reaparición de Octubre 2026
* **Motivo:** Al cerrar mes aparecían dos Octubres en la BD y faltaba Noviembre 2026; los datos cerrados no se reflejaban en la tabla consolidada histórica.
* **Solución Técnica:**
  * Corrección de la deduplicación de meses en `guardarMesEnBD()` y `asegurarMesActivoEnBD()`.
  * Renderizado dinámico de la tabla histórica continua de 26+ meses incorporando los meses cerrados en vivo.
  * Botón persistente `↩️ Reabrir Octubre 2026` para deshacer el cierre si se requería auditoría adicional.
* **Archivos Modificados:** `index.html`, `dashboard_pareja.html`.

### [2026-10-30] — Validación de Costos Fijos vs Variables, Smart Visa y Mejoras en Caja Rápida
* **Motivo:** Solicitud para revisar cálculo de fijos vs variables, botón limpiar en caja rápida, sugerencia de fecha actual y donas especializadas por categoría para Tenpo.
* **Solución Técnica:**
  * Corrección de la categorización de `isExpenseFijo` para boletas obligatorias vs consumo variable.
  * Función `limpiarCajaRapida()` mejorada para resetear fecha, pagador, categoría, monto, medio de pago y detalle.
  * Auto-relleno de la fecha de hoy (`getLocalDateISO()`).
  * Sub-categorización por texto de consumos en Tenpo Diego (`Pasajes Bus`, `Snacks`, `Uber`, `Metro Valparaíso`, `Servicios Huasco`).
* **Archivos Modificados:** `index.html`, `dashboard_pareja.html`.

### [2026-10-30] — Botón Rápido "Snack" y Categoría "Transferencia a Tercero"
* **Motivo:** Reemplazar botón rápido de Hipotecario Diego por "Snack" (Diego con Tenpo) y añadir la categoría "Transferencia a Tercero".
* **Solución Técnica:**
  * Actualización de los chips de auto-relleno y las opciones de `<select id="quickCategory">` y modales.
  * Ordenamiento cronológico de la tabla de gastos en vivo por fecha ascendente (del 1 al último día del mes en curso).
* **Archivos Modificados:** `index.html`, `dashboard_pareja.html`.

---

## 📌 6. Plantilla para Futuros Registros en la Bitácora

Cada vez que se realice una modificación en el proyecto, copiar y completar el siguiente bloque en la sección de [Historial de Modificaciones](#historial-de-modificaciones):

```markdown
### [AAAA-MM-DD] — Título Breve de la Modificación
* **Motivo:** [¿Por qué se solicitó o qué problema resolvía?]
* **Solución Técnica:** [¿Qué funciones, cálculos, estilos o eventos se modificaron?]
* **Archivos Modificados:** `index.html`, `dashboard_pareja.html`, `sw.js` (u otros según corresponda).
* **Impacto:** [¿Cómo beneficia o cambia el funcionamiento para Diego y Soledad?]
```
