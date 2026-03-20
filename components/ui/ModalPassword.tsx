'use client'
import { useState } from 'react'

export default function ModalPassword({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (pass: string) => void 
}) {
  const [password, setPassword] = useState('')

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="text-center mb-6">
          <div className="bg-orange-100 text-orange-600 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl">🔑</span>
          </div>
          <h3 className="text-xl font-black text-gray-800 uppercase italic">Cambiar Contraseña</h3>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Seguridad Spinach</p>
        </div>

        <input
          autoFocus
          type="password"
          placeholder="Nueva contraseña (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl mb-4 outline-none focus:border-orange-500 transition-all font-bold text-center"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 font-black text-gray-400 uppercase text-xs hover:bg-gray-100 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              if (password.length >= 6) {
                onConfirm(password);
                setPassword('');
              } else {
                alert("La contraseña debe tener al menos 6 caracteres");
              }
            }}
            className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-black uppercase text-xs shadow-lg shadow-orange-200 active:scale-95 transition"
          >
            Actualizar
          </button>
        </div>
      </div>
    </div>
  )
}