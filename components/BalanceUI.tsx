'use client'
import React from 'react'

// --- 1. TARJETAS DE PORTADA (INGRESOS, GASTOS, SALDO) ---
export const CardBalance = ({ titulo, monto, color, esSaldo = false }: any) => {
  const bgCulo = esSaldo 
    ? (monto >= 0 ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800')
    : 'bg-white border-b-8';
    
  const textMonto = esSaldo 
    ? 'text-white' 
    : (color === 'red' ? 'text-red-500' : 'text-green-600');

  return (
    <div className={`p-8 rounded-[2.5rem] shadow-lg transition-all print:shadow-sm print:p-4 print:rounded-2xl ${bgCulo} ${!esSaldo && (color === 'red' ? 'border-red-500' : 'border-green-500')}`}>
      <p className={`text-[10px] font-black uppercase mb-1 tracking-widest print:text-[8px] print:mb-0.5 ${esSaldo ? 'text-white/80' : 'text-gray-400'}`}>
        {titulo}
      </p>
      <p className={`text-3xl font-black tracking-tighter italic print:text-xl ${textMonto}`}>
        Bs {Number(monto).toFixed(2)}
      </p>
    </div>
  );
};

// --- 2. FILAS DE GASTOS INDIVIDUALES ---
export const ItemGasto = ({ concepto, fecha, monto }: any) => (
  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
    <div className="flex flex-col">
      <span className="text-[11px] font-black text-gray-700 uppercase leading-tight mb-1">{concepto}</span>
      <span className="text-[9px] font-bold text-gray-400 uppercase">
        {new Date(fecha).toLocaleDateString('es-BO', { weekday: 'short', day: '2-digit' })}
      </span>
    </div>
    <span className="text-sm font-black text-red-500 bg-white px-3 py-1.5 rounded-xl shadow-sm italic">
      - Bs {Number(monto).toFixed(2)}
    </span>
  </div>
);

// --- 3. ANALIZADOR DE RENTABILIDAD CON RECUADRO DASHED ---
export const IndicadorRendimiento = ({ ingresos, egresos }: { ingresos: number, egresos: number }) => {
  if (ingresos === 0) return null;
  const porcentajeGasto = (egresos / ingresos) * 100;
  const saldo = ingresos - egresos;
  let mensaje = "";
  let colorClase = "";

  if (saldo > 0) {
    if (porcentajeGasto < 30) {
      mensaje = "¡Excelente rentabilidad! Los gastos son mínimos.";
      colorClase = "text-green-600 bg-green-50";
    } else if (porcentajeGasto < 70) {
      mensaje = "Buen balance. El negocio está estable.";
      colorClase = "text-blue-600 bg-blue-50";
    } else {
      mensaje = "Ojo, los gastos están consumiendo gran parte de los ingresos.";
      colorClase = "text-orange-600 bg-orange-50";
    }
  } else {
    mensaje = "Alerta: Los gastos superan los ingresos este periodo.";
    colorClase = "text-red-600 bg-red-50";
  }

  return (
    <div className={`p-4 rounded-2xl border-2 border-dashed border-current flex flex-col items-center justify-center ${colorClase} transition-all`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">Análisis de Ventas</p>
      <p className="text-xs font-bold text-center italic">"{mensaje}"</p>
      <p className="mt-2 text-[9px] font-black opacity-70">
        GASTOS: {porcentajeGasto.toFixed(1)}% DE LOS INGRESOS
      </p>
    </div>
  );
};

// --- 4. SELECTOR DE RANGOS DESDE / HASTA ---
export function SelectorRango({ fechaInicio, setFechaInicio, fechaFin, setFechaFin, tipoFiltro, setTipoFiltro }: any) {
  return (
    <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col gap-4 items-center justify-center print:hidden animate-fade-in mx-2">
      {/* Inputs de Fechas */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 w-full sm:w-auto">
          <span className="text-[9px] font-black text-gray-400 uppercase px-2">Desde:</span>
          <input 
            type="date" 
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="bg-transparent font-black text-sm text-blue-600 outline-none"
          />
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 w-full sm:w-auto">
          <span className="text-[9px] font-black text-gray-400 uppercase px-2">Hasta:</span>
          <input 
            type="date" 
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="bg-transparent font-black text-sm text-blue-600 outline-none"
          />
        </div>
      </div>

      {/* Selector de tipo de flujo (Todos, Ingresos, Egresos) */}
      <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
        {[
          { id: 'todos', label: 'Ver Todo 📊' },
          { id: 'ingresos', label: 'Solo Ingresos 💰' },
          { id: 'egresos', label: 'Solo Egresos 💸' }
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTipoFiltro(item.id as any)}
            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${
              tipoFiltro === item.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 5. TABLA DE REPORTE CONSOLIDADO DIARIO ---
export function TablaGananciasPorDia({ listaDias, tipoFiltro = 'todos' }: { listaDias: any[], tipoFiltro?: 'todos' | 'ingresos' | 'egresos' }) {
  return (
    <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-gray-50 max-w-4xl mx-auto">
      <h3 className="text-center text-[10px] font-black text-gray-300 uppercase mb-6 tracking-[0.4em] italic">
        Ganancias Consolidadas por Día
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-wider">Fecha</th>
              {(tipoFiltro === 'todos' || tipoFiltro === 'ingresos') && (
                <th className="py-4 text-[10px] font-black text-green-500 uppercase tracking-wider">Ingresos</th>
              )}
              {(tipoFiltro === 'todos' || tipoFiltro === 'egresos') && (
                <th className="py-4 text-[10px] font-black text-red-500 uppercase tracking-wider">Egresos</th>
              )}
              <th className="py-4 text-[10px] font-black text-blue-600 uppercase tracking-wider text-right">Balance Neto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {listaDias.map((dia) => (
              <tr key={dia.fecha} className="hover:bg-gray-50/50 transition-colors group">
                <td className="py-4 text-xs font-bold text-gray-700">{dia.fecha}</td>
                
                {(tipoFiltro === 'todos' || tipoFiltro === 'ingresos') && (
                  <td className="py-4 text-xs font-black text-green-600">
                    {dia.ingresos > 0 ? `+Bs ${dia.ingresos.toFixed(2)}` : `Bs 0.00`}
                  </td>
                )}
                
                {(tipoFiltro === 'todos' || tipoFiltro === 'egresos') && (
                  <td className="py-4 text-xs font-black text-red-600">
                    {dia.egresos > 0 ? `-Bs ${dia.egresos.toFixed(2)}` : `Bs 0.00`}
                  </td>
                )}
                
                <td className={`py-4 text-xs font-black text-right ${dia.neto >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                  {dia.neto >= 0 ? `Bs ${dia.neto.toFixed(2)}` : `-Bs ${Math.abs(dia.neto).toFixed(2)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
