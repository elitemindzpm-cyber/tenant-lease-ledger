import { createClient } from "@supabase/supabase-js";

// Same live backend as the production web app (property-management.zynotechnologies.com).
// This is the public (anon) key; access is governed by the backend's own rules.
const URL = "https://rnebpqnzignwjeukgztz.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZWJwcW56aWdud2pldWtnenR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNzU4ODIsImV4cCI6MjA5OTc1MTg4Mn0.maLd6Jgr8uggrfu5uZg9sjRmG0z0r7NlaMB4wIdSRTg";

export const backend = createClient(URL, ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});
