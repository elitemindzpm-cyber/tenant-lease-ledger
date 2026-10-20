import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Home, FileText, CreditCard, Wrench, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ChequeStatus } from "@/lib/tenant-data";

export function ScreenHeader({ title, back, action }: { title: string; back?: boolean; action?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
      {back && (
        <Link to="/home" aria-label="Back" className="-ml-2 rounded-full p-2 text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      )}
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
      {action}
    </header>
  );
}

const TABS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/lease", label: "Lease", icon: FileText },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/requests", label: "Requests", icon: Wrench },
  { to: "/account", label: "Account", icon: UserRound },
] as const;

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t bg-card">
      <ul className="grid grid-cols-5">
        {TABS.map(({ to, label, icon: Icon }) => {
          const active = path.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "flex flex-col items-center gap-1 pt-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "stroke-[2.4]")} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Section({ title, children, action }: { title?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="space-y-2">
      {title && (
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border bg-card p-4 shadow-card", className)}>{children}</div>;
}

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? "—"}</span>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  cleared: "bg-success/15 text-success",
  paid: "bg-success/15 text-success",
  resolved: "bg-success/15 text-success",
  confirmed: "bg-success/15 text-success",
  active: "bg-success/15 text-success",
  deposited: "bg-secondary text-secondary-foreground",
  in_progress: "bg-secondary text-secondary-foreground",
  upcoming: "bg-warning/20 text-warning-foreground",
  pending: "bg-warning/20 text-warning-foreground",
  open: "bg-warning/20 text-warning-foreground",
  bounced: "bg-destructive/15 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
  used: "bg-muted text-muted-foreground",
};

export function StatusPill({ status, label }: { status: ChequeStatus | string; label?: string }) {
  const key = status.toLowerCase();
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize", STATUS_STYLE[key] || "bg-muted text-muted-foreground")}>
      {label || key.replace("_", " ")}
    </span>
  );
}

export function Empty({ icon, title, text, children }: { icon: ReactNode; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-secondary p-3 text-primary">{icon}</div>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function LoadingBlock() {
  return (
    <div className="space-y-3 p-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}
