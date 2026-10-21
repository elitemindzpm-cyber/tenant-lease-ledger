import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backend } from "@/lib/backend";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — Zyno Tenant" },
      { name: "description", content: "Sign in to view your lease, cheques, repairs and bookings." },
      { property: "og:title", content: "Zyno Tenant app" },
      { property: "og:description", content: "Your lease, payments, repairs and bookings in one app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const nav = useNavigate();
  const { ready, signedIn, enterDemo } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  useEffect(() => {
    if (ready && signedIn) nav({ to: "/home" });
  }, [ready, signedIn, nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    if (mode === "forgot") {
      const { error } = await backend.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Check your email for a reset link.");
      return setMode("login");
    }
    const { error } = await backend.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { toast.error(error.message === "Invalid login credentials" ? "Wrong email or password." : error.message); return; }
    nav({ to: "/home" });
  }

  return (
    <main className="min-h-screen bg-hero text-primary-foreground">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-16 pb-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-gold p-2.5 text-gold-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-bold leading-tight">Zyno</p>
            <p className="text-xs opacity-75">Tenant Portal</p>
          </div>
        </div>

        <h1 className="mt-14 text-3xl font-bold leading-tight">
          Your home,
          <br />
          <span className="text-gold">in your pocket.</span>
        </h1>
        <p className="mt-3 text-sm opacity-80">Lease, cheques, repairs and bookings — synced with your property office.</p>

        <form onSubmit={submit} className="mt-10 space-y-4 rounded-3xl bg-card p-6 text-card-foreground shadow-card">
          <h2 className="text-lg font-semibold">{mode === "login" ? "Sign in" : "Reset password"}</h2>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12" />
          </div>
          {mode === "login" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pr-11" />
                <button type="button" aria-label="Show password" onClick={() => setShow(!show)} className="absolute inset-y-0 right-3 text-muted-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
          <Button type="submit" disabled={busy} className="h-12 w-full text-base">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Send reset link"}
          </Button>
          <button type="button" onClick={() => setMode(mode === "login" ? "forgot" : "login")} className="w-full text-center text-sm font-medium text-primary">
            {mode === "login" ? "Forgot password?" : "Back to sign in"}
          </button>
        </form>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            enterDemo();
            nav({ to: "/home" });
          }}
          className="mt-6 h-12 w-full border-gold bg-transparent text-base font-semibold text-gold hover:bg-gold/10 hover:text-gold"
        >
          Explore with the demo tenant
        </Button>
        <p className="mt-2 text-center text-xs opacity-60">No password needed — tap the button above to look around.</p>
        <p className="mt-auto pt-8 text-center text-xs opacity-60">Use the same account you use on the Zyno website.</p>
      </div>
    </main>
  );
}
