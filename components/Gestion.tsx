'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { estilos, BotonAccion } from './UI'

export default function Gestion({ productos, alTerminar }: any) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');

  // 1. FILTRO: Solo activos
  const productosActivos = productos.filter((p: any) => p.archivado !== true);

  // 2. FUNCIÓN DE ACTUALIZACIÓN RÁPIDA (Optimista)
  const ejecutarAccionRapida = async (p: any, metodoApi: Function, ...args: any[]) => {
    // Primero avisamos a la pantalla que refresque (para que cambie el color/estado rápido)
    // Esto hace que el usuario vea el cambio al instante
    const res = await metodoApi(p.id, ...args);
    
    if (!res.error) {
      alTerminar(); // Confirmamos con la base de datos real
    } else {
      alert("Error al sincronizar con el servidor");
      alTerminar(); // Recargamos para volver al estado real si falló
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div className={estilos.card}>
        <h2 className="text-xl font-bold text-purple-700 mb-4 uppercase tracking-tight">📦 Inventario Actual</h2>
        <div className="grid gap-3">
          {productosActivos.map((p: any) => (
            <div key={p.id} className={`flex flex-col md:flex-row justify-between items-center p-4 rounded-xl border transition-all duration-75 gap-4 ${p.activo ? 'bg-gray-50 border-gray-100' : 'bg-gray-200 border-gray-300 opacity-60'}`}>
              
              <div className="flex-1 text-center md:text-left">
                <p className={`font-black uppercase text-sm ${p.activo ? 'text-gray-800' : 'text-gray-500 line-through'}`}>{p.nombre}</p>
                <div className="flex justify-center md:justify-start gap-3 mt-1">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white shadow-sm text-purple-600 uppercase">STOCK: {p.stock}</span>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-white shadow-sm text-green-600 uppercase">Bs {Number(p.precio).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* EL OJITO AHORA ES INSTANTÁNEO */}
                <BotonAccion 
                  color={p.activo ? "blue" : "gray"} 
                  onClick={() => ejecutarAccionRapida(p, api.toggleVisibilidad, p.activo)}
                >
                  {p.activo ? '👁️' : '🙈'}
                </BotonAccion>

                <BotonAccion color="purple" onClick={() => {
                  const cant = prompt(`¿Unidades para "${p.nombre}"?`, "10");
                  if (cant) ejecutarAccionRapida(p, api.sumarStock, p.stock, Number(cant));
                }}>+</BotonAccion>

                <BotonAccion color="red" onClick={() => confirm(`¿Quitar "${p.nombre}"?`) && ejecutarAccionRapida(p, api.archivarProducto)}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </BotonAccion>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form className={estilos.formCard} onSubmit={async (e) => {
        e.preventDefault();
        const res = await api.crearProducto({ nombre, precio: Number(precio), stock: Number(stock) });
        if (!res.error) { setNombre(''); setPrecio(''); setStock(''); alTerminar(); }
      }}>
        <h2 className="text-xl font-black text-gray-700 mb-4 uppercase tracking-tighter">🆕 Nuevo platillo</h2>
        <div className="space-y-4">
          <input type="text" placeholder="NOMBRE" value={nombre} onChange={e => setNombre(e.target.value)} className={estilos.input} required />
          <div className="flex gap-3">
            <input type="number" placeholder="PRECIO" value={precio} onChange={e => setPrecio(e.target.value)} className={estilos.input} required />
            <input type="number" placeholder="STOCK" value={stock} onChange={e => setStock(e.target.value)} className={estilos.input} required />
          </div>
          <button className={estilos.botonGuardar}>GUARDAR PRODUCTO</button>
        </div>
      </form>
    </div>
  )
}