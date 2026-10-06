/** Data no padrão brasileiro curto: dd/mm/yy */
export function formatDdMmYy(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** yyyy-mm-dd → dd/mm/yy */
export function isoToDdMmYy(iso: string): string {
  const [y, m, d] = String(iso || "").slice(0, 10).split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y.slice(-2)}`;
}

/** Digita/mascara dd/mm/yy e devolve ISO yyyy-mm-dd, ou null se incompleto/inválido. */
export function parseDdMmYyToIso(raw: string): string | null {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 6);
  if (digits.length !== 6) return null;
  const dd = Number(digits.slice(0, 2));
  const mm = Number(digits.slice(2, 4));
  const yy = Number(digits.slice(4, 6));
  const yyyy = 2000 + yy;
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
  const check = new Date(`${iso}T12:00:00`);
  if (
    Number.isNaN(check.getTime()) ||
    check.getFullYear() !== yyyy ||
    check.getMonth() + 1 !== mm ||
    check.getDate() !== dd
  ) {
    return null;
  }
  return iso;
}

/** Aplica máscara dd/mm/yy enquanto digita. */
export function maskDdMmYy(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "").slice(0, 6);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Hora local HH:mm */
export function formatHhMm(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** dd/mm/yy · HH:mm */
export function formatDdMmYyTime(value: string | Date): string {
  const time = formatHhMm(value);
  return time ? `${formatDdMmYy(value)} · ${time}` : formatDdMmYy(value);
}

export function formatMoney(value: number): string {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
