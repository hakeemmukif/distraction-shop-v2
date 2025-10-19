# Distraction Shop v2.0

Modern e-commerce platform for streetwear and skateboarding merchandise built with Next.js 14, TypeScript, and Stripe.

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes (Serverless)
- **Database:** PostgreSQL (Railway) with Prisma ORM
- **Payment:** Stripe API
- **Images:** Cloudinary CDN
- **Authentication:** JWT (httpOnly cookies)
- **Hosting:** Vercel

## Features

- Role-based admin panel (Admin & Superadmin)
- Product management without Stripe Dashboard access
- 3 images per product with Cloudinary optimization
- Size and stock management per product
- Secure authentication with bcrypt + JWT
- Stripe Checkout integration
- Category-based product filtering

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd distraction-shop-v2.0
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` - PostgreSQL connection string (Railway or local)
- `STRIPE_SECRET_KEY` - From Stripe Dashboard
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - From Stripe Dashboard
- `CLOUDINARY_*` - From Cloudinary account
- `RESEND_API_KEY` - For email notifications

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed superadmin user
npm run db:seed
```

**Default superadmin:**
- Email: `superadmin@distractionshop.com`
- Password: `ChangeMe123!`

⚠️ **Change password after first login!**

### 4. Run Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── admin/            # Admin panel
│   ├── superadmin/       # Superadmin panel
│   └── auth/             # Login page
├── lib/
│   ├── auth/             # Authentication
│   ├── stripe/           # Stripe integration
│   └── utils/            # Helper functions
└── components/           # React components
```

## API Endpoints

**Authentication:**
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

**Products (Public):**
- `GET /api/products?category=home` - Fetch products

**Products (Admin):**
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

## Deployment

### GitHub Setup

```bash
# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/distraction-shop-v2.0.git
git branch -M main
git push -u origin main
```

### Vercel Deployment

1. Import project from GitHub
2. Add environment variables
3. Deploy
4. Configure Stripe webhook: `https://yourdomain.com/api/stripe/webhook`

## Scripts

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run lint` - Lint code
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed superadmin user

## Security Features

- Bcrypt password hashing (cost: 12)
- JWT in httpOnly cookies
- CSRF protection (SameSite: strict)
- Server-side Stripe API calls only
- Role-based access control

---

Built with Claude Code
