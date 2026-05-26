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

  // Ajuste dinámico si estamos en modo SEMANAL para forzar el inicio desde el Lunes
  if (modo === 'semanal') {
    const fechaRef = new Date(fMin + 'T00:00:00');
    const diaSemana = fechaRef.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const diasHastaLunes = diaSemana === 0 ? 6 : diaSemana - 1;
    const lunesObj = new Date(fechaRef.getTime() - diasHastaLunes * 24 * 60 * 60 * 1000);
    fMin = lunesObj.toLocaleDateString('sv-SE'); // Sobrescribimos fMin con el string del lunes "YYYY-MM-DD"
  }

  let vF: any[] = [];
  let gF: any[] = [];

  const extraerFechaTexto = (registro: any, esGasto: boolean) => {
    const campoRaw = esGasto ? (registro.created_at || registro.creado_at) : (registro.creado_at || registro.created_at);
    if (!campoRaw) return null;
    return campoRaw.substring(0, 10);
  };

  // --- FILTRADO SEGURO ---
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
        // Filtra usando el selector dinámico enviado desde la UI
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

  // --- SUMATORIAS USANDO TU CAMPO CORRECTO (precio_venta) ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- AGRUPACIÓN PARA LA TABLA ---
  let listaDias: any[] = [];

  if (modo === 'anual') {
    // Optimización Anual: Agrupa las ganancias consolidadas por meses enteros (12 filas)
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    listaDias = mesesNombres.map((nombre, index) => {
      const mesStr = String(index + 1).padStart(2, '0');
      let ingMes = 0;
      let egrMes = 0;

      vF.forEach((v: any) => {
        const fStr = extraerFechaTexto(v, false);
        if (fStr && fStr.substring(5, 7) === mesStr) ingMes += Number(v.precio_venta || 0);
      });

      gF.forEach((g: any) => {
        const fStr = extraerFechaTexto(g, true);
        if (fStr && fStr.substring(5, 7) === mesStr) egrMes += Number(g.monto || 0);
      });

      return {
        fecha: nombre,
        fechaRaw: mesStr, // Para ordenar cronológicamente
        ingresos: ingMes,
        egresos: egrMes,
        neto: ingMes - egrMes
      };
    })
    .filter(m => m.ingresos > 0 || m.egresos > 0) // Muestra solo meses con actividad
    .sort((a, b) => b.fechaRaw.localeCompare(a.fechaRaw));

  } else {
    // Comportamiento normal por días (Semanal, Mensual o por Rangos)
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
      const [y, m, d] = fStr.split('-');
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
