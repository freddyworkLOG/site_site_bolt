# Nouara - Elegant Modest Fashion E-Commerce
*(working name — store name, logo, and color palette pending final client confirmation)*

## Project Overview

A trilingual (EN/FR/AR with RTL support) modest fashion e-commerce platform targeting the Algerian market. Built with React + Vite, styled with Tailwind CSS + CSS Variables, powered by Supabase. Cash on delivery only, no customer accounts — guests checkout and leave.

### Business Context
- **Target**: Algerian women seeking modest fashion, all 58 wilayas
- **Products**: Abayas, Jilbabs, Kimonos, Ensembles, Accessories
- **Payment**: Cash on Delivery (COD) only — no online payment
- **Delivery**: Yalidine & ZR Express (client chooses per order at checkout)
- **Currency**: Algerian Dinar (DZD)
- **Reference sites**: bysarlin.com, leenach.com, anyelladz.com

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + CSS Variables (no UI libraries) |
| Icons | lucide-react |
| i18n | react-i18next (EN/FR/AR) |
| Routing | react-router-dom v7 |
| Backend | Supabase (PostgreSQL + Auth) |
| Image storage | Cloudinary (planned — not yet wired in) |
| Hosting | Netlify (not yet deployed) |

---

## Design System

### Colors (CSS Variables — defined in `src/index.css`)
```css
--cream: #FAF7F2        /* Primary background */
--beige: #F0E9DC        /* Secondary background */
--beige-dark: #E0D4C0   /* Borders, accents */
--gold: #C9A87C         /* CTAs, highlights, active states */
--gold-light: #DDBF96
--taupe: #9C8878
--text: #2C2524         /* Primary text */
--text-muted: #8C7B6B   /* Secondary text */
--border: #E5DDD0
--white: #FFFFFF
--success: #6B9E78
--error: #C97070
```

### Typography
- **Display/Headings**: `Playfair Display` (EN/FR), `Cairo` (AR)
- **Body**: `Inter` (EN/FR), `Cairo` (AR)
- Max 3 font weights

### Key Design Rules
- **NO purple/indigo/violet** colors — ever
- Mobile-first responsive
- RTL support via logical CSS properties (`insetInlineStart`, `insetInlineEnd`)
- Arabic language switches entire UI font to Cairo + sets `dir="rtl"`

---

## Project File Structure
src/

├── App.jsx                  # Routes — BrowserRouter with all routes (real entry point)

├── main.jsx                 # Entry point — React 18 createRoot (real entry point)

├── App.tsx / main.tsx       # ⚠️ Unused Bolt boilerplate, not loaded anywhere — safe to delete

├── index.css                # CSS variables + global resets + Tailwind

├── components/

│   ├── Header.jsx           # Sticky header: nav, language switcher, cart icon

│   ├── Footer.jsx

│   ├── Layout.jsx           # Wraps Header + main + Footer

│   └── ProductCard.jsx      # Shared card used by Home + Shop (+ skeleton export)

├── i18n/

│   ├── index.js

│   └── locales/{en,fr,ar}.json

├── lib/

│   ├── supabase.js          # createClient — returns null if env vars missing

│   └── AuthProvider.jsx     # Auth context + ProtectedRoute (gates /admin/*)

└── pages/

├── Home.jsx

├── Shop.jsx              # Product grid + filters + sort, accepts ?category=

├── ProductPage.jsx       # Variant selector, add to cart

├── Cart.jsx

├── Checkout.jsx          # Form + order submission to Supabase

├── OrderConfirmation.jsx # Reads order via get_order_by_id() RPC, not direct table SELECT

├── HowToOrder.jsx

└── admin/

├── AdminLogin.jsx     # Supabase Auth email/password

└── AdminDashboard.jsx # Product CRUD, order list + status updates
supabase/

└── migrations/   # ⚠️ Out of date — does not match live DB schema/policies.

# Live schema is authoritative; see "Database Schema" below.

---

## Database Schema (live, as of June 2026 security audit)

### `products`
Same as before: `id, name_en/fr/ar, description_en/fr/ar, images (jsonb), category, is_active, created_at, updated_at`

### `product_variants`
`id, product_id (FK), sku, size, color_en/fr/ar, price_dzd, stock_quantity, is_active`

