Step-by-Step Execution Plan

Build in vertical slices so you have something working at the end of each phase. Estimates assume part-time work.

Phase 0: Setup (1 day)
Create the restaurant-saas/ repo, run git init, and add a .gitignore (.env, node_modules, __pycache__).
Write docker-compose.yml with 3 services first: postgres, redis, backend. Add frontend later.
Create .env.example (DB URL, Redis URL, JWT secret, Stripe keys).
Backend: create a venv, install fastapi uvicorn sqlalchemy alembic psycopg2-binary pydantic-settings python-jose passlib redis stripe pytest.
Frontend: npm create vite@latest frontend -- --template react, then add Tailwind, react-router-dom, axios, zustand.

Done when: GET /health returns OK and the React app loads with a Tailwind-styled page.

Phase 1: Database and Auth (3–4 days)
Set up core/config.py and db/session.py.
Create models: Restaurant, User (with role and restaurant_id).
Initialize Alembic and run the first migration.
Build security.py (password hashing, JWT creation).
Routes: POST /auth/register (creates restaurant plus owner), POST /auth/login, GET /auth/me.
In deps.py, write get_current_user and require_role("owner").
Frontend: login and register pages, and an auth store that keeps the token.

Done when: you can register a restaurant, log in, and hit a protected route.

Phase 2: Menu Management (Completed)
- [x] Models: Category, MenuItem, AddonGroup, AddonOption, each with restaurant_id.
- [x] Run the migration (b1cc09b52cf8_add_menu_tables.py).
- [x] Admin CRUD routes: categories, items, add-on groups, plus PATCH /items/{id}/availability.
- [x] Public route: GET /public/{slug}/menu, returning the nested menu (categories → items → add-ons).
- [x] Frontend admin: MenuBuilder page (/admin/menu) with category tabs, item creation, modifier editor, and in-stock toggle.
- [x] Image upload: image URL support included on items.

Done when: an owner can build a full menu and the public endpoint returns it. (Verified & tested)

Phase 3: Customer Store and Cart (4–5 days)
Frontend: Menu page (category tabs, item cards, a modal for choosing add-ons).
Build the useCart hook with a Zustand store: add, remove, change quantity, and compute the total. Persist it to localStorage.
Cart drawer and Checkout page (name, phone, order type, notes).
Models: Order, OrderItem, OrderItemAddon.
POST /public/{slug}/orders: recalculate prices on the server from the DB, then save the order with status received.
Order confirmation page.

Done when: a customer can order with a cash on pickup option and the order lands in the DB.

Phase 4: Kitchen Dashboard and Live Updates (4–5 days)
Routes: GET /kitchen/orders (active orders) and PATCH /kitchen/orders/{id}/status.
Add a status machine: received → preparing → ready → completed (reject invalid jumps).
Redis pub/sub: publish an event on every new order or status change, on a channel such as restaurant:{id}:orders.
SSE endpoints: /kitchen/stream for staff and /orders/{id}/stream for customers, each subscribing to Redis.
Frontend: the LiveQueue page with three columns, a new-order sound, and the useOrderStream hook.
Customer OrderTracking page showing live status.

Done when: placing an order in one browser tab appears instantly on the kitchen tab, and status changes show up for the customer.

Phase 5: Stripe Payments (5–6 days)
Start in Stripe test mode.
Decide on Connect: use Express or Standard accounts so money goes to each restaurant. Add stripe_account_id to Restaurant.
Route: POST /payments/connect/onboard returns the Stripe onboarding link for the owner.
Route: POST /payments/create-intent, which creates a PaymentIntent for the server-calculated total, sent to the restaurant’s connected account.
Frontend: Stripe Elements on Checkout, using @stripe/react-stripe-js.
Webhook POST /payments/webhook: verify the signature, handle payment_intent.succeeded, mark the order paid, and make it idempotent.
Only show an order to the kitchen after payment succeeds (for card orders).
Use the Stripe CLI to test webhooks locally.

Done when: a test card payment marks the order paid and it appears in the kitchen queue.

Phase 6: Table QR Mode (2 days)
Model: Table (number, restaurant_id).
Admin route to create tables and generate a QR code per table (the qrcode Python lib or a frontend QR library) pointing to /r/{slug}?table=7.
In the store, detect ?table= and switch to dine-in mode (skip the address, attach table_id to the order).
Show the table number on kitchen cards.
Phase 7: Admin Analytics (3 days)
Route: GET /admin/stats?range=day|week, using SQL aggregates (total revenue, order count, average order value, top items).
Frontend dashboard: stat cards and a chart (Recharts).
Order history page with filters.

Phase 8: Hardening (3–4 days)
Rate limiting with Redis on public order endpoints.
Enforce tenant isolation: every query filters by restaurant_id. Write tests that try to access another restaurant’s data.
Write pytest tests for auth, the order total calculation, the status machine, and the webhook.
Add error handling, loading states, and empty states in the UI.
Apply the theme colors, with per-restaurant branding through CSS variables.
Make the UI mobile-first.

Phase 9: Deploy and Showcase (2–3 days)
Deploy the backend on Railway, Render, or a VPS with Docker, using managed Postgres and Redis.
Deploy the frontend on Netlify or Vercel.
Add a GitHub Actions workflow that runs tests.
Seed a demo restaurant with a full menu.
Write a strong README (architecture diagram, screenshots, GIF of live order flow, setup steps).
Record a short demo video.