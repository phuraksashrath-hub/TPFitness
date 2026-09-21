"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiErrorMessage, setUnauthorizedHandler, tokenStore } from "./api";
import { authApi } from "./services";
import type { UserProfile, UserRole } from "./types";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
  }) => Promise<UserProfile>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const portalPathFor = (role: UserRole) =>
  role === "ADMIN" ? "/admin" : role === "TRAINER" ? "/trainer" : "/member";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      setUser(await authApi.me());
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      tokenStore.set(result.accessToken);
      setUser(result.user);
      return result.user;
    } catch (error) {
      throw new Error(apiErrorMessage(error, "ไม่สามารถเข้าสู่ระบบได้"));
    }
  }, []);

  const register = useCallback(
    async (payload: { email: string; password: string; fullName: string; phoneNumber?: string }) => {
      try {
        const result = await authApi.register({ ...payload, role: "MEMBER" });
        tokenStore.set(result.accessToken);
        setUser(result.user);
        return result.user;
      } catch (error) {
        throw new Error(apiErrorMessage(error, "ไม่สามารถสร้างบัญชีได้"));
      }
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout, refresh }),
    [user, isLoading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
