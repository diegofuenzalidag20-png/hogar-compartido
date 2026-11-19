// Firestore REST, inicio de sesión con Google, respaldos diarios y sincronización a tres vías.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ============================================================
// ============================================================
    // FIREBASE FIRESTORE NATIVE REST ENGINE (ULTRA-RÁPIDO, CERO TRABAS)
    // ============================================================
    const FIRESTORE_PROJECT_ID = "finanzas-diego-soledad";
    const FIRESTORE_API_KEY = "AIzaSyBGwknt90g2gjEBBMtdu6VPRLzy_3slPhU";
    const FIRESTORE_DOC_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/hogar/datos_compartidos?key=${FIRESTORE_API_KEY}`;
    const CLIENT_SESSION_ID = 'sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();

    // ---------- Inicio de sesión con Google (Firebase Auth) ----------
    // Firestore sigue por REST: la sesión solo agrega el token. Sin sesión todo funciona mientras las reglas lo permitan.
    class ErrorSinPermiso extends Error { constructor() { super('La nube pide iniciar sesión'); } }

    // ---------- Versión de la app ----------
    // Un teléfono con la app abierta desde antes de una actualización sigue con el código viejo.
    // Si hay una versión nueva publicada, no se registra ni se sube nada hasta actualizar.
    const VERSION_APP = 77;
    let versionBloqueada = false;
    async function revisarVersionApp() {
      try {
        const r = await fetch(`sw.js?t=${Date.now()}`, { cache: 'no-store' });
        const publicada = Number(((await r.text()).match(/finanzas-pareja-v(\d+)/) || [])[1]);
        if (publicada > VERSION_APP) bloquearVersionAntigua(publicada);
      } catch (e) { /* sin red: se revisa en la próxima vuelta */ }
      return versionBloqueada;
    }
    function bloquearVersionAntigua(publicada) {
      if (versionBloqueada) return;
      versionBloqueada = true;
      updateCloudStatusBadge(false, '⬆️ Actualiza la app');
      const aviso = document.createElement('div');
      aviso.className = 'aviso-version';
      aviso.setAttribute('role', 'alert');
      aviso.innerHTML = `<div><strong>Hay una versión nueva de la app (v${publicada})</strong><span>Para no perder datos, actualiza antes de registrar o editar gastos.</span></div><button type="button" class="btn-primary">Actualizar</button>`;
      aviso.querySelector('button').onclick = actualizarApp;
      document.body.appendChild(aviso);
    }
    async function actualizarApp() {
      try { await Promise.all(((await navigator.serviceWorker?.getRegistrations?.()) || []).map(r => r.update())); } catch (e) {}
      location.reload();
    }
    function avisarVersionAntigua() {
      avisar('Hay una versión nueva de la app. Toca "Actualizar" arriba antes de registrar o editar, para no perder datos.');
    }
    setInterval(() => { if (!document.hidden) revisarVersionApp(); }, 5 * 60 * 1000);
    window.addEventListener('visibilitychange', () => { if (!document.hidden) revisarVersionApp(); });

    // ---------- Diario de este teléfono ----------
    // Guarda lo que se registra aquí; si un gasto ya no está en la nube, avisa y permite recuperarlo.
    const DIARIO_KEY = 'diario_gastos_telefono';
    function anotarEnDiario(gasto) {
      const d = leerJSON(DIARIO_KEY, []);
      d.push({ gasto: JSON.parse(JSON.stringify(gasto)), en: Date.now() });
      localStorage.setItem(DIARIO_KEY, JSON.stringify(d.slice(-200)));
    }
    function borrarDelDiario(id) {
      localStorage.setItem(DIARIO_KEY, JSON.stringify(leerJSON(DIARIO_KEY, []).map(x => x.gasto?.id === id ? { ...x, borrado: true } : x)));
    }
    function enMesActivo(fecha) {
      return new Date(`${fecha}T12:00:00`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }).replace(' de ', ' ').toLowerCase() === String(currentActiveMonth).toLowerCase();
    }
    function gastosPerdidos() {
      const ids = new Set(expenses.map(g => g.id));
      return leerJSON(DIARIO_KEY, [])
        .filter(x => !x.borrado && x.gasto?.id && !ids.has(x.gasto.id) && Date.now() - x.en < 40 * 864e5 && enMesActivo(x.gasto.date))
        .map(x => x.gasto);
    }
    const perdidosAvisados = new Set();
    function revisarGastosPerdidos() {
      const perdidos = gastosPerdidos().filter(g => !perdidosAvisados.has(g.id));
      if (!perdidos.length) return;
      perdidos.forEach(g => perdidosAvisados.add(g.id));
      const texto = perdidos.length === 1
        ? `⚠️ "${perdidos[0].desc}" (${formatCLP(perdidos[0].amount)}) se registró en este teléfono y ya no está en la lista`
        : `⚠️ ${perdidos.length} gastos registrados en este teléfono ya no están en la lista`;
      showToast(texto, { label: 'Recuperar', onClick: () => recuperarGastos(perdidos) });
    }
    function recuperarGastos(lista) {
      const ids = new Set(expenses.map(g => g.id));
      lista.filter(g => !ids.has(g.id)).forEach(g => expenses.unshift(JSON.parse(JSON.stringify(g))));
      localStorage.setItem('family_expenses', JSON.stringify(expenses));
      localStorage.setItem('hogar_gastos', JSON.stringify(expenses));
      renderExpenses();
      renderAuditTable();
      triggerAutoSyncToCloud(true);
      showToast(`✅ ${lista.length === 1 ? 'Gasto recuperado' : lista.length + ' gastos recuperados'}`);
    }
    const FIREBASE_CONFIG = { apiKey: FIRESTORE_API_KEY, authDomain: `${FIRESTORE_PROJECT_ID}.firebaseapp.com`, projectId: FIRESTORE_PROJECT_ID };
    function authFirebase() {
      if (!window.firebase?.auth) return null;
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      return firebase.auth();
    }
    // Al abrir la app, Firebase tarda un momento en recuperar la sesión guardada: nada sale a la nube antes
    let marcarAuthLista;
    const authLista = new Promise(resolve => { marcarAuthLista = resolve; });
    setTimeout(() => marcarAuthLista(), 6000);
    async function encabezadosNube(extra = {}) {
      await authLista;
      const usuario = authFirebase()?.currentUser;
      if (!usuario) return extra;
      try { return { ...extra, Authorization: `Bearer ${await usuario.getIdToken()}` }; } catch (e) { return extra; }
    }
    function pintarSesion(usuario) {
      const b = document.getElementById('menuCuenta');
      if (b) b.textContent = usuario ? `👥 Cerrar sesión (${usuario.email})` : '👥 Iniciar sesión con Google';
    }
    let avisoSesionMostrado = false;
    function avisarSinSesion() {
      updateCloudStatusBadge(false, '🔒 Inicia sesión');
      if (avisoSesionMostrado) return;
      avisoSesionMostrado = true;
      showToast('🔒 La nube pide iniciar sesión con Google', { label: 'Entrar', onClick: entrarConGoogle });
    }
    async function entrarConGoogle() {
      const auth = authFirebase();
      if (!auth) { alert('No se pudo cargar el inicio de sesión. Revisa la conexión e inténtalo de nuevo.'); return; }
      try {
        await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
        avisoSesionMostrado = false;
        showToast('✅ Sesión iniciada');
        pullFromFirestore(true);
      } catch (e) {
        if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') alert('No se pudo iniciar sesión: ' + (e?.message || e));
      }
    }
    async function alternarSesion() {
      const auth = authFirebase();
      if (auth?.currentUser) {
        if (await confirmar(`¿Cerrar la sesión de ${auth.currentUser.email}? Los datos de este teléfono se mantienen.`)) await auth.signOut();
      } else entrarConGoogle();
    }
    function iniciarSesionGoogle() {
      const auth = authFirebase();
      if (!auth) { marcarAuthLista(); return; }
      updateCloudStatusBadge(false, '⏳ Autenticando…');
      let primera = true;
      auth.onAuthStateChanged(usuario => {
        pintarSesion(usuario);
        marcarAuthLista();
        // La primera respuesta solo confirma la sesión guardada; la sincronización inicial ya la estaba esperando
        if (usuario && !primera) pullFromFirestore(true);
        primera = false;
      });
    }

    // ---------- Respaldos diarios en la nube ----------
    // Una copia por día en hogar/datos_compartidos/respaldos/AAAA-MM-DD; se guardan los últimos 45.
    const RESPALDOS_URL = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT_ID}/databases/(default)/documents/hogar/datos_compartidos/respaldos`;
    const RESPALDOS_A_GUARDAR = 45;
    let respaldoEnCurso = false;
    async function guardarRespaldo(id, payload) {
      const res = await fetch(`${RESPALDOS_URL}/${id}?key=${FIRESTORE_API_KEY}`, {
        method: 'PATCH',
        headers: await encabezadosNube({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ fields: { appStateJson: { stringValue: JSON.stringify(payload) }, creado: { integerValue: String(Date.now()) }, appVersion: { integerValue: String(VERSION_APP) } } })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    }
    async function listarRespaldos() {
      const res = await fetch(`${RESPALDOS_URL}?key=${FIRESTORE_API_KEY}&pageSize=300&mask.fieldPaths=creado`, { cache: 'no-store', headers: await encabezadosNube() });
      if (res.status === 401 || res.status === 403) throw new ErrorSinPermiso();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return ((await res.json()).documents || []).map(d => d.name.split('/').pop()).sort().reverse();
    }
    async function respaldarSiCorresponde() {
      const hoy = getLocalDateISO();
      if (respaldoEnCurso || localStorage.getItem('respaldo_dia') === hoy) return;
      respaldoEnCurso = true;
      try {
        await guardarRespaldo(hoy, JSON.parse(JSON.stringify(buildCompleteFamilyPayload())));
        localStorage.setItem('respaldo_dia', hoy);
        const sobrantes = (await listarRespaldos()).slice(RESPALDOS_A_GUARDAR);
        for (const id of sobrantes) await fetch(`${RESPALDOS_URL}/${id}?key=${FIRESTORE_API_KEY}`, { method: 'DELETE', headers: await encabezadosNube() });
      } catch (e) {
        console.warn('Respaldo diario pendiente:', e.message);
      } finally {
        respaldoEnCurso = false;
      }
    }
    async function abrirRespaldos() {
      const lista = document.getElementById('respaldosLista');
      document.getElementById('modalRespaldos').style.display = 'flex';
      lista.innerHTML = '<p class="hist-nota">Buscando respaldos…</p>';
      try {
        const ids = (await listarRespaldos()).filter(id => /^\d{4}-\d{2}-\d{2}$/.test(id));
        lista.innerHTML = ids.length ? '' : '<p class="hist-nota">Aún no hay respaldos. Se crea uno al día cuando la app se sincroniza.</p>';
        ids.forEach(id => {
          const fila = document.createElement('div');
          fila.className = 'respaldo-fila';
          const fecha = new Date(`${id}T12:00:00`).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
          fila.innerHTML = `<span>${escapeHtml(fecha)}</span>`;
          const b = document.createElement('button');
          b.type = 'button';
          b.className = 'btn-secondary';
          b.textContent = 'Restaurar';
          b.onclick = () => restaurarRespaldo(id, fecha);
          fila.appendChild(b);
          lista.appendChild(fila);
        });
      } catch (e) {
        lista.innerHTML = `<p class="hist-nota">${e instanceof ErrorSinPermiso ? 'Inicia sesión con Google para ver los respaldos.' : 'No se pudieron leer los respaldos. Revisa la conexión.'}</p>`;
      }
    }
    function cerrarRespaldos() { document.getElementById('modalRespaldos').style.display = 'none'; }
    async function restaurarRespaldo(id, fecha) {
      if (!(await confirmar(`¿Volver los datos al ${fecha}? Lo registrado después se pierde, salvo lo que esté en otro respaldo. Antes se guarda una copia del estado actual.`))) return;
      try {
        const res = await fetch(`${RESPALDOS_URL}/${id}?key=${FIRESTORE_API_KEY}`, { cache: 'no-store', headers: await encabezadosNube() });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = parseSeguro((await res.json()).fields?.appStateJson?.stringValue, null);
        if (!payload || !Array.isArray(payload.expenses)) throw new Error('El respaldo está incompleto');
        await guardarRespaldo(`antes-de-restaurar-${Date.now()}`, JSON.parse(JSON.stringify(buildCompleteFamilyPayload())));
        applyRemoteDataToApp(payload);
        await pushToFirestore(true);
        cerrarRespaldos();
        showToast(`✅ Datos restaurados al ${fecha}`);
      } catch (e) {
        alert('No se pudo restaurar: ' + e.message);
      }
    }

    let autoSyncCloudTimer = null;
    let lastUploadedTimestamp = 0;
    let cloudPollInterval = null;

    function updateCloudStatusBadge(online, text) {
      const badge = document.getElementById('cloudStatusBadge');
      if (badge) {
        badge.className = online ? 'badge badge-emerald' : 'badge badge-amber';
        badge.textContent = text;
      }
      const headerCloudDot = document.getElementById('headerCloudStatus');
      if (headerCloudDot) {
        headerCloudDot.innerHTML = online 
          ? `<span onclick="openSyncModal()" title="Sincronizado en tiempo real con Firebase — Toca para abrir Sincronización" style="cursor:pointer; display:inline-flex; align-items:center; gap:0.35rem; color:#34D399; font-size:0.75rem; font-weight:700; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); padding:0.2rem 0.55rem; border-radius:20px;"><span style="width:7px; height:7px; border-radius:50%; background:#10B981; box-shadow:0 0 8px #10B981; display:inline-block;"></span> Nube en Vivo</span>`
          : `<span onclick="openSyncModal()" title="Modo local — Toca para conectar" style="cursor:pointer; color:#FBBF24; font-size:0.75rem; font-weight:700;">${text}</span>`;
      }
    }

    function parseFirestoreField(field) {
      if (!field) return null;
      if ('stringValue' in field) return field.stringValue;
      if ('integerValue' in field) return parseInt(field.integerValue, 10);
      if ('doubleValue' in field) return parseFloat(field.doubleValue);
      if ('booleanValue' in field) return field.booleanValue;
      if ('nullValue' in field) return null;
      if ('arrayValue' in field) {
        const values = field.arrayValue.values || [];
        return values.map(parseFirestoreField);
      }
      if ('mapValue' in field) {
        const res = {};
        const f = field.mapValue.fields || {};
        for (const k in f) {
          res[k] = parseFirestoreField(f[k]);
        }
        return res;
      }
      return null;
    }

    function parseFirestoreDocFields(fields) {
      const res = {};
      for (const k in fields) {
        res[k] = parseFirestoreField(fields[k]);
      }
      return res;
    }

    function applyRemoteDataToApp(data) {
      if (!data) return;

      // 1. SINCRONIZAR MES / PERIODO ACTIVO (DIEGO & SOLEDAD EN EL MISMO MES SIEMPRE)
      let remoteActiveMonth = data.activeMonth || data.currentActiveMonth;
      if (!remoteActiveMonth && Array.isArray(data.dbMeses)) {
        const enCurso = data.dbMeses.find(m => m.estado === 'En Curso');
        if (enCurso && enCurso.nombre) remoteActiveMonth = enCurso.nombre;
      }

      if (remoteActiveMonth && remoteActiveMonth !== currentActiveMonth) {
        console.log(`🔄 Sincronizando mes activo de "${currentActiveMonth}" a "${remoteActiveMonth}"`);
        currentActiveMonth = remoteActiveMonth;
        localStorage.setItem('app_active_month', currentActiveMonth);
        const elTitle = document.getElementById('activeMonthTitle');
        if (elTitle) elTitle.textContent = currentActiveMonth;
      }

      const month = data.month || (typeof getMonthCode === 'function' ? getMonthCode(currentActiveMonth) : 'Nov-26');

      // 2. SINCRONIZAR BOLETAS AUDITADAS
      if (Array.isArray(data.auditItems) && data.auditItems.length > 0) {
        currentAuditItems = data.auditItems;
        quitarGastosDelPresupuesto(currentAuditItems, data.customAuditItems);
        localStorage.setItem(`audit_${currentActiveMonth}`, JSON.stringify(currentAuditItems));
        localStorage.setItem(`audit_${month}`, JSON.stringify(currentAuditItems));
      }

      // 3. SINCRONIZAR GASTOS DIARIOS
      if (Array.isArray(data.expenses)) {
        expenses = data.expenses;
        localStorage.setItem('family_expenses', JSON.stringify(expenses));
        localStorage.setItem('hogar_gastos', JSON.stringify(expenses));
      }

      // 4. SINCRONIZAR PERFIL DE USUARIO Y SUELDOS
      if (data.userProfile && typeof data.userProfile === 'object') {
        userProfile = Object.assign(userProfile || {}, data.userProfile);
        localStorage.setItem('finanzas_user_profile', JSON.stringify(userProfile));
        if (userProfile.diegoSalary) localStorage.setItem('diego_salary', userProfile.diegoSalary);
        if (userProfile.soledadSalary) localStorage.setItem('soledad_salary', userProfile.soledadSalary);
      }

      // 5. SINCRONIZAR ÍTEMS PERSONALIZADOS
      if (Array.isArray(data.customAuditItems)) {
        localStorage.setItem('custom_audit_items', JSON.stringify(data.customAuditItems));
      }

      // 6. SINCRONIZAR BASE DE DATOS DE MESES
      if (Array.isArray(data.dbMeses) && data.dbMeses.length > 0) {
        localStorage.setItem('db_historial_meses', JSON.stringify(data.dbMeses));
        if (typeof repararYDeduplicarBDMeses === 'function') repararYDeduplicarBDMeses();
      }

      // 7. SINCRONIZAR RESPALDO DE CIERRE (PARA PODER REABRIR SI SE DESEA)
      if (data.ultimoCierreBackup) {
        localStorage.setItem('ultimo_mes_cerrado_backup', JSON.stringify(data.ultimoCierreBackup));
      } else if (data.ultimoCierreBackup === null) {
        localStorage.removeItem('ultimo_mes_cerrado_backup');
      }

      // 8. RE-RENDERIZADO COMPLETO E INMEDIATO DE LA INTERFAZ
      if (typeof syncProfileToInputs === 'function') syncProfileToInputs();
      if (typeof renderExpenses === 'function') renderExpenses();
      if (typeof renderAuditTable === 'function') renderAuditTable();
      if (typeof renderChecklist === 'function') renderChecklist();
      if (typeof updateHeaderSalaries === 'function') updateHeaderSalaries();
      if (typeof populateSalaryModalInputs === 'function') populateSalaryModalInputs();
      if (typeof updateDiegoColchonDisplay === 'function') updateDiegoColchonDisplay();
      if (typeof updateSoleMargenDisplay === 'function') updateSoleMargenDisplay();
      if (typeof updateSmartVisaDisplay === 'function') updateSmartVisaDisplay();
      if (typeof renderCardAnalysis === 'function') renderCardAnalysis();
      if (typeof renderAnalisisMesActual === 'function') renderAnalisisMesActual();
      if (typeof renderDashboardCharts === 'function') renderDashboardCharts();
      if (typeof renderTablaHistorialMesesBD === 'function') renderTablaHistorialMesesBD();
      if (typeof renderDetailedHistoricalTable === 'function') renderDetailedHistoricalTable();
      if (typeof verificarBotonDeshacerCierre === 'function') verificarBotonDeshacerCierre();
      if (typeof actualizarSelectPeriodo === 'function') actualizarSelectPeriodo();
    }

    // renderExpenses vive en 09-gastos.js, que carga después
    window.renderExpensesTable = (...args) => renderExpenses(...args);

    // Sincronización a tres vías: la base es el último estado acordado con la nube.
    // Comparar contra la base detecta cualquier cambio local, aunque no haya pasado por triggerAutoSyncToCloud.
    const SYNC_SECTIONS = { auditItems: 'id', expenses: 'id', customAuditItems: 'id', dbMeses: 'nombre', userProfile: 'fields', activeMonth: null, ultimoCierreBackup: null };
    const SYNC_BASE_KEY = 'finanzas_sync_base';
    const SYNC_VERSION_KEY = 'finanzas_sync_update_time';
    let cloudSyncPromise = null;
    let cloudSyncQueued = false;

    function mergeThreeWay(base, local, remote) {
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      const esObjeto = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
      // Si ambos lados cambiaron lo mismo, gana el teléfono que está guardando. Los objetos se combinan campo a campo.
      const pick = (b, l, r) => {
        if (esObjeto(l) && esObjeto(r)) {
          const out = {};
          for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
            const v = pick(esObjeto(b) ? b[k] : undefined, l[k], r[k]);
            if (v !== undefined) out[k] = v;
          }
          return out;
        }
        return same(l, b) ? r : l;
      };
      const merged = {};
      for (const section in SYNC_SECTIONS) {
        const idKey = SYNC_SECTIONS[section];
        const [b, l, r] = [base[section], local[section], remote[section]];
        if (!idKey) { merged[section] = pick(b, l, r); continue; }
        const index = (v) => new Map(idKey === 'fields' ? Object.entries(v || {}) : (v || []).map(it => [it[idKey] ?? JSON.stringify(it), it]));
        const [bm, lm, rm] = [index(b), index(l), index(r)];
        const out = new Map();
        for (const key of new Set([...lm.keys(), ...rm.keys()])) {
          const value = pick(bm.get(key), lm.get(key), rm.get(key));
          if (value !== undefined) out.set(key, value);
        }
        merged[section] = idKey === 'fields' ? Object.fromEntries(out) : [...out.values()];
      }
      return merged;
    }

    function pickSyncState(payload) {
      const state = {};
      for (const section in SYNC_SECTIONS) state[section] = payload[section] ?? null;
      return state;
    }

    // Primer arranque de esta versión: manda quien escribió por última vez, pero se
    // rescatan los gastos del mes activo que solo existen en este teléfono.
    function firstRunBase(local, remote, lastWrite, remoteTs) {
      if (!remote) return {};
      if (lastWrite >= remoteTs) return remote;
      const sameExpense = (a, b) => a.id === b.id || (a.date === b.date && a.amount === b.amount && a.desc === b.desc);
      const inActiveMonth = (e) => new Date(`${e.date}T12:00:00`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }).replace(' de ', ' ').toLowerCase() === String(remote.activeMonth).toLowerCase();
      const remoteExpenses = remote.expenses || [];
      const isRescued = (e) => inActiveMonth(e) && !remoteExpenses.some((r) => sameExpense(e, r));
      return { ...local, expenses: (local.expenses || []).filter((e) => !isRescued(e)) };
    }

    async function versionNube() {
      const res = await fetch(`${FIRESTORE_DOC_URL}&mask.fieldPaths=timestamp`, { cache: 'no-store', headers: await encabezadosNube() });
      if (res.status === 404) return null;
      if (res.status === 401 || res.status === 403) throw new ErrorSinPermiso();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).updateTime || null;
    }

    async function readCloudDoc() {
      const res = await fetch(FIRESTORE_DOC_URL, { cache: 'no-store', headers: await encabezadosNube() });
      if (res.status === 404) return { updateTime: null, payload: null };
      if (res.status === 401 || res.status === 403) throw new ErrorSinPermiso();
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const doc = await res.json();
      let payload = null;
      if (doc.fields?.appStateJson?.stringValue) {
        payload = parseSeguro(doc.fields.appStateJson.stringValue, null);
        if (!payload) throw new Error('Los datos de la nube están ilegibles');
      } else if (doc.fields) {
        payload = parseFirestoreDocFields(doc.fields);
      }
      if (payload && !Array.isArray(payload.expenses)) throw new Error('Los datos de la nube están incompletos');
      return { updateTime: doc.updateTime, payload };
    }

    // Devuelve null si otro teléfono guardó después de nuestra lectura.
    async function writeCloudDoc(payload, updateTime) {
      if (versionBloqueada) throw new Error('Versión antigua de la app: actualiza antes de guardar');
      const precondition = updateTime ? `currentDocument.updateTime=${encodeURIComponent(updateTime)}` : 'currentDocument.exists=false';
      const res = await fetch(`${FIRESTORE_DOC_URL}&${precondition}`, {
        method: 'PATCH',
        headers: await encabezadosNube({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          fields: {
            appStateJson: { stringValue: JSON.stringify(payload) },
            timestamp: { integerValue: payload.timestamp.toString() },
            sender: { stringValue: payload.sender || 'Diego o Soledad' },
            month: { stringValue: payload.month || 'Nov-26' },
            activeMonth: { stringValue: payload.activeMonth || currentActiveMonth },
            appVersion: { integerValue: String(VERSION_APP) }
          }
        })
      });
      if (res.ok) return (await res.json()).updateTime;
      if (res.status === 401 || res.status === 403) throw new ErrorSinPermiso();
      const error = (await res.json().catch(() => ({}))).error;
      if (['FAILED_PRECONDITION', 'ALREADY_EXISTS', 'ABORTED'].includes(error?.status)) return null;
      throw new Error(error?.message || `HTTP ${res.status}`);
    }

    // ---------- Dos copias de la app en el mismo teléfono ----------
    // La app instalada y una pestaña del navegador (o una copia que quedó abierta) comparten lo guardado en el
    // teléfono, pero cada una tiene su propia lista en memoria. Si otra copia sincronizó, esta quedó con datos viejos:
    // guardar desde aquí borraba lo nuevo. Antes de registrar o sincronizar, una copia desactualizada se recarga.
    let versionSincronizadaAqui = localStorage.getItem(SYNC_VERSION_KEY);
    function otraCopiaSincronizo() {
      return localStorage.getItem(SYNC_VERSION_KEY) !== versionSincronizadaAqui;
    }
    function recargarSiOtraCopiaSincronizo() {
      if (!otraCopiaSincronizo()) return false;
      location.reload();
      return true;
    }
    window.addEventListener('storage', (e) => {
      if (e.key === SYNC_VERSION_KEY && e.newValue !== versionSincronizadaAqui) location.reload();
    });

    function rememberSyncedState(state, updateTime, timestamp) {
      localStorage.setItem(SYNC_BASE_KEY, JSON.stringify(state));
      localStorage.setItem(SYNC_VERSION_KEY, updateTime);
      // Lo que quedó guardado de verdad (con la memoria llena el guardado puede fallar y no hay que recargar en bucle)
      versionSincronizadaAqui = localStorage.getItem(SYNC_VERSION_KEY);
      localStorage.setItem('finanzas_last_local_update', String(timestamp));
    }

    async function runCloudSync() {
      if (recargarSiOtraCopiaSincronizo()) return 'idle';
      // Camino rápido: si nadie cambió la nube desde nuestra última sincronización, se sube sin leer antes.
      // Si otro teléfono guardó entremedio, Firestore lo rechaza y se sigue por el camino con combinación.
      const versionConocida = localStorage.getItem(SYNC_VERSION_KEY);
      const baseConocida = leerJSON(SYNC_BASE_KEY, null);
      if (versionConocida && baseConocida) {
        const payloadRapido = JSON.parse(JSON.stringify(buildCompleteFamilyPayload()));
        if (JSON.stringify(pickSyncState(payloadRapido)) === JSON.stringify(baseConocida)) {
          // Sin cambios locales: se pide solo la versión (<1 KB); el documento completo se baja si el otro teléfono guardó
          if (await versionNube() === versionConocida) return 'idle';
        } else {
          payloadRapido.timestamp = Date.now();
          payloadRapido.clientSessionId = CLIENT_SESSION_ID;
          const versionNueva = await writeCloudDoc(payloadRapido, versionConocida);
          if (versionNueva) {
            rememberSyncedState(pickSyncState(payloadRapido), versionNueva, payloadRapido.timestamp);
            return 'pushed';
          }
        }
      }

      for (let attempt = 0; attempt < 5; attempt++) {
        const { updateTime, payload: remotePayload } = await readCloudDoc();
        const remote = remotePayload && pickSyncState(remotePayload);
        const remoteTs = remotePayload?.timestamp || 0;
        const local = pickSyncState(buildCompleteFamilyPayload());
        const savedBase = leerJSON(SYNC_BASE_KEY, null);
        const lastWrite = parseInt(localStorage.getItem('finanzas_last_local_update') || '0', 10);
        const base = savedBase || firstRunBase(local, remote, lastWrite, remoteTs);
        const localChanged = JSON.stringify(local) !== JSON.stringify(base);
        const remoteChanged = updateTime !== localStorage.getItem(SYNC_VERSION_KEY);

        if (remote && !localChanged) {
          if (!remoteChanged) return 'idle';
          applyRemoteDataToApp(remotePayload);
          rememberSyncedState(pickSyncState(buildCompleteFamilyPayload()), updateTime, remoteTs || Date.now());
          return 'pulled';
        }

        let merged = false;
        if (remote && remoteChanged) {
          const state = mergeThreeWay(base, local, remote);
          merged = JSON.stringify(state) !== JSON.stringify(local);
          if (merged) applyRemoteDataToApp({ ...state, currentActiveMonth: state.activeMonth });
        }

        // Copia: un gasto registrado durante la subida no debe contarse como ya enviado
        const payload = JSON.parse(JSON.stringify(buildCompleteFamilyPayload()));
        payload.timestamp = Date.now();
        payload.clientSessionId = CLIENT_SESSION_ID;
        const newUpdateTime = await writeCloudDoc(payload, updateTime);
        if (newUpdateTime === null) continue;
        rememberSyncedState(pickSyncState(payload), newUpdateTime, payload.timestamp);
        return merged ? 'merged' : 'pushed';
      }
      throw new Error('La nube cambió demasiadas veces seguidas. Se reintentará automáticamente.');
    }

    // Una sola sincronización a la vez: una subida lenta nunca pisa a otra más nueva.
    function syncWithCloud() {
      if (cloudSyncPromise) { cloudSyncQueued = true; return cloudSyncPromise; }
      cloudSyncPromise = (async () => {
        try {
          let result = 'idle';
          do {
            cloudSyncQueued = false;
            const step = await runCloudSync();
            if (step !== 'idle') result = step;
          } while (cloudSyncQueued);
          return result;
        } finally {
          cloudSyncPromise = null;
        }
      })();
      return cloudSyncPromise;
    }

    async function pushToFirestore(isSilent = false) {
      try {
        const result = await syncWithCloud();
        updateCloudStatusBadge(true, '🟢 Nube en Vivo');
        respaldarSiCorresponde();
        if (!isSilent) showToast('☁️ ¡Guardado en la nube de Firebase con éxito!');
        else if (result === 'pulled' || result === 'merged') showToast('☁️ ¡Sincronizado con tu pareja!');
        revisarGastosPerdidos();
        return true;
      } catch (err) {
        console.error('Error guardando en Firestore:', err);
        if (err instanceof ErrorSinPermiso) { avisarSinSesion(); return false; }
        if (versionBloqueada) { updateCloudStatusBadge(false, '⬆️ Actualiza la app'); return false; }
        updateCloudStatusBadge(false, '⚠️ Sin guardar en nube');
        if (!isSilent) alert('Error al guardar en Firebase: ' + err.message);
        return false;
      }
    }

    async function pullFromFirestore(isSilent = false) {
      try {
        if (!isSilent) showToast('⏳ Descargando datos desde Firebase...');
        const result = await syncWithCloud();
        updateCloudStatusBadge(true, '🟢 Nube en Vivo');
        respaldarSiCorresponde();
        recordarCuentasPendientes();
        if (!isSilent) {
          showToast('☁️ ¡Datos actualizados desde Firebase!');
          closeSyncModal();
        } else if (result === 'pulled' || result === 'merged') {
          showToast('☁️ ¡Sincronizado con tu pareja!');
        }
        revisarGastosPerdidos();
        return true;
      } catch (err) {
        console.error('Error sincronizando con Firestore:', err);
        if (err instanceof ErrorSinPermiso) { avisarSinSesion(); return false; }
        if (versionBloqueada) { updateCloudStatusBadge(false, '⬆️ Actualiza la app'); return false; }
        updateCloudStatusBadge(false, '⚠️ Sin guardar en nube');
        if (!isSilent) alert('Error al descargar de Firebase: ' + err.message);
        return false;
      }
    }

    function triggerAutoSyncToCloud(immediate = false) {
      if (autoSyncCloudTimer) clearTimeout(autoSyncCloudTimer);
      autoSyncCloudTimer = null;
      if (immediate) {
        pushToFirestore(true);
      } else {
        autoSyncCloudTimer = setTimeout(() => {
          autoSyncCloudTimer = null;
          pushToFirestore(true);
        }, 150);
      }
    }

    function initFirebaseSync() {
      // Descarga inicial automática al abrir la app
      iniciarSesionGoogle();
      revisarVersionApp();
      pullFromFirestore(true);

      // El ciclo periódico también reintenta lo que no se pudo subir
      if (cloudPollInterval) clearInterval(cloudPollInterval);
      cloudPollInterval = setInterval(() => {
        if (!document.hidden) pullFromFirestore(true);
      }, 5000);

      window.addEventListener('visibilitychange', () => {
        // Al salir de la app no se puede esperar al temporizador
        if (document.hidden) {
          if (autoSyncCloudTimer) triggerAutoSyncToCloud(true);
        } else {
          if (recargarSiOtraCopiaSincronizo()) return;
          pullFromFirestore(true);
        }
      });
      window.addEventListener('focus', () => {
        pullFromFirestore(true);
      });
      window.addEventListener('online', () => {
        pullFromFirestore(true);
      });
    }

    // --- ACCIONES DE NUBE DESDE EL MODAL ---
    function loadSavedCloudSettings() {
      try {
        const vpsUrl = localStorage.getItem('vps_endpoint_url') || '';
        const vpsToken = localStorage.getItem('vps_token') || '';
        const urlInput = document.getElementById('vpsEndpointInput');
        const tokenInput = document.getElementById('vpsTokenInput');
        if (urlInput) urlInput.value = vpsUrl;
        if (tokenInput) tokenInput.value = vpsToken;
      } catch (e) {
        console.warn('loadSavedCloudSettings warning:', e);
      }
    }

    function saveCloudSettings() {
      try {
        const vpsUrl = document.getElementById('vpsEndpointInput')?.value.trim() || '';
        const vpsToken = document.getElementById('vpsTokenInput')?.value.trim() || '';
        localStorage.setItem('vps_endpoint_url', vpsUrl);
        localStorage.setItem('vps_token', vpsToken);
        showToast('💾 Configuración VPS guardada correctamente');
      } catch (e) {
        console.error('Error guardando VPS:', e);
      }
    }

    async function pushToActiveCloud() {
      const vpsUrl = document.getElementById('vpsEndpointInput')?.value.trim();
      if (vpsUrl) {
        const vpsToken = document.getElementById('vpsTokenInput')?.value.trim();
        showToast('⏳ Conectando con tu VPS...');
        try {
          const payload = buildCompleteFamilyPayload();
          const cleanUrl = vpsUrl.replace(/\/+$/, '');
          const res = await fetch(`${cleanUrl}/api/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${vpsToken || ''}`
            },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast('☁️ ¡Datos guardados en tu VPS con éxito!');
          } else {
            alert('Error del VPS: ' + (json.error || 'Respuesta inesperada'));
          }
        } catch(err) {
          alert('No se pudo conectar con el VPS: ' + err.message);
        }
      } else {
        await pushToFirestore(false);
      }
    }

    async function pullFromActiveCloud() {
      const vpsUrl = document.getElementById('vpsEndpointInput')?.value.trim();
      if (vpsUrl) {
        const vpsToken = document.getElementById('vpsTokenInput')?.value.trim();
        showToast('⏳ Descargando desde tu VPS...');
        try {
          const cleanUrl = vpsUrl.replace(/\/+$/, '');
          const res = await fetch(`${cleanUrl}/api/sync`, {
            headers: { 'Authorization': `Bearer ${vpsToken || ''}` }
          });
          const data = await res.json();
          if (data && !data.error) {
            applyRemoteDataToApp(data);
            showToast('☁️ ¡Datos descargados desde el VPS!');
            closeSyncModal();
          } else {
            alert('Error del VPS: ' + (data.error || 'Sin datos'));
          }
        } catch(err) {
          alert('Error al descargar del VPS: ' + err.message);
        }
      } else {
        await pullFromFirestore();
      }
    }

    // Chart.js Setup
    let chartCofres, chartAportes, chartHistorico;

    function initCharts() {
      // Optimización global de Chart.js para evitar drenaje de CPU y batería en celulares
      if (typeof Chart !== 'undefined') {
        const isMobile = window.innerWidth <= 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
          Chart.defaults.animation = false;
        } else {
          Chart.defaults.animation = { duration: 250 };
        }
        Chart.defaults.responsive = true;
        Chart.defaults.maintainAspectRatio = false;
      }
    }

    // Dynamic Expense Management
    const initialExpenses = [
      { date: '2026-10-24', payer: 'Diego', category: 'Operaciones Huasco', desc: 'Recarga Pasajes Bus Huasco', account: 'Tenpo', amount: 28000 },
      { date: '2026-10-23', payer: 'Soledad', category: 'Alimentación', desc: 'Feria Limache verduras y frutas', account: 'BancoEstado', amount: 14200 },
      { date: '2026-10-22', payer: 'Diego', category: 'Mascotas', desc: 'Comida húmeda Michis', account: 'Cuenta Fan', amount: 8900 },
      { date: '2026-10-21', payer: 'Soledad', category: 'Servicios Hogar', desc: 'Pago Luz Chilquinta', account: 'BancoEstado', amount: 23762 },
      { date: '2026-10-20', payer: 'Diego', category: 'Supermercado', desc: 'Lider Limache - Compra semanal', account: 'Cuenta Fan', amount: 34500 }
    ];

    let expenses = [leerJSON('hogar_gastos', null), leerJSON('family_expenses', null)].find(Array.isArray) || initialExpenses;

    function escapeHtml(str) {
      if (str === null || str === undefined) return '';
      return String(str).replace(/[&<>"']/g, function(m) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
      });
    }

    let currentExpenseFilter = 'all';
    let currentExpenseSearch = '';
    let currentExpenseSortOrder = localStorage.getItem('hogar_expense_sort_order') || 'desc';

    function toggleExpenseDateSort() {
      currentExpenseSortOrder = (currentExpenseSortOrder === 'desc') ? 'asc' : 'desc';
      localStorage.setItem('hogar_expense_sort_order', currentExpenseSortOrder);
      renderExpenses();
      if (typeof showToast === 'function') {
        showToast(currentExpenseSortOrder === 'desc' 
          ? '📅 Ordenado: Más recientes arriba (último día primero)' 
          : '📅 Ordenado: Día 1° arriba (cronológico ascendente)');
      }
    }

    function setExpenseFilter(filter, btn) {
      currentExpenseFilter = filter;
      document.querySelectorAll('.btn-expense-filter').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderExpenses();
    }

    function filterExpensesBySearch(val) {
      currentExpenseSearch = (val || '').toLowerCase().trim();
      renderExpenses();
    }

    const EXPENSE_PAGE = 8;
    let expenseVisibleLimit = EXPENSE_PAGE;

    function verMasGastos(cantidad) {
      expenseVisibleLimit = cantidad ? expenseVisibleLimit + cantidad : EXPENSE_PAGE;
      renderExpenses();
      if (!cantidad) document.getElementById('quickExpensesMobileCards')?.scrollIntoView({ block: 'start' });
    }
