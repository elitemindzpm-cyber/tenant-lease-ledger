# Roadmap

- [ ] Remove demo access (sign-in screen, session, demo data, demo banner)
- [ ] Remove Visitor Management and facility/slot Booking screens and links
- [ ] Move maintenance requests from on-device storage to the production backend (`maintenance_requests` table, tenant-scoped by account email)
- [ ] Provide SQL migration for the production backend (cannot run it myself — public key only)
- [ ] Explain user-account creation: tenant logins must be created in the production system (public key cannot create accounts); app matches tenants by sign-in email
- [ ] Verify: typecheck, tests, Playwright sign-in flow
