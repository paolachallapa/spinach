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
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
        <div className="text-center space-y-4">
          <div className="text-5xl">🖨️</div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic">¿Imprimir Ticket?</h3>
          <p className="text-gray-500 text-sm font-medium">El pedido se ha registrado correctamente en el sistema.</p>
          
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={onConfirm}
              className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-orange-200 active:scale-95 transition-all"
            >
              SÍ, IMPRIMIR AHORA
            </button>
            <button 
              onClick={onCancel}
              className="w-full bg-gray-100 text-gray-400 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all"
            >
              SOLO GUARDAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};