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

      const [y, m] = fStr.split('-');

      if (modo === 'mensual') {
        return y === refAnio && m === mesSeleccionado;
      }
      if (modo === 'anual') {
        return y === refAnio;
      }
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModo(v, false)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModo(g, true)) || [];
  }

  // --- SUMATORIAS DE TARJETAS SUPERIORES ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- OBTENCIÓN Y AGRUPACIÓN DE LA TABLA (Misma lógica exacta) ---
  const gananciasAgrupadas: { [key: string]: { ingresos: number; egresos: number } } = {};

  vF.forEach((v: any) => {
    const fStr = extraerFechaTexto(v, false);
    if (fStr) {
      // Usamos la misma lógica del split que usas abajo
      const [y, m, d] = fStr.split('-');
      
      // Si el modo es anual la clave de grupo es el mes (m), si no, el día completo (fStr)
      const claveGrupo = modo === 'anual' ? m : fStr; 

      if (!gananciasAgrupadas[claveGrupo]) gananciasAgrupadas[claveGrupo] = { ingresos: 0, egresos: 0 };
      gananciasAgrupadas[claveGrupo].ingresos += Number(v.precio_venta || 0);
    }
  });

  gF.forEach((g: any) => {
    const fStr = extraerFechaTexto(g, true);
    if (fStr) {
      const [y, m, d] = fStr.split('-');
      const claveGrupo = modo === 'anual' ? m : fStr;

      if (!gananciasAgrupadas[claveGrupo]) gananciasAgrupadas[claveGrupo] = { ingresos: 0, egresos: 0 };
      gananciasAgrupadas[claveGrupo].egresos += Number(g.monto || 0);
    }
  });

  // --- FORMATEO FINAL DE LA LISTA PARA LA TABLA ---
  const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  let listaDias = Object.keys(gananciasAgrupadas).map((clave) => {
    if (modo === 'anual') {
      const indexMes = parseInt(clave) - 1;
      return {
        fecha: mesesNombres[indexMes],
        fechaRaw: clave, // "05"
        ingresos: gananciasAgrupadas[clave].ingresos,
        egresos: gananciasAgrupadas[clave].egresos,
        neto: gananciasAgrupadas[clave].ingresos - gananciasAgrupadas[clave].egresos
      };
    } else {
      const [y, m, d] = clave.split('-');
      return {
        fecha: `${d}/${m}/${y}`,
        fechaRaw: clave, // "2026-05-25"
        ingresos: gananciasAgrupadas[clave].ingresos,
        egresos: gananciasAgrupadas[clave].egresos,
        neto: gananciasAgrupadas[clave].ingresos - gananciasAgrupadas[clave].egresos
      };
    }
  }).sort((a, b) => b.fechaRaw.localeCompare(a.fechaRaw));

  return { ingresos, egresos, listaDias, gF };
}
