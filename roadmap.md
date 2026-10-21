# Roadmap

- [x] Remove demo access (sign-in screen, session, demo data, demo banner)
- [x] Remove Visitor Management and facility/slot Booking screens and links
- [x] Move maintenance requests from on-device storage to the production backend (`maintenance_requests` table, tenant-scoped by account email)
- [x] Provide SQL migration for the production backend (`supabase/maintenance_requests.sql`)
- [x] Verify: typecheck, tests, Playwright sign-in flow — all pass
- [ ] BLOCKED (user side): run `supabase/maintenance_requests.sql` in the production database — I only have the public key, cannot create tables
- [ ] BLOCKED (user side): create tenant login accounts in the production system — the public key cannot create users; the app matches tenants by sign-in email automatically
