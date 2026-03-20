'use client'
import { api } from '@/lib/api'
import { estilos, BotonAccion, uiStyles } from './UI'
import ModalCantidad from './ui/ModalCantidad'
import ModalConfirmar from './ui/ModalConfirmar'
import { useGestion } from '@/hooks/useGestion'

export default function Gestion({ productos, alTerminar }: any) {
  // 1. Asegúrate de extraer esExtra y setEsExtra del hook
  const {
    nombre, setNombre, precio, setPrecio, stock, setStock, 
    esALaCarta, setEsALaCarta, esExtra, setEsExtra, // <-- Añadidos aquí
    editandoId, modalStock, setModalStock, modalBorrar, setModalBorrar,
    prepararEdicion, ejecutarAccionRapida, confirmarSumaStock, confirmarBorrado, guardarProducto, limpiarFormulario
  } = useGestion(alTerminar);

  const productosActivos = productos.filter((p: any) => p.archivado !== true);

  return (
    <div className={uiStyles.container}>
      {/* Modales */}
      <ModalCantidad 
        isOpen={modalStock.abierto}
        onClose={() => setModalStock({ ...modalStock, abierto: false })}
        onConfirm={confirmarSumaStock}
        titulo={`Unidades para "${modalStock.nombre}"`}
        valorInicial={10} 
      />

      <ModalConfirmar 
        isOpen={modalBorrar.abierto}
        onClose={() => setModalBorrar({ ...modalBorrar, abierto: false })}
        onConfirm={confirmarBorrado}
        titulo="¿Quitar Platillo?"
        mensaje={`¿Estás seguro que deseas quitar "${modalBorrar.nombre}"?`}
      />

      {/* Lista de Inventario */}
      <div className={estilos.card}>
        <h2 className="text-xl font-bold text-purple-700 mb-4 uppercase tracking-tight">📦 Inventario Actual</h2>
        <div className="grid gap-3">
          {productosActivos.map((p: any) => (
            <div key={p.id} className={uiStyles.productCard(p.activo)}>
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start">
                  <p className={`font-black uppercase text-sm ${p.activo ? 'text-gray-800' : 'text-gray-500 line-through'}`}>{p.nombre}</p>
                  
                  {/* Badge para Carta */}
                  {p.es_a_la_carta && (
                    <span className="text-[8px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-bold border border-orange-200">CARTA</span>
                  )}
                  
                  {/* 2. Badge visual para EXTRAS en la lista */}
                  {p.es_extra && (
                    <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold border border-blue-200">EXTRA</span>
                  )}
                </div>
                
                <div className="flex justify-center md:justify-start gap-3 mt-1">
                  <span className={uiStyles.badgeStock}>STOCK: {p.stock}</span>
                  <span className={uiStyles.badgePrecio}>Bs {Number(p.precio).toFixed(2)}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <BotonAccion color="yellow" onClick={() => prepararEdicion(p)}>✏️</BotonAccion>
                <BotonAccion color={p.activo ? "blue" : "gray"} onClick={() => ejecutarAccionRapida(p, api.toggleVisibilidad, p.activo)}>{p.activo ? '👁️' : '🙈'}</BotonAccion>
                <BotonAccion color="purple" onClick={() => setModalStock({ abierto: true, id: p.id, nombre: p.nombre, actual: p.stock })}>+</BotonAccion>
                <BotonAccion color="red" onClick={() => setModalBorrar({ abierto: true, id: p.id, nombre: p.nombre })}>🗑️</BotonAccion>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario */}
      <form className={estilos.formCard} onSubmit={guardarProducto}>
        <h2 className="text-xl font-black text-gray-700 mb-4 uppercase tracking-tighter">
          {editandoId ? '📝 Editar producto' : '🆕 Nuevo producto'}
        </h2>
        <div className="space-y-4">
          <input type="text" placeholder="NOMBRE" value={nombre} onChange={e => setNombre(e.target.value)} className={estilos.input} required />
          <div className="flex gap-3">
            <input type="number" placeholder="PRECIO" value={precio} onChange={e => setPrecio(e.target.value)} className={estilos.input} required />
            <input type="number" placeholder="STOCK" value={stock} onChange={e => setStock(e.target.value)} className={estilos.input} required />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Opción Carta */}
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer" onClick={() => setEsALaCarta(!esALaCarta)}>
              <input type="checkbox" checked={esALaCarta} readOnly className="w-4 h-4 accent-orange-500 cursor-pointer" />
              <span className="text-[10px] font-black text-orange-600 uppercase">¿Es a la carta?</span>
            </div>

            {/* Opción Extra */}
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer" onClick={() => setEsExtra(!esExtra)}>
              <input type="checkbox" checked={esExtra} readOnly className="w-4 h-4 accent-blue-500 cursor-pointer" />
              <span className="text-[10px] font-black text-blue-600 uppercase">¿Es un extra?</span>
            </div>
          </div>

          <button className={estilos.botonGuardar}>{editandoId ? 'ACTUALIZAR CAMBIOS' : 'GUARDAR PRODUCTO'}</button>
          
          {editandoId && (
            <button type="button" onClick={limpiarFormulario} className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
              Cancelar edición
            </button>
          )}
        </div>
      </form>
    </div>
  )
}