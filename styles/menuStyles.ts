export const menuStyles = {
  // Contenedores principales
  container: "flex flex-col lg:flex-row gap-6 w-full animate-in fade-in duration-500",
  
  // Sección de Caja y Totales
  cajaHoy: "bg-green-600 p-6 rounded-3xl text-center text-white shadow-lg",
  cajaHoyMonto: "text-4xl font-black italic",
  cajaHoyEtiqueta: "text-[10px] font-bold uppercase tracking-widest text-green-100",
  
  // Grid de Productos
  gridProductos: "grid grid-cols-1 sm:grid-cols-2 gap-3",
  btnProducto: (enStock: boolean) => `
    p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-all active:scale-95 
    ${enStock ? 'bg-white hover:border-orange-200' : 'bg-gray-100 opacity-50 cursor-not-allowed'}
  `,
  btnProductoPrecio: "bg-orange-500 text-white px-3 py-2 rounded-xl font-black text-xs",
  
  // Select a la carta
  contenedorCarta: "mt-6 p-4 bg-white rounded-3xl border-2 border-dashed border-gray-200",
  selectCarta: "w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl font-bold text-xs text-orange-600 outline-none focus:border-orange-500 transition-all",
  
  // Columna Derecha (Comanda)
  comandaCard: "bg-white p-6 rounded-[2.5rem] shadow-2xl border-t-8 border-orange-500 sticky top-6",
  itemCarrito: "flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 mb-2",
  totalTexto: "text-3xl font-black text-gray-800",
  btnConfirmar: "w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition hover:bg-orange-600"
};