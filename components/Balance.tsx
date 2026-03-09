'use client'
import { useState, useMemo } from 'react'

export default function Balance({ ventas, gastos }: any) {
  // Fecha de referencia para elegir la semana (Hoy por defecto)
  const [fechaReferencia, setFechaReferencia] = useState(new Date().toLocaleDateString('sv-SE'))

  const data = useMemo(() => {
    // Función para obtener el número de semana (ISO 8601)
    const getWeekNumber = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const targetDate = new Date(fechaReferencia);
    const targetWeek = getWeekNumber(targetDate);
    const targetYear = targetDate.getFullYear();

    const filtrarSemana = (iso: string) => {
      if (!iso) return false;
      const d = new Date(iso);
      // Ajuste por desfase de Supabase (-5 horas)
      d.setHours(d.getHours() - 5);
      return getWeekNumber(d) === targetWeek && d.getFullYear() === targetYear;
    }

    const vF = ventas?.filter((v: any) => filtrarSemana(v.creado_at || v.created_at)) || [];
    const gF = gastos?.filter((g: any) => filtrarSemana(g.created_at || g.creado_at)) || [];

    const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
    const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

    return { ingresos, egresos, vF, gF, targetWeek };
  }, [ventas, gastos, fechaReferencia]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10 animate-in fade-in zoom-in duration-500">
      
      {/* SELECTOR DE SEMANA */}
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="font-black text-gray-800 uppercase text-sm tracking-tighter">Balance Semanal</h2>
          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest italic">Semana {data.targetWeek} del año</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
          <span className="text-[9px] font-black text-gray-400 uppercase px-2">Ver semana del:</span>
          <input 
            type="date" 
            value={fechaReferencia}
            onChange={(e) => setFechaReferencia(e.target.value)}
            className="bg-transparent font-black text-sm text-blue-600 outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* TARJETAS DE TOTALES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-b-8 border-green-500">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Ingresos Semana</p>
          <p className="text-3xl font-black text-green-600 tracking-tighter">Bs {data.ingresos.toFixed(2)}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-b-8 border-red-500">
          <p className="text-[10px] font-black text-gray-400 uppercase mb-1 tracking-widest">Gastos Semana</p>
          <p className="text-3xl font-black text-red-500 tracking-tighter">Bs {data.egresos.toFixed(2)}</p>
        </div>

        <div className={`p-8 rounded-[2.5rem] shadow-2xl border-b-8 text-white ${data.ingresos - data.egresos >= 0 ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800'}`}>
          <p className="text-[10px] font-black opacity-60 uppercase mb-1 tracking-widest text-white/80">Saldo Semanal</p>
          <p className="text-3xl font-black italic">Bs {(data.ingresos - data.egresos).toFixed(2)}</p>
        </div>
      </div>

      {/* LISTADO DE EGRESOS DE LA SEMANA */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-50">
        <h3 className="text-center text-[10px] font-black text-gray-300 uppercase mb-6 tracking-[0.4em] italic">Detalle de Salidas Semanales</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.gF.length > 0 ? (
            data.gF.map((g: any, i: number) => (
              <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                <div className="flex flex-col">
                  <span className="text-[11px] font-black text-gray-700 uppercase leading-tight mb-1">{g.concepto}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase">
                    {new Date(g.created_at).toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit' })}
                  </span>
                </div>
                <span className="text-sm font-black text-red-500 bg-white px-3 py-1.5 rounded-xl shadow-sm italic">
                  - Bs {Number(g.monto).toFixed(2)}
                </span>
              </div>
            ))
          ) : (
            <div className="col-span-2 py-10 text-center text-gray-300 text-[10px] font-black uppercase italic">
              No hay egresos registrados esta semana
            </div>
          )}
        </div>
      </div>
    </div>
  )
}