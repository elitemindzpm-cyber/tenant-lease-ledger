import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CreditCard, ImageIcon } from "lucide-react";
import { Empty, LoadingBlock, Panel, ScreenHeader, StatusPill } from "@/components/mobile";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { screenHead } from "@/lib/head";
import { useTenant } from "@/lib/session";
import { formatDate, formatQAR, type Cheque } from "@/lib/tenant-data";

export const Route = createFileRoute("/_tenant/payments")({
  head: () => screenHead("Payments", "Your rent cheques, what's paid and what's coming up."),
  component: PaymentsScreen,
});

function PaymentsScreen() {
  const { data, isLoading } = useTenant();
  const [tab, setTab] = useState("upcoming");
  const [open, setOpen] = useState<Cheque | null>(null);
  if (isLoading || !data) return <LoadingBlock />;

  const upcoming = data.cheques.filter((c) => c.status === "upcoming" || c.status === "deposited");
  const paid = data.cheques.filter((c) => c.status === "cleared");
  const issues = data.cheques.filter((c) => c.status === "bounced" || c.status === "other");
  const list = tab === "upcoming" ? upcoming : tab === "paid" ? paid : issues;
  const sum = (a: Cheque[]) => a.reduce((s, c) => s + c.amount, 0);

  return (
    <div>
      <ScreenHeader title="Payments" />
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-2 gap-3">
          <Panel><p className="text-xs text-muted-foreground">Paid</p><p className="mt-1 text-lg font-bold text-success">{formatQAR(sum(paid))}</p></Panel>
          <Panel><p className="text-xs text-muted-foreground">Remaining</p><p className="mt-1 text-lg font-bold">{formatQAR(sum(upcoming))}</p></Panel>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="paid">Paid ({paid.length})</TabsTrigger>
            <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {list.length === 0 ? (
          <Empty icon={<CreditCard className="h-6 w-6" />} title="Nothing here" text={tab === "issues" ? "No bounced or returned cheques." : "No cheques in this list."} />
        ) : (
          <ul className="space-y-3">
            {list.map((c) => (
              <li key={c.id}>
                <button onClick={() => setOpen(c)} className="w-full text-left">
                  <Panel className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{formatQAR(c.amount)}</p>
                      <p className="truncate text-sm text-muted-foreground">{c.label}</p>
                      <p className="text-xs text-muted-foreground">#{c.chequeNumber} · {c.bank}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <StatusPill status={c.status} label={c.rawStatus} />
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(c.dueDate)}</p>
                    </div>
                  </Panel>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="px-1 text-xs text-muted-foreground">
          Cheque status updates automatically when your property office records a deposit or clearance.
        </p>
      </div>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cheque #{open?.chequeNumber}</DialogTitle></DialogHeader>
          {open && (
            <div className="space-y-2 text-sm">
              <p className="text-2xl font-bold">{formatQAR(open.amount)}</p>
              <p>{open.label}</p>
              <p className="text-muted-foreground">{open.bank}</p>
              <p>Due: {formatDate(open.dueDate)}</p>
              <StatusPill status={open.status} label={open.rawStatus} />
              <div className="grid grid-cols-2 gap-2 pt-2">
                {[open.frontUrl, open.backUrl].map((u, i) =>
                  u ? (
                    <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt={i ? "Cheque back" : "Cheque front"} className="rounded-lg border" /></a>
                  ) : (
                    <div key={i} className="flex h-20 items-center justify-center rounded-lg border border-dashed text-muted-foreground"><ImageIcon className="h-5 w-5" /></div>
                  ),
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
