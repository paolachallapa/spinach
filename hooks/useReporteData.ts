import { useMemo } from 'react';

export interface ItemResumen {
  nombre: string;
  cantidad: number;
  total: number;
}

export const useReporteData = (ventas: any[], gastos: any[], productos: any[], fecha: string) => {
  return useMemo(() => {
    // 1. Filtrado por fecha (usando el formato sv-SE para evitar desfases de zona horaria)
    const filtradas = ventas.filter(v => 
      v.creado_at && new Date(v.creado_at).toLocaleDateString('sv-SE') === fecha && v.estado !== 'anulado'
    );
    
    const gFiltrados = gastos?.filter(g => 
      g.creado_at && new Date(g.creado_at).toLocaleDateString('sv-SE') === fecha
    ) || [];

    // 2. Reducción de datos (Productos y Métodos de Pago)
    const resumen = filtradas.reduce((acc, v) => {
      // --- Lógica de Categorización (Principales vs Extras) ---
      const infoProd = productos?.find(p => p.nombre === v.nombre_producto);
      const esExtra = infoProd?.es_extra || false;
      const categoria = esExtra ? acc.extras : acc.principales;

      if (!categoria[v.nombre_producto]) {
        categoria[v.nombre_producto] = { nombre: v.nombre_producto, cantidad: 0, total: 0 };
      }
      categoria[v.nombre_producto].cantidad += 1;
      categoria[v.nombre_producto].total += Number(v.precio_venta);

      // --- Lógica de Finanzas (Nuevas Columnas pago_ef y pago_qr) ---
      // Sumamos los montos reales independientemente de si el método dice "mix", "ef" o "qr"
      acc.metodos.ef += Number(v.pago_ef || 0);
      acc.metodos.qr += Number(v.pago_qr || 0);

      // Si el método es PedidosYa, sumamos al total de PYA (que usualmente no entra por ef/qr)
      if (v.metodo_pago === 'pya') {
        acc.metodos.pya += Number(v.precio_venta || 0);
      }

      return acc;
    }, { 
      principales: {} as any, 
      extras: {} as any, 
      metodos: { ef: 0, qr: 0, pya: 0 } 
    });

    // 3. Cálculos Finales
    const listaPrincipales = Object.values(resumen.principales) as ItemResumen[];
    const listaExtras = Object.values(resumen.extras) as ItemResumen[];
    
    const totalVentas = [...listaPrincipales, ...listaExtras].reduce((a, b) => a + b.total, 0);
    const totalGastos = gFiltrados.reduce((a, b) => a + Number(b.monto), 0);
    
    // El Efectivo Neto es: Todo lo que entró en efectivo MINUS los gastos realizados
    const efectivoNeto = resumen.metodos.ef - totalGastos;

    const fechaFormateada = new Date(fecha + "T00:00:00").toLocaleDateString('es-BO', { 
      dateStyle: 'full' 
    });

    return {
      listaPrincipales,
      listaExtras,
      metodos: resumen.metodos,
      totales: {
        totalVentas,
        totalGastos,
        efectivoNeto: efectivoNeto > 0 ? efectivoNeto : 0 // Evita mostrar negativos si los gastos superan la caja
      },
      fechaFormateada
    };
  }, [ventas, gastos, productos, fecha]);
};
