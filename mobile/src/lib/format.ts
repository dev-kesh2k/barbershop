export function formatDdMmYy(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

export function formatHhMm(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDdMmYyTime(value: string | Date): string {
  const time = formatHhMm(value);
  return time ? `${formatDdMmYy(value)} · ${time}` : formatDdMmYy(value);
}

export function formatMoney(value: number): string {
  const [int, dec] = Number(value).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${grouped},${dec}`;
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function prettyDate(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  const months = ["jan.", "fev.", "mar.", "abr.", "mai.", "jun.", "jul.", "ago.", "set.", "out.", "nov.", "dez."];
  const label = months[Number(month) - 1];
  if (!year || !day || !label) return iso;
  return `${day} de ${label} de ${year}`;
}

export function monthLabel(year: number, month: number): string {
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const name = months[month] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

/** "2026-10-06 14:00" or "2026-10-06T14:00" → Date local. */
export function parseLocalDateTime(raw: string): Date | null {
  const match = raw.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}
