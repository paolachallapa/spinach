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
   * Ahora recibe 7 argumentos para manejar pagos desglosados (Efectivo y QR).
   * Implementa la lógica de "Primera Fila" para no duplicar montos financieros.
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
    // 1. Aplanamos el carrito para insertar una fila por cada UNIDAD de producto
    // Si el cliente lleva 2 Hamburguesas, se generan 2 filas de venta.
    const listaAplanada = carrito.flatMap(item => 
      Array.from({ length: item.cantidad }).map(() => ({
        producto_id: item.id,
        nombre_producto: item.nombre,
        precio_venta: Number(item.precio),
        cliente: cliente.toUpperCase(),
        notas: notas,          
        metodo_pago: metodo,
        cajero: cajero
      }))
    );

    // 2. Lógica Anti-Duplicación de Totales:
    // Asignamos los montos de pago SOLO a la primera fila del pedido (index === 0).
    // Las demás filas van con 0 en pago_ef y pago_qr para que el SUM() de la DB sea exacto.
    const nuevasVentas = listaAplanada.map((venta, index) => ({
      ...venta,
      pago_ef: index === 0 ? pago_ef : 0,
      pago_qr: index === 0 ? pago_qr : 0
    }));

    // 3. Insertar todas las filas en la tabla 'ventas' de Supabase
    const { error: errorVenta } = await supabase.from('ventas').insert(nuevasVentas);
    if (errorVenta) return { error: errorVenta };

    // 4. Actualización de Stock (Loop para reducir existencias)
    for (const item of carrito) {
      await supabase.from('productos')
        .update({ stock: item.stock - item.cantidad })
        .eq('id', item.id);
    }

    return { error: null };
  }
};
