// Ventana de sueldos y horas extras.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ==============================================================
    // 1. GESTIÓN DEFINITIVA DE SALARIOS (DIEGO & SOLEDAD)
    // ==============================================================
    let currentSalaryModalTarget = 'Diego';

    async function openSalaryModal(target = 'Diego') {
      currentSalaryModalTarget = target;
      const modal = document.getElementById('modalSalary');
      if (modal) {
        modal.style.display = 'flex';
        renderSalaryModalContent();
      } else {
        // Fallback robusto en caso de que el modal no esté disponible en el DOM
        const currentVal = target === 'Diego' ? userProfile.diegoSalary : userProfile.soledadSalary;
        const promptVal = await pedirTexto(`Ingresa el sueldo líquido final de ${target} ($ CLP):`, currentVal);
        if (promptVal !== null) {
          const num = parseInt(promptVal.replace(/[^0-9]/g, ''), 10);
          if (num > 0) aplicarYGuardarSueldos(target, num);
        }
      }
    }

    function closeSalaryModal() {
      const modal = document.getElementById('modalSalary');
      if (modal) modal.style.display = 'none';
    }

    function switchSalaryModalTarget(target) {
      currentSalaryModalTarget = target;
      renderSalaryModalContent();
    }

    function renderSalaryModalContent() {
      const isDiego = currentSalaryModalTarget === 'Diego';
      const val = isDiego ? userProfile.diegoSalary : userProfile.soledadSalary;
      const titleEl = document.getElementById('salaryModalTitle');
      const labelEl = document.getElementById('salaryModalLabel');
      const inputEl = document.getElementById('salaryModalInput');
      const tabDiego = document.getElementById('salaryTabDiego');
      const tabSole = document.getElementById('salaryTabSole');

      if (titleEl) {
        titleEl.innerHTML = isDiego 
          ? '<span style="color:var(--accent-diego);">🔵 Sueldo Líquido de Diego</span>'
          : '<span style="color:var(--accent-soledad);">🟣 Sueldo Líquido de Soledad</span>';
      }
      if (labelEl) {
        labelEl.textContent = isDiego 
          ? 'Ingresa el monto final que te llegó a la cuenta bancaria (sueldo + horas extras):'
          : 'Ingresa el monto final que le llegó a Soledad a su cuenta bancaria:';
      }
      if (inputEl) {
        inputEl.value = val;
        setTimeout(() => { inputEl.focus(); inputEl.select(); }, 60);
      }
      if (tabDiego && tabSole) {
        tabDiego.classList.toggle('active', isDiego);
        tabSole.classList.toggle('active', !isDiego);
      }
    }

    function handleSalaryModalSave(e) {
      if (e) e.preventDefault();
      const inputEl = document.getElementById('salaryModalInput');
      const val = parseInt(inputEl.value, 10);
      if (!val || isNaN(val) || val <= 0) {
        alert('Por favor ingresa un monto válido (ejemplo: 1214038).');
        return;
      }
      aplicarYGuardarSueldos(currentSalaryModalTarget, val);
      closeSalaryModal();
    }

    function guardarSueldoDirecto(target) {
      const inputId = target === 'Diego' ? 'directDiegoSalaryInput' : 'directSoleSalaryInput';
      const inputEl = document.getElementById(inputId);
      if (!inputEl) return;
      const val = parseInt(inputEl.value, 10);
      if (!val || isNaN(val) || val <= 0) {
        alert('Por favor ingresa un monto válido.');
        return;
      }
      aplicarYGuardarSueldos(target, val);
    }

    // Función MAESTRA que sincroniza y guarda los sueldos en toda la app
    function aplicarYGuardarSueldos(target, val) {
      if (target === 'Diego') {
        userProfile.diegoSalary = val;
        userProfile.diegoBase = val;
        userProfile.diegoOvertime = 0;
        localStorage.setItem('diego_salary', val);
      } else {
        userProfile.soledadSalary = val;
        localStorage.setItem('soledad_salary', val);
      }

      // Guardar perfil completo en localStorage
      saveUserProfile();

      // Sincronizar todos los inputs y visualizadores en pantalla
      syncProfileToInputs();
      updateHeaderSalaries();
      renderAuditTable();
      if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
      if (typeof renderAnalisisMesActual === 'function') renderAnalisisMesActual();

      // Actualizar inputs directos en tab-cuentas
      const inDiego = document.getElementById('directDiegoSalaryInput');
      const inSole = document.getElementById('directSoleSalaryInput');
      if (inDiego) inDiego.value = userProfile.diegoSalary;
      if (inSole) inSole.value = userProfile.soledadSalary;

      // Recalcular componentes financieros
      renderAuditTable();
      renderChecklist();
      if (typeof updateDiegoColchonDisplay === 'function') updateDiegoColchonDisplay();
      if (typeof updateSoleMargenDisplay === 'function') updateSoleMargenDisplay();

      // Sincronizar gráficos
      if (chartAportes && chartAportes.data && chartAportes.data.datasets) {
        chartAportes.data.datasets[0].data = [userProfile.diegoSalary, userProfile.soledadSalary];
        chartAportes.update();
      }

      triggerAutoSyncToCloud();
      showToast(`✅ Sueldo de ${target} guardado definitivamente: ${formatCLP(val)}`);
    }

    function updateHeaderSalaries() {
      const diegoDisplay = document.getElementById('headerDiegoSalary');
      const soleDisplay = document.getElementById('headerSoledadSalary');
      const totalDisplay = document.getElementById('headerTotalSalary');
      const total = userProfile.diegoSalary + userProfile.soledadSalary;

      if (diegoDisplay) diegoDisplay.textContent = formatCLP(userProfile.diegoSalary);
      if (soleDisplay) soleDisplay.textContent = formatCLP(userProfile.soledadSalary);
      if (totalDisplay) totalDisplay.textContent = `💰 Total: ${formatCLP(total)}`;

      const cuentasDiego = document.getElementById('cuentasDiegoSalaryDisplay');
      const cuentasSole = document.getElementById('cuentasSoleSalaryDisplay');
      if (cuentasDiego) cuentasDiego.textContent = `${formatCLP(userProfile.diegoSalary)} / mes`;
      if (cuentasSole) cuentasSole.textContent = `${formatCLP(userProfile.soledadSalary)} / mes`;
    }
