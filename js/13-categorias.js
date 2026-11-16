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
      { nombre: 'Vivienda & Crédito', patron: /hipotec|vivienda|smart visa|cr[eé]dito|dividendo/, incluye: 'Dividendo hipotecario y cuota de la tarjeta Smart Visa.' },
      { nombre: 'Mascotas (Michis)', patron: /michi|mascota|\bgatos?\b|arena|veterin/, incluye: 'Comida, arena y veterinario de los michis.' },
      { nombre: 'Logística Huasco', patron: /huasco|pasaje|\bbus\b|arriendo habitaci|turno|uber|colectivo|traslado|metro|moviliz|operaciones/, incluye: 'Arriendo y servicios en Huasco, pasajes, Uber, metro y comida de turno.' },
      { nombre: 'Alimentación', patron: /supermercado|s[uú]per\b|lider|mayorista|aliment|feria|verdul|\bpan\b|delivery|comida|salida|almuerzo|desayuno/, incluye: 'Supermercado, feria y comidas fuera de casa.' },
      { nombre: 'Salud & Educación', patron: /salud|farmacia|m[eé]dic|dental|consulta|eutirox|rupatadina|waldorf|curso/, incluye: 'Farmacia, consultas médicas y cursos.' },
      { nombre: 'Bolsillo & Ahorro', patron: /streaming|netflix|spotify|crunchyroll|bolsillo|gastos propios|ahorro|transferencia|tercero/, incluye: 'Gastos personales, streaming, ahorro y transferencias a terceros.' },
      { nombre: 'Hogar Limache', patron: /\bluz\b|chilquinta|\bagua\b|esval|\bgas\b|com[uú]n|condominio|\bclaro\b|entel|internet|aseo|servicios hogar|gastos hogar|imprevist|limache/, incluye: 'Cuentas de la casa: luz, agua, gas, gasto común, internet, telefonía, aseo e imprevistos del hogar.' }
    ];

    function normalizeExpenseCategory(categoryName, descName) {
      const texto = `${categoryName || ''} ${descName || ''}`.toLowerCase();
      // El orden importa: "Supermercado (... Limache)" es comida, no una cuenta de la casa
      const regla = CATEGORIAS_GASTO.find(c => c.patron.test(texto));
      return regla ? regla.nombre : 'Bolsillo & Ahorro';
    }

    function isExpenseFijo(categoryName, descName) {
      const text = `${categoryName || ''} ${descName || ''}`.toLowerCase();

      // 1. Gastos indiscutiblemente VARIABLES (Consumo diario, movilidad, alimentación y compras personales)
      if (
        text.includes('pasaje') || text.includes('bus') || text.includes('uber') || text.includes('colectivo') ||
        text.includes('metro valparaíso') || text.includes('metro valparaiso') || text.includes('efe') || text.includes('traslado') ||
        text.includes('snack') || text.includes('comida turno') || text.includes('sushi') || text.includes('desayuno') || text.includes('al paso') ||
        text.includes('supermercado') || text.includes('super') || text.includes('súper') || text.includes('lider') || text.includes('mayorista') ||
        text.includes('jumbo') || text.includes('unimarc') || text.includes('tottus') || text.includes('santa isabel') ||
        text.includes('feria') || text.includes('verdura') || text.includes('fruta') || text.includes('pan') || text.includes('carnicer') ||
        text.includes('almacén') || text.includes('almacen') || text.includes('delivery') || text.includes('pedidosya') ||
        text.includes('comida fuera') || text.includes('salida') || text.includes('restaurant') ||
        text.includes('bolsillo') || text.includes('personal') || text.includes('sorteo') || text.includes('regalo') ||
        text.includes('ropa') || text.includes('tienda') || text.includes('imprevisto') || text.includes('transferencia') || text.includes('tercero') ||
        text.includes('arena sanitaria') || text.includes('arena michis') || text.includes('veterin') ||
        text.includes('consulta médica') || text.includes('consulta medica') || text.includes('dental')
      ) {
        return false;
      }

      // 2. Compromisos ineludibles y cuentas estructuradas FIJAS
      if (
        text.includes('hipotec') || text.includes('dividendo') || text.includes('arriendo') ||
        text.includes('gasto común') || text.includes('gasto comun') || text.includes('luz') || text.includes('chilquinta') ||
        text.includes('agua') || text.includes('esval') || text.includes('gas') ||
        text.includes('internet') || text.includes('fibra') || text.includes('entel') || text.includes('claro') ||
        text.includes('aseo domiciliario') || text.includes('waldorf') || text.includes('curso') ||
        text.includes('netflix') || text.includes('crunchyroll') || text.includes('streaming') || text.includes('spotify') ||
        text.includes('eutirox') || text.includes('rupatadina') || text.includes('cuota smart visa') || text.includes('cuota tarjeta') ||
        text.includes('ahorro') || text.includes('fondo emergencia')
      ) {
        return true;
      }

      // Comida regular de michis (compromiso alimentario base del hogar)
      if (text.includes('comida michis') && !text.includes('snack') && !text.includes('premio')) {
        return true;
      }

      // Por defecto, cualquier gasto no catalogado es variable
      return false;
    }

    // Helper reutilizable para renderizar Donas con Frosted Glass Tooltips
