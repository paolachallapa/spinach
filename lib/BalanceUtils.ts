export const getWeekNumber = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

// Nueva función de filtrado inteligente
export const filtrarDatos = (iso: string, modo: 'semanal' | 'mensual' | 'anual', fechaRef: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  d.setHours(d.getHours() - 5); // Ajuste horario Bolivia

  const ref = new Date(fechaRef);

  if (modo === 'anual') {
    return d.getFullYear() === ref.getFullYear();
  }

  if (modo === 'mensual') {
    return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
  }

  // Semanal por defecto
  return getWeekNumber(d) === getWeekNumber(ref) && d.getFullYear() === ref.getFullYear();
};