import { backend } from "./backend";

// Maintenance requests live in the production backend (table: maintenance_requests).
// Tenants only ever see their own rows — scoped by their account email via RLS.

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type TicketEvent = { date: string; event: string; by: string };

export type Ticket = {
  id: string;
  ref: string;
  subject: string;
  description: string;
  area: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  preferredTime?: string;
  assignee?: string;
  timeline: TicketEvent[];
  rating?: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function toTicket(r: any): Ticket {
  return {
    id: r.id,
    ref: r.ref || `MR-${String(r.id).slice(0, 6).toUpperCase()}`,
    subject: r.subject || "",
    description: r.description || "",
    area: r.area || "",
    category: r.category || "",
    priority: r.priority || "Medium",
    status: (r.status || "open") as TicketStatus,
    createdAt: r.created_at,
    preferredTime: r.preferred_time || undefined,
    assignee: r.assignee || undefined,
    timeline: Array.isArray(r.timeline) ? r.timeline : [],
    rating: r.rating ?? undefined,
  };
}

export async function loadTickets(email: string): Promise<Ticket[]> {
  const { data, error } = await backend
    .from("maintenance_requests")
    .select("*")
    .eq("customer_email", email)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toTicket);
}

export async function createTicket(input: {
  email: string;
  customerId?: string | null;
  leaseId?: string | null;
  byName: string;
  subject: string;
  description: string;
  category: string;
  area: string;
  priority: TicketPriority;
  preferredTime?: string;
}): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await backend.from("maintenance_requests").insert({
    customer_email: input.email,
    customer_id: input.customerId || null,
    lease_id: input.leaseId || null,
    subject: input.subject,
    description: input.description,
    category: input.category,
    area: input.area,
    priority: input.priority,
    preferred_time: input.preferredTime || null,
    status: "open",
    timeline: [{ date: now, event: "Request raised by tenant", by: input.byName }],
  });
  if (error) throw error;
}

export async function updateTicket(input: {
  id: string;
  email: string;
  patch: { status?: TicketStatus; rating?: number };
  event: string;
  byName: string;
  timeline: TicketEvent[];
}): Promise<void> {
  const { error } = await backend
    .from("maintenance_requests")
    .update({
      ...input.patch,
      timeline: [...input.timeline, { date: new Date().toISOString(), event: input.event, by: input.byName }],
    })
    .eq("id", input.id)
    .eq("customer_email", input.email);
  if (error) throw error;
}
