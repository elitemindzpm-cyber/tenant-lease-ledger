import { backend } from "./backend";

export type ChequeStatus = "cleared" | "deposited" | "upcoming" | "bounced" | "other";

export type Cheque = {
  id: string;
  chequeNumber: string;
  bank: string;
  amount: number;
  dueDate: string | null;
  label: string;
  status: ChequeStatus;
  rawStatus: string;
  frontUrl?: string | null;
  backUrl?: string | null;
};

export type TenantLease = {
  id: string;
  contractNumber: string;
  status: string;
  property: string;
  propertyAddress: string;
  unit: string;
  floor?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  furnishing?: string | null;
  parking?: string | null;
  annualRent: number;
  monthlyRent: number;
  paymentFrequency: string;
  installments: number;
  startDate: string | null;
  endDate: string | null;
  noticePeriodDays: number;
  securityDeposit: number;
  securityDepositStatus?: string | null;
  gracePeriodDays?: number | null;
  maintenanceResponsibility?: string | null;
  utilityResponsibility?: string | null;
  electricityMeter?: string | null;
  waterMeter?: string | null;
  specialConditions?: string | null;
  propertyManager?: string | null;
  pmContact?: string | null;
  signedDocUrl?: string | null;
};

export type TenantProfile = {
  name: string;
  email: string;
  phone?: string | null;
  qatarId?: string | null;
  qidExpiry?: string | null;
  nationality?: string | null;
  employer?: string | null;
  emergencyName?: string | null;
  emergencyPhone?: string | null;
  verification?: string | null;
};

export type TenantBundle = {
  linked: boolean; // a tenant record was found in the live system
  customerId: string | null;
  profile: TenantProfile;
  leases: TenantLease[];
  cheques: Cheque[];
};

export function formatQAR(n: number) {
  return `QAR ${Math.round(n || 0).toLocaleString("en-US")}`;
}

export function formatDate(d?: string | null) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function mapChequeStatus(raw?: string | null, due?: string | null): ChequeStatus {
  const s = (raw || "").toLowerCase();
  if (s.includes("clear") || s.includes("realis") || s.includes("paid")) return "cleared";
  if (s.includes("bounce") || s.includes("return") || s.includes("dishon")) return "bounced";
  if (s.includes("deposit")) return "deposited";
  if (s.includes("hand") || s.includes("pending") || s.includes("upcoming") || s === "") return "upcoming";
  if (due && new Date(due) > new Date()) return "upcoming";
  return "other";
}

const FREQ_COUNT: Record<string, number> = { Monthly: 12, Quarterly: 4, "Semi-Annually": 2, Annually: 1 };

/* eslint-disable @typescript-eslint/no-explicit-any */
function toLease(l: any, unit: any, prop: any): TenantLease {
  const months = Number(l.lease_period_months) || 12;
  const rent = Number(l.rental_amount) || Number(unit?.current_rent) || 0;
  const freq = l.payment_frequency || unit?.rent_frequency || "Monthly";
  // rental_amount is the monthly rent in the production system
  const annual = rent * Math.min(months, 12);
  return {
    id: l.id,
    contractNumber: l.lease_number || l.id.slice(0, 8).toUpperCase(),
    status: l.lease_status || "Active",
    property: prop?.title || prop?.street_building_name || "—",
    propertyAddress: [prop?.address, prop?.area_zone, prop?.city].filter(Boolean).join(", "),
    unit: unit?.unit_ref || unit?.unit_number || unit?.unit_name || l.unit_ref || "—",
    floor: unit?.floor_number || unit?.floor || null,
    area: unit?.total_area_sqm || unit?.area || null,
    bedrooms: unit?.bedrooms ?? null,
    bathrooms: unit?.bathrooms ?? null,
    furnishing: unit?.furnishing || null,
    parking: l.parking_details || unit?.parking_slot_no || null,
    annualRent: annual,
    monthlyRent: rent,
    paymentFrequency: freq,
    installments: Number(l.number_of_pdc) || FREQ_COUNT[freq] || 12,
    startDate: l.commencement_date,
    endDate: l.expiry_date,
    noticePeriodDays: Number(l.notice_period_days) || 60,
    securityDeposit: Number(l.security_deposit) || 0,
    securityDepositStatus: l.security_deposit_status,
    gracePeriodDays: l.grace_period_days,
    maintenanceResponsibility: l.maintenance_responsibility,
    utilityResponsibility: l.utility_responsibility,
    electricityMeter: unit?.electricity_meter_no,
    waterMeter: unit?.water_meter_no,
    specialConditions: l.special_conditions,
    propertyManager: prop?.property_manager || prop?.contact_person || null,
    pmContact: prop?.mobile_number || null,
    signedDocUrl: l.tenant_signed_doc_url || l.landlord_signed_doc_url || null,
  };
}

