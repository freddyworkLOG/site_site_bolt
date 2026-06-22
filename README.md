Be Princess Collection — Modest Fashion E-Commerce

Algerian women's modest fashion store — trilingual (AR/FR/EN) with RTL support


⚠️ For Bolt — Read This First

This is an existing project with a live Supabase database and real GitHub history. When opening this project in Bolt:


Import from GitHub — do NOT start a blank project
Do NOT create a new Supabase project — connect to the existing one via the .env file
Do NOT modify any database table structure unless explicitly instructed
The live database is authoritative — ignore /supabase/migrations/ folder, it is out of date


Completed prompts (already done — do NOT redo these)


✅ Project setup: routing, i18n (AR/RTL + FR + EN), design system
✅ All 8 pages built: Home, Shop, ProductPage, Cart, Checkout, OrderConfirmation, HowToOrder, Admin
✅ Full rebrand to "Be Princess Collection" — colors, logo, store name, homepage
✅ Admin product form: fixed 4-size buttons (S/Taille 1/Taille 2/Taille 3) + 12-color swatch picker writing to color_en/fr/ar columns
✅ Checkout: first/last name split, optional second phone (customer_phone_2)
✅ Security audit complete: RLS locked down, price-tampering trigger, PII fix, honeypot


What still needs to be built (next prompts to run, in order)


Cloudinary photo upload — replace the image URL text input in AdminDashboard with a real file picker that uploads to Cloudinary
Yalidine + ZR Express delivery via Netlify Functions (Phase 5)
Netlify deployment (Phase 6)



Project Overview

E-commerce site for an Algerian women's clothing store (modest fashion — abayas, jilbabs, kimonos, ensembles). Client has an existing physical shop of 2 years. Builder maintains the site long-term. Cash on delivery only, no customer accounts, guest checkout only.


Target: Algerian women, all 58 wilayas
Payment: Cash on Delivery (COD) only
Delivery: Yalidine + ZR Express — client chooses per order
Languages: Arabic (RTL) + French + English — auto-detected, manual toggle
Currency: DZD (Algerian Dinar)



Tech Stack

LayerTechnologyFrontendReact 18 + ViteStylingTailwind CSS + CSS VariablesIconslucide-reacti18nreact-i18next (EN/FR/AR + RTL)Routingreact-router-dom v7DatabaseSupabase (PostgreSQL + Auth)Image hostingCloudinary (unsigned preset ready, upload UI not yet built)HostingNetlify (not yet deployed)Delivery APIsYalidine + ZR Express via Netlify Functions (not yet built)


Design System

Brand Colors (src/index.css)

css--cream: #FFFFFF          /* Primary background */
--beige: #F7F3F2          /* Secondary/section background */
--beige-dark: #E8DEDC     /* Borders, subtle dividers */
--rose: #C9A0A6           /* Primary accent — buttons, active states */
--rose-light: #DEBFC3     /* Hover states */
--rose-dark: #A67C82      /* Pressed states, darker accents */
--text: #1A1A1A           /* Primary text */
--text-muted: #6B6260     /* Secondary text */
--border: #EDE3E1
--white: #FFFFFF
--success: #6B9E78
--error: #C97070
/* Legacy aliases — do not remove, used throughout component CSS */
--gold: var(--rose)
--gold-light: var(--rose-light)
--taupe: var(--rose-dark)

Typography


Display/Headings: Playfair Display (EN/FR), Cairo (AR)
Body: Inter (EN/FR), Cairo (AR)


Rules


NO purple/indigo/violet anywhere
Mobile-first responsive throughout
RTL via logical CSS properties (insetInlineStart, etc.)
Arabic switches full UI to Cairo + dir="rtl"



File Structure

