'use client'
import { printer } from '@/lib/printer'
import { estilos, BotonAccionmenu } from './UI'
import { ModalImprimir } from './ModalImprimir'
import { useMenuLogic } from '@/hooks/useMenuLogic'

export default function Menu({ productos, ventas, alTerminar }: any) {
  const {
    cliente, setCliente, notas, setNotas, carrito,
    gestionarCarrito, handleConfirmar, showModal, 
    datosParaImprimir, finalizarTodo
  } = useMenuLogic(alTerminar);

  // Filtros rápidos
  const productosBase = productos?.filter((p: any) => p.activo && !p.archivado) || [];
  const principales = productosBase.filter((p: any) => !p.es_a_la_carta);
  const aLaCarta = productosBase.filter((p: any) => p.es_a_la_carta);

  // --- SOLUCIÓN PARA LA CAJA DE HOY ---
  const hoyCeroHoras = new Date();
  hoyCeroHoras.setHours(0, 0, 0, 0); // Establecemos el inicio exacto del día

  const totalCajaHoy = ventas?.filter((v: any) => {
    // Convertimos la fecha de la venta a un objeto de fecha real
    const fechaVenta = new Date(v.creado_at);
    // Solo incluimos ventas que ocurrieron hoy
    return fechaVenta >= hoyCeroHoras;
  })
  .reduce((acc: number, v: any) => acc + Number(v.precio_venta), 0) || 0;
  // ------------------------------------

  const confirmarImpresion = () => {
    if (datosParaImprimir) {
      printer.imprimirTicket(
        datosParaImprimir.cliente, datosParaImprimir.carrito, 
        datosParaImprimir.total, datosParaImprimir.notas, datosParaImprimir.nro
      );
    }
    finalizarTodo();
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in duration-500">
        {/* SECCIÓN PRODUCTOS */}
        <div className="flex-1 space-y-4">
          <div className="bg-green-600 p-6 rounded-3xl text-center text-white shadow-lg">
            <p className="text-4xl font-black italic">Bs {totalCajaHoy.toFixed(2)}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-green-100">Caja Hoy</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {principales.map((p: any) => (
              <button key={p.id} onClick={() => gestionarCarrito(p, 'sumar')} disabled={p.stock <= 0}
                className={`p-4 rounded-2xl shadow-sm border flex justify-between items-center transition-all active:scale-95 ${p.stock > 0 ? 'bg-white' : 'bg-gray-100 opacity-50'}`}>
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
                  const plato = aLaCarta.find((p: any) => p.id === e.target.value);
                  if (plato) { gestionarCarrito(plato, 'sumar'); e.target.value = ""; }
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
        </div>

        {/* SECCIÓN COMANDA */}
        <div className="w-full lg:w-96">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-t-8 border-orange-500 sticky top-6">
            <input placeholder="MESA" value={cliente} onChange={e => setCliente(e.target.value)} className={estilos.input + " mb-2 uppercase"} />
            <textarea placeholder="NOTAS" value={notas} onChange={e => setNotas(e.target.value)} className="w-full p-4 bg-orange-50 rounded-2xl mb-4 font-bold text-[11px] h-20 outline-none" />
            
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
                <div className="flex justify-between items-center mb-4">
                  <span className="text-3xl font-black text-gray-800">Bs {carrito.reduce((a,b)=>a+(b.precio*b.cantidad),0).toFixed(2)}</span>
                </div>
                <button onClick={handleConfirmar} className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition hover:bg-orange-600">
                  CONFIRMAR Y TICKET 🧾
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ModalImprimir 
        isOpen={showModal} 
        onConfirm={confirmarImpresion} 
        onCancel={finalizarTodo} 
      />
    </>
  )
}