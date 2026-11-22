// Instalar app, payload completo, enlace por WhatsApp y respaldo JSON.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    function triggerPwaInstall() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            showToast('🎉 ¡Instalando App en tu pantalla de inicio!');
          }
          deferredPrompt = null;
        });
      } else {
        document.getElementById('modalInstallPwa').style.display = 'flex';
      }
    }

    function closeInstallModal() {
      document.getElementById('modalInstallPwa').style.display = 'none';
    }

    // --- CONSTRUCTOR DE PAQUETE COMPLETO FAMILIAR (100% DE LA APP) ---
    function buildCompleteFamilyPayload() {
      const activeMonthName = typeof currentActiveMonth !== 'undefined' ? currentActiveMonth : (localStorage.getItem('app_active_month') || 'Noviembre 2026');
      const monthCode = typeof getMonthCode === 'function' ? getMonthCode(activeMonthName) : (document.getElementById('audit-month-select')?.value || 'Nov-26');
      const mesVisto = document.getElementById('audit-month-select')?.value;
      const boletasMesActivo = mesVisto && mesVisto !== monthCode ? localStorage.getItem(`audit_${monthCode}`) : null;
      // Una lista ilegible en el teléfono se omite (undefined): como lista vacía la combinación la tomaba por "borré todo"
      const lista = (clave) => { const v = leerJSON(clave, null); return Array.isArray(v) ? v : localStorage.getItem(clave) === null ? [] : undefined; };
      return {
        v: 3,
        timestamp: Date.now(),
        sender: (typeof userProfile !== 'undefined' && userProfile?.lastActiveUser) ? userProfile.lastActiveUser : 'Diego o Soledad',
        month: monthCode,
        activeMonth: activeMonthName,
        currentActiveMonth: activeMonthName,
        auditItems: parseSeguro(boletasMesActivo, currentAuditItems || []),
        expenses: seccionesIlegibles.has('expenses') ? undefined : expenses || [],
        traspasos: seccionesIlegibles.has('traspasos') ? undefined : traspasos || [],
        userProfile: userProfile || {},
        customAuditItems: lista('custom_audit_items'),
        dbMeses: lista('db_historial_meses'),
        ultimoCierreBackup: leerJSON('ultimo_mes_cerrado_backup', null)
      };
    }

    // ---------- Datos que llegan de fuera (nube, enlace, archivo, respaldo) ----------
    // Corrige lo que se puede (texto muy largo, monto escrito como texto, gasto sin id) y descarta lo que no se
    // puede mostrar ni sumar. Si descarta algo, avisa una vez por sesión.
    const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/;
    const RE_ID_SEGURO = /^[\w-]{1,80}$/;
    let avisoDatosDescartados = false;
    // Id estable (igual en los dos teléfonos) para gastos antiguos que no tenían: dos ids distintos los duplicaban al combinar
    function conIdsGasto(lista, prefijo = 'exp-leg') {
      if (!lista.some(g => g.id == null || g.id === '')) return lista;
      const usados = new Set(lista.map(g => g.id).filter(Boolean));
      return lista.map(g => {
        if (g.id != null && g.id !== '') return g;
        const texto = JSON.stringify([g.date, g.amount, g.desc, g.payer, g.account, g.category, g.from, g.to]);
        let h = 0;
        for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
        let id = `${prefijo}-${(h >>> 0).toString(36)}`;
        for (let n = 2; usados.has(id); n++) id = `${prefijo}-${(h >>> 0).toString(36)}-${n}`;
        usados.add(id);
        return { ...g, id };
      });
    }
    function sanearEstado(data) {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
      let descartados = 0;
      const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
      const texto = (v) => v == null ? v : String(v).slice(0, 200);
      const finito = (v) => (v === '' || v == null || !Number.isFinite(Number(v))) ? NaN : Number(v);
      const lista = (v, limpiar) => {
        if (!Array.isArray(v)) return v;
        const out = [];
        for (const x of v) { const y = esObjeto(x) ? limpiar({ ...x }) : null; if (y) out.push(y); else descartados++; }
        return out;
      };
      const movimiento = (campos) => (m) => {
        m.amount = finito(m.amount);
        if (typeof m.date !== 'string' || !RE_FECHA.test(m.date) || Number.isNaN(m.amount)) return null;
        for (const k of ['id', ...campos]) if (m[k] != null) m[k] = texto(m[k]);
        return m;
      };
      const gasto = movimiento(['desc', 'category', 'account', 'payer', 'lugar', 'auditId']);
      const traspaso = movimiento(['from', 'to', 'desc', 'autor']);
      const item = (it) => {
        if (typeof it.id !== 'string' || !RE_ID_SEGURO.test(it.id)) return null;
        it.name = texto(it.name ?? '');
        for (const k of ['resp', 'cuenta', 'cat']) if (it[k] != null) it[k] = texto(it[k]);
        for (const k of ['base', 'actual']) it[k] = Number.isNaN(finito(it[k])) ? 0 : finito(it[k]);
        return it;
      };
      const NUMEROS_MES = ['diegoSal', 'soleSal', 'totalIng', 'gastosHogar', 'fijosDiego', 'superavit'];
      const mes = (m) => {
        if (typeof m.nombre !== 'string' || !m.nombre.trim()) return null;
        for (const k of ['nombre', 'id', 'code', 'estado', 'criterio', 'fecha']) if (m[k] != null) m[k] = texto(m[k]);
        for (const k of NUMEROS_MES) if (k in m) m[k] = Number.isNaN(finito(m[k])) ? 0 : finito(m[k]);
        if ('items' in m) m.items = Array.isArray(m.items) ? lista(m.items, item) : [];
        if ('gastosDiarios' in m) m.gastosDiarios = Array.isArray(m.gastosDiarios) ? lista(m.gastosDiarios, gasto) : [];
        if ('traspasos' in m) m.traspasos = Array.isArray(m.traspasos) ? lista(m.traspasos, traspaso) : [];
        if ('rawItems' in m && !esObjeto(m.rawItems)) m.rawItems = {};
        return m;
      };
      // Los números del perfil (sueldos, cofres, remanentes) deben ser finitos: un NaN contagia todos los saldos
      const numerosFinitos = (o) => { for (const k in o) { if (typeof o[k] === 'number' && !Number.isFinite(o[k])) o[k] = 0; else if (esObjeto(o[k])) o[k] = numerosFinitos({ ...o[k] }); } return o; };
      const d = { ...data };
      for (const k of ['month', 'activeMonth', 'currentActiveMonth']) if (k in d) d[k] = typeof d[k] === 'string' ? texto(d[k]) : undefined;
      if (Array.isArray(d.expenses)) d.expenses = conIdsGasto(lista(d.expenses, gasto));
      if (Array.isArray(d.traspasos)) d.traspasos = conIdsGasto(lista(d.traspasos, traspaso), 'tr-leg');
      d.auditItems = lista(d.auditItems, item);
      d.customAuditItems = lista(d.customAuditItems, item);
      d.dbMeses = lista(d.dbMeses, mes);
      if ('userProfile' in d) d.userProfile = esObjeto(d.userProfile) ? numerosFinitos({ ...d.userProfile }) : undefined;
      if (esObjeto(d.ultimoCierreBackup)) {
        const b = d.ultimoCierreBackup = { ...d.ultimoCierreBackup };
        if (typeof b.closedMonth !== 'string' || !Array.isArray(b.expenses) || !Array.isArray(b.currentAuditItems)) { d.ultimoCierreBackup = null; descartados++; }
        else {
          b.expenses = conIdsGasto(lista(b.expenses, gasto));
          b.currentAuditItems = lista(b.currentAuditItems, item);
          if (Array.isArray(b.traspasos)) b.traspasos = lista(b.traspasos, traspaso);
          if (esObjeto(b.userProfile)) b.userProfile = numerosFinitos({ ...b.userProfile });
          for (const k of ['closedMonth', 'nextMonth']) if (b[k] != null) b[k] = texto(b[k]);
        }
      } else if ('ultimoCierreBackup' in d && d.ultimoCierreBackup != null) { d.ultimoCierreBackup = null; descartados++; }
      if (descartados && !avisoDatosDescartados) {
        avisoDatosDescartados = true;
        setTimeout(() => avisar(`⚠️ Se descartaron ${descartados} ${descartados === 1 ? 'registro' : 'registros'} con datos inválidos (fecha, monto o identificador ilegible). El resto se cargó normalmente.`));
      }
      return d;
    }

    // --- COMPRESIÓN Y DESCOMPRESIÓN GZIP / BASE64 ---
    async function compressPayload(jsonStr) {
      if (typeof CompressionStream !== 'undefined') {
        try {
          const stream = new Blob([new TextEncoder().encode(jsonStr)]).stream();
          const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));
          const response = new Response(compressedStream);
          const buffer = await response.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const chunk = 8192;
          for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
          }
          return 'z:' + btoa(binary);
        } catch(e) {
          console.warn('Fallo compresión GZIP, usando Base64 estándar:', e);
        }
      }
      return btoa(unescape(encodeURIComponent(jsonStr)));
    }

    async function decompressPayload(raw) {
      if (raw.startsWith('z:')) {
        const b64Data = raw.slice(2);
        const binary = atob(b64Data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        if (typeof DecompressionStream !== 'undefined') {
          const stream = new Blob([bytes]).stream();
          const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));
          const response = new Response(decompressedStream);
          return await response.text();
        }
      }
      return decodeURIComponent(escape(atob(raw)));
    }

    // --- ENLACE MÁGICO WHATSAPP (1 CLIC CON 100% DE DATOS) ---
    async function generateMagicWhatsAppLink() {
      const payload = buildCompleteFamilyPayload();
      const jsonStr = JSON.stringify(payload);
      const encoded = encodeURIComponent(await compressPayload(jsonStr));
      const shareUrl = window.location.origin + window.location.pathname + '#sync=' + encoded;

      const expenseCount = payload.expenses.length;
      const whatsappText = `🏡 *Finanzas Compartidas Diego & Soledad*\n` +
        `Actualicé las finanzas del mes (${payload.month}):\n` +
        `• ${expenseCount} boletas y gastos diarios\n` +
        `• Sueldos y asignación de cofres\n` +
        `• Estado de cuentas fijas y dividendo\n\n` +
        `👉 Toca este enlace para sincronizar en tu celular al instante:\n${shareUrl}`;

      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('📲 ¡Enlace comprimido copiado! Listo para WhatsApp');
          closeSyncModal();
        }).catch(() => {
          pedirTexto('Copia este enlace para enviarlo por WhatsApp:', shareUrl);
        });
      } else {
        pedirTexto('Copia este enlace para enviarlo por WhatsApp:', shareUrl);
      }
    }

    // --- DETECCIÓN Y RESTAURACIÓN DEL ENLACE MÁGICO AL CARGAR ---
    // Enlaces y archivos antiguos traían las boletas como "items" y el historial como "dbHistorial"
    function datosImportados(data) {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
      return sanearEstado({ ...data, auditItems: data.auditItems || data.items, dbMeses: data.dbMeses || data.dbHistorial });
    }

    async function checkIncomingSync() {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#sync=')) return;

      try {
        const raw = decodeURIComponent(hash.replace('#sync=', ''));
        const jsonStr = await decompressPayload(raw);
        const data = datosImportados(JSON.parse(jsonStr));

        if (!data) return;
        if (versionBloqueada) { avisarVersionAntigua(); return; }

        const expensesCount = Array.isArray(data.expenses) ? data.expenses.length : 0;
        const auditCount = Array.isArray(data.auditItems) ? data.auditItems.length : 0;
        const hasProfile = !!data.userProfile;
        const month = data.month || data.activeMonth || document.getElementById('audit-month-select')?.value || '2026-10';

        const confirmMsg = `📲 ¡Se detectaron datos compartidos por tu pareja!\n\n` +
          `📅 Mes: ${month}\n` +
          `🧾 Boletas y gastos diarios: ${expensesCount}\n` +
          `📋 Cuentas fijas auditadas: ${auditCount}\n` +
          (hasProfile ? `💰 Sueldos de Diego y Soledad + Asignación de Cofres\n\n` : `\n`) +
          (Array.isArray(data.expenses) ? `⚠️ Esto reemplazará tus ${expenses.length} gastos actuales.\n\n` : '') +
          `¿Deseas cargar y sincronizar tu aplicación ahora?`;

        const confirmSync = await confirmar(confirmMsg, 'Cargar datos');
        if (!confirmSync) {
          history.replaceState(null, null, window.location.pathname);
          return;
        }

        applyRemoteDataToApp(data);
        history.replaceState(null, null, window.location.pathname);
        showToast(`✅ ¡Sincronización completa! Se actualizaron ${expensesCount} boletas y los sueldos.`);
      } catch (err) {
        console.error('Error al decodificar sync data:', err);
        alert('Hubo un problema al leer los datos del enlace. Asegúrate de copiar el enlace completo.');
      }
    }

    // --- RESPALDO JSON LOCAL COMPLETO ---
    function exportJsonBackup() {
      const payload = buildCompleteFamilyPayload();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Respaldo_Finanzas_Diego_Soledad_${getLocalDateISO()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('📥 Copia de respaldo completa descargada (.json)');
    }

    function importJsonBackup(e) {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = datosImportados(JSON.parse(event.target.result));
          if (!data) throw new Error('Archivo vacío');
          if (versionBloqueada) { avisarVersionAntigua(); return; }
          applyRemoteDataToApp(data);
          closeSyncModal();
          showToast('✅ ¡Respaldo total restaurado con éxito!');
        } catch(err) {
          console.error(err);
          alert('El archivo no es válido o está dañado.');
        }
      };
      reader.readAsText(file);
    }
