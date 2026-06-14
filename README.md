# Nouara - Elegant Modest Fashion E-Commerce

## Project Overview

Nouara is a bilingual (EN/FR/AR with RTL support) modest fashion e-commerce platform targeting the Algerian market. Built with React + Vite, styled with Tailwind CSS, and powered by Supabase for the backend.

### Target Market
- Algerian women seeking modest fashion (abayas, jilbabs, kimonos, ensembles)
- Payment: Cash on Delivery (COD) only
- Delivery: Yalidine & ZR Express (all 58 wilayas)
- Currency: Algerian Dinar (DZD)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS + CSS Variables |
| i18n | react-i18next (EN/FR/AR) |
| Backend | Supabase (PostgreSQL + Auth) |
| Icons | lucide-react |
| Routing | react-router-dom |

---

## Database Schema

### Tables

**`products`**
- `id` (uuid, PK)
- `name_en`, `name_fr`, `name_ar` (text)
- `description_en`, `description_fr`, `description_ar` (text)
- `images` (jsonb array - Cloudinary URLs, first is main image)
- `is_active` (boolean)
- `created_at`, `updated_at` (timestamptz)

**`product_variants`**
- `id` (uuid, PK)
- `product_id` (uuid FK → products)
- `sku` (text, unique)
- `size` (text)
- `color_en`, `color_fr`, `color_ar` (text)
- `price_dzd` (integer)
- `stock_quantity` (integer)
- `is_active` (boolean)

### RLS Policies
- Products: Public read for active items, admin CRUD for authenticated
- Variants: Public read when product is active, admin CRUD for authenticated

---

## Project Structure

```
src/
├── App.jsx                  # Routes (no auth protection currently)
├── main.jsx                  # Entry point
├── index.css                 # CSS variables, global styles
├── components/
│   ├── Header.jsx           # Nav, language switcher, cart icon
│   ├── Footer.jsx           # Links, social, contact
│   ├── Layout.jsx           # Wrapper with Header + Footer
│   └── ProductCard.jsx     # Reusable product card + skeleton
├── i18n/
│   ├── index.js              # i18n config
│   └── locales/
│       ├── en.json
│       ├── fr.json
│       └── ar.json
├── lib/
│   └── supabase.js          # Supabase client
└── pages/
    ├── Home.jsx             # Hero, categories, new arrivals, trust strip
    ├── Shop.jsx             # Product listing (needs filters/sorting)
    ├── ProductPage.jsx      # Product detail (needs variants UI)
    ├── Cart.jsx             # Shopping cart
    ├── Checkout.jsx         # Checkout form
    ├── OrderConfirmation.jsx
    ├── HowToOrder.jsx       # How to order guide
    └── admin/
        ├── AdminLogin.jsx
        └── AdminDashboard.jsx  # Shell only - needs full buildout

supabase/
└── migrations/
    └── 20260613095441_001_initial_schema.sql
```

---

## Current Implementation Status

### Completed
- [x] Project setup (Vite, Tailwind, i18n, Supabase)
- [x] Header with language switcher (EN/FR/AR)
- [x] Footer with links
- [x] Home page:
  - [x] Hero section with store name "Nouara"
  - [x] Shop by Category (5 categories: Abayas, Jilbabs, Kimonos, Ensembles, Accessories)
  - [x] New Arrivals (fetches from Supabase, shows lowest variant price)
  - [x] Trust/USP strip (COD, Nationwide Delivery, Quality)
- [x] Shop page:
  - [x] Product grid with shared ProductCard component
  - [x] Category filter (radio, from URL param)
  - [x] Size filter (multi-select chips)
  - [x] Color filter (multi-select chips, localized)
  - [x] Sort (newest, price low-high, price high-low)
  - [x] Mobile filter drawer (bottom sheet)
  - [x] Desktop sidebar filter panel
- [x] Shared ProductCard component (used by Home and Shop)
- [x] Database schema with sample products (6 products, 15 variants)
- [x] Category column added (backfilled for sample products)
- [x] Admin dashboard shell (auth temporarily removed for development)

### In Progress / Needs Work
- [ ] Product page: Variant selection (size/color), quantity, add to cart
- [ ] Cart: Full functionality
- [ ] Checkout: Order submission to database
- [ ] Order confirmation: Order tracking
- [ ] Admin dashboard: Full CRUD for products, order management, analytics

### Not Started
- [ ] Orders table
- [ ] Real authentication (Supabase Auth)
- [ ] Image upload (Cloudinary integration)
- [ ] Order status updates
- [ ] Delivery slip generation

---

## Design System

### Colors (CSS Variables in index.css)
```css
--cream: #FAF7F2        /* Primary background */
--beige: #F0E9DC        /* Secondary background */
--beige-dark: #E0D4C0   /* Borders, accents */
--gold: #C9A87C        /* CTAs, highlights */
--gold-light: #DDBF96
--taupe: #9C8878
--text: #2C2524        /* Primary text */
--text-muted: #8C7B6B  /* Secondary text */
--border: #E5DDD0
--white: #FFFFFF
--success: #6B9E78
--error: #C97070
```

### Typography
- Display/Headings: Playfair Display (EN/FR), Cairo (AR)
- Body: Inter (EN/FR), Cairo (AR)

### Spacing
- 8px base unit
- Container max-width: 1200px
- Header height: 60px mobile, 70px desktop

---

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

---

## Key Design Decisions

1. **No purple colors** - Per user requirement
2. **Mobile-first responsive** - Base styles for mobile, media queries for desktop
3. **RTL support** - Logical CSS properties, Arabic uses Cairo font
4. **Cash on Delivery only** - No online payment integration needed
5. **Price display** - Shows lowest variant price as "From X DZD"
6. **Category routing** - `/shop?category=abayas` for category filtering

---

## Reference Sites
- bysarlin.com
- leenach.com
- anyelladz.com

---

*Last updated: 2026-06-14 (Section 3: Shop page complete)*
