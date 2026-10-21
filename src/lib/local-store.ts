import { useEffect, useState, useCallback } from "react";

// Small per-account preferences (notification toggles) are kept on this device.

export type Prefs = { email: boolean; sms: boolean; whatsapp: boolean; reminders: boolean };

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
