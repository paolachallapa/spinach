'use client'
import { useState } from 'react'

// --- COMPONENTES VISUALES ---
export const CardBalance = ({ titulo, monto, color, esSaldo = false }: any) => {
  const bgCulo = esSaldo 
    ? (monto >= 0 ? 'bg-green-600 border-green-800' : 'bg-red-600 border-red-800')
    : 'bg-white border-b-8';
    
  const textMonto = esSaldo 
    ? 'text-white' 
    : (color === 'red' ? 'text-red-500' : 'text-green-600');

  return (
    <div className={`p-8 rounded-[2.5rem] shadow-lg transition-all ${bgCulo} ${!esSaldo && (color === 'red' ? 'border-red-500' : 'border-green-500')}`}>
      <p className={`text-[10px] font-black uppercase mb-1 tracking-widest ${esSaldo ? 'text-white/80' : 'text-gray-400'}`}>
        {titulo}
      </p>
      <p className={`text-3xl font-black tracking-tighter italic ${textMonto}`}>
        Bs {Number(monto).toFixed(2)}
      </p>
    </div>
  );
};

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

// --- COMPONENTE PRINCIPAL ACTUALIZADO ---
export default function Balance({ ventas, gastos }: any) {
  // 1. FILTRADO CRÍTICO: Ignoramos las ventas que tengan estado 'anulado'
  const ventasValidas = ventas.filter((v: any) => v.estado !== 'anulado');

  // 2. CALCULAMOS USANDO SOLO LAS VENTAS VÁLIDAS
  const totalIngresos = ventasValidas.reduce((acc: number, v: any) => acc + Number(v.precio_venta), 0);
  const totalEgresos = gastos.reduce((acc: number, g: any) => acc + Number(g.monto), 0);
  const saldoNeto = totalIngresos - totalEgresos;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <CardBalance titulo="Ingresos Totales" monto={totalIngresos} color="green" />
        <CardBalance titulo="Gastos Registrados" monto={totalEgresos} color="red" />
        <CardBalance titulo="Saldo Neto" monto={saldoNeto} esSaldo={true} />
      </div>

      <div className="mx-2">
        <IndicadorRendimiento ingresos={totalIngresos} egresos={totalEgresos} />
      </div>

      <div className="mx-2 bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Últimos Egresos Detallados
        </h3>
        <div className="space-y-3">
          {gastos.length > 0 ? (
            gastos.slice(0, 10).map((g: any) => (
              <ItemGasto key={g.id} concepto={g.concepto} fecha={g.created_at} monto={g.monto} />
            ))
          ) : (
            <p className="text-center text-[10px] font-bold text-gray-300 uppercase py-10">Sin gastos registrados</p>
          )}
        </div>
      </div>
    </div>
  );
}
