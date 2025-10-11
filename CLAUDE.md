# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Al-Agayebi is an e-commerce storefront built with Next.js 14, featuring Server-Side Rendering (SSR), full Arabic/RTL support, and Supabase backend integration. The application is designed for Arabic-speaking users with comprehensive RTL optimization.

## Development Commands

```bash
# Development
npm run dev                    # Start development server
npm run dev:turbopack         # Start development with Turbopack
npm run dev:clean             # Clean build cache and start dev

# Building & Production
npm run build                 # Build for production
npm run build:clean           # Clean build cache and build
npm start                     # Start production server

# Maintenance
npm run clean                 # Remove .next and tsconfig.tsbuildinfo
npm run kill-node            # Kill all Node.js processes (Windows)
npm run lint                  # Run ESLint
npm run test-db              # Test database connection
```

## Architecture & Key Technologies

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Styling**: TailwindCSS with custom RTL utilities
- **UI Components**: Radix UI + shadcn/ui
- **Animations**: Framer Motion
- **Type Safety**: TypeScript with strict mode
- **Analytics**: Hotjar integration for user behavior tracking

## Project Structure

```
app/                    # Next.js App Router pages
├── api/               # API routes for backend operations
├── admin/             # Admin dashboard
├── dashboard/         # User dashboard
└── [various pages]/   # Product, category, cart, checkout pages

components/            # Reusable React components
├── ui/               # shadcn/ui components
└── layout/           # Layout-specific components

lib/                   # Utility libraries and configurations
├── supabase.ts       # Supabase client configuration
├── types.ts          # TypeScript type definitions
├── utils/            # General utilities
└── [feature dirs]/   # Feature-specific utilities
```

## Database Integration

The application uses Supabase as the backend with the following key tables:
- `products` - Product catalog
- `categories` - Product categories
- `orders` - Order management (includes `delivery_type` and `pickup_branch_id`)
- `profiles` - User profiles
- `admin_users` - Admin user permissions
- `branches` - Branch locations for pickup
- `site_settings` - Site-wide configuration including simplified shipping settings
- `hero_slides` - Hero carousel slides for homepage
- `homepage_sections` - Dynamic homepage sections configuration
- `homepage_section_products` - Products linked to homepage sections

### Database Connection
- Client initialization in `lib/supabase.ts`
- Connection testing available via `npm run test-db`
- Environment variables required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## RTL & Arabic Support

This project has extensive RTL support:
- Custom Tailwind utilities for RTL layouts
- Arabic fonts: Tajawal (body) and Cairo (headings)
- RTL-specific CSS classes (`.rtl`, `.ltr`, `.flip-x`)
- Arabic number formatting
- All UI components are RTL-compatible

## Code Standards & Guidelines

### Security Requirements
- Implement secure coding practices against injection attacks, XSS, CSRF
- Validate and sanitize all user inputs
- No hard-coded secrets or API keys in frontend code
- Defensive programming with proper error handling

### Component Development
- Create modern, professional-grade UI components
- Follow world-class app design patterns (Amazon, SHEIN quality)
- Ensure full responsiveness across all screen sizes
- Optimize for mobile devices and high-DPI displays
- Use Tailwind classes exclusively for styling
- Implement proper accessibility features

### Code Practices
- Use early returns for better readability
- Prefer `const` functions over regular functions
- Event handlers should have `handle` prefix (e.g., `handleClick`)
- Use descriptive variable and function names
- Follow TypeScript strict mode requirements

## Environment Setup

