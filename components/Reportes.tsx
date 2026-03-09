'use client'
import { useState } from 'react'

export default function Reportes({ ventas, gastos }: { ventas: any[], gastos: any[] }) {
  const [fecha, setFecha] = useState(new Date().toLocaleDateString('sv-SE'))
  
  const ventasFiltradas = ventas.filter((v: any) => {
    if (!v.creado_at) return false;
    const fechaVentaLocal = new Date(v.creado_at).toLocaleDateString('sv-SE');
    return fechaVentaLocal === fecha;
  });

  const gastosFiltrados = gastos?.filter((g: any) => {
    const fechaGasto = new Date(g.creado_at).toLocaleDateString('sv-SE');
    return fechaGasto === fecha;
  }) || [];

  const agrupado = ventasFiltradas.reduce((acc: any, v: any) => {
    if (!acc[v.nombre_producto]) {
      acc[v.nombre_producto] = { nombre: v.nombre_producto, cantidad: 0, total: 0 }
    }
    acc[v.nombre_producto].cantidad += 1
    acc[v.nombre_producto].total += Number(v.precio_venta)
    return acc
  }, {})
  
  const lista: any[] = Object.values(agrupado)

  const totalVentas = lista.reduce((a: number, b: any) => a + b.total, 0);
  const totalGastos = gastosFiltrados.reduce((a: number, b: any) => a + Number(b.monto), 0);
  const efectivoFinal = totalVentas - totalGastos;

  return (
    /* Ajustado p-4 para móvil y md:p-8 para pantallas grandes */
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border print:p-0 print:border-none w-full max-w-4xl mx-auto">
      
      {/* CABECERA: Se vuelve columna en móvil (flex-col) y fila en tablet/pc (md:flex-row) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-green-700 uppercase">Cierre de Caja</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Manhattan System</p>
        </div>
        
        {/* Controles de fecha y botón: ocupan todo el ancho en móvil */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <input 
            type="date" 
            value={fecha} 
            onChange={(e) => setFecha(e.target.value)} 
            className="flex-1 md:flex-none p-2 border rounded-xl font-bold outline-green-500 text-sm" 
          />
          <button 
            onClick={() => window.print()} 
            className="flex-1 md:flex-none bg-green-600 text-white px-4 py-2 rounded-xl font-bold shadow-lg text-sm active:scale-95 transition"
          >
            IMPRIMIR 📥
          </button>
        </div>
      </div>

      {/* CUERPO DEL REPORTE */}
      <div className="print:block">
        <h1 className="hidden print:block text-center text-xl font-black mb-6 uppercase border-b-2 border-black pb-2">
          MANHATTAN - CIERRE DE CAJA
          <br />
          <span className="text-sm font-normal">{new Date(fecha + "T00:00:00").toLocaleDateString('es-BO', { dateStyle: 'full' })}</span>
        </h1>
        
        <div className="divide-y border-t border-b">
          <p className="py-2 text-[10px] font-black text-gray-400 uppercase print:text-black">Detalle de Productos</p>
          {lista.length > 0 ? (
            lista.map((item: any, i: number) => (
              <div key={i} className="py-3 flex justify-between items-center uppercase text-xs md:text-sm gap-2">
                <span className="font-medium truncate">{item.nombre} (x{item.cantidad})</span>
                <span className="font-black text-green-700 print:text-black whitespace-nowrap">Bs {item.total.toFixed(2)}</span>
              </div>
            ))
          ) : (
            <p className="py-10 text-center text-gray-400 italic text-sm">No hay movimientos registrados.</p>
          )}
        </div>

        {/* SECCIÓN DE TOTALES */}
        {lista.length > 0 && (
          <div className="mt-8 space-y-2">
            <div className="flex justify-between text-xs md:text-sm px-2 md:px-6">
              <span className="text-gray-500 uppercase font-bold">Total Ventas:</span>
              <span className="font-bold text-gray-700">Bs {totalVentas.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm px-2 md:px-6 text-red-600">
              <span className="uppercase font-bold">Total Gastos:</span>
              <span className="font-bold">- Bs {totalGastos.toFixed(2)}</span>
            </div>
            
            {/* El cuadro verde final: ajustado el padding y tamaño de texto para móvil */}
            <div className="p-4 md:p-6 bg-green-600 rounded-2xl text-white flex justify-between items-center print:bg-black print:text-white shadow-xl mt-4">
              <span className="font-black uppercase tracking-widest text-sm md:text-lg">Efectivo Real</span>
              <span className="text-xl md:text-3xl font-black italic">
                Bs {efectivoFinal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        
        <p className="hidden print:block text-center text-[8px] text-gray-400 mt-12 uppercase tracking-widest">
          *** Fin del Reporte Diario ***
        </p>
      </div>
    </div>
  )
}