import { useEffect, useState, useCallback } from "react";

// Requests the live system has no records for yet (repair tickets, facility
// bookings, visitor passes) are kept on this device, per account.

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type Ticket = {
  id: string;
  subject: string;
  description: string;
  area: string;
  category: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: TicketStatus;
  createdAt: string;
  preferredTime?: string;
  assignee?: string;
  timeline: { date: string; event: string; by: string }[];
  rating?: number;
};

export type Booking = {
  id: string;
  facility: string;
  date: string;
  slot: string;
  guests: number;
  fee: number;
  status: "Confirmed" | "Pending" | "Cancelled";
  createdAt: string;
};

export type VisitorPass = {
  id: string;
  visitorName: string;
  purpose: string;
  visitDate: string;
  visitTime: string;
  vehiclePlate?: string;
  status: "active" | "used" | "cancelled";
  reference: string;
  createdAt: string;
};

export type Prefs = { email: boolean; sms: boolean; whatsapp: boolean; reminders: boolean };

export const DEMO_TICKETS: Ticket[] = [
  {
    id: "tkt-0001", subject: "Kitchen tap leaking - constant drip",
    description: "The hot water tap in the kitchen has been dripping continuously since Sunday.",
    area: "Kitchen", category: "Plumber", priority: "High", status: "in_progress", createdAt: "2026-06-22",
    assignee: "Mohammad Al-Balushi",
    timeline: [
      { date: "2026-06-22", event: "Ticket raised by tenant", by: "Khalid Al-Mansouri" },
      { date: "2026-06-23", event: "Assigned to Mohammad Al-Balushi (Plumber)", by: "Sarah Al-Kuwari" },
      { date: "2026-06-24", event: "Technician visit scheduled - 10:00 AM", by: "Mohammad Al-Balushi" },
    ],
  },
  {
    id: "tkt-0002", subject: "AC not cooling in master bedroom",
    description: "Master bedroom split AC is running but not producing cold air. E5 error code.",
    area: "Bedroom", category: "HVAC & Chillers", priority: "Urgent", status: "resolved", createdAt: "2026-05-14",
    assignee: "Suresh Kumar",
    timeline: [
      { date: "2026-05-14", event: "Ticket raised by tenant", by: "Khalid Al-Mansouri" },
      { date: "2026-05-16", event: "Repair completed. AC fully operational.", by: "Suresh Kumar" },
    ],
  },
];

export const DEMO_BOOKINGS: Booking[] = [
  { id: "bk-1", facility: "Squash Court", date: "2026-10-25", slot: "19:00-20:00", guests: 2, fee: 30, status: "Confirmed", createdAt: "2026-10-18" },
];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useDeviceList<T>(scope: string, name: string, seed: T) {
  const key = `zyno-tenant:${scope}:${name}`;
  const [items, setItems] = useState<T>(seed);
  useEffect(() => setItems(read(key, seed)), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const save = useCallback(
    (next: T | ((prev: T) => T)) =>
      setItems((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        localStorage.setItem(key, JSON.stringify(v));
        return v;
      }),
    [key],
  );
  return [items, save] as const;
}

export function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
