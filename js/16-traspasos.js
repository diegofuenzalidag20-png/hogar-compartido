// Traspasos entre cuentas propias: formulario, lista del mes, registro y borrado. No son gasto: solo mueven saldos (netoTraspasos vive en 14-tarjetas.js).
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // Cuentas que entregan o reciben plata en un traspaso: las de Diego y Soledad del formulario de gastos, sin las tarjetas de crédito
    // (su pago ya tiene su campo en el cofre) y sin "Otros" (efectivo y otras tarjetas no tienen saldo en la app)
    function cuentasParaTraspaso() {
      const grupos = cuentasCompletas().querySelectorAll('optgroup[data-dueno="Diego"], optgroup[data-dueno="Soledad"]');
      return [...grupos].map(g => ({
        dueno: g.dataset.dueno,
        opciones: [...g.children].filter(o => {
          const cfg = CARDS_ANALYSIS_CONFIG.find(c => c.key === normalizeAccountKey(o.value));
          return o.value && cfg && !cfg.esCredito;
        }).map(o => ({ value: o.value, texto: o.textContent }))
      }));
    }

    function duenoDeCuenta(valor) {
      return CARDS_ANALYSIS_CONFIG.find(c => c.key === normalizeAccountKey(valor))?.owner || '';
    }

    function llenarSelectsTraspaso() {
      const grupos = cuentasParaTraspaso();
      ['trasDesde', 'trasHacia'].forEach(id => {
        const sel = document.getElementById(id);
        if (!sel) return;
        const previo = sel.value;
        sel.innerHTML = '<option value="" disabled selected>-- Elegir --</option>'
          + grupos.map(g => `<optgroup label="Cuentas de ${g.dueno}">${g.opciones.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.texto)}</option>`).join('')}</optgroup>`).join('');
        if ([...sel.options].some(o => o.value === previo)) sel.value = previo;
      });
    }

    // La fecha parte en hoy; si la app quedó abierta de un día para otro y nadie la tocó, se actualiza sola
    let fechaTraspasoAuto = '';
    function renderTraspasos() {
      const cont = document.getElementById('traspasosLista');
      if (!cont) return;
      if (document.getElementById('trasDesde')?.options.length < 2) llenarSelectsTraspaso();
      const fecha = document.getElementById('trasFecha');
      if (fecha && (!fecha.value || fecha.value === fechaTraspasoAuto)) fecha.value = fechaTraspasoAuto = getLocalDateISO();
      const badge = document.getElementById('traspasosCountBadge');
      if (badge) badge.textContent = `${traspasos.length} ${traspasos.length === 1 ? 'traspaso' : 'traspasos'}`;
      const orden = [...traspasos].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      cont.innerHTML = orden.length ? orden.map(t => {
        const de = duenoDeCuenta(t.from), a = duenoDeCuenta(t.to);
        const entrePersonas = de && a && de !== a ? ` · de ${de} a ${a}` : '';
        return `<div class="traspaso-fila">
          <div class="traspaso-info">
            <strong>${escapeHtml(t.from)} → ${escapeHtml(t.to)}</strong>
            <small>${escapeHtml(t.date || '')}${t.desc ? ' · ' + escapeHtml(t.desc) : ''}${escapeHtml(entrePersonas)}</small>
          </div>
          <strong class="traspaso-monto">${formatCLP(t.amount)}</strong>
          <button type="button" class="traspaso-borrar" data-borrar="${escapeHtml(t.id)}" aria-label="Borrar traspaso" title="Borrar traspaso">🗑️</button>
        </div>`;
      }).join('') : '<p class="hist-nota">Aún no hay traspasos este mes.</p>';
      cont.onclick = (e) => { const b = e.target.closest('[data-borrar]'); if (b) borrarTraspaso(b.dataset.borrar); };
    }

    // Guarda en el teléfono, vuelve a calcular lo que depende de los saldos y sube a la nube igual que un gasto
    function persistirTraspasos() {
      localStorage.setItem('family_traspasos', JSON.stringify(traspasos));
      syncProfileToInputs();
      programarRender('traspasos', 'presupuesto');
      triggerAutoSyncToCloud(true);
    }

    let ultimoTraspaso = { firma: '', hora: 0 };
    function registrarTraspaso(e) {
      if (e) e.preventDefault();
      // Mismos resguardos que al registrar un gasto: versión antigua de la app u otra copia que ya sincronizó
      if (versionBloqueada) { avisarVersionAntigua(); return; }
      if (recargarSiOtraCopiaSincronizo()) return;
      const date = document.getElementById('trasFecha').value || getLocalDateISO();
      const from = document.getElementById('trasDesde').value;
      const to = document.getElementById('trasHacia').value;
      const amount = parseInt(document.getElementById('trasMonto').value, 10);
      const desc = document.getElementById('trasDetalle').value.trim();
      if (!from || !to) { avisar('Elige la cuenta de origen y la de destino.'); return; }
      if (from === to) { avisar('La cuenta de origen y la de destino son la misma. Elige dos cuentas distintas.'); return; }
      if (!amount || isNaN(amount) || amount <= 0) { avisar('Por favor ingresa un monto válido, mayor a $0.'); return; }

      const firma = [date, from, to, amount, desc].join('|');
      if (firma === ultimoTraspaso.firma && Date.now() - ultimoTraspaso.hora < 2500) return;
      ultimoTraspaso = { firma, hora: Date.now() };

      // autor: de quién es la plata que sale (la app no sabe quién tiene el teléfono)
      const t = { id: nuevoId('tras'), date, from, to, amount, autor: duenoDeCuenta(from) };
      if (desc) t.desc = desc;
      traspasos.unshift(t);
      persistirTraspasos();
      limpiarFormularioTraspaso();
      showToast(`🔁 ${from} → ${to} · ${formatCLP(amount)}`, { label: 'Deshacer', onClick: () => quitarTraspaso(t.id) });
    }

    function limpiarFormularioTraspaso() {
      ['trasMonto', 'trasDetalle', 'trasDesde', 'trasHacia'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      const fecha = document.getElementById('trasFecha');
      if (fecha) fecha.value = fechaTraspasoAuto = getLocalDateISO();
    }

    function quitarTraspaso(id) {
      traspasos = traspasos.filter(t => t.id !== id);
      persistirTraspasos();
    }

    async function borrarTraspaso(id) {
      if (versionBloqueada) { avisarVersionAntigua(); return; }
      if (recargarSiOtraCopiaSincronizo()) return;
      const t = traspasos.find(x => x.id === id);
      if (!t) return;
      if (!(await confirmar(`¿Deseas borrar el traspaso de ${formatCLP(t.amount)} de ${t.from} a ${t.to}? Los saldos de las dos cuentas vuelven a como estaban.`, 'Eliminar'))) return;
      // Mientras la ventana estaba abierta el otro teléfono pudo cambiar la lista
      if (!traspasos.some(x => x.id === id)) return;
      quitarTraspaso(id);
      showToast('🗑️ Traspaso borrado');
    }
