
// config.js

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
let tipo = params.get('tipo');

// Si el tipo viene por URL, lo guardamos en localStorage
if (tipo) {
  localStorage.setItem('tipoCatalogo', tipo);
} else {
  // Si no viene por URL, tratamos de obtenerlo del localStorage
  tipo = localStorage.getItem('tipoCatalogo') || 'mayorista';
}

// Ahora sí podemos usar 'tipo' correctamente en el resto del archivo
const esMinorista = tipo === 'minorista';

// Define texto personalizado según el tipo de catálogo
const textos = {
  mayorista: {
      titulo: "Catálogo Revendedores",
      tituloPagina: "IDC (Revendedores)",
      etiquetaPrecio: "Precio Mayorista",
      etiquetaPromo: "Precio Sugerido"
  },
  minorista: {
      titulo: "Catálogo Minorista",
      tituloPagina: "IDC (Minoristas)",
      etiquetaPrecio: "Precio",
      etiquetaPromo: "Efectivo / Transferencia"
  }
};



