export function calcularBalance(
  ventas: any[], 
  gastos: any[], 
  modo: 'semanal' | 'mensual' | 'anual' | 'rango', 
  fechaInicio: string, 
  fechaFin: string, 
  tipoFiltro: 'todos' | 'ingresos' | 'egresos' = 'todos'
) {
  // Creamos la fecha de referencia de hoy de forma limpia
  const hoy = new Date(fechaInicio + 'T00:00:00');
  
  let vF: any[] = [];
  let gF: any[] = [];

  // --- LÓGICA DE FILTRADO MEJORADA ---
  if (modo === 'rango') {
    const inicioRango = new Date(fechaInicio + 'T00:00:00');
    const finRango = new Date(fechaFin + 'T23:59:59');
    
    if (tipoFiltro === 'todos' || tipoFiltro === 'ingresos') {
      vF = ventas?.filter((v: any) => {
        const f = new Date(v.creado_at || v.created_at);
        return f >= inicioRango && f <= finRango;
      }) || [];
    }
    if (tipoFiltro === 'todos' || tipoFiltro === 'egresos') {
      gF = gastos?.filter((g: any) => {
        const f = new Date(g.created_at || g.creado_at);
        return f >= inicioRango && f <= finRango;
      }) || [];
    }
  } else {
    // Para modos normales, evaluamos individualmente cada registro sin romper el flujo
    const filtrarPorModo = (fechaStr: string) => {
      const f = new Date(fechaStr);
      
      if (modo === 'semanal') {
        // 7 días atrás a partir de la fecha de referencia
        const sieteDiasAtras = new Date(hoy);
        sieteDiasAtras.setDate(hoy.getDate() - 7);
        return f >= sieteDiasAtras && f <= new Date(fechaInicio + 'T23:59:59');
      }
      
      if (modo === 'mensual') {
        // Trae todo lo que corresponda al mismo mes y año de la fecha de referencia
        return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear();
      }
      
      if (modo === 'anual') {
        // ¡TRAE TODO EL AÑO COMPLETO! Al estar en 2026, te incluirá marzo, abril y mayo juntos
        return f.getFullYear() === hoy.getFullYear();
      }
      
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModo(v.creado_at || v.created_at)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModo(g.created_at || g.creado_at)) || [];
  }

  // --- CÁLCULO DE TOTALES ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- CONSTRUCCIÓN DE LA TABLA POR DÍA (RESPETA EL FILTRO EN CUALQUIER MODO) ---
  const gananciasPorDia: { [key: string]: { ingresos: number; egresos: number } } = {};

  if (modo !== 'rango' || tipoFiltro === 'todos' || tipoFiltro === 'ingresos') {
    vF.forEach((v: any) => {
      const fechaClave = new Date(v.creado_at || v.created_at).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      if (!gananciasPorDia[fechaClave]) gananciasPorDia[fechaClave] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fechaClave].ingresos += Number(v.precio_venta || 0);
    });
  }

  if (modo !== 'rango' || tipoFiltro === 'todos' || tipoFiltro === 'egresos') {
    gF.forEach((g: any) => {
      const fechaClave = new Date(g.created_at || g.creado_at).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
      if (!gananciasPorDia[fechaClave]) gananciasPorDia[fechaClave] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fechaClave].egresos += Number(g.monto || 0);
    });
  }

  const listaDias = Object.keys(gananciasPorDia).map((fecha) => ({
    fecha,
    ingresos: gananciasPorDia[fecha].ingresos,
    egresos: gananciasPorDia[fecha].egresos,
    neto: gananciasPorDia[fecha].ingresos - gananciasPorDia[fecha].egresos
  })).sort((a, b) => {
    const dataA = a.fecha.split('/').reverse().join('-');
    const dataB = b.fecha.split('/').reverse().join('-');
    return dataB.localeCompare(dataA); // Orden descendente (más nuevo arriba)
  });

  return { ingresos, egresos, listaDias, gF };
}
