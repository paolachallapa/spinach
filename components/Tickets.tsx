'use client'
import { supabase } from '@/lib/supabase'
import { printer } from '@/lib/printer'

export default function Tickets({ ventas, alTerminar }: any) {
  const hoy = new Date().toLocaleDateString('sv-SE');

  // 1. Filtramos y ORDENAMOS por fecha (lo más antiguo primero para el conteo)
  const ventasHoy = ventas
    .filter((v: any) => {
      if (!v.creado_at) return false;
      const fechaLocal = new Date(v.creado_at).toLocaleDateString('sv-SE');
      return fechaLocal === hoy;
    })
    .sort((a: any, b: any) => new Date(a.creado_at).getTime() - new Date(b.creado_at).getTime());

  // 2. AGRUPAMOS POR "MOMENTO DE VENTA" (Usando creado_at como llave única)
  const pedidosAgrupados = ventasHoy.reduce((acc: any, v: any) => {
    // Usamos el 'creado_at' como llave. Al ser exacto (incluye segundos/milisegundos), 
    // cada vez que das clic en "Confirmar", se crea una llave única.
    const pedidoKey = v.creado_at; 
    
    if (!acc[pedidoKey]) {
      acc[pedidoKey] = {
        cliente: v.cliente || 'ANÓNIMO',
        items: [],
        total: 0,
        hora: new Date(v.creado_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        entregado: v.entregado,
        ids: [],
        timestamp: new Date(v.creado_at).getTime() // Para ordenar al final
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
    
    if (!v.entregado) acc[pedidoKey].entregado = false;
    return acc;
  }, {});

  // 3. Convertimos a lista y asignamos Nro de Pedido real
  const listaPedidos = Object.values(pedidosAgrupados)
    .sort((a: any, b: any) => a.timestamp - b.timestamp) // Asegurar orden cronológico
    .map((pedido: any, index: number) => ({
      ...pedido,
      nroPedido: index + 1
    }));

  const marcarTodoEntregado = async (ids: number[], estadoActual: boolean) => {
    const { error } = await supabase
      .from('ventas')
      .update({ entregado: !estadoActual })
      .in('id', ids);
    
    if (!error) {
      alTerminar();
    }
  };

  const manejarReimpresion = (e: React.MouseEvent, pedido: any) => {
    e.stopPropagation(); 
    printer.imprimirTicket(
      `#${pedido.nroPedido} - ${pedido.cliente}`, 
      pedido.items, 
      pedido.total, 
      `HORA: ${pedido.hora}` 
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-10">
      <div className="bg-blue-700 p-5 rounded-3xl text-white shadow-lg flex justify-between items-center mx-2">
        <h2 className="font-black uppercase tracking-tighter text-lg italic">Comandas de Cocina 📋</h2>
        <span className="bg-blue-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-white">
          {listaPedidos.filter((p: any) => !p.entregado).length} Pendientes
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
        {listaPedidos.length > 0 ? (
          // Invertimos para ver el ÚLTIMO pedido arriba
          [...listaPedidos].reverse().map((pedido: any) => (
            <div 
              key={pedido.nroPedido} 
              onClick={() => marcarTodoEntregado(pedido.ids, pedido.entregado)}
              className={`relative overflow-hidden rounded-[2rem] border-2 transition-all cursor-pointer ${
                pedido.entregado 
                  ? 'bg-gray-100 border-gray-200 opacity-60' 
                  : 'bg-white border-blue-100 shadow-md hover:border-blue-400'
              }`}
            >
              <div className={`p-4 ${pedido.entregado ? 'bg-gray-200' : 'bg-blue-50'} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => manejarReimpresion(e, pedido)}
                    className="bg-white p-2.5 rounded-2xl shadow-md hover:bg-orange-500 hover:text-white transition-all transform active:scale-90"
                  >
                    🖨️
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black">
                        #{pedido.nroPedido}
                      </span>
                      <p className="text-[9px] font-black text-blue-400 uppercase leading-none">PEDIDO</p>
                    </div>
                    <h3 className="font-black text-blue-900 uppercase text-sm leading-none mt-1">
                      {pedido.cliente}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400">{pedido.hora}</p>
                  {pedido.entregado && <span className="text-[8px] font-black text-green-600 uppercase">✓ Entregado</span>}
                </div>
              </div>

              <div className="p-4 space-y-2">
                {pedido.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-1 italic text-xs">
                    <span className={`font-bold uppercase ${pedido.entregado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      • {item.nombre}
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white flex justify-between items-center border-t border-dashed">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Total</span>
                <span className={`text-lg font-black ${pedido.entregado ? 'text-gray-400' : 'text-blue-700'}`}>
                  Bs {pedido.total.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-20 text-center">
            <p className="text-gray-300 font-black uppercase tracking-widest text-xs italic">No hay comandas pendientes</p>
          </div>
        )}
      </div>
    </div>
  )
}