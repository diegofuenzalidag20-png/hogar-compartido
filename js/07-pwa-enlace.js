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
      return {
        v: 3,
        timestamp: Date.now(),
        sender: (typeof userProfile !== 'undefined' && userProfile?.lastActiveUser) ? userProfile.lastActiveUser : 'Diego o Soledad',
        month: monthCode,
        activeMonth: activeMonthName,
        currentActiveMonth: activeMonthName,
        auditItems: parseSeguro(boletasMesActivo, currentAuditItems || []),
        expenses: expenses || [],
        userProfile: userProfile || {},
        customAuditItems: leerJSON('custom_audit_items', []),
        dbMeses: leerJSON('db_historial_meses', []),
        ultimoCierreBackup: leerJSON('ultimo_mes_cerrado_backup', null)
      };
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
    async function checkIncomingSync() {
      const hash = window.location.hash;
      if (!hash || !hash.startsWith('#sync=')) return;

      try {
        const raw = decodeURIComponent(hash.replace('#sync=', ''));
        const jsonStr = await decompressPayload(raw);
        const data = JSON.parse(jsonStr);

        if (!data) return;

        const expensesCount = Array.isArray(data.expenses) ? data.expenses.length : 0;
        const auditCount = Array.isArray(data.auditItems || data.items) ? (data.auditItems || data.items).length : 0;
        const hasProfile = !!data.userProfile;
        const month = data.month || data.activeMonth || document.getElementById('audit-month-select')?.value || '2026-10';

        const confirmMsg = `📲 ¡Se detectaron datos compartidos por tu pareja!\n\n` +
          `📅 Mes: ${month}\n` +
          `🧾 Boletas y gastos diarios: ${expensesCount}\n` +
          `📋 Cuentas fijas auditadas: ${auditCount}\n` +
          (hasProfile ? `💰 Sueldos de Diego y Soledad + Asignación de Cofres\n\n` : `\n`) +
          `¿Deseas cargar y sincronizar tu aplicación ahora?`;

        const confirmSync = await confirmar(confirmMsg, 'Cargar datos');
        if (!confirmSync) {
          history.replaceState(null, null, window.location.pathname);
          return;
        }

        // 1. Aplicar Audit Items
        const items = data.auditItems || data.items;
        if (Array.isArray(items)) {
          currentAuditItems = items;
          localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
          if (typeof renderAuditTable === 'function') renderAuditTable();
        }

        // 2. Aplicar Expenses (Gastos Diarios)
        if (Array.isArray(data.expenses)) {
          expenses = data.expenses;
          localStorage.setItem('family_expenses', JSON.stringify(expenses));
          localStorage.setItem('hogar_gastos', JSON.stringify(expenses));
          if (typeof renderExpensesTable === 'function') renderExpensesTable();
        }

        // 3. Aplicar Perfil de Sueldos y Cofres
        if (data.userProfile && typeof data.userProfile === 'object') {
          userProfile = Object.assign(userProfile || {}, data.userProfile);
          localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));
          if (userProfile.diegoSalary) localStorage.setItem('diego_salary', userProfile.diegoSalary);
          if (userProfile.soledadSalary) localStorage.setItem('soledad_salary', userProfile.soledadSalary);
          if (typeof updateHeaderSalaries === 'function') updateHeaderSalaries();
          if (typeof populateSalaryModalInputs === 'function') populateSalaryModalInputs();
        }

        // 4. Custom audit items
        if (Array.isArray(data.customAuditItems)) {
          localStorage.setItem('custom_audit_items', JSON.stringify(data.customAuditItems));
        }

        // 5. Historial de Meses
        if (Array.isArray(data.dbMeses)) {
          localStorage.setItem('db_historial_meses', JSON.stringify(data.dbMeses));
        }

        // Refrescar gráficos y análisis
        if (typeof initOrUpdateMonthAnalysis === 'function') initOrUpdateMonthAnalysis();
        if (typeof renderCardAnalysisSection === 'function') renderCardAnalysisSection();
        if (typeof renderDashboardCharts === 'function') renderDashboardCharts();

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
      a.download = `Respaldo_Finanzas_Diego_Soledad_${new Date().toISOString().slice(0,10)}.json`;
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
          const data = JSON.parse(event.target.result);
          if (!data) throw new Error('Archivo vacío');

          const month = data.month || data.activeMonth || document.getElementById('audit-month-select')?.value || '2026-10';

          // 1. Audit items
          const items = data.auditItems || data.items;
          if (Array.isArray(items)) {
            currentAuditItems = items;
            localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
            if (typeof renderAuditTable === 'function') renderAuditTable();
          }

          // 2. Expenses
          if (Array.isArray(data.expenses)) {
            expenses = data.expenses;
            localStorage.setItem('family_expenses', JSON.stringify(expenses));
            localStorage.setItem('hogar_gastos', JSON.stringify(expenses));
            if (typeof renderExpensesTable === 'function') renderExpensesTable();
          }

          // 3. User profile
          if (data.userProfile && typeof data.userProfile === 'object') {
            userProfile = Object.assign(userProfile || {}, data.userProfile);
            localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));
            if (userProfile.diegoSalary) localStorage.setItem('diego_salary', userProfile.diegoSalary);
            if (userProfile.soledadSalary) localStorage.setItem('soledad_salary', userProfile.soledadSalary);
            if (typeof updateHeaderSalaries === 'function') updateHeaderSalaries();
            if (typeof populateSalaryModalInputs === 'function') populateSalaryModalInputs();
          }

          // 4. Custom audit items
          if (Array.isArray(data.customAuditItems)) {
            localStorage.setItem('custom_audit_items', JSON.stringify(data.customAuditItems));
          }

          // 5. Historial
          if (Array.isArray(data.dbMeses || data.dbHistorial)) {
            localStorage.setItem('db_historial_meses', JSON.stringify(data.dbMeses || data.dbHistorial));
          }

          if (typeof initOrUpdateMonthAnalysis === 'function') initOrUpdateMonthAnalysis();
          if (typeof renderCardAnalysisSection === 'function') renderCardAnalysisSection();
          if (typeof renderDashboardCharts === 'function') renderDashboardCharts();

          closeSyncModal();
          showToast('✅ ¡Respaldo total restaurado con éxito!');
        } catch(err) {
          console.error(err);
          alert('El archivo no es válido o está dañado.');
        }
      };
      reader.readAsText(file);
    }
