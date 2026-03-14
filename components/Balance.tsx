'use client'
import { useState, useMemo } from 'react'
import { filtrarDatos, getWeekNumber } from '@/lib/BalanceUtils'
import { CardBalance, ItemGasto, IndicadorRendimiento } from './BalanceUI'

export default function Balance({ ventas, gastos }: any) {
  const [fechaReferencia, setFechaReferencia] = useState(new Date().toLocaleDateString('sv-SE'))
  const [modo, setModo] = useState<'semanal' | 'mensual' | 'anual'>('semanal')

  const data = useMemo(() => {
    const vF = ventas?.filter((v: any) => filtrarDatos(v.creado_at || v.created_at, modo, fechaReferencia)) || [];
    const gF = gastos?.filter((g: any) => filtrarDatos(g.created_at || g.creado_at, modo, fechaReferencia)) || [];

    const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
    const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

    return { ingresos, egresos, gF };
  }, [ventas, gastos, fechaReferencia, modo]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      
      {/* SELECTOR DE MODO Y FECHA */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          {['semanal', 'mensual', 'anual'].map((m) => (
            <button
              key={m}
              onClick={() => setModo(m as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                modo === m ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <span className="text-[9px] font-black text-gray-400 uppercase px-2">Fecha Ref:</span>
          <input 
            type="date" 
            value={fechaReferencia}
            onChange={(e) => setFechaReferencia(e.target.value)}
            className="bg-transparent font-black text-sm text-blue-600 outline-none"
          />
        </div>
      </div>

      {/* TARJETAS DE TOTALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardBalance titulo={`Ingresos ${modo}`} monto={data.ingresos} color="green" />
        <CardBalance titulo={`Gastos ${modo}`} monto={data.egresos} color="red" />
        <CardBalance titulo="Saldo Neto" monto={data.ingresos - data.egresos} esSaldo={true} />
      </div>

      {/* INDICADOR DE SALUD FINANCIERA */}
      <IndicadorRendimiento ingresos={data.ingresos} egresos={data.egresos} />

      {/* LISTADO DE EGRESOS */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50">
        <h3 className="text-center text-[10px] font-black text-gray-300 uppercase mb-6 tracking-[0.4em] italic">
          Detalle de Egresos - Vista {modo}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.gF.length > 0 ? (
            data.gF.map((g: any, i: number) => (
              <ItemGasto key={i} concepto={g.concepto} fecha={g.created_at} monto={g.monto} />
            ))
          ) : (
            <div className="col-span-2 py-10 text-center text-gray-300 text-[10px] font-black uppercase italic">
              Sin egresos registrados en este periodo
            </div>
          )}
        </div>
      </div>
    </div>
  )
}