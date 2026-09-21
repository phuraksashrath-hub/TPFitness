import axios, { AxiosError } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5080";

const TOKEN_KEY = "fitpulse.token";

export const tokenStore = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(TOKEN_KEY);
  },
  set(token: string) {
    window.localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    window.localStorage.removeItem(TOKEN_KEY);
  },
};

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Turns any axios failure into a message that is safe to show in the UI. */
export function apiErrorMessage(error: unknown, fallback = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors).flat()[0];
      if (first) return first;
    }
    if (error.code === "ECONNABORTED") return "คำขอใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง";
    if (!error.response) return "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ TP Fitness ได้ กรุณาตรวจสอบว่าเปิด backend อยู่";
  }
  return fallback;
}