Required environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_GA_MEASUREMENT_ID=your_ga_id
NEXT_PUBLIC_HOTJAR_ID=your_hotjar_id
NEXT_PUBLIC_HOTJAR_VERSION=6
```

## Image Configuration

Next.js image optimization is configured for:
- Supabase storage (`*.supabase.co`)
- Unsplash (`images.unsplash.com`)
- Placeholder service (`via.placeholder.com`)
- Supports AVIF and WebP formats

## API Routes Structure

### Core Routes
- `/api/products` - Product CRUD operations
- `/api/categories` - Category management
- `/api/orders` - Order processing (supports `delivery_type`: 'shipping' | 'pickup')
- `/api/dashboard` - Admin dashboard data
- `/api/database` - Database utilities and health checks

### Branches API (NEW)
- `GET /api/branches` - List all branches (query: `?active=true` for active only)
- `GET /api/branches/[id]` - Get single branch details
- `POST /api/branches` - Create new branch
- `PUT /api/branches/[id]` - Update branch
- `DELETE /api/branches/[id]` - Delete or deactivate branch
- `PATCH /api/branches/[id]` - Partial update

### Simplified Shipping API
- `POST /api/shipping-cost/calculate` - Calculate shipping cost based on subtotal
  - Supports fixed pricing and "determined by phone" modes
  - Automatic free shipping when threshold is reached
  - Returns shipping message and delivery time

### Homepage Management API (NEW)
- `GET /api/hero-slides` - List all hero carousel slides (query: `?active=true` for active only)
- `POST /api/hero-slides` - Create new hero slide
- `PUT /api/hero-slides` - Update hero slide
- `DELETE /api/hero-slides` - Delete hero slide

- `GET /api/homepage-sections` - List all homepage sections (query: `?active=true`, `?type=products`)
- `POST /api/homepage-sections` - Create new section
- `PUT /api/homepage-sections` - Update section
- `DELETE /api/homepage-sections` - Delete section

- `GET /api/homepage-sections/products` - Get products for a section (query: `?section_id=xxx`)
- `POST /api/homepage-sections/products` - Add product to section
- `PUT /api/homepage-sections/products` - Update product sort order
- `DELETE /api/homepage-sections/products` - Remove product from section

## Shipping System

The application uses a **simplified single-company shipping system**:

### Configuration
Settings are stored in `site_settings` table:
- `shipping_enabled` - Enable/disable shipping system
- `shipping_company_name` - Name of shipping company
- `shipping_cost` - Fixed cost or -1 for phone determination
- `shipping_cost_type` - 'fixed' or 'phone'
- `shipping_min_days` - Minimum delivery days
- `shipping_max_days` - Maximum delivery days
- `pickup_enabled` - Enable branch pickup option
- `shipping_phone_message` - Message shown when cost determined by phone

### Implementation
- Main logic in `lib/store/shipping.ts`
- Functions: `getShippingSettings()`, `calculateShipping(subtotal)`
- Backward compatibility maintained via deprecated wrapper functions

### Branches & Pickup
- Customers can choose "pickup from branch" option
- Branch management via `/dashboard/branches`
- `SimpleBranchSelector` component for checkout
- Orders track `delivery_type` and `pickup_branch_id`

## Dynamic Homepage System

The application features a **fully dynamic homepage management system**:

### Architecture
1. **Hero Carousel** (`hero_slides` table)
   - Auto-rotating image carousel (configurable duration per slide)
   - Component: `app/components/homepage/HeroCarousel.tsx`
   - Admin page: `/dashboard/homepage/hero`

2. **Category Section** (`categories` table)
   - Displays product categories with images
   - Component: `app/components/homepage/CategoryGrid.tsx`
   - Managed through existing category system

3. **Dynamic Product Sections** (`homepage_sections` + `homepage_section_products` tables)
   - Flexible section types: products, categories, hero_carousel
   - Product sources: manual, best_sellers, new, deals, category-specific
   - Layout options: grid or slider
   - Component: `app/components/homepage/DynamicProductSection.tsx`
   - Admin page: `/dashboard/homepage/sections`

### Section Settings (JSONB)
```json
{
  "product_source": "best_sellers | new | deals | category | manual",
  "category_type": "electrical | plumbing | tools | other",
  "product_count": 8,
  "layout": "grid | slider",
  "columns": 4,
  "show_view_all": true
}
```

### Homepage Structure
The main page (`app/page.tsx`) fetches and renders sections dynamically:
1. Hero Carousel (if slides exist)
2. Category Section (if categories exist)
3. Dynamic Product Sections (based on `homepage_sections` table, sorted by `sort_order`)

### Admin Management
- Hero Carousel: `/dashboard/homepage/hero`
  - Add/edit/delete slides
  - Set duration, order, active status
  - Configure title, subtitle, CTA button

- Product Sections: `/dashboard/homepage/sections`
  - Create unlimited sections
  - Configure product source (auto or manual)
  - Set layout (grid/slider) and columns
  - Control visibility and order

### Database Setup
Apply `database-updates-homepage-v2.sql` to create required tables and triggers.

## Build Optimizations

- Modular imports for lucide-react icons
- External package optimization for Supabase
- Custom webpack configuration for client/server compatibility
- TypeScript strict mode enabled
- ESLint configured but ignored during builds for faster deployment