// Catalogo.js

window.addEventListener('DOMContentLoaded', () => {
    document.title = textos[tipo].tituloPagina;
    const titulo = document.getElementById("catalogo-title");
    if (titulo) {
        titulo.innerText = textos[tipo].titulo;
    }
});

// Función para mostrar el menú al hacer clic en el botón de menú
document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('menu-toggle');
    const menu = document.getElementById('menu');

    if (toggleButton && menu) {
        toggleButton.addEventListener('click', function () {
            menu.classList.toggle('active');
        });
    }
});

// Script principal
let currentSheet = 'Caballero';

function cambiarCategoria(elemento, categoria) {
    currentSheet = categoria;
    subcategoriaSeleccionada = "TODOS"; // Reset subcategoría
    document.getElementById("subcategoria").value = "TODOS"; // Actualiza selector visual
    actualizarActivos('categoria-selector', elemento);
    actualizarActivos('subcategoria-selector', null);
    history.pushState({ categoria }, '', `?cat=${categoria}`);
    loadProducts();
}


// Función para seleccionar subcategorías (esta función ya existe, pero la mantengo para el contexto)
function filterProducts() {
    const searchTerm = document.getElementById("search").value.toLowerCase();
    // La lógica de filtrado por subcategoría y búsqueda se aplica en loadProducts
    // Esto asegura que la URL refleje correctamente los filtros activos.
    history.pushState({ categoria: currentSheet, subcategoria: subcategoriaSeleccionada, search: searchTerm }, '', `?cat=${currentSheet}&subcat=${subcategoriaSeleccionada}&search=${encodeURIComponent(searchTerm)}`);

    const products = document.querySelectorAll(".product");
    products.forEach(product => {
        const name = product.querySelector("h4").textContent.toLowerCase();
        product.style.display = name.includes(searchTerm) ? "block" : "none";
    });
}


// Manejo del botón atrás del navegador
window.addEventListener('popstate', function (event) {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat') || 'Caballero';
    const subcat = params.get('subcat') || 'TODOS';
    const search = params.get('search') || '';

    currentSheet = cat;
    subcategoriaSeleccionada = subcat;

    // Actualizar buscador
    document.getElementById("search").value = search;
    // Actualizar subcategoría en el selector móvil
    document.getElementById("subcategoria").value = subcat;


    // Actualizar botones visuales de categoría
    const catContainer = document.getElementsByClassName('categoria-selector')[0];
    if (catContainer) {
        const botones = catContainer.getElementsByTagName('button');
        for (let boton of botones) {
            boton.classList.toggle('active', boton.textContent.trim().toLowerCase() === cat.toLowerCase());
        }
    }

    // Actualizar botones visuales de subcategoría (para desktop)
    const subcatContainer = document.getElementsByClassName('subcategoria-selector')[0];
    if (subcatContainer) {
        const botones = subcatContainer.getElementsByTagName('button');
        // Asegúrate de encontrar el botón correcto basado en el texto y no solo en "includes"
        for (let boton of botones) {
            let botonText = boton.textContent.trim().toUpperCase();
            // Algunas opciones de subcategoría tienen texto más largo, necesitamos mapearlas
            let mappedSubcat = subcat;
            if (subcat === 'CAMPERAS') mappedSubcat = 'CAMPERAS / ROMPEVIENTOS';
            else if (subcat === 'REMERAS') mappedSubcat = 'REMERAS / MUSCULOSAS / CHOMBAS';
            else if (subcat === 'PANTALONES') mappedSubcat = 'BABUCHAS / JOGGINGS / PANTALONES';
            else if (subcat === 'SHORTS') mappedSubcat = 'BERMUDAS / SHORTS';


            boton.classList.toggle('active', botonText.includes(mappedSubcat) || botonText === mappedSubcat);
        }
    }

    // Recargar productos filtrados
    loadProducts();
});