### `orders`
`id, customer_name, customer_phone, wilaya, commune, address, delivery_method, items (jsonb), subtotal, delivery_fee, total, status, tracking_number, notes, created_at, updated_at`

### `order_items`, `delivery_slips`
Exist in the database (from initial Phase 3 setup) but **not currently used by any app code**. The app stores order line items as a JSON array directly inside `orders.items` instead. `delivery_slips` is reserved for Phase 5 (Yalidine/ZR integration) and is still empty.

### RLS Policies (locked down, audited June 2026)
- `products` / `product_variants`: public SELECT where `is_active = true`; all writes restricted to the single admin account (`auth.uid()` check, not generic `authenticated`)
- `orders`: public INSERT only (guest checkout). **No public SELECT** — admin-only, scoped to the same admin UID. Public order lookup goes through `get_order_by_id(uuid)`, a `SECURITY DEFINER` function that returns exactly one row by ID — this is the only way the order-confirmation page can read order data without exposing the whole table.
- `delivery_slips`: admin-only, zero public access

### Server-side order validation
A `BEFORE INSERT` trigger (`validate_and_price_order`) on `orders` recalculates `subtotal`/`delivery_fee`/`total` from the real `product_variants.price_dzd` values and rejects orders referencing invalid/inactive variants — the price the browser sends is never trusted.

**Security principle for this codebase:** any public page that looks up a single row by ID should go through a `SECURITY DEFINER` RPC scoped to that ID, never a public `SELECT` policy with `USING (true)`. Apply this pattern to anything new that needs an unauthenticated single-record lookup.

---

## Routing

| Path | Component | Notes |
|------|-----------|-------|
| `/` | Home | |
| `/shop` | Shop | Accepts `?category=abayas` etc. |
| `/product/:id` | ProductPage | |
| `/cart` | Cart | |
| `/checkout` | Checkout | |
| `/order-confirmation/:orderId` | OrderConfirmation | Uses `get_order_by_id()` RPC |
| `/how-to-order` | HowToOrder | |
| `/admin/login` | AdminLogin | |
| `/admin/*` | AdminDashboard | **Guarded** — `ProtectedRoute` (client) + RLS (server) both gate this |
| `*` | → `/` | Redirect |

---

## Cart Implementation

Stored in **localStorage** under `cart_items` as a JSON array:
```js
{
  variantId: uuid,
  productId: uuid,
  name: string,    // localized
  image: string,
  size: string,
  color: string,   // localized
  price: number,   // DZD
  quantity: number,
}
```
Header reads `cart_items` on every route change to show the badge count.

---

## Current Status (as of June 20, 2026)

### Completed
- [x] Routing, i18n (AR/RTL + FR + EN), design system
- [x] Home, Shop, ProductPage, Cart, Checkout, OrderConfirmation, HowToOrder — all built
- [x] Admin: login + dashboard with product CRUD and order management
- [x] Supabase Auth wired, admin route protected (client + server)
- [x] RLS fully audited and locked down to the specific admin account
- [x] Public order-data exposure fixed (`get_order_by_id` RPC)
- [x] Server-side price validation trigger (prevents price tampering on checkout)
- [x] Basic bot honeypot on checkout form

### Known gaps
- [ ] No real products yet — empty catalog, pending client meeting on colors/design
- [ ] Cloudinary not wired in — admin currently pastes a raw image URL instead of uploading from phone
- [ ] Stock isn't automatically reduced when an order comes in
- [ ] No real rate-limiting on order submission (only the honeypot, which a targeted attacker could bypass)
- [ ] Yalidine + ZR Express API integration not started (Phase 5)
- [ ] Not deployed to Netlify yet (Phase 6)
- [ ] Client handoff not done (Phase 7)

---

## Development Commands

```bash
npm run dev      # Start dev server (port 5173)
npm run build    # Production build
npm run lint     # ESLint
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`.env` is gitignored — never commit real values. Get them from the Supabase dashboard.

---

*Last updated: 2026-06-20 — security audit complete (RLS lockdown, price-tampering fix, PII exposure fix), Phases 1-4 essentially done, Phase 5 (delivery APIs) up next.*