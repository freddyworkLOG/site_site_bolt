# Nouara - Elegant Modest Fashion E-Commerce

## Project Overview

Nouara is a trilingual (EN/FR/AR with RTL support) modest fashion e-commerce platform targeting the Algerian market. Built with React + Vite, styled with Tailwind CSS + CSS Variables, and powered by Supabase.

### Business Context
- **Target**: Algerian women seeking modest fashion
- **Products**: Abayas, Jilbabs, Kimonos, Ensembles, Accessories
- **Payment**: Cash on Delivery (COD) only — no online payment
- **Delivery**: Yalidine & ZR Express (all 58 wilayas)
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

### Spacing & Layout
- 8px base unit
- Container max-width: 1200px (`var(--max-width)`)
- Header height: 60px mobile, 70px desktop (`var(--header-height)`)

### Key Design Rules
- **NO purple/indigo/violet** colors — ever
- Mobile-first responsive
- RTL support via logical CSS properties (`insetInlineStart`, `insetInlineEnd`)
- Arabic language switches entire UI font to Cairo + sets `dir="rtl"`
- Stock photos from Pexels only

---

## Project File Structure

```
src/
├── App.jsx                  # Routes — BrowserRouter with all routes
├── main.jsx                 # Entry point — React 18 createRoot
├── index.css                # CSS variables + global resets + Tailwind
├── components/
│   ├── Header.jsx           # Sticky header: nav, language switcher (AR/FR/EN), cart icon
│   ├── Footer.jsx           # Footer with links, social, contact
│   ├── Layout.jsx           # Wraps Header + main + Footer
│   └── ProductCard.jsx      # Shared card used by Home + Shop (+ skeleton export)
├── i18n/
│   ├── index.js             # i18next init: LanguageDetector → localStorage → navigator
│   └── locales/
│       ├── en.json          # English translations (complete)
│       ├── fr.json          # French translations (complete)
│       └── ar.json          # Arabic translations (complete)
├── lib/
│   └── supabase.js          # createClient — returns null if env vars missing
└── pages/
    ├── Home.jsx             # Hero, category grid, new arrivals, trust strip
    ├── Shop.jsx             # Product grid + filters + sort
    ├── ProductPage.jsx      # Product detail — needs variant selector UI
    ├── Cart.jsx             # Cart page — reads from localStorage key 'cart_items'
    ├── Checkout.jsx         # Checkout form — needs order submission to DB
    ├── OrderConfirmation.jsx # Order confirmed page
    ├── HowToOrder.jsx       # Step-by-step guide page
    └── admin/
        ├── AdminLogin.jsx   # Admin login form (Supabase Auth — not yet wired)
        └── AdminDashboard.jsx  # Shell only — "coming soon" placeholder

supabase/
└── migrations/
    ├── 20260613095441_001_initial_schema.sql   # Products + variants tables + RLS + sample data
    └── 20260614101048_002_add_category_column.sql  # Added category column + backfilled + index
```

---

## Database Schema

### `products`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| name_en | text NOT NULL | |
| name_fr | text NOT NULL | |
| name_ar | text NOT NULL | |
| description_en/fr/ar | text | |
| images | jsonb | Array of URLs — first is main image |
| category | text | 'abayas' \| 'jilbabs' \| 'kimonos' \| 'ensembles' \| 'accessories' |
| is_active | boolean | Default true |
| created_at / updated_at | timestamptz | |

### `product_variants`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| product_id | uuid FK | → products(id) ON DELETE CASCADE |
| sku | text UNIQUE | |
| size | text | 'S' \| 'M' \| 'L' \| 'XL' \| 'Free Size' |
| color_en / color_fr / color_ar | text | |
| price_dzd | integer NOT NULL | |
| stock_quantity | integer | Default 0 |
| is_active | boolean | Default true |

### RLS Policies
- Products: Public SELECT where `is_active = true`; authenticated INSERT/UPDATE/DELETE
- Variants: Public SELECT where product is active and variant is active; authenticated INSERT/UPDATE/DELETE

### Sample Data (already in DB)
6 products, 15 variants:
- Elegant Black Abaya (abayas) — 8500–9000 DZD
- Flowing Jilbab (jilbabs) — 7200–7500 DZD
- Silk Kimono (kimonos) — 12000 DZD
- Modest Ensemble (ensembles) — 15000–15500 DZD
- Embroidered Abaya (abayas) — 11000 DZD
- Casual Jilbab (jilbabs) — 6500–6800 DZD

---

## Routing

