import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { backend } from "./backend";
import { DEMO_BUNDLE, loadLiveTenant, type TenantBundle } from "./tenant-data";

const DEMO_KEY = "zyno-tenant-demo";

type Ctx = {
  ready: boolean;
  signedIn: boolean;
  isDemo: boolean;
  session: Session | null;
  scope: string; // storage scope for on-device items
  enterDemo: () => void;
  signOut: () => Promise<void>;
};

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isDemo, setDemo] = useState(false);

  useEffect(() => {
    setDemo(localStorage.getItem(DEMO_KEY) === "1");
    backend.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = backend.auth.onAuthStateChange((event, s) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setSession(s);
      qc.invalidateQueries();
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const enterDemo = useCallback(() => {
    localStorage.setItem(DEMO_KEY, "1");
    setDemo(true);
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(DEMO_KEY);
    setDemo(false);
    await backend.auth.signOut();
    qc.clear();
  }, [qc]);

  const signedIn = isDemo || !!session;
  const scope = isDemo ? "demo" : session?.user.id || "anon";

  return (
    <SessionCtx.Provider value={{ ready, signedIn, isDemo, session, scope, enterDemo, signOut }}>
      {children}
    </SessionCtx.Provider>
  );
}

export function useSession() {
  const c = useContext(SessionCtx);
  if (!c) throw new Error("useSession outside provider");
  return c;
}

export function useTenant() {
  const { isDemo, session } = useSession();
  return useQuery<TenantBundle>({
    queryKey: ["tenant", isDemo ? "demo" : session?.user.id],
    enabled: isDemo || !!session,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: () => {
      if (isDemo) return Promise.resolve(DEMO_BUNDLE);
      const u = session!.user;
      return loadLiveTenant(u.email || "", (u.user_metadata?.["full_name"] as string) || u.email?.split("@")[0] || "Tenant");
    },
  });
}
