export function calcularBalance(
  ventas: any[], 
  gastos: any[], 
  modo: string, 
  fechaInicio: string, 
  fechaFin: string, 
  tipoFiltro: 'todos' | 'ingresos' | 'egresos' = 'todos'
) {
  // Las variables fechaInicio y fechaFin vienen en formato texto puro: "YYYY-MM-DD"
  const refAnio = fechaInicio.substring(0, 4); // "2026"
  const refMes = fechaInicio.substring(5, 7);   // "05"

  let vF: any[] = [];
  let gF: any[] = [];

  // --- 1. FUNCIÓN INTERNA ULTRA SEGURA PARA EXTRAER TEXTO "YYYY-MM-DD" ---
  const extraerFechaTexto = (registro: any, esGasto: boolean) => {
    const campoRaw = esGasto ? (registro.created_at || registro.creado_at) : (registro.creado_at || registro.created_at);
    if (!campoRaw) return null;
    return campoRaw.substring(0, 10); // Corta exactamente los primeros 10 caracteres: "YYYY-MM-DD"
  };

  // --- 2. FILTRADO DIRECTO SIN USAR FUNCIONES EXTERNAS ---
  if (modo === 'rango') {
    if (tipoFiltro === 'todos' || tipoFiltro === 'ingresos') {
      vF = ventas?.filter((v: any) => {
        const fStr = extraerFechaTexto(v, false);
        return fStr ? (fStr >= fechaInicio && fStr <= fechaFin) : false;
      }) || [];
    }
    if (tipoFiltro === 'todos' || tipoFiltro === 'egresos') {
      gF = gastos?.filter((g: any) => {
        const fStr = extraerFechaTexto(g, true);
        return fStr ? (fStr >= fechaInicio && fStr <= fechaFin) : false;
      }) || [];
    }
  } else {
    // MODOS SEMANAL, MENSUAL, ANUAL
    const filtrarPorModo = (registro: any, esGasto: boolean) => {
      const fStr = extraerFechaTexto(registro, esGasto);
      if (!fStr) return false;

      const regAnio = fStr.substring(0, 4);
      const regMes = fStr.substring(5, 7);

      if (modo === 'mensual') {
        return regAnio === refAnio && regMes === refMes;
      }
      if (modo === 'anual') {
        return regAnio === refAnio; // Trae todo el año 2026 completo
      }
      if (modo === 'semanal') {
        return fStr <= fechaInicio && fStr >= fechaFin;
      }
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModo(v, false)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModo(g, true)) || [];
  }

  // --- 3. SUMATORIAS DE TARJETAS ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- 4. AGRUPACIÓN PARA LA TABLA ---
  const gananciasPorDia: { [key: string]: { ingresos: number; egresos: number } } = {};

  vF.forEach((v: any) => {
    const fStr = extraerFechaTexto(v, false);
    if (fStr) {
      const [y, m, d] = fStr.split('-');
      const fechaFormateada = `${d}/${m}/${y}`; // Pasa a formato "DD/MM/YYYY" para la tabla
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
    return dataB.localeCompare(dataA); // Las fechas más nuevas primero
  });

  return { ingresos, egresos, listaDias, gF };
}
