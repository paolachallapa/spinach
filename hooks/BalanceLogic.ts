export function calcularBalance(
  ventas: any[], 
  gastos: any[], 
  modo: string, 
  fechaInicio: string, 
  fechaFin: string, 
  tipoFiltro: 'todos' | 'ingresos' | 'egresos' = 'todos'
) {
  // Aseguramos el orden correcto de los textos: fMin siempre será la menor y fMax la mayor
  let fMin = fechaInicio;
  let fMax = fechaFin;
  if (fMin > fMax) {
    fMin = fechaFin;
    fMax = fechaInicio;
  }

  const refAnio = fMin.substring(0, 4); // "2026"
  const refMes = fMin.substring(5, 7);   // Mes de referencia

  let vF: any[] = [];
  let gF: any[] = [];

  // Función limpia para cortar "YYYY-MM-DD"
  const extraerFechaTexto = (registro: any, esGasto: boolean) => {
    const campoRaw = esGasto ? (registro.created_at || registro.creado_at) : (registro.creado_at || registro.created_at);
    if (!campoRaw) return null;
    return campoRaw.substring(0, 10);
  };

  // --- FILTRADO DIRECTO ---
  if (modo === 'rango') {
    if (tipoFiltro === 'todos' || tipoFiltro === 'ingresos') {
      vF = ventas?.filter((v: any) => {
        const fStr = extraerFechaTexto(v, false);
        return fStr ? (fStr >= fMin && fStr <= fMax) : false;
      }) || [];
    }
    if (tipoFiltro === 'todos' || tipoFiltro === 'egresos') {
      gF = gastos?.filter((g: any) => {
        const fStr = extraerFechaTexto(g, true);
        return fStr ? (fStr >= fMin && fStr <= fMax) : false;
      }) || [];
    }
  } else {
    const filtrarPorModo = (registro: any, esGasto: boolean) => {
      const fStr = extraerFechaTexto(registro, esGasto);
      if (!fStr) return false;

      const regAnio = fStr.substring(0, 4);
      const regMes = fStr.substring(5, 7);

      if (modo === 'mensual') {
        return regAnio === refAnio && regMes === refMes;
      }
      if (modo === 'anual') {
        return regAnio === refAnio;
      }
      if (modo === 'semanal') {
        return fStr >= fMin && fStr <= fMax;
      }
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModo(v, false)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModo(g, true)) || [];
  }

  // --- SUMATORIAS ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- AGRUPACIÓN POR DÍA ---
  const gananciasPorDia: { [key: string]: { ingresos: number; egresos: number } } = {};

  vF.forEach((v: any) => {
    const fStr = extraerFechaTexto(v, false);
    if (fStr) {
      const [y, m, d] = fStr.split('-');
      const fechaFormateada = `${d}/${m}/${y}`;
      if (!gananciasPorDia[fechaFormateada]) gananciasPorDia[fechaFormateada] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fechaFormateada].ingresos += Number(v.precio_venta || 0);
    }
  });

  gF.forEach((g: any) => {
    const fStr = extraerFechaTexto(g, true);
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
    return dataB.localeCompare(dataA);
  });

  return { ingresos, egresos, listaDias, gF };
}
