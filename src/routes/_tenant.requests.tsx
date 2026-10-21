import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Star, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Empty, LoadingBlock, Panel, ScreenHeader, StatusPill } from "@/components/mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { screenHead } from "@/lib/head";
import { useSession, useTenant } from "@/lib/session";
import { formatDate } from "@/lib/tenant-data";
import { createTicket, loadTickets, updateTicket, type Ticket } from "@/lib/requests";

export const Route = createFileRoute("/_tenant/requests")({
  head: () => screenHead("Repair requests", "Report problems in your home and track repairs."),
  component: RequestsScreen,
});

const CATEGORIES = ["Plumber", "Electrician", "HVAC & Chillers", "Carpenter", "Painter", "Pest Control", "Cleaning", "Intercom", "Appliances", "Other"];
const AREAS = ["Kitchen", "Bedroom", "Bathroom", "Living Room", "Balcony", "Unit / Apartment", "Parking", "Common Area"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export function useTickets() {
  const { session } = useSession();
  const email = session?.user.email || "";
  return useQuery({
    queryKey: ["tickets", email],
    enabled: !!email,
    staleTime: 30_000,
    queryFn: () => loadTickets(email),
  });
}

function RequestsScreen() {
  const { session } = useSession();
  const { data: tenant } = useTenant();
  const qc = useQueryClient();
  const email = session?.user.email || "";
  const { data: tickets, isLoading, isError } = useTickets();
  const [tab, setTab] = useState("active");
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<Ticket | null>(null);
  const [form, setForm] = useState({ subject: "", description: "", category: "Plumber", area: "Kitchen", priority: "Medium" as Ticket["priority"], preferredTime: "" });

  const list = (tickets || []).filter((t) => (tab === "active" ? t.status === "open" || t.status === "in_progress" : t.status === "resolved" || t.status === "closed"));
  const name = tenant?.profile.name || "Tenant";

  const refresh = () => qc.invalidateQueries({ queryKey: ["tickets", email] });

  const createMut = useMutation({
    mutationFn: () =>
      createTicket({
        email,
        customerId: tenant?.customerId,
        leaseId: tenant?.leases[0]?.id,
        byName: name,
        ...form,
      }),
    onSuccess: () => {
      refresh();
      setCreating(false);
      setForm({ ...form, subject: "", description: "", preferredTime: "" });
      toast.success("Request submitted.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not submit the request."),
  });

  const updateMut = useMutation({
    mutationFn: (args: { ticket: Ticket; patch: { status?: Ticket["status"]; rating?: number }; event: string }) =>
      updateTicket({ id: args.ticket.id, email, patch: args.patch, event: args.event, byName: name, timeline: args.ticket.timeline }),
    onSuccess: () => {
      refresh();
      setView(null);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update the request."),
  });

  function create() {
    if (!form.subject.trim()) { toast.error("Add a short title."); return; }
    createMut.mutate();
  }

  return (
    <div>
      <ScreenHeader title="Repair requests" action={<Button size="sm" onClick={() => setCreating(true)}><Plus className="h-4 w-4" />New</Button>} />
      <div className="space-y-4 p-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="done">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        {isLoading ? (
          <LoadingBlock />
        ) : isError ? (
          <Empty icon={<Wrench className="h-6 w-6" />} title="Requests unavailable" text="We couldn't reach the maintenance system. Pull to refresh or try again shortly." />
        ) : list.length === 0 ? (
          <Empty icon={<Wrench className="h-6 w-6" />} title="No requests" text="Something broken? Report it and track the repair here.">
            <Button onClick={() => setCreating(true)}>Report a problem</Button>
          </Empty>
        ) : (
          <ul className="space-y-3">
            {list.map((t) => (
              <li key={t.id}>
                <button className="w-full text-left" onClick={() => setView(t)}>
                  <Panel>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{t.subject}</p>
                      <StatusPill status={t.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{t.category} · {t.area} · {t.priority}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t.ref} · {formatDate(t.createdAt)}</p>
                  </Panel>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={creating} onOpenChange={setCreating}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader><SheetTitle>Report a problem</SheetTitle></SheetHeader>
          <div className="space-y-4 px-4 pb-6">
            <div className="space-y-1.5"><Label>Title</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Kitchen tap leaking" /></div>
            <div className="grid grid-cols-2 gap-3">
              <Pick label="Type" value={form.category} options={CATEGORIES} onChange={(v) => setForm({ ...form, category: v })} />
              <Pick label="Where" value={form.area} options={AREAS} onChange={(v) => setForm({ ...form, area: v })} />
            </div>
            <div className="space-y-1.5">
              <Label>How urgent?</Label>
              <div className="grid grid-cols-4 gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p} type="button" onClick={() => setForm({ ...form, priority: p })} className={`rounded-lg border py-2 text-xs font-medium ${form.priority === p ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{p}</button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label>Details</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Best time to visit</Label><Input type="datetime-local" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} /></div>
            <Button className="h-12 w-full" disabled={createMut.isPending} onClick={create}>Submit request</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl">
          {view && (
            <>
              <SheetHeader><SheetTitle>{view.subject}</SheetTitle></SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="flex gap-2"><StatusPill status={view.status} /><span className="text-sm text-muted-foreground">{view.category} · {view.priority}</span></div>
                {view.description && <p className="text-sm">{view.description}</p>}
                {view.assignee && <p className="text-sm">Technician: <span className="font-medium">{view.assignee}</span></p>}
                <ol className="space-y-3 border-l-2 border-secondary pl-4">
                  {view.timeline.map((e, i) => (
                    <li key={i} className="text-sm"><p className="font-medium">{e.event}</p><p className="text-xs text-muted-foreground">{formatDate(e.date)} · {e.by}</p></li>
                  ))}
                </ol>
                {view.status === "resolved" && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Rate the repair</p>
                    <div className="flex gap-1">{[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} aria-label={`${n} stars`} disabled={updateMut.isPending} onClick={() => updateMut.mutate({ ticket: view, patch: { rating: n, status: "closed" }, event: `Tenant confirmed fix and rated ${n}/5` })}>
                        <Star className={`h-7 w-7 ${(view.rating || 0) >= n ? "fill-gold text-gold" : "text-muted-foreground"}`} />
                      </button>
                    ))}</div>
                  </div>
                )}
                {(view.status === "open" || view.status === "in_progress") && (
                  <Button variant="outline" className="w-full" disabled={updateMut.isPending} onClick={() => updateMut.mutate({ ticket: view, patch: { status: "closed" }, event: "Request cancelled by tenant" })}>Cancel request</Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Pick({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
