export function calcularBalance(
  ventas: any[], 
  gastos: any[], 
  modo: string, 
  fechaInicio: string, 
  fechaFin: string, 
  tipoFiltro: 'todos' | 'ingresos' | 'egresos' = 'todos'
) {
  // Aseguramos que fMin sea siempre la menor y fMax la mayor cromáticamente
  let fMin = fechaInicio;
  let fMax = fechaFin;
  if (fMin > fMax) {
    fMin = fechaFin;
    fMax = fechaInicio;
  }

  // Extraemos año y mes de control basados en el string "YYYY-MM-DD"
  const refAnio = fMin.substring(0, 4); 
  const refMes = fMin.substring(5, 7);   

  let vF: any[] = [];
  let gF: any[] = [];

  // Función ultra limpia para extraer texto puro "YYYY-MM-DD"
  const extraerFechaTexto = (registro: any, esGasto: boolean) => {
    const campoRaw = esGasto ? (registro.created_at || registro.creado_at) : (registro.creado_at || registro.created_at);
    if (!campoRaw) return null;
    return campoRaw.substring(0, 10); // Corta "YYYY-MM-DD"
  };

  // --- FILTRADO SEGURO ---
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

  // --- AGRUPACIÓN PARA LA TABLA ---
  const gananciasPorDia: { [key: string]: { ingresos: number; egresos: number } } = {};

  vF.forEach((v: any) => {
    const fStr = extraerFechaTexto(v, false);
    if (fStr) {
      if (!gananciasPorDia[fStr]) gananciasPorDia[fStr] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fStr].ingresos += Number(v.precio_venta || 0);
    }
  });

  gF.forEach((g: any) => {
    const fStr = extraerFechaTexto(g, true);
    if (fStr) {
      if (!gananciasPorDia[fStr]) gananciasPorDia[fStr] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fStr].egresos += Number(g.monto || 0);
    }
  });

  // Convertimos las llaves "YYYY-MM-DD" a formato visual "DD/MM/YYYY" SOLO al renderizar la lista final
  const listaDias = Object.keys(gananciasPorDia).map((fStr) => {
    const [y, m, d] = fStr.split('-');
    return {
      fecha: `${d}/${m}/${y}`, // Formato visual para la tabla de la UI
      fechaRaw: fStr,          // Guardamos el original para ordenar
      ingresos: gananciasPorDia[fStr].ingresos,
      egresos: gananciasPorDia[fStr].egresos,
      neto: gananciasPorDia[fStr].ingresos - gananciasPorDia[fStr].egresos
    };
  }).sort((a, b) => b.fechaRaw.localeCompare(a.fechaRaw)); // Ordenación exacta por texto ISO

  return { ingresos, egresos, listaDias, gF };
}
