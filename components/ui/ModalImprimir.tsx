import React from 'react';

export const ModalImprimir = ({ 
  isOpen, 
  onConfirm, 
  onCancel,
  isProcessing = false // Nueva prop para controlar el estado de carga
}: { 
  isOpen: boolean, 
  onConfirm: () => void, 
  onCancel: () => void,
  isProcessing?: boolean 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      {/* Contenedor relativo */}
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300 relative">
        
        {/* BOTÓN "X" PARA CERRAR - Deshabilitado si está procesando */}
        <button 
          onClick={onCancel}
          disabled={isProcessing}
          className={`absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-90 ${
            isProcessing ? 'bg-gray-50 text-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500'
          }`}
        >
          <span className="text-xl font-black">✕</span>
        </button>

        <div className="text-center space-y-4">
          <div className="text-5xl">
            {isProcessing ? '⏳' : '🖨️'}
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic">
            {isProcessing ? 'Guardando...' : '¿Imprimir Ticket?'}
          </h3>
          <p className="text-gray-500 text-sm font-medium">
            {isProcessing 
              ? 'Por favor espera, estamos registrando tu pedido...' 
              : 'El pedido se ha registrado correctamente en el sistema.'}
          </p>
          
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={onConfirm}
              disabled={isProcessing} // BLOQUEO FÍSICO
              className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg transition-all uppercase ${
                isProcessing 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-orange-500 text-white shadow-orange-200 active:scale-95'
              }`}
            >
              {isProcessing ? 'PROCESANDO...' : 'SÍ, IMPRIMIR AHORA'}
            </button>

            <button 
              onClick={onCancel}
              disabled={isProcessing}
              className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all uppercase disabled:opacity-50"
            >
              SOLO GUARDAR (CERRAR)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
