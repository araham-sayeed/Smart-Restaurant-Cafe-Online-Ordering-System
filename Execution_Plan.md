# Step-by-Step Execution Plan

Build in vertical slices so you have something working at the end of each phase.

---

## Phase 0: Setup & Scaffolding
- [x] Create the `restaurant-saas/` repo, configure `.gitignore` (`.env`, `node_modules`, `__pycache__`).
- [x] Configure `docker-compose.yml` for PostgreSQL, Redis, and FastAPI Backend.
- [x] Populate `.env.example` and `.env` with DB URL, Redis URL, JWT secret, and CORS settings.
- [x] Backend scaffolding: FastAPI, Uvicorn, SQLAlchemy, Alembic, psycopg2-binary, pydantic-settings, python-jose, passlib, redis, stripe, pytest.
- [x] Frontend scaffolding: Vite + React 19 + Tailwind CSS, React Router DOM, Axios, Zustand.
- **Done when:** `GET /health` returns `{"status": "ok"}` and the React app loads with styling.

---

## Phase 1: Database & Authentication
- [x] Set up `core/config.py` and `db/session.py`.
- [x] Create SQLAlchemy models:
  - `Restaurant` (`id`, `name`, `slug`, `stripe_account_id`, `created_at`)
  - `User` (`id`, `email`, `hashed_password`, `full_name`, `role`, `restaurant_id`, `created_at`)
- [x] Set up Alembic migration environment (`env.py`) and generate initial migration.
- [x] Implement password hashing and JWT encoding/decoding (`core/security.py`).
- [x] API Routes:
  - `POST /auth/register` (creates restaurant tenant + owner user)
  - `POST /auth/login` (verifies credentials, returns JWT)
  - `GET /auth/me` (returns current authenticated user)
- [x] Security dependencies: `get_current_user` and `require_role("owner")`.
- [x] Frontend UI & Store:
  - `Login.jsx` & `Register.jsx` pages
  - `auth.js` Zustand store with token persistence
  - `ProtectedRoute.jsx` for dashboard protection
- **Done when:** An owner can register a restaurant, log in, and access protected admin pages.

---

## Phase 2: Menu Management
- [ ] Models: `Category`, `MenuItem`, `AddonGroup`, `AddonOption`, each with `restaurant_id`.
- [ ] Generate and run migration.
- [ ] Admin CRUD routes:
  - Categories management
  - Menu Items management
  - Add-on groups and options
  - `PATCH /items/{id}/availability` (quick in-stock toggle)
- [ ] Public route: `GET /public/{slug}/menu` returning nested category -> items -> addons hierarchy.
- [ ] Frontend Admin: `MenuBuilder` page with category list, item modal/form, addon editor, and stock toggles.
- [ ] Image management: initial image URL support with future Cloudinary/S3 integration.
- **Done when:** Owner can build out a full menu and the public tenant endpoint returns the structured menu.

---

## Phase 3: Customer Store & Cart
- [ ] Frontend Customer Store:
  - Storefront page (`/r/{slug}`) with category tabs and item cards.
  - Customization modal for selecting addon options.
- [ ] Zustand Cart Store (`useCart`):
  - Add, remove, update quantities, calculate subtotals.
  - Persist cart state to `localStorage`.
- [ ] Cart drawer and Checkout page (name, phone, order type, special instructions).
- [ ] Models: `Order`, `OrderItem`, `OrderItemAddon`.
- [ ] Route: `POST /public/{slug}/orders`:
  - Recalculate all item and addon prices on server directly from DB.
  - Create order with status `received`.
- [ ] Order confirmation page.
- **Done when:** Customer can browse, customize items, checkout with Cash on Pickup, and order is saved to DB.

---

## Phase 4: Kitchen Dashboard & Live Updates
- [ ] Routes: `GET /kitchen/orders` (active queue) and `PATCH /kitchen/orders/{id}/status`.
- [ ] Status state machine: `received` -> `preparing` -> `ready` -> `completed` (reject illegal transitions).
- [ ] Redis Pub/Sub: broadcast order lifecycle events on `restaurant:{id}:orders`.
- [ ] Server-Sent Events (SSE) endpoints:
  - `/kitchen/stream` for kitchen staff live queue.
  - `/orders/{id}/stream` for customer order tracking.
- [ ] Frontend:
  - `LiveQueue` 3-column kanban board with auditory alert on new orders.
  - Customer `OrderTracking` page with live progress bar.
- **Done when:** Placing an order in one browser tab appears instantly on the kitchen display, and status changes update customer view in real-time.

---

## Phase 5: Stripe Payments (Connect)
- [ ] Stripe Connect (Express/Standard) integration with `stripe_account_id` on `Restaurant`.
- [ ] Route: `POST /payments/connect/onboard` returning Stripe onboarding link for owner.
- [ ] Route: `POST /payments/create-intent` for server-calculated totals directed to connected account.
- [ ] Frontend: Stripe Elements on Checkout (`@stripe/react-stripe-js`).
- [ ] Route: `POST /payments/webhook` verifying signature, handling `payment_intent.succeeded` idempotently.
- [ ] Order visibility gate: card orders appear in kitchen queue only after successful payment confirmation.
- **Done when:** Test card payment succeeds, marks order paid, and activates order in kitchen queue.

---

## Phase 6: Table QR Dine-In Mode
- [ ] Model: `Table` (`number`, `restaurant_id`).
- [ ] Admin route to manage tables and generate QR codes pointing to `/r/{slug}?table={number}`.
- [ ] Frontend Storefront: detect `?table=` query parameter, activate dine-in mode (bypass delivery/pickup address).
- [ ] Display table number prominently on kitchen cards.
- **Done when:** Scanning a QR code opens tenant menu with table locked in, routing dine-in orders to kitchen.

---

## Phase 7: Admin Analytics & History
- [ ] Route: `GET /admin/stats?range=day|week` using SQL aggregations (revenue, order volume, AOV, top items).
- [ ] Frontend Admin Dashboard: metric cards and interactive charts.
- [ ] Order history table with search, date filters, and status badges.
- **Done when:** Owner has real-time insight into sales, order counts, and best-selling items.

---

## Phase 8: Hardening & Multi-tenancy Isolation
- [ ] Strict tenant isolation: guarantee every DB query filters by `restaurant_id`.
- [ ] Rate limiting on public endpoints using Redis.
- [ ] Automated test suite:
  - Tenant data leakage prevention tests
  - Order price calculation verification
  - Status transition machine tests
  - Stripe webhook verification
- [ ] Mobile-first responsive polish, empty states, loading skeletons.
- **Done when:** Test suite passes with 100% green on auth, pricing, and isolation.

---

## Phase 9: Deployment & Showcase
- [ ] Deploy backend with Docker (Render / Railway / VPS) with managed Postgres & Redis.
- [ ] Deploy frontend to Vercel / Netlify.
- [ ] GitHub Actions CI pipeline running pytest and oxlint.
- [ ] Seed script for demo restaurant with full menu and imagery.
- [ ] Production documentation, architecture diagram, and demo recording.
- **Done when:** Application is live on public URLs and fully testable end-to-end.
