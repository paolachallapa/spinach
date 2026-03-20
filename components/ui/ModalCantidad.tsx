'use client'
import { useState, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (valor: number) => void
  titulo: string
  valorInicial?: number
}

export default function ModalCantidad({ isOpen, onClose, onConfirm, titulo, valorInicial = 0 }: Props) {
  const [cantidad, setCantidad] = useState(valorInicial)

  useEffect(() => {
    if (isOpen) setCantidad(valorInicial)
  }, [isOpen, valorInicial])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in duration-200">
        <h3 className="text-center font-black text-gray-800 uppercase italic mb-4">{titulo}</h3>
        
        <input
          autoFocus
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          onKeyDown={(e) => e.key === 'Enter' && onConfirm(cantidad)}
          className="w-full text-3xl font-black text-center p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl mb-6 outline-none focus:border-blue-500 transition-all"
        />

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 font-black text-gray-400 uppercase text-[10px] hover:bg-gray-100 rounded-xl transition">
            Cancelar
          </button>
          <button 
            onClick={() => onConfirm(cantidad)}
            className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-black uppercase text-[10px] shadow-lg active:scale-95 transition"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  )
}