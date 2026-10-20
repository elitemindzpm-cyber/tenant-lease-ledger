import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck2, Clock, Users } from "lucide-react";
import { toast } from "sonner";
import { Empty, Panel, ScreenHeader, Section, StatusPill } from "@/components/mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { screenHead } from "@/lib/head";
import { useSession } from "@/lib/session";
import { formatDate, formatQAR } from "@/lib/tenant-data";
import { DEMO_BOOKINGS, newId, today, useDeviceList, type Booking } from "@/lib/local-store";

export const Route = createFileRoute("/_tenant/bookings")({
  head: () => screenHead("Facility bookings", "Book the pool, gym, hall and other building facilities."),
  component: BookingsScreen,
});

const FACILITIES = [
  { name: "Swimming Pool", hours: "06:00-22:00", capacity: 20, fee: 0, slots: ["06:00-08:00", "08:00-10:00", "16:00-18:00", "18:00-20:00", "20:00-22:00"] },
  { name: "Gymnasium", hours: "05:30-23:00", capacity: 15, fee: 0, slots: ["06:00-07:00", "07:00-08:00", "18:00-19:00", "19:00-20:00", "20:00-21:00"] },
  { name: "Multi-Purpose Event Hall", hours: "09:00-22:00", capacity: 80, fee: 150, slots: ["10:00-13:00", "14:00-17:00", "17:00-20:00"] },
  { name: "BBQ Area Terrace B", hours: "16:00-23:00", capacity: 10, fee: 50, slots: ["16:00-19:00", "19:00-22:00"] },
  { name: "Kids Play Room", hours: "09:00-20:00", capacity: 20, fee: 0, slots: ["10:00-12:00", "14:00-16:00", "16:00-18:00"] },
  { name: "Squash Court", hours: "06:00-22:00", capacity: 4, fee: 30, slots: ["07:00-08:00", "18:00-19:00", "19:00-20:00", "20:00-21:00"] },
];

function BookingsScreen() {
  const { scope, isDemo } = useSession();
  const [bookings, setBookings] = useDeviceList<Booking[]>(scope, "bookings", isDemo ? DEMO_BOOKINGS : []);
  const [pick, setPick] = useState<(typeof FACILITIES)[number] | null>(null);
  const [date, setDate] = useState(today());
  const [slot, setSlot] = useState("");
  const [guests, setGuests] = useState(1);

  const upcoming = bookings.filter((b) => b.status !== "Cancelled" && b.date >= today());

  function book() {
    if (!pick || !slot) { toast.error("Choose a time slot."); return; }
    if (guests < 1 || guests > pick.capacity) { toast.error(`Guests must be between 1 and ${pick.capacity}.`); return; }
    if (bookings.some((b) => b.facility === pick.name && b.date === date && b.slot === slot && b.status !== "Cancelled"))
      { toast.error("You already booked this slot."); return; }
    setBookings((p) => [
      { id: newId("BK"), facility: pick.name, date, slot, guests, fee: pick.fee, status: pick.fee > 0 ? "Pending" : "Confirmed", createdAt: today() },
      ...p,
    ]);
    toast.success(pick.fee > 0 ? "Booking requested — awaiting confirmation." : "Booking confirmed.");
    setPick(null);
    setSlot("");
  }

  return (
    <div>
      <ScreenHeader title="Facility bookings" back />
      <div className="space-y-6 p-4">
        <Section title="My bookings">
          {upcoming.length === 0 ? (
            <Empty icon={<CalendarCheck2 className="h-6 w-6" />} title="No upcoming bookings" text="Pick a facility below to book a slot." />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((b) => (
                <li key={b.id}>
                  <Panel className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{b.facility}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(b.date)} · {b.slot} · {b.guests} guest{b.guests > 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right">
                      <StatusPill status={b.status} label={b.status} />
                      <button className="mt-1 block text-xs font-medium text-destructive" onClick={() => { setBookings((p) => p.map((x) => (x.id === b.id ? { ...x, status: "Cancelled" } : x))); toast("Booking cancelled."); }}>Cancel</button>
                    </div>
                  </Panel>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Facilities">
          <div className="grid grid-cols-2 gap-3">
            {FACILITIES.map((f) => (
              <button key={f.name} onClick={() => setPick(f)} className="text-left">
                <Panel className="h-full">
                  <p className="font-semibold leading-tight">{f.name}</p>
                  <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{f.hours}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />Up to {f.capacity}</p>
                  <p className="mt-2 text-sm font-medium text-primary">{f.fee ? formatQAR(f.fee) : "Free"}</p>
                </Panel>
              </button>
            ))}
          </div>
        </Section>
      </div>

      <Sheet open={!!pick} onOpenChange={(o) => !o && setPick(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          {pick && (
            <>
              <SheetHeader><SheetTitle>{pick.name}</SheetTitle></SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="space-y-1.5"><Label>Date</Label><Input type="date" min={today()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
                <div className="space-y-1.5">
                  <Label>Time</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {pick.slots.map((s) => (
                      <button key={s} onClick={() => setSlot(s)} className={`rounded-lg border py-2 text-xs font-medium ${slot === s ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5"><Label>Guests</Label><Input type="number" min={1} max={pick.capacity} value={guests} onChange={(e) => setGuests(Number(e.target.value))} /></div>
                <Button className="h-12 w-full" onClick={book}>{pick.fee ? `Request booking · ${formatQAR(pick.fee)}` : "Book now"}</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
