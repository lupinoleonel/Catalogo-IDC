// =================================================================================
// C A T Á L O G O   D E   P R O D U C T O S  -  I D C
// =================================================================================
// Versión: 3.0 (Código Refactorizado y Documentado)
// Descripción: Script optimizado para cargar, filtrar y mostrar productos desde
//              Google Sheets, con una estructura modular y fácil de mantener.
// =================================================================================

// --- Evento de Arranque ---
document.addEventListener('DOMContentLoaded', init);

// -----------------------------------------------------------------------------
// 1. ESTADO Y CONSTANTES GLOBALES
// -----------------------------------------------------------------------------

/**
 * Almacena el estado actual de la aplicación, como la categoría y subcategoría seleccionadas.
 */
let state = {
    currentSheet: 'Caballero',
    subcategoriaSeleccionada: 'TODOS'
};

/**
 * Constante que lista las hojas de cálculo que utilizan el formato de columnas de calzado.
 * Facilita la lógica condicional al leer los datos.
 */
const footwearSheets = ['Jaguar', 'Gaelle', 'Maraton', 'Havaianas', 'I-RUN', 'Calzado'];

/**
 * Objeto que centraliza las referencias a los elementos del DOM para un acceso más eficiente.
 */
const DOM = {
    pageTitle: document.getElementById('catalogo-title'),
    menuToggle: document.getElementById('menu-toggle'),
    menu: document.getElementById('menu'),
    categoryButtons: document.querySelectorAll('.categoria-selector button'),
    searchInput: document.getElementById('search'),
    searchButton: document.querySelector('.search-container button'),
    desktopRopaButtons: document.querySelectorAll('#ropaSubcatDesktop button'),
    mobileRopaSelect: document.getElementById('subcategoriaRopa'),
    desktopCalzadoButtons: document.querySelectorAll('#calzadoSubcatDesktop button'),
    mobileCalzadoSelect: document.getElementById('subcategoriaCalzado'),
    productsContainer: document.getElementById('products'),
    imgModal: document.getElementById('imgModal'),
    modalImg: document.querySelector('#imgModal img'),
    scrollTopBtn: document.getElementById('scrollTopBtn'),
    whatsappBtn: document.getElementById('whatsapp-link'),
    bannerImages: document.querySelectorAll('.banner-img')
};

// -----------------------------------------------------------------------------
// 2. LÓGICA DE DATOS (Obtención y Procesamiento)
// -----------------------------------------------------------------------------

/**
 * Obtiene los datos de una hoja de cálculo específica de Google Sheets.
 * @param {string} sheetName - El nombre de la pestaña de la hoja de cálculo a consultar.
 * @returns {Promise<Array>} Una promesa que se resuelve con el array de filas de datos.
 */
async function fetchSheetData(sheetName) {
    const baseURL = `https://docs.google.com/spreadsheets/d/1eWYNOMN0yQ_f8sOpSQvyHmwCAaohESkC4D73bEs60r8/gviz/tq?tqx=out:json&tq_nocache=${Date.now()}&sheet=`;
    try {
        const response = await fetch(baseURL + sheetName);
        const text = await response.text();
        const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const jsonData = JSON.parse(jsonText);
        return jsonData.table.rows || [];
    } catch (error) {
        console.error('Error al obtener los datos de la hoja:', error);
        DOM.productsContainer.innerHTML = '<p class="error">Error al cargar productos. Intenta recargar la página.</p>';
        return []; // Devuelve un array vacío en caso de error para no romper el flujo.
    }
}

/**
 * Mapea las filas de datos crudos a un array de objetos de producto estructurados.
 * @param {Array} rows - Las filas de datos de la API de Google Sheets.
 * @param {string} sheetName - El nombre de la hoja para determinar el formato de las columnas.
 * @returns {Array} Un array de productos formateados.
 */
