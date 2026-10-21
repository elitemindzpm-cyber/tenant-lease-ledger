import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { backend } from "./backend";
import { loadLiveTenant, type TenantBundle } from "./tenant-data";

type Ctx = {
  ready: boolean;
  signedIn: boolean;
  session: Session | null;
  scope: string; // storage scope for on-device items
  signOut: () => Promise<void>;
};

const SessionCtx = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
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

  const signOut = useCallback(async () => {
    await backend.auth.signOut();
    qc.clear();
  }, [qc]);

  const signedIn = !!session;
  const scope = session?.user.id || "anon";

  return (
    <SessionCtx.Provider value={{ ready, signedIn, session, scope, signOut }}>
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
  const { session } = useSession();
  return useQuery<TenantBundle>({
    queryKey: ["tenant", session?.user.id],
    enabled: !!session,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: () => {
      const u = session!.user;
      return loadLiveTenant(u.email || "", (u.user_metadata?.["full_name"] as string) || u.email?.split("@")[0] || "Tenant");
    },
  });
}
