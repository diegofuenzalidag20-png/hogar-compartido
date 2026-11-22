// Cuentas del presupuesto del mes (masterAuditItems), tabla de auditoría, KPIs y paneles de liquidez.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // AUDITORÍA & CONTROL DE DESVÍOS MENSUALES
    // Basado en los promedios reales de los 14 meses (Ago 2024 - Sep 2025)
    // AUDITORÍA & CONTROL DE DESVÍOS MENSUALES
    // Basado en los promedios reales de los 14 meses (Ago 2024 - Sep 2025)
    const masterAuditItems = [
      { id: 'item-1', name: 'Crédito Hipotecario (Aporte Fijo Diego)', cat: 'Vivienda Co-Aporte', resp: 'Diego', cuenta: 'Cuenta Fan', base: 365000, actual: 365000 },
      { id: 'item-1b', name: 'Crédito Hipotecario (Diferencial UF Soledad)', cat: 'Vivienda Co-Aporte', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 10000, actual: 10000 },
      { id: 'item-2', name: 'Arriendo Habitación Huasco', cat: 'Vivienda Huasco', resp: 'Diego', cuenta: 'Cuenta Fan', base: 95000, actual: 95000 },
      { id: 'item-3', name: 'Pagos Servicios Huasco (Luz y Agua)', cat: 'Vivienda Huasco', resp: 'Diego', cuenta: 'Tenpo', base: 11000, actual: 11000 },
      { id: 'item-5', name: 'Comida Michis (Promedio)', cat: 'Mascotas', resp: 'Diego', cuenta: 'Cuenta Fan', base: 42200, actual: 42200 },
      { id: 'item-6', name: 'Arena Sanitaria Michis', cat: 'Mascotas', resp: 'Diego', cuenta: 'Cuenta Fan', base: 20000, actual: 20000 },
      { id: 'item-7', name: 'Netflix', cat: 'Streaming', resp: 'Diego', cuenta: 'Cuenta Fan', base: 10700, actual: 10700 },
      { id: 'item-8', name: 'Crunchyroll', cat: 'Streaming', resp: 'Diego', cuenta: 'Cuenta Fan', base: 4990, actual: 4990 },
      { id: 'item-9', name: 'Eutirox 137', cat: 'Salud', resp: 'Diego', cuenta: 'Cuenta Fan', base: 9785, actual: 9785 },
      { id: 'item-10', name: 'Rupatadina', cat: 'Salud', resp: 'Diego', cuenta: 'Cuenta Fan', base: 14685, actual: 14685 },
      { id: 'item-11', name: 'Pasajes Bus Huasco (8 tramos)', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 140000, actual: 140000 },
      { id: 'item-12', name: 'Uber (Traslados y retenciones)', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 80000, actual: 80000 },
      { id: 'item-13', name: 'Metro Valparaíso (EFE)', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 10000, actual: 10000 },
      { id: 'item-14', name: 'Snacks y comidas de viaje Huasco', cat: 'Operaciones', resp: 'Diego', cuenta: 'Tenpo', base: 60000, actual: 60000 },
      { id: 'item-15', name: 'Bolsillo Mach ($35k x 4)', cat: 'Bolsillo', resp: 'Diego', cuenta: 'Mach', base: 140000, actual: 140000 },
      { id: 'item-16', name: 'Fondo Emergencia Mercado Pago', cat: 'Ahorro', resp: 'Diego', cuenta: 'Mercado Pago', base: 130000, actual: 130000 },
      { id: 'item-17', name: 'Luz Chilquinta Limache', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 23762, actual: 23762 },
      { id: 'item-18', name: 'Agua Esval Limache', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 7840, actual: 7840 },
      { id: 'item-19', name: 'Gas Balón/Red Limache', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 25500, actual: 25500 },
      { id: 'item-20', name: 'Plan Claro Soledad', cat: 'Conectividad', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 9600, actual: 9600 },
      { id: 'item-20b', name: 'Planes Entel', cat: 'Conectividad', resp: 'Diego', cuenta: 'Cuenta Fan', base: 15000, actual: 15000 },
      { id: 'item-20c', name: 'Internet Hogar', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 22000, actual: 22000 },
      { id: 'item-21', name: 'Gasto Común Condominio', cat: 'Hogar Limache', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 56315, actual: 56315 },
      { id: 'item-22', name: 'Supermercado Hogar Limache', cat: 'Alimentación', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 120000, actual: 120000 },
      { id: 'item-32', name: 'Mantención Cuenta Corriente BCI (0,15 UF)', cat: 'Mantención Cuenta Corriente BCI', resp: 'Diego', cuenta: 'BCI Cuenta Corriente', base: 6197, actual: 0 },
      { id: 'item-33', name: 'Administración Tarjeta de Crédito BCI (0,17 UF)', cat: 'Administración Tarjeta de Crédito BCI', resp: 'Diego', cuenta: 'BCI Cuenta Corriente', base: 7024, actual: 0 },
      { id: 'item-23', name: 'Tarjeta Smart Visa (Compromiso)', cat: 'Compromisos / Crédito', resp: 'Soledad', cuenta: 'Tarjeta Smart Visa', base: 50000, actual: 50000 },
      { id: 'item-24', name: 'Aseo Domiciliario (Cuota Trimestral)', cat: 'Contribuciones', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 13841, actual: 13841 },
      { id: 'item-26', name: 'Vacunas / Salud Michis', cat: 'Mascotas', resp: 'Soledad', cuenta: 'Chequera BancoEstado', base: 45000, actual: 45000 }
    ];

    let currentAuditItems = JSON.parse(JSON.stringify(masterAuditItems));

    // Los gastos sin boleta conocida antes se guardaban también como presupuesto
    function quitarGastosDelPresupuesto(items, itemsManuales) {
      const manuales = new Set((itemsManuales || []).map(it => it.id));
      items.forEach(it => {
        if (it.isCustom && !it.fromQuickBill && !manuales.has(it.id)) {
          it.base = 0;
          it.fromQuickBill = true;
        }
      });
    }

    function loadCurrentMonthAudit() {
      const selectEl = document.getElementById('audit-month-select');
      const month = selectEl ? selectEl.value : 'Oct-26';
      const saved = localStorage.getItem(`audit_${month}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentAuditItems = parsed;
          quitarGastosDelPresupuesto(currentAuditItems, leerJSON('custom_audit_items', []));
          }
        } catch(e) {}
      }
    }

    // Gasto real del mes: el Real de las cuentas sin el ahorro propio. Única fuente del superávit (Control, historial y cierre)
    function gastoRealDelMes() {
      sincronizarRealDesdeGastos();
      return currentAuditItems.filter(it => !esAhorroPropio(it)).reduce((s, it) => s + (Number(it.actual) || 0), 0);
    }

    function renderAuditTable() {
      sincronizarRealDesdeGastos();
      if (typeof renderAnalisisMesActual === 'function' && document.getElementById('tab-mes-actual')?.classList.contains('active')) {
        renderAnalisisMesActual();
      }
      const tbody = document.getElementById('audit-tbody');
      if (tbody) tbody.innerHTML = '';

      let totalBase = 0;
      let totalReal = 0;
      const calculados = idsConRealCalculado();

      currentAuditItems.forEach((item) => {
        if (!esAhorroPropio(item)) {
          totalBase += item.base;
          totalReal += item.actual;
        }

        const diff = item.actual - item.base;
        const pct = item.base > 0 ? (diff / item.base) * 100 : 0;

        let badgeHtml = '';
        if (diff > 12000 || pct > 15) {
          badgeHtml = '<span class="badge badge-rose">🔴 Desvío Fuerte</span>';
        } else if (diff > 4000 || pct > 8) {
          badgeHtml = '<span class="badge badge-amber">🟡 Alerta (+8%)</span>';
        } else if (diff < -4000) {
          badgeHtml = '<span class="badge badge-emerald">💎 Ahorro</span>';
        } else {
          badgeHtml = '<span class="badge badge-blue">🟢 En Rango</span>';
        }

        const respBadge = item.resp === 'Diego'
          ? '<span style="font-weight:700; color:var(--accent-diego);">Diego</span> <small style="color:var(--text-dim);">(' + escapeHtml(item.cuenta) + ')</small>'
          : '<span style="font-weight:700; color:var(--accent-soledad);">Soledad</span> <small style="color:var(--text-dim);">(' + escapeHtml(item.cuenta) + ')</small>';

        const diffClass = diff > 0 ? 'style="color:#F43F5E; font-weight:700;"' : (diff < 0 ? 'style="color:#10B981; font-weight:700;"' : 'style="color:var(--text-muted);"');

        const deleteBtn = item.isCustom
          ? ` <button type="button" class="btn-borrar-item" style="background:transparent; border:none; color:var(--accent-rose); cursor:pointer; font-size:0.85rem;" title="Eliminar ítem">🗑️</button>`
          : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>
            <strong>${escapeHtml(item.name)}</strong>${deleteBtn}
            <div style="font-size:0.75rem; color:var(--text-dim);">${escapeHtml(item.cat)}</div>
          </td>
          <td style="text-align:center;">${respBadge}</td>
          <td style="text-align:right; font-weight:600; color:var(--text-muted);">${formatCLP(item.base)}</td>
          <td style="text-align:right;">
            <input type="number" class="input-real" value="${Number(item.actual) || 0}"${calculados.has(item.id) ? ' readonly title="Se calcula con los gastos registrados"' : ''}>
          </td>
          <td style="text-align:right;" ${diffClass}>
            ${diff > 0 ? '+' : ''}${formatCLP(diff)} <small>(${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)</small>
          </td>
          <td style="text-align:center;">${badgeHtml}</td>
        `;
        // Listeners directos: el id viene de los datos y no debe armarse como código
        // change y no input: redibujar la tabla en cada tecla quitaba el foco y dejaba solo el primer dígito
        if (!calculados.has(item.id)) tr.querySelector('.input-real').onchange = (e) => updateAuditItem(item.id, e.target.value);
        tr.querySelector('.btn-borrar-item')?.addEventListener('click', () => deleteAuditItem(item.id));
        if (tbody) tbody.appendChild(tr);
      });

      // Update Audit KPIs
      const netDiff = totalReal - totalBase;
      const householdIncome = userProfile.diegoSalary + userProfile.soledadSalary;
      const superavitReal = householdIncome - gastoRealDelMes();

      document.getElementById('audit-kpi-base').textContent = formatCLP(totalBase);
      const subMeta = document.getElementById('audit-kpi-base-sub');
      if (subMeta) subMeta.textContent = `Gastos del mes · ahorro y bolsillo Mach aparte: ${formatCLP(ahorroDelMes())}`;
      document.getElementById('audit-kpi-real').textContent = formatCLP(totalReal);
      document.getElementById('audit-kpi-diff').textContent = (netDiff > 0 ? '+' : '') + formatCLP(netDiff);
      document.getElementById('audit-kpi-superavit').textContent = formatCLP(superavitReal);

      // Paneles personales: porcentaje usado de la plata de todas las cuentas de cada uno
      [['Soledad', 'sole'], ['Diego', 'diego']].forEach(([owner, k]) => {
        const liq = getLiquidezPersona(owner);
        const pctEl = document.getElementById(`${k}LiqPct`);
        const bar = document.getElementById(`${k}LiqBar`);
        const barra = document.getElementById(`${k}LiqBarra`);
        if (pctEl) pctEl.textContent = `${liq.pct}%`;
        if (barra) barra.setAttribute('aria-valuenow', String(liq.pct));
        if (bar) {
          bar.style.width = Math.min(100, Math.max(0, liq.pct)) + '%';
          bar.style.background = liq.pct >= 90 ? '#F43F5E' : liq.pct >= 70 ? '#F59E0B' : '';
        }
      });

      // Renderizar Checklist
      renderChecklist();

      const diffSub = document.getElementById('audit-kpi-diff-sub');
      const diffCard = document.getElementById('audit-card-diff');
      if (netDiff > 25000) {
        diffSub.textContent = '⚠️ Alerta: Desvío alto sobre presupuesto';
        diffCard.className = 'kpi-card rose';
      } else if (netDiff > 5000) {
        diffSub.textContent = 'Variación moderada sobre la meta';
        diffCard.className = 'kpi-card amber';
      } else if (netDiff < -5000) {
        diffSub.textContent = '¡Ahorro superávit del mes!';
        diffCard.className = 'kpi-card emerald';
      } else {
        diffSub.textContent = 'En rango óptimo presupuestado';
        diffCard.className = 'kpi-card blue';
      }
      // La meta y los fijos pendientes salen del presupuesto: la proyección de fin de mes se recalcula con él
      if (typeof renderProyeccionMes === 'function') renderProyeccionMes();
    }

    function updateAuditItem(id, value) {
      const val = parseInt(value, 10) || 0;
      const item = currentAuditItems.find(it => it.id === id);
      if (item) {
        item.actual = val;
        persistirBoletasActivas();
        triggerAutoSyncToCloud();
      }
    }

    function saveAuditMonth() {
      const month = document.getElementById('audit-month-select').value;
      localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
      triggerAutoSyncToCloud(true);
      showToast(`¡Cierre de mes ${month} guardado y sincronizado en la nube!`);
    }


    function onAuditMonthChange() {
      const month = document.getElementById('audit-month-select').value;
      const selectEl = document.getElementById('audit-month-select');
      const monthText = selectEl ? selectEl.options[selectEl.selectedIndex]?.text : month;

      const saved = localStorage.getItem(`audit_${month}`);
      if (saved) {
        currentAuditItems = JSON.parse(saved);
        showToast(`🗓️ Cargado cierre guardado de ${monthText}`);
      } else {
        currentAuditItems = JSON.parse(JSON.stringify(masterAuditItems));
        showToast(`🗓️ Cargado presupuesto base de ${monthText}`);
      }
      renderAuditTable();
      if (typeof syncAllGlassSelects === 'function') syncAllGlassSelects();
    }


    function copyWhatsAppSummary() {
      const month = document.getElementById('audit-month-select').options[document.getElementById('audit-month-select').selectedIndex].text;
      let totalBase = 0;
      let totalReal = 0;
      let warnings = [];

      currentAuditItems.forEach(item => {
        if (!esAhorroPropio(item)) {
          totalBase += item.base;
          totalReal += item.actual;
        }
        const diff = item.actual - item.base;
        const pct = item.base > 0 ? (diff / item.base) * 100 : 0;
        if (diff > 5000 || pct > 10) {
          warnings.push(`• ${item.name} (${item.resp}): ${formatCLP(item.actual)} (+${formatCLP(diff)} | +${pct.toFixed(0)}%)`);
        }
      });

      const netDiff = totalReal - totalBase;
      const superavit = (userProfile.diegoSalary + userProfile.soledadSalary) - gastoRealDelMes();

      let text = `📊 *CIERRE MENSUAL — HOGAR DIEGO & SOLEDAD*\n`;
      text += `🗓️ *Periodo:* ${month}\n\n`;
      text += `🎯 *Presupuesto Meta:* ${formatCLP(totalBase)}\n`;
      text += `💵 *Gasto Real Total:* ${formatCLP(totalReal)}\n`;
      text += `⚖️ *Diferencia Neta:* ${netDiff >= 0 ? '+' : ''}${formatCLP(netDiff)}\n`;
      text += `💎 *Superávit Libre Familiar:* ${formatCLP(superavit)}\n\n`;

      if (warnings.length > 0) {
        text += `⚠️ *Cuentas con variaciones a revisar:*\n${warnings.join('\n')}\n\n`;
      } else {
        text += `✅ *¡Todas las cuentas dentro del rango acordado!*\n\n`;
      }
      text += `✨ _Generado desde el Panel Financiero de Pareja_`;

      navigator.clipboard.writeText(text).then(() => {
        showToast('📲 ¡Resumen copiado! Listo para pegar en WhatsApp');
      }).catch(() => {
        showToast('Resumen generado');
      });
    }
