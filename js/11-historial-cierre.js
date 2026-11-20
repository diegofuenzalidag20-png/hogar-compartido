// Base de datos de meses, historial, guardar/cerrar/reabrir mes.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ==============================================================
    // 2. BASE DE DATOS MENSUAL HISTÓRICA & CIERRE DE PERIODOS
    // ==============================================================
    let currentActiveMonth = localStorage.getItem('app_active_month') || 'Octubre 2026';
    const monthNamesList = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    function getNextMonthLabel(currentLabel) {
      const parts = currentLabel.split(' ');
      const mName = parts[0];
      let year = parseInt(parts[1], 10) || 2026;
      const mIndex = monthNamesList.indexOf(mName);
      if (mIndex === -1) return "Noviembre 2026";
      if (mIndex === 11) {
        return `Enero ${year + 1}`;
      } else {
        return `${monthNamesList[mIndex + 1]} ${year}`;
      }
    }

function getMonthCode(monthLabel) {
      if (!monthLabel) return 'Mes';
      const parts = monthLabel.trim().split(/\s+/);
      const m = parts[0];
      const y = parts[1] ? parts[1].slice(-2) : '26';
      const shortMap = {
        'enero': 'Ene', 'febrero': 'Feb', 'marzo': 'Mar', 'abril': 'Abr',
        'mayo': 'May', 'junio': 'Jun', 'julio': 'Jul', 'agosto': 'Ago',
        'septiembre': 'Sep', 'octubre': 'Oct', 'noviembre': 'Nov', 'diciembre': 'Dic'
      };
      const shortM = shortMap[m.toLowerCase()] || m.substring(0, 3);
      return `${shortM}-${y}`;
    }

    function matchMonth(m, targetName) {
      if (!m || !targetName) return false;
      const target = targetName.toLowerCase().trim();
      const mName = (m.nombre || '').toLowerCase().trim();
      if (mName === target) return true;

      const mId = (m.id || '').toLowerCase().trim();
      const targetId = ('mes-' + target.replace(/\s+/g, '-')).toLowerCase();
      if (mId === targetId) return true;

      const codeTarget = getMonthCode(targetName).toLowerCase();
      if ((m.code || '').toLowerCase() === codeTarget) return true;
      if (mId === 'mes-' + codeTarget) return true;

      return false;
    }

    // BASE DE DATOS HISTÓRICA CONSOLIDADA (26 MESES AUDITADOS: AGO-24 A SEP-26)
    const BASE_HISTORICAL_26_MONTHS = [
      { code: 'Ago-24', nombre: 'Agosto 2024', luz: 53251, agua: 7610, gas: 28550, claro: 9150, gc: 47000, michis: 105000, hipo: 0, smart: 0, super: 50000, total: 300561 },
      { code: 'Sep-24', nombre: 'Septiembre 2024', luz: 22486, agua: 7280, gas: 19500, claro: 9150, gc: 51000, michis: 105000, hipo: 0, smart: 0, super: 50000, total: 264416 },
      { code: 'Oct-24', nombre: 'Octubre 2024', luz: 12930, agua: 6370, gas: 19850, claro: 9208, gc: 52723, michis: 0, hipo: 0, smart: 0, super: 97000, total: 198081 },
      { code: 'Nov-24', nombre: 'Noviembre 2024', luz: 14081, agua: 6470, gas: 15250, claro: 9208, gc: 49748, michis: 60000, hipo: 346506, smart: 0, super: 50000, total: 551263 },
      { code: 'Dic-24', nombre: 'Diciembre 2024', luz: 12496, agua: 6420, gas: 15750, claro: 9329, gc: 51273, michis: 28000, hipo: 348108, smart: 0, super: 100000, total: 571376 },
      { code: 'Ene-25', nombre: 'Enero 2025', luz: 12597, agua: 6440, gas: 15850, claro: 9329, gc: 52426, michis: 66000, hipo: 350320, smart: 0, super: 50000, total: 562962 },
      { code: 'Feb-25', nombre: 'Febrero 2025', luz: 16010, agua: 7160, gas: 15900, claro: 9329, gc: 58696, michis: 60000, hipo: 352707, smart: 0, super: 0, total: 519802 },
      { code: 'Mar-25', nombre: 'Marzo 2025', luz: 15512, agua: 8030, gas: 11350, claro: 9429, gc: 54132, michis: 57800, hipo: 354930, smart: 54640, super: 0, total: 565823 },
      { code: 'Abr-25', nombre: 'Abril 2025', luz: 18206, agua: 7140, gas: 21100, claro: 9434, gc: 46904, michis: 17900, hipo: 356679, smart: 0, super: 139600, total: 626963 },
      { code: 'May-25', nombre: 'Mayo 2025', luz: 17641, agua: 8020, gas: 20900, claro: 9434, gc: 53670, michis: 57990, hipo: 357554, smart: 0, super: 153000, total: 678209 },
      { code: 'Jun-25', nombre: 'Junio 2025', luz: 23359, agua: 7134, gas: 20950, claro: 9537, gc: 53476, michis: 60000, hipo: 358261, smart: 23815, super: 123320, total: 679852 },
      { code: 'Jul-25', nombre: 'Julio 2025', luz: 40631, agua: 6230, gas: 20850, claro: 9539, gc: 53571, michis: 62363, hipo: 357433, smart: 52304, super: 0, total: 602921 },
      { code: 'Ago-25', nombre: 'Agosto 2025', luz: 28122, agua: 7870, gas: 30300, claro: 9537, gc: 54606, michis: 71700, hipo: 359354, smart: 48994, super: 0, total: 610483 },
      { code: 'Sep-25', nombre: 'Septiembre 2025', luz: 23762, agua: 7840, gas: 25500, claro: 9600, gc: 56315, michis: 77000, hipo: 360181, smart: 50000, super: 13841, total: 674039 },
      { code: 'Oct-25', nombre: 'Octubre 2025', luz: 22907, agua: 6920, gas: 25450, claro: 9600, gc: 52365, michis: 25000, hipo: 361131, smart: 50000, super: 0, total: 553373 },
      { code: 'Nov-25', nombre: 'Noviembre 2025', luz: 17326, agua: 6030, gas: 20700, claro: 9600, gc: 54647, michis: 21000, hipo: 361537, smart: 151336, super: 0, total: 642176 },
      { code: 'Dic-25', nombre: 'Diciembre 2025', luz: 17031, agua: 6880, gas: 20650, claro: 9670, gc: 53854, michis: 81400, hipo: 362386, smart: 62891, super: 128567, total: 743329 },
      { code: 'Ene-26', nombre: 'Enero 2026', luz: 17531, agua: 5970, gas: 11050, claro: 9650, gc: 53553, michis: 38000, hipo: 362044, smart: 68921, super: 180267, total: 746986 },
      { code: 'Feb-26', nombre: 'Febrero 2026', luz: 18196, agua: 5980, gas: 20500, claro: 9650, gc: 52189, michis: 40000, hipo: 362785, smart: 80000, super: 150267, total: 739567 },
      { code: 'Mar-26', nombre: 'Marzo 2026', luz: 17600, agua: 6960, gas: 15600, claro: 9696, gc: 55858, michis: 88000, hipo: 363277, smart: 40000, super: 185700, total: 782691 },
      { code: 'Abr-26', nombre: 'Abril 2026', luz: 18185, agua: 15414, gas: 21000, claro: 9696, gc: 53844, michis: 83000, hipo: 365790, smart: 77486, super: 22000, total: 666415 },
      { code: 'May-26', nombre: 'Mayo 2026', luz: 36223, agua: 0, gas: 27050, claro: 9696, gc: 52254, michis: 127300, hipo: 370390, smart: 92146, super: 22000, total: 737059 },
      { code: 'Jun-26', nombre: 'Junio 2026', luz: 49690, agua: 5320, gas: 17300, claro: 9914, gc: 55022, michis: 20000, hipo: 372021, smart: 147213, super: 50536, total: 727016 },
      { code: 'Jul-26', nombre: 'Julio 2026', luz: 54618, agua: 8490, gas: 27800, claro: 9914, gc: 49957, michis: 66900, hipo: 372317, smart: 100000, super: 119800, total: 809796 },
      { code: 'Ago-26', nombre: 'Agosto 2026', luz: 27604, agua: 7580, gas: 27600, claro: 9914, gc: 52597, michis: 23200, hipo: 372558, smart: 110000, super: 0, total: 631053 },
      { code: 'Sep-26', nombre: 'Septiembre 2026', luz: 17075, agua: 7460, gas: 22200, claro: 9938, gc: 53728, michis: 42900, hipo: 374199, smart: 110000, super: 0, total: 637500 }
    ];

    // Cada gasto cuenta en la primera categoría que calza
    const CATEGORIAS_HIST_EXTRA = [
      { k: 'arriendo', nombre: 'Arriendo Huasco', p: /arriendo habitaci/ },
      { k: 'servHuasco', nombre: 'Serv. Huasco', p: /servicios huasco/ },
      { k: 'pasajes', nombre: 'Pasajes', p: /pasaje/ },
      { k: 'traslados', nombre: 'Uber / Metro', p: /uber|colectivo|traslado|\bmetro\b|\befe\b/ },
      { k: 'turno', nombre: 'Snacks turno', p: /snack|turno/ },
      { k: 'internet', nombre: 'Internet', p: /internet|fibra/ },
      { k: 'entel', nombre: 'Entel', p: /entel/ },
      { k: 'streaming', nombre: 'Streaming', p: /netflix|crunchyroll|spotify|streaming/ },
      { k: 'panoramas', nombre: 'Salidas / Panoramas', p: /panorama|ocio/ },
      { k: 'salidas', nombre: 'Comida fuera', p: /comida fuera|salida|delivery|almuerzo|desayuno|comida viaje|^alimentaci/ },
      { k: 'remedios', nombre: 'Remedios', p: /eutirox|rupatadina|farmacia/ },
      { k: 'imprevistos', nombre: 'Imprevistos', p: /imprevist|gastos hogar/ }
    ];
    function extrasDeGastos(gastos) {
      if (!gastos.length) return {};
      const r = Object.fromEntries(CATEGORIAS_HIST_EXTRA.map(c => [c.k, 0]));
      gastos.forEach(g => {
        const texto = `${g.category || ''} ${g.desc || ''}`.toLowerCase();
        const c = CATEGORIAS_HIST_EXTRA.find(x => x.p.test(texto));
        if (c) r[c.k] += Number(g.amount) || 0;
      });
      return r;
    }

    function extractMonthlyBreakdown(monthRecord) {
      const items = monthRecord.items || [];
      const gastosDiarios = monthRecord.gastosDiarios || [];

      function getItemAmount(matcher) {
        const it = items.find(i => matcher((i.name || '').toLowerCase()));
        if (it) return Number(it.actual || it.base || 0);
        return 0;
      }

      function getItemsSum(matcher) {
        return items.filter(i => matcher((i.name || '').toLowerCase())).reduce((s, i) => s + Number(i.actual || i.base || 0), 0);
      }

      let luz = getItemAmount(n => n.includes('luz') && !n.includes('huasco'));
      let agua = getItemAmount(n => n.includes('agua') && !n.includes('huasco'));
      let gas = getItemAmount(n => n.includes('gas'));
      let claro = getItemAmount(n => n.includes('claro'));
      let gc = getItemAmount(n => n.includes('común') || n.includes('comun') || n.includes('condominio'));
      let michis = getItemsSum(n => n.includes('michi') || n.includes('mascota'));
      let hipo = getItemsSum(n => n.includes('hipotecario'));
      let smart = getItemAmount(n => n.includes('smart visa'));
      const smartExp = gastosDiarios.filter(e => ((e.account || '') + ' ' + (e.category || '')).toLowerCase().includes('smart')).reduce((s, e) => s + Number(e.amount || 0), 0);
      if (smart === 0 && smartExp > 0) smart = smartExp;

      let superOtros = getItemAmount(n => n.includes('supermercado') || n.includes('alimentación'));
      let otrosServicios = getItemsSum(n => n.includes('aseo') || n.includes('waldorf') || n.includes('contribución') || n.includes('contribucion'));
      superOtros += otrosServicios;

      // Lo realmente pagado manda sobre la boleta, que puede haber quedado con su valor por defecto
      const pagado = (patron) => gastosDiarios.reduce((suma, g) => {
        const texto = `${g.category || ''} ${g.desc || ''}`;
        return patron.test(texto) && !/huasco/i.test(texto) ? suma + (Number(g.amount) || 0) : suma;
      }, 0);
      const antesDePagos = luz + agua + gas + claro + gc + michis;
      luz = pagado(/\bluz\b|chilquinta/i) || luz;
      agua = pagado(/\bagua\b|esval/i) || agua;
      gas = pagado(/\bgas\b/i) || gas;
      claro = pagado(/\bclaro\b/i) || claro;
      gc = pagado(/gasto com[uú]n/i) || gc;
      michis = pagado(/michi/i) || michis;
      const ajustePagos = luz + agua + gas + claro + gc + michis - antesDePagos;

      let total = monthRecord.gastosHogar ? monthRecord.gastosHogar + ajustePagos : (luz + agua + gas + claro + gc + michis + hipo + smart + superOtros);

      if (luz === 0 && agua === 0 && gas === 0 && monthRecord.rawItems && Object.keys(monthRecord.rawItems).length > 0) {
        const raw = monthRecord.rawItems;
        luz = raw['Luz'] || 0;
        agua = raw['Agua'] || 0;
        gas = raw['Gas'] || 0;
        claro = raw['Plan Claro'] || 0;
        gc = raw['Gasto Común'] || 0;
        michis = raw['Michis'] || 0;
        hipo = raw['Hipotecario'] || 0;
        smart = raw['Smart Visa'] || 0;
        superOtros = raw['Super / Otros'] || 0;
        total = monthRecord.gastosHogar || 0;
      }

      let code = monthRecord.code;
      if (!code && monthRecord.nombre) {
        code = getMonthCode(monthRecord.nombre);
      }

      return {
        code: code || 'Oct-26',
        nombre: monthRecord.nombre || 'Octubre 2026',
        luz, agua, gas, claro, gc, michis, hipo, smart, super: superOtros, total,
        ...extrasDeGastos(gastosDiarios)
      };
    }

    function getConsolidatedHistoricalMonths() {
      const list = [...BASE_HISTORICAL_26_MONTHS];
      const raw = localStorage.getItem('db_historial_meses');
      if (!raw) return list;
      try {
        const dbList = JSON.parse(raw);
        if (!Array.isArray(dbList)) return list;

        // Añadir meses cerrados que vengan después de Sep-26
        dbList.forEach(dbm => {
          if (dbm.estado === 'Cerrado') {
            const breakdown = extractMonthlyBreakdown(dbm);
            const exists = list.findIndex(m => m.code.toLowerCase() === breakdown.code.toLowerCase() || (m.nombre && m.nombre.toLowerCase() === (dbm.nombre || '').toLowerCase()));
            if (exists === -1) {
              list.push(breakdown);
            }
          }
        });
      } catch(e) {
        console.error('Error consolidando meses históricos:', e);
      }
      const orden = (m) => { const [mes, anio] = m.code.split('-'); return Number(anio) * 12 + HIST_MESES.indexOf(mes); };
      return list.sort((a, b) => orden(a) - orden(b));
    }

    function renderDetailedHistoricalTable() {
      if (typeof renderLugarHistorial === 'function') renderLugarHistorial();
      const tbody = document.getElementById('detailedHistoricalTableBody');
      if (!tbody) return;

      const months = getConsolidatedHistoricalMonths();
      if (!months || months.length === 0) return;

      const badgeTotal = document.getElementById('badgeTotalMesesAuditados');
      if (badgeTotal) {
        const lastYear = months[months.length - 1].code.split('-')[1] || '26';
        badgeTotal.textContent = `${months.length} Meses Auditados (2024 - 20${lastYear})`;
      }

      const maxLuz = Math.max(...months.map(m => m.luz || 0));
      const minLuz = Math.min(...months.map(m => m.luz || 999999).filter(v => v > 0));
      const maxGas = Math.max(...months.map(m => m.gas || 0));
      const minGas = Math.min(...months.map(m => m.gas || 999999).filter(v => v > 0));
      const maxGC = Math.max(...months.map(m => m.gc || 0));
      const minGC = Math.min(...months.map(m => m.gc || 999999).filter(v => v > 0));

      let html = '';
      let sumLuz = 0, sumAgua = 0, sumGas = 0, sumClaro = 0, sumGC = 0;
      let sumMichis = 0, sumHipo = 0, sumSmart = 0, sumSuper = 0, sumTotal = 0;
      let countHipo = 0, countSmart = 0;

      // Encabezado con todas las categorías; las que no existían en meses antiguos quedan con "-"
      const thead = document.querySelector('#tablaHistoricaDetallada thead tr');
      if (thead) thead.innerHTML = ['Mes', 'Luz', 'Agua', 'Gas', 'Plan Claro', 'Gasto Común', 'Michis', 'Hipotecario', 'Smart Visa', 'Super / Otros', ...CATEGORIAS_HIST_EXTRA.map(c => c.nombre), 'Total Mes']
        .map((h, i) => `<th style="${i ? 'text-align:right;' : ''}${h === 'Total Mes' ? ' font-weight:700;' : ''} white-space:nowrap;">${h}</th>`).join('');
      const celda = (v, estilo = '') => `<td style="text-align:right; ${v > 0 ? estilo : 'color:var(--text-dim);'}">${v > 0 ? formatCLP(v) : '-'}</td>`;
      const fila = (m, etiqueta) => {
        const luzColor = m.luz === maxLuz ? 'color:#F43F5E;' : (m.luz === minLuz ? 'color:#10B981;' : '');
        const gasColor = m.gas === maxGas ? 'color:#F43F5E;' : (m.gas === minGas ? 'color:#10B981;' : '');
        const gcColor = m.gc === maxGC ? 'color:#F43F5E;' : (m.gc === minGC ? 'color:#10B981;' : '');
        return `
          <tr>
            <td style="white-space:nowrap;"><strong>${escapeHtml(etiqueta)}</strong></td>
            ${celda(m.luz, luzColor)}${celda(m.agua)}${celda(m.gas, gasColor)}${celda(m.claro)}${celda(m.gc, gcColor)}${celda(m.michis)}
            ${celda(m.hipo)}${celda(m.smart)}${celda(m.super)}
            ${CATEGORIAS_HIST_EXTRA.map(c => celda(m[c.k])).join('')}
            <td style="text-align:right; font-weight:700;">${formatCLP(m.total)}</td>
          </tr>`;
      };

      // El mes en curso va primero, con sus cifras de hoy, y no entra en los promedios
      const yaCerrado = months.some(m => m.code === getMonthCode(currentActiveMonth));
      if (!yaCerrado) {
        const enCurso = extractMonthlyBreakdown({ nombre: currentActiveMonth, code: getMonthCode(currentActiveMonth), items: currentAuditItems, gastosDiarios: expenses });
        html += fila(enCurso, `${enCurso.code} (en curso)`);
      }

      [...months].reverse().forEach(m => {
        sumLuz += m.luz || 0;
        sumAgua += m.agua || 0;
        sumGas += m.gas || 0;
        sumClaro += m.claro || 0;
        sumGC += m.gc || 0;
        sumMichis += m.michis || 0;
        sumSuper += m.super || 0;
        sumTotal += m.total || 0;
        if (m.hipo > 0) { sumHipo += m.hipo; countHipo++; }
        if (m.smart > 0) { sumSmart += m.smart; countSmart++; }
        html += fila(m, m.code);
      });

      // Promedio de las categorías nuevas: solo los meses que las tienen
      const promediosExtra = CATEGORIAS_HIST_EXTRA.map(c => {
        const v = months.map(m => m[c.k]).filter(x => x > 0);
        return v.length ? Math.round(v.reduce((s, x) => s + x, 0) / v.length) : 0;
      });

      const n = months.length;
      const avgLuz = Math.round(sumLuz / n);
      const avgAgua = Math.round(sumAgua / n);
      const avgGas = Math.round(sumGas / n);
      const avgClaro = Math.round(sumClaro / n);
      const avgGC = Math.round(sumGC / n);
      const avgMichis = Math.round(sumMichis / n);
      const avgHipo = countHipo > 0 ? Math.round(sumHipo / countHipo) : 0;
      const avgSmart = countSmart > 0 ? Math.round(sumSmart / countSmart) : 0;
      const avgSuper = Math.round(sumSuper / n);
      const avgTotal = Math.round(sumTotal / n);

      html += `
        <tr style="background: var(--bg-surface-elevated); font-weight:700; border-top: 2px solid var(--border-glass);">
          <td><strong>PROMEDIO REAL</strong></td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgLuz)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgAgua)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgGas)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgClaro)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgGC)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgMichis)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgHipo)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgSmart)}</td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(avgSuper)}</td>
          ${promediosExtra.map(v => `<td style="text-align:right; color:var(--accent-diego);">${v > 0 ? formatCLP(v) : '-'}</td>`).join('')}
          <td style="text-align:right; color:var(--accent-emerald); font-size:1.05rem;">${formatCLP(avgTotal)}</td>
        </tr>
      `;

      tbody.innerHTML = html;

      renderHistoricoPanel();
    }

    function repararYDeduplicarBDMeses() {
      const raw = localStorage.getItem('db_historial_meses');
      if (!raw) return;
      try {
        let list = JSON.parse(raw);
        if (!Array.isArray(list)) return;

        const rawBackup = localStorage.getItem('ultimo_mes_cerrado_backup');
        let backup = null;
        if (rawBackup) {
          try { backup = JSON.parse(rawBackup); } catch(e) {}
        }

        // 1. Unificar Octubre 2026 si hay duplicados
        const octobers = list.filter(m => matchMonth(m, 'Octubre 2026'));
        if (octobers.length > 1) {
          let richOctober = octobers.find(m => m.items && m.items.length > 0) ||
                            octobers.find(m => m.estado === 'Cerrado') ||
                            octobers[0];
          
          if (backup && matchMonth({ nombre: backup.closedMonth }, 'Octubre 2026')) {
            if (!richOctober.items || richOctober.items.length === 0) {
              richOctober.items = backup.currentAuditItems;
              richOctober.gastosDiarios = backup.expenses;
            }
          }

          richOctober.id = 'mes-oct-26';
          richOctober.code = 'Oct-26';
          richOctober.nombre = 'Octubre 2026';
          richOctober.estado = 'Cerrado';

          list = list.filter(m => !matchMonth(m, 'Octubre 2026'));
          list.unshift(richOctober);
        }

        // 2. Si el mes activo es "Noviembre 2026", asegurar que esté al inicio como "En Curso"
        if (currentActiveMonth === 'Noviembre 2026') {
          const hasNov = list.some(m => matchMonth(m, 'Noviembre 2026'));
          if (!hasNov) {
            const totalHogar = currentAuditItems.filter(isHouseholdBill).reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
            const fijosDiego = currentAuditItems.filter(it => it.resp === 'Diego').reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
            const totalIng = (userProfile?.diegoSalary || PERFIL_INICIAL.diegoSalary) + (userProfile?.soledadSalary || PERFIL_INICIAL.soledadSalary);
            const superavit = totalIng - (totalHogar + fijosDiego);

            list.unshift({
              id: 'mes-nov-26',
              code: 'Nov-26',
              nombre: 'Noviembre 2026',
              fecha: '2026-11-01',
              criterio: 'Mes Actual en Curso',
              diegoSal: userProfile?.diegoSalary || PERFIL_INICIAL.diegoSalary,
              soleSal: userProfile?.soledadSalary || PERFIL_INICIAL.soledadSalary,
              totalIng: totalIng,
              gastosHogar: totalHogar,
              fijosDiego: fijosDiego,
              superavit: superavit,
              estado: 'En Curso',
              items: JSON.parse(JSON.stringify(currentAuditItems)),
              gastosDiarios: JSON.parse(JSON.stringify(expenses))
            });
          }
        }

        // 3. Deduplicar estrictamente cualquier otro mes repetido
        const uniqueList = [];
        const seen = new Set();
        list.forEach(item => {
          const key = (item.nombre || item.code || '').toLowerCase().trim();
          if (!seen.has(key)) {
            seen.add(key);
            uniqueList.push(item);
          }
        });

        localStorage.setItem('db_historial_meses', JSON.stringify(uniqueList));
      } catch(e) {
        console.error('Error reparando BD meses:', e);
      }
    }

    function sincronizarMesActivoConBD() {
      const raw = localStorage.getItem('db_historial_meses');
      if (!raw) return;
      try {
        const list = JSON.parse(raw);
        if (!Array.isArray(list) || list.length === 0) return;

        // Detectar si hay un mes con estado "En Curso" en la BD
        const mesEnCurso = list.find(m => m.estado === 'En Curso');
        if (mesEnCurso && mesEnCurso.nombre) {
          if (currentActiveMonth !== mesEnCurso.nombre) {
            console.log(`🔄 Sincronizando mes activo desde BD: "${currentActiveMonth}" -> "${mesEnCurso.nombre}"`);
            currentActiveMonth = mesEnCurso.nombre;
            localStorage.setItem('app_active_month', currentActiveMonth);
            const elTitle = document.getElementById('activeMonthTitle');
            if (elTitle) elTitle.textContent = currentActiveMonth;
            if (typeof verificarBotonDeshacerCierre === 'function') verificarBotonDeshacerCierre();
            if (typeof actualizarSelectPeriodo === 'function') actualizarSelectPeriodo();
          }
        }
      } catch(e) {
        console.warn('Error sincronizando mes activo con BD:', e);
      }
    }

    function actualizarSelectPeriodo() {
      const select = document.getElementById('audit-month-select');
      if (!select) return;

      const code = typeof getMonthCode === 'function' ? getMonthCode(currentActiveMonth) : 'Nov-26';
      let opt = Array.from(select.options).find(o => o.value.toLowerCase() === code.toLowerCase());
      if (!opt) {
        const optgroup = select.querySelector('optgroup');
        if (optgroup) {
          Array.from(select.options).forEach(o => {
            o.textContent = o.textContent.replace(' (Mes Actual en Curso)', '');
          });
          const newOpt = document.createElement('option');
          newOpt.value = code;
          newOpt.textContent = `${currentActiveMonth} (Mes Actual en Curso)`;
          optgroup.prepend(newOpt);
          select.value = code;
        }
      } else {
        Array.from(select.options).forEach(o => {
          o.textContent = o.textContent.replace(' (Mes Actual en Curso)', '');
        });
        opt.textContent = `${currentActiveMonth} (Mes Actual en Curso)`;
        select.value = code;
      }
      if (typeof syncAllGlassSelects === 'function') syncAllGlassSelects();
    }

    function inicializarBDMeses() {
      sincronizarMesActivoConBD();
      const elTitle = document.getElementById('activeMonthTitle');
      if (elTitle) elTitle.textContent = currentActiveMonth;

      const DB_VERSION_KEY = 'db_history_version_v6_real_2026';
      const hasUpgraded = localStorage.getItem(DB_VERSION_KEY);

      const completeShiftedDbList = [
        {
          "id": "mes-oct-26",
          "code": "Oct-26",
          "nombre": "Octubre 2026",
          "fecha": "2026-10-30",
          "criterio": "Mes Actual en Curso",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "En Curso",
          "rawItems": {}
        },
        {
          "id": "mes-sep-26",
          "code": "Sep-26",
          "nombre": "Septiembre 2026",
          "fecha": "2026-09-30",
          "criterio": "Pagado: Hipotecario $374.2k, Smart $110k, Michis $42.9k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 637500,
          "fijosDiego": 609360,
          "superavit": 1451538,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-ago-26",
          "code": "Ago-26",
          "nombre": "Agosto 2026",
          "fecha": "2026-08-31",
          "criterio": "Pagado: Hipotecario $372.6k, Smart $110k, Luz $27.6k, Gas $27.6k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 631053,
          "fijosDiego": 609360,
          "superavit": 1457985,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-jul-26",
          "code": "Jul-26",
          "nombre": "Julio 2026",
          "fecha": "2026-07-31",
          "criterio": "Pagado: Luz $54.6k, Hipotecario $372.3k, Supermercado $119.8k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 809796,
          "fijosDiego": 609360,
          "superavit": 1279242,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-jun-26",
          "code": "Jun-26",
          "nombre": "Junio 2026",
          "fecha": "2026-06-30",
          "criterio": "Pagado: Luz $49.7k, Hipotecario $372k, Smart $147.2k, Aseo $28.5k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 727016,
          "fijosDiego": 609360,
          "superavit": 1362022,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-may-26",
          "code": "May-26",
          "nombre": "Mayo 2026",
          "fecha": "2026-05-31",
          "criterio": "Pagado: Hipotecario $370.4k, Smart $92.1k, Vacuna Michis $55k, Luz $36.2k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 737059,
          "fijosDiego": 609360,
          "superavit": 1351979,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-abr-26",
          "code": "Abr-26",
          "nombre": "Abril 2026",
          "fecha": "2026-04-30",
          "criterio": "Pagado: Hipotecario $365.8k, Michis $78k, Smart $77.5k, Agua x2 $15.4k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 666415,
          "fijosDiego": 609360,
          "superavit": 1422623,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-mar-26",
          "code": "Mar-26",
          "nombre": "Marzo 2026",
          "fecha": "2026-03-31",
          "criterio": "Pagado: Hipotecario $363.3k, Súper $164k, Michis $40k, Arena $29k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 782691,
          "fijosDiego": 609360,
          "superavit": 1306347,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-feb-26",
          "code": "Feb-26",
          "nombre": "Febrero 2026",
          "fecha": "2026-02-28",
          "criterio": "Pagado: Hipotecario $362.8k, Comedor $128.6k, Smart $80k, Michis $40k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 739567,
          "fijosDiego": 609360,
          "superavit": 1349471,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-ene-26",
          "code": "Ene-26",
          "nombre": "Enero 2026",
          "fecha": "2026-01-31",
          "criterio": "Pagado: Hipotecario $362k, Comedor $128.6k, Med. Sía $30k, Conducir $21.7k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 746986,
          "fijosDiego": 609360,
          "superavit": 1342052,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-dic-25",
          "code": "Dic-25",
          "nombre": "Diciembre 2025",
          "fecha": "2025-12-31",
          "criterio": "Pagado: Hipotecario $362.4k, Comedor $128.6k, Michis $60k, Smart $62.9k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 743329,
          "fijosDiego": 609360,
          "superavit": 1345709,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-nov-25",
          "code": "Nov-25",
          "nombre": "Noviembre 2025",
          "fecha": "2025-11-30",
          "criterio": "Pagado: Hipotecario $361.5k, Smart Visa $151.3k, Arena $21k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 642176,
          "fijosDiego": 609360,
          "superavit": 1446862,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-oct-25",
          "code": "Oct-25",
          "nombre": "Octubre 2025",
          "fecha": "2025-10-31",
          "criterio": "Pagado: Hipotecario $361.1k, Gas $25.5k, Comida Michis $25k, Smart $50k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 553373,
          "fijosDiego": 609360,
          "superavit": 1535665,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-sep-25",
          "code": "Sep-25",
          "nombre": "Septiembre 2025",
          "fecha": "2025-09-30",
          "criterio": "Pagado: Hipotecario $359.4k, Luz $28.1k, Gas $30.3k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-ago-25",
          "code": "Ago-25",
          "nombre": "Agosto 2025",
          "fecha": "2025-08-31",
          "criterio": "Pagado: Luz Invierno $40.6k, Hipotecario $357.4k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-jul-25",
          "code": "Jul-25",
          "nombre": "Julio 2025",
          "fecha": "2025-07-31",
          "criterio": "Pagado: Hipotecario $358.3k, Súper $109.8k, Smart $23.8k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-jun-25",
          "code": "Jun-25",
          "nombre": "Junio 2025",
          "fecha": "2025-06-30",
          "criterio": "Pagado: Hipotecario $357.6k, Súper $153k, Luz $17.6k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-may-25",
          "code": "May-25",
          "nombre": "Mayo 2025",
          "fecha": "2025-05-31",
          "criterio": "Pagado: Hipotecario $356.7k, Súper $126k, Aseo $13.6k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-abr-25",
          "code": "Abr-25",
          "nombre": "Abril 2025",
          "fecha": "2025-04-30",
          "criterio": "Pagado: Hipotecario $354.9k, Smart Visa $54.6k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-mar-25",
          "code": "Mar-25",
          "nombre": "Marzo 2025",
          "fecha": "2025-03-31",
          "criterio": "Pagado: Hipotecario $352.7k, Gasto Común $58.7k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-feb-25",
          "code": "Feb-25",
          "nombre": "Febrero 2025",
          "fecha": "2025-02-28",
          "criterio": "Pagado: Hipotecario $350.3k, Michis $46k, Proyector $50k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-ene-25",
          "code": "Ene-25",
          "nombre": "Enero 2025",
          "fecha": "2025-01-31",
          "criterio": "Pagado: Hipotecario $348.1k, Proyector $50k, Arena $28k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-dic-24",
          "code": "Dic-24",
          "nombre": "Diciembre 2024",
          "fecha": "2024-12-31",
          "criterio": "Pagado: Hipotecario $346.5k, Luz $14.1k, Michis $40k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-nov-24",
          "code": "Nov-24",
          "nombre": "Noviembre 2024",
          "fecha": "2024-11-30",
          "criterio": "Pagado: Gasto Común $52.7k, Gas $19.9k, Proyector $47k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-oct-24",
          "code": "Oct-24",
          "nombre": "Octubre 2024",
          "fecha": "2024-10-31",
          "criterio": "Pagado: Luz $22.5k, Gas $19.5k, Waldorf $50k, Vacuna $45k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        },
        {
          "id": "mes-sep-24",
          "code": "Sep-24",
          "nombre": "Septiembre 2024",
          "fecha": "2024-09-30",
          "criterio": "Pagado: Luz Invierno $53.3k, Gas $28.6k, Waldorf $50k",
          "diegoSal": 1214038,
          "soleSal": 875000,
          "totalIng": 2089038,
          "gastosHogar": 609360,
          "fijosDiego": 609360,
          "superavit": 870318,
          "estado": "Cerrado",
          "rawItems": {}
        }
      ];

      if (!hasUpgraded || !localStorage.getItem('db_historial_meses')) {
        localStorage.setItem('db_historial_meses', JSON.stringify(completeShiftedDbList));
        localStorage.setItem(DB_VERSION_KEY, 'true');
      }

      repararYDeduplicarBDMeses();
      renderTablaHistorialMesesBD();
      renderDetailedHistoricalTable();
    }

    const HIST_MESES_PAGINA = 6;
    let histMesesLimite = HIST_MESES_PAGINA;

    // El mes en curso siempre se muestra con los datos actuales, no con su última copia guardada
    function aplicarCifrasVigentes(mes) {
      if (!mes || mes.estado === 'Cerrado' || !matchMonth(mes, currentActiveMonth)) return mes;
      mes.diegoSal = userProfile.diegoSalary;
      mes.soleSal = userProfile.soledadSalary;
      mes.totalIng = mes.diegoSal + mes.soleSal;
      mes.gastosHogar = currentAuditItems.filter(isHouseholdBill).reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
      const fijosDiego = currentAuditItems.filter(it => it.resp === 'Diego').reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
      mes.superavit = mes.totalIng - (mes.gastosHogar + fijosDiego);
      mes.items = currentAuditItems;
      mes.gastosDiarios = expenses;
      return mes;
    }

    function renderTablaHistorialMesesBD() {
const tbody = document.getElementById('dbMesesTableBody');
      const badge = document.getElementById('dbMesesCountBadge');
      if (!tbody) return;

      const raw = localStorage.getItem('db_historial_meses');
      const list = parseSeguro(raw, []);

      if (badge) badge.textContent = `${list.length} Meses Registrados`;
      tbody.innerHTML = '';

      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-muted);">No hay meses guardados aún. Dale a "Guardar en Base de Datos".</td></tr>';
        return;
      }

      const maximoHogar = Math.max(1, ...list.map(m => Number(m.gastosHogar) || 0));
      const listaMeses = document.getElementById('dbMesesLista');
      if (listaMeses) listaMeses.innerHTML = '';

      list.forEach((item, posicion) => {
        const tr = document.createElement('tr');
        const isCerrado = item.estado === 'Cerrado';
        aplicarCifrasVigentes(item);
tr.innerHTML = `
          <td><strong>${escapeHtml(item.nombre)}</strong></td>
          <td style="text-align:right; color:var(--accent-diego);">${formatCLP(item.diegoSal)}</td>
          <td style="text-align:right; color:var(--accent-soledad);">${formatCLP(item.soleSal)}</td>
          <td style="text-align:right; font-weight:700;">${formatCLP(item.totalIng)}</td>
          <td style="text-align:right; color:#F43F5E;">${formatCLP(item.gastosHogar)}</td>
          <td style="text-align:right; color:#10B981; font-weight:700;">${formatCLP(item.superavit)}</td>
          <td style="text-align:center;">
            <span class="badge ${isCerrado ? 'badge-emerald' : 'badge-blue'}" style="font-size:0.7rem;">${item.estado}</span>
          </td>
          <td style="text-align:center;">
            <button type="button" class="btn-secondary" onclick="verDetalleMes('${item.id || item.code || item.nombre}')" style="padding:0.25rem 0.6rem; font-size:0.75rem;">
              👁️ Ver
            </button>
          </td>
        `;
        tbody.appendChild(tr);

        if (listaMeses && posicion < histMesesLimite) {
          const fila = document.createElement('button');
          fila.type = 'button';
          fila.className = 'mes-fila';
          fila.addEventListener('click', () => verDetalleMes(item.id || item.code || item.nombre));
          fila.innerHTML = `
            <span class="mes-nombre">${escapeHtml(item.nombre)}</span>
            <span class="badge ${isCerrado ? 'badge-emerald' : 'badge-blue'}">${escapeHtml(item.estado)}</span>
            <span class="mes-barra"><span style="width:${Math.min(100, Math.round((Number(item.gastosHogar) || 0) / maximoHogar * 100))}%;"></span></span>
            <span class="mes-dato">Gastos hogar <strong>${formatCLP(item.gastosHogar)}</strong></span>
            <span class="mes-dato">Superávit <strong>${formatCLP(item.superavit)}</strong></span>`;
          listaMeses.appendChild(fila);
        }
      });

      if (listaMeses && (list.length > HIST_MESES_PAGINA)) {
        const pie = document.createElement('div');
        pie.className = 'gastos-pie';
        const quedan = list.length - histMesesLimite;
        pie.innerHTML = `<span>Mostrando ${Math.min(histMesesLimite, list.length)} de ${list.length}</span>
          ${quedan > 0 ? `<button type="button" class="btn-secondary" onclick="verMasMesesHist(${HIST_MESES_PAGINA})">Ver ${Math.min(HIST_MESES_PAGINA, quedan)} más</button>` : ''}
          ${histMesesLimite > HIST_MESES_PAGINA ? `<button type="button" class="btn-secondary" onclick="verMasMesesHist(0)">Ver menos</button>` : ''}`;
        listaMeses.appendChild(pie);
      }
    }

    function verMasMesesHist(cantidad) {
      histMesesLimite = cantidad ? histMesesLimite + cantidad : HIST_MESES_PAGINA;
      renderTablaHistorialMesesBD();
    }

    function guardarMesEnBD(mesNombre = currentActiveMonth, isCerrado = false) {
      const raw = localStorage.getItem('db_historial_meses');
      let list = parseSeguro(raw, []);

      const totalHogar = currentAuditItems.filter(isHouseholdBill).reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
      const fijosDiego = currentAuditItems.filter(it => it.resp === 'Diego').reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
      const totalIng = (userProfile?.diegoSalary || PERFIL_INICIAL.diegoSalary) + (userProfile?.soledadSalary || PERFIL_INICIAL.soledadSalary);
      const superavit = totalIng - (totalHogar + fijosDiego);
      const code = getMonthCode(mesNombre);

      const snapshot = {
        id: 'mes-' + code.toLowerCase(),
        code: code,
        nombre: mesNombre,
        fecha: new Date().toISOString().split('T')[0],
        criterio: isCerrado ? 'Mes Cerrado y Auditado' : 'Registro de boletas en curso',
        lugarDiego: (({ Limache, Huasco }) => ({ Limache, Huasco }))(totalesLugarDiego()),
        diegoSal: userProfile?.diegoSalary || PERFIL_INICIAL.diegoSalary,
        soleSal: userProfile?.soledadSalary || PERFIL_INICIAL.soledadSalary,
        totalIng: totalIng,
        gastosHogar: totalHogar,
        fijosDiego: fijosDiego,
        superavit: superavit,
        items: JSON.parse(JSON.stringify(currentAuditItems)),
        gastosDiarios: JSON.parse(JSON.stringify(expenses)),
        estado: isCerrado ? 'Cerrado' : 'Guardado'
      };

      const idx = list.findIndex(m => matchMonth(m, mesNombre));
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...snapshot,
          estado: isCerrado ? 'Cerrado' : (list[idx].estado || 'Guardado')
        };
      } else {
        list.unshift(snapshot);
      }

      // Deduplicar lista completa
      const uniqueList = [];
      const seen = new Set();
      list.forEach(item => {
        const key = (item.nombre || item.code || '').toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      });

      localStorage.setItem('db_historial_meses', JSON.stringify(uniqueList));
      renderTablaHistorialMesesBD();
      renderDetailedHistoricalTable();
      if (isCerrado) {
        showToast(`💾 ¡Mes "${mesNombre}" guardado con éxito en la Base de Datos!`);
        return;
      }
      showToast('⏳ Guardando en la nube...');
      pushToFirestore(true).then(ok => showToast(ok
        ? `💾 ¡Mes "${mesNombre}" guardado en la nube!`
        : `⚠️ "${mesNombre}" quedó solo en este teléfono. Se reintentará automáticamente.`));
    }

    function asegurarMesActivoEnBD(mesNombre) {
      const raw = localStorage.getItem('db_historial_meses');
      let list = parseSeguro(raw, []);

      const code = getMonthCode(mesNombre);
      const totalHogar = currentAuditItems.filter(isHouseholdBill).reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
      const fijosDiego = currentAuditItems.filter(it => it.resp === 'Diego').reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
      const totalIng = (userProfile?.diegoSalary || PERFIL_INICIAL.diegoSalary) + (userProfile?.soledadSalary || PERFIL_INICIAL.soledadSalary);
      const superavit = totalIng - (totalHogar + fijosDiego);

      const activeRecord = {
        id: 'mes-' + code.toLowerCase(),
        code: code,
        nombre: mesNombre,
        fecha: new Date().toISOString().split('T')[0],
        criterio: 'Mes Actual en Curso',
        diegoSal: userProfile?.diegoSalary || PERFIL_INICIAL.diegoSalary,
        soleSal: userProfile?.soledadSalary || PERFIL_INICIAL.soledadSalary,
        totalIng: totalIng,
        gastosHogar: totalHogar,
        fijosDiego: fijosDiego,
        superavit: superavit,
        estado: 'En Curso',
        items: JSON.parse(JSON.stringify(currentAuditItems)),
        gastosDiarios: JSON.parse(JSON.stringify(expenses))
      };

      const idx = list.findIndex(m => matchMonth(m, mesNombre));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...activeRecord };
      } else {
        list.unshift(activeRecord);
      }

      // Asegurar que el mes activo quede primero
      const activeIdx = list.findIndex(m => matchMonth(m, mesNombre));
      if (activeIdx > 0) {
        const [act] = list.splice(activeIdx, 1);
        list.unshift(act);
      }

      const uniqueList = [];
      const seen = new Set();
      list.forEach(item => {
        const key = (item.nombre || item.code || '').toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      });

      localStorage.setItem('db_historial_meses', JSON.stringify(uniqueList));
      renderTablaHistorialMesesBD();
      renderDetailedHistoricalTable();
    }

    function abrirModalCerrarMes() {
      const modal = document.getElementById('modalCerrarMes');
      const spanActual = document.getElementById('modalCerrarMesActualNombre');
      const spanCierre = document.getElementById('modalSpanMesCierre');
      const spanNuevo = document.getElementById('modalSpanMesNuevo');
      const stats = document.getElementById('modalCerrarMesResumenStats');

      const next = getNextMonthLabel(currentActiveMonth);
      const totalHogar = currentAuditItems.filter(isHouseholdBill).reduce((acc, it) => acc + (it.actual || it.base || 0), 0);
      const totalIng = (userProfile?.diegoSalary || 0) + (userProfile?.soledadSalary || 0);

      if (spanActual) spanActual.textContent = currentActiveMonth;
      if (spanCierre) spanCierre.textContent = currentActiveMonth;
      if (spanNuevo) spanNuevo.textContent = next;
      if (stats) stats.textContent = `• Ingresos totales: ${formatCLP(totalIng)} | Gastos hogar auditados: ${formatCLP(totalHogar)}`;

      // Reiniciar checkbox de confirmación
      const check = document.getElementById('checkConfirmCierre');
      if (check) check.checked = false;
      toggleBtnConfirmarCierre();

      if (modal) modal.style.display = 'flex';
    }

    function cerrarModalCerrarMes() {
      const modal = document.getElementById('modalCerrarMes');
      if (modal) modal.style.display = 'none';
    }

    function toggleBtnConfirmarCierre() {
      const check = document.getElementById('checkConfirmCierre');
      const btn = document.getElementById('btnEjecutarCierre');
      if (check && btn) {
        btn.disabled = !check.checked;
        btn.style.opacity = check.checked ? '1' : '0.65';
        btn.style.cursor = check.checked ? 'pointer' : 'not-allowed';
      }
    }

    function ejecutarCierreConConfirmacion() {
      const check = document.getElementById('checkConfirmCierre');
      if (!check || !check.checked) {
        alert('Por favor marca la casilla confirmando que has revisado las boletas.');
        return;
      }
      confirmarCierreMes();
    }

    let ultimoCierreMes = 0;

    function confirmarCierreMes() {
      if (Date.now() - ultimoCierreMes < 400) return;
      ultimoCierreMes = Date.now();
      const oldMonth = currentActiveMonth;
      const nextMonth = getNextMonthLabel(currentActiveMonth);

      // 1. Guardar el mes que se cierra con estado "Cerrado" y todas sus boletas/gastos reales
      guardarMesEnBD(oldMonth, true);

      // 2. CREAR SNAPSHOT DE SEGURIDAD PARA PODER REABRIR O DESHACER
      const backupSnapshot = {
        closedMonth: oldMonth,
        nextMonth: nextMonth,
        currentAuditItems: JSON.parse(JSON.stringify(currentAuditItems)),
        expenses: JSON.parse(JSON.stringify(expenses)),
        userProfile: JSON.parse(JSON.stringify(userProfile || {})),
        timestamp: Date.now()
      };
      localStorage.setItem('ultimo_mes_cerrado_backup', JSON.stringify(backupSnapshot));

      // 3. CALCULAR REMANENTES SOBRANTES DEL MES CERRADO PARA PASAR AL NUEVO MES
      const spentByAcc = {};
      if (Array.isArray(expenses)) {
        expenses.forEach(it => {
          const k = normalizeAccountKey(it.account);
          spentByAcc[k] = (spentByAcc[k] || 0) + (Number(it.amount) || 0);
        });
      }

      // Saldos restantes no gastados de cada cofre al momento del cierre
      const saldoRemanenteMPDiego = Math.max(0, (userProfile.remanentes?.mpDiego || 0) + (userProfile.cofresDiego?.mpAhorro ?? 0) - (spentByAcc['mpDiego'] || 0));
      const saldoRemanenteMPSoledad = Math.max(0, (userProfile.remanentes?.mpSoledad || 0) + (userProfile.cofresSoledad?.mpAhorro ?? 0) - (spentByAcc['mpSoledad'] || 0));
      const saldoRemanenteBancoSole = Math.max(0, (userProfile.remanentes?.bancoSole || 0) + (userProfile.cofresSoledad?.bancoReserva ?? 0) - (spentByAcc['reservaSole'] || 0));
      const saldoRemanenteTenpoDiego = Math.max(0, (userProfile.remanentes?.tenpoDiego || 0) + (userProfile.cofresDiego?.tenpoHuasco ?? 0) - (spentByAcc['tenpoDiego'] || 0));
      const saldoRemanenteMachDiego = Math.max(0, getMachSemanal().disponible);
      const saldoRemanenteTenpoSole = Math.max(0, (userProfile.remanentes?.tenpoSoledad || 0) + (userProfile.cofresSoledad?.tenpoBolsillo ?? 0) - (spentByAcc['tenpoSoledad'] || 0));

      // Tarjeta Smart Visa: calcular deuda remanente que pasa al siguiente mes
      const deudaAnteriorSmart = userProfile.smartVisaConfig?.deudaPrevia || 0;
      const cuotaSmart = getSmartCuotaDelMes();
      const comprasSmartMes = spentByAcc['smartVisaSole'] || 0;
      const deudaRestanteSmart = Math.max(0, deudaAnteriorSmart + comprasSmartMes - cuotaSmart);

      // Tarjeta de crédito BCI: la deuda anterior más las compras del mes, menos lo pagado, pasa al siguiente mes
      const deudaRestanteBci = Math.max(0, (userProfile.tcBciConfig?.deudaPrevia || 0) + (spentByAcc['tcBciDiego'] || 0) - (userProfile.tcBciConfig?.pagoMes || 0));

      // Asignar los saldos sobrantes como Remanente Mes Pasado del NUEVO mes
      userProfile.remanentes = {
        mpDiego: saldoRemanenteMPDiego,
        mpSoledad: saldoRemanenteMPSoledad,
        bancoSole: saldoRemanenteBancoSole,
        tenpoDiego: saldoRemanenteTenpoDiego,
        machDiego: saldoRemanenteMachDiego,
        tenpoSoledad: saldoRemanenteTenpoSole,
        fanDiego: 0,
        chequeraSole: 0
      };

      userProfile.smartVisaConfig = {
        cupoTotal: userProfile.smartVisaConfig?.cupoTotal || PERFIL_INICIAL.smartVisaConfig.cupoTotal,
        deudaPrevia: deudaRestanteSmart,
        cuotaMes: userProfile.cofresSoledad?.smartVisa ?? 0
      };

      // El pago de la tarjeta BCI vale solo para el estado de cuenta que se cierra: el siguiente parte en $0
      userProfile.tcBciConfig = {
        cupoTotal: userProfile.tcBciConfig?.cupoTotal ?? PERFIL_INICIAL.tcBciConfig.cupoTotal,
        deudaPrevia: deudaRestanteBci,
        pagoMes: 0
      };

      // El ajuste y las excepciones valen solo para el mes que se cierra
      userProfile.machSemanal = { monto: getMachSemanal().monto };

      // Guardar el perfil con los remanentes actualizados
      saveUserProfile();

      // 4. Avanzar al nuevo mes
      currentActiveMonth = nextMonth;
      localStorage.setItem('app_active_month', currentActiveMonth);
      actualizarSelectPeriodo();

      // Los gastos sueltos pertenecen solo al mes que se cierra
      currentAuditItems = currentAuditItems.filter(it => !it.fromQuickBill);

      // 5. Reiniciar boletas variables a 0 para el nuevo mes (manteniendo fijos e hipotecario)
      currentAuditItems.forEach(it => {
        const n = it.name.toLowerCase();
        if (n.includes('luz') || n.includes('agua') || n.includes('gas') || n.includes('gasto común') || n.includes('gasto comun') || n.includes('supermercado')) {
          it.actual = 0;
        }
      });
      localStorage.setItem(`audit_${currentActiveMonth}`, JSON.stringify(currentAuditItems));
      localStorage.setItem(`audit_${getMonthCode(currentActiveMonth)}`, JSON.stringify(currentAuditItems));

      // 6. Reiniciar gastos diarios a lista vacía para el nuevo mes
      expenses = [];
      localStorage.setItem('family_expenses', JSON.stringify(expenses));
      localStorage.setItem('hogar_gastos', JSON.stringify(expenses));
      renderExpenses();

      // 7. CREAR O ACTIVAR EL NUEVO MES EN LA BASE DE DATOS (En Curso)
      asegurarMesActivoEnBD(nextMonth);

      const elTitle = document.getElementById('activeMonthTitle');
      if (elTitle) elTitle.textContent = currentActiveMonth;

      cerrarModalCerrarMes();
      syncProfileToInputs();
      renderAuditTable();
      renderChecklist();
      renderTablaHistorialMesesBD();
      renderDetailedHistoricalTable();
      if (typeof initOrUpdateMonthAnalysis === 'function') initOrUpdateMonthAnalysis();
      if (typeof renderCardAnalysis === 'function') renderCardAnalysis();
      if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
      verificarBotonDeshacerCierre();
      triggerAutoSyncToCloud();

      showToast(`🎉 ¡Mes "${oldMonth}" cerrado con éxito! Bienvenido a ${currentActiveMonth}. Remanentes transferidos automáticamente.`);
    }

    async function deshacerUltimoCierreMes() {
      const raw = localStorage.getItem('ultimo_mes_cerrado_backup');
      if (!raw) {
        alert('No hay un cierre reciente disponible para deshacer.');
        return;
      }
      const backup = parseSeguro(raw, null);
      if (!backup) { alert('El respaldo del último cierre está dañado y no se puede reabrir.'); return; }
      const reabrir = await confirmar(`↩️ ¿Deseas reabrir el mes "${backup.closedMonth}" y deshacer el cierre?\n\nSe restaurarán todas las boletas, gastos diarios y el periodo activo volverá a ser "${backup.closedMonth}".`, 'Reabrir mes');
      if (!reabrir) return;

      currentActiveMonth = backup.closedMonth;
      localStorage.setItem('app_active_month', currentActiveMonth);
      actualizarSelectPeriodo();

      currentAuditItems = backup.currentAuditItems;
      localStorage.setItem(`audit_${currentActiveMonth}`, JSON.stringify(currentAuditItems));
      localStorage.setItem(`audit_${getMonthCode(currentActiveMonth)}`, JSON.stringify(currentAuditItems));

      expenses = backup.expenses;
      localStorage.setItem('family_expenses', JSON.stringify(expenses));
      localStorage.setItem('hogar_gastos', JSON.stringify(expenses));

      if (backup.userProfile) {
        userProfile = Object.assign(userProfile || {}, backup.userProfile);
        localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));
      }

      // Actualizar historial en la BD
      const rawHistorial = localStorage.getItem('db_historial_meses');
      if (rawHistorial) {
        let list = JSON.parse(rawHistorial);
        list = list.filter(m => !matchMonth(m, backup.nextMonth));
        const idxClosed = list.findIndex(m => matchMonth(m, backup.closedMonth));
        if (idxClosed !== -1) {
          list[idxClosed].estado = 'En Curso';
          list[idxClosed].criterio = 'Mes Reabierto tras deshacer cierre';
        }
        localStorage.setItem('db_historial_meses', JSON.stringify(list));
      }

      localStorage.removeItem('ultimo_mes_cerrado_backup');

      const elTitle = document.getElementById('activeMonthTitle');
      if (elTitle) elTitle.textContent = currentActiveMonth;

      syncProfileToInputs();
      renderAuditTable();
      renderExpenses();
      renderChecklist();
      renderTablaHistorialMesesBD();
      renderDetailedHistoricalTable();
      if (typeof initOrUpdateMonthAnalysis === 'function') initOrUpdateMonthAnalysis();
      if (typeof renderCardAnalysis === 'function') renderCardAnalysis();
      if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
      verificarBotonDeshacerCierre();
      triggerAutoSyncToCloud();

      showToast(`↩️ ¡Mes "${backup.closedMonth}" reabierto exitosamente! Estado restaurado.`);
    }

    function verificarBotonDeshacerCierre() {
      const btn = document.getElementById('btnDeshacerCierre');
      if (!btn) return;
      const raw = localStorage.getItem('ultimo_mes_cerrado_backup');
      if (raw) {
        try {
          const b = JSON.parse(raw);
          btn.style.display = 'inline-flex';
          btn.innerHTML = `<span>↩️</span> Reabrir ${b.closedMonth || 'Mes Anterior'}`;
          btn.title = `Haz clic para reabrir y restaurar todas las boletas de ${b.closedMonth || 'Mes Anterior'}`;
        } catch(e) {
          btn.style.display = 'inline-flex';
        }
      } else {
        btn.style.display = 'none';
      }
    }
    
    function verDetalleMes(id) {
      const raw = localStorage.getItem('db_historial_meses');
      const list = parseSeguro(raw, []);
      const mes = aplicarCifrasVigentes(list.find(m => m.id === id || m.code === id || m.nombre === id || matchMonth(m, id)));
      if (!mes) return;

      const modal = document.getElementById('modalVerMes');
      const titulo = document.getElementById('modalVerMesTitulo');
      const content = document.getElementById('modalVerMesContent');

      if (titulo) titulo.textContent = `📜 Resumen Histórico: ${mes.nombre}`;
      if (content) {
        let itemsHtml = '';
        let displayList = [];
        if (mes.items && mes.items.length > 0) {
          displayList = mes.items.map(it => ({ name: it.name, resp: it.resp, amount: it.actual || it.base || 0 }));
        } else if (mes.rawItems && Object.keys(mes.rawItems).length > 0) {
          displayList = Object.entries(mes.rawItems).map(([k, v]) => ({ name: k, resp: k.includes('Diego') || k.includes('Huasco') || k.includes('Michis') || k.includes('Hipotecario') ? 'Diego' : 'Soledad', amount: v }));
        }

        if (displayList.length > 0) {
          itemsHtml = `
            <div style="font-weight:700; margin-top:0.75rem; font-size:0.9rem;">📋 Boletas Pagadas en este Mes:</div>
            <div style="max-height:200px; overflow-y:auto; border:1px solid var(--border-glass); border-radius:8px; padding:0.5rem; margin-top:0.35rem;">
              <table style="width:100%; font-size:0.8rem;">
                <thead>
                  <tr style="border-bottom:1px solid var(--border-glass);">
                    <th style="text-align:left; padding:0.3rem;">Cuenta</th>
                    <th style="text-align:center; padding:0.3rem;">Pagador</th>
                    <th style="text-align:right; padding:0.3rem;">Monto Pagado</th>
                  </tr>
                </thead>
                <tbody>
                  ${displayList.map(it => `
                    <tr>
                      <td style="padding:0.25rem 0.3rem;">${escapeHtml(it.name)}</td>
                      <td style="text-align:center; padding:0.25rem 0.3rem;"><span class="badge ${it.resp === 'Diego' ? 'badge-blue' : 'badge-purple'}" style="font-size:0.65rem;">${escapeHtml(it.resp)}</span></td>
                      <td style="text-align:right; font-weight:700; padding:0.25rem 0.3rem; color:${it.amount > 0 ? '#10B981' : 'var(--text-muted)'};">${formatCLP(it.amount)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }

        let gastosHtml = '';
        if (mes.gastosDiarios && mes.gastosDiarios.length > 0) {
          const totalGastosDiarios = mes.gastosDiarios.reduce((acc, g) => acc + (Number(g.amount) || 0), 0);
          gastosHtml = `
            <div style="margin-top:1rem;">
              <div style="font-weight:700; font-size:0.9rem; display:flex; justify-content:space-between; align-items:center;">
                <span>🧾 Gastos Diarios Registrados (${mes.gastosDiarios.length}):</span>
                <span style="color:#10B981; font-size:0.85rem;">Total: ${formatCLP(totalGastosDiarios)}</span>
              </div>
              <div style="max-height:180px; overflow-y:auto; border:1px solid var(--border-glass); border-radius:8px; padding:0.5rem; margin-top:0.35rem;">
                <table style="width:100%; font-size:0.75rem;">
                  <thead>
                    <tr style="border-bottom:1px solid var(--border-glass); color:var(--text-muted);">
                      <th style="text-align:left; padding:0.2rem;">Fecha</th>
                      <th style="text-align:left; padding:0.2rem;">Quién</th>
                      <th style="text-align:left; padding:0.2rem;">Detalle</th>
                      <th style="text-align:right; padding:0.2rem;">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${mes.gastosDiarios.map(g => `
                      <tr>
                        <td style="padding:0.2rem; color:var(--text-muted); font-size:0.7rem;">${escapeHtml(g.date || '')}</td>
                        <td style="padding:0.2rem;"><span class="badge ${g.payer === 'Diego' ? 'badge-blue' : 'badge-purple'}" style="font-size:0.65rem;">${escapeHtml(g.payer || '')}</span></td>
                        <td style="padding:0.2rem;">${escapeHtml(g.desc || g.category || '')}</td>
                        <td style="text-align:right; font-weight:700; padding:0.2rem; color:#10B981;">${formatCLP(g.amount || 0)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }

        content.innerHTML = `
          <div style="background:rgba(59,130,246,0.08); border:1px solid rgba(59,130,246,0.3); border-radius:8px; padding:0.6rem; font-size:0.78rem; color:#93C5FD; margin-bottom:0.75rem;">
            💡 <strong>Criterio Unificado de Pago:</strong> ${escapeHtml(mes.criterio || 'Registro según salida real de dinero de la cuenta bancaria')}
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; background:var(--bg-surface-elevated); padding:0.85rem; border-radius:8px;">
            <div><span style="color:var(--text-muted); font-size:0.75rem;">Sueldo Diego:</span> <strong style="color:var(--accent-diego); font-size:0.95rem; display:block;">${formatCLP(mes.diegoSal)}</strong></div>
            <div><span style="color:var(--text-muted); font-size:0.75rem;">Sueldo Soledad:</span> <strong style="color:var(--accent-soledad); font-size:0.95rem; display:block;">${formatCLP(mes.soleSal)}</strong></div>
            <div><span style="color:var(--text-muted); font-size:0.75rem;">Gastos Hogar:</span> <strong style="color:#F43F5E; font-size:0.95rem; display:block;">${formatCLP(mes.gastosHogar)}</strong></div>
            <div><span style="color:var(--text-muted); font-size:0.75rem;">Superávit Libre:</span> <strong style="color:#10B981; font-size:0.95rem; display:block;">${formatCLP(mes.superavit)}</strong></div>
          </div>
          ${itemsHtml}
          ${gastosHtml}
        `;
      }
      if (modal) modal.style.display = 'flex';
    }

    function exportarBDJson() {
      const raw = localStorage.getItem('db_historial_meses') || '[]';
      const blob = new Blob([raw], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `base_de_datos_finanzas_pareja_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Base de Datos descargada en formato JSON.');
    }
