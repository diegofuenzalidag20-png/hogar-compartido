// Registro rápido de gastos, búsqueda de categoría/cuenta, íconos de trazo y selector Limache/Huasco.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ==============================================================
    // CAJA DE INGRESO RÁPIDO & CHECKLIST CON FILTRO SOLEDAD
    // ==============================================================
        // ==============================================================
    // ALGORITMO INTELIGENTE DE MATCHING PARA CATEGORÍAS Y CUENTAS
    // ==============================================================
    function matchCategoryOptionIndex(selectEl, billName, category, detail) {
      if (!selectEl) return -1;
      const query = `${billName || ''} ${detail || ''} ${category || ''}`.toLowerCase();

      function findIndexBySubstr(target) {
        const t = target.toLowerCase();
        for (let i = 0; i < selectEl.options.length; i++) {
          if (selectEl.options[i].value.toLowerCase().includes(t) || 
              selectEl.options[i].textContent.toLowerCase().includes(t)) {
            return i;
          }
        }
        return -1;
      }

      // 1. Reglas específicas por palabra clave en orden de prioridad
      if (/\bhuasco\b/i.test(query) && (/\bluz\b|\bagua\b|servicios/i.test(query))) {
        return findIndexBySubstr('Pagos Servicios Huasco');
      }
      if (/arriendo|habitaci/i.test(query)) {
        return findIndexBySubstr('Arriendo Habitación Huasco');
      }
      if (/pasaje|bus\b/i.test(query)) {
        return findIndexBySubstr('Pasajes Bus Huasco');
      }

      if (/hipotec|dividendo/i.test(query)) {
        if (/soledad|diferencial|\buf\b/i.test(query)) {
          return findIndexBySubstr('Diferencial UF Soledad');
        }
        return findIndexBySubstr('Aporte Fijo Diego');
      }

      if (/smart|visa/i.test(query)) {
        return findIndexBySubstr('Tarjeta Smart Visa');
      }

      if (/\bluz\b|chilquinta/i.test(query)) {
        return findIndexBySubstr('Luz (Chilquinta');
      }
      if (/\bagua\b|esval/i.test(query)) {
        return findIndexBySubstr('Agua (Esval');
      }
      if (/\bgas\b|balón|balon/i.test(query) && !/gasto\s*com/i.test(query)) {
        return findIndexBySubstr('Gas (Balón');
      }
      if (/común|comun|condominio/i.test(query)) {
        return findIndexBySubstr('Gasto Común');
      }
      if (/\bclaro\b/i.test(query)) {
        return findIndexBySubstr('Plan Claro');
      }
      if (/\bentel\b/i.test(query)) {
        return findIndexBySubstr('Planes Entel');
      }
      if (/internet|wifi|fibra/i.test(query)) {
        return findIndexBySubstr('Internet Hogar');
      }
      if (/aseo\b|municipal/i.test(query)) {
        return findIndexBySubstr('Aseo Domiciliario');
      }

      if (/supermercado|lider|mayorista|jumbo|unimarc|tottus/i.test(query)) {
        return findIndexBySubstr('Supermercado');
      }
      if (/feria|verduler|fruta/i.test(query)) {
        return findIndexBySubstr('Feria Libre');
      }
      if (/delivery|salida|almuerzo|cena|restauran/i.test(query)) {
        return findIndexBySubstr('Comida Fuera');
      }

      if (/arena/i.test(query)) {
        return findIndexBySubstr('Arena Sanitaria');
      }
      if (/michi|gato|felin/i.test(query)) {
        return findIndexBySubstr('Comida Michis');
      }
      if (/veterin/i.test(query)) {
        return findIndexBySubstr('Veterinario');
      }

      if (/waldorf|curso/i.test(query)) {
        return findIndexBySubstr('Curso Waldorf');
      }
      if (/eutirox|rupatadina|farmacia|medicam/i.test(query)) {
        return findIndexBySubstr('Farmacia');
      }
      if (/dent|médic|medic|consulta/i.test(query)) {
        return findIndexBySubstr('Consultas Médicas');
      }
      if (/netflix|crunchyroll|streaming|spotify/i.test(query)) {
        return findIndexBySubstr('Streaming');
      }

      if (/uber|colectivo|taxi|traslado/i.test(query)) {
        return findIndexBySubstr('Uber');
      }
      if (/metro|efe\b/i.test(query)) {
        return findIndexBySubstr('Metro Valparaíso');
      }
      if (/snack|turno/i.test(query)) {
        return findIndexBySubstr('Snacks');
      }
      if (/transferencia|tercero/i.test(query)) {
        return findIndexBySubstr('Transferencia a Tercero');
      }

      if (/mach\b|bolsillo/i.test(query)) {
        return findIndexBySubstr('Bolsillo Personal');
      }
      if (/emergencia|ahorro|reserva/i.test(query)) {
        return findIndexBySubstr('Ahorro / Fondo');
      }

      // 2. Coincidencia directa en value
      if (category && category !== 'Otros' && category !== 'Servicios Hogar') {
        const catLower = category.toLowerCase();
        for (let i = 0; i < selectEl.options.length; i++) {
          if (selectEl.options[i].value.toLowerCase().includes(catLower)) {
            return i;
          }
        }
      }

      return findIndexBySubstr('Otros Imprevistos');
    }

    function matchAccountOptionIndex(selectEl, account, payer) {
      if (!selectEl || !account) return -1;
      const acc = account.toLowerCase();
      const isSole = (payer === 'Soledad');

      function findIndexBySubstr(target) {
        const t = target.toLowerCase();
        for (let i = 0; i < selectEl.options.length; i++) {
          if (selectEl.options[i].value.toLowerCase().includes(t) || 
              selectEl.options[i].textContent.toLowerCase().includes(t)) {
            return i;
          }
        }
        return -1;
      }

      if (/smart|visa/i.test(acc)) return findIndexBySubstr('Tarjeta Smart Visa');
      if (/bci/i.test(acc) && /cr[eé]d|tarjeta/i.test(acc)) return findIndexBySubstr('Tarjeta de Crédito BCI');
      if (/bci/i.test(acc)) return findIndexBySubstr('BCI Cuenta Corriente');
      // Los accesos rápidos y las cuentas fijas dicen "Cuenta Fan": desde diciembre se preselecciona la cuenta principal nueva
      if (/fan/i.test(acc)) return findIndexBySubstr(cuentaPrincipalDiego());
      if (/chequera/i.test(acc) || (/bancoestado/i.test(acc) && !/ahorro/i.test(acc))) {
        return findIndexBySubstr('Chequera BancoEstado');
      }
      if (/ahorro/i.test(acc)) return findIndexBySubstr('BancoEstado Ahorro');
      if (/mach/i.test(acc)) return findIndexBySubstr('Mach');
      if (/tenpo/i.test(acc)) {
        return isSole ? findIndexBySubstr('Tenpo Soledad') : findIndexBySubstr('Tenpo Diego');
      }
      if (/mercado|pago/i.test(acc)) {
        return isSole ? findIndexBySubstr('Mercado Pago Soledad') : findIndexBySubstr('Mercado Pago Diego');
      }
      if (/efectivo/i.test(acc)) return findIndexBySubstr('Efectivo');

      return findIndexBySubstr(account);
    }

    function getLocalDateISO() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function quickSelectChip(billName, defaultAmount, payer, category, account, detail) {
      if (mobileLayout.matches) openQuickSheet();
      const today = getLocalDateISO();
      const elDate = document.getElementById('quickDate');
      if (elDate) elDate.value = today;

      const elPayer = document.getElementById('quickPayer');
      if (elPayer && payer) {
        elPayer.value = payer;
        elPayer.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof elPayer._syncGlassDisplay === 'function') elPayer._syncGlassDisplay();
      }

      const elCat = document.getElementById('quickCategory');
      if (elCat) {
        const catIdx = matchCategoryOptionIndex(elCat, billName, category, detail);
        if (catIdx >= 0) {
          elCat.selectedIndex = catIdx;
          elCat.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const elAcc = document.getElementById('quickAccount');
      if (elAcc) {
        const accIdx = matchAccountOptionIndex(elAcc, account, payer);
        if (accIdx >= 0) {
          elAcc.selectedIndex = accIdx;
          elAcc.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      const elDesc = document.getElementById('quickDesc');
      if (elDesc) elDesc.value = detail || billName || '';

      const elAmount = document.getElementById('quickAmount');
      if (elAmount) {
        elAmount.value = '';
        elAmount.placeholder = defaultAmount ? `Sugerido: ${formatCLP(defaultAmount)}` : 'Ej: 18500';
        elAmount.focus();
      }

      syncAllGlassSelects();
    }

    // Los emojis del texto se muestran como íconos de trazo; las opciones de los selectores quedan igual
    const ICONO_DE_EMOJI = {'🎟️':'ticket','🎟':'ticket','🟣':'dot c-sole','🔵':'dot c-diego','🟢':'dot c-ok','🔴':'dot c-mal','🟡':'dot c-aviso','💾':'save','💰':'wallet','💵':'cash','💸':'cash','💡':'bulb','⚠️':'alert c-aviso','⚠':'alert c-aviso','💳':'card','✏️':'pencil','✏':'pencil','☁️':'cloud','☁':'cloud','📅':'calendar','🗓️':'calendar','🗓':'calendar','🏦':'bank','✅':'check c-ok','✕':'x','❌':'x c-mal','🐱':'paw','🐾':'paw','💎':'gem','🏡':'home','🏠':'home','📲':'phone','📱':'phone','📥':'download','📤':'upload','⚡':'zap','🛒':'cart','🛍️':'bag','🛍':'bag','👜':'bag','➕':'plus','🤝':'users','👥':'users','🧹':'eraser','📋':'list','📑':'list','🧾':'list','📜':'list','✨':'sparkle','🌟':'sparkle','🎉':'sparkle','🚀':'sparkle','🤖':'sparkle','↩️':'undo','↩':'undo','💧':'drop','🔥':'flame','🌐':'wifi','📶':'wifi','🏢':'building','🚗':'car','📊':'chart','📈':'up','📉':'down','⏳':'clock','⏱️':'clock','⏱':'clock','🚌':'bus','🚆':'train','🩺':'pulse','💊':'pill','📦':'box','📂':'folder','⚖️':'scale','⚖':'scale','🗑️':'trash','🗑':'trash','☀️':'sun','☀':'sun','🌙':'moon','🌓':'moon','📘':'book','🎓':'cap','🥪':'food','🥗':'food','🍽️':'food','🍽':'food','🥧':'food','🍩':'food','🍎':'food','🍔':'food','→':'arrow','➔':'arrow','👉':'arrow','↗':'external','⬆️':'arrowup','⬆':'arrowup','⬇️':'arrowdown','⬇':'arrowdown','🔄':'refresh','🔁':'refresh','⛰️':'mountain','⛰':'mountain','🛡️':'shield','🛡':'shield','🔒':'lock','📺':'tv','🔍':'search','🍃':'leaf','💬':'chat','☰':'menu','🏆':'award c-oro','🥇':'award c-oro','🥈':'award c-plata','🥉':'award c-bronce','💜':'heart c-sole','🎯':'target','👁️':'eye','👁':'eye','⚙️':'sliders','⚙':'sliders'};
    const RE_EMOJI = /(?:[\u{1F000}-\u{1FAFF}]|[\u2190-\u21FF\u2300-\u23FF\u2600-\u27BF\u2B00-\u2BFF])\uFE0F?/gu;
    const SIN_ICONOS = new Set(['OPTION', 'OPTGROUP', 'SELECT', 'TEXTAREA', 'SCRIPT', 'STYLE', 'TITLE', 'svg', 'CANVAS']);
    function iconoSVG(emoji) {
      const def = ICONO_DE_EMOJI[emoji] || ICONO_DE_EMOJI[emoji.replace('\uFE0F', '')];
      if (!def) return null;
      const [nombre, color] = def.split(' ');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', `ic ic-${nombre}${color ? ' ' + color : ''}`);
      svg.setAttribute('aria-hidden', 'true');
      svg.dataset.e = emoji;
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', `#i-${nombre}`);
      svg.appendChild(use);
      return svg;
    }
    function iconizarTexto(nodo) {
      const padre = nodo.parentNode;
      if (!padre || SIN_ICONOS.has(padre.nodeName) || padre.closest?.('select, textarea, svg')) return;
      const texto = nodo.nodeValue;
      RE_EMOJI.lastIndex = 0;
      if (!RE_EMOJI.test(texto)) return;
      const frag = document.createDocumentFragment();
      let desde = 0, cambio = false;
      texto.replace(RE_EMOJI, (emoji, pos) => {
        const svg = iconoSVG(emoji);
        if (!svg) return emoji;
        if (pos > desde) frag.appendChild(document.createTextNode(texto.slice(desde, pos)));
        frag.appendChild(svg);
        desde = pos + emoji.length;
        cambio = true;
        return emoji;
      });
      if (!cambio) return;
      if (desde < texto.length) frag.appendChild(document.createTextNode(texto.slice(desde)));
      padre.replaceChild(frag, nodo);
    }
    function iconizar(raiz) {
      if (!raiz) return;
      if (raiz.nodeType === 3) return iconizarTexto(raiz);
      if (raiz.nodeType !== 1 || SIN_ICONOS.has(raiz.nodeName)) return;
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
      const nodos = [];
      while (w.nextNode()) nodos.push(w.currentNode);
      nodos.forEach(iconizarTexto);
    }
    function iniciarIconos() {
      iconizar(document.body);
      new MutationObserver(cambios => cambios.forEach(m => {
        if (m.type === 'characterData') iconizarTexto(m.target);
        else m.addedNodes.forEach(iconizar);
      })).observe(document.body, { childList: true, subtree: true, characterData: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciarIconos);
    else iniciarIconos();

    // Diego reparte sus gastos entre la casa de Limache y el departamento de Huasco
    const PATRON_HUASCO = /huasco|pasaje|turno/i;
    function adivinarLugar(texto) { return PATRON_HUASCO.test(texto || '') ? 'Huasco' : 'Limache'; }
    function marcarLugar(lugar) {
      const r = document.querySelector(`input[name="quickLugar"][value="${lugar}"]`);
      if (r) r.checked = true;
    }
    function actualizarSelectorLugar(e) {
      const grupo = document.getElementById('quickLugarGroup');
      if (!grupo) return;
      grupo.style.display = document.getElementById('quickPayer').value === 'Diego' ? '' : 'none';
      // Al elegir una categoría de Huasco (o de Limache) se sugiere el lugar; Diego puede cambiarlo
      if (e && e.target && e.target.id === 'quickCategory') {
        const cat = e.target.value || '';
        if (PATRON_HUASCO.test(cat)) marcarLugar('Huasco');
        else if (/limache/i.test(cat)) marcarLugar('Limache');
      }
    }
    // Medio de pago: cada persona ve solo sus cuentas (más Otros); "Ambos" o sin elegir ve todas
    let plantillaCuentas = null;
    function cuentasCompletas() {
      return plantillaCuentas || document.getElementById('quickAccount');
    }
    function filtrarCuentasPorPagador() {
      const sel = document.getElementById('quickAccount');
      if (!sel) return;
      plantillaCuentas = plantillaCuentas || sel.cloneNode(true);
      const pagador = document.getElementById('quickPayer')?.value;
      const previo = sel.value;
      sel.innerHTML = '';
      [...plantillaCuentas.children].forEach(n => {
        const dueno = n.dataset?.dueno;
        if (n.tagName === 'OPTGROUP' && (pagador === 'Diego' || pagador === 'Soledad') && dueno !== pagador && dueno !== 'Otros') return;
        sel.appendChild(n.cloneNode(true));
      });
      sel.value = [...sel.options].some(o => o.value === previo) ? previo : '';
      if (typeof sel._syncGlassDisplay === 'function') sel._syncGlassDisplay();
    }

    // ---------- "Yo soy" (v86): de quién es este teléfono. Vive solo aquí (no se sincroniza) ----------
    // Con dueño, el registro parte con él como pagador, sus cuentas y su último medio de pago; sin dueño, todo sigue igual.
    const CLAVE_YO_SOY = 'yo_soy_telefono', CLAVE_ULTIMO_MEDIO = 'ultimo_medio_de_pago';
    const yoSoy = () => { const v = localStorage.getItem(CLAVE_YO_SOY); return v === 'Diego' || v === 'Soledad' ? v : null; };
    let yoSoyPreguntado = false;
    async function elegirYoSoy() {
      yoSoyPreguntado = true;
      const v = await dialogo({ texto: '¿De quién es este teléfono? El registro partirá con esa persona como quien pagó (se puede cambiar en cada gasto). Lo puedes cambiar en el menú.', opciones: [{ texto: 'Diego', valor: 'Diego' }, { texto: 'Soledad', valor: 'Soledad' }, { texto: 'Lo elijo cada vez', valor: 'cada-vez' }] });
      if (!v) return;
      localStorage.setItem(CLAVE_YO_SOY, v);
      actualizarMenuYoSoy();
      prellenarPagador(true);
    }
    // La primera vez que se abre el registro (si se cierra sin elegir, se vuelve a preguntar al abrir la app otra vez)
    function preguntarYoSoySiFalta() {
      if (!yoSoyPreguntado && localStorage.getItem(CLAVE_YO_SOY) === null) elegirYoSoy();
    }
    function actualizarMenuYoSoy() {
      const b = document.getElementById('menuYoSoy');
      if (b) b.textContent = `👥 Este teléfono es de: ${yoSoy() || 'elijo cada vez'}`;
    }
    function prellenarPagador(forzar = false) {
      const quien = yoSoy(), sel = document.getElementById('quickPayer');
      if (!quien || !sel || (sel.value && !forzar)) return;
      sel.value = quien;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      const medio = leerJSON(CLAVE_ULTIMO_MEDIO, {})[quien], cuentas = document.getElementById('quickAccount');
      if (medio && cuentas && [...cuentas.options].some(o => o.value === medio)) cuentas.value = medio;
      syncAllGlassSelects();
    }
    function recordarMedioDePago(pagador, cuenta) {
      if (!yoSoy() || (pagador !== 'Diego' && pagador !== 'Soledad')) return;
      localStorage.setItem(CLAVE_ULTIMO_MEDIO, JSON.stringify({ ...leerJSON(CLAVE_ULTIMO_MEDIO, {}), [pagador]: cuenta }));
    }

    // Validación del registro: el campo queda marcado, con el mensaje debajo, y el foco va al primero con error
    function marcarCampoInvalido(id, texto) {
      const el = document.getElementById(id);
      const grupo = el.closest('.form-group') || el.parentNode;
      let msg = grupo.querySelector('.campo-error');
      if (!msg) { msg = document.createElement('div'); msg.className = 'campo-error'; msg.id = `${id}-error`; grupo.appendChild(msg); }
      msg.textContent = texto;
      el.setAttribute('aria-invalid', 'true');
      el.setAttribute('aria-describedby', msg.id);
      return el;
    }
    function limpiarCampoInvalido(el) {
      if (!el?.hasAttribute?.('aria-invalid')) return;
      el.removeAttribute('aria-invalid');
      el.removeAttribute('aria-describedby');
      (el.closest('.form-group') || el.parentNode).querySelector('.campo-error')?.remove();
    }

    document.addEventListener('input', e => limpiarCampoInvalido(e.target));
    document.addEventListener('change', e => {
      limpiarCampoInvalido(e.target);
      if (e.target && e.target.id === 'quickPayer') filtrarCuentasPorPagador();
      if (e.target && (e.target.id === 'quickPayer' || e.target.id === 'quickCategory')) actualizarSelectorLugar(e);
      if (e.target && e.target.id === 'editExpPayer') {
        const g = document.getElementById('editExpLugarGroup');
        if (g) g.style.display = e.target.value === 'Diego' ? '' : 'none';
      }
    });

    let ultimoRegistro = { firma: '', hora: 0 };

    let gastoRecienRegistrado = null;

    async function handleQuickBillSubmit(e) {
      e.preventDefault();
      // Sin esperar la red: la versión se revisa al abrir, al volver a la app y cada 5 minutos
      if (versionBloqueada) { avisarVersionAntigua(); return; }
      // Otra copia de la app sincronizó: esta tiene la lista vieja y guardar aquí borraría lo nuevo
      if (recargarSiOtraCopiaSincronizo()) return;
      const date = document.getElementById('quickDate').value || getLocalDateISO();
      const payer = document.getElementById('quickPayer').value;
      const cat = document.getElementById('quickCategory').value;
      const amount = parseInt(document.getElementById('quickAmount').value, 10);
      const account = document.getElementById('quickAccount').value;
      const desc = document.getElementById('quickDesc').value.trim();
      const lugar = payer === 'Diego' ? (document.querySelector('input[name="quickLugar"]:checked')?.value || 'Limache') : null;

      const errores = [
        !payer && ['quickPayer', 'Por favor selecciona quién pagó.'],
        !cat && ['quickCategory', 'Por favor selecciona una categoría.'],
        !(amount > 0) && ['quickAmount', 'Por favor ingresa un monto válido.'],
        !account && ['quickAccount', 'Por favor selecciona el medio de pago.'],
        !desc && ['quickDesc', 'Por favor escribe el detalle o comercio.']
      ].filter(Boolean);
      document.querySelectorAll('#quickBillForm [aria-invalid]').forEach(limpiarCampoInvalido);
      if (errores.length) {
        const primero = errores.map(([id, texto]) => marcarCampoInvalido(id, texto))[0];
        // Los selectores están ocultos tras su botón de vidrio: el foco va al botón
        (primero.closest('.glass-select-wrapper')?.querySelector('.glass-select-trigger') || primero).focus();
        return;
      }

      const firmaRegistro = [date, payer, cat, amount, account, desc, lugar].join('|');
      if (firmaRegistro === ultimoRegistro.firma && Date.now() - ultimoRegistro.hora < 2500) return;
      ultimoRegistro = { firma: firmaRegistro, hora: Date.now() };

      // Un gasto igual (mismo día, quién, monto y categoría) suele ser el mismo registrado otra vez
      const igual = expenses.find(g => g.date === date && g.payer === payer && Number(g.amount) === amount && g.category === cat.replace(/^[^\w\s]+\s*/, ''));
      if (igual) {
        const cuando = /^exp-(\d+)/.test(igual.id || '') ? `, registrado el ${new Date(Number(igual.id.split('-')[1])).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}` : '';
        if (!(await confirmar(`Ya existe un gasto igual: "${igual.desc}" por ${formatCLP(amount)} con fecha ${date}${cuando}.\n\n¿Registrar otro igual?`, 'Sí, es otro gasto'))) return;
      }

      // 1. Sincronizar en auditoría mensual y checklist
      const descLower = desc.toLowerCase();
      const gastoPrueba = { category: cat.replace(/^[^\w\s]+\s*/, ''), desc };
      // Antes "Luz" caía en "Servicios Huasco (Luz y Agua)" y "Hielo (Gastos Hogar)" en Gas, y cambiaban de responsable
      const idPorRegla = itemIdPorReglas(gastoPrueba);
      let matched = (idPorRegla && currentAuditItems.find(it => it.id === idPorRegla))
        || currentAuditItems.find(it => !CHECKLIST_FIJOS[it.id] && !REGLAS_VARIABLES[it.id] && it.name.toLowerCase() === descLower);

      const auditBefore = matched ? { actual: matched.actual } : null;
      if (matched) {
        matched.actual = amount;
      } else {
        const newItem = {
          id: nuevoId('custom'),
          name: desc,
          cat: cat.replace(/^[^\w\s]+\s*/, ''),
          resp: payer,
          cuenta: account,
          base: 0,
          actual: amount,
          isCustom: true,
          fromQuickBill: true
        };
        currentAuditItems.push(newItem);
      }
      const auditId = matched ? matched.id : currentAuditItems[currentAuditItems.length - 1].id;

      // 2. Registrar en la tabla de Gastos Diarios
      const newExp = {
        id: nuevoId('exp'),
        date: date,
        payer: payer,
        category: cat.replace(/^[^\w\s]+\s*/, ''),
        amount: amount,
        account: account,
        desc: desc,
        auditId: auditId,
        auditBefore: auditBefore
      };
      if (lugar) newExp.lugar = lugar;
      recordarMedioDePago(payer, account);
      expenses.unshift(newExp);
      anotarEnDiario(newExp);
      const guardadoAqui = localStorage.setItem('family_expenses', JSON.stringify(expenses));

      // 3. Persistir (el Real de las cuentas sale de los gastos: se calcula antes de guardar y subir) y dibujar una vez
      sincronizarRealDesdeGastos();
      saveAuditMonth();
      triggerAutoSyncToCloud(true);
      // Si su fecha lo deja fuera de los primeros de la lista, igual se muestra destacado un rato
      gastoRecienRegistrado = newExp.id;
      setTimeout(() => { if (gastoRecienRegistrado === newExp.id) { gastoRecienRegistrado = null; programarRender('gastos'); } }, 20000);
      programarRender('perfil', 'presupuesto', 'gastos', 'analisis');
      limpiarCajaRapida(true);
      if (mobileLayout.matches) closeQuickSheet();
      // Con la memoria llena el gasto vive solo en esta pantalla hasta que suba a la nube
      showToast(`${guardadoAqui ? '✅' : '⚠️ Sin espacio en el teléfono:'} ${desc} · ${formatCLP(amount)}`, { label: 'Deshacer', onClick: () => undoQuickBill(newExp.id, auditId, auditBefore) });
    }

    function undoQuickBill(expenseId, auditId, auditBefore) {
      borrarDelDiario(expenseId);
      expenses = expenses.filter(e => e.id !== expenseId);
      const item = currentAuditItems.find(it => it.id === auditId);
      if (item && auditBefore) Object.assign(item, auditBefore);
      else currentAuditItems = currentAuditItems.filter(it => it.id !== auditId);
      localStorage.setItem('family_expenses', JSON.stringify(expenses));
      sincronizarRealDesdeGastos();
      saveAuditMonth();
      programarRender('perfil', 'presupuesto', 'gastos', 'analisis');
      showToast('Gasto deshecho');
    }

    // Funciones para limpiar casillas en caso de error o equivocación
    function limpiarCajaRapida(silent = false) {
      const elDate = document.getElementById('quickDate');
      if (elDate) elDate.value = getLocalDateISO();

      const elAmt = document.getElementById('quickAmount');
      if (elAmt) { elAmt.value = ''; elAmt.placeholder = 'Ej: 18500'; }

      const elDesc = document.getElementById('quickDesc');
      if (elDesc) elDesc.value = '';
      marcarLugar('Limache');

      const elPayer = document.getElementById('quickPayer');
      if (elPayer) {
        elPayer.selectedIndex = 0;
        elPayer.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof elPayer._syncGlassDisplay === 'function') elPayer._syncGlassDisplay();
      }

      const elCat = document.getElementById('quickCategory');
      if (elCat) {
        elCat.selectedIndex = 0;
        elCat.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof elCat._syncGlassDisplay === 'function') elCat._syncGlassDisplay();
      }

      const elAcc = document.getElementById('quickAccount');
      if (elAcc) {
        elAcc.selectedIndex = 0;
        elAcc.dispatchEvent(new Event('change', { bubbles: true }));
        if (typeof elAcc._syncGlassDisplay === 'function') elAcc._syncGlassDisplay();
      }

      prellenarPagador();
      syncAllGlassSelects();
      if (elAmt) elAmt.focus();
      if (typeof showToast === 'function') {
        if (!silent) showToast('🧹 Casillas limpiadas. Fecha fijada en hoy.');
      }
    }

    function limpiarSalaryModal() {
      const el = document.getElementById('salaryModalInput');
      if (el) {
        el.value = '';
        el.focus();
      }
    }

    // CHECKLIST CON FILTRO SOLEDAD COMPLETO
    let currentChecklistFilter = 'hogar';

    function setChecklistFilter(filter) {
      currentChecklistFilter = filter;
      const bHogar = document.getElementById('chkFilterHogar');
      const bDiego = document.getElementById('chkFilterDiego');
      const bSole = document.getElementById('chkFilterSoledad');
      const bTodos = document.getElementById('chkFilterTodos');
      if (bHogar) bHogar.classList.toggle('active', filter === 'hogar');
      if (bDiego) bDiego.classList.toggle('active', filter === 'diego');
      if (bSole) bSole.classList.toggle('active', filter === 'soledad');
      if (bTodos) bTodos.classList.toggle('active', filter === 'todos');
      renderChecklist();
    }

    function isHouseholdBill(item) {
      const n = item.name.toLowerCase();
      const c = item.cat ? item.cat.toLowerCase() : '';
      return n.includes('luz') || n.includes('agua') || n.includes('gas') ||
             n.includes('claro') || n.includes('gasto común') || n.includes('supermercado') ||
             n.includes('smart visa') || n.includes('diferencial uf') || n.includes('michis') ||
             n.includes('aseo') || n.includes('waldorf') || c.includes('hogar') || c.includes('alimentación') || item.isCustom;
    }
