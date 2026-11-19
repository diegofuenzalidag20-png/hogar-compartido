// Categorías de gasto (CATEGORIAS_GASTO) y fijo vs variable.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ==============================================================
    // MOTOR DE ANÁLISIS DEL MES ACTUAL (GRÁFICOS & DIAGNÓSTICO EN VIVO)
    // ==============================================================
    let chartMesCategoriasGlobal = null;
    let chartMesCategoriasDiego = null;
    let chartMesCategoriasSoledad = null;
    let chartMesPresupuestoVsReal = null;
    let chartMesDesembolsoPareja = null;
    let chartMesFijosVsVariables = null;

    // Normalizador de categorías para vincular la tabla de gastos a los gráficos
    const CATEGORIAS_GASTO = [
      { nombre: 'Dividendo y créditos', patron: /hipotec|vivienda|smart visa|cr[eé]dito|dividendo/, incluye: 'Dividendo hipotecario y cuota de la tarjeta Smart Visa.' },
      { nombre: 'Mascotas (Michis)', patron: /michi|mascota|\bgatos?\b|arena|veterin/, incluye: 'Comida, arena y veterinario de los michis.' },
      { nombre: 'Logística Huasco', patron: /huasco|pasaje|\bbus\b|arriendo habitaci|turno|uber|colectivo|traslado|metro|moviliz|operaciones/, incluye: 'Arriendo y servicios en Huasco, pasajes, Uber, metro y comida de turno.' },
      // Antes que Alimentación: una salida que no es comida (paseo, entrada, terapia) no infla lo que se gasta en comer
      { nombre: 'Salidas & Panoramas', patron: /panorama|ocio/, incluye: 'Salidas y panoramas que no son comida: paseos, entradas, actividades.' },
      { nombre: 'Alimentación', patron: /supermercado|s[uú]per\b|lider|mayorista|aliment|feria|verdul|\bpan\b|delivery|comida|salida|almuerzo|desayuno/, incluye: 'Supermercado, feria y comidas fuera de casa.' },
      { nombre: 'Salud & Educación', patron: /salud|farmacia|m[eé]dic|dental|consulta|eutirox|rupatadina|waldorf|curso/, incluye: 'Farmacia, consultas médicas y cursos.' },
      { nombre: 'Personales y suscripciones', patron: /streaming|netflix|spotify|crunchyroll|bolsillo|gastos propios|ahorro|transferencia|tercero/, incluye: 'Gastos personales, suscripciones (streaming) y transferencias a terceros.' },
      { nombre: 'Cuentas de la casa', patron: /\bluz\b|chilquinta|\bagua\b|esval|\bgas\b|com[uú]n|condominio|\bclaro\b|entel|internet|aseo|servicios hogar|gastos hogar|imprevist|limache/, incluye: 'Cuentas de la casa: luz, agua, gas, gasto común, internet, telefonía, aseo e imprevistos del hogar.' }
    ];

    function normalizeExpenseCategory(categoryName, descName) {
      const texto = `${categoryName || ''} ${descName || ''}`.toLowerCase();
      // El orden importa: "Supermercado (... Limache)" es comida, no una cuenta de la casa
      const regla = CATEGORIAS_GASTO.find(c => c.patron.test(texto));
      return regla ? regla.nombre : 'Personales y suscripciones';
    }

    // Fijo = calza con una cuenta fija del checklist (misma regla que el checklist y el recordatorio).
    // Así los premios de los michis quedan como variables y la arena como fija.
    function isExpenseFijo(categoryName, descName) {
      const gasto = { category: categoryName, desc: descName };
      return Object.keys(CHECKLIST_FIJOS).some(id => gastoEsDeCuentaFija(id, gasto));
    }

    // Helper reutilizable para renderizar Donas con Frosted Glass Tooltips