src/
├── App.jsx                    # Routes — real entry point
├── main.jsx                   # React 18 createRoot — real entry point
├── index.css                  # CSS variables + global styles
├── components/
│   ├── Header.jsx             # Sticky nav, language switcher, cart icon, logo
│   ├── Footer.jsx
│   ├── Layout.jsx
│   └── ProductCard.jsx
├── i18n/
│   ├── index.js
│   └── locales/{en,fr,ar}.json
├── lib/
│   ├── supabase.js            # createClient from env vars — returns null if missing
│   └── AuthProvider.jsx       # Auth context + ProtectedRoute
└── pages/
    ├── Home.jsx               # Hero + featured products grid (replaces category scroll)
    ├── Shop.jsx               # Product grid + filters
    ├── ProductPage.jsx        # Variant selector, add to cart
    ├── Cart.jsx
    ├── Checkout.jsx           # First/last name, 2 phones, wilaya/baladya, honeypot
    ├── OrderConfirmation.jsx  # Uses get_order_by_id() RPC — NOT direct table SELECT
    ├── HowToOrder.jsx
    └── admin/
        ├── AdminLogin.jsx
        └── AdminDashboard.jsx # Product CRUD with swatch picker + size buttons


Database Schema (live — June 2026)

products

id, name_en/fr/ar, description_en/fr/ar, images (jsonb), category, is_active, price (nullable), created_at, updated_at

product_variants

id, product_id (FK → products), sku, size, color_en, color_fr, color_ar, price_dzd, stock_quantity, is_active

Fixed sizes used in the app:


"S (36)"
"Taille 1 (38-40)"
"Taille 2 (42-44)"
"Taille 3 (Sur commande)"


orders

id, customer_name, customer_phone, customer_phone_2 (nullable), wilaya, commune, address, delivery_method, items (jsonb), subtotal, delivery_fee, total, status, tracking_number, notes, created_at, updated_at

order_items, delivery_slips

Exist in DB but not currently used by app code. delivery_slips reserved for Phase 5.

RLS Policies


products / product_variants: public SELECT (is_active = true); writes scoped to admin UID 3d142324-28ec-4a39-8477-b862f4626e1e only
orders: public INSERT (guest checkout). No public SELECT. Lookup via get_order_by_id(uuid) SECURITY DEFINER RPC only
delivery_slips: admin-only


Server-side validation

BEFORE INSERT trigger validate_and_price_order on orders — recalculates price from real product_variants.price_dzd, rejects invalid/inactive variants. Browser-sent price is ignored.

Security rule: any future public single-record lookup must use a SECURITY DEFINER RPC scoped to that ID — never USING (true) public SELECT.


Routing

PathComponentNotes/Home/shopShopAccepts ?category=/product/:idProductPage/cartCart/checkoutCheckoutHoneypot field included/order-confirmation/:orderIdOrderConfirmationVia RPC only/how-to-orderHowToOrder/admin/loginAdminLogin/admin/*AdminDashboardProtectedRoute + RLS


Environment Variables

envVITE_SUPABASE_URL=https://wnrwsciwpiretzklkwbu.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name  ← add this before Cloudinary prompt

.env is gitignored — never commit real values.


Cloudinary Setup (ready, upload UI not yet built)


Unsigned upload preset: products_upload
Target folder: products
Upload endpoint: https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload
VITE_CLOUDINARY_CLOUD_NAME must be added to .env before running the Cloudinary Bolt prompt



Current Status (June 21, 2026)

Done


 All 8 pages built and visually confirmed
 Full rebrand: Be Princess Collection colors + logo + name
 Admin product form: 4 fixed sizes + 12-color swatch picker
 Checkout: split name, optional second phone, honeypot
 RLS fully audited and locked down
 Server-side price validation trigger
 get_order_by_id() RPC protecting order PII


Pending


 Cloudinary photo upload UI in admin (next prompt to run)
 Real products — catalog empty, pending client to add via admin
 Stock auto-decrement on order
 Yalidine + ZR Express Netlify Functions (Phase 5)
 Netlify deployment (Phase 6)
 Client handoff (Phase 7)



Dev Commands

bashnpm install    # first time setup
npm run dev    # dev server at localhost:5173
npm run build  # production build


Supabase project: wnrwsciwpiretzklkwbu.supabase.co — Admin UID: 3d142324-28ec-4a39-8477-b862f4626e1e