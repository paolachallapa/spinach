'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Gastos({ gastos, alTerminar }: any) {
  const [concepto, setConcepto] = useState('')
  const [monto, setMonto] = useState('')

  const registrarGasto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!concepto || !monto) return

    // Insertamos asegurándonos de que monto sea un número
    const { error } = await supabase.from('gastos').insert([
      { 
        concepto: concepto.toUpperCase(), 
        monto: Number(monto) 
      }
    ])

    if (!error) {
      setConcepto('')
      setMonto('')
      // Es vital que alTerminar recargue los gastos en el Home
      if (alTerminar) await alTerminar()
      alert("✅ Gasto guardado")
    } else {
      alert("Error al guardar: " + error.message)
    }
  }

  // Lógica de fecha idéntica a Reportes/Tickets para evitar errores en Balance
  const hoyStr = new Date().toLocaleDateString('sv-SE')
  const gastosHoy = gastos?.filter((g: any) => {
    // Verificamos ambos posibles nombres de columna de fecha
    const fechaGasto = g.creado_at || g.created_at;
    if (!fechaGasto) return false;
    return new Date(fechaGasto).toLocaleDateString('sv-SE') === hoyStr;
  }) || []

  const totalGastosHoy = gastosHoy.reduce((acc: number, g: any) => acc + Number(g.monto), 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-2 md:px-0 animate-in fade-in duration-500 pb-10">
      
      {/* FORMULARIO RESPONSIVO */}
      <form onSubmit={registrarGasto} className="bg-white p-6 rounded-[2.5rem] shadow-xl border-t-8 border-red-500">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">💸 Salida de Efectivo</h2>
          <span className="bg-red-50 text-red-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">Hoy</span>
        </div>
        
        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="¿EN QUÉ SE GASTÓ? (EJ: PAPAS)" 
            value={concepto} 
            onChange={(e) => setConcepto(e.target.value)}
            className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-red-200 uppercase text-sm border-none"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-4 top-4 font-black text-gray-400">Bs</span>
              <input 
                type="number" 
                placeholder="0.00" 
                value={monto} 
                onChange={(e) => setMonto(e.target.value)}
                className="w-full p-4 pl-12 bg-gray-50 rounded-2xl font-black outline-none focus:ring-2 focus:ring-red-200 text-sm border-none"
              />
            </div>
            <button className="bg-red-500 text-white px-6 rounded-2xl font-black shadow-lg shadow-red-200 active:scale-95 transition uppercase text-xs">
              OK
            </button>
          </div>
        </div>
      </form>

      {/* LISTA DE GASTOS ESTILO TARJETA */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6 px-2">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Egresos Registrados</h3>
          <div className="text-right">
            <p className="text-[8px] font-bold text-gray-400 uppercase">Total Egresos</p>
            <p className="text-xl font-black text-red-600">Bs {totalGastosHoy.toFixed(2)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {gastosHoy.length > 0 ? (
            gastosHoy.map((g: any) => (
              <div key={g.id} className="flex justify-between items-center p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 group transition-all">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-800 uppercase leading-none mb-1">{g.concepto}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                    {new Date(g.creado_at || g.created_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <span className="text-sm font-black text-red-500 bg-white px-4 py-2 rounded-xl shadow-sm italic">
                  - Bs {Number(g.monto).toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-300 text-[10px] font-black uppercase italic tracking-widest">Sin gastos el día de hoy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}