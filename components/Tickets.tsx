'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { printer } from '@/lib/printer'
import ModalAnulacion from './ui/ModalAnulacion'

export default function Tickets({ ventas, alTerminar, perfilUsuario }: any) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pedidoAAnular, setPedidoAAnular] = useState<any>(null);

  const hoy = new Date().toLocaleDateString('sv-SE');

  const todosLosMomentosDelDia = Array.from(new Set(
    ventas
      .filter((v: any) => v.creado_at && new Date(v.creado_at).toLocaleDateString('sv-SE') === hoy)
      .sort((a: any, b: any) => new Date(a.creado_at).getTime() - new Date(b.creado_at).getTime())
      .map((v: any) => v.creado_at)
  ));

  const ventasActivasHoy = ventas
    .filter((v: any) => {
      if (!v.creado_at) return false;
      const fechaLocal = new Date(v.creado_at).toLocaleDateString('sv-SE');
      return fechaLocal === hoy && v.estado !== 'anulado';
    })
    .sort((a: any, b: any) => new Date(a.creado_at).getTime() - new Date(b.creado_at).getTime());

  const pedidosAgrupados = ventasActivasHoy.reduce((acc: any, v: any) => {
    const pedidoKey = v.creado_at; 
    if (!acc[pedidoKey]) {
      acc[pedidoKey] = {
        cliente: v.cliente || 'ANÓNIMO',
        items: [],
        total: 0,
        hora: new Date(v.creado_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
        entregado: v.entregado,
        ids: [],
        timestamp: new Date(v.creado_at).getTime(),
        keyOriginal: v.creado_at,
        metodo: v.metodo_pago,
        notas_originales: v.notas,
        pago_ef: 0,
        pago_qr: 0,
        // CORRECCIÓN: Usamos slice(0,5) para que coincida con el ModalDesglosePagos
        referencia: v.id ? v.id.toString().slice(0, 5).toUpperCase() : 'S/R'
      }
    }

    acc[pedidoKey].pago_ef += Number(v.pago_ef || 0);
    acc[pedidoKey].pago_qr += Number(v.pago_qr || 0);

    acc[pedidoKey].items.push({ id: v.id, nombre: v.nombre_producto, precio: Number(v.precio_venta), cantidad: 1 });
    acc[pedidoKey].total += Number(v.precio_venta);
    acc[pedidoKey].ids.push(v.id);
    if (!v.entregado) acc[pedidoKey].entregado = false;
    return acc;
  }, {});

  const listaPedidos = Object.values(pedidosAgrupados)
    .sort((a: any, b: any) => a.timestamp - b.timestamp)
    .map((pedido: any) => ({
      ...pedido,
      nroPedido: todosLosMomentosDelDia.indexOf(pedido.keyOriginal) + 1
    }));

  const manejarReimpresion = (e: React.MouseEvent, pedido: any) => {
    e.stopPropagation(); 
    
    const detallesMix = (pedido.metodo === 'mix' || pedido.metodo === 'PAGO MIXTO') 
      ? { ef: pedido.pago_ef, qr: pedido.pago_qr } 
      : null;

    printer.imprimirTicket(
        pedido.cliente, 
        pedido.items, 
        pedido.total, 
        pedido.notas_originales || `HORA: ${pedido.hora}`, 
        `#${pedido.nroPedido}`, 
        pedido.metodo,
        detallesMix
    );
  };

  const abrirModalAnulacion = (e: React.MouseEvent, pedido: any) => {
    e.stopPropagation();
    setPedidoAAnular(pedido);
    setModalOpen(true);
  };

  const confirmarAnulacion = async () => {
    if (!pedidoAAnular) return;
    try {
      for (const idVenta of pedidoAAnular.ids) {
        await supabase.rpc('anular_venta_y_restaurar_stock', {
          venta_id_param: idVenta,
          admin_id_param: perfilUsuario.id
        });
      }
      setModalOpen(false);
      alTerminar();
    } catch (error: any) {
      alert("Error: " + error.message);
    }
  };

  const marcarTodoEntregado = (ids: number[], estadoActual: boolean) => {
    alTerminar();
    supabase.from('ventas').update({ entregado: !estadoActual }).in('id', ids)
      .then(({ error }) => { if (error) alTerminar(); });
  };

  const renderEtiquetaPago = (metodo: string) => {
    const estilos: any = {
      qr: "bg-blue-100 text-blue-600 border-blue-200",
      ef: "bg-green-100 text-green-600 border-green-200",
      pya: "bg-red-100 text-red-600 border-red-200",
      mix: "bg-purple-100 text-purple-600 border-purple-200"
    };
    const nombres: any = { qr: "QR", ef: "EFECTIVO", pya: "P. YA", mix: "MIXTO" };
    
    return (
      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${estilos[metodo] || 'bg-gray-100 text-gray-400'}`}>
        {nombres[metodo] || 'S.D.'}
      </span>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-10">
      <ModalAnulacion 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={confirmarAnulacion}
        pedidoInfo={{ nro: pedidoAAnular?.nroPedido, cliente: pedidoAAnular?.cliente }}
      />

      <div className="bg-blue-700 p-5 rounded-3xl text-white shadow-lg flex justify-between items-center mx-2">
        <h2 className="font-black uppercase tracking-tighter text-lg italic">Comandas de Cocina 📋</h2>
        <span className="bg-blue-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-white">
          {listaPedidos.filter((p: any) => !p.entregado).length} Pendientes
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
        {listaPedidos.length > 0 ? (
          [...listaPedidos].reverse().map((pedido: any) => (
            <div 
              key={pedido.timestamp} 
              onClick={() => marcarTodoEntregado(pedido.ids, pedido.entregado)}
              className={`relative overflow-hidden rounded-[2rem] border-2 transition-all cursor-pointer ${
                pedido.entregado ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-blue-100 shadow-md hover:border-blue-400'
              }`}
            >
              <div className={`p-4 ${pedido.entregado ? 'bg-gray-200' : 'bg-blue-50'} flex justify-between items-center`}>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => manejarReimpresion(e, pedido)} className="bg-white p-2.5 rounded-2xl shadow-md hover:bg-orange-500 hover:text-white transition-all transform active:scale-90">
                    🖨️
                  </button>

                  {perfilUsuario?.rol === 'admin' && (
                    <button onClick={(e) => abrirModalAnulacion(e, pedido)} className="bg-white p-2.5 rounded-2xl shadow-md border-2 border-red-50 hover:bg-red-500 hover:text-white transition-all transform active:scale-90">
                      🚫
                    </button>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.5 rounded font-black">#{pedido.nroPedido}</span>
                      {renderEtiquetaPago(pedido.metodo)}
                    </div>
                    <h3 className="font-black text-blue-900 uppercase text-sm leading-none mt-1">{pedido.cliente}</h3>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="text-[10px] font-bold text-gray-400">{pedido.hora}</p>
                  {/* VISUALIZACIÓN DEL ID PARA CONTROL */}
                  <span className="text-[9px] font-black text-blue-500/50 tracking-tighter uppercase">
                    ID: #{pedido.referencia}
                  </span>
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
