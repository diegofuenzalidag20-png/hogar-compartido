// Pestaña Análisis (donas, Limache vs Huasco) y arranque de la app (DOMContentLoaded, service worker).
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ==============================================================
    // FUNCIÓN DE ANÁLISIS DEL MES ACTUAL (3 DONAS: GLOBAL, DIEGO, SOLEDAD)
    // ==============================================================
    // Gastos de Diego por lugar; los antiguos sin lugar se estiman por su categoría
    function totalesLugarDiego() {
      const t = { Limache: 0, Huasco: 0, nLimache: 0, nHuasco: 0, estimados: 0 };
      expenses.filter(g => g.payer === 'Diego').forEach(g => {
        const lugar = g.lugar || adivinarLugar(`${g.category || ''} ${g.desc || ''}`);
        if (!g.lugar) t.estimados++;
        t[lugar] += Number(g.amount) || 0;
        t['n' + lugar]++;
      });
      return t;
    }

    // Reparto Limache/Huasco de un mes: usa lo guardado al cerrar o lo calcula de sus gastos
    function lugarDeMes(mes) {
      if (mes.lugarDiego) return mes.lugarDiego;
      const t = { Limache: 0, Huasco: 0 };
      (mes.gastosDiarios || []).filter(g => g.payer === 'Diego').forEach(g => {
        t[g.lugar || adivinarLugar(`${g.category || ''} ${g.desc || ''}`)] += Number(g.amount) || 0;
      });
      return t;
    }

    function renderLugarHistorial() {
      const cont = document.getElementById('lugarHistorialLista');
      if (!cont) return;
      const meses = parseSeguro(localStorage.getItem('db_historial_meses'), [])
        .filter(m => m.estado === 'Cerrado' && (m.lugarDiego || (m.gastosDiarios || []).length))
        .map(m => ({ nombre: m.nombre, ...lugarDeMes(m) }));
      const actual = totalesLugarDiego();
      if (!meses.some(m => matchMonth(m, currentActiveMonth))) meses.unshift({ nombre: `${currentActiveMonth} (en curso)`, Limache: actual.Limache, Huasco: actual.Huasco });
      cont.innerHTML = meses.map(m => {
        const total = m.Limache + m.Huasco;
        const pctH = total > 0 ? Math.round(m.Huasco / total * 100) : 0;
        return `<div class="lugar-mes"><div class="lugar-mes-cabeza"><strong>${escapeHtml(m.nombre)}</strong><span>${formatCLP(total)}</span></div>
          <div class="lugar-barra"><span style="width:${total ? 100 - pctH : 50}%; background:#3B82F6;"></span><span style="width:${total ? pctH : 50}%; background:#14B8A6;"></span></div>
          <div class="lugar-mes-pie"><span>🏡 ${formatCLP(m.Limache)}</span><span>⛰️ ${formatCLP(m.Huasco)} · ${pctH}%</span></div></div>`;
      }).join('') || '<p class="hist-nota">Aún no hay meses con gastos guardados.</p>';
    }

    // Lista de gastos de Diego de un lugar; tocar de nuevo el mismo lugar la cierra
    let lugarAbierto = null;
    function mostrarDetalleLugar(lugar, mantener = false) {
      const caja = document.getElementById('lugarDetalle');
      if (!caja) return;
      if (!mantener && lugarAbierto === lugar) lugar = null;
      lugarAbierto = lugar;
      document.querySelectorAll('.lugar-total').forEach(b => b.classList.toggle('activa', b.dataset.lugar === lugar));
      if (!lugar) { caja.innerHTML = ''; return; }
      const gastos = expenses
        .filter(g => g.payer === 'Diego' && (g.lugar || adivinarLugar(`${g.category || ''} ${g.desc || ''}`)) === lugar)
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const total = gastos.reduce((s, g) => s + (Number(g.amount) || 0), 0);
      caja.innerHTML = `
        <div class="categoria-detalle-cabeza">
          <div><strong>${lugar === 'Huasco' ? '⛰️ Huasco (departamento)' : '🏡 Limache (casa)'}</strong><small>Gastos que pagó Diego este mes</small></div>
          <button type="button" class="sheet-close" aria-label="Cerrar detalle" onclick="mostrarDetalleLugar('${lugar}')">✕</button>
        </div>
        <div class="categoria-detalle-total">${gastos.length} ${gastos.length === 1 ? 'gasto' : 'gastos'} · <strong>${formatCLP(total)}</strong></div>
        ${gastos.map(g => `
          <div class="categoria-detalle-fila">
            <span><strong>${escapeHtml(g.desc || g.category)}</strong><small>${escapeHtml(g.date || '')} · ${escapeHtml(g.category || '')}${g.lugar ? '' : ' · lugar estimado'}</small></span>
            <strong>${formatCLP(g.amount)}</strong>
          </div>`).join('')}`;
      if (!mantener) caja.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function renderLugarDiego() {
      if (lugarAbierto) setTimeout(() => mostrarDetalleLugar(lugarAbierto, true));
      const t = totalesLugarDiego();
      const total = t.Limache + t.Huasco;
      const pctH = total > 0 ? Math.round(t.Huasco / total * 100) : 0;
      const poner = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
      poner('lugarTotLimache', formatCLP(t.Limache));
      poner('lugarTotHuasco', formatCLP(t.Huasco));
      poner('lugarCntLimache', `${t.nLimache} ${t.nLimache === 1 ? 'gasto' : 'gastos'} · ${total > 0 ? 100 - pctH : 0}%`);
      poner('lugarCntHuasco', `${t.nHuasco} ${t.nHuasco === 1 ? 'gasto' : 'gastos'} · ${pctH}%`);
      poner('lugarPctHuasco', total > 0 ? '' : 'Sin gastos');
      poner('lugarSinAsignar', t.estimados ? `${t.estimados} ${t.estimados === 1 ? 'gasto sin lugar se estimó' : 'gastos sin lugar se estimaron'} por su categoría.` : '');
      const bl = document.getElementById('lugarBarLimache'), bh = document.getElementById('lugarBarHuasco');
      if (bl) bl.style.width = (total > 0 ? 100 - pctH : 50) + '%';
      if (bh) bh.style.width = (total > 0 ? pctH : 50) + '%';
    }

    function renderAnalisisMesActual() {
      renderLugarDiego();
      // 1. Datos base de ingresos
      const diegoSal = userProfile.diegoSalary || PERFIL_INICIAL.diegoSalary;
      const soleSal = userProfile.soledadSalary || PERFIL_INICIAL.soledadSalary;
      const totalIng = diegoSal + soleSal;

      // 2. Gastos del mes actual calculados DIRECTAMENTE desde la tabla (expenses)
      let totalGastos = 0;
      let diegoDesembolso = 0;
      let soleDesembolso = 0;
      let fijosTotal = 0;
      let variablesTotal = 0;

      const catTotalsGlobal = Object.fromEntries(CATEGORIAS_GASTO.map(c => [c.nombre, 0]));

      const catTotalsDiego = Object.fromEntries(CATEGORIAS_GASTO.map(c => [c.nombre, 0]));

      const catTotalsSoledad = Object.fromEntries(CATEGORIAS_GASTO.map(c => [c.nombre, 0]));

      expenses.forEach(item => {
        const val = Number(item.amount) || 0;
        totalGastos += val;

        const assignedCat = normalizeExpenseCategory(item.category, item.desc);
        catTotalsGlobal[assignedCat] = (catTotalsGlobal[assignedCat] || 0) + val;

        if (item.payer === 'Diego') {
          diegoDesembolso += val;
          catTotalsDiego[assignedCat] = (catTotalsDiego[assignedCat] || 0) + val;
        } else if (item.payer === 'Soledad') {
          soleDesembolso += val;
          catTotalsSoledad[assignedCat] = (catTotalsSoledad[assignedCat] || 0) + val;
        } else {
          // Ambos (50/50)
          diegoDesembolso += val / 2;
          soleDesembolso += val / 2;
          catTotalsDiego[assignedCat] = (catTotalsDiego[assignedCat] || 0) + (val / 2);
          catTotalsSoledad[assignedCat] = (catTotalsSoledad[assignedCat] || 0) + (val / 2);
        }

        if (isExpenseFijo(item.category, item.desc)) {
          fijosTotal += val;
        } else {
          variablesTotal += val;
        }
      });

      // 3. Metas presupuestadas desde currentAuditItems para comparación
      const categoryMetaMap = Object.fromEntries(CATEGORIAS_GASTO.map(c => [c.nombre, 0]));

      let totalMeta = 0;
      if (Array.isArray(currentAuditItems)) {
        currentAuditItems.forEach(it => {
          const base = Number(it.base) || 0;
          totalMeta += base;
          const assignedCat = normalizeExpenseCategory(it.cat, it.name);
          categoryMetaMap[assignedCat] = (categoryMetaMap[assignedCat] || 0) + base;
        });
      }

      const netDiff = totalGastos - totalMeta;
      const superavit = totalIng - totalGastos;
      const tasaAhorro = totalIng > 0 ? ((superavit / totalIng) * 100).toFixed(1) : '0';

      // 4. Actualizar Títulos y Scorecards KPIs del Mes
      const tituloEl = document.getElementById('analisisMesTitulo');
      if (tituloEl) tituloEl.textContent = `Análisis de ${currentActiveMonth || 'Octubre 2026'}`;

      const subTituloEl = document.getElementById('analisisMesSubtitulo');
      if (subTituloEl) {
        subTituloEl.innerHTML = `Métricas y gráficos vinculados en vivo a los <strong style="color:#10B981;">${expenses.length} gastos</strong> registrados en la tabla del mes`;
      }

      const kpiIng = document.getElementById('kpiMesIngresos');
      const kpiIngSub = document.getElementById('kpiMesIngresosSub');
      if (kpiIng) kpiIng.textContent = formatCLP(totalIng);
      if (kpiIngSub) kpiIngSub.textContent = `Diego: ${formatCLP(diegoSal)} | Soledad: ${formatCLP(soleSal)}`;

      const kpiGas = document.getElementById('kpiMesGastos');
      const kpiGasSub = document.getElementById('kpiMesGastosSub');
      if (kpiGas) kpiGas.textContent = formatCLP(totalGastos);
      if (kpiGasSub) kpiGasSub.textContent = `${expenses.length} gastos en tabla | Fijos: ${formatCLP(fijosTotal)} | Variables: ${formatCLP(variablesTotal)}`;

      const kpiDesv = document.getElementById('kpiMesDesvio');
      const kpiDesvSub = document.getElementById('kpiMesDesvioSub');
      const kpiDesvIcon = document.getElementById('kpiMesDesvioIcon');
      if (kpiDesv) {
        kpiDesv.textContent = (netDiff >= 0 ? '+' : '') + formatCLP(netDiff);
        kpiDesv.style.color = netDiff <= 0 ? '#10B981' : (netDiff < 15000 ? '#F59E0B' : '#F43F5E');
      }
      if (kpiDesvSub) {
        kpiDesvSub.textContent = totalGastos <= totalMeta 
          ? `🟢 Controlado (${formatCLP(totalMeta - totalGastos)} bajo presupuesto meta)` 
          : `⚠️ Desvío de +${formatCLP(netDiff)} sobre meta mensual`;
      }
      if (kpiDesvIcon) {
        kpiDesvIcon.textContent = totalGastos <= totalMeta ? '💎' : '⚠️';
      }

      const kpiSup = document.getElementById('kpiMesSuperavit');
      const kpiSupSub = document.getElementById('kpiMesSuperavitSub');
      if (kpiSup) {
        kpiSup.textContent = (superavit >= 0 ? '+' : '-') + formatCLP(Math.abs(superavit));
        kpiSup.style.color = superavit >= 0 ? '#10B981' : '#F43F5E';
      }
      if (kpiSupSub) {
        kpiSupSub.textContent = `${tasaAhorro}% de ingresos disponibles tras gastos registrados`;
      }

      // Actualizar Badges en las 3 tarjetas de Dona
      const badgeG = document.getElementById('badgeTotalGlobalMes');
      const badgeD = document.getElementById('badgeTotalDiegoMes');
      const badgeS = document.getElementById('badgeTotalSoledadMes');
      if (badgeG) badgeG.textContent = formatCLP(totalGastos);
      if (badgeD) badgeD.textContent = formatCLP(diegoDesembolso);
      if (badgeS) badgeS.textContent = formatCLP(soleDesembolso);

      // 5. Renderizar DONA 1: GLOBAL HOGAR
      chartMesCategoriasGlobal = buildCategoryDoughnut(
        'chartMesCategoriasGlobal',
        catTotalsGlobal,
        chartMesCategoriasGlobal,
        totalGastos,
        ['#3B82F6', '#A855F7', '#10B981', '#F59E0B', '#06B6D4', '#EC4899', '#8B5CF6']
      );

      // 6. Renderizar DONA 2: DIEGO
      chartMesCategoriasDiego = buildCategoryDoughnut(
        'chartMesCategoriasDiego',
        catTotalsDiego,
        chartMesCategoriasDiego,
        diegoDesembolso,
        ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6']
      );

      // 7. Renderizar DONA 3: SOLEDAD
      chartMesCategoriasSoledad = buildCategoryDoughnut(
        'chartMesCategoriasSoledad',
        catTotalsSoledad,
        chartMesCategoriasSoledad,
        soleDesembolso,
        ['#A855F7', '#EC4899', '#C084FC', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6']
      );

      // 8. Gráfico 4: Presupuesto Meta vs Gasto Real de la Tabla
      const ctxPvR = document.getElementById('chartMesPresupuestoVsReal')?.getContext('2d');
      if (ctxPvR) {
        if (chartMesPresupuestoVsReal) chartMesPresupuestoVsReal.destroy();
        const catLabels = Object.keys(catTotalsGlobal);
        const metaValues = catLabels.map(k => categoryMetaMap[k] || 0);
        const realValues = catLabels.map(k => catTotalsGlobal[k] || 0);

        chartMesPresupuestoVsReal = new Chart(ctxPvR, {
          type: 'bar',
          data: {
            labels: catLabels,
            datasets: [
              {
                label: 'Meta Presupuestada',
                data: metaValues,
                backgroundColor: 'rgba(59, 130, 246, 0.65)',
                borderColor: '#3B82F6',
                borderWidth: 1,
                borderRadius: 4
              },
              {
                label: 'Gasto Real en Tabla',
                data: realValues,
                backgroundColor: 'rgba(168, 85, 247, 0.85)',
                borderColor: '#C084FC',
                borderWidth: 1,
                borderRadius: 4
              }
            ]
          },
          options: {
            indexAxis: mobileLayout.matches ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: chartTextColor(), font: { size: 11, weight: '600' } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${formatCLP(ctx.raw)}`
                }
              }
            },
            scales: {
              [mobileLayout.matches ? 'y' : 'x']: { ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { display: false } },
              [mobileLayout.matches ? 'x' : 'y']: {
                ticks: { color: '#94A3B8', callback: (v) => '$' + (v / 1000) + 'k' },
                grid: { color: 'rgba(255, 255, 255, 0.06)' }
              }
            }
          }
        });
        const metaRealLista = document.getElementById('metaRealLista');
        if (metaRealLista) {
          metaRealLista.innerHTML = catLabels.map((k, i) => ({ k, meta: metaValues[i], real: realValues[i] }))
            .filter(f => f.meta > 0 || f.real > 0)
            .map(f => `<div class="meta-real-fila"><span>${f.real > f.meta ? '⚠️ ' : ''}${escapeHtml(f.k)}</span><strong>${formatCLP(f.real)} <small>de ${formatCLP(f.meta)}</small></strong></div>`)
            .join('');
        }
      }

      // 9. Gráfico 5: Aporte & Carga Real Diego vs Soledad (de la Tabla de Gastos)
      const ctxDesemb = document.getElementById('chartMesDesembolsoPareja')?.getContext('2d');
      if (ctxDesemb) {
        if (chartMesDesembolsoPareja) chartMesDesembolsoPareja.destroy();
        const diegoLibre = getCuentaPrincipalDisponible('Diego');
        const soleLibre = getCuentaPrincipalDisponible('Soledad');

        chartMesDesembolsoPareja = new Chart(ctxDesemb, {
          type: 'bar',
          data: {
            labels: ['🔵 Diego', '🟣 Soledad'],
            datasets: [
              {
                label: 'Aporte en Gastos de la Tabla',
                data: [diegoDesembolso, soleDesembolso],
                backgroundColor: ['rgba(59, 130, 246, 0.85)', 'rgba(168, 85, 247, 0.85)'],
                borderRadius: 6
              },
              {
                label: 'Disponible en Cuenta Principal',
                data: [diegoLibre, soleLibre],
                backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(52, 211, 153, 0.7)'],
                borderRadius: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: chartTextColor(), font: { size: 11 } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.dataset.label}: ${formatCLP(ctx.raw)}`
                }
              }
            },
            scales: {
              x: { stacked: true, ticks: { color: chartTextColor(), font: { size: 12, weight: '700' } }, grid: { display: false } },
              y: { 
                stacked: true, 
                ticks: { color: '#94A3B8', callback: (v) => '$' + (v / 1000) + 'k' },
                grid: { color: 'rgba(255, 255, 255, 0.06)' }
              }
            }
          }
        });
      }

      // 10. Gráfico 6: Fijos vs Variables (Directo de la Tabla de Gastos)
      const ctxFijosVar = document.getElementById('chartMesFijosVsVariables')?.getContext('2d');
      if (ctxFijosVar) {
        if (chartMesFijosVsVariables) chartMesFijosVsVariables.destroy();
        const fijosPct = totalGastos > 0 ? ((fijosTotal / totalGastos) * 100).toFixed(0) : 0;
        const varPct = totalGastos > 0 ? (100 - fijosPct) : 0;

        const dataFijos = totalGastos > 0 ? [fijosTotal, variablesTotal] : [1];
        const labelsFijos = totalGastos > 0 
          ? [`Fijos Obligatorios (${fijosPct}%)`, `Consumo Variable (${varPct}%)`]
          : ['Sin gastos registrados aún'];
        const bgFijos = totalGastos > 0 ? ['#3B82F6', '#F59E0B'] : ['rgba(255, 255, 255, 0.1)'];

        chartMesFijosVsVariables = new Chart(ctxFijosVar, {
          type: 'doughnut',
          data: {
            labels: labelsFijos,
            datasets: [{
              data: dataFijos,
              backgroundColor: bgFijos,
              borderWidth: 2,
              borderColor: chartBorderColor()
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom', labels: { color: chartTextColor(), font: { size: 11, weight: '600' } } },
              tooltip: {
                callbacks: {
                  label: (ctx) => totalGastos > 0 ? ` ${ctx.label}: ${formatCLP(ctx.raw)}` : ' Sin gastos en tabla'
                }
              }
            },
            cutout: '65%'
          }
        });
      }

      // 11. Diagnóstico Inteligente & Alertas Semáforo (Basado en la Tabla de Gastos)
      const alertContainer = document.getElementById('analisisMesAlertasContainer');
      if (alertContainer) {
        alertContainer.innerHTML = '';
        
        if (expenses.length === 0) {
          alertContainer.innerHTML = `
            <div style="background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); border-radius:8px; padding:0.75rem; font-size:0.82rem; color:#93C5FD;">
              ℹ️ <strong>Esperando registros en la tabla:</strong> Aún no has ingresado gastos este mes. Usa la <em>Caja de Ingreso Rápido</em> para que los gráficos cobren vida.
            </div>
          `;
        } else {
          const pctSpent = totalMeta > 0 ? ((totalGastos / totalMeta) * 100).toFixed(1) : 0;
          const rowSummary = document.createElement('div');
          rowSummary.style.cssText = 'background:rgba(59,130,246,0.1); border:1px solid rgba(59,130,246,0.3); border-radius:8px; padding:0.55rem 0.75rem; font-size:0.82rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; min-width:0; max-width:100%; box-sizing:border-box;';
          rowSummary.innerHTML = `
            <span style="flex:1 1 200px; min-width:0;">📊 <strong>Ejecución mensual:</strong> Se han registrado ${formatCLP(totalGastos)} en la tabla (${pctSpent}% de la meta de ${formatCLP(totalMeta)})</span>
            <span style="font-weight:700; color:#60A5FA; margin-left:auto; white-space:nowrap;">${expenses.length} gastos</span>
          `;
          alertContainer.appendChild(rowSummary);

          Object.keys(catTotalsGlobal).forEach(cat => {
            const spent = catTotalsGlobal[cat];
            const meta = categoryMetaMap[cat] || 0;
            if (meta > 0 && spent > meta) {
              const diff = spent - meta;
              const rowAlert = document.createElement('div');
              rowAlert.style.cssText = 'background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:8px; padding:0.55rem 0.75rem; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; min-width:0; max-width:100%; box-sizing:border-box;';
              rowAlert.innerHTML = `
                <span style="flex:1 1 180px; min-width:0;">🔴 <strong>${escapeHtml(cat)}</strong>: sobrepasó la meta en +${formatCLP(diff)}</span>
                <span style="font-weight:700; color:#F43F5E; margin-left:auto; white-space:nowrap;">${formatCLP(spent)}</span>
              `;
              alertContainer.appendChild(rowAlert);
            }
          });

          const rowBalance = document.createElement('div');
          rowBalance.style.cssText = 'background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); border-radius:8px; padding:0.55rem 0.75rem; font-size:0.8rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; min-width:0; max-width:100%; box-sizing:border-box;';
          const diegoPct = totalGastos > 0 ? ((diegoDesembolso / totalGastos) * 100).toFixed(0) : 50;
          const solePct = totalGastos > 0 ? (100 - diegoPct) : 50;
          rowBalance.innerHTML = `
            <span style="flex:1 1 200px; min-width:0;">⚖️ <strong>Aporte en tabla:</strong> Diego pagó el ${diegoPct}% (${formatCLP(diegoDesembolso)}) y Soledad el ${solePct}% (${formatCLP(soleDesembolso)})</span>
            <span style="font-weight:700; color:#10B981; margin-left:auto; white-space:nowrap;">Equilibrio Hogar</span>
          `;
          alertContainer.appendChild(rowBalance);
        }
      }

      // 12. Top 5 Mayores Desembolsos del Mes (Directo de la Tabla de Gastos)
      const topContainer = document.getElementById('analisisMesTopGastosContainer');
      if (topContainer) {
        topContainer.innerHTML = '';
        const sortedExpenses = [...expenses]
          .filter(it => (Number(it.amount) || 0) > 0)
          .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
          .slice(0, 5);

        if (sortedExpenses.length === 0) {
          topContainer.innerHTML = `
            <div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">
              No hay gastos registrados en la tabla aún este mes.
            </div>
          `;
        } else {
          const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
          sortedExpenses.forEach((it, idx) => {
            const row = document.createElement('div');
            row.style.cssText = 'background:var(--bg-surface-elevated); border:1px solid var(--border-glass); border-radius:8px; padding:0.5rem 0.65rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.4rem; min-width:0; max-width:100%; box-sizing:border-box;';
            
            let payerBadge = '';
            if (it.payer === 'Diego') {
              payerBadge = `<span class="pill-partner pill-diego" style="display:inline-flex; align-items:center; gap:0.25rem; padding:0.15rem 0.5rem; border-radius:999px; font-weight:700; font-size:0.72rem;">🔵 Diego</span>`;
            } else if (it.payer === 'Soledad') {
              payerBadge = `<span class="pill-partner pill-soledad" style="display:inline-flex; align-items:center; gap:0.25rem; padding:0.15rem 0.5rem; border-radius:999px; font-weight:700; font-size:0.72rem;">🟣 Soledad</span>`;
            } else {
              payerBadge = `<span class="pill-partner" style="display:inline-flex; align-items:center; gap:0.25rem; padding:0.15rem 0.5rem; border-radius:999px; font-weight:700; font-size:0.72rem;">🤝 Ambos</span>`;
            }

            row.innerHTML = `
              <div style="display:flex; align-items:center; gap:0.5rem; flex:1 1 150px; min-width:0; overflow:hidden;">
                <span style="font-size:1.05rem; flex-shrink:0;">${medals[idx] || '•'}</span>
                <div style="min-width:0; flex:1; overflow:hidden;">
                  <div style="font-weight:700; font-size:0.85rem; color:var(--text-main); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${escapeHtml(it.desc || it.category)}</div>
                  <div style="font-size:0.72rem; color:var(--text-muted); display:flex; align-items:center; gap:0.4rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <span>${it.date || ''}</span>
                    <span>•</span>
                    <span>${escapeHtml(it.category || '')}</span>
                  </div>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:0.5rem; margin-left:auto; flex-shrink:0;">
                ${payerBadge}
                <strong style="color:#10B981; font-family:monospace; font-size:0.95rem;">${formatCLP(it.amount)}</strong>
              </div>
            `;
            topContainer.appendChild(row);
          });
        }
      }

      // Actualizar análisis de tarjetas (siempre sincronizado)
      if (typeof renderCardAnalysis === 'function') {
        renderCardAnalysis();
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      initTheme();
      placeQuickCard();
      mobileLayout.addEventListener('change', placeQuickCard);
      loadCustomItems();
      loadUserProfile();
      actualizarSelectPeriodo();
      loadCurrentMonthAudit();
      initAllGlassSelects();
      
      updateHipotecarioCoAporte();
      checkIncomingSync();
      const qDate = document.getElementById('quickDate');
      if (qDate) qDate.value = getLocalDateISO();
      initCharts();
      syncProfileToInputs();
      renderExpenses();
      inicializarBDMeses(); 
      updateHeaderSalaries();
      renderAuditTable();
      renderDashboardCharts();
      renderDetailedHistoricalTable();
      verificarBotonDeshacerCierre();

      // Iniciar sincronización de nube Firestore (descarga datos remotos en background sin trabas)
      initFirebaseSync();

      // Enlazar botones de sincronización explícitamente
      document.querySelectorAll('.btn-sync-action').forEach(b => {
        b.addEventListener('click', (e) => {
          e.preventDefault();
          openSyncModal();
        });
      });

      // Register PWA Service Worker con actualización forzada v26
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js?v=62').then((reg) => {
          reg.update().catch(() => {});
        }).catch(() => {});
      }
    });
