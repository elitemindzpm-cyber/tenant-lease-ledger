import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CreditCard, FileText, FolderOpen, Phone, RefreshCw, UserCheck, Wrench } from "lucide-react";
import { Empty, LoadingBlock, Panel, Section, StatusPill } from "@/components/mobile";
import { screenHead } from "@/lib/head";
import { useTenant } from "@/lib/session";
import { daysUntil, formatDate, formatQAR } from "@/lib/tenant-data";
import { useTickets } from "@/lib/requests";

export const Route = createFileRoute("/_tenant/home")({
  head: () => screenHead("Home", "Your rent, lease and requests at a glance."),
  component: HomeScreen,
});

function HomeScreen() {
  const { data, isLoading, refetch, isFetching } = useTenant();
  const { data: tickets } = useTickets();

  if (isLoading || !data) return <LoadingBlock />;
  const lease = data.leases[0];
  const next = data.cheques.find((c) => c.status === "upcoming" || c.status === "deposited");
  const paid = data.cheques.filter((c) => c.status === "cleared").reduce((s, c) => s + c.amount, 0);
  const total = data.cheques.reduce((s, c) => s + c.amount, 0);
  const daysLeft = daysUntil(lease?.endDate);
  const openTickets = (tickets || []).filter((t) => t.status === "open" || t.status === "in_progress").length;
  const first = data.profile.name.split(" ")[0];

  return (
    <div>
      <div className="bg-hero px-5 pt-8 pb-16 text-primary-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm opacity-75">Welcome back,</p>
            <h1 className="text-2xl font-bold">{first}</h1>
            {lease && <p className="mt-1 text-sm opacity-80">{lease.property} · Unit {lease.unit}</p>}
          </div>
          <button onClick={() => refetch()} aria-label="Refresh" className="rounded-full bg-primary-foreground/10 p-2.5">
            <RefreshCw className={`h-5 w-5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="-mt-10 space-y-6 px-4">
        <Panel>
          {next ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next payment</p>
              <div className="mt-1 flex items-end justify-between">
                <p className="text-3xl font-bold">{formatQAR(next.amount)}</p>
                <StatusPill status={next.status} label={next.rawStatus} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Cheque {next.chequeNumber} · due {formatDate(next.dueDate)}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Payments</p>
              <p className="mt-1 text-lg font-semibold">Nothing due right now</p>
            </>
          )}
          {total > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Paid {formatQAR(paid)}</span>
                <span>of {formatQAR(total)}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gold" style={{ width: `${Math.round((paid / total) * 100)}%` }} />
              </div>
            </div>
          )}
        </Panel>

        {!data.linked && (
          <Empty icon={<UserCheck className="h-6 w-6" />} title="We couldn't find your tenancy yet" text={`No tenant record matches ${data.profile.email}. Ask your property office to add this email to your tenant profile.`} />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Quick to="/requests" icon={<Wrench className="h-5 w-5" />} label="Repair" />
          <Quick to="/documents" icon={<FolderOpen className="h-5 w-5" />} label="Docs" />
        </div>

        {lease && (
          <Section title="My lease" action={<Link to="/lease" className="text-sm font-medium text-primary">Details</Link>}>
            <Panel className="grid grid-cols-2 gap-4">
              <Stat label="Monthly rent" value={formatQAR(lease.monthlyRent)} />
              <Stat label="Lease ends" value={formatDate(lease.endDate)} />
              <Stat label="Days left" value={daysLeft != null ? (daysLeft > 0 ? `${daysLeft} days` : "Expired") : "—"} />
              <Stat label="Status" value={<StatusPill status={lease.status} label={lease.status} />} />
            </Panel>
            {daysLeft != null && daysLeft > 0 && daysLeft <= lease.noticePeriodDays + 30 && (
              <Panel className="flex items-center gap-3 border-gold/50 bg-gold/10">
                <Bell className="h-5 w-5 shrink-0 text-gold" />
                <p className="text-sm">Your lease ends soon. Contact your property office to renew — notice period is {lease.noticePeriodDays} days.</p>
              </Panel>
            )}
          </Section>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Link to="/payments"><Panel><CreditCard className="h-5 w-5 text-primary" /><p className="mt-2 text-2xl font-bold">{data.cheques.length}</p><p className="text-xs text-muted-foreground">Cheques on file</p></Panel></Link>
          <Link to="/requests"><Panel><Wrench className="h-5 w-5 text-primary" /><p className="mt-2 text-2xl font-bold">{openTickets}</p><p className="text-xs text-muted-foreground">Open requests</p></Panel></Link>
        </div>

        {lease?.propertyManager && (
          <Section title="Property manager">
            <Panel className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{lease.propertyManager}</p>
                <p className="text-sm text-muted-foreground">{lease.pmContact || "Property office"}</p>
              </div>
              {lease.pmContact && (
                <a href={`tel:${lease.pmContact.replace(/\s/g, "")}`} className="rounded-full bg-primary p-3 text-primary-foreground" aria-label="Call">
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </Panel>
          </Section>
        )}
        {!lease && data.linked && (
          <Empty icon={<FileText className="h-6 w-6" />} title="No lease yet" text="Your lease will appear here once your property office creates it." />
        )}
      </div>
    </div>
  );
}

function Quick({ to, icon, label }: { to: "/requests" | "/documents"; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1.5 rounded-2xl border bg-card py-3 text-xs font-medium shadow-card">
      <span className="rounded-full bg-secondary p-2.5 text-primary">{icon}</span>
      {label}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}
