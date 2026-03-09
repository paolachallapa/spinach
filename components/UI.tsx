import React from 'react';

export const estilos = {
  card: "bg-white p-6 rounded-2xl shadow-sm border border-purple-100",
  input: "w-full p-4 bg-gray-50 border-none rounded-2xl font-bold focus:ring-2 focus:ring-purple-400 outline-none uppercase",
  formCard: "bg-white p-6 rounded-[2.5rem] shadow-xl border-t-8 border-purple-600",
  botonGuardar: "w-full bg-purple-700 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-lg hover:bg-purple-800 transition transform active:scale-95"
};

export function BotonAccion({ onClick, color, children, title, disabled }: any) {
  const variantes: any = {
    blue: "bg-blue-500 text-white",
    gray: "bg-gray-400 text-white",
    purple: "bg-purple-600 text-white shadow-md active:scale-90",
    red: "bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white",
    green: "bg-white border text-green-500 shadow-sm"
  };

  return (
    <button 
      onClick={onClick} 
      title={title}
      disabled={disabled}
      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all font-black shadow-sm ${variantes[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}

// menu.tsx
export function BotonAccionmenu({ onClick, color, children, title, disabled }: any) {
  const variantes: any = {
    blue: "bg-blue-500 text-white",
    gray: "bg-gray-400 text-white",
    purple: "bg-purple-600 text-white",
    red: "bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white",
    green: "bg-white border text-green-500 shadow-sm", // Para el + del carrito
    orange: "bg-orange-500 text-white shadow-xl"      // Para el total
  };

  return (
    <button 
      onClick={onClick} 
      title={title}
      disabled={disabled}
      className={`w-8 h-8 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-90 font-black ${variantes[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
}


// Dentro de components/UI.tsx

export const estilosTicket = `
  @page { size: auto; margin: 0mm; }
  body { 
    font-family: 'Courier New', monospace; 
    width: 280px; 
    padding: 15px; 
    margin: 0; 
    background-color: white;
  }
  .text-center { text-align: center; }
  .linea { border-top: 1px dashed black; margin: 8px 0; }
  .item { font-size: 12px; margin-bottom: 4px; display: flex; justify-content: space-between; }
  .nota-caja { 
    background: #f0f0f0; 
    border: 1px solid #ccc; 
    padding: 4px; 
    font-size: 15px; 
    margin-top: 5px; 
    font-style: italic;
  }
  .total { font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 5px; }
  .header h2 { margin: 0; font-size: 25px; }
  .header small { font-size: 15px; color: #666; }
`;


