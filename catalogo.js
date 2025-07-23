// Espera a que todo el contenido del HTML esté cargado antes de ejecutar el script.
document.addEventListener('DOMContentLoaded', init);

// -----------------------------------------------------------------------------
// 1. ESTADO DE LA APLICACIÓN
// -----------------------------------------------------------------------------
let state = {
    currentSheet: 'Caballero',
    subcategoriaSeleccionada: 'TODOS'
};

// -----------------------------------------------------------------------------
// 2. ELEMENTOS DEL DOM
// -----------------------------------------------------------------------------
const DOM = {
    pageTitle: document.getElementById('catalogo-title'),
    menuToggle: document.getElementById('menu-toggle'),
    menu: document.getElementById('menu'),
    categoryButtons: document.querySelectorAll('.categoria-selector button'),
    searchInput: document.getElementById('search'),
    searchButton: document.querySelector('.search-container button'),
    
    // Seleccionamos TODOS los botones y selects de subcategorías
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
// 3. FUNCIONES DE RENDERIZADO Y UI
// -----------------------------------------------------------------------------
/**
 * Muestra los productos en el contenedor principal.
 * @param {Array} products - Un array de objetos de producto.
 */

function formatPrice(value) {
    if (value === null || value === undefined) return '0';
    return parseFloat(value).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function updateActiveButton(buttonGroup, activeButton) {
    buttonGroup.forEach(btn => btn.classList.remove('active'));
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function updateBanner() {
    DOM.bannerImages.forEach(img => img.classList.add('hidden'));
    let bannerId = '';
    const isFootwear = state.currentSheet === 'Calzado';
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

function updateURL() {
    const searchTerm = DOM.searchInput.value || '';
    const url = `?tipo=${tipo}&cat=${state.currentSheet}&subcat=${state.subcategoriaSeleccionada}&search=${encodeURIComponent(searchTerm)}`;
    history.pushState(state, '', url);
}

function renderProducts(products) {
    DOM.productsContainer.innerHTML = ''; // Limpia el contenedor.

    if (products.length === 0) {
        DOM.productsContainer.innerHTML = '<p class="no-products">No se encontraron productos para esta selección.</p>';
        return;
    }

    products.forEach(item => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product';

        // --- LÓGICA DE ETIQUETAS ACTUALIZADA ---
        // Asigna una clase según la palabra clave en el stock.
        // Tiene prioridad: Nuevo > Reingreso > Limitado.
        if (item.stock.includes("nuevo!")) {
            productDiv.classList.add('producto-nuevo');
        } else if (item.stock.includes("reingreso!")) {
            productDiv.classList.add('producto-reingreso');
        } else if (item.stock.includes("stock limitado")) {
            productDiv.classList.add('producto-limitado');
        }

        // --- LÓGICA DE RENDERIZADO UNIFICADA ---
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

// -----------------------------------------------------------------------------
// 4. LÓGICA DE DATOS Y FILTRADO
// -----------------------------------------------------------------------------
async function loadAndRenderProducts() {
    DOM.productsContainer.innerHTML = '<p class="loading">Cargando productos...</p>';
    const baseURL = `https://docs.google.com/spreadsheets/d/1eWYNOMN0yQ_f8sOpSQvyHmwCAaohESkC4D73bEs60r8/gviz/tq?tqx=out:json&tq_nocache=${Date.now()}&sheet=`;
    
    try {
        const response = await fetch(baseURL + state.currentSheet);
        const text = await response.text();
        const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const jsonData = JSON.parse(jsonText);
        const rows = jsonData.table.rows;

        const allProducts = rows.map(row => {
            let producto; 

            if (state.currentSheet === 'Calzado') {
                // --- LÓGICA DE LECTURA A PRUEBA DE ERRORES ---
                // Priorizamos el valor formateado 'f' (que siempre es texto) sobre el valor crudo 'v'.
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
                    producto.precios = [
                        { label: 'Precio', value: row.c[3]?.v || 0 }
                    ];
                }
            } else {
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

        const filteredProducts = filterProductsBySubcategory(allProducts);
        renderProducts(filteredProducts);
        applySearchFilter();
        updateBanner();

    } catch (error) {
        DOM.productsContainer.innerHTML = '<p class="error">Error al cargar productos.</p>';
        console.error('Error cargando productos:', error);
    }
}

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

    // --- CÓDIGO TEMPORAL PARA DEPURAR ---
    // Imprime en la consola los filtros que se están usando para la marca seleccionada.
    console.log(`--- Depurando Filtro para '${subcategoriaSeleccionada}' ---`);
    console.log("Filtros a aplicar:", filtros);
    
    return products.filter(p => {
        const tieneMatch = filtros.some(filtro => p.tipoPrenda.startsWith(filtro));
        
        // Imprime la comparación para cada producto, así vemos qué pasa.
        console.log(`Producto: '${p.tipoPrenda}' | ¿Comienza con algún filtro? -> ${tieneMatch}`);
        
        return tieneMatch;
    });
}

function applySearchFilter() {
    const searchTerm = DOM.searchInput.value.toLowerCase();
    const products = document.querySelectorAll(".product");
    products.forEach(product => {
        const name = product.querySelector("h4").textContent.toLowerCase();
        product.style.display = name.includes(searchTerm) ? "block" : "none";
    });
}

// -----------------------------------------------------------------------------
// 5. MANEJADORES DE EVENTOS (EVENT HANDLERS)
// -----------------------------------------------------------------------------
function handleCategoryChange(event) {
    state.currentSheet = event.target.dataset.category;
    state.subcategoriaSeleccionada = "TODOS";
    updateActiveButton(DOM.categoryButtons, event.target);

    const ropaDesktop = document.getElementById('ropaSubcatDesktop');
    const ropaMobile = document.getElementById('ropaSubcatMobile');
    const calzadoDesktop = document.getElementById('calzadoSubcatDesktop');
    const calzadoMobile = document.getElementById('calzadoSubcatMobile');

    if (state.currentSheet === 'Calzado') {
        ropaDesktop.style.display = 'none';
        ropaMobile.style.display = 'none';
        calzadoDesktop.style.display = '';
        calzadoMobile.style.display = '';
        updateActiveButton(DOM.desktopCalzadoButtons, DOM.desktopCalzadoButtons[0]);
        DOM.mobileCalzadoSelect.value = "TODOS";
    } else if (state.currentSheet === 'Accesorios') {
        ropaDesktop.style.display = 'none';
        ropaMobile.style.display = 'none';
        calzadoDesktop.style.display = 'none';
        calzadoMobile.style.display = 'none';
    } else { // Caballero y Dama
        ropaDesktop.style.display = '';
        ropaMobile.style.display = '';
        calzadoDesktop.style.display = 'none';
        calzadoMobile.style.display = 'none';
        updateActiveButton(DOM.desktopRopaButtons, DOM.desktopRopaButtons[0]);
        DOM.mobileRopaSelect.value = "TODOS";
    }
    
    updateURL();
    loadAndRenderProducts();
}

function handleSubcategoryChange(event) {
    state.subcategoriaSeleccionada = event.target.dataset.subcat;
    updateActiveButton(DOM.desktopRopaButtons, event.target);
    updateActiveButton(DOM.desktopCalzadoButtons, event.target);
    DOM.mobileRopaSelect.value = state.subcategoriaSeleccionada;
    DOM.mobileCalzadoSelect.value = state.subcategoriaSeleccionada;
    updateURL();
    loadAndRenderProducts();
}

function handleMobileSubcategoryChange(event) {
    state.subcategoriaSeleccionada = event.target.value;
    const correspondingRopaBtn = Array.from(DOM.desktopRopaButtons).find(btn => btn.dataset.subcat === state.subcategoriaSeleccionada);
    updateActiveButton(DOM.desktopRopaButtons, correspondingRopaBtn);
    const correspondingCalzadoBtn = Array.from(DOM.desktopCalzadoButtons).find(btn => btn.dataset.subcat === state.subcategoriaSeleccionada);
    updateActiveButton(DOM.desktopCalzadoButtons, correspondingCalzadoBtn);
    updateURL();
    loadAndRenderProducts();
}

function handleSearch() { applySearchFilter(); }
function handleImageClick(event) { if (event.target.matches('.product img')) { DOM.modalImg.src = event.target.dataset.imgSrc; DOM.imgModal.style.display = "flex"; document.body.style.overflow = "hidden"; } }
function handleModalClose() { DOM.imgModal.style.display = "none"; document.body.style.overflow = ""; }
function handleScroll() { const isScrolled = document.body.scrollTop > 500 || document.documentElement.scrollTop > 500; DOM.scrollTopBtn.style.display = isScrolled ? "block" : "none"; }
function handleScrollTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
function handlePopState(event) { if (event.state) { state = event.state; initializeAppState(); } }

// -----------------------------------------------------------------------------
// 6. INICIALIZACIÓN
// -----------------------------------------------------------------------------
function init() {
    DOM.menuToggle.addEventListener('click', () => DOM.menu.classList.toggle('active'));
    DOM.categoryButtons.forEach(btn => btn.addEventListener('click', handleCategoryChange));
    
    // Añadimos listeners para AMBOS grupos de subcategorías
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

function initializeAppState() {
    const params = new URLSearchParams(window.location.search);
    state.currentSheet = params.get('cat') || 'Caballero';
    state.subcategoriaSeleccionada = params.get('subcat') || 'TODOS';
    DOM.searchInput.value = params.get('search') || '';
    DOM.pageTitle.textContent = textos[tipo].tituloPagina;

    // --- LÓGICA DE INICIO SIMPLIFICADA Y DIRECTA ---

    // 1. Muestra los filtros de subcategoría correctos sin disparar eventos
    const ropaDesktop = document.getElementById('ropaSubcatDesktop');
    const ropaMobile = document.getElementById('ropaSubcatMobile');
    const calzadoDesktop = document.getElementById('calzadoSubcatDesktop');
    const calzadoMobile = document.getElementById('calzadoSubcatMobile');

    if (state.currentSheet === 'Calzado') {
        ropaDesktop.style.display = 'none';
        ropaMobile.style.display = 'none';
        calzadoDesktop.style.display = '';
        calzadoMobile.style.display = '';
    } else if (state.currentSheet === 'Accesorios') {
        ropaDesktop.style.display = 'none';
        ropaMobile.style.display = 'none';
        calzadoDesktop.style.display = 'none';
        calzadoMobile.style.display = 'none';
    } else { // Caballero y Dama
        ropaDesktop.style.display = '';
        ropaMobile.style.display = '';
        calzadoDesktop.style.display = 'none';
        calzadoMobile.style.display = 'none';
    }

    // 2. Marca los botones correctos como activos
    const activeCatBtn = Array.from(DOM.categoryButtons).find(btn => btn.dataset.category === state.currentSheet);
    updateActiveButton(DOM.categoryButtons, activeCatBtn);

    const activeSubcatBtn = document.querySelector(`#ropaSubcatDesktop button[data-subcat='${state.subcategoriaSeleccionada}'], #calzadoSubcatDesktop button[data-subcat='${state.subcategoriaSeleccionada}']`);
    if(activeSubcatBtn) {
        if(state.currentSheet === 'Calzado') {
            updateActiveButton(DOM.desktopCalzadoButtons, activeSubcatBtn);
            DOM.mobileCalzadoSelect.value = state.subcategoriaSeleccionada;
        } else {
            updateActiveButton(DOM.desktopRopaButtons, activeSubcatBtn);
            DOM.mobileRopaSelect.value = state.subcategoriaSeleccionada;
        }
    }
    
    // 3. Llama a la carga de datos UNA SOLA VEZ
    loadAndRenderProducts();
}

// Objeto de mapeo de subcategorías con todos tus códigos
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
    "Gaelle": ["371", "382", "406", "426", "427", "430W", "431W", "432W", "434W", "435", "443", "444", "448", "449W", "451", "462W", "463W", "464", "466", "465W", "467", "469W", "471W", "472W", "473W", "474", "476", "481W", "490W", "493", "498", "499W", "500W", "501"],
    "Maraton": ["4110"],
    "Havaianas": ["5110", "5310", "5210"],
    "I-RUN": ["3110", "3120"]
};