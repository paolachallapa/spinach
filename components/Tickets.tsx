'use client'
import { supabase } from '@/lib/supabase'

export default function Tickets({ ventas, alTerminar }: any) {
  const hoy = new Date().toLocaleDateString('sv-SE');

  // 1. Filtramos solo las ventas de hoy
  const ventasHoy = ventas.filter((v: any) => {
    if (!v.creado_at) return false;
    const fechaLocal = new Date(v.creado_at).toLocaleDateString('sv-SE');
    return fechaLocal === hoy;
  });

  // 2. AGRUPAMOS POR CLIENTE (Para ver pedidos completos)
  const pedidosAgrupados = ventasHoy.reduce((acc: any, v: any) => {
    // Usamos el nombre del cliente + la hora aproximada para agrupar pedidos distintos del mismo cliente
    const clienteKey = v.cliente || 'ANÓNIMO';
    if (!acc[clienteKey]) {
      acc[clienteKey] = {
        cliente: clienteKey,
        items: [],
        total: 0,
        hora: new Date(v.creado_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        entregado: v.entregado, // Tomamos el estado del primer item
        ids: [] // Guardamos los IDs para poder marcarlos todos como entregados
      }
    }
    acc[clienteKey].items.push(v);
    acc[clienteKey].total += Number(v.precio_venta);
    acc[clienteKey].ids.push(v.id);
    // Si un solo item no está entregado, el pedido completo aparece como pendiente
    if (!v.entregado) acc[clienteKey].entregado = false;
    return acc;
  }, {});

  const listaPedidos = Object.values(pedidosAgrupados);

  // Función para marcar todo el pedido del cliente como entregado
  const marcarTodoEntregado = async (ids: number[], estadoActual: boolean) => {
    const { error } = await supabase
      .from('ventas')
      .update({ entregado: !estadoActual })
      .in('id', ids);
    
    if (!error) {
      alTerminar();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-10">
      <div className="bg-blue-700 p-5 rounded-3xl text-white shadow-lg flex justify-between items-center mx-2">
        <h2 className="font-black uppercase tracking-tighter text-lg">Pedidos del Día</h2>
        <span className="bg-blue-500 px-3 py-1 rounded-full text-[10px] font-bold">
          {listaPedidos.length} ORDENES
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
        {listaPedidos.length > 0 ? (
          listaPedidos.map((pedido: any, i: number) => (
            <div 
              key={i} 
              onClick={() => marcarTodoEntregado(pedido.ids, pedido.entregado)}
              className={`relative overflow-hidden rounded-[2rem] border-2 transition-all cursor-pointer ${
                pedido.entregado 
                  ? 'bg-gray-100 border-gray-200 opacity-60' 
                  : 'bg-white border-blue-100 shadow-md hover:border-blue-400'
              }`}
            >
              {/* CABECERA DEL CLIENTE */}
              <div className={`p-4 ${pedido.entregado ? 'bg-gray-200' : 'bg-blue-50'} flex justify-between items-center`}>
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase">Cliente</p>
                  <h3 className="font-black text-blue-900 uppercase text-sm leading-none">
                    {pedido.cliente}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400">{pedido.hora}</p>
                  {pedido.entregado && <span className="text-[9px] font-black text-green-600 uppercase">✓ Entregado</span>}
                </div>
              </div>

              {/* LISTA DE PLATOS (AL MEDIO) */}
              <div className="p-4 space-y-2">
                {pedido.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-1">
                    <span className={`text-xs font-bold uppercase ${pedido.entregado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      • {item.nombre_producto}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">Bs {Number(item.precio_venta).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* SUMA DEL CONSUMO (AL FINAL) */}
              <div className="p-4 bg-white flex justify-between items-center border-t border-dashed">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Consumo</span>
                <span className={`text-lg font-black ${pedido.entregado ? 'text-gray-400' : 'text-blue-700'}`}>
                  Bs {pedido.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-20 text-center">
            <p className="text-gray-300 font-black uppercase tracking-widest text-xs italic">
              No hay comandas pendientes
            </p>
          </div>
        )}
      </div>
    </div>
  )
}