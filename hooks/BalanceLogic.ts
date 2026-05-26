export function calcularBalance(
  ventas: any[], 
  gastos: any[], 
  modo: string, 
  fechaInicio: string, 
  fechaFin: string, 
  tipoFiltro: 'todos' | 'ingresos' | 'egresos' = 'todos',
  mesSeleccionado?: string
) {
  let fMin = fechaInicio;
  let fMax = fechaFin;
  if (fMin > fMax) {
    fMin = fechaFin;
    fMax = fechaInicio;
  }

  const refAnio = fMin.substring(0, 4); 

  if (modo === 'semanal') {
    const fechaRef = new Date(fMin + 'T00:00:00');
    const diaSemana = fechaRef.getDay(); 
    const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunesObj = new Date(fechaRef.getTime() - diasHastaLunes * 24 * 60 * 60 * 1000);
    fMin = lunesObj.toLocaleDateString('sv-SE'); 
  }

  let vF: any[] = [];
  let gF: any[] = [];

  const extraerFechaTexto = (registro: any, esGasto: boolean) => {
    const campoRaw = esGasto ? (registro.created_at || registro.creado_at) : (registro.creado_at || registro.created_at);
    if (!campoRaw) return null;
    return campoRaw.substring(0, 10);
  };

  // --- FILTRADO DE MOVIMIENTOS ---
  if (modo === 'rango' || modo === 'semanal') {
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
        return regAnio === refAnio && regMes === mesSeleccionado;
      }
      if (modo === 'anual') {
        return regAnio === refAnio;
      }
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModo(v, false)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModo(g, true)) || [];
  }

  // --- SUMATORIAS DE TARJETAS SUPERIORES ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- AGRUPACIÓN PARA LA TABLA ---
  let listaDias: any[] = [];

  if (modo === 'anual') {
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const gananciasAgrupadasAnual: { [key: string]: { ingresos: number; egresos: number } } = {};

    vF.forEach((v: any) => {
      const fStr = extraerFechaTexto(v, false);
      if (fStr) {
        // Extraemos de forma segura el mes "MM" usando las posiciones fijas del substring limpio
        const mesStr = fStr.substring(5, 7);
        if (!gananciasAgrupadasAnual[mesStr]) gananciasAgrupadasAnual[mesStr] = { ingresos: 0, egresos: 0 };
        gananciasAgrupadasAnual[mesStr].ingresos += Number(v.precio_venta || 0);
      }
    });

    gF.forEach((g: any) => {
      const fStr = extraerFechaTexto(g, true);
      if (fStr) {
        const mesStr = fStr.substring(5, 7);
        if (!gananciasAgrupadasAnual[mesStr]) gananciasAgrupadasAnual[mesStr] = { ingresos: 0, egresos: 0 };
        gananciasAgrupadasAnual[mesStr].egresos += Number(g.monto || 0);
      }
    });

    listaDias = Object.keys(gananciasAgrupadasAnual).map((mesStr) => {
      const indexMes = parseInt(mesStr) - 1;
      return {
        fecha: mesesNombres[indexMes],
        fechaRaw: mesStr,
        ingresos: gananciasAgrupadasAnual[mesStr].ingresos,
        egresos: gananciasAgrupadasAnual[mesStr].egresos,
        neto: gananciasAgrupadasAnual[mesStr].ingresos - gananciasAgrupadasAnual[mesStr].egresos
      };
    }).sort((a, b) => b.fechaRaw.localeCompare(a.fechaRaw));

  } else {
    // MODOS DIARIOS (Semanal, Mensual, Rango): Volvemos a tu estructura original intacta y segura
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

    listaDias = Object.keys(gananciasPorDia).map((fStr) => {
      // Formateo clásico de días separando de forma segura
      const partes = fStr.split('-');
      const y = partes[0];
      const m = partes[1];
      const d = partes[2] || '01'; // Fallback seguro por si no hay día definido
      return {
        fecha: `${d}/${m}/${y}`,
        fechaRaw: fStr,
        ingresos: gananciasPorDia[fStr].ingresos,
        egresos: gananciasPorDia[fStr].egresos,
        neto: gananciasPorDia[fStr].ingresos - gananciasPorDia[fStr].egresos
      };
    }).sort((a, b) => b.fechaRaw.localeCompare(a.fechaRaw));
  }

  return { ingresos, egresos, listaDias, gF };
}
