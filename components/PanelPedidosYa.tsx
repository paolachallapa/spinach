'use client'
import { supabase } from '@/lib/supabase'
import { printer } from '@/lib/printer'

export default function PanelPedidosYa({ ventas, alTerminar }: any) {
  const hoy = new Date().toLocaleDateString('sv-SE');

  // 1. FILTRAMOS: Solo ventas de HOY y que sean exclusivamente de 'pya'
  const ventasPYA = ventas?.filter((v: any) => {
    if (!v.creado_at) return false;
    const fechaLocal = new Date(v.creado_at).toLocaleDateString('sv-SE');
    return fechaLocal === hoy && v.metodo_pago === 'pya';
  }) || [];

 const pedidosAgrupados = ventasPYA.reduce((acc: any, v: any) => {
    const pedidoKey = v.creado_at; 
    
    if (!acc[pedidoKey]) {
      acc[pedidoKey] = {
        id_unico: v.id, // Para el update de completado
        cliente: v.cliente || 'PEDIDOS YA',
        items: [],
        total: 0,
        hora: new Date(v.creado_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        ids: [],
        metodo: v.metodo_pago,
        notas: v.notas
      }
    }
    
    acc[pedidoKey].items.push({
      id: v.id,
      nombre: v.nombre_producto,
      precio: Number(v.precio_venta),
      cantidad: 1 
    });
    
    acc[pedidoKey].total += Number(v.precio_venta);
    acc[pedidoKey].ids.push(v.id);
    return acc;
  }, {});

  const listaFinalPYA = Object.values(pedidosAgrupados).reverse();

  // --- REIMPRESIÓN (COPIADA DE TICKETS) ---
  const manejarReimpresion = (e: React.MouseEvent, pedido: any) => {
    e.stopPropagation(); 
    printer.imprimirTicket(
      pedido.cliente, 
      pedido.items, 
      pedido.total, 
      pedido.notas || `HORA: ${pedido.hora}`, 
      `#${pedido.id_unico.toString().slice(-4)}`,
      pedido.metodo
    );
  };

  // --- FUNCIÓN COMPLETAR / DESHACER ---
  const toggleCompletado = async (pedido: any) => {
    const esCompletado = pedido.notas?.includes("(COMPLETADO)");
    const nuevaNota = esCompletado 
      ? pedido.notas.replace("(COMPLETADO) ", "") 
      : "(COMPLETADO) " + (pedido.notas || "");

    const { error } = await supabase
      .from('ventas')
      .update({ notas: nuevaNota })
      .in('id', pedido.ids);

    if (error) {
      alert("Error: " + error.message);
    } else {
      alTerminar();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-10">
      {/* HEADER EXCLUSIVO PYA */}
      <div className="bg-red-600 p-6 rounded-[2.5rem] text-white shadow-xl flex justify-between items-center mx-2">
        <h2 className="font-black uppercase tracking-tighter text-xl italic">Panel Pedidos Ya 🛵</h2>
        <span className="bg-white/20 px-4 py-1 rounded-full text-[10px] font-bold uppercase">
          {listaFinalPYA.filter((p: any) => !p.notas?.includes("(COMPLETADO)")).length} Activos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2">
        {listaFinalPYA.map((pedido: any) => {
          const esCompletado = pedido.notas?.includes("(COMPLETADO)");

          return (
            <div 
              key={pedido.id_unico}
              className={`rounded-[2rem] border-2 transition-all flex flex-col ${
                esCompletado ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-red-100 shadow-md'
              }`}
            >
              <div className={`p-4 ${esCompletado ? 'bg-gray-200' : 'bg-red-50'} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => manejarReimpresion(e, pedido)}
                    className="bg-white p-2.5 rounded-2xl shadow-md hover:bg-black hover:text-white transition-all"
                  >
                    🖨️
                  </button>
                  <div>
                    <p className="text-[9px] font-black text-red-500 uppercase leading-none">#{pedido.id_unico.toString().slice(-4)}</p>
                    <h3 className="font-black text-gray-800 uppercase text-sm">{pedido.cliente}</h3>
                  </div>
                </div>
                <p className="text-[10px] font-bold text-gray-400">{pedido.hora}</p>
              </div>

              <div className="p-4 flex-1 space-y-2">
                {pedido.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-1 text-xs">
                    <span className="font-bold text-gray-700 uppercase">• {item.nombre}</span>
                    <span className="font-bold text-gray-400">Bs {item.precio.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2 flex justify-between items-center border-t border-dashed">
                <span className="text-[9px] font-black text-gray-300 uppercase">Total PYA</span>
                <span className={`text-lg font-black ${esCompletado ? 'text-gray-400' : 'text-red-600'}`}>
                  Bs {pedido.total.toFixed(2)}
                </span>
              </div>

              <div className="p-4 pt-0">
                <button 
                  onClick={() => toggleCompletado(pedido)}
                  className={`w-full py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${
                    esCompletado ? 'bg-gray-300 text-gray-600' : 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-100'
                  }`}
                >
                  {esCompletado ? 'Deshacer ↩️' : 'Completado ✅'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}