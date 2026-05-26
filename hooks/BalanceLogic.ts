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

  // Extracción del año real de trabajo basado en la fecha de referencia
  const anioFiltro = fMin.substring(0, 4); 

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

  // --- FILTRADO SEGURO PARA TARJETAS Y TABLAS DIARIAS ---
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
        return regAnio === anioFiltro && regMes === mesSeleccionado;
      }
      if (modo === 'anual') {
        return regAnio === anioFiltro;
      }
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModo(v, false)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModo(g, true)) || [];
  }

  // --- SUMATORIAS GLOBALES PARA LAS TARJETAS ---
  let ingresos = 0;
  let egresos = 0;

  if (modo === 'anual') {
    // Si es anual, barremos el array completo original para calcular las tarjetas superiores
    ventas?.forEach((v: any) => {
      const fStr = extraerFechaTexto(v, false);
      if (fStr && fStr.substring(0, 4) === anioFiltro) {
        ingresos += Number(v.precio_venta || 0);
      }
    });
    gastos?.forEach((g: any) => {
      const fStr = extraerFechaTexto(g, true);
      if (fStr && fStr.substring(0, 4) === anioFiltro) {
        egresos += Number(g.monto || 0);
      }
    });
  } else {
    ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
    egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);
  }

  // --- AGRUPACIÓN PARA LA TABLA ---
  let listaDias: any[] = [];

  if (modo === 'anual') {
    const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    listaDias = mesesNombres.map((nombre, index) => {
      const mesStr = String(index + 1).padStart(2, '0');
      let ingMes = 0;
      let egrMes = 0;

      // Forzamos la lectura directa del array original 'ventas' enviado desde las props
      ventas?.forEach((v: any) => {
        const fStr = extraerFechaTexto(v, false);
        if (fStr && fStr.substring(0, 4) === anioFiltro && fStr.substring(5, 7) === mesStr) {
          ingMes += Number(v.precio_venta || 0);
        }
      });

      // Forzamos la lectura directa del array original 'gastos' enviado desde las props
      gastos?.forEach((g: any) => {
        const fStr = extraerFechaTexto(g, true);
        if (fStr && fStr.substring(0, 4) === anioFiltro && fStr.substring(5, 7) === mesStr) {
          egrMes += Number(g.monto || 0);
        }
      });

      return {
        fecha: nombre,
        fechaRaw: mesStr, 
        ingresos: ingMes,
        egresos: egrMes,
        neto: ingMes - egrMes
      };
    })
    .filter(m => m.ingresos > 0 || m.egresos > 0) 
    .sort((a, b) => b.fechaRaw.localeCompare(a.fechaRaw));

  } else {
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
