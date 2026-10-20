import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText } from "lucide-react";
import { Empty, LoadingBlock, Panel, Row, ScreenHeader, Section, StatusPill } from "@/components/mobile";
import { screenHead } from "@/lib/head";
import { useTenant } from "@/lib/session";
import { formatDate, formatQAR } from "@/lib/tenant-data";

export const Route = createFileRoute("/_tenant/lease")({
  head: () => screenHead("My lease", "Your lease contract, unit details and terms."),
  component: LeaseScreen,
});

function LeaseScreen() {
  const { data, isLoading } = useTenant();
  if (isLoading || !data) return <LoadingBlock />;

  return (
    <div>
      <ScreenHeader title="My lease" />
      <div className="space-y-6 p-4">
        {data.leases.length === 0 && (
          <Empty icon={<FileText className="h-6 w-6" />} title="No lease found" text="Your lease will appear here once your property office sets it up." />
        )}
        {data.leases.map((l, i) => (
          <div key={l.id} className="space-y-4">
            <Panel className="bg-hero text-primary-foreground">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs opacity-75">Contract {i > 0 ? "(previous)" : ""}</p>
                  <p className="text-lg font-bold">{l.contractNumber}</p>
                </div>
                <StatusPill status={l.status} label={l.status} />
              </div>
              <p className="mt-4 text-xl font-semibold">{l.property}</p>
              <p className="text-sm opacity-80">Unit {l.unit}{l.propertyAddress ? ` · ${l.propertyAddress}` : ""}</p>
              <div className="mt-4 flex justify-between text-sm">
                <span>{formatDate(l.startDate)}</span>
                <span className="opacity-60">→</span>
                <span>{formatDate(l.endDate)}</span>
              </div>
            </Panel>

            <Section title="Rent & deposit">
              <Panel className="divide-y py-2">
                <Row label="Monthly rent" value={formatQAR(l.monthlyRent)} />
                <Row label="Annual rent" value={formatQAR(l.annualRent)} />
                <Row label="Payment frequency" value={l.paymentFrequency} />
                <Row label="Number of cheques" value={l.installments} />
                <Row label="Security deposit" value={formatQAR(l.securityDeposit)} />
                <Row label="Deposit status" value={l.securityDepositStatus} />
                <Row label="Grace period" value={l.gracePeriodDays != null ? `${l.gracePeriodDays} days` : null} />
              </Panel>
            </Section>

            <Section title="Unit">
              <Panel className="divide-y py-2">
                <Row label="Floor" value={l.floor} />
                <Row label="Area" value={l.area ? `${l.area} m²` : null} />
                <Row label="Bedrooms / Baths" value={`${l.bedrooms ?? "—"} / ${l.bathrooms ?? "—"}`} />
                <Row label="Furnishing" value={l.furnishing} />
                <Row label="Parking" value={l.parking} />
                <Row label="Electricity meter" value={l.electricityMeter} />
                <Row label="Water meter" value={l.waterMeter} />
              </Panel>
            </Section>

            <Section title="Terms">
              <Panel className="divide-y py-2">
                <Row label="Notice period" value={`${l.noticePeriodDays} days`} />
                <Row label="Maintenance" value={l.maintenanceResponsibility} />
                <Row label="Utilities" value={l.utilityResponsibility} />
                {l.specialConditions && <p className="py-2 text-sm text-muted-foreground">{l.specialConditions}</p>}
              </Panel>
            </Section>

            {l.signedDocUrl && (
              <a href={l.signedDocUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-medium text-primary-foreground">
                <Download className="h-4 w-4" /> Signed lease agreement
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
