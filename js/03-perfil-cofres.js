// Perfil (PERFIL_INICIAL, userProfile), sueldos en línea, cofres de Diego y Soledad y Smart Visa.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // --- GESTIÓN DINÁMICA DE SALARIOS (HORAS EXTRAS) & COFRES ---
    // Valores de partida de una instalación nueva; las cifras reales viven en la nube
    const PERFIL_INICIAL = Object.freeze({
      diegoSalary: 1214038,
      diegoBase: 1214038,
      diegoOvertime: 0,
      soledadSalary: 875000,
      cofresDiego: {
        fanFijos: 609360,
        tenpoHuasco: 300000,
        machBolsillo: 140000,
        mpAhorro: 130000
      },
      cofresSoledad: {
        chequeraHogar: 236000,
        smartVisa: 50000,
        tenpoBolsillo: 150000,
        mpAhorro: 150000,
        bancoReserva: 150000
      },
      remanentes: {
        mpDiego: 0,
        mpSoledad: 0,
        bancoSole: 0,
        tenpoDiego: 0,
        machDiego: 0,
        tenpoSoledad: 0,
        fanDiego: 0,
        chequeraSole: 0
      },
      smartVisaConfig: {
        cupoTotal: 500000,
        deudaPrevia: 0,
        cuotaMes: 50000
      }
    });
    let userProfile = JSON.parse(JSON.stringify(PERFIL_INICIAL));

    function loadUserProfile() {
      const saved = localStorage.getItem('finanzas_user_profile');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          userProfile = {
            ...userProfile,
            ...parsed,
            cofresDiego: { ...userProfile.cofresDiego, ...(parsed.cofresDiego || {}) },
            cofresSoledad: { ...userProfile.cofresSoledad, ...(parsed.cofresSoledad || {}) },
            remanentes: { ...userProfile.remanentes, ...(parsed.remanentes || {}) },
            smartVisaConfig: { ...userProfile.smartVisaConfig, ...(parsed.smartVisaConfig || {}) }
          };
        } catch(e) {}
      }
      const savedDiego = localStorage.getItem('diego_salary');
      if (savedDiego) userProfile.diegoSalary = parseInt(savedDiego, 10);
      const savedSole = localStorage.getItem('soledad_salary');
      if (savedSole) userProfile.soledadSalary = parseInt(savedSole, 10);

      syncProfileToInputs();
    }

    function saveUserProfile() {
      localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));
      triggerAutoSyncToCloud();
    }

    // Auto-recuperación de remanentes si se cerró mes previamente pero los remanentes estaban en 0
    // Sincronización bidireccional permanente de sueldos, paneles, cofres y KPIs
    function syncProfileToInputs() {
      const diegoSal = userProfile.diegoSalary;
      const soleSal = userProfile.soledadSalary;
      const totalSal = diegoSal + soleSal;

      // 1. Header pills
      const elDiegoHeader = document.getElementById('headerDiegoSalary');
      const elSoleHeader = document.getElementById('headerSoledadSalary');
      const elTotalHeader = document.getElementById('headerTotalSalary');
      if (elDiegoHeader) elDiegoHeader.textContent = formatCLP(diegoSal);
      if (elSoleHeader) elSoleHeader.textContent = formatCLP(soleSal);
      if (elTotalHeader) elTotalHeader.textContent = `💰 Total: ${formatCLP(totalSal)}`;

      // 2. Paneles Personales inline en tab-auditoria (Control Mensual)
      const inDiegoInline = document.getElementById('diegoSalaryInlineInput');
      const inSoleInline = document.getElementById('soleSalaryInlineInput');
      if (inDiegoInline) inDiegoInline.value = diegoSal;
      if (inSoleInline) inSoleInline.value = soleSal;

      // 3. Badges y entradas en tab-cuentas
      const elDiegoSalDisplay = document.getElementById('cuentasDiegoSalaryDisplay');
      const elSoleSalDisplay = document.getElementById('cuentasSoleSalaryDisplay');
      if (elDiegoSalDisplay) elDiegoSalDisplay.textContent = `${formatCLP(diegoSal)} / mes`;
      const elTotalCuentas = document.getElementById('cuentasTotalSalaryDisplay');
      if (elTotalCuentas) elTotalCuentas.textContent = formatCLP(totalSal);
      if (elSoleSalDisplay) elSoleSalDisplay.textContent = `${formatCLP(soleSal)} / mes`;

      const inDiego = document.getElementById('directDiegoSalaryInput');
      const inSole = document.getElementById('directSoleSalaryInput');
      if (inDiego) inDiego.value = diegoSal;
      if (inSole) inSole.value = soleSal;

      // 4. Inputs de Cofres Diego
      const elTenpo = document.getElementById('inputCofreTenpo');
      const elMach = document.getElementById('inputCofreMach');
      const elMP = document.getElementById('inputCofreMP');

      if (elTenpo) elTenpo.value = userProfile.cofresDiego?.tenpoHuasco ?? PERFIL_INICIAL.cofresDiego.tenpoHuasco;
      if (elMach) elMach.value = getMachSemanal().monto;
      if (elMP) elMP.value = userProfile.cofresDiego?.mpAhorro ?? PERFIL_INICIAL.cofresDiego.mpAhorro;

      // 4b. Inputs de Remanentes Diego
      const inRemTenpoD = document.getElementById('inputRemanenteTenpoDiego');
      if (inRemTenpoD) inRemTenpoD.value = userProfile.remanentes?.tenpoDiego ?? 0;

      const inRemMachD = document.getElementById('inputRemanenteMachDiego');
      if (inRemMachD) inRemMachD.value = userProfile.remanentes?.machDiego ?? 0;

      const inRemDiegoMP = document.getElementById('inputRemanenteMPDiego');
      if (inRemDiegoMP) inRemDiegoMP.value = userProfile.remanentes?.mpDiego ?? 0;

      // 5. Inputs de Cofres Soledad
      const elSoleSmart = document.getElementById('inputCofreSoleSmart');
      const elSoleTenpo = document.getElementById('inputCofreSoleTenpo');
      const elSoleMP = document.getElementById('inputCofreSoleMP');
      const elSoleBanco = document.getElementById('inputCofreSoleBanco');

      if (elSoleSmart) elSoleSmart.value = userProfile.cofresSoledad?.smartVisa ?? PERFIL_INICIAL.cofresSoledad.smartVisa;
      if (elSoleTenpo) elSoleTenpo.value = userProfile.cofresSoledad?.tenpoBolsillo ?? PERFIL_INICIAL.cofresSoledad.tenpoBolsillo;
      if (elSoleMP) elSoleMP.value = userProfile.cofresSoledad?.mpAhorro ?? PERFIL_INICIAL.cofresSoledad.mpAhorro;
      if (elSoleBanco) elSoleBanco.value = userProfile.cofresSoledad?.bancoReserva ?? PERFIL_INICIAL.cofresSoledad.bancoReserva;

      // 5b. Inputs de Remanentes Soledad
      const inRemTenpoS = document.getElementById('inputRemanenteTenpoSole');
      if (inRemTenpoS) inRemTenpoS.value = userProfile.remanentes?.tenpoSoledad ?? 0;

      const inRemSoleMP = document.getElementById('inputRemanenteMPSole');
      if (inRemSoleMP) inRemSoleMP.value = userProfile.remanentes?.mpSoledad ?? 0;

      const inRemSoleBanco = document.getElementById('inputRemanenteBancoSole');
      if (inRemSoleBanco) inRemSoleBanco.value = userProfile.remanentes?.bancoSole ?? 0;

      const inSmartCupo = document.getElementById('inputSmartVisaCupo');
      if (inSmartCupo) inSmartCupo.value = userProfile.smartVisaConfig?.cupoTotal ?? PERFIL_INICIAL.smartVisaConfig.cupoTotal;

      const inSmartDeuda = document.getElementById('inputSmartVisaDeudaPrevia');
      if (inSmartDeuda) inSmartDeuda.value = userProfile.smartVisaConfig?.deudaPrevia ?? 0;

      // 6. Actualizar KPIs del Dashboard Resumen
      const dashIngTotal = document.getElementById('dashKpiIngresosTotal');
      const dashIngSub = document.getElementById('dashKpiIngresosSub');
      if (dashIngTotal) dashIngTotal.textContent = formatCLP(totalSal);
      if (dashIngSub) {
        const dPct = totalSal > 0 ? ((diegoSal / totalSal) * 100).toFixed(1) : '50.0';
        const sPct = totalSal > 0 ? (100 - parseFloat(dPct)).toFixed(1) : '50.0';
        dashIngSub.textContent = `Diego: ${formatCLP(diegoSal)} (${dPct}%) | Soledad: ${formatCLP(soleSal)} (${sPct}%)`;
      }

      // Cálculos para KPIs 3, 4, 5
      const metaMensual = getMetaMensual();
      const diegoOxigenoEst = getCuentaPrincipalDisponible('Diego');
      const soleMargenEst = getCuentaPrincipalDisponible('Soledad');
      const superavitEst = totalSal - metaMensual;
      const dashGastos = document.getElementById('dashKpiGastosTotal');
      if (dashGastos) dashGastos.textContent = formatCLP(metaMensual);
      const superavitPct = totalSal > 0 ? ((superavitEst / totalSal) * 100).toFixed(1) : '0';

      const dashSup = document.getElementById('dashKpiSuperavit');
      const dashSupSub = document.getElementById('dashKpiSuperavitSub');
      if (dashSup) dashSup.textContent = (superavitEst >= 0 ? '+' : '-') + formatCLP(Math.abs(superavitEst));
      if (dashSupSub) dashSupSub.textContent = `${superavitPct}% de tasa de ahorro libre del hogar`;

      const dashOxi = document.getElementById('dashKpiOxigenoDiego');
      if (dashOxi) dashOxi.textContent = (diegoOxigenoEst >= 0 ? '+' : '-') + formatCLP(Math.abs(diegoOxigenoEst));

      const dashSoleM = document.getElementById('dashKpiMargenSoledad');
      const dashSoleMSub = document.getElementById('dashKpiMargenSoledadSub');
      if (dashSoleM) dashSoleM.textContent = (soleMargenEst >= 0 ? '+' : '-') + formatCLP(Math.abs(soleMargenEst));
      if (dashSoleMSub) dashSoleMSub.textContent = 'Fondos de la Chequera menos gastos registrados';

      // 7. Auto-cálculo de Remanentes (Cuenta Fan & Chequera Electrónica) y Tarjetas
      updateDiegoColchonDisplay();
      updateSoleMargenDisplay();
      updateSmartVisaDisplay();
    }

    function updateDiegoColchonDisplay() {
      const salary = userProfile.diegoSalary || PERFIL_INICIAL.diegoSalary;
      const tenpo = parseInt(document.getElementById('inputCofreTenpo')?.value, 10) || 0;
      const mp = parseInt(document.getElementById('inputCofreMP')?.value, 10) || 0;
      const montoMach = readMoney('inputCofreMach', userProfile.machSemanal?.monto ?? 35000);
      if (montoMach !== (userProfile.machSemanal?.monto ?? 35000)) userProfile.machSemanal = { ...(userProfile.machSemanal || {}), monto: montoMach };
      const machPlan = getMachSemanal(tenpo, mp);
      const mach = machPlan.liberado;
      const remTenpo = parseInt(document.getElementById('inputRemanenteTenpoDiego')?.value, 10) || 0;
      const remMach = parseInt(document.getElementById('inputRemanenteMachDiego')?.value, 10) || 0;
      const remMP = parseInt(document.getElementById('inputRemanenteMPDiego')?.value, 10) || 0;

      const totalTransferencias = tenpo + mach + mp;
      // Remanente en Cuenta Fan = Sueldo - Transferencias a Tenpo, Mach y MP
      const remanenteFan = Math.max(0, salary - totalTransferencias);

      const elFan = document.getElementById('inputCofreFan');
      if (elFan) {
        elFan.value = remanenteFan;
      }
      userProfile.cofresDiego = userProfile.cofresDiego || {};
      userProfile.cofresDiego.fanFijos = remanenteFan;
      userProfile.cofresDiego.tenpoHuasco = tenpo;
      userProfile.cofresDiego.machBolsillo = mach;
      userProfile.cofresDiego.mpAhorro = mp;

      userProfile.remanentes = userProfile.remanentes || {};
      userProfile.remanentes.tenpoDiego = remTenpo;
      userProfile.remanentes.machDiego = remMach;
      userProfile.remanentes.mpDiego = remMP;

      // Actualizar displays en tab-cuentas
      const elDispTenpo = document.getElementById('displayTotalFondosTenpoDiego');
      if (elDispTenpo) elDispTenpo.textContent = formatCLP(remTenpo + tenpo);

      const elDispMach = document.getElementById('displayTotalFondosMachDiego');
      if (elDispMach) elDispMach.textContent = formatCLP(remMach + mach + machPlan.ajuste - machPlan.gastado);
      renderMachSemanal(machPlan);
      sincronizarItemMach(machPlan);

      const elDispMP = document.getElementById('displayTotalAcumuladoMPDiego');
      if (elDispMP) elDispMP.textContent = formatCLP(remMP + mp);

      const elDesc = document.getElementById('diegoFanFormulaDesc');
      if (elDesc) {
        elDesc.innerHTML = `🔁 <strong>Transferido a cofres secundarios:</strong> -${formatCLP(totalTransferencias)} (Tenpo: ${formatCLP(tenpo)}, Mach: ${formatCLP(mach)}, MP: ${formatCLP(mp)})<br>💰 <strong>Saldo disponible restante en Cuenta Fan:</strong> <strong style="color:#60A5FA;">${formatCLP(remanenteFan)}</strong>${overAssignWarning(totalTransferencias, salary)}`;
      }

      const colchon = getCuentaPrincipalDisponible('Diego');

      const elColchon = document.getElementById('diegoColchonCuentasDisplay');
      if (elColchon) {
        elColchon.textContent = (colchon >= 0 ? '+' : '-') + formatCLP(Math.abs(colchon));
        elColchon.style.color = colchon >= 0 ? '#10B981' : '#F43F5E';
      }

      // Auto-guardado en localStorage silencioso
      localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));

      if (typeof updateChartsWithNewSalary === 'function') updateChartsWithNewSalary();
    }

    // CÁLCULO AUTOMÁTICO EN TIEMPO REAL: REMANENTE CHEQUERA & SALDO LIBRE SOLEDAD
    function updateSoleMargenDisplay() {
      const salary = userProfile.soledadSalary || PERFIL_INICIAL.soledadSalary;
      const smart = parseInt(document.getElementById('inputCofreSoleSmart')?.value, 10) || 0;
      const tenpo = parseInt(document.getElementById('inputCofreSoleTenpo')?.value, 10) || 0;
      const mp = parseInt(document.getElementById('inputCofreSoleMP')?.value, 10) || 0;
      const banco = parseInt(document.getElementById('inputCofreSoleBanco')?.value, 10) || 0;
      const remTenpo = parseInt(document.getElementById('inputRemanenteTenpoSole')?.value, 10) || 0;
      const remMP = parseInt(document.getElementById('inputRemanenteMPSole')?.value, 10) || 0;
      const remBanco = parseInt(document.getElementById('inputRemanenteBancoSole')?.value, 10) || 0;

      // Smart Visa cuota ES parte de las transferencias desde Chequera
      const smartReserva = getSmartReservaChequera(smart);
      const totalTransferencias = tenpo + mp + banco + smartReserva;
      const remanenteChequera = Math.max(0, salary - totalTransferencias);

      const elCheq = document.getElementById('inputCofreSoleChequera');
      if (elCheq) {
        elCheq.value = remanenteChequera;
      }
      userProfile.cofresSoledad = userProfile.cofresSoledad || {};
      userProfile.cofresSoledad.chequeraHogar = remanenteChequera;
      userProfile.cofresSoledad.smartVisa = smart;
      userProfile.cofresSoledad.tenpoBolsillo = tenpo;
      userProfile.cofresSoledad.mpAhorro = mp;
      userProfile.cofresSoledad.bancoReserva = banco;

      userProfile.remanentes = userProfile.remanentes || {};
      userProfile.remanentes.tenpoSoledad = remTenpo;
      userProfile.remanentes.mpSoledad = remMP;
      userProfile.remanentes.bancoSole = remBanco;

      // Actualizar displays en tab-cuentas
      const elDispTenpo = document.getElementById('displayTotalFondosTenpoSole');
      if (elDispTenpo) elDispTenpo.textContent = formatCLP(remTenpo + tenpo);

      const elDispMP = document.getElementById('displayTotalAcumuladoMPSole');
      if (elDispMP) elDispMP.textContent = formatCLP(remMP + mp);

      const elDispBanco = document.getElementById('displayTotalAcumuladoBancoSole');
      if (elDispBanco) elDispBanco.textContent = formatCLP(remBanco + banco);

      const elDesc = document.getElementById('soleChequeraFormulaDesc');
      if (elDesc) {
        elDesc.innerHTML = `🔁 <strong>Transferido a cofres secundarios:</strong> -${formatCLP(totalTransferencias)} (Tenpo: ${formatCLP(tenpo)}, MP: ${formatCLP(mp)}, Reserva: ${formatCLP(banco)}, Smart Visa: ${formatCLP(smartReserva)})<br>💰 <strong>Saldo disponible restante en Chequera:</strong> <strong style="color:#C084FC;">${formatCLP(remanenteChequera)}</strong>${overAssignWarning(totalTransferencias, salary)}`;
      }

      const remanenteLibre = getCuentaPrincipalDisponible('Soledad');

      const elMargen = document.getElementById('soleMargenCuentasDisplay');
      if (elMargen) {
        elMargen.textContent = (remanenteLibre >= 0 ? '+' : '-') + formatCLP(Math.abs(remanenteLibre));
        elMargen.style.color = remanenteLibre >= 0 ? '#10B981' : '#F43F5E';
      }

      // Auto-guardado en localStorage silencioso
      localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));

      if (typeof updateChartsWithNewSalary === 'function') updateChartsWithNewSalary();
    }

    // CÁLCULO Y CONTROL EN TIEMPO REAL: TARJETA SMART VISA (BANCOESTADO)
    function updateSmartVisaDisplay() {
      const cupo = readMoney('inputSmartVisaCupo', userProfile.smartVisaConfig?.cupoTotal ?? PERFIL_INICIAL.smartVisaConfig.cupoTotal);
      const cuota = readMoney('inputCofreSoleSmart', userProfile.cofresSoledad?.smartVisa ?? 0);
      const deudaPrevia = readMoney('inputSmartVisaDeudaPrevia', userProfile.smartVisaConfig?.deudaPrevia ?? 0);

      // Calcular compras de este mes con Smart Visa en vivo desde expenses
      let comprasMes = 0;
      if (Array.isArray(expenses)) {
        expenses.forEach(item => {
          if (normalizeAccountKey(item.account) === 'smartVisaSole') {
            comprasMes += Number(item.amount) || 0;
          }
        });
      }

      const deudaActual = Math.max(0, deudaPrevia + comprasMes - getSmartCuotaDelMes(cuota));
      const cupoDisponible = Math.max(0, cupo - deudaActual);

      userProfile.smartVisaConfig = {
        cupoTotal: cupo,
        deudaPrevia: deudaPrevia,
        cuotaMes: cuota
      };

      const elCompras = document.getElementById('displaySmartVisaGastosMes');
      if (elCompras) elCompras.textContent = formatCLP(comprasMes);

      const elDeuda = document.getElementById('displaySmartVisaDeudaActual');
      if (elDeuda) elDeuda.textContent = formatCLP(deudaActual);

      const elCupoDisp = document.getElementById('displaySmartVisaCupoDisponible');
      if (elCupoDisp) elCupoDisp.textContent = formatCLP(cupoDisponible);

      localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));
    }

    // Modificación de sueldo en vivo al teclear en las casillas de tab-cuentas
    function onDirectSalaryLiveChange(target, valStr) {
      const val = parseInt(valStr, 10);
      if (isNaN(val) || val <= 0) return;

      if (target === 'Diego') {
        userProfile.diegoSalary = val;
        userProfile.diegoBase = val;
        userProfile.diegoOvertime = 0;
        localStorage.setItem('diego_salary', val);
        const elH = document.getElementById('headerDiegoSalary');
        if (elH) elH.textContent = formatCLP(val);
        const elD = document.getElementById('cuentasDiegoSalaryDisplay');
        if (elD) elD.textContent = `${formatCLP(val)} / mes`;
        updateDiegoColchonDisplay();
      } else {
        userProfile.soledadSalary = val;
        localStorage.setItem('soledad_salary', val);
        const elH = document.getElementById('headerSoledadSalary');
        if (elH) elH.textContent = formatCLP(val);
        const elD = document.getElementById('cuentasSoleSalaryDisplay');
        if (elD) elD.textContent = `${formatCLP(val)} / mes`;
        updateSoleMargenDisplay();
      }
      document.getElementById('cuentasTotalSalaryDisplay').textContent = formatCLP(userProfile.diegoSalary + userProfile.soledadSalary);
    }

    function saveDiegoCofres() {
      const salary = userProfile.diegoSalary || PERFIL_INICIAL.diegoSalary;
      const tenpo = readMoney('inputCofreTenpo', userProfile.cofresDiego?.tenpoHuasco ?? 0);
      const mp = readMoney('inputCofreMP', userProfile.cofresDiego?.mpAhorro ?? 0);
      const montoMach = readMoney('inputCofreMach', userProfile.machSemanal?.monto ?? 35000);
      if (montoMach !== (userProfile.machSemanal?.monto ?? 35000)) userProfile.machSemanal = { ...(userProfile.machSemanal || {}), monto: montoMach };
      const mach = getMachSemanal(tenpo, mp).liberado;
      const fan = Math.max(0, salary - (tenpo + mach + mp));

      const remanenteTenpo = parseInt(document.getElementById('inputRemanenteTenpoDiego')?.value, 10) || 0;
      const remanenteMach = parseInt(document.getElementById('inputRemanenteMachDiego')?.value, 10) || 0;
      const remanenteMP = parseInt(document.getElementById('inputRemanenteMPDiego')?.value, 10) || 0;

      userProfile.cofresDiego = { fanFijos: fan, tenpoHuasco: tenpo, machBolsillo: mach, mpAhorro: mp };
      userProfile.remanentes = userProfile.remanentes || {};
      userProfile.remanentes.tenpoDiego = remanenteTenpo;
      userProfile.remanentes.machDiego = remanenteMach;
      userProfile.remanentes.mpDiego = remanenteMP;

      // Sincronizar en la tabla de boletas

      const itemMP = currentAuditItems.find(it => it.name.includes('Mercado Pago') || it.id === 'item-16');
      if (itemMP) { itemMP.base = mp; itemMP.actual = mp; }

      saveUserProfile();
      renderAuditTable();
      updateChartsWithNewSalary();
      showToast(`💾 ¡Cofres de Diego guardados! Remanente Cuenta Fan: ${formatCLP(fan)}`);
    }

    function saveSoleCofres() {
      const salary = userProfile.soledadSalary || PERFIL_INICIAL.soledadSalary;
      const smart = readMoney('inputCofreSoleSmart', userProfile.cofresSoledad?.smartVisa ?? 0);
      const tenpo = readMoney('inputCofreSoleTenpo', userProfile.cofresSoledad?.tenpoBolsillo ?? 0);
      const mp = readMoney('inputCofreSoleMP', userProfile.cofresSoledad?.mpAhorro ?? 0);
      const banco = readMoney('inputCofreSoleBanco', userProfile.cofresSoledad?.bancoReserva ?? 0);
      const chequera = Math.max(0, salary - (tenpo + mp + banco + getSmartReservaChequera(smart)));

      const remanenteTenpo = parseInt(document.getElementById('inputRemanenteTenpoSole')?.value, 10) || 0;
      const remanenteMPSole = parseInt(document.getElementById('inputRemanenteMPSole')?.value, 10) || 0;
      const remanenteBancoSole = parseInt(document.getElementById('inputRemanenteBancoSole')?.value, 10) || 0;
      const cupoSmart = readMoney('inputSmartVisaCupo', userProfile.smartVisaConfig?.cupoTotal ?? PERFIL_INICIAL.smartVisaConfig.cupoTotal);
      const deudaSmart = parseInt(document.getElementById('inputSmartVisaDeudaPrevia')?.value, 10) || 0;

      userProfile.cofresSoledad = {
        chequeraHogar: chequera,
        smartVisa: smart,
        tenpoBolsillo: tenpo,
        mpAhorro: mp,
        bancoReserva: banco
      };
      userProfile.remanentes = userProfile.remanentes || {};
      userProfile.remanentes.tenpoSoledad = remanenteTenpo;
      userProfile.remanentes.mpSoledad = remanenteMPSole;
      userProfile.remanentes.bancoSole = remanenteBancoSole;
      userProfile.smartVisaConfig = {
        cupoTotal: cupoSmart,
        deudaPrevia: deudaSmart,
        cuotaMes: smart
      };

      // Sincronizar Smart Visa en tabla de boletas
      const itemSmart = currentAuditItems.find(it => it.name.includes('Smart Visa') || it.id === 'item-23');
      if (itemSmart) { itemSmart.base = smart; }

      saveUserProfile();
      renderAuditTable();
      updateChartsWithNewSalary();
      showToast(`💾 ¡Cofres de Soledad guardados! Remanente Chequera: ${formatCLP(chequera)}`);
    }

    function updateChartsWithNewSalary() {
      if (chartAportes && chartAportes.data && chartAportes.data.datasets) {
        chartAportes.data.datasets[0].data = [userProfile.diegoSalary || PERFIL_INICIAL.diegoSalary, userProfile.soledadSalary || PERFIL_INICIAL.soledadSalary];
        chartAportes.update();
      }
      if (chartCofres && chartCofres.data && chartCofres.data.datasets) {
        const fan = userProfile.cofresDiego?.fanFijos ?? PERFIL_INICIAL.cofresDiego.fanFijos;
        const tenpoD = userProfile.cofresDiego?.tenpoHuasco ?? PERFIL_INICIAL.cofresDiego.tenpoHuasco;
        const mach = userProfile.cofresDiego?.machBolsillo ?? PERFIL_INICIAL.cofresDiego.machBolsillo;
        const mpD = userProfile.cofresDiego?.mpAhorro ?? PERFIL_INICIAL.cofresDiego.mpAhorro;

        const cheq = userProfile.cofresSoledad?.chequeraHogar ?? PERFIL_INICIAL.cofresSoledad.chequeraHogar;
        const smart = getSmartReservaChequera();
        const tenpoS = userProfile.cofresSoledad?.tenpoBolsillo ?? PERFIL_INICIAL.cofresSoledad.tenpoBolsillo;
        const mpS = userProfile.cofresSoledad?.mpAhorro ?? PERFIL_INICIAL.cofresSoledad.mpAhorro;
        const bancoS = userProfile.cofresSoledad?.bancoReserva ?? PERFIL_INICIAL.cofresSoledad.bancoReserva;

        chartCofres.data.datasets[0].data = [fan, tenpoD, mach, mpD, cheq, smart, tenpoS, mpS, bancoS];
        chartCofres.update();

        const totalCofres = fan + tenpoD + mach + mpD + cheq + smart + tenpoS + mpS + bancoS;
        const subTitleEl = document.getElementById('dashCofresSubtitle');
        if (subTitleEl) subTitleEl.textContent = `Asignación porcentual de compromisos mensuales (${formatCLP(totalCofres)})`;
      }

      // Sincronizar también las donas individuales de tarjetas en la sección de análisis
      if (!cardAnalysisQueued) {
        cardAnalysisQueued = true;
        setTimeout(() => { cardAnalysisQueued = false; renderCardAnalysis(); }, 0);
      }
    }

    // Funciones inline para cambiar sueldos directamente desde las tarjetas de Control Mensual
    function onDiegoSalaryInlineChange(valStr) {
      const val = parseInt(valStr, 10);
      if (!val || isNaN(val) || val < 0) return;
      aplicarYGuardarSueldos('Diego', val);
    }

    function onSoleSalaryInlineChange(valStr) {
      const val = parseInt(valStr, 10);
      if (!val || isNaN(val) || val < 0) return;
      aplicarYGuardarSueldos('Soledad', val);
    }