// Cargar productos desde Google Sheets
async function loadProducts() {

    const baseURL = 'https://docs.google.com/spreadsheets/d/1eWYNOMN0yQ_f8sOpSQvyHmwCAaohESkC4D73bEs60r8/gviz/tq?tqx=out:json&sheet=';
    const productsContainer = document.getElementById('products');
    productsContainer.innerHTML = '<p class="loading">Cargando productos...</p>'; // Mostrar indicador de carga

    try {
        const response = await fetch(baseURL + currentSheet);
        const text = await response.text();
        const jsonText = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
        const jsonData = JSON.parse(jsonText);
        const rows = jsonData.table.rows;

        let newProducts = [];
        let regularProducts = [];

        rows.forEach(row => {
            const item = {
                nombre: row.c[1]?.v || "Sin nombre",
                precio: tipo === 'mayorista' ? row.c[2]?.v || 0 : row.c[4]?.v || 0,
                precioPromo: tipo === 'mayorista' ? row.c[4]?.v || 0 : row.c[3]?.v || 0,
                imagen: row.c[5]?.v && row.c[5].v.trim() !== "" ? row.c[5].v : "img/imagen-generica.png",
                stock: row.c[6]?.v ? String(row.c[6].v).trim().toLowerCase() : "No disponible"
            };
            const tipoPrenda = row.c[0]?.v ? row.c[0].v.substring(0, 4).toUpperCase() : "";

            // Verificar si el producto debe ser mostrado
            if (item.stock.toLowerCase().includes("no disponible")) {
                return; // No mostrar productos sin stock disponible
            }

            // Filtrar por subcategoría, si no es "NUEVOS"
            if (subcategoriaSeleccionada === "NUEVOS") {
                if (item.stock.includes("nuevo!")) { // Solo los "Nuevos!" cuando la subcategoría es "NUEVOS"
                    newProducts.push(item);
                }
                return; // Si estamos en "NUEVOS", no procesamos los regulares aquí
            } else if (subcategoriaSeleccionada !== "TODOS") {
                const filtros = subcategorias[subcategoriaSeleccionada] || [];
                if (!filtros.includes(tipoPrenda)) {
                    return; // Si no está en los filtros permitidos para la subcategoría, no lo mostramos
                }
            }


            // Separar productos "Nuevos!" para mostrarlos primero
            if (item.stock.includes("Nuevo!")) {
                newProducts.push(item);
            } else {
                regularProducts.push(item);
            }
        });

        // Combinar arrays: Nuevos primero, luego Regulares
        const productsToDisplay = newProducts.concat(regularProducts);

        productsContainer.innerHTML = ''; // Limpiar el contenedor antes de añadir los productos

        if (productsToDisplay.length === 0) {
            productsContainer.innerHTML = '<p class="no-products">No se encontraron productos para esta selección.</p>';
            return;
        }

        productsToDisplay.forEach(item => {
            const productDiv = document.createElement('div');
            productDiv.className = 'product';

            productDiv.innerHTML = `
                    <img src="${item.imagen}" alt="${item.nombre}" onerror="this.onerror=null; this.src='img/imagen-generica.png';">
                    <h4>${item.nombre}</h4>
                    <div class="price-container">
                    <p class="price">${textos[tipo].etiquetaPrecio}: $${formatPrice(item.precio)}</p>
                    <p class="promo-price">${textos[tipo].etiquetaPromo}: $${formatPrice(item.precioPromo)}</p>
                    </div>
                `;
            productsContainer.appendChild(productDiv);
        });

        // Después de cargar los productos, aplicar el filtro de búsqueda
        filterProducts(); // Llamar a filterProducts para aplicar el término de búsqueda
    } catch (error) {
        productsContainer.innerHTML = '<p class="error">Error al cargar productos.</p>';
        console.error('Error cargando productos:', error);
    }
}
function formatPrice(value) {
    if (value === null || value === undefined) return '0'; // Manejo de valores nulos o indefinidos
    return parseFloat(value).toLocaleString('es-AR'); // Formato argentino
}


// Carga inicial desde parámetros en la URL

let subcategoriaSeleccionada = "TODOS";

const subcategorias = {
    "TODOS": [],
    "NUEVOS": [], // Nueva subcategoría para productos "Nuevos!"
    "BUZOS": ["BUZO", "CANG", "SUET", "PULO"],
    "CAMPERAS": ["CAMP", "PARK", "ROMP", "CHAQ", "CHAL", "PUFF", "ANOR"],
    "REMERAS": ["REME", "MUSC", "CHOM", "CAMI"],
    "TOPS": ["TOPM", "TOPR", "TOPL", "TOPJ", "TOPD", "TOPC", "TOPB", "TOPP", "TOPS", "TOPT", "TOPG", "TOPA", "TOPH", "TOPF", "TOPI", "TOPU", "TOPV", "TOPL", "TOPN", "CORP"],
    "PANTALONES": ["PANT", "JEAN", "JOGG", "CARG", "BABU", "CHIN", "CHUP", "EPAN"],
    "CALZAS": ["CALZ"],
    "SHORTS": ["BERM", "SHOR", "POLL", "MALL"],
};

// Función para filtrar subcategoría
function filtrarSubcategoria(subcat, elemento) {
    subcategoriaSeleccionada = subcat;
    actualizarActivos('subcategoria-selector', elemento);
    const searchTerm = document.getElementById("search").value.toLowerCase();
    history.pushState({ categoria: currentSheet, subcategoria: subcategoriaSeleccionada, search: searchTerm }, '', `?cat=${currentSheet}&subcat=${subcat}&search=${encodeURIComponent(searchTerm)}`);
    loadProducts();
}

// Función para seleccionar subcategoría desde el menú desplegable
function seleccionarSubcategoriaDesdeMenu() {
    const select = document.getElementById("subcategoria");
    const subcat = select.value;

    subcategoriaSeleccionada = subcat;

    // Guardamos en la URL
    const searchTerm = document.getElementById("search").value.toLowerCase();
    history.pushState(
        { categoria: currentSheet, subcategoria: subcat, search: searchTerm },
        '',
        `?cat=${currentSheet}&subcat=${subcat}&search=${encodeURIComponent(searchTerm)}`
    );

    loadProducts();
}

