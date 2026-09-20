export const Role = {
  CUSTOMER: "CUSTOMER",
  BARBER_ADMIN: "BARBER_ADMIN",
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const BookingStatus = {
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELED: "CANCELED",
  NO_SHOW: "NO_SHOW",
} as const;

export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export function parsePhones(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [raw];
  }
}

export function serializePhones(phones: string[]): string {
  return JSON.stringify(phones);
}