| Path | Component | Notes |
|------|-----------|-------|
| `/` | Home | |
| `/shop` | Shop | Accepts `?category=abayas` etc. |
| `/product/:id` | ProductPage | |
| `/cart` | Cart | |
| `/checkout` | Checkout | |
| `/order-confirmation/:orderId` | OrderConfirmation | |
| `/how-to-order` | HowToOrder | |
| `/admin/login` | AdminLogin | |
| `/admin/*` | AdminDashboard | No auth guard currently |
| `*` | → `/` | Redirect |

---

## Cart Implementation

Cart is stored in **localStorage** under key `cart_items` as a JSON array. Each item shape (to define when building ProductPage):
```js
{
  variantId: uuid,
  productId: uuid,
  name: string,          // localized
  image: string,         // URL
  size: string,
  color: string,         // localized
  price: number,         // DZD
  quantity: number,
}
```
Header reads `cart_items` on every route change to show badge count.

---

## i18n Keys Reference

All three locale files (`en.json`, `fr.json`, `ar.json`) have identical structure with these top-level namespaces:
- `nav` — home, shop, howToOrder, cart
- `common` — addToCart, loading, error, save, cancel, delete, edit, search, filter, price, total, quantity, size, color, stock, outOfStock, inStock, viewProduct, backToShop, viewAll, from
- `home` — heroTitle, heroSubtitle, shopNow, shopByCategory, newArrivals, viewAll, noProducts, fromPrice, categories.*, trust.*
- `shop` — title, noProducts, clearFilters, filters, allCategories, allSizes, allColors, sortBy, newest, priceLowHigh, priceHighLow, apply, clearAll, close, categories.*, sizes.*
- `product` — selectSize, selectColor, quantity, addToCart, outOfStock, description, details, selectVariantFirst
- `cart` — title, empty, continueShopping, remove, subtotal, proceedToCheckout, items
- `checkout` — title, personalInfo, name, phone, phoneHint, delivery, wilaya, commune, address, addressHint, deliveryMethod, deliveryMethodHint, yalidine, zr, paymentMethod, cod, codDesc, orderSummary, placeOrder, required, invalidPhone
- `confirmation` — title, subtitle, orderNumber, summary, whatNext, step1/2/3, continueShopping
- `howToOrder` — title, subtitle, step1-5 Title+Desc
- `admin` — login, email, password, signIn, signingIn, invalidCredentials, dashboard, products, orders, customers, inventory, addProduct, editProduct, deleteProduct, productName/Ar/Fr/En, description/Ar/Fr/En, category, price, uploadPhotos, uploadHint, variants, addVariant, size, color, stock, saveProduct, saving, productSaved, productDeleted, confirmDelete, orderStatus, pending, confirmed, shipped, delivered, cancelled, generateSlip, viewSlip, trackingNumber, signOut, totalOrders, totalProducts, pendingOrders, recentOrders

---

## Current Status

### Completed
- [x] Full project setup (Vite + React + Tailwind + i18n + Supabase)
- [x] Design system (CSS variables, fonts, spacing)
- [x] RTL support (Arabic flips layout, logical CSS properties)
- [x] Header: language switcher, sticky, cart badge, mobile hamburger drawer
- [x] Footer
- [x] Home page: hero, 5 category cards, new arrivals from Supabase, trust strip
- [x] Shop page: product grid, category/size/color filters, sort, mobile bottom-sheet filters, desktop sidebar
- [x] Shared ProductCard component + skeleton loader
- [x] Database: products + variants tables, RLS, 6 sample products
- [x] Category column added to products + backfilled

### Needs Building
- [ ] **ProductPage**: variant selector (size chips, color chips), quantity input, add-to-cart → localStorage
- [ ] **Cart**: display items, update quantity, remove, subtotal, → checkout button
- [ ] **Checkout**: form validation (name, Algerian phone regex `/^0[5-7][0-9]{8}$/`), wilaya dropdown (58 wilayas), submit order to Supabase `orders` table (not yet created)
- [ ] **Orders table**: needs migration — customer info, items JSON, wilaya, delivery method, status, total
- [ ] **OrderConfirmation**: show order details from Supabase by orderId
- [ ] **Admin Dashboard**: full CRUD for products (with image upload), order list + status updates, delivery slip generation
- [ ] **Auth**: wire up Supabase email/password auth for admin — AdminLogin → session → protect `/admin/*`
- [ ] **Image upload**: Cloudinary or Supabase Storage

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

Both are pre-populated in `.env` — do not change them.

---

*Last updated: 2026-06-15 (Sessions 1–3 complete: setup, Home, Shop)*
