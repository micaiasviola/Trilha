const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** "2026-06-08" -> "8 jun" */
export function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

/** "2026-06-08" -> "8 jun 2026" */
export function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Intervalo "8–14 jun 2026" */
export function formatRange(startIso: string, endIso: string): string {
  const [, , ds] = startIso.split("-").map(Number);
  const [ye, me, de] = endIso.split("-").map(Number);
  return `${ds}–${de} ${MONTHS[me - 1]} ${ye}`;
}

export const STATUS_LABEL: Record<string, string> = {
  "in-progress": "Em andamento",
  shipped: "Entregue",
  paused: "Pausado",
};
