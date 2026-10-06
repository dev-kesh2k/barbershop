import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";

const TOKEN_KEY = "barbershop_token";
let memoryToken: string | null = null;

function devHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    null;
  const host = hostUri?.split(":")[0];
  if (!host || host === "localhost" || host === "127.0.0.1") return null;
  return host;
}

export function apiOrigin(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  const host = devHost();
  if (host) return `http://${host}:4002`;
  if (Platform.OS === "android") return "http://10.0.2.2:4002";
  return "http://127.0.0.1:4002";
}

export async function loadToken(): Promise<string | null> {
  memoryToken = await AsyncStorage.getItem(TOKEN_KEY);
  return memoryToken;
}

export function getToken(): string | null {
  return memoryToken;
}

export async function setToken(token: string | null) {
  memoryToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export function resolveImageUrl(src: string | null | undefined): string {
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("http://") || src.startsWith("https://")) {
    return src;
  }
  if (src.startsWith("/")) return `${apiOrigin()}${src}`;
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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isForm) headers["Content-Type"] = headers["Content-Type"] || "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${apiOrigin()}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = typeof data.error === "string" ? data.error : "Erro na requisição.";
    throw new ApiError(message, res.status);
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
  uploadImage: async (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    if (Platform.OS === "web") {
      const blob = await fetch(file.uri).then((res) => res.blob());
      form.append("image", blob, file.name);
    } else {
      form.append("image", file as unknown as Blob);
    }
    return request<{ url: string }>("/admin/uploads", { method: "POST", body: form });
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

export interface Barber {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  isActive?: boolean;
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
  barber?: Pick<Barber, "id" | "name" | "title" | "imageUrl"> | null;
  service: Service & { barbershop: Barbershop };
}

export interface ScheduleBlock {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
}
