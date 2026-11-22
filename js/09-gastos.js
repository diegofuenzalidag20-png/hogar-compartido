// Lista de gastos, edición y borrado, avisos (showToast) y CSV.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    mobileLayout.addEventListener('change', () => { if (!mobileLayout.matches) programarRender('gastos'); });
    function renderExpenses() {
// 1. Totales generales consolidados para Badges y Mini-Cards
      let totalCount = expenses.length;
      let totalSum = 0;
      let diegoSum = 0;
      let soleSum = 0;

      expenses.forEach(item => {
        const amt = Number(item.amount) || 0;
        totalSum += amt;
        if (item.payer === 'Diego') {
          diegoSum += amt;
        } else if (item.payer === 'Soledad') {
          soleSum += amt;
        } else {
          diegoSum += amt / 2;
          soleSum += amt / 2;
        }
      });

      // Actualizar Badges y Mini-Tarjetas de la nueva tabla
      const countBadge = document.getElementById('quickExpensesCountBadge');
      if (countBadge) countBadge.textContent = `${totalCount} ${totalCount === 1 ? 'gasto' : 'gastos'}`;

      const totalBadge = document.getElementById('quickExpensesTotalBadge');
      if (totalBadge) totalBadge.textContent = `Total: ${formatCLP(totalSum)}`;

      const diegoTotalEl = document.getElementById('quickExpensesDiegoTotal');
      if (diegoTotalEl) diegoTotalEl.textContent = formatCLP(diegoSum);

      const soleTotalEl = document.getElementById('quickExpensesSoledadTotal');
      if (soleTotalEl) soleTotalEl.textContent = formatCLP(soleSum);

      const grandTotalEl = document.getElementById('quickExpensesGrandTotal');
      if (grandTotalEl) grandTotalEl.textContent = formatCLP(totalSum);

      // 2. Filtrado interactivo y ordenamiento por fecha (predeterminado: más recientes arriba)
      const sortIcon = document.getElementById('sortDateIcon');
      if (sortIcon) sortIcon.textContent = currentExpenseSortOrder === 'desc' ? '▼' : '▲';

      const sortBtnLabel = document.getElementById('labelDateSort');
      if (sortBtnLabel) {
        sortBtnLabel.textContent = currentExpenseSortOrder === 'desc'
          ? '📅 Más recientes arriba (31→1)'
          : '📅 Día 1° arriba (1→31)';
      }

      const filtered = expenses.map((item, originalIndex) => ({ ...item, _origIndex: originalIndex }))
        .filter(item => {
          if (currentExpenseFilter === 'Diego' && item.payer !== 'Diego' && item.payer !== 'Ambos') return false;
          if (currentExpenseFilter === 'Soledad' && item.payer !== 'Soledad' && item.payer !== 'Ambos') return false;
          if (currentExpenseSearch) {
            const searchable = `${item.date || ''} ${item.payer || ''} ${item.lugar || ''} ${item.category || ''} ${item.desc || ''} ${item.account || ''} ${item.amount || ''}`.toLowerCase();
            if (!searchable.includes(currentExpenseSearch)) return false;
          }
          return true;
        })
        .sort((a, b) => {
          const dateA = a.date || '';
          const dateB = b.date || '';
          if (dateA !== dateB) {
            return currentExpenseSortOrder === 'desc'
              ? dateB.localeCompare(dateA) // Descendente: día más reciente primero (arriba)
              : dateA.localeCompare(dateB); // Ascendente: día 1° primero (arriba)
          }
          return currentExpenseSortOrder === 'desc'
            ? b._origIndex - a._origIndex
            : a._origIndex - b._origIndex;
        });

      // 3. Tabla de escritorio y tarjetas del teléfono. En el teléfono la tabla está oculta: se arma al pasar a escritorio
      const quickTbody = mobileLayout.matches ? null : document.getElementById('quickExpensesTableBody');
      const mobileCards = document.getElementById('quickExpensesMobileCards');

      if (mobileCards) mobileCards.innerHTML = '';
      if (quickTbody) quickTbody.innerHTML = '';

      if (filtered.length === 0) {
        if (quickTbody) {
          quickTbody.innerHTML = `
            <tr>
              <td colspan="7" style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.88rem;">
                <div style="font-size:1.6rem; margin-bottom:0.4rem;">🍃</div>
                <div>No hay gastos registrados ${currentExpenseSearch || currentExpenseFilter !== 'all' ? 'que coincidan con el filtro' : 'este mes'}.</div>
                <div style="font-size:0.75rem; color:var(--text-dim); margin-top:0.25rem;">Usa la <strong>Caja de Ingreso Rápido</strong> arriba para registrar uno en 5 segundos.</div>
              </td>
            </tr>
          `;
        }
        if (mobileCards) {
          mobileCards.innerHTML = `
            <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.88rem; background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid var(--border-color);">
              <div style="font-size:1.6rem; margin-bottom:0.4rem;">🍃</div>
              <div>No hay gastos registrados ${currentExpenseSearch || currentExpenseFilter !== 'all' ? 'con este filtro' : 'este mes'}.</div>
            </div>
          `;
        }
      } else {
        filtered.forEach((item, posicion) => {
          // Payer badge
          let payerHtml = '';
          let payerMobileHtml = '';
          if (item.payer === 'Diego') {
            payerHtml = `<span class="pill-partner pill-diego" style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700; font-size:0.75rem; background:rgba(59, 130, 246, 0.2); color:var(--monto-diego); border:1px solid rgba(59, 130, 246, 0.4);">🔵 Diego</span>`;
            payerMobileHtml = `<span style="font-weight:700; font-size:0.75rem; color:var(--monto-diego); background:rgba(59,130,246,0.18); padding:0.2rem 0.5rem; border-radius:6px; border:1px solid rgba(59,130,246,0.35);">🔵 Diego</span>`;
          } else if (item.payer === 'Soledad') {
            payerHtml = `<span class="pill-partner pill-soledad" style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700; font-size:0.75rem; background:rgba(168, 85, 247, 0.2); color:var(--monto-sole); border:1px solid rgba(168, 85, 247, 0.4);">🟣 Soledad</span>`;
            payerMobileHtml = `<span style="font-weight:700; font-size:0.75rem; color:var(--monto-sole); background:rgba(168,85,247,0.18); padding:0.2rem 0.5rem; border-radius:6px; border:1px solid rgba(168,85,247,0.35);">🟣 Soledad</span>`;
          } else {
            payerHtml = `<span class="pill-partner" style="display:inline-flex; align-items:center; gap:0.3rem; padding:0.25rem 0.65rem; border-radius:999px; font-weight:700; font-size:0.75rem; background:rgba(16, 185, 129, 0.2); color:#34D399; border:1px solid rgba(16, 185, 129, 0.4);">🤝 Ambos</span>`;
            payerMobileHtml = `<span style="font-weight:700; font-size:0.75rem; color:#34D399; background:rgba(16,185,129,0.18); padding:0.2rem 0.5rem; border-radius:6px; border:1px solid rgba(16,185,129,0.35);">🤝 Ambos</span>`;
          }
          if (item.payer === 'Diego' && item.lugar) {
            const tagLugar = ` <span class="tag-lugar">${item.lugar === 'Huasco' ? '⛰️' : '🏡'} ${escapeHtml(item.lugar)}</span>`;
            payerHtml += tagLugar;
            payerMobileHtml += tagLugar;
          }

          const nombre = escapeHtml(item.desc || item.category || '');
          const botones = `<button type="button" class="btn-gasto btn-gasto-editar" onclick="openEditExpenseModal(${item._origIndex})" aria-label="Editar gasto: ${nombre}" title="Editar">✏️</button><button type="button" class="btn-gasto btn-gasto-borrar" onclick="deleteExpense(${item._origIndex})" aria-label="Eliminar gasto: ${nombre}" title="Eliminar">🗑️</button>`;

          // 1. Desktop TR
          if (quickTbody) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td style="font-size:0.85rem; font-family:monospace; color:var(--text-muted);">${escapeHtml(item.date || '-')}</td>
              <td>${payerHtml}</td>
              <td><span style="font-size:0.82rem; font-weight:600; color:var(--text-main);">${escapeHtml(item.category || 'Otros')}</span></td>
              <td><strong style="font-size:0.88rem; color:var(--text-main);">${escapeHtml(item.desc || '-')}</strong></td>
              <td><span style="font-size:0.78rem; color:var(--text-muted); background:rgba(255,255,255,0.05); padding:0.2rem 0.5rem; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">${escapeHtml(item.account || 'Efectivo/Otro')}</span></td>
              <td style="font-weight:800; font-size:0.95rem; text-align:right; color:var(--text-main); font-variant-numeric:tabular-nums;">${formatCLP(item.amount)}</td>
              <td style="text-align:center; white-space:nowrap;"><div class="gasto-acciones">${botones}</div></td>
            `;
            quickTbody.appendChild(tr);
          }

          // 2. Mobile Card (100% Legible en Celulares)
          const esNuevo = item.id && item.id === gastoRecienRegistrado;
          if (mobileCards && (currentExpenseSearch || posicion < expenseVisibleLimit || esNuevo)) {
            const card = document.createElement('div');
            card.className = 'mobile-exp-card' + (esNuevo ? ' gasto-nuevo' : '');
            card.innerHTML = `
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; align-items:center; gap:0.45rem;">
                  ${payerMobileHtml}
                  <span style="font-size:0.75rem; color:var(--text-muted); font-family:monospace;">${escapeHtml(item.date || '')}</span>
                </div>
                <div style="font-size:1.05rem; font-weight:800; color:var(--text-main); font-variant-numeric:tabular-nums;">
                  ${formatCLP(item.amount)}
                </div>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-top:0.25rem;">
                <div style="flex:1; padding-right:0.5rem;">
                  <div style="font-size:0.92rem; font-weight:700; color:var(--text-main); margin-bottom:0.3rem;">
                    ${escapeHtml(item.desc || '-')}
                  </div>
                  <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
                    <span style="font-size:0.72rem; color:var(--accent-diego); background:rgba(59,130,246,0.12); padding:0.15rem 0.45rem; border-radius:6px; border:1px solid rgba(59,130,246,0.25); font-weight:600;">
                      ${escapeHtml(item.category || 'Otros')}
                    </span>
                    <span style="font-size:0.72rem; color:var(--text-muted); background:rgba(255,255,255,0.06); padding:0.15rem 0.45rem; border-radius:6px; border:1px solid rgba(255,255,255,0.08);">
                      ${escapeHtml(item.account || 'Efectivo')}
                    </span>
                  </div>
                </div>
                <div class="gasto-acciones">${botones}</div>
              </div>
            `;
            mobileCards.appendChild(card);
          }
        });

        if (mobileCards && !currentExpenseSearch && (filtered.length > EXPENSE_PAGE || expenseVisibleLimit > EXPENSE_PAGE)) {
          const quedan = Math.max(0, filtered.length - expenseVisibleLimit);
          const pie = document.createElement('div');
          pie.className = 'gastos-pie';
          pie.innerHTML = `<span>Mostrando ${Math.min(expenseVisibleLimit, filtered.length)} de ${filtered.length}</span>
            ${quedan > 0 ? `<button type="button" class="btn-secondary" onclick="verMasGastos(${EXPENSE_PAGE})">Ver ${Math.min(EXPENSE_PAGE, quedan)} más</button>` : ''}
            ${quedan > EXPENSE_PAGE ? `<button type="button" class="btn-secondary" onclick="verMasGastos(Infinity)">Ver todos (${filtered.length})</button>` : ''}
            ${expenseVisibleLimit > EXPENSE_PAGE ? `<button type="button" class="btn-secondary" onclick="verMasGastos(0)">Ver menos</button>` : ''}`;
          mobileCards.appendChild(pie);
        }
      }

      // El análisis, los saldos de cuentas (Smart Visa) y la proyección dependen de los gastos
      programarRender('analisis', 'perfil', 'proyeccion');
    }

    
    // ==============================================================
    // MODIFICAR Y EDITAR GASTO REGISTRADO
    // ==============================================================
    let editingExpenseId = null;

    function openEditExpenseModal(index) {
      editingExpenseId = expenses[index]?.id ?? null;
      if (index < 0 || index >= expenses.length) return;
      const exp = expenses[index];
      document.getElementById('editExpIndex').value = index;
      document.getElementById('editExpDate').value = exp.date || getLocalDateISO();
      document.getElementById('editExpPayer').value = exp.payer || 'Diego';
      document.getElementById('editExpDesc').value = exp.desc || '';
      document.getElementById('editExpAmount').value = exp.amount || 0;

      // Las mismas opciones que el registro; un valor antiguo que ya no exista se conserva
      // Mismos grupos y mismo orden que al registrar; una categoría antigua que ya no existe va arriba, aparte
      const copiarOpciones = (desde, hasta, actual, limpiar) => {
        const origen = typeof desde === 'string' ? document.getElementById(desde) : desde, destino = document.getElementById(hasta);
        if (!origen || !destino) return;
        const valor = (o) => limpiar ? o.value.replace(/^[^\w\s]+\s*/, '') : o.value;
        destino.innerHTML = '';
        const todos = [...origen.options].filter(o => o.value).map(valor);
        if (actual && !todos.includes(actual)) {
          const g = document.createElement('optgroup');
          g.label = 'Categoría actual (ya no está en la lista)';
          g.appendChild(new Option(actual, actual));
          destino.appendChild(g);
        }
        [...origen.children].forEach(n => {
          if (n.tagName === 'OPTGROUP') {
            const g = document.createElement('optgroup');
            g.label = n.label;
            [...n.children].filter(o => o.value).forEach(o => g.appendChild(new Option(o.text, valor(o))));
            destino.appendChild(g);
          } else if (n.tagName === 'OPTION' && n.value) destino.add(new Option(n.text, valor(n)));
        });
        destino.value = actual || destino.options[0]?.value || '';
      };
      copiarOpciones('quickPayer', 'editExpPayer', exp.payer, false);
      copiarOpciones(cuentasCompletas(), 'editExpAccount', exp.account, false);
      copiarOpciones('quickCategory', 'editExpCategory', exp.category, true);
      const lugarEl = document.getElementById('editExpLugar');
      if (lugarEl) lugarEl.value = exp.lugar || adivinarLugar(`${exp.category || ''} ${exp.desc || ''}`);
      const lugarGrupo = document.getElementById('editExpLugarGroup');
      if (lugarGrupo) lugarGrupo.style.display = exp.payer === 'Diego' ? '' : 'none';

      // Seleccionar Categoría
      const catEl = document.getElementById('editExpCategory');
      if (catEl) {
        let found = false;
        for (let i = 0; i < catEl.options.length; i++) {
          if (catEl.options[i].value === exp.category) {
            catEl.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found && exp.category) {
          const opt = new Option(exp.category, exp.category, true, true);
          catEl.add(opt);
        }
      }

      // Seleccionar Cuenta
      const accEl = document.getElementById('editExpAccount');
      if (accEl) {
        let found = false;
        for (let i = 0; i < accEl.options.length; i++) {
          if (accEl.options[i].value === exp.account) {
            accEl.selectedIndex = i;
            found = true;
            break;
          }
        }
        if (!found && exp.account) {
          const opt = new Option(exp.account, exp.account, true, true);
          accEl.add(opt);
        }
      }

      document.getElementById('modalEditExpense').style.display = 'flex';
    }

    function closeEditExpenseModal() {
      const modal = document.getElementById('modalEditExpense');
      if (modal) modal.style.display = 'none';
    }

    async function saveEditedExpense(e) {
      e.preventDefault();
      if (versionBloqueada) { avisarVersionAntigua(); return; }
      if (recargarSiOtraCopiaSincronizo()) return;
      let idx = parseInt(document.getElementById('editExpIndex').value, 10);
      // La posición puede cambiar si el otro teléfono sincroniza mientras se edita
      if (editingExpenseId) {
        idx = expenses.findIndex(g => g.id === editingExpenseId);
        if (idx < 0) {
          alert('Ese gasto fue eliminado desde el otro teléfono.');
          closeEditExpenseModal();
          return;
        }
      }
      if (isNaN(idx) || idx < 0 || idx >= expenses.length) return;

      const date = document.getElementById('editExpDate').value;
      const payer = document.getElementById('editExpPayer').value;
      const category = document.getElementById('editExpCategory').value;
      const desc = document.getElementById('editExpDesc').value.trim();
      const amount = parseInt(document.getElementById('editExpAmount').value, 10);
      const account = document.getElementById('editExpAccount').value;
      const lugar = payer === 'Diego' ? (document.getElementById('editExpLugar')?.value || 'Limache') : undefined;

      if (!amount || amount <= 0) {
        alert('Por favor ingresa un monto válido.');
        return;
      }
      // Aviso suave si al editar el pagador o la cuenta quedan de personas distintas (p. ej. pagó Diego con la Chequera de Soledad)
      const dueno = duenoDeCuenta(account), antes = expenses[idx];
      if ((payer === 'Diego' || payer === 'Soledad') && dueno && dueno !== payer && (antes.payer !== payer || antes.account !== account)) {
        if (!(await confirmar(`"${account}" es una cuenta de ${dueno}, pero el gasto dice que pagó ${payer}. ¿Guardar igual?`, 'Sí, guardar'))) return;
        // Mientras la ventana estaba abierta el otro teléfono pudo cambiar la lista
        idx = expenses.findIndex(g => g === antes || (editingExpenseId && g.id === editingExpenseId));
        if (idx < 0) { closeEditExpenseModal(); return; }
      }

      const boletaEditada = itemDeGasto(expenses[idx]);
      expenses[idx] = {
        ...expenses[idx],
        date: date,
        payer: payer,
        category: category,
        desc: desc,
        amount: amount,
        account: account,
        lugar: lugar
      };
      if (!lugar) delete expenses[idx].lugar;
      if (boletaEditada) {
        boletaEditada.actual = amount;
        if (boletaEditada.fromQuickBill) boletaEditada.name = desc;
        persistirBoletasActivas();
      }

      localStorage.setItem('family_expenses', JSON.stringify(expenses));

      // El Real de las cuentas sale de los gastos: antes de subir, no al dibujar
      sincronizarRealDesdeGastos();
      programarRender('gastos', 'presupuesto', 'graficos');
      triggerAutoSyncToCloud();

      closeEditExpenseModal();
      showToast(`✅ Gasto "${desc}" modificado y sincronizado`);
    }

    function itemDeGasto(gasto) {
      if (gasto.auditId) return currentAuditItems.find(it => it.id === gasto.auditId) || null;
      if (expenses.filter(e => e.desc === gasto.desc).length !== 1) return null;
      return currentAuditItems.find(it => it.fromQuickBill && it.name === gasto.desc) || null;
    }

    function persistirBoletasActivas() {
      const datos = JSON.stringify(currentAuditItems);
      localStorage.setItem(`audit_${getMonthCode(currentActiveMonth)}`, datos);
      programarRender('presupuesto');
    }

    async function deleteExpense(idx) {
      if (versionBloqueada) { avisarVersionAntigua(); return; }
      if (recargarSiOtraCopiaSincronizo()) return;
      if (idx < 0 || idx >= expenses.length) return;
      const target = expenses[idx];
      if (!(await confirmar(`¿Deseas eliminar el gasto "${target.desc || target.category}" por ${formatCLP(target.amount)}?`, 'Eliminar'))) return;
      // Mientras la ventana estaba abierta el otro teléfono pudo cambiar la lista
      idx = expenses.indexOf(target);
      if (idx < 0) idx = expenses.findIndex(g => g.id && g.id === target.id);
      if (idx < 0) return;
      const boleta = itemDeGasto(target);
      // Para deshacer: el gasto vuelve con su mismo id a su lugar, y su cuenta del presupuesto a como estaba
      const cuentaAntes = boleta ? { item: JSON.parse(JSON.stringify(boleta)), pos: currentAuditItems.indexOf(boleta) } : null;
      const deleted = expenses.splice(idx, 1)[0];
      borrarDelDiario(deleted?.id);
      if (boleta) {
        if (boleta.fromQuickBill) currentAuditItems = currentAuditItems.filter(it => it.id !== boleta.id);
        else if (target.auditBefore) Object.assign(boleta, target.auditBefore);
        persistirBoletasActivas();
      }
      localStorage.setItem('family_expenses', JSON.stringify(expenses));
      sincronizarRealDesdeGastos();
      programarRender('gastos', 'presupuesto');
      triggerAutoSyncToCloud();
      showToast(`🗑️ Gasto "${deleted?.desc || ''}" eliminado`, { label: 'Deshacer', onClick: () => deshacerBorrado(deleted, idx, cuentaAntes) });
    }

    function deshacerBorrado(gasto, pos, cuentaAntes) {
      if (versionBloqueada) { avisarVersionAntigua(); return; }
      if (recargarSiOtraCopiaSincronizo()) return;
      if (expenses.some(g => g.id === gasto.id)) return;
      expenses.splice(Math.min(pos, expenses.length), 0, gasto);
      anotarEnDiario(gasto);
      if (cuentaAntes) {
        const actual = currentAuditItems.find(it => it.id === cuentaAntes.item.id);
        if (actual) actual.actual = cuentaAntes.item.actual;
        else currentAuditItems.splice(Math.min(cuentaAntes.pos, currentAuditItems.length), 0, cuentaAntes.item);
        persistirBoletasActivas();
      }
      localStorage.setItem('family_expenses', JSON.stringify(expenses));
      sincronizarRealDesdeGastos();
      programarRender('gastos', 'presupuesto');
      triggerAutoSyncToCloud(true);
      showToast(`↩️ Gasto "${gasto.desc || ''}" restaurado`);
    }

    let toastTimer = null;

    function showToast(msg = '¡Acción realizada con éxito!', action = null) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.toggle('has-action', !!action);
      if (action) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'toast-action';
        button.textContent = action.label;
        // Un toque en el primer instante suele ser el segundo toque del botón "Registrar": se ignora
        const aparecio = Date.now();
        button.onclick = () => { if (Date.now() - aparecio < 700) return; t.classList.remove('show', 'has-action'); action.onClick(); };
        t.appendChild(button);
      }
      t.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => t.classList.remove('show', 'has-action'), action ? 6000 : 2500);
    }

    function exportToCSV() {
      let csv = 'Fecha,Pagador,Categoria,Detalle,Cuenta,Monto\n';
      expenses.forEach(e => {
        const celda = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
        csv += `${e.date},${e.payer},${celda(e.category)},${celda(e.desc)},${celda(e.account)},${e.amount}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Gastos_Hogar_${getLocalDateISO()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    // Cargar ítems personalizados guardados previamente
    function loadCustomItems() {
      const saved = localStorage.getItem('custom_audit_items');
      if (saved) {
        try {
          const customs = JSON.parse(saved);
          customs.forEach(c => {
            if (!currentAuditItems.some(it => it.id === c.id)) {
              currentAuditItems.push(c);
            }
          });
        } catch(e) {}
      }
    }

    // On Load
