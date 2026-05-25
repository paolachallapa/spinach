export function calcularBalance(
  ventas: any[], 
  gastos: any[], 
  modo: string, 
  fechaInicio: string, 
  fechaFin: string, 
  tipoFiltro: 'todos' | 'ingresos' | 'egresos' = 'todos'
) {
  // fechaInicio y fechaFin vienen en formato "YYYY-MM-DD"
  const refAnio = fechaInicio.substring(0, 4); // "2026"
  const refMes = fechaInicio.substring(5, 7);   // "05" (Mayo)

  let vF: any[] = [];
  let gF: any[] = [];

  // --- 1. FILTRADO SEGURO POR TEXTO PLANO ---
  const extraerFechaLimpia = (registro: any, esGasto: boolean) => {
    // Forzamos la lectura del campo exacto de Supabase
    const campoFecha = esGasto ? (registro.created_at || registro.creado_at) : (registro.creado_at || registro.created_at);
    if (!campoFecha) return null;
    // Retorna los primeros 10 caracteres: "YYYY-MM-DD"
    return campoFecha.substring(0, 10);
  };

  if (modo === 'rango') {
    if (tipoFiltro === 'todos' || tipoFiltro === 'ingresos') {
      vF = ventas?.filter((v: any) => {
        const fStr = extraerFechaLimpia(v, false);
        return fStr ? (fStr >= fechaInicio && fStr <= fechaFin) : false;
      }) || [];
    }
    if (tipoFiltro === 'todos' || tipoFiltro === 'egresos') {
      gF = gastos?.filter((g: any) => {
        const fStr = extraerFechaLimpia(g, true);
        return fStr ? (fStr >= fechaInicio && fStr <= fechaFin) : false;
      }) || [];
    }
  } else {
    const filtrarPorModoTexto = (registro: any, esGasto: boolean) => {
      const fechaLimpia = extraerFechaLimpia(registro, esGasto);
      if (!fechaLimpia) return false;

      const regAnio = fechaLimpia.substring(0, 4);
      const regMes = fechaLimpia.substring(5, 7);

      if (modo === 'mensual') {
        return regAnio === refAnio && regMes === refMes;
      }
      if (modo === 'anual') {
        return regAnio === refAnio; // Trae todo el 2026 completo (marzo, abril, mayo)
      }
      if (modo === 'semanal') {
        // Filtro rápido de 7 días hacia atrás usando strings
        return fechaLimpia <= fechaInicio && fechaLimpia >= fechaFin;
      }
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModoTexto(v, false)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModoTexto(g, true)) || [];
  }

  // --- 2. CÁLCULO DE TOTALES ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- 3. CONSTRUCCIÓN DE LA TABLA POR DÍAS (Soporta formatos sin la 'T') ---
  const gananciasPorDia: { [key: string]: { ingresos: number; egresos: number } } = {};

  vF.forEach((v: any) => {
    const fStr = extraerFechaLimpia(v, false);
    if (fStr) {
      const [y, m, d] = fStr.split('-');
      const fechaFormateada = `${d}/${m}/${y}`; // Convierte a DD/MM/YYYY
      if (!gananciasPorDia[fechaFormateada]) gananciasPorDia[fechaFormateada] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fechaFormateada].ingresos += Number(v.precio_venta || 0);
    }
  });

  gF.forEach((g: any) => {
    const fStr = extraerFechaLimpia(g, true);
    if (fStr) {
      const [y, m, d] = fStr.split('-');
      const fechaFormateada = `${d}/${m}/${y}`;
      if (!gananciasPorDia[fechaFormateada]) gananciasPorDia[fechaFormateada] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fechaFormateada].egresos += Number(g.monto || 0);
    }
  });

  const listaDias = Object.keys(gananciasPorDia).map((fecha) => ({
    fecha,
    ingresos: gananciasPorDia[fecha].ingresos,
    egresos: gananciasPorDia[fecha].egresos,
    neto: gananciasPorDia[fecha].ingresos - gananciasPorDia[fecha].egresos
  })).sort((a, b) => {
    const dataA = a.fecha.split('/').reverse().join('-');
    const dataB = b.fecha.split('/').reverse().join('-');
    return dataB.localeCompare(dataA); // Ordenar: Más reciente arriba
  });

  return { ingresos, egresos, listaDias, gF };
}
