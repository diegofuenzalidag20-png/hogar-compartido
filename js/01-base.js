// Utilidades (parseSeguro, formatCLP, nuevoId), ventanas propias (dialogo/avisar/confirmar/pedirTexto), pestañas, menú, hoja de registro, tema e ítems manuales.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    function parseSeguro(texto, respaldo) {
      if (texto === null || texto === undefined || texto === '') return respaldo;
      try { return JSON.parse(texto) ?? respaldo; } catch (e) { return respaldo; }
    }
    function leerJSON(clave, respaldo) { return parseSeguro(localStorage.getItem(clave), respaldo); }

    const storageSetItemOriginal = Storage.prototype.setItem;
    Storage.prototype.setItem = function (clave, valor) {
      try {
        return storageSetItemOriginal.call(this, clave, valor);
      } catch (e) {
        console.error('Almacenamiento lleno:', e);
        if (typeof showToast === 'function') showToast('⚠️ La memoria del teléfono está llena; este cambio podría no guardarse aquí.');
      }
    };

    const temaClaro = () => document.body.getAttribute('data-theme') === 'light';
    function chartTextColor() { return temaClaro() ? '#1E293B' : '#F1F5F9'; }
    function chartBorderColor() { return temaClaro() ? '#FFFFFF' : 'rgba(10, 15, 30, 0.9)'; }

    // ---------- Ventanas propias (reemplazan alert/confirm/prompt del sistema) ----------
    // Devuelve una promesa: true/false al confirmar, el texto escrito (o null) al pedir un dato.
    function dialogo({ texto, aceptar = 'Entendido', cancelar = null, entrada = null }) {
      return new Promise(resolve => {
        const fondo = document.createElement('div');
        fondo.className = 'dialogo-fondo';
        fondo.innerHTML = `<div class="dialogo" role="dialog" aria-modal="true"><p class="dialogo-texto"></p>${entrada !== null ? '<input class="dialogo-entrada" type="text">' : ''}<div class="dialogo-botones">${cancelar ? '<button type="button" class="btn-secondary dialogo-no"></button>' : ''}<button type="button" class="btn-primary dialogo-si"></button></div></div>`;
        fondo.querySelector('.dialogo-texto').textContent = texto;
        fondo.querySelector('.dialogo-si').textContent = aceptar;
        if (cancelar) fondo.querySelector('.dialogo-no').textContent = cancelar;
        const campo = fondo.querySelector('.dialogo-entrada');
        if (campo) campo.value = entrada;
        let listo = false;
        const responder = (si) => {
          if (listo) return;
          listo = true;
          fondo.remove();
          resolve(entrada !== null ? (si ? campo.value : null) : (cancelar ? !!si : true));
        };
        fondo.querySelector('.dialogo-si').onclick = () => responder(true);
        if (cancelar) fondo.querySelector('.dialogo-no').onclick = () => responder(false);
        fondo.addEventListener('keydown', e => { if (e.key === 'Escape') responder(false); if (e.key === 'Enter') responder(true); });
        document.body.appendChild(fondo);
        (campo || fondo.querySelector('.dialogo-si')).focus();
        if (campo) campo.select();
        window.dispatchEvent(new CustomEvent('dialogo-abierto', { detail: { texto, responder } }));
      });
    }
    const avisar = (texto) => dialogo({ texto: String(texto) });
    const confirmar = (texto, aceptar = 'Sí, continuar') => dialogo({ texto, aceptar, cancelar: 'Cancelar' });
    const pedirTexto = (texto, valor = '') => dialogo({ texto, entrada: String(valor ?? ''), aceptar: 'Aceptar', cancelar: 'Cancelar' });
    window.alert = (texto) => { avisar(texto); };

    function nuevoId(prefijo) { return `${prefijo}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`; }

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
      if (mobileLayout.matches && card.parentNode !== document.body) {
        card.before(quickCardHome);
        document.body.appendChild(card);
      } else if (!mobileLayout.matches && quickCardHome.parentNode) {
        quickCardHome.replaceWith(card);
        closeQuickSheet();
      }
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
