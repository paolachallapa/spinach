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

  const [datosHistoricos, setDatosHistoricos] = useState<{ ventas: any[], gastos: any[] } | null>(null)
  const [cargandoHistorico, setCargandoHistorico] = useState(false)

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

  // Consulta limpia a Supabase por Rangos de año o mes
  useEffect(() => {
    const consultarBaseDeDatos = async () => {
      if (!supabase || (modo !== 'anual' && modo !== 'mensual')) {
        setDatosHistoricos(null)
        return
      }

      setCargandoHistorico(true)
      
      try {
        let queryVentas = supabase.from('ventas').select('*')
        let queryGastos = supabase.from('gastos').select('*')

        if (modo === 'anual') {
          const inicioAnio = `${anioActual}-01-01T00:00:00.000Z`
          const finAnio = `${anioActual}-12-31T23:59:59.999Z`
          queryVentas = queryVentas.gte('creado_at', inicioAnio).lte('creado_at', finAnio)
          queryGastos = queryGastos.gte('created_at', inicioAnio).lte('created_at', finAnio)
        } else if (modo === 'mensual') {
          const mesActual = new Date(fechaInicio + 'T00:00:00').getMonth() + 1
          const mesFormateado = mesActual < 10 ? `0${mesActual}` : mesActual
          const ultimoDia = new Date(anioActual, mesActual, 0).getDate()
          
          const inicioMes = `${anioActual}-${mesFormateado}-01T00:00:00.000Z`
          const finMes = `${anioActual}-${mesFormateado}-${ultimoDia}T23:59:59.999Z`

          queryVentas = queryVentas.gte('creado_at', inicioMes).lte('creado_at', finMes)
          queryGastos = queryGastos.gte('created_at', inicioMes).lte('created_at', finMes)
        }

        const [resVentas, resGastos] = await Promise.all([queryVentas, queryGastos])

        setDatosHistoricos({
          ventas: resVentas.data || [],
          gastos: resGastos.data || []
        })
      } catch (error) {
        console.error("Error cargando histórico:", error)
      } finally {
        setCargandoHistorico(false)
      }
    }

    consultarBaseDeDatos()
  }, [modo, fechaInicio, supabase, anioActual])

  const ventasActivas = datosHistoricos ? datosHistoricos.ventas : (ventas || [])
  const gastosActivos = datosHistoricos ? datosHistoricos.gastos : (gastos || [])

  const ventasValidas = useMemo(() => {
    return ventasActivas?.filter((v: any) => v.estado !== 'anulado') || [];
  }, [ventasActivas]);

  // Procesamos la lógica base del balance
  const data = useMemo(() => {
    let fInicio = fechaInicio
    let fFin = fechaFin

    if (modo === 'semanal') {
      const fechaRef = new Date(fechaInicio + 'T00:00:00')
      const diaSemana = fechaRef.getDay()
      const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1
      const lunesActual = new Date(fechaRef.getTime() - diasHastaLunes * 24 * 60 * 60 * 1000)
      
      fInicio = lunesActual.toLocaleDateString('sv-SE')
      fFin = fechaInicio
    }

    if (modo === 'anual') {
      fInicio = `${anioActual}-01-01`
      fFin = `${anioActual}-12-31`
    } else if (modo === 'mensual') {
      const mesActual = new Date(fechaInicio + 'T00:00:00').getMonth() + 1
      const mesFormateado = mesActual < 10 ? `0${mesActual}` : mesActual
      const ultimoDia = new Date(anioActual, mesActual, 0).getDate()
      fInicio = `${anioActual}-${mesFormateado}-01`
      fFin = `${anioActual}-${mesFormateado}-${ultimoDia}`
    }

    return calcularBalance(ventasValidas, gastosActivos, modo, fInicio, fFin, tipoFiltro);
  }, [ventasValidas, gastosActivos, modo, fechaInicio, fechaFin, tipoFiltro, anioActual]);

  // SOLUCIÓN AL CONFLICTO: Re-calculamos y unificamos la lista de días para que NUNCA se salte ningún día de ningún mes
  const listaDiasCorregida = useMemo(() => {
    if (modo !== 'anual' && modo !== 'mensual') return data.listaDias;

    const mapeoDias: { [key: string]: { fecha: string; ingresos: number; egresos: number; balanceNeto: number } } = {};

    // 1. Agrupar todas las ventas reales por su día correspondiente
    ventasValidas.forEach((v: any) => {
      const fechaRaw = v.creado_at || v.created_at;
      if (!fechaRaw) return;
      
      // Extraemos la fecha limpia en formato DD/MM/YYYY
      const fechaObj = new Date(fechaRaw);
      const dia = String(fechaObj.getDate()).padStart(2, '0');
      const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const anio = fechaObj.getFullYear();
      const fechaClave = `${dia}/${mes}/${anio}`;

      // Si la fecha contiene caracteres extraños o es inválida, usamos el formato que venga por texto
      const fechaFinal = isNaN(fechaObj.getTime()) ? String(fechaRaw).split('T')[0] : fechaClave;

      const monto = Number(v.total || v.monto || 0);

      if (!mapeoDias[fechaFinal]) {
        mapeoDias[fechaFinal] = { fecha: fechaFinal, ingresos: 0, egresos: 0, balanceNeto: 0 };
      }
      mapeoDias[fechaFinal].ingresos += monto;
    });

    // 2. Agrupar todos los gastos reales por su día correspondiente
    gastosActivos.forEach((g: any) => {
      const fechaRaw = g.created_at || g.creado_at;
      if (!fechaRaw) return;

      const fechaObj = new Date(fechaRaw);
      const dia = String(fechaObj.getDate()).padStart(2, '0');
      const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const anio = fechaObj.getFullYear();
      const fechaClave = `${dia}/${mes}/${anio}`;

      const fechaFinal = isNaN(fechaObj.getTime()) ? String(fechaRaw).split('T')[0] : fechaClave;
      const monto = Number(g.monto || 0);

      if (!mapeoDias[fechaFinal]) {
        mapeoDias[fechaFinal] = { fecha: fechaFinal, ingresos: 0, egresos: 0, balanceNeto: 0 };
      }
      mapeoDias[fechaFinal].egresos += monto;
    });

    // 3. Convertir el mapa a un arreglo, calcular el balance neto y ordenarlo de más reciente a más antiguo
    return Object.values(mapeoDias)
      .map((d) => ({
        ...d,
        balanceNeto: d.ingresos - d.egresos
      }))
      .sort((a, b) => {
        const [diaA, mesA, anioA] = a.fecha.split('/').map(Number);
        const [diaB, mesB, anioB] = b.fecha.split('/').map(Number);
        return new Date(anioB, mesB - 1, diaB).getTime() - new Date(anioA, mesA - 1, diaA).getTime();
      });
  }, [ventasValidas, gastosActivos, modo, data.listaDias]);

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

      {cargandoHistorico && (
        <div className="mx-2 p-4 bg-blue-50 text-blue-600 rounded-2xl text-center text-[10px] font-black uppercase tracking-wider animate-pulse border border-blue-100">
          🔄 Estructurando el historial consolidado del año...
        </div>
      )}

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

      {/* AQUÍ PASAMOS LA LISTA TOTALMENTE RECONSTRUIDA Y ORDENADA */}
      <div className="mx-2 print:mx-0">
        <TablaGananciasPorDia listaDias={listaDiasCorregida} tipoFiltro={tipoFiltro} />
      </div>

      <div className="mx-2 bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50 print:hidden">
        <h3 className="text-center text-[10px] font-black text-gray-300 uppercase mb-6 tracking-[0.4em] italic">
          Detalle de Egresos - Individuales ({modo})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.gF && data.gF.length > 0 ? (
            data.gF.slice(0, 10).map((g: any) => (
              <ItemGasto key={g.id || g.created_at || g.creado_at} concepto={g.concepto} fecha={g.created_at || g.creado_at} monto={g.monto} />
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
