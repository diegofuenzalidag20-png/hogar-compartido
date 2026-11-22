// Gráficos de cofres/aportes del inicio y co-aporte del hipotecario.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
// ==============================================================
    // RENDERIZADOR ROBUSTO DE GRÁFICOS DEL DASHBOARD (COFRES & APORTES)
    // ==============================================================
    function renderDashboardCharts() {
      const diegoSal = userProfile.diegoSalary || PERFIL_INICIAL.diegoSalary;
      const soleSal = userProfile.soledadSalary || PERFIL_INICIAL.soledadSalary;
      const totalSal = diegoSal + soleSal;

      // 1. Chart Cofres (Desglose real de cofres Diego + Soledad)
      const ctxCofres = document.getElementById('chartCofres')?.getContext('2d');
      if (ctxCofres) {
        if (chartCofres) chartCofres.destroy();

        const fan = userProfile.cofresDiego?.fanFijos ?? PERFIL_INICIAL.cofresDiego.fanFijos;
        const tenpoD = userProfile.cofresDiego?.tenpoHuasco ?? PERFIL_INICIAL.cofresDiego.tenpoHuasco;
        const mach = userProfile.cofresDiego?.machBolsillo ?? PERFIL_INICIAL.cofresDiego.machBolsillo;
        const mpD = userProfile.cofresDiego?.mpAhorro ?? PERFIL_INICIAL.cofresDiego.mpAhorro;
        const cheq = userProfile.cofresSoledad?.chequeraHogar ?? PERFIL_INICIAL.cofresSoledad.chequeraHogar;
        const smart = getSmartReservaChequera();
        const tenpoS = userProfile.cofresSoledad?.tenpoBolsillo ?? PERFIL_INICIAL.cofresSoledad.tenpoBolsillo;
        const mpS = userProfile.cofresSoledad?.mpAhorro ?? PERFIL_INICIAL.cofresSoledad.mpAhorro;
        const bancoS = userProfile.cofresSoledad?.bancoReserva ?? PERFIL_INICIAL.cofresSoledad.bancoReserva;
        const pagoBci = userProfile.tcBciConfig?.pagoMes ?? 0;
        const pagoSmart = userProfile.smartVisaConfig?.pagoCompras ?? 0;
        const totalCofres = fan + tenpoD + mach + mpD + cheq + smart + tenpoS + mpS + bancoS + pagoBci + pagoSmart;

        const subTitleEl = document.getElementById('dashCofresSubtitle');
        if (subTitleEl) subTitleEl.textContent = `Asignación porcentual de compromisos mensuales (${formatCLP(totalCofres)})`;

        chartCofres = new Chart(ctxCofres, {
          type: 'doughnut',
          data: {
            labels: [
              'Fan Fijos (Diego)',
              'Tenpo Huasco (Diego)',
              'Mach Bolsillo (Diego)',
              'Ahorro MP (Diego)',
              'Chequera Hogar (Soledad)',
              'Smart Visa (Soledad)',
              'Bolsillo Tenpo (Soledad)',
              'Ahorro MP (Soledad)',
              'Reserva BancoEstado (Soledad)',
              'Pago tarjeta BCI (Diego)',
              'Pago compras Smart (Soledad)'
            ],
            datasets: [{
              data: [fan, tenpoD, mach, mpD, cheq, smart, tenpoS, mpS, bancoS, pagoBci, pagoSmart],
              backgroundColor: [
                '#3B82F6', '#F59E0B', '#06B6D4', '#10B981',
                '#A855F7', '#EC4899', '#8B5CF6', '#14B8A6', '#38BDF8', '#F43F5E', '#84CC16'
              ],
              borderWidth: 2,
              borderColor: chartBorderColor()
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: mobileLayout.matches ? 'bottom' : 'right',
                // Las tajadas de pago de tarjeta (BCI y compras Smart, la décima y la undécima) solo salen en la leyenda cuando hay pago
                labels: { color: chartTextColor(), font: { size: 10, weight: '600' }, boxWidth: 12, filter: (item, data) => item.index < 9 || data.datasets[0].data[item.index] > 0 }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => ` ${ctx.label}: ${formatCLP(ctx.raw)}`
                }
              }
            },
            cutout: '62%'
          }
        });
      }

      // 2. Chart Aportes (Ingreso vs Compromisos Asignados vs Margen Libre)
      const ctxAportes = document.getElementById('chartAportes')?.getContext('2d');
      if (ctxAportes) {
        if (chartAportes) chartAportes.destroy();

        const compromisos = getCompromisosPorPersona();
        const diegoGastos = compromisos.diego;
        const diegoLibre = Math.max(0, getCuentaPrincipalDisponible('Diego'));
        const soleGastos = compromisos.soledad;
        const soleLibre = Math.max(0, getCuentaPrincipalDisponible('Soledad'));

        chartAportes = new Chart(ctxAportes, {
          type: 'bar',
          data: {
            labels: ['🔵 Diego', '🟣 Soledad'],
            datasets: [
              {
                label: 'Ingreso Líquido',
                data: [diegoSal, soleSal],
                backgroundColor: ['#3B82F6', '#A855F7'],
                borderRadius: 6
              },
              {
                label: 'Compromisos Asignados',
                data: [diegoGastos, soleGastos],
                backgroundColor: ['rgba(59, 130, 246, 0.45)', 'rgba(168, 85, 247, 0.45)'],
                borderRadius: 6
              },
              {
                label: 'Disponible en Cuenta Principal',
                data: [diegoLibre, soleLibre],
                backgroundColor: ['#10B981', '#34D399'],
                borderRadius: 6
              }
            ]
          },
          options: {
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
              x: { ticks: { color: chartTextColor(), font: { size: 12, weight: '700' } }, grid: { display: false } },
              y: { 
                ticks: { color: '#94A3B8', callback: (v) => '$' + (v / 1000) + 'k' },
                grid: { color: 'rgba(255, 255, 255, 0.06)' }
              }
            }
          }
        });
      }
    }
    
    // --- Co-Aporte Hipotecario en UF Logic ---
    function updateHipotecarioCoAporte() {
      const total = parseInt(document.getElementById('hipoTotalInput').value, 10) || 0;
      const diegoFijo = 365000;
      const diff = Math.max(0, total - diegoFijo);

      const elDiff = document.getElementById('hipoSoledadDiffDisplay');
      const elDiffInline = document.getElementById('hipoDiffInline');
      const elTotalInline = document.getElementById('hipoTotalInline');

      if (elDiff) elDiff.textContent = '+' + formatCLP(diff);
      if (elDiffInline) elDiffInline.textContent = '+' + formatCLP(diff);
      if (elTotalInline) elTotalInline.textContent = formatCLP(total);
    }

    function applyHipotecarioToAudit() {
      const total = parseInt(document.getElementById('hipoTotalInput').value, 10) || 375000;
      const diegoFijo = 365000;
      const soledadDiff = Math.max(0, total - diegoFijo);

      // 1. Actualizar en la tabla de auditoría fija
      let itemDiego = currentAuditItems.find(it => it.id === 'item-1' || it.name.includes('Aporte Fijo Diego'));
      let itemSole = currentAuditItems.find(it => it.id === 'item-1b' || it.name.includes('Diferencial UF Soledad'));

      if (itemDiego) {
        itemDiego.actual = diegoFijo;
        itemDiego.base = diegoFijo;
      }
      if (itemSole) {
        itemSole.actual = soledadDiff;
        itemSole.base = soledadDiff;
      }

      // 2. Crear o actualizar inteligentemente en la Tabla de Gastos Registrados Diarios
      const today = getLocalDateISO();
      const dateStr = currentActiveMonth && currentActiveMonth.includes('-') ? `${currentActiveMonth}-05` : today;

      // Gasto Diego ($365.000)
      let expDiego = expenses.find(e => e.id === 'hipo-diego' || (e.category === 'Crédito Hipotecario' && e.payer === 'Diego'));
      if (expDiego) {
        expDiego.amount = diegoFijo;
        expDiego.desc = 'Dividendo Limache (Aporte Fijo Diego)';
        expDiego.account = cuentaPrincipalDiego();
      } else {
        expenses.unshift({
          id: 'hipo-diego',
          date: dateStr,
          payer: 'Diego',
          category: 'Crédito Hipotecario',
          amount: diegoFijo,
          account: cuentaPrincipalDiego(),
          desc: 'Dividendo Limache (Aporte Fijo Diego)'
        });
      }

      // Gasto Soledad (Diferencial)
      let expSole = expenses.find(e => e.id === 'hipo-soledad' || (e.category === 'Crédito Hipotecario' && e.payer === 'Soledad'));
      if (soledadDiff > 0) {
        if (expSole) {
          expSole.amount = soledadDiff;
          expSole.desc = 'Diferencial UF Dividendo (Co-Aporte Soledad)';
          expSole.account = 'Chequera BancoEstado';
        } else {
          expenses.unshift({
            id: 'hipo-soledad',
            date: dateStr,
            payer: 'Soledad',
            category: 'Crédito Hipotecario',
            amount: soledadDiff,
            account: 'Chequera BancoEstado',
            desc: 'Diferencial UF Dividendo (Co-Aporte Soledad)'
          });
        }
      } else if (expSole) {
        expenses = expenses.filter(e => e !== expSole);
      }

      // 3. Persistir en localStorage
      const month = document.getElementById('audit-month-select')?.value || '2026-10';
      localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
      localStorage.setItem('family_expenses', JSON.stringify(expenses));

      // 4. Re-renderizar tablas y gráficos reactivos
      renderAuditTable();
      renderExpenses();
      if (typeof initOrUpdateMonthAnalysis === 'function') initOrUpdateMonthAnalysis();
      if (typeof renderCardAnalysisSection === 'function') renderCardAnalysisSection();
      if (typeof renderDashboardCharts === 'function') renderDashboardCharts();

      // 5. Sincronizar automáticamente en la nube de Firebase
      triggerAutoSyncToCloud();

      showToast(`🤝 ¡Dividendo Hipotecario ($${total.toLocaleString('es-CL')}) aplicado: Diego $365k + Soledad $${soledadDiff.toLocaleString('es-CL')} sincronizados en la tabla!`);
    }
