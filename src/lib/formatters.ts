const copNumberFormatter = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const fechaCortaFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const fechaHoraFormatter = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const horaFormatter = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/**
 * Formatea un valor numérico en pesos colombianos (ej: "$ 15.000").
 */
export function formatCOP(valor: number): string {
  const safeValue = Number.isFinite(valor) ? Math.round(valor) : 0;
  const isNegative = safeValue < 0;
  const formatted = copNumberFormatter.format(Math.abs(safeValue));
  return isNegative ? `- $ ${formatted}` : `$ ${formatted}`;
}

/**
 * Formatea una fecha ISO en formato legible corto en español (ej: "22 nov 2026").
 */
export function formatFechaCorta(fechaIso: string): string {
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return fechaCortaFormatter.format(date);
}

/**
 * Formatea una fecha ISO con fecha y hora en español (ej: "22 nov, 02:15 p. m.").
 */
export function formatFechaHora(fechaIso: string): string {
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) return 'Fecha inválida';
  return fechaHoraFormatter.format(date);
}

/**
 * Formatea únicamente la hora en español (ej: "02:15 p. m.").
 */
export function formatHora(fechaIso: string): string {
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) return '--:--';
  return horaFormatter.format(date);
}

/**
 * Formatea una fecha ISO como tiempo relativo amigable ("Hoy", "Ayer", "Hace 3 días").
 */
export function formatTiempoRelativo(fechaIso: string): string {
  const date = new Date(fechaIso);
  if (Number.isNaN(date.getTime())) return 'Sin actividad';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - startOfDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return `Hoy, ${formatHora(fechaIso)}`;
  if (diffDays === 1) return `Ayer, ${formatHora(fechaIso)}`;
  if (diffDays > 1 && diffDays <= 7) return `Hace ${diffDays} días`;

  return formatFechaCorta(fechaIso);
}
