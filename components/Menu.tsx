'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { printer } from '@/lib/printer'
import { estilos, BotonAccionmenu } from './UI'

export default function Menu({ productos, ventas, alTerminar }: any) {
  const [cliente, setCliente] = useState('')
  const [notas, setNotas] = useState('') 
  const [carrito, setCarrito] = useState<any[]>([])

  // Filtros y Cálculos
  const productosVisibles = productos?.filter((p: any) => p.activo && !p.archivado) || [];
  const hoy = new Date().toLocaleDateString('sv-SE');
  const totalCajaHoy = ventas?.filter((v: any) => v.creado_at?.startsWith(hoy))
    .reduce((acc: number, v: any) => acc + Number(v.precio_venta), 0) || 0;

  // Lógica de Carrito (Podría ir a un Hook, pero aquí ya es bastante limpia)
  const gestionarCarrito = (p: any, accion: 'sumar' | 'restar') => {
    const existe = carrito.find(item => item.id === p.id);
    if (accion === 'sumar') {
      if (p.stock <= (existe?.cantidad || 0)) return alert("¡Sin stock!");
      existe 
        ? setCarrito(carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i))
        : setCarrito([...carrito, { ...p, cantidad: 1 }]);
    } else {
      if (!existe) return;
      existe.cantidad > 1 
        ? setCarrito(carrito.map(i => i.id === p.id ? { ...i, cantidad: i.cantidad - 1 } : i))
        : setCarrito(carrito.filter(i => i.id !== p.id));
    }
  };

  const handleConfirmar = async () => {
    if (!cliente.trim() || carrito.length === 0) return alert("Datos incompletos");
    
    const totalPedido = carrito.reduce((a, b) => a + (b.precio * b.cantidad), 0);
    const { error } = await api.registrarPedido(cliente, carrito);

    if (!error) {
      if (confirm("¿Imprimir Ticket?")) {
        printer.imprimirTicket(cliente, carrito, totalPedido, notas);
      }
      setCarrito([]); setCliente(''); setNotas('');
      alTerminar();
    } else {
      alert("Error al registrar");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full animate-in fade-in duration-500">
      {/* SECCIÓN PRODUCTOS */}
      <div className="flex-1 space-y-4">
        <div className="bg-green-600 p-6 rounded-3xl text-center text-white shadow-lg">
          <p className="text-4xl font-black italic">Bs {totalCajaHoy.toFixed(2)}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-100">Caja Hoy</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {productosVisibles.map((p: any) => (
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
      </div>

      {/* SECCIÓN COMANDA */}
      <div className="w-full lg:w-96">
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-t-8 border-orange-500">
          <input placeholder="CLIENTE" value={cliente} onChange={e => setCliente(e.target.value)} className={estilos.input + " mb-2"} />
          <textarea placeholder="NOTAS" value={notas} onChange={e => setNotas(e.target.value)} className="w-full p-4 bg-orange-50 rounded-2xl mb-4 font-bold text-[11px] h-20 outline-none" />
          
          <div className="space-y-2 mb-4 max-h-60 overflow-auto">
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
              <button onClick={handleConfirmar} className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black text-sm shadow-xl active:scale-95 transition">
                CONFIRMAR Y TICKET 🧾
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}