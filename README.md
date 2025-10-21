# Distraction Shop v2.0

[![Deploy to Vercel](https://github.com/hakeemmukif/distraction-shop-v2/actions/workflows/deploy.yml/badge.svg)](https://github.com/hakeemmukif/distraction-shop-v2/actions/workflows/deploy.yml)
[![CI](https://github.com/hakeemmukif/distraction-shop-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/hakeemmukif/distraction-shop-v2/actions/workflows/ci.yml)

Modern e-commerce platform for streetwear and skateboarding merchandise built with Next.js 14, TypeScript, and Stripe.

**🚀 Automatic Deployment:** Every push to `main` deploys to production. Every PR creates a preview deployment.

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

### Automated CI/CD Pipeline

This project uses **GitHub Actions** for automated deployment to Vercel:

- **Production:** Push to `main` → Automatic deployment to production
- **Preview:** Open PR → Automatic preview deployment with unique URL
- **Continuous Integration:** All branches run TypeScript, ESLint, and build checks

### Quick Setup

1. **Configure GitHub Secrets** (see [DEPLOYMENT.md](./DEPLOYMENT.md))
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - All environment variables

2. **Push to main:**
   ```bash
   git push origin main
   ```

3. **GitHub Actions will automatically:**
   - ✅ Run TypeScript type checking
   - ✅ Run ESLint
   - ✅ Build the project
   - 🚀 Deploy to Vercel
   - 💬 Comment deployment URL

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

📖 **Full deployment guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions, troubleshooting, and configuration.

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
