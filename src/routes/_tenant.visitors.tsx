import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Share2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Empty, Panel, ScreenHeader, StatusPill } from "@/components/mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { screenHead } from "@/lib/head";
import { useSession, useTenant } from "@/lib/session";
import { formatDate } from "@/lib/tenant-data";
import { newId, today, useDeviceList, type VisitorPass } from "@/lib/local-store";

export const Route = createFileRoute("/_tenant/visitors")({
  head: () => screenHead("Visitor passes", "Create passes for guests and deliveries."),
  component: VisitorsScreen,
});

function VisitorsScreen() {
  const { scope } = useSession();
  const { data } = useTenant();
  const [passes, setPasses] = useDeviceList<VisitorPass[]>(scope, "visitors", []);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ visitorName: "", purpose: "Guest", visitDate: today(), visitTime: "18:00", vehiclePlate: "" });

  function create() {
    if (!f.visitorName.trim()) { toast.error("Add the visitor's name."); return; }
    const ref = `VP-${Math.floor(100000 + Math.random() * 900000)}`;
    setPasses((p) => [{ id: newId("VP"), ...f, status: "active", reference: ref, createdAt: today() }, ...p]);
    setOpen(false);
    toast.success(`Pass ${ref} created.`);
  }

  async function share(p: VisitorPass) {
    const unit = data?.leases[0];
    const text = `Visitor pass ${p.reference} for ${p.visitorName} — ${formatDate(p.visitDate)} ${p.visitTime}${unit ? ` at ${unit.property}, Unit ${unit.unit}` : ""}.`;
    if (navigator.share) await navigator.share({ text }).catch(() => {});
    else { await navigator.clipboard.writeText(text); toast.success("Copied to clipboard."); }
  }

  return (
    <div>
      <ScreenHeader title="Visitor passes" back action={<Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" />New</Button>} />
      <div className="space-y-3 p-4">
        {passes.length === 0 ? (
          <Empty icon={<UserCheck className="h-6 w-6" />} title="No visitor passes" text="Expecting a guest or delivery? Create a pass and share it." />
        ) : (
          passes.map((p) => {
            const status = p.status === "active" && p.visitDate < today() ? "used" : p.status;
            return (
              <Panel key={p.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{p.visitorName}</p>
                    <p className="text-sm text-muted-foreground">{p.purpose} · {formatDate(p.visitDate)} {p.visitTime}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.reference}{p.vehiclePlate ? ` · ${p.vehiclePlate}` : ""}</p>
                  </div>
                  <StatusPill status={status} />
                </div>
                {status === "active" && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => share(p)}><Share2 className="h-4 w-4" />Share</Button>
                    <Button size="sm" variant="ghost" onClick={() => setPasses((x) => x.map((y) => (y.id === p.id ? { ...y, status: "cancelled" } : y)))}>Cancel</Button>
                  </div>
                )}
              </Panel>
            );
          })
        )}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader><SheetTitle>New visitor pass</SheetTitle></SheetHeader>
          <div className="space-y-3 px-4 pb-6">
            <div className="space-y-1.5"><Label>Visitor name</Label><Input value={f.visitorName} onChange={(e) => setF({ ...f, visitorName: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-2">
              {["Guest", "Delivery", "Service"].map((x) => (
                <button key={x} onClick={() => setF({ ...f, purpose: x })} className={`rounded-lg border py-2 text-xs font-medium ${f.purpose === x ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{x}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Date</Label><Input type="date" min={today()} value={f.visitDate} onChange={(e) => setF({ ...f, visitDate: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Time</Label><Input type="time" value={f.visitTime} onChange={(e) => setF({ ...f, visitTime: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Car plate (optional)</Label><Input value={f.vehiclePlate} onChange={(e) => setF({ ...f, vehiclePlate: e.target.value })} /></div>
            <Button className="h-12 w-full" onClick={create}>Create pass</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
