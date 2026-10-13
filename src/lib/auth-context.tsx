"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase/client";
import type { Profile } from "./supabase/types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  refreshingProfile: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refreshingProfile: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingProfile, setRefreshingProfile] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string) => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        console.warn("[auth] profile fetch error:", error.message);
        return null;
      }
      return data as Profile | null;
    };

    const ensureProfile = async (
      currentSession: Session
    ): Promise<Profile | null> => {
      const userId = currentSession.user.id;
      let existing = await loadProfile(userId);

      if (!existing) {
        const user = currentSession.user;
        const newProfile = {
          user_id: userId,
          full_name:
            (user.user_metadata?.full_name as string | undefined) ?? null,
          email: user.email ?? null,
          business_name:
            (user.user_metadata?.business_name as string | undefined) ?? null,
        };
        const { data: created, error: createErr } = await supabase
          .from("profiles")
          .insert(newProfile)
          .select()
          .maybeSingle();
        if (createErr) {
          console.warn("[auth] profile auto-create error:", createErr.message);
        }
        existing = (created as Profile | null) ?? null;
      }
      return existing;
    };

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        if (data.session) {
          const p = await ensureProfile(data.session);
          if (mounted) setProfile(p);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("[auth] getSession error:", err);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setProfile(null);
      if (newSession) {
        setRefreshingProfile(true);
        const p = await ensureProfile(newSession);
        if (mounted) setProfile(p);
        setRefreshingProfile(false);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const userId = session?.user?.id;
    if (!userId) return;
    setRefreshingProfile(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
    setRefreshingProfile(false);
  }, [session]);

  const isAdmin = Boolean(profile?.is_admin);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      isAdmin,
      loading,
      refreshingProfile,
      signOut,
      refreshProfile,
    }),
    [session, profile, isAdmin, loading, refreshingProfile, signOut, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
