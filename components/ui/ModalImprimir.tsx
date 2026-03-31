export const ModalImprimir = ({ 
  isOpen, 
  onConfirm, 
  onCancel 
}: { 
  isOpen: boolean, 
  onConfirm: () => void, 
  onCancel: () => void 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      {/* Contenedor relativo para que la X se posicione respecto a este cuadro */}
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 relative">
        
        {/* BOTÓN "X" PARA CERRAR */}
        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"
        >
          <span className="text-xl font-black">✕</span>
        </button>

        <div className="text-center space-y-4">
          <div className="text-5xl">🖨️</div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic">¿Imprimir Ticket?</h3>
          <p className="text-gray-500 text-sm font-medium">El pedido se ha registrado correctamente en el sistema.</p>
          
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={onConfirm}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-orange-200 active:scale-95 transition-all uppercase"
            >
              SÍ, IMPRIMIR AHORA
            </button>
            <button 
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all uppercase"
            >
              SOLO GUARDAR (CERRAR)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
