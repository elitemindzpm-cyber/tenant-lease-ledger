import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav, LoadingBlock } from "@/components/mobile";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/_tenant")({
  ssr: false,
  component: TenantLayout,
});

function TenantLayout() {
  const { ready, signedIn, isDemo } = useSession();
  const nav = useNavigate();
  useEffect(() => {
    if (ready && !signedIn) nav({ to: "/" });
  }, [ready, signedIn, nav]);

  if (!ready || !signedIn) return <LoadingBlock />;

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-24">
      {isDemo && (
        <div className="bg-gold px-4 py-1.5 text-center text-xs font-medium text-gold-foreground">
          Demo tenant — sample data
        </div>
      )}
      <Outlet />
      <BottomNav />
    </div>
  );
}