function mapDataToProducts(rows, sheetName) {
    return rows.map(row => {
        let producto;
        if (footwearSheets.includes(sheetName)) {
            // Lógica para Calzado
            const codigoCrudo = row.c[1]?.f || row.c[1]?.v;
            producto = {
                nombre: row.c[2]?.v || "Sin nombre",
                imagen: row.c[7]?.v?.trim() || "img/imagen-generica.png",
                stock: String(row.c[8]?.v || "no disponible").trim().toLowerCase(),
                tipoPrenda: (codigoCrudo || '').toString().trim().toUpperCase(),
                precios: []
            };
            if (tipo === 'mayorista') {
                producto.precios = [
                    { label: '1 a 3 pares', value: row.c[4]?.v || 0 },
                    { label: '4 a 17 pares', value: row.c[5]?.v || 0 },
                    { label: '+ de 18 pares', value: row.c[6]?.v || 0 }
                ];
            } else {
                producto.precios = [{ label: 'Precio', value: row.c[3]?.v || 0 }];
            }
        } else {
            // Lógica para Ropa
            producto = {
                nombre: row.c[1]?.v || "Sin nombre",
                imagen: row.c[5]?.v?.trim() || "img/imagen-generica.png",
                stock: String(row.c[6]?.v || "no disponible").trim().toLowerCase(),
                tipoPrenda: (row.c[0]?.v || '').toString().substring(0, 4).toUpperCase(),
                precios: [
                    { label: textos[tipo].etiquetaPrecio, value: (tipo === 'mayorista' ? row.c[2]?.v : row.c[4]?.v) || 0 },
                    { label: textos[tipo].etiquetaPromo, value: (tipo === 'mayorista' ? row.c[4]?.v : row.c[3]?.v) || 0 }
                ]
            };
        }
        return producto;
    }).filter(item => item.stock && !item.stock.includes("no disponible"));
}

/**
 * Filtra la lista de productos basada en la subcategoría seleccionada.
 * También ordena la vista "TODOS" para priorizar productos nuevos y reingresos.
 * @param {Array} products - El array de productos a filtrar.
 * @returns {Array} Un array de productos filtrados y/u ordenados.
 */
function filterProductsBySubcategory(products) {
    const { subcategoriaSeleccionada } = state;
    if (subcategoriaSeleccionada === "TODOS") {
        return products.sort((a, b) => {
            const aIsPriority = a.stock.includes("nuevo!") || a.stock.includes("reingreso");
            const bIsPriority = b.stock.includes("nuevo!") || b.stock.includes("reingreso");
            return bIsPriority - aIsPriority;
        });
    }
    const filtros = subcategorias[subcategoriaSeleccionada] || [];
    if (filtros.length === 0) return products;
    return products.filter(p => filtros.some(filtro => p.tipoPrenda.startsWith(filtro)));
}

/**
 * Filtra los productos visibles en la página según el texto en la barra de búsqueda.
 */
function applySearchFilter() {
    const searchTerm = DOM.searchInput.value.toLowerCase();
    const products = document.querySelectorAll(".product");
    products.forEach(product => {
        const name = product.querySelector("h4").textContent.toLowerCase();
        product.style.display = name.includes(searchTerm) ? "" : "none";
    });
}

// -----------------------------------------------------------------------------
// 3. LÓGICA DE RENDERIZADO Y UI (Actualización de la Interfaz)
// -----------------------------------------------------------------------------

/**
 * Dibuja los productos en el contenedor principal del DOM.
 * @param {Array} products - Un array de objetos de producto.
 */
function renderProducts(products) {
    DOM.productsContainer.innerHTML = '';
    if (products.length === 0) {
        DOM.productsContainer.innerHTML = '<p class="no-products">No se encontraron productos para esta selección.</p>';
        return;
    }
    products.forEach(item => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';
        if (item.stock.includes("nuevo!")) {
            productDiv.classList.add('producto-nuevo');
        } else if (item.stock.includes("reingreso")) {
            productDiv.classList.add('producto-reingreso');
        } else if (item.stock.includes("limitado")) {
            productDiv.classList.add('producto-limitado');
        }
        const preciosHTML = item.precios.map(p =>
            `<p class="price-line"><span class="price-label">${p.label}:</span> <span class="price-value">$${formatPrice(p.value)}</span></p>`
        ).join('');
        productDiv.innerHTML = `
            <img src="${item.imagen}" alt="${item.nombre}" data-img-src="${item.imagen}" onerror="this.onerror=null; this.src='img/imagen-generica.png';">
            <h4>${item.nombre}</h4>
            <div class="price-container-calzado">
                ${preciosHTML}
            </div>
        `;
        DOM.productsContainer.appendChild(productDiv);
    });
}

