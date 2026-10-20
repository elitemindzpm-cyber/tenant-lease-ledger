import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarCheck2, ChevronRight, FolderOpen, LogOut, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { LoadingBlock, Panel, Row, ScreenHeader, Section } from "@/components/mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { screenHead } from "@/lib/head";
import { backend } from "@/lib/backend";
import { useSession, useTenant } from "@/lib/session";
import { formatDate } from "@/lib/tenant-data";
import { useDeviceList, type Prefs } from "@/lib/local-store";

export const Route = createFileRoute("/_tenant/account")({
  head: () => screenHead("Account", "Your profile, notifications and password."),
  component: AccountScreen,
});

function AccountScreen() {
  const { data, isLoading } = useTenant();
  const { scope, isDemo, signOut } = useSession();
  const nav = useNavigate();
  const [prefs, setPrefs] = useDeviceList<Prefs>(scope, "prefs", { email: true, sms: false, whatsapp: true, reminders: true });
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  if (isLoading || !data) return <LoadingBlock />;
  const p = data.profile;

  async function changePassword() {
    if (isDemo) { toast.error("Not available in the demo."); return; }
    if (pw.length < 8) { toast.error("Use at least 8 characters."); return; }
    setBusy(true);
    const { error } = await backend.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setPw("");
    toast.success("Password updated.");
  }

  return (
    <div>
      <ScreenHeader title="Account" />
      <div className="space-y-6 p-4">
        <Panel className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-lg font-bold text-gold-foreground">
            {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{p.name}</p>
            <p className="truncate text-sm text-muted-foreground">{p.email}</p>
            {p.verification && <p className="mt-0.5 flex items-center gap-1 text-xs text-success"><ShieldCheck className="h-3 w-3" />{p.verification}</p>}
          </div>
        </Panel>

        <Panel className="divide-y p-0">
          <MenuLink to="/bookings" icon={<CalendarCheck2 className="h-5 w-5" />} label="Facility bookings" />
          <MenuLink to="/visitors" icon={<UserCheck className="h-5 w-5" />} label="Visitor passes" />
          <MenuLink to="/documents" icon={<FolderOpen className="h-5 w-5" />} label="Documents" />
        </Panel>

        <Section title="Personal details">
          <Panel className="divide-y py-2">
            <Row label="Mobile" value={p.phone} />
            <Row label="Qatar ID" value={p.qatarId} />
            <Row label="QID expiry" value={p.qidExpiry ? formatDate(p.qidExpiry) : null} />
            <Row label="Nationality" value={p.nationality} />
            <Row label="Employer" value={p.employer} />
            <Row label="Emergency contact" value={p.emergencyName ? `${p.emergencyName} ${p.emergencyPhone || ""}` : null} />
          </Panel>
          <p className="px-1 text-xs text-muted-foreground">To change these details, contact your property office.</p>
        </Section>

        <Section title="Notifications">
          <Panel className="divide-y py-1">
            {([["email", "Email"], ["sms", "SMS"], ["whatsapp", "WhatsApp"], ["reminders", "Payment reminders"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center justify-between py-3 text-sm">
                {l}
                <Switch checked={prefs[k]} onCheckedChange={(v) => setPrefs({ ...prefs, [k]: v })} />
              </label>
            ))}
          </Panel>
        </Section>

        <Section title="Change password">
          <Panel className="space-y-3">
            <Input type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <Button className="w-full" disabled={busy} onClick={changePassword}>Update password</Button>
          </Panel>
        </Section>

        <Button variant="outline" className="h-12 w-full text-destructive" onClick={async () => { await signOut(); nav({ to: "/" }); }}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

function MenuLink({ to, icon, label }: { to: "/bookings" | "/visitors" | "/documents"; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 p-4">
      <span className="text-primary">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