// Función que actualiza los botones activos
function actualizarActivos(selectorClass, elementoActivo) {
    const container = document.getElementsByClassName(selectorClass)[0];
    if (container) {
        const botones = container.getElementsByTagName('button');
        for (let boton of botones) {
            boton.classList.remove('active');
        }
        if (elementoActivo) {
            elementoActivo.classList.add('active');
        }
    }
}

window.onload = () => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('cat') || 'Caballero';
    const subcat = params.get('subcat') || 'TODOS'; // Leer la subcategoría de la URL
    const search = params.get('search') || '';

    currentSheet = cat;
    subcategoriaSeleccionada = subcat; // Establecer la subcategoría al cargar

    // Asegurarse de que los botones de categoría y subcategoría estén activos al cargar
    const catButtons = document.querySelectorAll('.categoria-selector button');
    catButtons.forEach(btn => {
        if (btn.textContent.trim().toLowerCase() === cat.toLowerCase()) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    const subcatButtons = document.querySelectorAll('.subcategoria-selector button');
    subcatButtons.forEach(btn => {
        // Normaliza el texto del botón y el valor de la subcategoría para una comparación precisa
        let btnText = btn.textContent.trim().toUpperCase();
        let currentSubcatValue = subcat.toUpperCase();

        // Manejo de textos más largos en los botones
        if (currentSubcatValue === 'CAMPERAS') currentSubcatValue = 'CAMPERAS / ROMPEVIENTOS';
        else if (currentSubcatValue === 'REMERAS') currentSubcatValue = 'REMERAS / MUSCULOSAS';
        else if (currentSubcatValue === 'PANTALONES') currentSubcatValue = 'BABUCHAS / JOGGINGS / PANTALONES';
        else if (currentSubcatValue === 'SHORTS') currentSubcatValue = 'BERMUDAS / SHORTS';
        else if (currentSubcatValue === 'TODOS') currentSubcatValue = 'TODOS';
        else if (currentSubcatValue === 'NUEVOS') currentSubcatValue = 'NUEVOS';


        if (btnText === currentSubcatValue) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Actualizar el selector de subcategoría móvil
    const mobileSubcatSelect = document.getElementById("subcategoria");
    if (mobileSubcatSelect) {
        mobileSubcatSelect.value = subcat;
    }

    loadProducts().then(() => {
        document.getElementById("search").value = search;
        filterProducts(); // Asegúrate de aplicar el filtro de búsqueda después de cargar los productos
    });
};


// Ampliar imagen al hacer click y mostrar en modal
const modal = document.getElementById("imgModal");
const modalImg = modal.querySelector("img");

document.addEventListener("click", function (e) {
    if (e.target.tagName === "IMG" && e.target.closest(".product")) {
        modalImg.src = e.target.src;
        modal.style.display = "flex";
        document.body.style.overflow = "hidden";
        modal.focus(); // Asegurarse de que el modal tenga foco para capturar eventos de teclado

        // Añadir el hash #modal solo si no está ya presente
        if (location.hash !== "#modal") {
            // Reemplazar el estado actual en lugar de empujar uno nuevo
            // Esto evita que history.back() recargue la página en el cierre.
            history.replaceState({ modalOpen: true }, "", "#modal");
        }
    }
});

// Manejo del cierre del modal por clic en el fondo
modal.addEventListener("click", function (e) {
    if (e.target === modal) {
        cerrarModal(); // Llama a cerrarModal sin argumentos especiales para clic/escape
        e.stopPropagation();
        e.preventDefault();
    }
});

// Manejo del cierre del modal por tecla Escape
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.style.display === "flex") {
        cerrarModal(); // Llama a cerrarModal sin argumentos especiales para clic/escape
        e.stopPropagation();
        e.preventDefault();
    }
});

function cerrarModal() {
    modal.style.display = "none";
    modalImg.src = "";
    document.body.style.overflow = "";

    // Si el hash es #modal, lo eliminamos sin afectar el historial de navegación
    // Esto previene la recarga al cerrar el modal programáticamente.
    if (location.hash === "#modal") {
        history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
}

// Manejo del cierre del modal al usar el botón "atrás" del navegador
window.addEventListener("popstate", function (event) {
    // Si el modal está abierto y el hash NO es "#modal" (es decir, el navegador
    // ya retrocedió eliminando el hash), entonces cerramos el modal visualmente.
    if (modal.style.display === "flex" && location.hash !== "#modal") {
        modal.style.display = "none";
        modalImg.src = "";
        document.body.style.overflow = "";
    }
    // Si el hash SIGUE siendo "#modal" (ej. si presionan atrás y el navegador no lo quita por alguna razón),
    // o si el modal ya estaba cerrado, no hacemos nada extra para evitar recargas.
});

// Botón para volver al inicio de la página
const scrollTopBtn = document.getElementById("scrollTopBtn");

window.onscroll = function () {
    if (document.body.scrollTop > 500 || document.documentElement.scrollTop > 500) {
        scrollTopBtn.style.display = "block";
    } else {
        scrollTopBtn.style.display = "none";
    }
};

scrollTopBtn.onclick = function () {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
};