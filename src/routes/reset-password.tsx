import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backend } from "@/lib/backend";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Zyno Tenant" },
      { name: "description", content: "Choose a new password for your Zyno tenant account." },
      { property: "og:title", content: "Set a new password — Zyno Tenant" },
      { property: "og:description", content: "Choose a new password for your Zyno tenant account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <form
        className="space-y-4 rounded-3xl border bg-card p-6 shadow-card"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pw.length < 8) { toast.error("Use at least 8 characters."); return; }
          setBusy(true);
          const { error } = await backend.auth.updateUser({ password: pw });
          setBusy(false);
          if (error) { toast.error(error.message); return; }
          toast.success("Password updated.");
          nav({ to: "/home" });
        }}
      >
        <h1 className="text-xl font-semibold">Set a new password</h1>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12" />
        </div>
        <Button disabled={busy} className="h-12 w-full">Save password</Button>
      </form>
    </main>
  );
}
