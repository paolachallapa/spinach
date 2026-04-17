// hooks/useReporteData.ts
import { useMemo } from 'react';

export interface ItemResumen {
  nombre: string;
  cantidad: number;
  total: number;
}

export const useReporteData = (ventas: any[], gastos: any[], productos: any[], fecha: string) => {
  return useMemo(() => {
    // Filtrado por fecha
    const filtradas = ventas.filter(v => v.creado_at && new Date(v.creado_at).toLocaleDateString('sv-SE') === fecha);
    const gFiltrados = gastos?.filter(g => new Date(g.creado_at).toLocaleDateString('sv-SE') === fecha) || [];

    // Reducción de datos separando por la columna 'es_extra' de tu DB
    const resumen = filtradas.reduce((acc, v) => {
      const infoProd = productos?.find(p => p.nombre === v.nombre_producto);
      const esExtra = infoProd?.es_extra || false;
      const categoria = esExtra ? acc.extras : acc.principales;

      if (!categoria[v.nombre_producto]) {
        categoria[v.nombre_producto] = { nombre: v.nombre_producto, cantidad: 0, total: 0 };
      }
      categoria[v.nombre_producto].cantidad += 1;
      categoria[v.nombre_producto].total += Number(v.precio_venta);

      const metodo = v.metodo_pago || 'ef';
      acc.metodos[metodo] = (acc.metodos[metodo] || 0) + Number(v.precio_venta);

      return acc;
    }, { principales: {} as any, extras: {} as any, metodos: { ef: 0, qr: 0, pya: 0 } });

    const listaPrincipales = Object.values(resumen.principales) as ItemResumen[];
    const listaExtras = Object.values(resumen.extras) as ItemResumen[];
    const totalVentas = [...listaPrincipales, ...listaExtras].reduce((a, b) => a + b.total, 0);
    const totalGastos = gFiltrados.reduce((a, b) => a + Number(b.monto), 0);
    const fechaFormateada = new Date(fecha + "T00:00:00").toLocaleDateString('es-BO', { dateStyle: 'full' });

    return {
      listaPrincipales,
      listaExtras,
      metodos: resumen.metodos,
      totales: {
        totalVentas,
        totalGastos,
        efectivoNeto: resumen.metodos.ef - totalGastos
      },
      fechaFormateada
    };
  }, [ventas, gastos, productos, fecha]);
};