function toCheque(p: any): Cheque {
  const raw = p.status_pdc || p.status || "";
  const due = p.maturity_date || p.deposit_date;
  const label =
    p.rent_from_date && p.rent_to_date
      ? `Rent ${formatDate(p.rent_from_date)} – ${formatDate(p.rent_to_date)}`
      : "Rent installment";
  return {
    id: p.id,
    chequeNumber: p.cheque_number || "—",
    bank: p.bank || "—",
    amount: Number(p.amount) || 0,
    dueDate: due,
    label,
    status: mapChequeStatus(raw, due),
    rawStatus: raw || "In Hand",
    frontUrl: p.cheque_front_url,
    backUrl: p.cheque_back_url,
  };
}

/** Loads the signed-in tenant's live records, matched by their account email. */
export async function loadLiveTenant(email: string, fallbackName: string): Promise<TenantBundle> {
  const e = email.trim();
  const { data: customers } = await backend
    .from("customers")
    .select("*")
    .or(`primary_email.ilike.${e},email_address.ilike.${e},contact_email.ilike.${e}`)
    .is("deleted_at", null)
    .limit(1);
  const c: any = customers?.[0];

  const profile: TenantProfile = {
    name: c?.display_name || c?.full_name || fallbackName,
    email: e,
    phone: c?.primary_mobile || c?.mobile_number || c?.contact_mobile,
    qatarId: c?.qatar_id,
    qidExpiry: c?.qid_expiry_date,
    nationality: c?.nationality,
    employer: c?.employer_name || c?.company_legal_name,
    emergencyName: c?.emergency_contact_name,
    emergencyPhone: c?.emergency_contact_phone,
    verification: c?.verification_status,
  };
  if (!c) return { linked: false, customerId: null, profile, leases: [], cheques: [] };

  const { data: leaseRows } = await backend
    .from("leases")
    .select("*")
    .eq("customer_id", c.id)
    .order("commencement_date", { ascending: false });
  const rows: any[] = leaseRows || [];

  const unitIds = [...new Set(rows.map((l) => l.unit_id).filter(Boolean))];
  const propIds = [...new Set(rows.map((l) => l.property_id).filter(Boolean))];
  const [{ data: units }, { data: props }] = await Promise.all([
    unitIds.length ? backend.from("units").select("*").in("id", unitIds) : Promise.resolve({ data: [] as any[] }),
    propIds.length ? backend.from("properties").select("*").in("id", propIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const leases = rows.map((l) =>
    toLease(l, units?.find((u: any) => u.id === l.unit_id), props?.find((p: any) => p.id === l.property_id)),
  );

  let pdcRows: any[] = [];
  if (rows.length) {
    const { data } = await backend.from("pdcs").select("*").in("lease_id", rows.map((l) => l.id));
    pdcRows = data || [];
  }
  if (!pdcRows.length && c.full_name) {
    const { data } = await backend.from("pdcs").select("*").ilike("tenant_name", c.full_name);
    pdcRows = data || [];
  }
  const cheques = pdcRows
    .map(toCheque)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  return { linked: true, customerId: c.id, profile, leases, cheques };
}

export function daysUntil(d?: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}
