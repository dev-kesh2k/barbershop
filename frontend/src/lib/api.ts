const API = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/").replace(/\/$/, "");
const UPLOADS_BASE = `${import.meta.env.BASE_URL}uploads`.replace(/\/+/g, "/").replace(/\/$/, "");

const TOKEN_KEY = "barbershop_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function resolveImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  if (
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("blob:")
  ) {
    return src;
  }
  if (src.startsWith("/uploads/")) {
    return `${UPLOADS_BASE}/${src.slice("/uploads/".length)}`;
  }
  return src;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.error || "Erro na requisição.", res.status);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  uploadImage: async (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return request<{ url: string }>("/admin/uploads", {
      method: "POST",
      body: form,
    });
  },
};

export type Role = "CUSTOMER" | "BARBER_ADMIN";

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: Role;
  barbershopId: string | null;
}

export interface Barbershop {
  id: string;
  name: string;
  address: string;
  phones: string[];
  description: string;
  imageUrl: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  durationMinutes: number;
  isActive?: boolean;
  barbershopId?: string;
}

export interface OpeningHour {
  weekday: number;
  opensAt: string;
  closesAt: string;
  isClosed: boolean;
}

export interface Booking {
  id: string;
  date: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELED" | "NO_SHOW";
  service: Service & { barbershop: Barbershop };
}

export interface ScheduleBlock {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}
