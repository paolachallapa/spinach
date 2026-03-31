'use client'
import { useState } from 'react' 
import { printer } from '@/lib/printer'
import { estilos, BotonAccionmenu } from './UI'
import { ModalImprimir } from '@/components/ui/ModalImprimir'
import { useMenuLogic } from '@/hooks/useMenuLogic'

export default function Menu({ productos, ventas, alTerminar }: any) {
  // Extraemos las nuevas funciones del Hook
  const {
    cliente, setCliente, notas, setNotas, carrito,
    gestionarCarrito, solicitarConfirmacion, ejecutarRegistroDB, 
    showModal, datosParaImprimir, finalizarLimpiarTodo, cerrarSinRegistrar
  } = useMenuLogic(alTerminar);

  const [metodoPago, setMetodoPago] = useState<'qr' | 'ef' | 'pya'>('ef');
  const [montoRecibido, setMontoRecibido] = useState<number>(0);

  const totalVenta = carrito.reduce((a, b) => a + (b.precio * b.cantidad), 0);
  const cambio = montoRecibido > totalVenta ? (montoRecibido - totalVenta).toFixed(2) : "0.00";

  // Lógica de filtrado de productos
  const productosBase = productos?.filter((p: any) => p.activo && !p.archivado) || [];
  const principales = productosBase.filter((p: any) => !p.es_a_la_carta && !p.es_extra);
  const aLaCarta = productosBase.filter((p: any) => p.es_a_la_carta);
  const extras = productosBase.filter((p: any) => p.es_extra);

  // Cálculo de caja chica del día
  const hoyCeroHoras = new Date();
  hoyCeroHoras.setHours(0, 0, 0, 0);
  const totalCajaHoy = ventas?.filter((v: any) => {
    const fechaVenta = new Date(v.creado_at);
    return fechaVenta >= hoyCeroHoras;
  })
  .reduce((acc: number, v: any) => acc + Number(v.precio_venta), 0) || 0;

  /**
   * Esta función se dispara cuando el usuario da "SÍ" en el modal.
   * Primero guarda en la DB y, si tiene éxito, imprime el ticket.
   */
  const manejarGuardadoEImpresion = async () => {
    const datosFinales = await ejecutarRegistroDB();
    
    if (datosFinales) {
      // Solo si se guardó correctamente en Supabase, procedemos a imprimir
      printer.imprimirTicket(
        datosFinales.cliente, 
        datosFinales.carrito, 
        datosFinales.total, 
        datosFinales.notas, 
        datosFinales.nro, 
        datosFinales.metodo
      );
      
      // Limpiamos los estados locales
      setMontoRecibido(0);
      setMetodoPago('ef');
      finalizarLimpiarTodo();
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in duration-500">
        
        {/* IZQUIERDA: LISTA DE PRODUCTOS */}
        <div className="flex-1 space-y-4">
          <div className="bg-green-600 p-6 rounded-3xl text-center text-white shadow-lg">
            <p className="text-4xl font-black italic">Bs {totalCajaHoy.toFixed(2)}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-100">Caja Hoy</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {principales.map((p: any) => (
              <button key={p.id} onClick={() => gestionarCarrito(p, 'sumar')} disabled={p.stock <= 0}
                className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-all active:scale-95 ${p.stock > 0 ? 'bg-white border-gray-100' : 'bg-gray-100 opacity-50'}`}>
                <div className="text-left">
                  <p className="font-bold text-xs uppercase">{p.nombre}</p>
                  <p className="text-[10px] font-black text-orange-500 italic">STOCK: {p.stock}</p>
                </div>
                <span className="bg-orange-500 text-white px-3 py-2 rounded-xl font-black text-xs">Bs {p.precio}</span>
              </button>
            ))}
          </div>

          {/* SELECTS PARA A LA CARTA Y EXTRAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {aLaCarta.length > 0 && (
                <div className="p-4 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 mb-2 uppercase">Platos a la Carta</p>
                  <select className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl font-bold text-xs"
                    onChange={(e) => {
                      const p = aLaCarta.find((x: any) => x.id === e.target.value);
                      if (p) { gestionarCarrito(p, 'sumar'); e.target.value = ""; }
                    }}>
                    <option value="">Seleccionar...</option>
                    {aLaCarta.map((p: any) => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.nombre} - Bs {p.precio}</option>
                    ))}
                  </select>
                </div>
             )}
             {extras.length > 0 && (
                <div className="p-4 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <p className="text-[10px] font-black text-gray-400 mb-2 uppercase">Extras</p>
                  <select className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl font-bold text-xs"
                    onChange={(e) => {
                      const p = extras.find((x: any) => x.id === e.target.value);
                      if (p) { gestionarCarrito(p, 'sumar'); e.target.value = ""; }
                    }}>
                    <option value="">Seleccionar...</option>
                    {extras.map((p: any) => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>{p.nombre} - Bs {p.precio}</option>
                    ))}
                  </select>
                </div>
             )}
          </div>
        </div>

        {/* DERECHA: PANEL DE COMANDA */}
        <div className="w-full lg:w-96">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-t-8 border-orange-500 sticky top-6">
            <input placeholder="MESA / CLIENTE" value={cliente} onChange={e => setCliente(e.target.value)} className={estilos.input + " mb-2 uppercase"} />
            <textarea placeholder="NOTAS..." value={notas} onChange={e => setNotas(e.target.value)} className="w-full p-4 bg-orange-50 rounded-2xl mb-4 font-bold text-[11px] h-20 outline-none resize-none" />
            
            {/* LISTA CARRITO */}
            <div className="space-y-2 mb-4 max-h-60 overflow-auto pr-1">
              {carrito.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase">{item.nombre}</p>
                    <p className="text-[10px] text-orange-600 font-bold">Bs {(item.precio * item.cantidad).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <BotonAccionmenu color="red" onClick={() => gestionarCarrito(item, 'restar')}>-</BotonAccionmenu>
                    <span className="font-black text-xs">{item.cantidad}</span>
                    <BotonAccionmenu color="green" onClick={() => gestionarCarrito(item, 'sumar')}>+</BotonAccionmenu>
                  </div>
                </div>
              ))}
            </div>

            {carrito.length > 0 && (
              <div className="pt-4 border-t-2 border-dashed border-gray-100">
                {/* MÉTODOS DE PAGO */}
                <div className="flex gap-2 mb-4">
                  {['qr', 'ef', 'pya'].map((m: any) => (
                    <button key={m} onClick={() => setMetodoPago(m)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${metodoPago === m ? 'bg-orange-500 border-orange-500 text-white shadow-lg' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                      {m === 'ef' ? 'Efectivo' : m.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* CALCULADORA DE CAMBIO */}
                {metodoPago === 'ef' && (
                  <div className="mb-4 bg-gray-50 p-3 rounded-3xl border border-gray-100 animate-in zoom-in duration-200">
                    <div className="flex gap-2 mb-3">
                      {[20, 50, 100, 200].map(monto => (
                        <button key={monto} onClick={() => setMontoRecibido(monto)} className="flex-1 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 hover:bg-green-50">Bs {monto}</button>
                      ))}
                    </div>
                    <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase leading-none">Cambio</p>
                        <p className="text-lg font-black text-green-600 leading-none">Bs {cambio}</p>
                      </div>
                      <input type="number" placeholder="Paga con..." value={montoRecibido || ''} onChange={(e) => setMontoRecibido(Number(e.target.value))} className="w-24 text-right bg-transparent font-black text-gray-800 outline-none" />
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center mb-4 px-2">
                  <span className="text-3xl font-black text-gray-800 tracking-tighter">Bs {totalVenta.toFixed(2)}</span>
                </div>
                
                <button 
                  onClick={() => solicitarConfirmacion(metodoPago)} 
                  className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition hover:bg-orange-600"
                >
                  CONFIRMAR REGISTRO 🧾
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE IMPRESIÓN CORREGIDO */}
      <ModalImprimir 
        isOpen={showModal} 
        onConfirm={manejarGuardadoEImpresion} // Guarda en DB e Imprime
        onCancel={cerrarSinRegistrar}        // Solo cierra (La "X")
      />
    </>
  )
}
