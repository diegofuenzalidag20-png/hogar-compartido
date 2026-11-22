// Saldos por cuenta/cofre (disponible, liquidez, meta, Smart Visa, Mach semanal) y análisis por tarjeta.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ==============================================================
    // ANÁLISIS DE GASTOS POR TARJETA / COFRE CON TRANSFERENCIAS INTERNAS
    // ==============================================================
    let isCardAnalysisOpen = true;
    const expandedCardKeys = new Set();
    const cardChartDrawers = {};
let currentCardAnalysisFilter = 'all';
    let cardDoughnutCharts = {};

    function toggleCardAnalysisSection() {
      const container = document.getElementById('containerCardAnalysisContent');
      const btn = document.getElementById('btnToggleCardAnalysis');
      const icon = document.getElementById('iconToggleCardAnalysis');
      const text = document.getElementById('textToggleCardAnalysis');
      if (!container) return;

      isCardAnalysisOpen = !isCardAnalysisOpen;
      if (isCardAnalysisOpen) {
        container.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
        if (text) text.textContent = 'Ocultar Análisis por Tarjeta';
        if (btn) {
          btn.style.background = 'rgba(239, 68, 68, 0.15)';
          btn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          btn.style.color = '#FCA5A5';
        }
        setTimeout(() => {
          renderCardAnalysis();
        }, 50);
      } else {
        container.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
        if (text) text.textContent = 'Ver Análisis por Tarjeta';
        if (btn) {
          btn.style.background = 'rgba(59, 130, 246, 0.15)';
          btn.style.borderColor = 'rgba(59, 130, 246, 0.4)';
          btn.style.color = '#93C5FD';
        }
      }
    }

    function filterCardAnalysis(filter, btn) {
      currentCardAnalysisFilter = filter;
      document.querySelectorAll('#containerCardAnalysisContent .chip-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderCardAnalysis();
    }

    // --- Saldos de cofres: una sola fuente para todas las pantallas ---
    let cardAnalysisQueued = false;

    // Acepta $0; solo una casilla vacía conserva el valor anterior
    function readMoney(id, fallback) {
      const value = parseInt(document.getElementById(id)?.value, 10);
      return Number.isNaN(value) ? fallback : value;
    }

    // Plata que se mueve entre cuentas propias (traspasos): lo que entra menos lo que sale de una cuenta. No es gasto.
    // antesDe (AAAA-MM-DD) cuenta solo los traspasos de días anteriores.
    function netoTraspasos(key, antesDe) {
      return traspasos.reduce((acc, t) => {
        if (antesDe && !((t.date || '') < antesDe)) return acc;
        const monto = Number(t.amount) || 0;
        return acc + (normalizeAccountKey(t.to) === key ? monto : 0) - (normalizeAccountKey(t.from) === key ? monto : 0);
      }, 0);
    }

    function getCuentaPrincipalDisponible(owner) {
      const key = owner === 'Diego' ? 'fanDiego' : 'chequeraSole';
      const cfg = CARDS_ANALYSIS_CONFIG.find(c => c.key === key);
      const gastado = expenses.reduce((acc, e) => normalizeAccountKey(e.account) === key ? acc + (Number(e.amount) || 0) : acc, 0);
      return cfg.getRemanente() + cfg.getBudget() - gastado + netoTraspasos(key);
    }

    // Fondos del mes de todas las cuentas de una persona (sin la tarjeta de crédito) y lo gastado en ellas
    function getLiquidezPersona(owner) {
      let fondos = 0, usado = 0;
      CARDS_ANALYSIS_CONFIG.filter(c => c.owner === owner && !c.esCredito).forEach(cfg => {
        // Un traspaso entre cuentas de la misma persona suma y resta lo mismo; entre personas mueve liquidez
        fondos += cfg.getRemanente() + cfg.getBudget() + netoTraspasos(cfg.key);
        usado += expenses.reduce((acc, e) => normalizeAccountKey(e.account) === cfg.key ? acc + (Number(e.amount) || 0) : acc, 0);
      });
      if (owner === 'Diego') {
        const ajuste = getMachSemanal().ajuste;
        if (ajuste < 0) usado -= ajuste;
        // El pago de la tarjeta BCI sale de la cuenta principal: es plata del mes ya usada
        const pagoBci = userProfile.tcBciConfig?.pagoMes ?? 0;
        fondos += pagoBci;
        usado += pagoBci;
      } else {
        // La cuota Smart Visa y el pago de sus compras nuevas salen de la Chequera: es plata del mes ya usada
        const cuota = getSmartReservaChequera();
        const pagoCompras = userProfile.smartVisaConfig?.pagoCompras ?? 0;
        fondos += cuota + pagoCompras;
        usado += cuota + pagoCompras;
      }
      return { fondos, usado, pct: fondos > 0 ? Math.round(usado / fondos * 100) : 0 };
    }

    function getMetaMensual() {
      return currentAuditItems.filter(it => !esAhorroPropio(it)).reduce((acc, it) => acc + (Number(it.base) || 0), 0);
    }

    function getCompromisosPorPersona() {
      const total = { diego: 0, soledad: 0 };
      currentAuditItems.forEach(item => {
        const monto = item.actual > 0 ? item.actual : item.base;
        if (item.resp === 'Soledad') total.soledad += monto;
        else if (!item.name.includes('Bolsillo') && !item.name.includes('Ahorro')) total.diego += monto;
      });
      return total;
    }

    // Cuota pagada desde otra cuenta; las compras hechas con la tarjeta no cuentan
    function getSmartCuotaPagada() {
      return expenses.reduce((acc, e) => normalizeAccountKey(e.account) !== 'smartVisaSole' && /smart\s*visa/i.test(`${e.category} ${e.desc}`) ? acc + (Number(e.amount) || 0) : acc, 0);
    }

    function getSmartCuotaDelMes(cuotaPlanificada = userProfile.cofresSoledad?.smartVisa ?? 0) {
      return getSmartCuotaPagada() || cuotaPlanificada;
    }

    // Si la cuota ya está registrada como gasto, reservarla además la descontaría dos veces
    function getSmartReservaChequera(cuotaPlanificada = userProfile.cofresSoledad?.smartVisa ?? 0) {
      return getSmartCuotaPagada() > 0 ? 0 : cuotaPlanificada;
    }

    function overAssignWarning(asignado, sueldo) {
      return asignado > sueldo ? `<br><strong style="color:#F43F5E;">⚠️ Asignaste ${formatCLP(asignado - sueldo)} más que el sueldo.</strong>` : '';
    }

    // Desde diciembre 2026 el sueldo de Diego cae en la cuenta corriente BCI; la Cuenta Fan sigue abierta
    function bciEsPrincipal() {
      const [nombreMes, anioMes] = String(currentActiveMonth).trim().split(/\s+/);
      const mes = monthNamesList.findIndex(m => m.toLowerCase() === String(nombreMes).toLowerCase());
      const anio = parseInt(anioMes, 10);
      return anio > 2026 || (anio === 2026 && mes >= 11);
    }

    function cuentaPrincipalDiego() {
      return bciEsPrincipal() ? 'BCI Cuenta Corriente' : 'Cuenta Fan';
    }

    // Mach recibe una transferencia cada lunes desde Cuenta Fan, solo si Fan tenía fondos ese día
    function getMachSemanal(tenpo = userProfile.cofresDiego?.tenpoHuasco ?? 0, mp = userProfile.cofresDiego?.mpAhorro ?? 0, pagoBci = userProfile.tcBciConfig?.pagoMes ?? 0) {
      const cfg = userProfile.machSemanal || {};
      const monto = cfg.monto ?? 35000;
      const ajuste = cfg.ajuste ?? 0;
      const excepciones = cfg.excepciones || {};
      const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      const [nombreMes, anioMes] = String(currentActiveMonth).trim().split(/\s+/);
      const mes = meses.indexOf(String(nombreMes).toLowerCase());
      const anio = parseInt(anioMes, 10);
      const hoy = getLocalDateISO();
      const fondoFan = (userProfile.diegoSalary || 0) - tenpo - mp - pagoBci;
      const gastosFan = expenses.filter(e => normalizeAccountKey(e.account) === 'fanDiego');
      const lunes = [];
      let liberado = 0;
      for (let d = new Date(anio, mes, 1); d.getMonth() === mes; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 1) continue;
        const fecha = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const futuro = fecha > hoy;
        // Lo que salió de Fan antes del lunes (gastos y traspasos) resta fondos; lo que entró suma
        const gastadoAntes = gastosFan.reduce((acc, e) => e.date < fecha ? acc + (Number(e.amount) || 0) : acc, 0) - netoTraspasos('fanDiego', fecha);
        const automatico = fondoFan - gastadoAntes - liberado >= monto;
        const transferido = !futuro && (excepciones[fecha] ?? automatico);
        if (transferido) liberado += monto;
        lunes.push({ fecha, etiqueta: d.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }), futuro, transferido, automatico });
      }
      const pendientes = lunes.filter(l => l.futuro);
      const gastado = expenses.reduce((acc, e) => normalizeAccountKey(e.account) === 'machDiego' ? acc + (Number(e.amount) || 0) : acc, 0);
      return {
        monto, ajuste, lunes, liberado, gastado,
        porLiberar: pendientes.length * monto,
        totalMes: liberado + pendientes.length * monto,
        proximo: pendientes[0] || null,
        disponible: (userProfile.remanentes?.machDiego ?? 0) + liberado + ajuste + netoTraspasos('machDiego') - gastado
      };
    }

    function sincronizarItemMach(plan) {
      const item = currentAuditItems.find(it => it.id === 'item-15' || it.name.includes('Bolsillo Mach'));
      if (!item || (item.base === plan.totalMes && item.actual === plan.liberado)) return;
      item.base = plan.totalMes;
      item.actual = plan.liberado;
      item.name = 'Bolsillo Mach (semanal)';
      const code = getMonthCode(currentActiveMonth);
      if (document.getElementById('audit-month-select')?.value === code) {
        localStorage.setItem(`audit_${code}`, JSON.stringify(currentAuditItems));
      }
    }

    function renderMachSemanal(plan) {
      const cont = document.getElementById('machSemanasDisplay');
      if (!cont) return;
      const chips = plan.lunes.map(l => {
        const icono = l.futuro ? '⏳' : l.transferido ? '✅' : '❌';
        return `<button type="button" class="mach-lunes" ${l.futuro ? 'disabled' : `onclick="toggleMachLunes('${l.fecha}')"`}>${l.etiqueta} ${icono}</button>`;
      }).join('');
      const proximo = plan.proximo ? ` · Próximo: ${plan.proximo.etiqueta}` : '';
      const ajuste = plan.ajuste ? `<div class="mach-nota">Ajuste a saldo real: ${plan.ajuste > 0 ? '+' : '-'}${formatCLP(Math.abs(plan.ajuste))}</div>` : '';
      cont.innerHTML = `<div class="mach-nota">Liberado ${formatCLP(plan.liberado)} · Por liberar ${formatCLP(plan.porLiberar)}${proximo}</div><div class="mach-lunes-fila">${chips}</div>${ajuste}<div class="mach-nota">Toca un lunes pasado si la transferencia no coincide.</div>`;
    }

    function toggleMachLunes(fecha) {
      const item = getMachSemanal().lunes.find(l => l.fecha === fecha);
      if (!item || item.futuro) return;
      const excepciones = { ...(userProfile.machSemanal?.excepciones || {}) };
      const nuevo = !item.transferido;
      if (nuevo === item.automatico) delete excepciones[fecha];
      else excepciones[fecha] = nuevo;
      userProfile.machSemanal = { ...(userProfile.machSemanal || {}), excepciones };
      syncProfileToInputs();
      saveUserProfile();
    }

    function ajustarSaldoMach() {
      const real = readMoney('inputMachSaldoReal', null);
      if (real === null || real < 0) {
        alert('Escribe cuánto tienes hoy en Mach.');
        return;
      }
      const plan = getMachSemanal();
      userProfile.machSemanal = { ...(userProfile.machSemanal || {}), ajuste: plan.ajuste + real - plan.disponible };
      document.getElementById('inputMachSaldoReal').value = '';
      syncProfileToInputs();
      saveUserProfile();
      showToast(`💰 Saldo de Mach ajustado a ${formatCLP(real)}`);
    }

    function normalizeAccountKey(acc) {
      const a = (acc || '').toLowerCase().trim();
      if (a.includes('tenpo') && (a.includes('diego') || a.includes('huasco') || (!a.includes('soledad') && !a.includes('sole')))) return 'tenpoDiego';
      if (a.includes('tenpo') && (a.includes('soledad') || a.includes('sole'))) return 'tenpoSoledad';
      if (a.includes('mach')) return 'machDiego';
      if (a.includes('mercado') || a.includes('mp')) {
        if (a.includes('soledad') || a.includes('sole')) return 'mpSoledad';
        return 'mpDiego';
      }
      if (a.includes('bci') && (a.includes('créd') || a.includes('cred') || a.includes('tarjeta'))) return 'tcBciDiego';
      // La cuenta corriente BCI forma parte del fondo principal de Diego, junto con la Cuenta Fan
      if (a.includes('bci')) return 'fanDiego';
      if (a.includes('fan') || a.includes('chile')) return 'fanDiego';
      if (a.includes('smart') || a.includes('visa')) return 'smartVisaSole';
      if (a.includes('reserva') || (a.includes('ahorro') && a.includes('bancoestado'))) return 'reservaSole';
      if (a.includes('chequera') || a.includes('bancoestado') || a.includes('rut') || a.includes('limache')) return 'chequeraSole';
      if (a.includes('efectivo') || a.includes('cash')) return 'efectivo';
      return 'otra';
    }

    const CARDS_ANALYSIS_CONFIG = [
      {
        key: 'tenpoDiego',
        name: 'Tenpo Prepago Diego',
        desc: 'Operaciones Huasco (Pasajes, Uber, Metro, Turno)',
        owner: 'Diego',
        isPrimary: false,
        get sourceAccount() { return cuentaPrincipalDiego(); },
        getBudget: () => userProfile.cofresDiego?.tenpoHuasco ?? PERFIL_INICIAL.cofresDiego.tenpoHuasco,
        getRemanente: () => userProfile.remanentes?.tenpoDiego ?? 0,
        color: '#F59E0B',
        badgeClass: 'badge-amber',
        icon: '🚌'
      },
      {
        key: 'machDiego',
        name: 'Mach Prepago Diego',
        desc: 'Bolsillo Semanal ($35k/sem) & Modo Recuperación',
        owner: 'Diego',
        isPrimary: false,
        get sourceAccount() { return cuentaPrincipalDiego(); },
        getBudget: () => getMachSemanal().liberado,
        getRemanente: () => (userProfile.remanentes?.machDiego ?? 0) + Math.max(0, getMachSemanal().ajuste),
        color: '#06B6D4',
        badgeClass: 'badge-blue',
        icon: '⚡'
      },
      {
        key: 'mpDiego',
        name: 'Mercado Pago Diego',
        desc: 'Ahorro Activo & Fondo de Emergencia con Rendimiento',
        owner: 'Diego',
        isPrimary: false,
        get sourceAccount() { return cuentaPrincipalDiego(); },
        getBudget: () => userProfile.cofresDiego?.mpAhorro ?? PERFIL_INICIAL.cofresDiego.mpAhorro,
        getRemanente: () => userProfile.remanentes?.mpDiego ?? 0,
        color: '#10B981',
        badgeClass: 'badge-emerald',
        icon: '📈'
      },
      {
        key: 'tcBciDiego',
        name: 'Tarjeta de Crédito BCI',
        desc: 'Mastercard Platinum · cupo nacional (solo si se usa; hoy todo va por débito)',
        owner: 'Diego',
        isPrimary: false,
        esCredito: true,
        sourceAccount: 'Cupo BCI',
        getBudget: () => userProfile.tcBciConfig?.cupoTotal ?? 900000,
        getRemanente: () => userProfile.tcBciConfig?.deudaPrevia ?? 0,
        // El pago no es un gasto: sale de la cuenta principal y solo baja la deuda (las compras ya cuentan en su mes)
        getPago: () => userProfile.tcBciConfig?.pagoMes ?? 0,
        color: '#F43F5E',
        badgeClass: 'badge-rose',
        icon: '💳'
      },
      {
        key: 'fanDiego',
        get name() { return bciEsPrincipal() ? 'Cuenta Corriente BCI (+ Cuenta Fan)' : 'Cuenta Fan Banco de Chile'; },
        get desc() { return bciEsPrincipal() ? 'Cuenta Principal Diego (Sueldo, Dividendo, Arriendo, Michis, Fijos)' : 'Cuenta Principal Diego (Dividendo, Arriendo, Michis, Fijos)'; },
        owner: 'Diego',
        isPrimary: true,
        sourceAccount: 'Sueldo Líquido Diego',
        getBudget: () => {
          const sal = userProfile.diegoSalary || PERFIL_INICIAL.diegoSalary;
          const trans = (userProfile.cofresDiego?.tenpoHuasco ?? PERFIL_INICIAL.cofresDiego.tenpoHuasco) + getMachSemanal().liberado + (userProfile.cofresDiego?.mpAhorro ?? PERFIL_INICIAL.cofresDiego.mpAhorro) + (userProfile.tcBciConfig?.pagoMes ?? 0);
          return Math.max(0, sal - trans);
        },
        getTotalSalary: () => userProfile.diegoSalary || PERFIL_INICIAL.diegoSalary,
        getTotalTransfersOut: () => (userProfile.cofresDiego?.tenpoHuasco ?? PERFIL_INICIAL.cofresDiego.tenpoHuasco) + getMachSemanal().liberado + (userProfile.cofresDiego?.mpAhorro ?? PERFIL_INICIAL.cofresDiego.mpAhorro) + (userProfile.tcBciConfig?.pagoMes ?? 0),
        getRemanente: () => userProfile.remanentes?.fanDiego ?? 0,
        color: '#3B82F6',
        badgeClass: 'badge-blue',
        icon: '🏦'
      },
      {
        key: 'chequeraSole',
        name: 'Chequera Electrónica BancoEstado',
        desc: 'Cuenta Principal Soledad (Cuentas Hogar Limache, Servicios)',
        owner: 'Soledad',
        isPrimary: true,
        sourceAccount: 'Sueldo Líquido Soledad',
        getBudget: () => {
          const sal = userProfile.soledadSalary || PERFIL_INICIAL.soledadSalary;
          const trans = (userProfile.cofresSoledad?.tenpoBolsillo ?? PERFIL_INICIAL.cofresSoledad.tenpoBolsillo) + (userProfile.cofresSoledad?.mpAhorro ?? PERFIL_INICIAL.cofresSoledad.mpAhorro) + (userProfile.cofresSoledad?.bancoReserva ?? PERFIL_INICIAL.cofresSoledad.bancoReserva) + getSmartReservaChequera() + (userProfile.smartVisaConfig?.pagoCompras ?? 0);
          return Math.max(0, sal - trans);
        },
        getTotalSalary: () => userProfile.soledadSalary || PERFIL_INICIAL.soledadSalary,
        getTotalTransfersOut: () => (userProfile.cofresSoledad?.tenpoBolsillo ?? PERFIL_INICIAL.cofresSoledad.tenpoBolsillo) + (userProfile.cofresSoledad?.mpAhorro ?? PERFIL_INICIAL.cofresSoledad.mpAhorro) + (userProfile.cofresSoledad?.bancoReserva ?? PERFIL_INICIAL.cofresSoledad.bancoReserva) + getSmartReservaChequera() + (userProfile.smartVisaConfig?.pagoCompras ?? 0),
        getRemanente: () => userProfile.remanentes?.chequeraSole ?? 0,
        color: '#A855F7',
        badgeClass: 'badge-purple',
        icon: '🏡'
      },
      {
        key: 'tenpoSoledad',
        name: 'Tenpo Soledad',
        desc: 'Bolsillo Personal & Compras Personales Soledad',
        owner: 'Soledad',
        isPrimary: false,
        sourceAccount: 'Chequera BancoEstado',
        getBudget: () => userProfile.cofresSoledad?.tenpoBolsillo ?? PERFIL_INICIAL.cofresSoledad.tenpoBolsillo,
        getRemanente: () => userProfile.remanentes?.tenpoSoledad ?? 0,
        color: '#C084FC',
        badgeClass: 'badge-purple',
        icon: '👜'
      },
      {
        key: 'smartVisaSole',
        name: 'Tarjeta Smart Visa BancoEstado',
        desc: 'Línea de Crédito en Cuotas Programadas',
        owner: 'Soledad',
        isPrimary: false,
        esCredito: true,
        sourceAccount: 'Cupo BancoEstado',
        getBudget: () => userProfile.smartVisaConfig?.cupoTotal ?? PERFIL_INICIAL.smartVisaConfig.cupoTotal,
        getRemanente: () => userProfile.smartVisaConfig?.deudaPrevia ?? 0,
        // La cuota paga la deuda antigua (cuenta como gasto); el pago de compras nuevas no es gasto: baja la deuda de lo que ya contó al comprar
        getPago: () => getSmartCuotaDelMes() + (userProfile.smartVisaConfig?.pagoCompras ?? 0),
        color: '#F43F5E',
        badgeClass: 'badge-rose',
        icon: '💳'
      },
      {
        key: 'mpSoledad',
        name: 'Mercado Pago Soledad',
        desc: 'Ahorro Diario Remunerado Soledad',
        owner: 'Soledad',
        isPrimary: false,
        sourceAccount: 'Chequera BancoEstado',
        getBudget: () => userProfile.cofresSoledad?.mpAhorro ?? PERFIL_INICIAL.cofresSoledad.mpAhorro,
        getRemanente: () => userProfile.remanentes?.mpSoledad ?? 0,
        color: '#34D399',
        badgeClass: 'badge-emerald',
        icon: '✨'
      },
      {
        key: 'reservaSole',
        name: 'Cuenta Ahorro Reserva (BancoEstado)',
        desc: 'Fondo de Reserva para Imprevistos Soledad',
        owner: 'Soledad',
        isPrimary: false,
        sourceAccount: 'Chequera BancoEstado',
        getBudget: () => userProfile.cofresSoledad?.bancoReserva ?? PERFIL_INICIAL.cofresSoledad.bancoReserva,
        getRemanente: () => userProfile.remanentes?.bancoSole ?? 0,
        color: '#8B5CF6',
        badgeClass: 'badge-purple',
        icon: '🛡️'
      }
    ];

    function getCardExpenseCategory(item, cardKey) {
      if (cardKey === 'tenpoDiego') {
        const text = `${item.category || ''} ${item.desc || ''}`.toLowerCase();
        if (text.includes('pasaje') || text.includes('bus')) {
          return 'Pasajes Bus';
        }
        if (text.includes('snack') || text.includes('galleta') || text.includes('energética') || text.includes('energetica') || text.includes('comida turno')) {
          return 'Snacks';
        }
        if (text.includes('uber') || text.includes('colectivo') || text.includes('taxi') || text.includes('traslado')) {
          return 'Uber';
        }
        if (text.includes('metro') || text.includes('efe') || text.includes('valpara')) {
          return 'Metro Valparaíso';
        }
        if (text.includes('luz') || text.includes('agua') || text.includes('servicio')) {
          return 'Servicios Huasco';
        }
        if (item.category && !item.category.includes('Operaciones') && !item.category.includes('Logística') && !item.category.includes('Huasco')) {
          return item.category;
        }
        return 'Otros';
      }
      return normalizeExpenseCategory(item.category, item.desc);
    }

    function renderCardAnalysis() {
      const grid = document.getElementById('gridCardDoughnuts');
      if (!grid) return;

      // Limpiar gráficos anteriores para evitar fugas de memoria o solapamiento
      Object.keys(cardDoughnutCharts).forEach(k => {
        if (cardDoughnutCharts[k]) {
          cardDoughnutCharts[k].destroy();
          delete cardDoughnutCharts[k];
        }
      });

      // Filtrar según botón activo
      const visibleConfigs = CARDS_ANALYSIS_CONFIG.filter(cfg => {
        if (currentCardAnalysisFilter === 'diego' && cfg.owner !== 'Diego') return false;
        if (currentCardAnalysisFilter === 'soledad' && cfg.owner !== 'Soledad') return false;
        return true;
      });

      grid.innerHTML = '';

      visibleConfigs.forEach(cfg => {
        // Los traspasos entre cuentas propias suman o restan al fondo de la cuenta (no son gasto); el crédito no los recibe
        const traspasoNeto = cfg.esCredito ? 0 : netoTraspasos(cfg.key);
        const budget = cfg.getBudget() + traspasoNeto;
        const remanente = typeof cfg.getRemanente === 'function' ? cfg.getRemanente() : 0;
        let totalSpent = 0;
        const categoryMap = {};
        const recentExpenses = [];

        expenses.forEach(item => {
          const accKey = normalizeAccountKey(item.account);
          if (accKey === cfg.key) {
            const amt = Number(item.amount) || 0;
            totalSpent += amt;
            const cat = getCardExpenseCategory(item, cfg.key);
            categoryMap[cat] = (categoryMap[cat] || 0) + amt;
            recentExpenses.push(item);
          }
        });

        const machPlan = cfg.key === 'machDiego' ? getMachSemanal() : null;
        if (machPlan && machPlan.ajuste < 0) {
          totalSpent -= machPlan.ajuste;
          categoryMap['Sin registrar'] = -machPlan.ajuste;
        }

        const isSavingsCard = (cfg.key === 'mpDiego' || cfg.key === 'mpSoledad' || cfg.key === 'reservaSole');
        const isCreditCard = !!cfg.esCredito;

        // Métricas de crédito: cupo y deuda previa salen de la config; cada tarjeta descuenta su pago del mes (getPago)
        const cardCreditCupo = isCreditCard ? budget : 0;
        const cardCreditDeudaPrevia = isCreditCard ? remanente : 0;
        const cardCreditCuota = isCreditCard ? cfg.getPago() : 0;
        const cardCreditDeuda = isCreditCard ? Math.max(0, cardCreditDeudaPrevia + totalSpent - cardCreditCuota) : 0;
        const cardCreditDisponible = isCreditCard ? Math.max(0, cardCreditCupo - cardCreditDeuda) : 0;

        // Métricas Tarjetas de Ahorro con Remanente
        const cardSavingsRemanente = remanente;
        const cardSavingsAporte = budget;
        const cardSavingsTotalAcumulado = isSavingsCard ? Math.max(0, cardSavingsRemanente + cardSavingsAporte - totalSpent) : 0;

        // Métricas Tarjetas Operativas / Primarias
        const totalFondos = remanente + budget;
        const remaining = isCreditCard ? cardCreditDisponible : isSavingsCard ? cardSavingsTotalAcumulado : (totalFondos - totalSpent);
        const pctUsed = isCreditCard 
          ? (cardCreditCupo > 0 ? Math.min(100, Math.round((cardCreditDeuda / cardCreditCupo) * 100)) : 0) 
          : (totalFondos > 0 ? Math.min(100, Math.round((totalSpent / totalFondos) * 100)) : 0);
        const isOverspent = isCreditCard ? (cardCreditDeuda > cardCreditCupo) : (isSavingsCard ? false : remaining < 0);
        const cardIsOverspent = isOverspent;

        // Subtítulo de transferencia interna
        const traspasoHtml = traspasoNeto ? `<span>•</span> <span>🔁 Traspasos: ${traspasoNeto > 0 ? '+' : '-'}${formatCLP(Math.abs(traspasoNeto))}</span>` : '';
        let transferHtml = '';
        if (cfg.isPrimary) {
          const sal = cfg.getTotalSalary();
          const transOut = cfg.getTotalTransfersOut();
          transferHtml = `
            <div class="card-analysis-badge-transfer" style="background:rgba(59,130,246,0.15); color:#60A5FA; border:1px solid rgba(59,130,246,0.3);">
              <span>🏦 Sueldo: ${formatCLP(sal)}</span>
              <span>•</span>
              <span>🔁 Transferido a cofres: -${formatCLP(transOut)}</span>
              ${remanente > 0 ? `<span>•</span> <span>⏱️ Remanente: ${formatCLP(remanente)}</span>` : ''}
              ${traspasoHtml}
            </div>
          `;
        } else {
          transferHtml = `
            <div class="card-analysis-badge-transfer" style="background:rgba(16,185,129,0.15); color:#34D399; border:1px solid rgba(16,185,129,0.3);">
              <span>📥 Fondos transferidos desde: <strong>${cfg.sourceAccount}</strong></span>
              ${machPlan ? `<span>•</span> <span>🗓️ ${machPlan.lunes.filter(l => l.transferido).length} de ${machPlan.lunes.length} lunes${machPlan.proximo ? ` · Próximo ${machPlan.proximo.etiqueta} +${formatCLP(machPlan.monto)}` : ''}</span>` : ''}
              ${remanente > 0 ? `<span>•</span> <span>⏱️ Remanente mes anterior: <strong>${formatCLP(remanente)}</strong></span>` : ''}
              ${traspasoHtml}
            </div>
          `;
        }

        const cardEl = document.createElement('div');
        cardEl.className = 'card-analysis-box';
        cardEl.style.borderTop = `4px solid ${cfg.color}`;

        const canvasId = `chartCard_${cfg.key}`;

        cardEl.innerHTML = `
          <div>
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <div style="display:flex; align-items:center; gap:0.4rem;">
                  <span style="font-size:1.15rem;">${cfg.icon}</span>
                  <strong style="color:var(--text-main); font-size:0.98rem;">${cfg.name}</strong>
                </div>
                <div style="font-size:0.73rem; color:var(--text-muted); margin-top:0.15rem;">${cfg.desc}</div>
                ${transferHtml}
              </div>
              <span class="badge ${cfg.owner === 'Diego' ? 'badge-blue' : 'badge-purple'}" style="font-size:0.68rem;">${cfg.owner}</span>
            </div>

            <!-- Fila de 3 Métricas Dinámicas Según Tipo de Tarjeta -->
            <div style="display:flex; gap:0.4rem; margin-top:0.85rem;">
              ${isCreditCard ? `
                <div class="card-metric-pill">
                  <div class="card-metric-label">Cupo Total</div>
                  <div class="card-metric-val" style="color:#38BDF8;">${formatCLP(cardCreditCupo)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">Deuda Actual</div>
                  <div class="card-metric-val" style="color:#F43F5E;">${formatCLP(cardCreditDeuda)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">Cupo Disponible</div>
                  <div class="card-metric-val" style="color:${cardIsOverspent ? '#F43F5E' : '#10B981'};">${formatCLP(cardCreditDisponible)}</div>
                </div>
              ` : isSavingsCard ? `
                <div class="card-metric-pill">
                  <div class="card-metric-label">Ahorro Previo</div>
                  <div class="card-metric-val" style="color:#38BDF8;">${formatCLP(cardSavingsRemanente)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">Aporte Mes</div>
                  <div class="card-metric-val" style="color:#10B981;">+${formatCLP(cardSavingsAporte)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">Total Acumulado</div>
                  <div class="card-metric-val" style="color:#10B981;">${formatCLP(cardSavingsTotalAcumulado)}</div>
                </div>
              ` : remanente > 0 ? `
                <div class="card-metric-pill">
                  <div class="card-metric-label">Remanente Previo</div>
                  <div class="card-metric-val" style="color:#38BDF8;">${formatCLP(remanente)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">${cfg.isPrimary ? 'Fondo Mes' : 'Transferido'}</div>
                  <div class="card-metric-val" style="color:#10B981;">+${formatCLP(budget)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">Disponible</div>
                  <div class="card-metric-val" style="color:${isOverspent ? '#F43F5E' : '#10B981'};">
                    ${isOverspent ? '-' : '+'}${formatCLP(Math.abs(remaining))}
                  </div>
                </div>
              ` : `
                <div class="card-metric-pill">
                  <div class="card-metric-label">${cfg.isPrimary ? 'Fondo Neto' : 'Transferido'}</div>
                  <div class="card-metric-val" style="color:var(--text-main);">${formatCLP(budget)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">Gastado</div>
                  <div class="card-metric-val" style="color:#F43F5E;">${formatCLP(totalSpent)}</div>
                </div>
                <div class="card-metric-pill">
                  <div class="card-metric-label">Disponible</div>
                  <div class="card-metric-val" style="color:${isOverspent ? '#F43F5E' : '#10B981'};">
                    ${isOverspent ? '-' : '+'}${formatCLP(Math.abs(remaining))}
                  </div>
                </div>
              `}
            </div>

            <!-- Barra de Progreso de Consumo de la Tarjeta -->
            <div style="margin-top:0.75rem;">
              <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-bottom:0.25rem;">
                <span>Consumo: <strong>${pctUsed}%</strong> de fondos ${remanente > 0 && !isCreditCard && !isSavingsCard ? `(${formatCLP(totalSpent)} / ${formatCLP(totalFondos)})` : ''}</span>
                <span style="color:${isOverspent ? '#F43F5E' : '#10B981'}; font-weight:700;">
                  ${isOverspent ? '⚠️ Sobregiro' : '🟢 Dentro del margen'}
                </span>
              </div>
              <div style="background:rgba(255,255,255,0.08); border-radius:999px; height:6px; overflow:hidden;">
                <div style="background:${isOverspent ? 'linear-gradient(90deg, #F59E0B, #F43F5E)' : `linear-gradient(90deg, ${cfg.color}, #10B981)`}; height:100%; width:${Math.min(100, pctUsed)}%; transition:width 0.4s ease;"></div>
              </div>
            </div>

            <!-- Gráfico de Dona de Categorías de Esta Tarjeta -->
            <div style="position:relative; height:180px; display:flex; align-items:center; justify-content:center; margin-top:0.85rem;">
              <canvas id="${canvasId}"></canvas>
            </div>
          </div>

          <!-- Desglose de Categorías Gastadas -->
          <div style="margin-top:0.85rem; border-top:1px solid rgba(255,255,255,0.06); padding-top:0.6rem;">
            <div style="font-size:0.72rem; color:var(--text-muted); font-weight:700; margin-bottom:0.4rem; text-transform:uppercase;">
              ${Object.keys(categoryMap).length > 0 ? 'Desglose de gastos en esta cuenta:' : 'Estado de cuenta:'}
            </div>
            <div id="legend_${canvasId}" style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.75rem;">
              <!-- Insertado por JS -->
            </div>
          </div>
        `;

        const detalleHtml = cardEl.innerHTML;
        const cofreAbierto = expandedCardKeys.has(cfg.key);
        cardEl.innerHTML = `
          <button type="button" class="cofre-fila" aria-expanded="${cofreAbierto}" onclick="toggleCofreDetalle('${cfg.key}')">
            <span class="cofre-nombre">${cfg.icon} ${cfg.name}</span>
            <strong class="cofre-monto" style="color:${remaining < 0 ? '#F43F5E' : '#10B981'};">${remaining < 0 ? '-' : ''}${formatCLP(Math.abs(remaining))}</strong>
            <span class="cofre-barra"><span style="width:${pctUsed}%; background:${remaining < 0 ? '#F43F5E' : cfg.color};"></span></span>
            <span class="cofre-sub">${remaining < 0 ? '⚠️ Sobregiro' : isCreditCard ? 'Cupo disponible' : 'Disponible'} · ${pctUsed}% usado</span>
          </button>
          <div class="card-detalle" id="detalle_${cfg.key}" style="display:${cofreAbierto ? 'block' : 'none'};">${detalleHtml}</div>`;

        grid.appendChild(cardEl);

        cardChartDrawers[cfg.key] = () => {
          const ctx = document.getElementById(canvasId)?.getContext('2d');
          if (!ctx) return;

          const catEntries = Object.entries(categoryMap);
          let labels = [];
          let dataValues = [];
          let bgColors = [];
          const palette = ['#3B82F6', '#10B981', '#F59E0B', '#A855F7', '#EC4899', '#06B6D4', '#8B5CF6', '#F97316', '#14B8A6', '#EAB308'];

          const legendEl = document.getElementById(`legend_${canvasId}`);

          if (catEntries.length > 0) {
            labels = catEntries.map(([k]) => k);
            dataValues = catEntries.map(([_, v]) => v);
            bgColors = labels.map((_, i) => palette[i % palette.length]);

            if (legendEl) {
              legendEl.innerHTML = catEntries.map(([cat, amt], i) => {
                const pct = totalSpent > 0 ? ((amt / totalSpent) * 100).toFixed(1) : 0;
                return `
                  <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:0.35rem;">
                      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${palette[i % palette.length]};"></span>
                      <span style="color:var(--text-main); font-weight:600;">${escapeHtml(cat)}</span>
                    </div>
                    <div>
                      <strong style="color:var(--text-main); font-family:monospace;">${formatCLP(amt)}</strong>
                      <span style="color:var(--text-muted); font-size:0.68rem;">(${pct}%)</span>
                    </div>
                  </div>
                `;
              }).join('');
            }
          } else {
            labels = ['Sin gastos registrados aún'];
            dataValues = [1];
            bgColors = ['rgba(255, 255, 255, 0.08)'];

            if (legendEl) {
              legendEl.innerHTML = `
                <div style="color:var(--text-muted); font-style:italic; padding:0.25rem 0;">
                  ✨ 100% de fondos disponibles (${formatCLP(totalFondos)}) sin compras registradas aún este mes.
                  ${remanente > 0 ? `<br><span style="font-size:0.68rem; color:#94A3B8;">(Remanente anterior: ${formatCLP(remanente)} + Asignación mes: ${formatCLP(budget)})</span>` : ''}
                </div>
              `;
            }
          }

          Chart.getChart(ctx.canvas)?.destroy();
          cardDoughnutCharts[cfg.key] = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: dataValues,
                backgroundColor: bgColors,
                borderWidth: 2,
                borderColor: chartBorderColor()
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (c) => {
                      if (totalSpent === 0) return ' Fondos 100% intactos';
                      const pct = totalSpent > 0 ? ((c.raw / totalSpent) * 100).toFixed(1) : 0;
                      return ` ${c.label}: ${formatCLP(c.raw)} (${pct}%)`;
                    }
                  }
                }
              },
              cutout: '62%'
            }
          });
        };
        if (cofreAbierto) setTimeout(cardChartDrawers[cfg.key], 60);
      });
    }

    function toggleCofreDetalle(key) {
      const abierto = !expandedCardKeys.has(key);
      if (abierto) expandedCardKeys.add(key); else expandedCardKeys.delete(key);
      const detalle = document.getElementById(`detalle_${key}`);
      if (detalle) detalle.style.display = abierto ? 'block' : 'none';
      detalle?.closest('.card-analysis-box')?.querySelector('.cofre-fila')?.setAttribute('aria-expanded', String(abierto));
      if (abierto) cardChartDrawers[key]?.();
    }

    function elegirDona(cual) {
      document.querySelectorAll('.dona-opcion, .dona-selector button').forEach(el => el.classList.toggle('activa', el.dataset.dona === cual));
      document.querySelectorAll('.dona-opcion.activa canvas').forEach(c => Chart.getChart(c)?.resize());
    }

    const HIST_CUENTAS = [
      { k: 'luz', nombre: 'Luz', icono: '⚡', color: '#3B82F6' },
      { k: 'gas', nombre: 'Gas', icono: '🔥', color: '#F59E0B' },
      { k: 'agua', nombre: 'Agua', icono: '💧', color: '#10B981' },
      { k: 'gc', nombre: 'Gasto Común', icono: '🏢', color: '#A855F7' },
      { k: 'claro', nombre: 'Plan Claro', icono: '📱', color: '#06B6D4' },
      { k: 'michis', nombre: 'Michis', icono: '🐱', color: '#EC4899' },
      { k: 'hipo', nombre: 'Hipotecario', icono: '🏦', color: '#F43F5E' },
      { k: 'total', nombre: 'Total del mes', icono: '💰', color: '#34D399' }
    ];
    const HIST_MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const histEstado = { cuenta: 'luz', vista: 'tiempo', rango: 12 };

    function setHistorico(cambio) {
      Object.assign(histEstado, cambio);
      renderHistoricoPanel();
    }

    // Un mes en $0 es una boleta que no llegó, no un gasto cero: la línea no debe caer
    function resumenCuentaHist(meses, k) {
      const validos = meses.filter(m => (m[k] || 0) > 0);
      if (!validos.length) return null;
      const orden = [...validos].sort((a, b) => a[k] - b[k]);
      const ultimo = validos[validos.length - 1];
      const [mes, anio] = ultimo.code.split('-');
      const anterior = validos.find(m => m.code === `${mes}-${String(Number(anio) - 1).padStart(2, '0')}`) || null;
      return { promedio: Math.round(validos.reduce((s, m) => s + m[k], 0) / validos.length), minimo: orden[0], maximo: orden[orden.length - 1], ultimo, anterior };
    }

    function comparacionHist(r, k) {
      if (!r.anterior) return '';
      const pct = Math.round(((r.ultimo[k] - r.anterior[k]) / r.anterior[k]) * 100);
      if (pct === 0) return `<span class="hist-igual">Igual que ${escapeHtml(r.anterior.code)}</span>`;
      return `<span class="${pct > 0 ? 'hist-sube' : 'hist-baja'}">${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% ${pct > 0 ? 'más' : 'menos'} que ${escapeHtml(r.anterior.code)}</span>`;
    }

    function renderHistoricoPanel() {
      const cont = document.getElementById('histServicios');
      if (!cont) return;
      const meses = getConsolidatedHistoricalMonths();
      const cuenta = HIST_CUENTAS.find(c => c.k === histEstado.cuenta);
      const comparar = !cuenta;
      const vista = comparar ? 'tiempo' : histEstado.vista;

      const boton = (activo, attrs, texto) => `<button type="button" class="hist-chip${activo ? ' activa' : ''}" aria-pressed="${activo}" ${attrs}>${texto}</button>`;
      cont.innerHTML = HIST_CUENTAS.map(c => boton(c.k === histEstado.cuenta, `onclick="setHistorico({ cuenta: '${c.k}' })"`, `${c.icono} ${c.nombre}`)).join('')
        + boton(comparar, `onclick="setHistorico({ cuenta: 'comparar' })"`, '📊 Comparar servicios');
      document.getElementById('histVistas').innerHTML = boton(vista === 'tiempo', `onclick="setHistorico({ vista: 'tiempo' })"`, 'En el tiempo')
        + boton(vista === 'anios', `${comparar ? 'disabled' : ''} onclick="setHistorico({ vista: 'anios' })"`, 'Por año');
      document.getElementById('histRangos').innerHTML = vista === 'anios' ? '' : boton(histEstado.rango === 12, `onclick="setHistorico({ rango: 12 })"`, '12 meses') + boton(histEstado.rango === 0, `onclick="setHistorico({ rango: 0 })"`, 'Todo');

      const destacado = document.getElementById('histDestacado');
      const r = cuenta ? resumenCuentaHist(meses, cuenta.k) : null;
      destacado.innerHTML = !r ? '<p class="hist-nota">Luz, Gas y Agua juntas, para comparar su temporada alta y baja.</p>' : `
        <div class="hist-principal"><small>${escapeHtml(r.ultimo.code)}</small><strong>${formatCLP(r.ultimo[cuenta.k])}</strong>${comparacionHist(r, cuenta.k)}</div>
        <div class="hist-datos">
          <div><small>Promedio</small><strong>${formatCLP(r.promedio)}</strong></div>
          <div><small>Máximo · <span style="white-space:nowrap">${escapeHtml(r.maximo.code)}</span></small><strong class="hist-sube">${formatCLP(r.maximo[cuenta.k])}</strong></div>
          <div><small>Mínimo · <span style="white-space:nowrap">${escapeHtml(r.minimo.code)}</span></small><strong class="hist-baja">${formatCLP(r.minimo[cuenta.k])}</strong></div>
        </div>`;

      document.getElementById('histResumen').innerHTML = HIST_CUENTAS.map(c => {
        const x = resumenCuentaHist(meses, c.k);
        if (!x) return '';
        return `<button type="button" class="hist-fila${c.k === histEstado.cuenta ? ' activa' : ''}" onclick="setHistorico({ cuenta: '${c.k}' }); document.getElementById('histServicios').scrollIntoView({ block: 'center' });">
          <span class="hist-fila-nombre">${c.icono} ${c.nombre}</span>
          <strong>${formatCLP(x.promedio)}</strong>
          <small>Último ${formatCLP(x.ultimo[c.k])} (${escapeHtml(x.ultimo.code)})</small>
          <small class="hist-fila-comp">${comparacionHist(x, c.k)}</small>
        </button>`;
      }).join('');

      const canvas = document.getElementById('chartHistorico');
      if (!canvas || !canvas.offsetParent) return;
      if (chartHistorico) chartHistorico.destroy();
      const grid = temaClaro() ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.06)';
      const tick = temaClaro() ? '#475569' : '#94A3B8';
      const valor = (m, k) => (m[k] || 0) > 0 ? m[k] : null;
      let labels, datasets;

      if (vista === 'anios') {
        const anios = [...new Set(meses.map(m => m.code.split('-')[1]))];
        const tonos = ['#64748B', '#A855F7', cuenta.color, '#F59E0B'];
        labels = HIST_MESES;
        datasets = anios.map((a, i) => ({
          label: `20${a}`,
          data: HIST_MESES.map(n => { const m = meses.find(x => x.code === `${n}-${a}`); return m ? valor(m, cuenta.k) : null; }),
          borderColor: i === anios.length - 1 ? cuenta.color : tonos[i % 2],
          backgroundColor: 'transparent',
          borderWidth: i === anios.length - 1 ? 3 : 2,
          tension: 0.3, spanGaps: true, pointRadius: 3
        }));
      } else {
        const visibles = histEstado.rango ? meses.slice(-histEstado.rango) : meses;
        labels = visibles.map(m => m.code);
        if (comparar) {
          datasets = HIST_CUENTAS.filter(c => ['luz', 'gas', 'agua'].includes(c.k)).map(c => ({
            label: `${c.icono} ${c.nombre}`, data: visibles.map(m => valor(m, c.k)),
            borderColor: c.color, backgroundColor: 'transparent', borderWidth: 2, tension: 0.3, spanGaps: true, pointRadius: 2
          }));
        } else {
          const datos = visibles.map(m => valor(m, cuenta.k));
          const validos = datos.filter(v => v !== null);
          const alto = Math.max(...validos), bajo = Math.min(...validos);
          const color = (v, base) => v === alto ? '#F43F5E' : v === bajo ? '#10B981' : base;
          datasets = [
            { label: cuenta.nombre, data: datos, borderColor: cuenta.color, backgroundColor: `${cuenta.color}22`, fill: true, borderWidth: 3, tension: 0.3, spanGaps: true,
              pointRadius: datos.map(v => v === alto || v === bajo ? 6 : 3), pointBackgroundColor: datos.map(v => color(v, cuenta.color)), pointBorderColor: datos.map(v => color(v, cuenta.color)) },
            { label: 'Promedio', data: visibles.map(() => r ? r.promedio : null), borderColor: tick, borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, fill: false }
          ];
        }
      }

      chartHistorico = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          scales: {
            y: { beginAtZero: cuenta?.k !== 'hipo', grid: { color: grid }, ticks: { color: tick, callback: (v) => `$${Math.round(v / 1000)}k` } },
            x: { grid: { display: false }, ticks: { color: tick, autoSkip: true, maxTicksLimit: mobileLayout.matches ? 6 : 14, maxRotation: 0 } }
          },
          plugins: {
            legend: { position: 'bottom', labels: { color: chartTextColor(), boxWidth: 14, font: { size: 12 } } },
            tooltip: { filter: (i) => i.raw !== null, callbacks: { label: (c) => ` ${c.dataset.label}: ${formatCLP(c.raw)}` } }
          }
        }
      });
    }

    function renderCardAnalysisSection() {
      renderCardAnalysis();
    }
const detalleCategoria = {};
    const QUIEN_POR_DONA = { chartMesCategoriasGlobal: null, chartMesCategoriasDiego: 'Diego', chartMesCategoriasSoledad: 'Soledad' };

    function mostrarDetalleCategoria(canvasId, categoria, mantener = false) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      let caja = document.getElementById(`det_${canvasId}`);
      if (!caja) {
        caja = document.createElement('div');
        caja.id = `det_${canvasId}`;
        caja.className = 'categoria-detalle';
        canvas.closest('.card').appendChild(caja);
      }
      if (!mantener && detalleCategoria[canvasId] === categoria) {
        delete detalleCategoria[canvasId];
        caja.innerHTML = '';
        return;
      }
      detalleCategoria[canvasId] = categoria;
      const quien = QUIEN_POR_DONA[canvasId];
      const gastos = expenses
        .filter(e => normalizeExpenseCategory(e.category, e.desc) === categoria)
        .filter(e => !quien || e.payer === quien || e.payer === 'Ambos')
        .map(e => ({ ...e, monto: (Number(e.amount) || 0) * (quien && e.payer === 'Ambos' ? 0.5 : 1) }))
        .sort((x, y) => y.monto - x.monto);
      const total = gastos.reduce((s, e) => s + e.monto, 0);
      const regla = CATEGORIAS_GASTO.find(c => c.nombre === categoria);
      caja.innerHTML = `
        <div class="categoria-detalle-cabeza">
          <div><strong>${escapeHtml(categoria)}</strong><small>${escapeHtml(regla ? regla.incluye : 'Gastos que no calzan en otra categoría.')}</small></div>
          <button type="button" class="sheet-close" aria-label="Cerrar detalle" onclick="mostrarDetalleCategoria('${canvasId}', detalleCategoria['${canvasId}'])">✕</button>
        </div>
        <div class="categoria-detalle-total">${gastos.length} ${gastos.length === 1 ? 'gasto' : 'gastos'} · <strong>${formatCLP(total)}</strong></div>
        ${gastos.map(e => `
          <div class="categoria-detalle-fila">
            <span><strong>${escapeHtml(e.desc || e.category)}</strong><small>${escapeHtml(e.date || '')} · ${escapeHtml(e.payer)}${quien && e.payer === 'Ambos' ? ' (50%)' : ''} · ${escapeHtml(e.category || '')}</small></span>
            <strong>${formatCLP(e.monto)}</strong>
          </div>`).join('')}`;
      if (!mantener) caja.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    function buildCategoryDoughnut(canvasId, catMap, currentChart, totalAmt, palette) {
      const ctx = document.getElementById(canvasId)?.getContext('2d');
      if (!ctx) return null;
      if (currentChart) currentChart.destroy();

      const activeEntries = Object.entries(catMap).filter(([_, val]) => val > 0);
      let labels = activeEntries.map(([k]) => k);
      let dataValues = activeEntries.map(([_, v]) => v);
      let bgColors = labels.map((_, i) => palette[i % palette.length]);

      if (dataValues.length === 0) {
        labels = ['Sin gastos registrados'];
        dataValues = [1];
        bgColors = ['rgba(255, 255, 255, 0.1)'];
      }

      const grafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: dataValues,
            backgroundColor: bgColors,
            borderColor: chartBorderColor(),
            borderWidth: 2
          }]
        },
        options: {
        onClick: (evt, elementos, chart) => { if (elementos.length && totalAmt > 0) mostrarDetalleCategoria(canvasId, chart.data.labels[elementos[0].index]); },
        onHover: (evt, elementos) => { evt.native.target.style.cursor = elementos.length && totalAmt > 0 ? 'pointer' : 'default'; },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: mobileLayout.matches ? 'bottom' : 'right',
              onClick: (evt, item, legend) => { if (totalAmt > 0) mostrarDetalleCategoria(canvasId, legend.chart.data.labels[item.index]); },
              labels: {
                color: chartTextColor(), font: { size: mobileLayout.matches ? 12 : 10, weight: '600' }, boxWidth: 12,
                generateLabels: (chart) => Chart.overrides.doughnut.plugins.legend.labels.generateLabels(chart).map(l => ({
                  ...l,
                  text: totalAmt > 0 ? `${l.text}: ${formatCLP(chart.data.datasets[0].data[l.index])}` : l.text
                }))
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  if (totalAmt === 0) return ' Sin gastos registrados aún';
                  const pct = totalAmt > 0 ? ((ctx.raw / totalAmt) * 100).toFixed(1) : 0;
                  return ` ${ctx.label}: ${formatCLP(ctx.raw)} (${pct}%)`;
                }
              }
            }
          },
          cutout: '62%'
        }
      });
      if (detalleCategoria[canvasId]) mostrarDetalleCategoria(canvasId, detalleCategoria[canvasId], true);
      return grafico;
    }
