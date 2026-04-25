'use client'
import React from 'react'

interface Venta {
  id: string;
  precio_venta: number;
  creado_at: string;
  pago_ef: number;
  pago_qr: number;
  metodo_pago?: string;
}

export const ModalDesglosePagos = ({ 
  isOpen, 
  onClose, 
  titulo, 
  ventas, 
  tipo 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  titulo: string, 
  ventas: Venta[],
  tipo: 'ef' | 'qr' | 'pya'
}) => {
  if (!isOpen) return null;

  // Filtrar ventas que tengan monto en el tipo seleccionado
  const listaFiltrada = ventas.filter(v => {
    if (tipo === 'ef') return v.pago_ef > 0;
    if (tipo === 'qr') return v.pago_qr > 0;
    if (tipo === 'pya') return v.metodo_pago === 'pya';
    return false;
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-black text-gray-800 uppercase italic">{titulo}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-sm text-gray-400 hover:text-red-500">✕</button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {listaFiltrada.length === 0 ? (
            <p className="text-center text-gray-400 py-10 font-bold italic">No hay registros hoy</p>
          ) : (
            listaFiltrada.map((v) => (
              <div key={v.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <p className="text-lg font-black text-gray-800">
                    Bs {tipo === 'ef' ? v.pago_ef.toFixed(2) : (tipo === 'qr' ? v.pago_qr.toFixed(2) : v.precio_venta.toFixed(2))}
                  </p>
                  <p className="text-[10px] font-bold text-blue-500 uppercase">Pedido #{v.id.slice(0,5)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-gray-400">
                    {new Date(v.creado_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-gray-50 text-center">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fin del reporte</p>
        </div>
      </div>
    </div>
  );
};
