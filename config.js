/// config.js

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
let tipo = params.get('tipo');

// Si el tipo viene por URL, lo guardamos en localStorage
if (tipo) {
  localStorage.setItem('tipoCatalogo', tipo);
} else {
  // Si no viene por URL, tratamos de obtenerlo del localStorage
  tipo = localStorage.getItem('tipoCatalogo') || 'mayorista'; // Valor por defecto si no hay nada
}

// Define texto y datos personalizados según el tipo de catálogo
const textos = {
  mayorista: {
      titulo: "Catálogo Revendedores",
      tituloPagina: "IDC (Revendedores)",
      etiquetaPrecio: "Precio Mayorista",
      etiquetaPromo: "Sugerido de venta",
      whatsapp: "+5493512094844"
  },
  minorista: {
      titulo: "Catálogo Minorista",
      tituloPagina: "IDC (Minoristas)",
      etiquetaPrecio: "Precio",
      etiquetaPromo: "Efect / Trans",
      whatsapp: "+5493512429291"
  }
};