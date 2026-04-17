// components/Reportes.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useReporteData, ItemResumen } from '@/hooks/useReporteData'
import { getReporteHTML } from '@/lib/reporteTemplate'

export default function Reportes({ ventas, gastos, productos = [] }: { ventas: any[], gastos: any[], productos?: any[] }) {
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('sv-SE'))
  const [nombreCajero, setNombreCajero] = useState('Cargando...')

  useEffect(() => {
    const fetchCajero = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('perfiles').select('nombre, apellido').eq('id', user.id).single();
        if (data) setNombreCajero(`${data.nombre} ${data.apellido}`);
      }
    };
    fetchCajero();
  }, []);

  const dataReporte = useReporteData(ventas, gastos, productos, fecha);
  const { listaPrincipales, listaExtras, metodos, totales } = dataReporte;

  const imprimirPDF = () => {
    const win = window.open('', '', 'width=800,height=900');
    if (!win) return;
    win.document.write(getReporteHTML(fecha, nombreCajero, dataReporte));
    win.document.close();
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border w-full max-w-4xl mx-auto">
      {/* SECCIÓN CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-green-700 uppercase italic">Gestión de Caja</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Responsable: {nombreCajero}</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            className="flex-1 md:flex-none p-2 border rounded-xl font-bold outline-green-500 text-sm" 
          />
          <button 
            onClick={imprimirPDF} 
            className="flex-1 md:flex-none bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg text-sm active:scale-95 transition"
          >
            DESCARGAR REPORTE 📄
          </button>
        </div>
      </div>

      {/* TARJETAS DE MÉTODOS DE PAGO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Efectivo" valor={metodos.ef} color="gray" />
        <StatCard label="QR / Transf." valor={metodos.qr} color="blue" />
        <StatCard label="PedidosYa" valor={metodos.pya} color="orange" />
      </div>

      {/* CUERPO DEL RESUMEN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <SectionContainer title="Platos Principales" color="green">
          <SectionList items={listaPrincipales} emptyMsg="No hay ventas principales" />
        </SectionContainer>

        <SectionContainer title="Extras / Adicionales" color="blue">
          <SectionList items={listaExtras} emptyMsg="No hay extras registrados hoy" />
        </SectionContainer>
      </div>

      {/* FOOTER DE TOTALES */}
      <div className="p-6 bg-green-700 rounded-3xl text-white flex justify-between items-center shadow-xl">
        <div>
          <span className="font-black uppercase text-[10px] block opacity-70 tracking-tighter">Efectivo Real en Caja</span>
          <span className="text-3xl font-black italic">Bs {totales.efectivoNeto.toFixed(2)}</span>
        </div>
        <div className="text-right flex flex-col">
          <span className="text-[10px] font-black opacity-70 uppercase tracking-tighter">Ventas Brutas Totales</span>
          <span className="text-lg font-bold">Bs {totales.totalVentas.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// COMPONENTES AUXILIARES PARA LIMPIEZA VISUAL
function StatCard({ label, valor, color }: any) {
  const themes: any = {
    gray: 'bg-gray-50 border-gray-100 text-gray-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-700'
  };
  return (
    <div className={`p-5 rounded-2xl border flex flex-col items-center ${themes[color]}`}>
      <span className="text-[9px] font-black uppercase mb-1 opacity-50 tracking-widest">{label}</span>
      <span className="text-xl font-black italic">Bs {valor.toFixed(2)}</span>
    </div>
  );
}

function SectionContainer({ title, color, children }: any) {
  const colors: any = {
    green: 'text-green-700 border-green-100',
    blue: 'text-blue-600 border-blue-100'
  };
  return (
    <div className="bg-white border rounded-3xl p-6 shadow-sm">
      <h3 className={`text-[10px] font-black uppercase mb-4 tracking-widest border-l-4 pl-2 ${colors[color]}`}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function SectionList({ items, emptyMsg }: { items: ItemResumen[], emptyMsg: string }) {
  if (items.length === 0) return <p className="text-center text-gray-300 text-xs py-8 italic font-medium">{emptyMsg}</p>;
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
          <span className="text-gray-600 uppercase font-black tracking-tighter">
            {item.nombre} <span className="text-gray-600 uppercase font-black tracking-tighter">(X{item.cantidad})</span>
          </span>
          <span className="font-bold text-gray-900">Bs {item.total.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
