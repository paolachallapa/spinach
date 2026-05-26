'use client'
import { useState, useEffect, useMemo } from 'react'
import { calcularBalance } from '@/hooks/BalanceLogic'
import { CardBalance, ItemGasto, IndicadorRendimiento, SelectorRango, TablaGananciasPorDia } from './BalanceUI'

export default function Balance({ ventas, gastos, supabase }: any) {
  const anioActual = new Date().getFullYear()
  const hoyFormateado = new Date().toLocaleDateString('sv-SE') // "2026-05-25"

  const [fechaInicio, setFechaInicio] = useState(hoyFormateado)
  const [fechaFin, setFechaFin] = useState(hoyFormateado)
  
  const [modo, setModo] = useState<'semanal' | 'mensual' | 'anual' | 'rango'>('semanal')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'ingresos' | 'egresos'>('todos')
  const [mesSeleccionado, setMesSeleccionado] = useState(String(new Date().getMonth() + 1).padStart(2, '0'))

  const [datosHistoricos, setDatosHistoricos] = useState<{ ventas: any[], gastos: any[] } | null>(null)
  const [cargandoHistorico, setCargandoHistorico] = useState(false)

  const cambiarModo = (nuevoModo: 'semanal' | 'mensual' | 'anual' | 'rango') => {
    setModo(nuevoModo)
    setFechaInicio(hoyFormateado)
    setFechaFin(hoyFormateado)
  }

  // Carga histórica optimizada para mensual/anual mediante rangos amplios
  useEffect(() => {
    const consultarBaseDeDatos = async () => {
      if (!supabase || (modo !== 'anual' && modo !== 'mensual')) {
        setDatosHistoricos(null)
        return
      }

      setCargandoHistorico(true)
      try {
        let fMin = `${anioActual}-01-01T00:00:00.000Z`
        let fMax = `${anioActual}-12-31T23:59:59.999Z`

        if (modo === 'mensual') {
          const ultimoDia = new Date(anioActual, parseInt(mesSeleccionado), 0).getDate()
          fMin = `${anioActual}-${mesSeleccionado}-01T00:00:00.000Z`
          fMax = `${anioActual}-${mesSeleccionado}-${ultimoDia}T23:59:59.999Z`
        }

        const [resVentas, resGastos] = await Promise.all([
          supabase.from('ventas').select('*').gte('creado_at', fMin).lte('creado_at', fMax),
          supabase.from('gastos').select('*').gte('created_at', fMin).lte('created_at', fMax)
        ])

        setDatosHistoricos({ ventas: resVentas.data || [], gastos: resGastos.data || [] })
      } catch (error) {
        console.error("Error cargando Supabase:", error)
      } finally {
        setCargandoHistorico(false)
      }
    }

    consultarBaseDeDatos()
  }, [modo, mesSeleccionado, supabase, anioActual])

  // Unificación de orígenes de datos (histórico o tiempo real desde props)
  const ventasActivas = datosHistoricos ? datosHistoricos.ventas : (ventas || [])
  const gastosActivos = datosHistoricos ? datosHistoricos.gastos : (gastos || [])
  const ventasValidas = useMemo(() => ventasActivas?.filter((v: any) => v.estado !== 'anulado') || [], [ventasActivas])

// Dentro de components/Balance.tsx modifica tu useMemo de data para quedar así:
const data = useMemo(() => {
  return calcularBalance(ventasValidas, gastosActivos, modo, fechaInicio, fechaFin, tipoFiltro, mesSeleccionado)
}, [ventasValidas, gastosActivos, modo, fechaInicio, fechaFin, tipoFiltro, mesSeleccionado])

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 print:p-12 print:max-w-full print:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Controles y selectores dinámicos */}
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
          {modo === 'mensual' && (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase px-2">Mes:</span>
              <select
                value={mesSeleccionado}
                onChange={(e) => setMesSeleccionado(e.target.value)}
                className="bg-transparent font-black text-sm text-blue-600 outline-none cursor-pointer pr-2"
              >
                {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => (
                  <option key={m} value={String(i + 1).padStart(2, '0')}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {(modo === 'semanal' || modo === 'rango') && (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase px-2">Ref:</span>
              <input type="date" value={fechaInicio} onChange={(e) => { setFechaInicio(e.target.value); setFechaFin(e.target.value); }} className="bg-transparent font-black text-sm text-blue-600 outline-none" />
            </div>
          )}

          <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase px-4 py-3 rounded-2xl shadow-md transition-all">🖨️ Imprimir</button>
        </div>
      </div>

      {cargandoHistorico && <div className="mx-2 p-4 bg-blue-50 text-blue-600 rounded-2xl text-center text-[10px] font-black uppercase tracking-wider">🔄 Sincronizando datos...</div>}

      {/* Tarjetas informativas de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <CardBalance titulo={`Ingresos ${modo}`} monto={data.ingresos} color="green" />
        <CardBalance titulo={`Gastos ${modo}`} monto={data.egresos} color="red" />
        <CardBalance titulo="Saldo Neto" monto={data.ingresos - data.egresos} esSaldo={true} />
      </div>

      <div className="mx-2 print:hidden"><IndicadorRendimiento ingresos={data.ingresos} egresos={data.egresos} /></div>

      {modo === 'rango' && <SelectorRango fechaInicio={fechaInicio} setFechaInicio={setFechaInicio} fechaFin={fechaFin} setFechaFin={setFechaFin} tipoFiltro={tipoFiltro} setTipoFiltro={setTipoFiltro} />}

      {/* Estructura de la tabla consolidada */}
      <div className="mx-2"><TablaGananciasPorDia listaDias={data.listaDias} tipoFiltro={tipoFiltro} /></div>
    </div>
  )
}
