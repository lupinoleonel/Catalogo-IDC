// =================================================================================
// A R C H I V O   D E   C O N F I G U R A C I Ó N  -  I D C
// =================================================================================
// Descripción: Centraliza todas las variables y textos que pueden cambiar,
//              como los números de WhatsApp o las etiquetas de precios.
//              Determina si la vista es para minoristas o mayoristas.
// =================================================================================

// Obtener parámetros de la URL
const params = new URLSearchParams(window.location.search);
let tipo = params.get('tipo');

// Si el tipo viene por URL, lo guardamos en localStorage para persistencia
if (tipo) {
  localStorage.setItem('tipoCatalogo', tipo);
} else {
  // Si no viene por URL, tratamos de obtenerlo del localStorage
  tipo = localStorage.getItem('tipoCatalogo') || 'mayorista'; // 'mayorista' como valor por defecto
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