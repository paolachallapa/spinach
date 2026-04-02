'use client'

interface ModalAnulacionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pedidoInfo: { nro: number; cliente: string };
}

export default function ModalAnulacion({ isOpen, onClose, onConfirm, pedidoInfo }: ModalAnulacionProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🚫</span>
          </div>
          
          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">
            ¿Anular Pedido #{pedidoInfo.nro}?
          </h3>
          
          <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
            Estás por anular la venta de <span className="font-bold text-gray-800">{pedidoInfo.cliente}</span>. 
            El stock de los productos se restaurará automáticamente.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-lg shadow-red-100"
            >
              Confirmar Anulación
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black uppercase text-xs tracking-widest transition-all"
            >
              Volver Atrás
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
