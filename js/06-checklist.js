// Reglas de cuentas (CHECKLIST_FIJOS, REGLAS_VARIABLES), Real sumado, ajuste de presupuestos, checklist y ventana de sincronización.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // Cuenta fija → cómo reconocer su pago en los gastos del mes (d: solo el detalle, sin la categoría)
    const CHECKLIST_FIJOS = {
      'item-1': { p: /aporte fijo/ },
      'item-1b': { p: /diferencial uf/ },
      'item-2': { p: /arriendo habitaci/, conHuasco: true },
      'item-3': { p: /servicios huasco/, conHuasco: true },
      'item-17': { p: /\bluz\b|chilquinta/ },
      'item-18': { p: /\bagua\b|esval/ },
      'item-19': { p: /\bgas\b/ },
      'item-21': { p: /gasto com[uú]n|condominio/ },
      'item-20c': { p: /internet/ },
      'item-20': { p: /\bclaro\b/ },
      'item-20b': { p: /entel/ },
      'item-23': { p: /smart visa/ },
      'item-24': { p: /aseo/ },
      // Premios y comida húmeda son gustos aparte: no cuentan como la compra de comida del mes
      'item-5': { p: /comida michis/, no: /h[uú]meda|premio|snack|golosina|churu/, gasto: /michi.*(h[uú]meda|premio|snack|golosina|churu)|(h[uú]meda|premio|churu).*michi/ },
      'item-6': { p: /arena/ },
      'item-7': { p: /netflix/, d: true },
      'item-8': { p: /crunchyroll/, d: true },
      'item-9': { p: /eutirox/ },
      'item-10': { p: /rupatadina/ }
    };

    // Cuentas variables del presupuesto; el orden importa (lo más específico primero)
    const REGLAS_VARIABLES = {
      'item-26': { p: /veterin|vacuna/ },
      'item-11': { p: /pasaje/, conHuasco: true },
      'item-14': { p: /snack|turno/, conHuasco: true },
      'item-12': { p: /uber|colectivo|traslado/, conHuasco: true },
      'item-13': { p: /\bmetro\b|\befe\b/, conHuasco: true },
      'item-22': { p: /supermercado|lider|mayorista|unimarc|santa isabel/ },
      'item-30': { p: /consulta|dental/ },
      'item-29': { p: /bolsillo personal|gastos propios/ },
      'item-28': { p: /imprevist|gastos hogar/ },
      'item-27': { p: /comida fuera|salida|delivery|almuerzo|desayuno|comida viaje|^alimentaci/ }
    };

    // A qué cuenta del presupuesto pertenece un gasto: primero por regla (corrige enlaces viejos mal hechos), si no por su enlace guardado
    function itemIdPorReglas(g) {
      const ids = [...Object.keys(CHECKLIST_FIJOS), ...Object.keys(REGLAS_VARIABLES)];
      const existe = (id) => currentAuditItems.some(it => it.id === id);
      const texto = `${g.category || ''} ${g.desc || ''}`.toLowerCase();
      // "gasto": suma al Real de la cuenta sin contar como su pago del mes (ej. premios de los michis)
      return ids.find(id => existe(id) && gastoEsDeCuentaFija(id, g))
        || Object.keys(CHECKLIST_FIJOS).find(id => existe(id) && CHECKLIST_FIJOS[id].gasto?.test(texto)) || null;
    }
    function itemIdDeGasto(g) {
      return itemIdPorReglas(g) || (g.auditId && currentAuditItems.some(it => it.id === g.auditId) ? g.auditId : null);
    }

    // El "Real" de cada cuenta es la suma de sus pagos del mes, no el último pago
    function sincronizarRealDesdeGastos() {
      // "Internet + Celular (Diego)" quedó en $0 por repetirse con Planes Entel e Internet Hogar
      currentAuditItems = currentAuditItems.filter(it => !(it.id === 'item-4' && !(Number(it.base) > 0)));
      const suma = {};
      expenses.forEach(g => {
        const id = itemIdDeGasto(g);
        if (id) suma[id] = (suma[id] || 0) + (Number(g.amount) || 0);
      });
      currentAuditItems.forEach(it => {
        if (suma[it.id] !== undefined) it.actual = suma[it.id];
        else if (CHECKLIST_FIJOS[it.id] || REGLAS_VARIABLES[it.id]) it.actual = 0;
      });
    }

    function gastoEsDeCuentaFija(itemId, g) {
      const regla = CHECKLIST_FIJOS[itemId] || REGLAS_VARIABLES[itemId];
      if (!regla) return false;
      const t = (regla.d ? `${g.desc || ''}` : `${g.category || ''} ${g.desc || ''}`).toLowerCase();
      return regla.p.test(t) && (regla.conHuasco || !/huasco/.test(t)) && !(regla.no && regla.no.test(t));
    }

    // Propone presupuestos con lo pagado este mes: fijas = lo pagado; variables = lo gastado, proyectado si el mes no termina
    function propuestaDePresupuestos(hoy = new Date()) {
      sincronizarRealDesdeGastos();
      const [anio, mes] = (expenses.map(g => g.date).filter(Boolean).sort().pop() || getLocalDateISO()).split('-').map(Number);
      const diasMes = new Date(anio, mes, 0).getDate();
      const mesEnCurso = hoy.getFullYear() === anio && hoy.getMonth() + 1 === mes;
      const avance = mesEnCurso ? Math.min(1, hoy.getDate() / diasMes) : 1;
      const cambios = [];
      currentAuditItems.forEach(it => {
        let nuevo = null;
        const pagadoFijo = CHECKLIST_FIJOS[it.id] ? pagosDeCuentaFija(it.id).reduce((s, g) => s + (Number(g.amount) || 0), 0) : 0;
        if (pagadoFijo > 0) nuevo = pagadoFijo;
        if (REGLAS_VARIABLES[it.id] && it.actual > 0) nuevo = Math.ceil(it.actual / Math.max(avance, 0.25) / 1000) * 1000;
        if (nuevo !== null && nuevo !== it.base) cambios.push({ item: it, antes: it.base, despues: nuevo });
      });
      return { cambios, avance };
    }

    async function ajustarPresupuestosConElMes() {
      const { cambios, avance } = propuestaDePresupuestos();
      if (!cambios.length) { avisar('Los presupuestos ya calzan con lo pagado este mes.'); return; }
      const lineas = cambios.map(c => `• ${c.item.name}: ${formatCLP(c.antes)} → ${formatCLP(c.despues)}`).join('\n');
      const nota = avance < 1 ? `\n\nEl mes va en ${Math.round(avance * 100)}%: lo variable se proyecta al mes completo.` : '';
      if (!(await confirmar(`Ajustar ${cambios.length} presupuestos según lo pagado este mes:\n\n${lineas}${nota}`, 'Ajustar'))) return;
      cambios.forEach(c => { c.item.base = c.despues; });
      persistirBoletasActivas();
      triggerAutoSyncToCloud(true);
      showToast(`⚖️ ${cambios.length} presupuestos ajustados · Meta ${formatCLP(getMetaMensual())}`);
    }

    // Al abrir la app desde el día 10: avisa qué cuentas fijas aún no se registran (cuotas trimestrales no cuentan)
    function cuentasFijasPendientes() {
      return currentAuditItems.filter(it => CHECKLIST_FIJOS[it.id] && Number(it.base) > 0 && !/trimestral/i.test(it.name) && !pagosDeCuentaFija(it.id).length);
    }
    function recordarCuentasPendientes(hoy = new Date()) {
      const dia = getLocalDateISO();
      if (hoy.getDate() < 10 || localStorage.getItem('recordatorio_fijas_dia') === dia) return;
      const faltan = cuentasFijasPendientes();
      localStorage.setItem('recordatorio_fijas_dia', dia);
      if (!faltan.length) return;
      const nombres = faltan.slice(0, 3).map(it => it.name.replace(/\s*\(.*\)$/, '')).join(', ') + (faltan.length > 3 ? ` y ${faltan.length - 3} más` : '');
      showToast(`📋 Faltan ${faltan.length} ${faltan.length === 1 ? 'cuenta fija' : 'cuentas fijas'}: ${nombres}`, { label: 'Ver', onClick: () => { goToTab('tab-auditoria'); document.getElementById('checklistContainer')?.scrollIntoView({ block: 'start' }); } });
    }

    // Una cuenta fija está pagada solo si hay un gasto que calza con su regla (un premio enlazado a Comida Michis no la paga)
    function pagosDeCuentaFija(itemId) {
      return expenses.filter(g => gastoEsDeCuentaFija(itemId, g));
    }

    function renderChecklist() {
      const container = document.getElementById('checklistContainer');
      const badge = document.getElementById('checklistProgressBadge');
      if (!container) return;

      container.innerHTML = '';

      // Solo cuentas fijas y grandes; lo variable (Uber, súper, salidas) se ve en la lista de gastos
      const fijas = currentAuditItems.filter(it => CHECKLIST_FIJOS[it.id]);
      let filteredItems = fijas;
      if (currentChecklistFilter === 'hogar') {
        filteredItems = fijas.filter(isHouseholdBill);
      } else if (currentChecklistFilter === 'diego') {
        filteredItems = fijas.filter(it => it.resp === 'Diego');
      } else if (currentChecklistFilter === 'soledad') {
        filteredItems = fijas.filter(it => it.resp === 'Soledad');
      }

      let doneCount = 0;
      let totalCount = filteredItems.length;

      filteredItems.forEach(item => {
        const pagos = pagosDeCuentaFija(item.id);
        const pagado = pagos.reduce((s, g) => s + (Number(g.amount) || 0), 0);
        const isDone = pagos.length > 0;
        if (isDone) doneCount++;

        const div = document.createElement('div');
        div.className = `check-item ${isDone ? 'done' : 'pending'}`;
        if (!isDone) div.onclick = () => quickSelectChip(item.name, item.base, item.resp, item.cat, item.cuenta, item.name);

        const respColor = item.resp === 'Diego' ? 'var(--accent-diego)' : 'var(--accent-soledad)';
        const statusIcon = isDone ? '✅' : '⏳';
        const statusText = isDone ? formatCLP(pagado) : 'Falta';
        const detalle = isDone
          ? (pagos.length > 1 ? `${pagos.length} pagos registrados · revisa si se repitió` : `Pagado el ${escapeHtml(pagos[0].date || '')}`)
          : `Aprox. ${formatCLP(item.base)} · toca para registrar`;

        div.innerHTML = `
          <div>
            <div style="font-weight:600; font-size:0.83rem;">${escapeHtml(item.name)}</div>
            <div style="font-size:0.72rem; color:${respColor}; font-weight:600;">${escapeHtml(item.resp)} • ${escapeHtml(item.cuenta)}</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:0.82rem; font-weight:700; color:${isDone ? 'var(--accent-emerald)' : 'var(--accent-amber)'};">
              ${statusIcon} ${statusText}
            </div>
            <div style="font-size:0.68rem; color:${isDone && pagos.length > 1 ? 'var(--accent-amber)' : 'var(--text-dim)'};">${detalle}</div>
          </div>
        `;
        container.appendChild(div);
      });

      if (badge) {
        const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
        const filterTitle = currentChecklistFilter === 'hogar' 
          ? 'boletas del hogar' 
          : (currentChecklistFilter === 'diego' 
              ? 'fijos Diego' 
              : (currentChecklistFilter === 'soledad' ? 'cuentas Soledad' : 'cuentas fijas'));
        badge.textContent = `${doneCount} de ${totalCount} ${filterTitle} (${pct}%)`;
        badge.className = pct === 100 ? 'badge badge-emerald' : 'badge badge-blue';
      }
    }

    // --- GESTIÓN DE MODAL SYNC & TABS ---
    function openSyncModal(targetTab) {
      try {
        loadSavedCloudSettings();
      } catch (e) {
        console.warn('Error al preparar modal de sincronización:', e);
      }
      const modal = document.getElementById('modalSync');
      if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '1';
      }
      if (targetTab) {
        switchSyncTab(targetTab);
      }
    }
    window.openSyncModal = openSyncModal;

    function closeSyncModal() {
      const modal = document.getElementById('modalSync');
      if (modal) modal.style.display = 'none';
    }
    window.closeSyncModal = closeSyncModal;

    function switchSyncTab(tab) {
      document.querySelectorAll('.sync-tab-btn').forEach(b => {
        b.style.background = 'transparent';
        b.style.color = 'var(--text-muted)';
        b.style.fontWeight = '600';
      });
      document.querySelectorAll('.sync-pane').forEach(p => p.style.display = 'none');

      if (tab === 'wa') {
        const btn = document.getElementById('tabBtnSyncWa');
        if (btn) { btn.style.background = 'var(--accent-emerald)'; btn.style.color = '#000'; btn.style.fontWeight = '700'; }
        document.getElementById('syncPaneWa').style.display = 'block';
      } else if (tab === 'cloud') {
        const btn = document.getElementById('tabBtnSyncCloud');
        if (btn) { btn.style.background = 'var(--accent-blue)'; btn.style.color = '#fff'; btn.style.fontWeight = '700'; }
        document.getElementById('syncPaneCloud').style.display = 'block';
      } else if (tab === 'backup') {
        const btn = document.getElementById('tabBtnSyncBackup');
        if (btn) { btn.style.background = 'var(--accent-diego)'; btn.style.color = '#fff'; btn.style.fontWeight = '700'; }
        document.getElementById('syncPaneBackup').style.display = 'block';
      }
    }

    function toggleCloudProviderUI() {
      const isVps = document.getElementById('radioProviderVps').checked;
      document.getElementById('cloudFormVps').style.display = isVps ? 'block' : 'none';
      document.getElementById('cloudFormFirebase').style.display = isVps ? 'none' : 'block';
    }

    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      const btn = document.getElementById('btnInstallPwa');
      if (btn) btn.style.display = 'inline-flex';
    });
