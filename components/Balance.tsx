'use client'
import { useState, useMemo } from 'react'
import { calcularBalance } from '@/hooks/BalanceLogic'
import { CardBalance, ItemGasto, IndicadorRendimiento, SelectorRango, TablaGananciasPorDia } from './BalanceUI'

export default function Balance({ ventas, gastos }: any) {
  const anioActual = new Date().getFullYear()
  const hoyFormateado = new Date().toLocaleDateString('sv-SE') // "2026-05-25"

  const [fechaInicio, setFechaInicio] = useState(hoyFormateado)
  const [fechaFin, setFechaFin] = useState(hoyFormateado)
  
  const [modo, setModo] = useState<'semanal' | 'mensual' | 'anual' | 'rango'>('semanal')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'ingresos' | 'egresos'>('todos')

  const cambiarModo = (nuevoModo: 'semanal' | 'mensual' | 'anual' | 'rango') => {
    setModo(nuevoModo)
    if (nuevoModo === 'rango') {
      setFechaInicio(`${anioActual}-01-01`)
      setFechaFin(hoyFormateado)
    } else {
      setFechaInicio(hoyFormateado)
      setFechaFin(hoyFormateado)
    }
  }

  const ventasValidas = useMemo(() => {
    return ventas?.filter((v: any) => v.estado !== 'anulado') || [];
  }, [ventas]);

  const data = useMemo(() => {
    let fInicio = fechaInicio
    let fFin = fechaFin

    if (modo === 'semanal') {
      const fechaRef = new Date(fechaInicio + 'T00:00:00')
      const diaSemana = fechaRef.getDay()
      const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1
      const lunesActual = new Date(fechaRef.getTime() - diasHastaLunes * 24 * 60 * 60 * 1000)
      
      // Forzamos el orden de la semana: de lunes a hoy
      fInicio = lunesActual.toLocaleDateString('sv-SE')
      fFin = fechaInicio
    }

    return calcularBalance(ventasValidas, gastos, modo, fInicio, fFin, tipoFiltro);
  }, [ventasValidas, gastos, modo, fechaInicio, fechaFin, tipoFiltro]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 print:p-12 print:max-w-full print:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <style jsx global>{`
        @media print {
          @page { margin: 0; }
          body { margin: 0; }
        }
      `}</style>
      
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden mx-2">
        <div className="flex bg-gray-100 p-1 rounded-2xl flex-wrap gap-1">
          {['semanal', 'mensual', 'anual', 'rango'].map((m) => (
            <button
              key={m}
              onClick={() => cambiarModo(m as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                modo === m ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'
              }`}
            >
              {m === 'rango' ? 'Rango 📅' : m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {modo !== 'rango' && (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase px-2">Fecha Ref:</span>
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={(e) => {
                  setFechaInicio(e.target.value)
                  setFechaFin(e.target.value)
                }}
                className="bg-transparent font-black text-sm text-blue-600 outline-none"
              />
            </div>
          )}

          <button
            onClick={() => window.print()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase px-4 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 tracking-wider"
          >
            <span>🖨️</span> Imprimir PDF
          </button>
        </div>
      </div>

      <div className="hidden print:block border-b-2 border-gray-200 pb-4 mb-6 text-center">
        <h1 className="text-2xl font-black text-gray-800 uppercase tracking-widest">SPINACH RESTAURANT</h1>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mt-1">Reporte Consolidado de Balance de Caja</p>
        <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider mt-1.5 bg-blue-50/60 inline-block px-4 py-1 rounded-full">
          Periodo ({modo}): {modo === 'rango' ? `${fechaInicio} hasta ${fechaFin}` : fechaInicio}
          {modo === 'rango' && ` • Filtro: ${tipoFiltro.toUpperCase()}`}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-4 px-2 print:px-0">
        <CardBalance titulo={`Ingresos ${modo}`} monto={data.ingresos} color="green" />
        <CardBalance titulo={`Gastos ${modo}`} monto={data.egresos} color="red" />
        <CardBalance titulo="Saldo Neto" monto={data.ingresos - data.egresos} esSaldo={true} />
      </div>

      <div className="mx-2 print:hidden">
        <IndicadorRendimiento ingresos={data.ingresos} egresos={data.egresos} />
      </div>

      {modo === 'rango' && (
        <SelectorRango 
          fechaInicio={fechaInicio} setFechaInicio={setFechaInicio}
          fechaFin={fechaFin} setFechaFin={setFechaFin}
          tipoFiltro={tipoFiltro} setTipoFiltro={setTipoFiltro}
        />
      )}

      <div className="mx-2 print:mx-0">
        <TablaGananciasPorDia listaDias={data.listaDias} tipoFiltro={tipoFiltro} />
      </div>

      <div className="mx-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 print:hidden">
        <h3 className="text-center text-[10px] font-black text-gray-300 uppercase mb-6 tracking-[0.4em] italic">
          Detalle de Egresos - Individuales ({modo})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.gF && data.gF.length > 0 ? (
            data.gF.slice(0, 10).map((g: any) => (
              <ItemGasto key={g.id || g.created_at} concepto={g.concepto} fecha={g.created_at || g.creado_at} monto={g.monto} />
            ))
          ) : (
            <div className="col-span-2 py-10 text-center text-gray-300 text-[10px] font-black uppercase italic">
              Sin egresos en este periodo con el filtro seleccionado
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
