'use client'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  titulo: string
  mensaje: string
  textoBoton?: string
  colorBoton?: string
}

export default function ModalConfirmar({ 
  isOpen, onClose, onConfirm, titulo, mensaje, textoBoton = "Eliminar", colorBoton = "bg-red-500" 
}: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in duration-200 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <h3 className="font-black text-gray-800 uppercase italic mb-2">{titulo}</h3>
        <p className="text-gray-500 text-[11px] font-bold uppercase mb-6 leading-tight">{mensaje}</p>
        
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 font-black text-gray-400 uppercase text-[10px] hover:bg-gray-100 rounded-xl transition">
            Volver
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 ${colorBoton} text-white py-3 rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition`}
          >
            {textoBoton}
          </button>
        </div>
      </div>
    </div>
  )
}