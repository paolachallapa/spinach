export function calcularBalance(
  ventas: any[], 
  gastos: any[], 
  modo: 'semanal' | 'mensual' | 'anual' | 'rango', 
  fechaInicio: string, 
  fechaFin: string, 
  tipoFiltro: 'todos' | 'ingresos' | 'egresos' = 'todos'
) {
  // fechaInicio y fechaFin vienen en formato "YYYY-MM-DD"
  const refAnio = fechaInicio.substring(0, 4); // "2026"
  const refMes = fechaInicio.substring(5, 7);   // "05" (Mayo, por ejemplo)

  let vF: any[] = [];
  let gF: any[] = [];

  // --- 1. FILTRADO ULTRA-SEGURO POR TEXTO DIRECTO ---
  if (modo === 'rango') {
    // Para rango usamos objetos Date estables con marcas de tiempo manuales
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
        const f = new Date(g.created_at || g.created_at);
        return f >= inicioRango && f <= finRango;
      }) || [];
    }
  } else {
    // MODOS NORMALES: Extraemos el año, mes o día directamente desde el texto del registro
    const filtrarPorModoTexto = (fechaRegistroStr: string) => {
      if (!fechaRegistroStr) return false;
      
      // Convertimos el ISO String ("2026-04-15T18:30:00.000Z") a "YYYY-MM-DD" puro
      const fechaLimpia = fechaRegistroStr.substring(0, 10); 
      const regAnio = fechaLimpia.substring(0, 4);
      const regMes = fechaLimpia.substring(5, 7);

      if (modo === 'mensual') {
        // Coincidencia exacta de Año y Mes (ej: "2026" y "04" para Abril)
        return regAnio === refAnio && regMes === refMes;
      }
      
      if (modo === 'anual') {
        // Coincidencia exacta de Año (ej: "2026"). ¡Traerá marzo, abril, mayo, etc.!
        return regAnio === refAnio;
      }
      
      if (modo === 'semanal') {
        // 7 días atrás de forma segura usando timestamps estables
        const fRef = new Date(fechaInicio + 'T23:59:59');
        const fSieteDiasAtras = new Date(fechaInicio + 'T00:00:00');
        fSieteDiasAtras.setDate(fSieteDiasAtras.getDate() - 7);
        
        const fReg = new Date(fechaLimpia + 'T12:00:00');
        return fReg >= fSieteDiasAtras && fReg <= fRef;
      }
      
      return true;
    };

    vF = ventas?.filter((v: any) => filtrarPorModoTexto(v.creado_at || v.created_at)) || [];
    gF = gastos?.filter((g: any) => filtrarPorModoTexto(g.created_at || g.created_at)) || [];
  }

  // --- 2. CÁLCULO DE TOTALES EN TARJETAS ---
  const ingresos = vF.reduce((acc: number, v: any) => acc + Number(v.precio_venta || 0), 0);
  const egresos = gF.reduce((acc: number, g: any) => acc + Number(g.monto || 0), 0);

  // --- 3. CONSTRUCCIÓN CONSOLIDADA DE LA TABLA POR DÍAS ---
  const gananciasPorDia: { [key: string]: { ingresos: number; egresos: number } } = {};

  if (modo !== 'rango' || tipoFiltro === 'todos' || tipoFiltro === 'ingresos') {
    vF.forEach((v: any) => {
      const ISO = (v.creado_at || v.created_at).substring(0, 10); // "YYYY-MM-DD"
      const [y, m, d] = ISO.split('-');
      const fechaFormateada = `${d}/${m}/${y}`; // Convertimos a "DD/MM/YYYY" para la vista
      
      if (!gananciasPorDia[fechaFormateada]) gananciasPorDia[fechaFormateada] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fechaFormateada].ingresos += Number(v.precio_venta || 0);
    });
  }

  if (modo !== 'rango' || tipoFiltro === 'todos' || tipoFiltro === 'egresos') {
    gF.forEach((g: any) => {
      const ISO = (g.created_at || g.creado_at).substring(0, 10);
      const [y, m, d] = ISO.split('-');
      const fechaFormateada = `${d}/${m}/${y}`;
      
      if (!gananciasPorDia[fechaFormateada]) gananciasPorDia[fechaFormateada] = { ingresos: 0, egresos: 0 };
      gananciasPorDia[fechaFormateada].egresos += Number(g.monto || 0);
    });
  }

  const listaDias = Object.keys(gananciasPorDia).map((fecha) => ({
    fecha,
    ingresos: gananciasPorDia[fecha].ingresos,
    egresos: gananciasPorDia[fecha].egresos,
    neto: gananciasPorDia[fecha].ingresos - gananciasPorDia[fecha].egresos
  })).sort((a, b) => {
    // Ordenar de manera estable: el más reciente arriba del todo
    const dataA = a.fecha.split('/').reverse().join('-');
    const dataB = b.fecha.split('/').reverse().join('-');
    return dataB.localeCompare(dataA);
  });

  return { ingresos, egresos, listaDias, gF };
}
