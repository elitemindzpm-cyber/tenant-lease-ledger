import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, FolderOpen, Printer } from "lucide-react";
import { Empty, LoadingBlock, Panel, ScreenHeader, Section } from "@/components/mobile";
import { screenHead } from "@/lib/head";
import { useTenant } from "@/lib/session";
import { formatDate, formatQAR, type TenantBundle } from "@/lib/tenant-data";

export const Route = createFileRoute("/_tenant/documents")({
  head: () => screenHead("Documents", "Your lease agreement, cheque images and statements."),
  component: DocumentsScreen,
});

type Doc = { name: string; category: string; date?: string | null; url?: string | null; onOpen?: () => void };

function printStatement(data: TenantBundle) {
  const l = data.leases[0];
  const rows = data.cheques
    .map((c) => `<tr><td>${c.chequeNumber}</td><td>${c.bank}</td><td>${formatDate(c.dueDate)}</td><td>${c.rawStatus}</td><td style="text-align:right">${formatQAR(c.amount)}</td></tr>`)
    .join("");
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<html><head><title>Statement</title><style>body{font-family:Inter,sans-serif;padding:24px}td,th{border-bottom:1px solid #ddd;padding:6px;font-size:12px;text-align:left}table{width:100%;border-collapse:collapse}</style></head><body>
  <h2>Statement of Account</h2><p>${data.profile.name}${l ? ` — ${l.property}, Unit ${l.unit} (${l.contractNumber})` : ""}</p>
  <p>Generated ${formatDate(new Date().toISOString())}</p>
  <table><tr><th>Cheque</th><th>Bank</th><th>Due</th><th>Status</th><th style="text-align:right">Amount</th></tr>${rows}</table>
  <script>window.print()</script></body></html>`);
  w.document.close();
}

function DocumentsScreen() {
  const { data, isLoading } = useTenant();
  if (isLoading || !data) return <LoadingBlock />;

  const docs: Doc[] = [];
  data.leases.forEach((l) => l.signedDocUrl && docs.push({ name: `Lease Agreement — ${l.contractNumber}`, category: "Legal", date: l.startDate, url: l.signedDocUrl }));
  data.cheques.forEach((c) => {
    if (c.frontUrl) docs.push({ name: `Cheque #${c.chequeNumber} (front)`, category: "Finance", date: c.dueDate, url: c.frontUrl });
    if (c.backUrl) docs.push({ name: `Cheque #${c.chequeNumber} (back)`, category: "Finance", date: c.dueDate, url: c.backUrl });
  });
  const groups = [...new Set(docs.map((d) => d.category))];

  return (
    <div>
      <ScreenHeader title="Documents" back />
      <div className="space-y-6 p-4">
        <button onClick={() => printStatement(data)} className="w-full text-left" disabled={!data.cheques.length}>
          <Panel className="flex items-center gap-3">
            <span className="rounded-xl bg-secondary p-2.5 text-primary"><Printer className="h-5 w-5" /></span>
            <div className="flex-1"><p className="font-semibold">Statement of account</p><p className="text-xs text-muted-foreground">Print or save as PDF</p></div>
          </Panel>
        </button>
        {docs.length === 0 ? (
          <Empty icon={<FolderOpen className="h-6 w-6" />} title="No documents uploaded yet" text="Signed agreements and cheque copies appear here once your property office uploads them." />
        ) : (
          groups.map((g) => (
            <Section key={g} title={g}>
              <Panel className="divide-y p-0">
                {docs.filter((d) => d.category === g).map((d, i) => (
                  <a key={i} href={d.url || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4">
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{d.name}</p><p className="text-xs text-muted-foreground">{formatDate(d.date)}</p></div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </Panel>
            </Section>
          ))
        )}
      </div>
    </div>
  );
}
