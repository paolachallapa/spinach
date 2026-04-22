'use client'

import { useState } from 'react' 
import { printer } from '@/lib/printer'
import { estilos, BotonAccionmenu } from './UI'
import { ModalImprimir } from '@/components/ui/ModalImprimir'
import { useMenuLogic } from '@/hooks/useMenuLogic'

export default function Menu({ productos, ventas, alTerminar, perfilUsuario }: any) {
  const {
    cliente, setCliente, notas, setNotas, carrito,
    gestionarCarrito, solicitarConfirmacion, ejecutarRegistroDB, 
    showModal, datosParaImprimir, finalizarLimpiarTodo, cerrarSinRegistrar
  } = useMenuLogic(alTerminar, perfilUsuario);

  // ESTADOS ACTUALIZADOS PARA MIX
  const [metodoPago, setMetodoPago] = useState<'qr' | 'ef' | 'pya' | 'mix'>('ef');
  const [pagosMix, setPagosMix] = useState({ ef: 0, qr: 0 });
  const [montoRecibido, setMontoRecibido] = useState<number>(0);
  
  // ESTADO DE BLOQUEO ANTI-DUPLICADOS
  const [procesando, setProcesando] = useState(false);

  const totalVenta = carrito.reduce((a, b) => a + (b.precio * b.cantidad), 0);
  
  // Lógica de cambio adaptada para ambos modos
  const cambio = metodoPago === 'ef' 
    ? (montoRecibido > totalVenta ? (montoRecibido - totalVenta).toFixed(2) : "0.00")
    : (pagosMix.ef > (totalVenta - pagosMix.qr) ? (pagosMix.ef - (totalVenta - pagosMix.qr)).toFixed(2) : "0.00");

  const productosBase = productos?.filter((p: any) => p.activo && !p.archivado) || [];
  const principales = productosBase.filter((p: any) => !p.es_a_la_carta && !p.es_extra);
  const aLaCarta = productosBase.filter((p: any) => p.es_a_la_carta);
  const extras = productosBase.filter((p: any) => p.es_extra);

  const hoyCeroHoras = new Date();
  hoyCeroHoras.setHours(0, 0, 0, 0);
  
  const totalCajaHoy = ventas?.filter((v: any) => {
    const fechaVenta = new Date(v.creado_at);
    return fechaVenta >= hoyCeroHoras && v.estado !== 'anulado';
  })
  .reduce((acc: number, v: any) => acc + Number(v.precio_venta), 0) || 0;

  const manejarGuardadoEImpresion = async () => {
    if (procesando) return; // Si ya se está procesando, bloqueamos clics extras

    setProcesando(true);

    try {
      // Calculamos los montos según el método elegido
      const montosParaDB = {
        pago_ef: metodoPago === 'ef' ? totalVenta : (metodoPago === 'mix' ? pagosMix.ef : 0),
        pago_qr: metodoPago === 'qr' ? totalVenta : (metodoPago === 'mix' ? pagosMix.qr : 0)
      };

      // Pasamos los montos a la función del hook y esperamos
      const datosFinales = await ejecutarRegistroDB(metodoPago, montosParaDB);
      
      if (datosFinales) {
        await printer.imprimirTicket(
          datosFinales.cliente, 
          datosFinales.carrito, 
          datosFinales.total, 
          datosFinales.notes, 
          datosFinales.nro, 
          datosFinales.metodo,
          metodoPago === 'mix' ? pagosMix : null
        );
          
        setMontoRecibido(0);
        setPagosMix({ ef: 0, qr: 0 });
        setMetodoPago('ef');
        finalizarLimpiarTodo();
      }
    } catch (error) {
      console.error("Error al registrar:", error);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in duration-500">
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

          {aLaCarta.length > 0 && (
            <div className="mt-6 p-4 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-2">Platos a la Carta</p>
              <select className="w-full p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl font-bold text-xs text-orange-600 outline-none focus:border-orange-500 transition-all"
                onChange={(e) => {
                  const p = aLaCarta.find((x: any) => x.id === e.target.value);
                  if (p) { gestionarCarrito(p, 'sumar'); e.target.value = ""; }
                }}>
                <option value="">Selecciona un adicional...</option>
                {aLaCarta.map((p: any) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.nombre.toUpperCase()} - Bs {p.precio} {p.stock <= 0 ? '(AGOTADO)' : `(Stock: ${p.stock})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {extras.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-3xl border-2 border-dashed border-gray-200">
              <p className="text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-2">Extras / Adicionales</p>
              <select className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl font-bold text-xs text-blue-600 outline-none focus:border-blue-500 transition-all"
                onChange={(e) => {
                  const p = extras.find((x: any) => x.id === e.target.value);
                  if (p) { gestionarCarrito(p, 'sumar'); e.target.value = ""; }
                }}>
                <option value="">Selecciona un extra...</option>
                {extras.map((p: any) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.nombre.toUpperCase()} - Bs {p.precio} {p.stock <= 0 ? '(AGOTADO)' : `(Stock: ${p.stock})`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-t-8 border-orange-500 sticky top-6">
            <input placeholder="MESA / CLIENTE" value={cliente} onChange={e => setCliente(e.target.value)} className={estilos.input + " mb-2 uppercase"} />
            <textarea placeholder="NOTAS DEL PEDIDO" value={notas} onChange={e => setNotas(e.target.value)} className="w-full p-4 bg-orange-50 rounded-2xl mb-4 font-bold text-[11px] h-20 outline-none resize-none" />
            
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
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => setMetodoPago('qr')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${metodoPago === 'qr' ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>QR 📱</button>
                  <button onClick={() => setMetodoPago('ef')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${metodoPago === 'ef' ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-200' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>EF 💵</button>
                  <button onClick={() => setMetodoPago('pya')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${metodoPago === 'pya' ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-200' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>PYA 🛵</button>
                  <button onClick={() => setMetodoPago('mix')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${metodoPago === 'mix' ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>MIX 🔀</button>
                </div>

                {/* OPCIÓN MIXTA */}
                {metodoPago === 'mix' && (
                  <div className="mb-4 space-y-2 bg-purple-50 p-3 rounded-2xl border border-purple-100 animate-in zoom-in duration-200">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-purple-200">
                      <span className="text-[9px] font-black w-10">EF:</span>
                      <input type="number" placeholder="0.00" value={pagosMix.ef || ''} onChange={(e) => setPagosMix({...pagosMix, ef: Number(e.target.value)})} className="flex-1 text-right font-black text-xs outline-none" />
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-purple-200">
                      <span className="text-[9px] font-black w-10">QR:</span>
                      <input type="number" placeholder="0.00" value={pagosMix.qr || ''} onChange={(e) => setPagosMix({...pagosMix, qr: Number(e.target.value)})} className="flex-1 text-right font-black text-xs outline-none" />
                    </div>
                    <p className="text-[8px] text-center font-bold text-purple-400">RESTANTE: Bs {(totalVenta - pagosMix.ef - pagosMix.qr).toFixed(2)}</p>
                  </div>
                )}

                {metodoPago === 'ef' && (
                  <div className="mb-4 bg-gray-50 p-3 rounded-3xl border border-gray-100 animate-in zoom-in duration-200">
                    <div className="flex gap-2 mb-3">
                      {[20, 50, 100, 200].map(monto => (
                        <button key={monto} onClick={() => setMontoRecibido(monto)} className="flex-1 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black text-gray-600 hover:bg-green-50 transition-all">Bs {monto}</button>
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
                  disabled={metodoPago === 'mix' && (pagosMix.ef + pagosMix.qr) < totalVenta}
                  className={`w-full py-5 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition text-white ${metodoPago === 'mix' ? 'bg-purple-600' : 'bg-orange-500 hover:bg-orange-600'} disabled:opacity-50`}
                >
                  {metodoPago === 'mix' ? 'CONFIRMAR PAGO MIXTO 🧾' : 'CONFIRMAR REGISTRO 🧾'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalImprimir 
        isOpen={showModal} 
        onConfirm={manejarGuardadoEImpresion} 
        onCancel={cerrarSinRegistrar} 
        isProcessing={procesando}
      />
    </>
  )
}
