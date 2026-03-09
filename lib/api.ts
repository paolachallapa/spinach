import { supabase } from './supabase'

export const api = {
  // --- PRODUCTOS ---
  
  async crearProducto(datos: { nombre: string, precio: number, stock: number }) {
    return await supabase.from('productos').insert([
      { 
        ...datos, 
        nombre: datos.nombre.toUpperCase(), 
        activo: true, 
        archivado: false 
      }
    ]);
  },

  async sumarStock(id: string, stockActual: number, cantidadASumar: number) {
    return await supabase
      .from('productos')
      .update({ stock: stockActual + cantidadASumar })
      .eq('id', id);
  },

  async toggleVisibilidad(id: string, estadoActivo: boolean) {
    return await supabase
      .from('productos')
      .update({ activo: !estadoActivo })
      .eq('id', id);
  },

  async archivarProducto(id: string) {
    return await supabase
      .from('productos')
      .update({ archivado: true, activo: false })
      .eq('id', id);
  },

  // --- VENTAS ---

  async registrarPedido(cliente: string, carrito: any[]) {
    // 1. Preparar datos de ventas
    const nuevasVentas = carrito.flatMap(item => 
      Array.from({ length: item.cantidad }).map(() => ({
        producto_id: item.id,
        nombre_producto: item.nombre,
        precio_venta: Number(item.precio),
        cliente: cliente.toUpperCase()
      }))
    );

    // 2. Insertar ventas en Supabase
    const { error: errorVenta } = await supabase.from('ventas').insert(nuevasVentas);
    if (errorVenta) return { error: errorVenta };

    // 3. Actualizar stock de cada producto vendido
    for (const item of carrito) {
      await supabase.from('productos')
        .update({ stock: item.stock - item.cantidad })
        .eq('id', item.id);
    }

    return { error: null };
  }
};