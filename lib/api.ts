import { supabase } from './supabase'

export const api = {
  // --- PRODUCTOS ---
  
  async crearProducto(datos: { nombre: string, precio: number, stock: number, es_a_la_carta: boolean }) {
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

  async editarProducto(id: string, datos: { nombre: string, precio: number, stock: number, es_a_la_carta: boolean }) {
    return await supabase
      .from('productos')
      .update({ 
        ...datos, 
        nombre: datos.nombre.toUpperCase() 
      })
      .eq('id', id);
  },

  // --- VENTAS ---

  /**
   * REGISTRAR PEDIDO
   * Maneja 7 argumentos para pagos desglosados (Efectivo y QR).
   * Implementa lógica de "Primera Fila" para evitar duplicar montos en reportes financieros.
   */
  async registrarPedido(
    cliente: string, 
    carrito: any[], 
    notas: string, 
    metodo: string, 
    cajero: string,
    pago_ef: number = 0, 
    pago_qr: number = 0
  ) {
    // 1. Aplanamos el carrito para insertar una fila por cada unidad de producto
    const listaAplanada = carrito.flatMap(item => 
      Array.from({ length: item.cantidad }).map(() => ({
        producto_id: item.id,
        nombre_producto: item.nombre,
        precio_venta: Number(item.precio),
        cliente: cliente.toUpperCase(),
        notas: notas,          
        metodo_pago: metodo,
        cajero: cajero,
        estado: 'completado' // Aseguramos el estado para que aparezca en reportes
      }))
    );

    // 2. Lógica Anti-Duplicación:
    // Asignamos los montos de pago SOLO a la primera fila del pedido.
    const nuevasVentas = listaAplanada.map((venta, index) => ({
      ...venta,
      pago_ef: index === 0 ? pago_ef : 0,
      pago_qr: index === 0 ? pago_qr : 0
    }));

    // 3. Insertar filas en Supabase
    const { data, error: errorVenta } = await supabase.from('ventas').insert(nuevasVentas).select();
    
    if (errorVenta) return { error: errorVenta, data: null };

    // 4. Actualización de Stock
    for (const item of carrito) {
      await supabase.from('productos')
        .update({ stock: item.stock - item.cantidad })
        .eq('id', item.id);
    }

    // Retornamos data y error para satisfacer a TypeScript en useMenuLogic
    return { error: null, data };
  }
};