/**
 * Actualiza la visibilidad de los filtros de subcategoría según la categoría principal.
 * @param {string} category - La categoría principal seleccionada (ej. 'Calzado', 'Dama').
 */
function updateSubcategoryFiltersUI(category) {
    const ropaDesktop = document.getElementById('ropaSubcatDesktop');
    const ropaMobile = document.getElementById('ropaSubcatMobile');
    const calzadoDesktop = document.getElementById('calzadoSubcatDesktop');
    const calzadoMobile = document.getElementById('calzadoSubcatMobile');

    // Ocultar todos por defecto
    ropaDesktop.style.display = 'none';
    ropaMobile.style.display = 'none';
    calzadoDesktop.style.display = 'none';
    calzadoMobile.style.display = 'none';

    if (footwearSheets.includes(category)) {
        calzadoDesktop.style.display = '';
        calzadoMobile.style.display = '';
    } else if (category === 'Accesorios') {
        // No se muestra nada
    } else { // Caballero y Dama
        ropaDesktop.style.display = '';
        ropaMobile.style.display = '';
    }
}

/**
 * Marca un botón como activo dentro de un grupo de botones.
 * @param {NodeList} buttonGroup - El grupo de botones.
 * @param {HTMLElement} activeButton - El botón que debe marcarse como activo.
 */
