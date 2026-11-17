// Desplegables con estilo de vidrio.
// Parte de index.html: se carga como script clásico, en orden; comparte el ámbito global con los demás módulos.
    // ==============================================================
    // MOTOR DE DESPLEGABLES GLASSMORPHISM (BLUR REAL DE FONDO)
    // ==============================================================
    function enhanceSelectWithGlass(selectEl) {
      if (!selectEl || selectEl.dataset.glassEnhanced) return;
      selectEl.dataset.glassEnhanced = 'true';

      const wrapper = document.createElement('div');
      wrapper.className = 'glass-select-wrapper';

      selectEl.parentNode.insertBefore(wrapper, selectEl);
      wrapper.appendChild(selectEl);

      // Ocultar select nativo preservando valor y compatibilidad con formularios
      selectEl.style.position = 'absolute';
      selectEl.style.opacity = '0';
      selectEl.style.pointerEvents = 'none';
      selectEl.style.height = '0';
      selectEl.style.width = '0';
      selectEl.style.margin = '0';
      selectEl.style.padding = '0';
      selectEl.style.border = 'none';

      // Botón Disparador Glass
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'glass-select-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');

      const labelSpan = document.createElement('span');
      labelSpan.className = 'glass-select-label';
      labelSpan.style.overflow = 'hidden';
      labelSpan.style.textOverflow = 'ellipsis';
      labelSpan.style.whiteSpace = 'nowrap';
      labelSpan.textContent = selectEl.options[selectEl.selectedIndex]?.textContent || 'Seleccionar...';

      const arrowSpan = document.createElement('span');
      arrowSpan.className = 'glass-select-arrow';
      arrowSpan.textContent = '▾';

      trigger.appendChild(labelSpan);
      trigger.appendChild(arrowSpan);
      wrapper.appendChild(trigger);

      // Menú Desplegable con Efecto Frosted Glass Blur (PORTAL A BODY PARA EVITAR QUE NINGUNA CAJA LO TAPE)
      const menu = document.createElement('div');
      menu.className = 'glass-select-menu';
      document.body.appendChild(menu);

      menu.addEventListener('click', (e) => {
        // Evitar que clicks en cabeceras o scrollbar cierren el menú
        e.stopPropagation();
      });

      function populateMenu() {
        menu.innerHTML = '';
        Array.from(selectEl.children).forEach(child => {
          if (child.tagName === 'OPTGROUP') {
            // Cada grupo en su propia caja: su título queda fijo solo mientras se ven sus opciones,
            // y el título del grupo siguiente lo empuja hacia arriba en vez de quedar uno encima del otro
            const grupo = document.createElement('div');
            grupo.className = 'glass-select-grupo';
            const groupHeader = document.createElement('div');
            groupHeader.className = 'glass-select-group-header';
            groupHeader.textContent = child.label;
            grupo.appendChild(groupHeader);

            Array.from(child.children).forEach(opt => {
              grupo.appendChild(createOptionItem(opt));
            });
            menu.appendChild(grupo);
          } else if (child.tagName === 'OPTION') {
            menu.appendChild(createOptionItem(child));
          }
        });
      }

      function createOptionItem(opt) {
        if (opt.disabled && !opt.value) {
          const ph = document.createElement('div');
          ph.style.display = 'none';
          return ph;
        }
        const item = document.createElement('div');
        item.className = 'glass-select-item';
        if (opt.selected) item.classList.add('selected');
        item.textContent = opt.textContent;
        item.dataset.value = opt.value;

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          selectEl.value = opt.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));
          selectEl.dispatchEvent(new Event('input', { bubbles: true }));
          updateDisplay();
          closeMenu();
        });
        return item;
      }

      function updateDisplay() {
        const selectedOpt = selectEl.options[selectEl.selectedIndex];
        labelSpan.textContent = selectedOpt ? selectedOpt.textContent : 'Seleccionar...';
        menu.querySelectorAll('.glass-select-item').forEach(it => {
          it.classList.toggle('selected', it.dataset.value === selectEl.value);
        });
      }

      function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;

        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;

        menu.style.position = 'fixed';
        menu.style.zIndex = '99999999';
        const targetWidth = Math.max(rect.width, 320);
        menu.style.width = Math.min(targetWidth, window.innerWidth - 32) + 'px';

        let left = rect.left;
        if (left + targetWidth > window.innerWidth - 16) {
          left = Math.max(16, window.innerWidth - targetWidth - 16);
        }
        menu.style.left = Math.max(8, left) + 'px';

        if (spaceBelow < 230 && spaceAbove > spaceBelow) {
          // Desplegar hacia arriba si no cabe abajo
          menu.style.top = 'auto';
          menu.style.bottom = (window.innerHeight - rect.top + 6) + 'px';
          menu.style.maxHeight = Math.min(360, spaceAbove - 24) + 'px';
        } else {
          // Desplegar hacia abajo flotante sobre todas las cajas hermanas
          menu.style.top = (rect.bottom + 6) + 'px';
          menu.style.bottom = 'auto';
          menu.style.maxHeight = Math.min(360, spaceBelow - 24) + 'px';
        }
      }

            function toggleMenu(e) {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        closeAllGlassSelects();
        if (!isOpen) {
          populateMenu();
          positionMenu();
          menu.classList.add('open');
          trigger.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
          isAnyGlassSelectOpen = true;

          const selItem = menu.querySelector('.glass-select-item.selected');
          if (selItem) {
            setTimeout(() => selItem.scrollIntoView({ block: 'nearest' }), 20);
          }
        }
      }

      function closeMenu() {
        menu.classList.remove('open');
        trigger.classList.remove('active');
        trigger.setAttribute('aria-expanded', 'false');
        isAnyGlassSelectOpen = false;
      }

      trigger.addEventListener('click', toggleMenu);
      selectEl.addEventListener('change', updateDisplay);
      selectEl._syncGlassDisplay = updateDisplay;

      populateMenu();
    }

    let isAnyGlassSelectOpen = false;

    function closeAllGlassSelects() {
      if (!isAnyGlassSelectOpen) return;
      document.querySelectorAll('.glass-select-menu.open').forEach(menu => {
        menu.classList.remove('open');
      });
      document.querySelectorAll('.glass-select-trigger.active').forEach(trig => {
        trig.classList.remove('active');
        trig.setAttribute('aria-expanded', 'false');
      });
      isAnyGlassSelectOpen = false;
    }

    document.addEventListener('click', closeAllGlassSelects);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllGlassSelects();
    });
    window.addEventListener('scroll', (e) => {
      if (!isAnyGlassSelectOpen) return; // 0 costo de CPU si los menús están cerrados
      if (e.target && e.target.classList && e.target.classList.contains('glass-select-menu')) {
        return; // No cerrar al desplazarse dentro del propio menú
      }
      closeAllGlassSelects();
    }, { capture: true, passive: true });
    window.addEventListener('resize', closeAllGlassSelects, { passive: true });

    function syncAllGlassSelects() {
      document.querySelectorAll('select').forEach(sel => {
        if (typeof sel._syncGlassDisplay === 'function') sel._syncGlassDisplay();
      });
    }

    function initAllGlassSelects() {
      const selectIds = [
        'quickCategory', 'quickAccount', 'quickPayer',
        'audit-month-select'
      ];
      selectIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) enhanceSelectWithGlass(el);
      });
    }
