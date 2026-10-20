<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Tenant data comes from the production Zyno backend via `src/lib/backend.ts` (public anon key only); never add Lovable Cloud tables for data that already lives there — keeps app and website in sync.
- Tenants are matched to their `customers` row by sign-in email; leases by `customer_id`, cheques (`pdcs`) by `lease_id` — the production schema has no auth-user link.
- Repair tickets, facility bookings, visitor passes and prefs are stored on-device (`src/lib/local-store.ts`) because the production backend has no tables for them; move them to the backend once tables exist.
- Signed-in screens live under the pathless `_tenant` layout (client-only, bottom tab nav).