function updateActiveButton(buttonGroup, activeButton) {
    buttonGroup.forEach(btn => btn.classList.remove('active'));
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

/**
 * Cambia la imagen del banner según la categoría y el tipo de cliente.
 */
function updateBanner() {
    DOM.bannerImages.forEach(img => img.classList.add('hidden'));
    let bannerId = '';
    const isFootwear = footwearSheets.includes(state.currentSheet);
    if (tipo === 'minorista') {
        bannerId = isFootwear ? 'banner-minorista-calzado' : 'banner-minorista-indumentaria';
    } else {
        bannerId = isFootwear ? 'banner-mayorista-calzado' : 'banner-mayorista-indumentaria';
    }
    const activeBanner = document.getElementById(bannerId);
    if (activeBanner) {
        activeBanner.classList.remove('hidden');
    }
}

/**
 * Actualiza la URL del navegador para reflejar el estado actual de los filtros.
 */
function updateURL() {
    const searchTerm = DOM.searchInput.value || '';
    const url = `?tipo=${tipo}&cat=${state.currentSheet}&subcat=${state.subcategoriaSeleccionada}&search=${encodeURIComponent(searchTerm)}`;
    history.pushState(state, '', url);
}

/**
 * Formatea un número como un precio en formato de moneda local.
 * @param {number|string} value - El valor numérico a formatear.
 * @returns {string} El precio formateado.
 */
function formatPrice(value) {
    if (value === null || value === undefined) return '0';
    return parseFloat(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// -----------------------------------------------------------------------------
// 4. MANEJADORES DE EVENTOS (Event Handlers)
// -----------------------------------------------------------------------------

/**
 * Orquestador principal que se ejecuta cuando se cambia una categoría o subcategoría.
 */
async function loadAndDisplayProducts() {
    DOM.productsContainer.innerHTML = '<p class="loading">Cargando productos...</p>';
    const rows = await fetchSheetData(state.currentSheet);
    const allProducts = mapDataToProducts(rows, state.currentSheet);
    const filteredProducts = filterProductsBySubcategory(allProducts);
    renderProducts(filteredProducts);
    applySearchFilter();
    updateBanner();
}

/**
 * Se ejecuta al hacer clic en un botón de categoría principal (Caballero, Dama, etc.).
 * @param {Event} event - El objeto del evento de clic.
 */
function handleCategoryChange(event) {
    const category = event.target.dataset.category;
    state.currentSheet = category;
    state.subcategoriaSeleccionada = "TODOS";
    
    updateActiveButton(DOM.categoryButtons, event.target);
    updateSubcategoryFiltersUI(category);
    
    // Resetea el botón activo en los filtros de subcategoría
    if (footwearSheets.includes(category)) {
        updateActiveButton(DOM.desktopCalzadoButtons, DOM.desktopCalzadoButtons[0]);
        DOM.mobileCalzadoSelect.value = "TODOS";
    } else {
        updateActiveButton(DOM.desktopRopaButtons, DOM.desktopRopaButtons[0]);
        DOM.mobileRopaSelect.value = "TODOS";
    }

    updateURL();
    loadAndDisplayProducts();
}

/**
 * Se ejecuta al hacer clic en un botón de subcategoría (Buzos, Jaguar, etc.).
 * @param {Event} event - El objeto del evento de clic.
 */
function handleSubcategoryChange(event) {
    state.subcategoriaSeleccionada = event.target.dataset.subcat;
    
    // Actualiza el botón activo en el grupo correspondiente
    if (footwearSheets.includes(state.currentSheet)) {
        updateActiveButton(DOM.desktopCalzadoButtons, event.target);
        DOM.mobileCalzadoSelect.value = state.subcategoriaSeleccionada;
    } else {
        updateActiveButton(DOM.desktopRopaButtons, event.target);
        DOM.mobileRopaSelect.value = state.subcategoriaSeleccionada;
    }

    updateURL();
    loadAndDisplayProducts();
}

/**
 * Se ejecuta al cambiar la selección en el menú desplegable de subcategorías móvil.
 * @param {Event} event - El objeto del evento de cambio.
 */
function handleMobileSubcategoryChange(event) {
    state.subcategoriaSeleccionada = event.target.value;
    
    // Sincroniza el botón de escritorio correspondiente para que se marque como activo
    const buttonSelector = footwearSheets.includes(state.currentSheet) ? '#calzadoSubcatDesktop' : '#ropaSubcatDesktop';
    const buttonGroup = document.querySelectorAll(`${buttonSelector} button`);
    const correspondingButton = Array.from(buttonGroup).find(btn => btn.dataset.subcat === state.subcategoriaSeleccionada);
    updateActiveButton(buttonGroup, correspondingButton);

    updateURL();
    loadAndDisplayProducts();
}

// --- Otros manejadores de eventos ---
function handleSearch() { applySearchFilter(); }
function handleImageClick(event) { if (event.target.matches('.product img')) { DOM.modalImg.src = event.target.dataset.imgSrc; DOM.imgModal.style.display = "flex"; document.body.style.overflow = "hidden"; } }
function handleModalClose() { DOM.imgModal.style.display = "none"; document.body.style.overflow = ""; }
function handleScroll() { const isScrolled = document.body.scrollTop > 500 || document.documentElement.scrollTop > 500; DOM.scrollTopBtn.style.display = isScrolled ? "block" : "none"; }
function handleScrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function handlePopState(event) { if (event.state) { state = event.state; initializeAppState(); } }

// -----------------------------------------------------------------------------
// 5. INICIALIZACIÓN
// -----------------------------------------------------------------------------

/**
 * Función principal que se ejecuta al cargar la página. Configura todos los listeners.
 */
function init() {
    DOM.menuToggle.addEventListener('click', () => DOM.menu.classList.toggle('active'));
    DOM.categoryButtons.forEach(btn => btn.addEventListener('click', handleCategoryChange));
    DOM.desktopRopaButtons.forEach(btn => btn.addEventListener('click', handleSubcategoryChange));
    DOM.desktopCalzadoButtons.forEach(btn => btn.addEventListener('click', handleSubcategoryChange));
    DOM.mobileRopaSelect.addEventListener('change', handleMobileSubcategoryChange);
    DOM.mobileCalzadoSelect.addEventListener('change', handleMobileSubcategoryChange);
    DOM.searchInput.addEventListener('keyup', handleSearch);
    DOM.searchButton.addEventListener('click', handleSearch);
    DOM.scrollTopBtn.addEventListener('click', handleScrollTop);
    document.addEventListener('click', handleImageClick);
    DOM.imgModal.addEventListener('click', handleModalClose);
    document.addEventListener('keydown', (e) => e.key === "Escape" && handleModalClose());
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('popstate', handlePopState);
    
    initializeAppState();
    
    const numeroWhatsapp = textos[tipo].whatsapp;
    DOM.whatsappBtn.href = `https://wa.me/${numeroWhatsapp}`;
}

/**
 * Configura el estado inicial de la aplicación basándose en los parámetros de la URL.
 */
function initializeAppState() {
    const params = new URLSearchParams(window.location.search);
    state.currentSheet = params.get('cat') || 'Caballero';
    state.subcategoriaSeleccionada = params.get('subcat') || 'TODOS';
    DOM.searchInput.value = params.get('search') || '';
    DOM.pageTitle.textContent = textos[tipo].tituloPagina;

    // Configura la UI inicial
    updateSubcategoryFiltersUI(state.currentSheet);
    
    // Marca los botones correctos como activos
    const activeCatBtn = Array.from(DOM.categoryButtons).find(btn => btn.dataset.category === state.currentSheet);
    updateActiveButton(DOM.categoryButtons, activeCatBtn);

    const buttonSelector = footwearSheets.includes(state.currentSheet) ? '#calzadoSubcatDesktop' : '#ropaSubcatDesktop';
    const buttonGroup = document.querySelectorAll(`${buttonSelector} button`);
    const activeSubcatBtn = Array.from(buttonGroup).find(btn => btn.dataset.subcat === state.subcategoriaSeleccionada);
    updateActiveButton(buttonGroup, activeSubcatBtn);

    const mobileSelect = footwearSheets.includes(state.currentSheet) ? DOM.mobileCalzadoSelect : DOM.mobileRopaSelect;
    mobileSelect.value = state.subcategoriaSeleccionada;
    
    // Llama a la carga de datos UNA SOLA VEZ
    loadAndDisplayProducts();
}

/**
 * Objeto que contiene los prefijos de los códigos para filtrar cada subcategoría.
 */
const subcategorias = {
    // Ropa
    "BUZOS": ["BUZO", "CANG", "SUET", "PULO"],
    "CAMPERAS": ["CAMP", "PARK", "ROMP", "CHAQ", "CHAL", "PUFF", "ANOR"],
    "REMERAS": ["REME", "MUSC", "CHOM", "CAMI"], 
    "TOPS": ["TOPM", "TOPR", "TOPL", "TOPJ", "TOPD", "TOPC", "TOPB", "TOPP", "TOPS", "TOPT", "TOPG", "TOPA", "TOPH", "TOPF", "TOPI", "TOPU", "TOPV", "TOPL", "TOPN", "CORP"],
    "PANTALONES": ["PANT", "JEAN", "JOGG", "CARG", "BABU", "CHIN", "CHUP", "EPAN"],
    "CALZAS": ["CALZ"], "SHORTS": ["BERM", "SHOR", "POLL", "MALL"],
    // Calzado
    "Jaguar": ["1110", "1120"],
    "Gaelle": ["371", "382", "406", "426", "427", "430W", "431W", "432W", "434W", "435", "443", "444", "448", "449W", "451", "462W", "463W", "464", "466", "465W", "467", "469W", "471W", "472W", "473W", "474", "476", "481W", "490W", "493", "498W", "499W", "500W", "501"],
    "Maraton": ["4110"],
    "Havaianas": ["5110", "5310", "5210"],
    "I-RUN": ["3110", "3120"]
};