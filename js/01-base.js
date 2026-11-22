// Utilidades (parseSeguro, formatCLP, nuevoId), ventanas propias (dialogo/avisar/confirmar/pedirTexto), pestañas, menú, hoja de registro, tema e ítems manuales.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    function parseSeguro(texto, respaldo) {
      if (texto === null || texto === undefined || texto === '') return respaldo;
      try { return JSON.parse(texto) ?? respaldo; } catch (e) { return respaldo; }
    }
    function leerJSON(clave, respaldo) { return parseSeguro(localStorage.getItem(clave), respaldo); }
    // Texto para las reglas de clasificación: sin mayúsculas ni tildes, así \b corta bien en "termómetro" o "crédito"
    function textoRegla(s) {
      return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    const storageSetItemOriginal = Storage.prototype.setItem;
    let avisoMemoriaLlena = false;
    // Devuelve false si no se pudo guardar, para que quien guarda algo crítico lo sepa
    Storage.prototype.setItem = function (clave, valor) {
      try {
        storageSetItemOriginal.call(this, clave, valor);
      } catch (e) {
        console.error('Almacenamiento lleno:', e);
        // Una ventana y no un aviso pasajero: el de "gasto registrado" lo tapaba al instante
        if (!avisoMemoriaLlena) {
          avisoMemoriaLlena = true;
          setTimeout(() => avisar('⚠️ La memoria del teléfono está llena: los cambios podrían no quedar guardados en este teléfono. Se siguen subiendo a la nube mientras haya conexión. Libera espacio y vuelve a abrir la app.'));
        }
        // Lo que no se pudo guardar sigue en la pantalla y debe subir: el sondeo no puede saltarse la comparación
        if (typeof marcarCambioLocal === 'function') marcarCambioLocal();
        return false;
      }
      if (typeof marcarCambioLocal === 'function') marcarCambioLocal();
      return true;
    };

    const temaClaro = () => document.body.getAttribute('data-theme') === 'light';
    function chartTextColor() { return temaClaro() ? '#1E293B' : '#F1F5F9'; }
    function chartBorderColor() { return temaClaro() ? '#FFFFFF' : 'rgba(10, 15, 30, 0.9)'; }

    // ---------- Ventanas propias (reemplazan alert/confirm/prompt del sistema) ----------
    // Devuelve una promesa: true/false al confirmar, el texto escrito (o null) al pedir un dato,
    // o el valor de la opción elegida (o null) con opciones: [{ texto, valor }].
    function dialogo({ texto, aceptar = 'Entendido', cancelar = null, entrada = null, opciones = null }) {
      return new Promise(resolve => {
        const fondo = document.createElement('div');
        fondo.className = 'dialogo-fondo';
        const idTexto = nuevoId('dialogo-texto');
        fondo.innerHTML = `<div class="dialogo" role="dialog" aria-modal="true" aria-labelledby="${idTexto}"><p class="dialogo-texto" id="${idTexto}"></p>${entrada !== null ? '<input class="dialogo-entrada" type="text" autocomplete="off" enterkeyhint="done">' : ''}<div class="dialogo-botones">${opciones ? opciones.map((o, i) => `<button type="button" class="${i ? 'btn-secondary' : 'btn-primary'} dialogo-op" data-i="${i}"></button>`).join('') : `${cancelar ? '<button type="button" class="btn-secondary dialogo-no"></button>' : ''}<button type="button" class="btn-primary dialogo-si"></button>`}</div></div>`;
        fondo.querySelector('.dialogo-texto').textContent = texto;
        fondo.querySelectorAll('.dialogo-op').forEach(b => { b.textContent = opciones[b.dataset.i].texto; b.onclick = () => responder(opciones[b.dataset.i].valor); });
        if (!opciones) fondo.querySelector('.dialogo-si').textContent = aceptar;
        if (cancelar) fondo.querySelector('.dialogo-no').textContent = cancelar;
        const campo = fondo.querySelector('.dialogo-entrada');
        if (campo) campo.value = entrada;
        let listo = false;
        const responder = (si) => {
          if (listo) return;
          listo = true;
          fondo.remove();
          cerrarCapa(fondo);
          resolve(opciones ? (typeof si === 'string' ? si : null) : entrada !== null ? (si ? campo.value : null) : (cancelar ? !!si : true));
        };
        if (!opciones) fondo.querySelector('.dialogo-si').onclick = () => responder(true);
        if (cancelar) fondo.querySelector('.dialogo-no').onclick = () => responder(false);
        // Enter confirma solo desde el campo o el botón de sí: con el foco en Cancelar, Enter cancela (es el botón)
        fondo.addEventListener('keydown', e => {
          if (e.key === 'Escape') responder(false);
          if (e.key === 'Enter' && (e.target === campo || e.target.classList.contains('dialogo-si'))) { e.preventDefault(); responder(true); }
        });
        document.body.appendChild(fondo);
        // Foco en Cancelar: un Enter o toque apurado no confirma algo que borra
        (campo || fondo.querySelector('.dialogo-no, .dialogo-op') || fondo.querySelector('.dialogo-si')).focus();
        if (campo) campo.select();
        abrirCapa(fondo, () => responder(false));
        window.dispatchEvent(new CustomEvent('dialogo-abierto', { detail: { texto, responder } }));
      });
    }
    const avisar = (texto) => dialogo({ texto: String(texto) });
    const confirmar = (texto, aceptar = 'Sí, continuar') => dialogo({ texto, aceptar, cancelar: 'Cancelar' });
    const pedirTexto = (texto, valor = '') => dialogo({ texto, entrada: String(valor ?? ''), aceptar: 'Aceptar', cancelar: 'Cancelar' });
    window.alert = (texto) => { avisar(texto); };

    function nuevoId(prefijo) { return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

    // ---------- Ventanas encima: hoja de registro, menú, modales y diálogos (v86) ----------
    // Atrás de Android cerraba la app con una ventana abierta y se perdía lo escrito: cada ventana deja una entrada en el
    // historial y Atrás cierra la de arriba. Al abrir, el foco entra a la ventana; al cerrar, vuelve a donde estaba.
    const capasAbiertas = [];
    let atrasPropios = 0;
    function abrirCapa(el, cerrar) {
      if (capasAbiertas.some(c => c.el === el)) return;
      capasAbiertas.push({ el, cerrar, foco: document.activeElement });
      history.pushState({ ov: 1 }, '');
      const caja = el.matches('[role="dialog"]') ? el : (el.querySelector('[role="dialog"]') || el);
      if (!caja.contains(document.activeElement)) {
        if (!caja.hasAttribute('tabindex')) caja.setAttribute('tabindex', '-1');
        caja.focus({ preventScroll: true });
      }
    }
    function cerrarCapa(el) {
      const i = capasAbiertas.findIndex(c => c.el === el);
      if (i < 0) return;
      const [capa] = capasAbiertas.splice(i, 1);
      // Cerrada con su botón: se saca su entrada del historial (si no, Atrás no haría nada la primera vez)
      if (!capa.porAtras && history.state?.ov) { atrasPropios++; history.back(); }
      if (capa.foco?.isConnected && !document.querySelector('.dialogo-fondo')) capa.foco.focus({ preventScroll: true });
    }
    window.addEventListener('popstate', () => {
      if (atrasPropios) { atrasPropios--; return; }
      const capa = capasAbiertas[capasAbiertas.length - 1];
      if (!capa) return;
      capa.porAtras = true;
      capa.cerrar();
      cerrarCapa(capa.el);
    });
    // Una recarga con una ventana abierta deja la entrada: ya no es de ninguna ventana
    if (history.state?.ov) history.replaceState(null, '');
    // Las ventanas fijas avisan solas al mostrarse u ocultarse (cada una se abre y cierra con su propia función)
    function esCapaVisible(el) {
      return el.id === 'quickBillCard' || el.id === 'appMenu' ? el.classList.contains('open') : getComputedStyle(el).display !== 'none';
    }
    function cerrarCapaFija(el) {
      if (el.id === 'appMenu') return closeAppMenu();
      const x = el.querySelector('.sheet-close');
      if (x) x.click(); else el.style.display = 'none';
    }
    function vigilarCapasFijas() {
      document.querySelectorAll('#quickBillCard, #appMenu, .modal-overlay, #modalAddItem').forEach(el => {
        new MutationObserver(() => {
          if (esCapaVisible(el)) abrirCapa(el, () => cerrarCapaFija(el)); else cerrarCapa(el);
        }).observe(el, { attributes: true, attributeFilter: ['style', 'class'] });
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', vigilarCapasFijas);
    else vigilarCapasFijas();

    // ---------- Dibujo agrupado (v86) ----------
    // Registrar un gasto dibujaba ~22 veces las mismas partes: ahora se piden aquí y cada una se dibuja una vez
    // en el próximo cuadro, en este orden (el perfil recalcula cofres y Mach antes de la tabla del presupuesto).
    const PARTES_RENDER = {
      perfil: () => syncProfileToInputs(),
      presupuesto: () => renderAuditTable(),
      checklist: () => renderChecklist(),
      proyeccion: () => renderProyeccionMes(),
      gastos: () => renderExpenses(),
      traspasos: () => renderTraspasos(),
      graficosSueldo: () => updateChartsWithNewSalary(),
      graficos: () => renderDashboardCharts(),
      analisis: () => renderAnalisisMesActual(),
      tarjetas: () => renderCardAnalysis()
    };
    // Viven en la pestaña Análisis: oculta no se dibujan (switchTab las dibuja al entrar)
    const PARTES_DE_ANALISIS = new Set(['graficos', 'analisis', 'tarjetas']);
    const partesPendientes = new Set();
    let cuadroPendiente = null, pintando = false;
    function programarRender(...partes) {
      partes.forEach(p => partesPendientes.add(p));
      if (cuadroPendiente || pintando) return;
      // Con la app en segundo plano requestAnimationFrame no corre: el temporizador lo reemplaza
      const t = setTimeout(pintarPendiente, 250);
      const r = requestAnimationFrame(pintarPendiente);
      cuadroPendiente = { t, r };
    }
    function pintarPendiente() {
      if (cuadroPendiente) { clearTimeout(cuadroPendiente.t); cancelAnimationFrame(cuadroPendiente.r); cuadroPendiente = null; }
      const analisisVisible = !!document.getElementById('tab-mes-actual')?.classList.contains('active');
      // Lo que una parte pida al dibujarse (p. ej. el presupuesto pide el checklist) entra en esta misma vuelta;
      // lo que ya se dibujó en esta vuelta no se repite (los datos no cambiaron entremedio)
      const pintadas = new Set();
      pintando = true;
      for (const parte of Object.keys(PARTES_RENDER)) {
        if (!partesPendientes.delete(parte)) continue;
        pintadas.add(parte);
        if (PARTES_DE_ANALISIS.has(parte) && !analisisVisible) continue;
        try { PARTES_RENDER[parte](); } catch (e) { console.error('Error al dibujar', parte, e); }
      }
      pintando = false;
      pintadas.forEach(p => partesPendientes.delete(p));
      // Una parte anterior pedida por una posterior (sin haberse dibujado aún) va al próximo cuadro
      if (partesPendientes.size) programarRender();
    }

    // Formatter CLP
    const formatCLP = (num) => {
      const valor = Math.round(Number(num) || 0);
      return (valor < 0 ? '-$' : '$') + Math.abs(valor).toLocaleString('es-CL');
    };

    // Tab Navigation
    function switchTab(tabId, btn) {
      if (typeof closeAllGlassSelects === 'function') closeAllGlassSelects();
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');
      if (btn) btn.classList.add('active');

      // Si entra a tab-dash, renderizar y asegurar gráficos de cofres y KPIs
      if (tabId === 'tab-mes-actual' && document.getElementById('detalleResumen')?.open) {
        if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
      }
      // Si entra a tab-cuentas, sincronizar valores de sueldos y cofres inmediatamente
      if (tabId === 'tab-cuentas') {
        if (typeof syncProfileToInputs === 'function') syncProfileToInputs();
        if (typeof renderTraspasos === 'function') renderTraspasos();
      }
      // Si entra a tab-mes-actual, renderizar y actualizar todos los gráficos del mes
      if (tabId === 'tab-mes-actual') {
        if (typeof renderAnalisisMesActual === 'function') renderAnalisisMesActual();
      }
      // Si entra a tab-auditoria, refrescar tabla y paneles
      if (tabId === 'tab-auditoria') {
        if (typeof renderAuditTable === 'function') renderAuditTable();
      }
      // Si entra a tab-historico, refrescar tabla histórica consolidada y BD
      if (tabId === 'tab-historico') {
        if (typeof renderDetailedHistoricalTable === 'function') renderDetailedHistoricalTable();
        if (typeof renderTablaHistorialMesesBD === 'function') renderTablaHistorialMesesBD();
      }

      document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.toggle('active', el.dataset.tab === tabId));
      window.scrollTo(0, 0);
    }

    const mobileLayout = window.matchMedia('(max-width: 768px)');
    const quickCardHome = document.createComment('quickBillCard');

    function goToTab(tabId) {
      switchTab(tabId, document.querySelector(`.tab-btn[onclick*="'${tabId}'"]`));
    }

    function setOverlay(open) {
      document.getElementById('overlayBackdrop').classList.toggle('show', open);
      document.body.classList.toggle('sheet-open', open);
    }

    function closeAppMenu() {
      document.getElementById('appMenu').classList.remove('open');
      setOverlay(false);
    }

    function toggleAppMenu() {
      const menu = document.getElementById('appMenu');
      const open = !menu.classList.contains('open');
      document.getElementById('menuInstallPwa').style.display = window.matchMedia('(display-mode: standalone)').matches ? 'none' : '';
      document.getElementById('menuReabrirMes').style.display = localStorage.getItem('ultimo_mes_cerrado_backup') ? '' : 'none';
      menu.classList.toggle('open', open);
      setOverlay(open);
    }

    function openQuickSheet() {
      document.getElementById('appMenu').classList.remove('open');
      document.getElementById('quickBillCard').classList.add('open');
      setOverlay(true);
      preguntarYoSoySiFalta();
    }

    function closeQuickSheet() {
      if (typeof closeAllGlassSelects === 'function') closeAllGlassSelects();
      document.getElementById('quickBillCard').classList.remove('open');
      setOverlay(false);
    }

    function openQuickEntry() {
      if (mobileLayout.matches) openQuickSheet();
      else goToTab('tab-auditoria');
    }

    // En el teléfono la tarjeta vive en body: un ancestro con transform o blur rompería position:fixed
    function placeQuickCard() {
      const card = document.getElementById('quickBillCard');
      // En el teléfono es una ventana (hoja); en escritorio, una tarjeta más de la página
      if (mobileLayout.matches) { card.setAttribute('role', 'dialog'); card.setAttribute('aria-modal', 'true'); card.setAttribute('aria-labelledby', 'tituloRegistro'); }
      else ['role', 'aria-modal', 'aria-labelledby'].forEach(a => card.removeAttribute(a));
      if (mobileLayout.matches && card.parentNode !== document.body) {
        card.before(quickCardHome);
        document.body.appendChild(card);
      } else if (!mobileLayout.matches && quickCardHome.parentNode) {
        quickCardHome.replaceWith(card);
        closeQuickSheet();
      }
    }

    // Con el teclado abierto Android achica solo la parte visible: la hoja de registro (fija abajo) quedaba tapada junto con
    // el botón REGISTRAR. La hoja sube sobre el teclado (--teclado) y el campo enfocado se trae a la vista.
    if (window.visualViewport) {
      visualViewport.addEventListener('resize', () => {
        const tapado = Math.max(0, Math.round(innerHeight - visualViewport.height - visualViewport.offsetTop));
        document.documentElement.style.setProperty('--teclado', tapado + 'px');
        const campo = document.activeElement;
        if (tapado && campo?.closest?.('#quickBillCard.open')) campo.scrollIntoView({ block: 'nearest' });
      });
    }

    // Dark/Light Theme System con Persistencia en LocalStorage
    function initTheme() {
      const saved = localStorage.getItem('app_theme');
      const icon = document.getElementById('themeIcon');
      if (saved === 'light') {
        document.body.setAttribute('data-theme', 'light');
        if (icon) icon.textContent = '🌙';
      } else {
        document.body.removeAttribute('data-theme');
        if (icon) icon.textContent = '☀️';
      }
    }

    function toggleTheme() {
      const isLight = document.body.getAttribute('data-theme') === 'light';
      const icon = document.getElementById('themeIcon');
      if (isLight) {
        document.body.removeAttribute('data-theme');
        if (icon) icon.textContent = '☀️';
        localStorage.setItem('app_theme', 'dark');
        showToast('🌙 Modo Oscuro activado');
      } else {
        document.body.setAttribute('data-theme', 'light');
        if (icon) icon.textContent = '🌙';
        localStorage.setItem('app_theme', 'light');
        showToast('☀️ Modo Claro activado');
      }
      renderAnalisisMesActual();
      renderDashboardCharts();
      renderCardAnalysis();
      renderHistoricoPanel();
    }

    
    // Manejo de Ítems Personalizados
    function openAddItemModal() {
      document.getElementById('modalAddItem').style.display = 'flex';
      document.getElementById('newItemName').focus();
    }

    function closeAddItemModal() {
      document.getElementById('modalAddItem').style.display = 'none';
    }

    function handleAddNewItem(e) {
      e.preventDefault();
      const name = document.getElementById('newItemName').value.trim();
      const cat = document.getElementById('newItemCat').value;
      const resp = document.getElementById('newItemResp').value;
      const base = parseInt(document.getElementById('newItemBase').value, 10) || 0;
      const actual = parseInt(document.getElementById('newItemActual').value, 10) || 0;
      const cuenta = document.getElementById('newItemCuenta').value;

      const newItem = {
        id: nuevoId('custom'),
        name: name,
        cat: cat,
        resp: resp,
        cuenta: cuenta,
        base: base,
        actual: actual,
        isCustom: true
      };

      currentAuditItems.push(newItem);
      const customs = currentAuditItems.filter(it => it.isCustom && !it.fromQuickBill);
      localStorage.setItem('custom_audit_items', JSON.stringify(customs));
      const month = document.getElementById('audit-month-select')?.value || '2026-10';
      localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
      renderAuditTable();
      triggerAutoSyncToCloud();
      closeAddItemModal();
      document.getElementById('newItemName').value = '';
      document.getElementById('newItemBase').value = '';
      document.getElementById('newItemActual').value = '';
      showToast(`¡Ítem "${name}" agregado con éxito al presupuesto!`);
    }

    async function deleteAuditItem(id) {
      if (await confirmar('¿Deseas eliminar este ítem personalizado?', 'Eliminar')) {
        currentAuditItems = currentAuditItems.filter(it => it.id !== id);
        const customs = currentAuditItems.filter(it => it.isCustom && !it.fromQuickBill);
        localStorage.setItem('custom_audit_items', JSON.stringify(customs));
        const month = document.getElementById('audit-month-select')?.value || '2026-10';
        localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
        renderAuditTable();
        triggerAutoSyncToCloud();
        showToast('Ítem eliminado con éxito');
      }
    }

    
    // Manejo de la Caja de Ingreso Rápido de Boletas
    // Quick bill functions handled in quick_bill_js
    function toggleGuide() {
      const g = document.getElementById('guideContent');
      const arrow = document.getElementById('guideArrow');
      if (g.style.display === 'none') {
        g.style.display = 'block';
        arrow.textContent = '▼';
      } else {
        g.style.display = 'none';
        arrow.textContent = '▶';
      }
    }

    // ---------- Píldora deslizante en los selectores ----------
    // Un fondo que se desliza hasta la opción activa (filtros, pestañas de abajo, vistas del historial, Limache/Huasco).
    // Solo apariencia: cada botón sigue haciendo lo mismo; la píldora se acomoda sola cuando cambia la opción activa.
    const GRUPOS_PILDORA = [
      { grupo: '.bottom-nav', activo: ':scope > .bottom-nav-item.active' },
      { grupo: '.dona-selector', activo: ':scope > button.activa' },
      { grupo: '#histVistas, #histRangos, #histServicios', activo: ':scope > .hist-chip.activa' },
      { grupo: '.lugar-toggle', activo: ':scope > .lugar-opcion:has(input:checked)' }
    ];
    function gruposDePildora() {
      const lista = [];
      GRUPOS_PILDORA.forEach(g => document.querySelectorAll(g.grupo).forEach(el => lista.push([el, g.activo])));
      // Cualquier fila de chips con una opción activa (filtros de gastos, checklist, tarjetas, sueldos)
      document.querySelectorAll('.chip-btn.active').forEach(b => {
        const p = b.parentElement;
        if (p && p.querySelectorAll(':scope > .chip-btn').length >= 2 && !lista.some(([el]) => el === p)) lista.push([p, ':scope > .chip-btn.active']);
      });
      return lista;
    }
    function moverPildora(cont, selector) {
      let pildora = cont.querySelector(':scope > .pill-fondo');
      if (!pildora) {
        pildora = document.createElement('span');
        pildora.className = 'pill-fondo';
        pildora.setAttribute('aria-hidden', 'true');
        cont.classList.add('pill-grupo');
        cont.appendChild(pildora); // al final: no cambia el orden (nth-child) de los botones
        // Un grupo que se vuelve a dibujar parte desde donde estaba la píldora anterior
        if (cont._pildora) Object.assign(pildora.style, cont._pildora, { transition: 'none' });
      }
      const activo = cont.querySelector(selector);
      if (!activo || !activo.offsetParent || !activo.offsetWidth) { pildora.style.opacity = '0'; return; }
      const pos = {
        width: activo.offsetWidth + 'px',
        height: activo.offsetHeight + 'px',
        transform: `translate(${activo.offsetLeft}px, ${activo.offsetTop}px)`,
        borderRadius: getComputedStyle(activo).borderRadius,
        opacity: '1'
      };
      const primeraVez = pildora.style.opacity !== '1';
      if (primeraVez && !cont._pildora) pildora.style.transition = 'none';
      Object.assign(pildora.style, pos);
      cont._pildora = pos;
      if (pildora.style.transition === 'none') requestAnimationFrame(() => requestAnimationFrame(() => { pildora.style.transition = ''; }));
    }
    let pildoraPendiente = false;
    function actualizarPildoras() {
      if (pildoraPendiente) return;
      pildoraPendiente = true;
      requestAnimationFrame(() => {
        pildoraPendiente = false;
        gruposDePildora().forEach(([el, sel]) => moverPildora(el, sel));
      });
    }
    function iniciarPildoras() {
      actualizarPildoras();
      new MutationObserver(actualizarPildoras).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] });
      document.addEventListener('change', actualizarPildoras, true);
      window.addEventListener('resize', actualizarPildoras, { passive: true });
      document.addEventListener('scroll', (e) => { if (e.target?.classList?.contains('pill-grupo')) actualizarPildoras(); }, true);
      if (window.ResizeObserver) new ResizeObserver(actualizarPildoras).observe(document.body);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarPildoras);
    else iniciarPildoras();
