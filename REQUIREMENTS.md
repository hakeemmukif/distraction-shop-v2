# Distraction Shop v2.0 - Technical Requirements Document

## Document Control
- **Version:** 2.0.0
- **Date:** 2025-10-12
- **Status:** Final - Ready for Implementation
- **Project:** Distraction Shop E-commerce Platform
- **Architecture:** Next.js 14 (App Router), Secure Backend API, Cloudinary CDN, Role-based Admin Panel

---

## 1. Executive Summary

### 1.1 Project Overview
Distraction Shop v2.0 is a secure, high-performance e-commerce platform for streetwear and skateboarding merchandise. The system features a customer-facing storefront, role-based admin panel for product management, and Stripe-powered checkout with comprehensive order tracking.

### 1.2 Key Improvements from v1.0
- **Security Hardening:** All Stripe API calls moved to secure backend (no secret keys in client)
- **Admin Panel:** Client can manage products without accessing Stripe Dashboard
- **Image Optimization:** Cloudinary CDN with automatic WebP/AVIF conversion
- **Role-Based Access:** Admin vs Superadmin permissions with JWT authentication
- **Database Integration:** User management with PostgreSQL (minimal, cost-effective)
- **Zero-Cost Architecture:** Optimized for free tiers, scales cheaply

### 1.3 Success Criteria
- Secure authentication system with role-based access control
- Admin can create/edit/delete products without touching Stripe Dashboard
- Product images optimized and served via Cloudinary CDN
- Page load times under 3 seconds (P95)
- Zero cost in development, <$30/month at scale
- Lighthouse scores: Performance >90, Security >95

---

## 2. System Architecture

### 2.1 Technology Stack

#### Frontend
- **Framework:** Next.js 14.2+ (React 18+, App Router)
- **Language:** TypeScript 5.0+
- **Styling:** Tailwind CSS 3.4+
- **Forms:** React Hook Form + Zod validation
- **State Management:** React Context API + localStorage
- **Image Rendering:** Next.js Image component + Cloudinary
- **UI Components:** Headless UI or shadcn/ui

#### Backend
- **Runtime:** Node.js 20+ (via Next.js)
- **API Framework:** Next.js API Routes (serverless functions)
- **Authentication:** NextAuth.js v5 (Credentials provider)
- **Validation:** Zod schemas
- **Password Hashing:** bcrypt
- **JWT:** jsonwebtoken (httpOnly cookies)

#### Database
- **Provider:** Railway PostgreSQL (Free tier: 512MB, 5GB bandwidth)
- **ORM:** Prisma 5.0+
- **Tables:** users, sessions (ONLY - products/orders in Stripe)
- **Migrations:** Prisma Migrate

#### External Services
- **Payment Processing:** Stripe API v2023-10-16
- **Image CDN:** Cloudinary (Free tier: 25GB storage, 25GB bandwidth)
- **Email Service:** Resend (Free tier: 3,000 emails/month)
- **Hosting:** Vercel (Free tier: 100GB bandwidth, unlimited sites)

#### Development Tools
- **Version Control:** Git + GitHub
- **Package Manager:** pnpm (faster than npm)
- **Code Quality:** ESLint + Prettier + TypeScript strict mode
- **Testing:** Vitest (unit) + Playwright (E2E)

### 2.2 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (Browser)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PUBLIC ROUTES (No Auth Required)                      │  │
│  │  / - Landing (entry/maintenance)                       │  │
│  │  /home - Homepage with products                        │  │
│  │  /shop - Distraction Shop                              │  │
│  │  /preloved - Preloved (Coming Soon)                    │  │
│  │  /skate - Skate Shop (Coming Soon)                     │  │
│  │  /terms - Policies                                     │  │
│  │  /contact - Contact Form                               │  │
│  │  /success - Order Confirmation                         │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PROTECTED ROUTES (JWT Required)                       │  │
│  │  /admin - Admin Panel (role: admin, superadmin)        │  │
│  │  /superadmin - Superadmin Panel (role: superadmin)     │  │
│  │  /auth/login - Login Page                              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              NEXT.JS SERVER (Vercel Edge/Serverless)          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PUBLIC API ROUTES (No Auth)                           │  │
│  │  GET  /api/products?category=home                      │  │
│  │  POST /api/checkout/create                             │  │
│  │  POST /api/stripe/webhook                              │  │
│  │  GET  /api/shop/status                                 │  │
│  │  POST /api/contact                                     │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  PROTECTED API ROUTES (JWT Middleware)                 │  │
│  │                                                         │  │
│  │  Admin + Superadmin:                                   │  │
│  │  POST   /api/admin/products                            │  │
│  │  PUT    /api/admin/products/:id                        │  │
│  │  DELETE /api/admin/products/:id                        │  │
│  │  POST   /api/admin/images/upload                       │  │
│  │                                                         │  │
│  │  Superadmin Only:                                      │  │
│  │  GET    /api/admin/orders                              │  │
│  │  POST   /api/admin/users                               │  │
│  │  DELETE /api/admin/users/:id                           │  │
│  │  PUT    /api/admin/settings/schedule                   │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  AUTH API ROUTES                                       │  │
│  │  POST /api/auth/login                                  │  │
│  │  POST /api/auth/logout                                 │  │
│  │  GET  /api/auth/me                                     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Railway     │  │ Stripe API   │  │ Cloudinary API   │   │
│  │ PostgreSQL  │  │              │  │                  │   │
│  │             │  │ - Products   │  │ - Image Upload   │   │
│  │ - users     │  │ - Prices     │  │ - Optimization   │   │
│  │ - sessions  │  │ - Checkout   │  │ - Transformations│   │
│  │             │  │ - Orders     │  │ - CDN Delivery   │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Security Architecture

#### Authentication Flow
```
User enters credentials → POST /api/auth/login
    ↓
Server validates email/password (bcrypt compare)
    ↓
Check user.role from database (admin | superadmin)
    ↓
Generate JWT token (includes: userId, email, role)
    ↓
Set httpOnly cookie (secure, sameSite: strict)
    ↓
Return user data (no password) to client
    ↓
Client stores in React Context
    ↓
Subsequent requests include cookie automatically
    ↓
Middleware verifies JWT on protected routes
```

#### Authorization Middleware
```typescript
// middleware.ts (Next.js Edge Middleware)
export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token');

  if (!token) return redirectToLogin();

  const user = await verifyJWT(token.value);
  if (!user) return redirectToLogin();

  // Check role-based access
  if (request.nextUrl.pathname.startsWith('/superadmin')) {
    if (user.role !== 'superadmin') return unauthorized();
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!['admin', 'superadmin'].includes(user.role)) return unauthorized();
  }

  return NextResponse.next();
}
```

#### API Route Protection
```typescript
// lib/auth/requireAuth.ts
export async function requireAuth(req: NextApiRequest, roles: string[] = []) {
  const token = req.cookies['auth-token'];

  if (!token) throw new UnauthorizedError();

  const user = await verifyJWT(token);
  if (!user) throw new UnauthorizedError();

  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}

// Usage in API route
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await requireAuth(req, ['superadmin']); // superadmin only
  // ... rest of handler
}
```

### 2.4 Data Flow Diagrams

#### Product Creation Flow
```
Admin Panel → "Add Product" Button
    ↓
Open Product Form Modal
    ↓
Admin uploads 3 images → Cloudinary Upload Widget (client-side)
    ↓
Cloudinary returns signed URLs:
  - image_1: https://res.cloudinary.com/.../front.jpg
  - image_2: https://res.cloudinary.com/.../back.jpg
  - image_3: https://res.cloudinary.com/.../alt.jpg
    ↓
Admin fills form:
  - Name: "Trainspotting Long Sleeve"
  - Price: 200 (RM)
  - Description: "Limited edition..."
  - Category: "home"
  - Sizes: [{ size: "S", stock: 10 }, { size: "M", stock: 15 }]
    ↓
Admin clicks "Create Product"
    ↓
POST /api/admin/products (JWT cookie included automatically)
    ↓
Middleware verifies JWT → user.role = 'admin' ✓
    ↓
API Route handler:
  1. Validate request body (Zod schema)
  2. Create Stripe Price object (RM 200)
  3. Create Stripe Product with metadata:
     {
       name: "Trainspotting Long Sleeve",
       description: "Limited edition...",
       default_price: price_id,
       metadata: {
         image_1: cloudinary_url_1,
         image_2: cloudinary_url_2,
         image_3: cloudinary_url_3,
         unit_label: "home",
         size_1: "S",
         size_1_stock: "10",
         size_2: "M",
         size_2_stock: "15"
       }
     }
    ↓
Stripe returns product object
    ↓
API responds: { success: true, product: {...} }
    ↓
Admin Panel shows success message
    ↓
Product list refreshes (fetches updated data)
    ↓
Storefront ISR revalidates after 60 seconds → product visible to customers
```

#### Customer Checkout Flow
```
Customer browses /home → ProductCard component
    ↓
ProductCard fetches data from ISR cache (GET /api/products?category=home)
    ↓
Customer selects size from dropdown (if product has sizes)
    ↓
Customer clicks "Add to Cart"
    ↓
Cart Context adds item to state + localStorage
    ↓
Cart icon updates (badge shows item count)
    ↓
Customer clicks Cart icon → CartModal opens
    ↓
Customer clicks "Checkout"
    ↓
POST /api/checkout/create
    body: { items: [{ productId, priceId, quantity, size }] }
    ↓
API Route (no auth required):
  1. Validate cart items
  2. Fetch product details from Stripe (verify prices, stock)
  3. Check stock availability per size
  4. Create Stripe Checkout Session:
     - line_items with size metadata
     - shipping_address_collection (Malaysia only)
     - success_url: /success?session_id={CHECKOUT_SESSION_ID}
     - cancel_url: /cart
    ↓
Stripe returns session.url
    ↓
API responds: { url: session.url }
    ↓
Client redirects to Stripe Checkout (stripe.com/pay/...)
    ↓
Customer enters payment details + shipping address
    ↓
Customer confirms payment
    ↓
Stripe processes payment
    ↓
Stripe sends webhook → POST /api/stripe/webhook
    Event: checkout.session.completed
    ↓
Webhook handler:
  1. Verify signature (Stripe webhook secret)
  2. Extract session data (customer, items, amount)
  3. Log to Vercel logs
  4. (Optional: Send confirmation email via Resend)
  5. Respond 200 OK to Stripe
    ↓
Stripe redirects customer → /success?session_id=xxx
    ↓
Success page fetches session details → displays order confirmation
    ↓
Order now visible in Superadmin panel (fetched from Stripe API)
```

---

## 3. Database Schema

### 3.1 ERD (Entity Relationship Diagram)

```
┌─────────────────────────────────────┐
│            users                    │
├─────────────────────────────────────┤
│ id              UUID PK             │
│ email           VARCHAR(255) UNIQUE │
│ password_hash   VARCHAR(255)        │
│ role            ENUM(admin, super)  │
│ created_at      TIMESTAMP           │
│ last_login      TIMESTAMP           │
│ created_by      UUID FK → users.id  │
└─────────────────────────────────────┘
            │
            │ 1:N
            ↓
┌─────────────────────────────────────┐
│           sessions                  │
├─────────────────────────────────────┤
│ id              UUID PK             │
│ user_id         UUID FK → users.id  │
│ token_hash      VARCHAR(255)        │
│ expires_at      TIMESTAMP           │
│ created_at      TIMESTAMP           │
└─────────────────────────────────────┘
```

### 3.2 Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  admin
  superadmin
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String    @map("password_hash")
  role          UserRole
  createdAt     DateTime  @default(now()) @map("created_at")
  lastLogin     DateTime? @map("last_login")
  createdBy     String?   @map("created_by")

  // Relations
  sessions      Session[]
  createdUsers  User[]    @relation("UserCreatedBy")
  creator       User?     @relation("UserCreatedBy", fields: [createdBy], references: [id])

  @@map("users")
}

model Session {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  tokenHash  String   @map("token_hash")
  expiresAt  DateTime @map("expires_at")
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([tokenHash])
  @@map("sessions")
}
```

### 3.3 Database Justification

**Why ONLY users and sessions?**

1. **Products → Stripe API:**
   - Stripe already stores: name, price, description, images, metadata
   - Duplicating in DB creates sync issues
   - Stripe API is fast enough (<200ms)
   - Stripe is source of truth for payments

2. **Orders → Stripe API:**
   - Stripe stores all order data (customer, items, shipping, payment status)
   - Webhook logs payment events (Vercel logs = free audit trail)
   - Superadmin views orders infrequently (API call acceptable)
   - Avoids GDPR complexity (Stripe handles compliance)

3. **Images → Cloudinary:**
   - Cloudinary stores images with optimizations
   - URLs stored in Stripe product metadata
   - No need for separate image table

4. **Customers → Stripe:**
   - Stripe Checkout creates customer records
   - Includes email, shipping address
   - No need for duplicate customer table

**Database Cost Analysis:**
```
Users table: ~50 users × 500 bytes = 25KB
Sessions table: ~50 sessions × 300 bytes = 15KB
Total: ~40KB << 512MB (Railway free tier)

Estimated usage: <1% of free tier capacity
Conclusion: Database will NEVER hit free tier limits
```

---

## 4. API Specifications

### 4.1 Public API Routes (No Authentication)

#### GET /api/products
**Description:** Fetch products by category

**Query Parameters:**
- `category` (required): `home` | `skate_shop` | `preloved`
- `limit` (optional): Number of products (default: 50)

**Response (200 OK):**
```typescript
{
  products: [
    {
      id: "prod_xxx",
      name: "Trainspotting Graffiti Long Sleeve",
      description: "Limited edition streetwear",
      price: 20000, // cents (RM 200)
      currency: "myr",
      images: [
        "https://res.cloudinary.com/.../front.jpg",
        "https://res.cloudinary.com/.../back.jpg",
        "https://res.cloudinary.com/.../alt.jpg"
      ],
      sizes: [
        { label: "S", stock: 10, available: true },
        { label: "M", stock: 0, available: false },
        { label: "L", stock: 5, available: true }
      ],
      category: "home"
    }
  ],
  total: 15
}
```

**Error Response (500):**
```typescript
{
  error: "Failed to fetch products",
  message: "Stripe API error: [details]"
}
```

---

#### POST /api/checkout/create
**Description:** Create Stripe Checkout Session

**Request Body:**
```typescript
{
  items: [
    {
      productId: "prod_xxx",
      priceId: "price_xxx",
      quantity: 1,
      size: "M" // optional, null if no size
    }
  ]
}
```

**Validation:**
- All items must have valid productId and priceId
- Stock must be available for selected size
- Quantity must be > 0 and <= available stock

**Response (200 OK):**
```typescript
{
  sessionId: "cs_test_xxx",
  url: "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

**Error Response (400):**
```typescript
{
  error: "Invalid cart items",
  details: [
    { productId: "prod_xxx", issue: "Size M out of stock" }
  ]
}
```

---

#### POST /api/stripe/webhook
**Description:** Handle Stripe webhook events

**Headers:**
- `stripe-signature`: Webhook signature (required)

**Request Body:** Stripe event object (JSON)

**Handled Events:**
1. `checkout.session.completed`: Log successful order
2. `payment_intent.succeeded`: Payment confirmed
3. `payment_intent.payment_failed`: Payment failed

**Response (200 OK):**
```typescript
{
  received: true
}
```

**Error Response (400):**
```typescript
{
  error: "Webhook signature verification failed"
}
```

---

#### GET /api/shop/status
**Description:** Check if shop is currently open/closed

**Response (200 OK):**
```typescript
{
  isOpen: true,
  message: "Shop is open",
  nextStatusChange: "2025-10-12T18:00:00+08:00",
  currentTime: "2025-10-12T14:30:00+08:00",
  schedule: {
    monday: { open: "10:00", close: "18:00" },
    // ... other days
  }
}
```

---

#### POST /api/contact
**Description:** Send contact form email

**Request Body:**
```typescript
{
  name: string,      // required, max 100 chars
  email: string,     // required, valid email
  message: string    // required, max 1000 chars
}
```

**Rate Limit:** 5 requests per email per hour

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Thanks for reaching out! We'll get back to you soon."
}
```

**Error Response (429):**
```typescript
{
  error: "Too many requests. Please try again in 60 minutes."
}
```

---

### 4.2 Protected API Routes (Authentication Required)

#### POST /api/admin/products
**Description:** Create new product
**Auth:** JWT required, roles: [`admin`, `superadmin`]

**Request Body:**
```typescript
{
  name: string,                    // required
  description: string,             // optional
  price: number,                   // required, in RM (e.g., 200)
  currency: "myr",
  images: {
    image_1: string,               // Cloudinary URL
    image_2: string,               // Cloudinary URL
    image_3: string                // Cloudinary URL
  },
  category: "home" | "skate_shop" | "preloved",
  sizes: [                         // optional, empty array if no sizes
    { size: "S", stock: 10 },
    { size: "M", stock: 15 }
  ]
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  product: {
    id: "prod_xxx",
    name: "Product Name",
    // ... full product object
  }
}
```

**Error Response (403):**
```typescript
{
  error: "Forbidden",
  message: "Insufficient permissions"
}
```

---

#### PUT /api/admin/products/:id
**Description:** Update existing product
**Auth:** JWT required, roles: [`admin`, `superadmin`]

**Request Body:** Same as POST /api/admin/products (all fields optional)

**Response (200 OK):**
```typescript
{
  success: true,
  product: { /* updated product */ }
}
```

---

#### DELETE /api/admin/products/:id
**Description:** Delete product
**Auth:** JWT required, roles: [`admin`, `superadmin`]

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Product deleted successfully"
}
```

---

#### POST /api/admin/images/upload
**Description:** Upload image to Cloudinary (server-side upload)
**Auth:** JWT required, roles: [`admin`, `superadmin`]

**Request Body (multipart/form-data):**
```typescript
{
  file: File // max 5MB, jpg/png/webp
}
```

**Response (200 OK):**
```typescript
{
  url: "https://res.cloudinary.com/.../image.jpg",
  publicId: "distraction/product_xxx",
  width: 1200,
  height: 1200
}
```

---

#### GET /api/admin/orders
**Description:** Fetch orders from Stripe API
**Auth:** JWT required, roles: [`superadmin`] ONLY

**Query Parameters:**
- `limit` (optional): Number of orders (default: 50)
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response (200 OK):**
```typescript
{
  orders: [
    {
      id: "cs_xxx",
      customer: {
        email: "customer@example.com",
        name: "John Doe"
      },
      items: [
        {
          name: "Product Name - Size M",
          quantity: 1,
          price: 20000
        }
      ],
      total: 20000,
      currency: "myr",
      status: "paid",
      shipping: {
        address: {
          line1: "123 Main St",
          city: "Kuala Lumpur",
          postal_code: "50000",
          country: "MY"
        }
      },
      createdAt: "2025-10-12T10:30:00Z"
    }
  ],
  total: 150,
  hasMore: true
}
```

---

#### POST /api/admin/users
**Description:** Create new admin user
**Auth:** JWT required, roles: [`superadmin`] ONLY

**Request Body:**
```typescript
{
  email: string,      // required, valid email
  password: string,   // required, min 8 chars
  role: "admin"       // cannot create superadmin via API
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  user: {
    id: "uuid",
    email: "admin@example.com",
    role: "admin",
    createdAt: "2025-10-12T10:30:00Z"
  }
}
```

---

#### DELETE /api/admin/users/:id
**Description:** Delete admin user
**Auth:** JWT required, roles: [`superadmin`] ONLY

**Response (200 OK):**
```typescript
{
  success: true,
  message: "User deleted successfully"
}
```

---

#### PUT /api/admin/settings/schedule
**Description:** Update shop schedule
**Auth:** JWT required, roles: [`superadmin`] ONLY

**Request Body:**
```typescript
{
  schedule: {
    monday: { open: "10:00", close: "18:00" },
    tuesday: { open: "10:00", close: "18:00" },
    wednesday: { open: "10:00", close: "18:00" },
    thursday: { open: "10:00", close: "18:00" },
    friday: { open: "10:00", close: "18:00" },
    saturday: { open: "11:00", close: "17:00" },
    sunday: { closed: true }
  },
  timezone: "Asia/Kuala_Lumpur"
}
```

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Schedule updated successfully"
}
```

---

### 4.3 Authentication API Routes

#### POST /api/auth/login
**Description:** Login and create session

**Request Body:**
```typescript
{
  email: string,
  password: string
}
```

**Response (200 OK):**
```typescript
{
  user: {
    id: "uuid",
    email: "admin@example.com",
    role: "admin"
  },
  // Cookie set automatically: auth-token (httpOnly, secure, sameSite: strict)
}
```

**Error Response (401):**
```typescript
{
  error: "Invalid credentials"
}
```

---

#### POST /api/auth/logout
**Description:** Logout and destroy session

**Response (200 OK):**
```typescript
{
  success: true,
  message: "Logged out successfully"
}
```

---

#### GET /api/auth/me
**Description:** Get current user from JWT

**Response (200 OK):**
```typescript
{
  user: {
    id: "uuid",
    email: "admin@example.com",
    role: "admin",
    lastLogin: "2025-10-12T10:30:00Z"
  }
}
```

**Error Response (401):**
```typescript
{
  error: "Not authenticated"
}
```

---

## 5. Functional Requirements

### 5.1 Shop State Management

#### FR-1: Scheduled Shop Open/Closed Status
- **Priority:** HIGH
- **Description:** System automatically determines shop status based on configured schedule
- **Acceptance Criteria:**
  - Schedule stored in Vercel Environment Variable or Edge Config
  - API endpoint `/api/shop/status` returns current status
  - Landing page checks status on load
  - Closed state shows maintenance door image
  - Open state shows entry door with hover unlock effect
  - Superadmin can override status (emergency closure)

**Configuration Format:**
```json
{
  "timezone": "Asia/Kuala_Lumpur",
  "schedule": {
    "monday": { "open": "10:00", "close": "18:00" },
    "tuesday": { "open": "10:00", "close": "18:00" },
    "wednesday": { "open": "10:00", "close": "18:00" },
    "thursday": { "open": "10:00", "close": "18:00" },
    "friday": { "open": "10:00", "close": "18:00" },
    "saturday": { "open": "11:00", "close": "17:00" },
    "sunday": { "closed": true }
  },
  "overrideStatus": null
}
```

---

### 5.2 Product Management

#### FR-2: Admin Product Creation (No Stripe Dashboard Access)
- **Priority:** CRITICAL
- **Description:** Admin can create products entirely through admin panel
- **Acceptance Criteria:**
  - Admin panel form with all product fields
  - Cloudinary upload widget for 3 images
  - Size/stock management (dynamic size fields)
  - Category selection (home, preloved, skate_shop)
  - Real-time validation (Zod schema)
  - Success/error feedback
  - Product appears in storefront within 60 seconds (ISR revalidation)

**Admin Product Form Fields:**
```typescript
{
  name: string,              // required, max 100 chars
  description: string,       // optional, max 500 chars
  price: number,             // required, min 1 RM
  category: enum,            // required, home/preloved/skate_shop
  images: {
    image_1: string,         // required, Cloudinary URL
    image_2: string,         // required, Cloudinary URL
    image_3: string          // required, Cloudinary URL
  },
  sizes: [                   // optional, can be empty
    { size: string, stock: number }
  ]
}
```

---

#### FR-3: Product Image Upload via Cloudinary
- **Priority:** HIGH
- **Description:** Admin uploads product images to Cloudinary CDN
- **Acceptance Criteria:**
  - Cloudinary Upload Widget integrated in admin panel
  - Support for 3 images per product (front, back, alternate)
  - Image validation: max 5MB, formats: jpg, png, webp
  - Automatic optimization (Cloudinary auto-format, auto-quality)
  - Preview images before save
  - URLs stored in Stripe product metadata (image_1, image_2, image_3)

**Cloudinary Configuration:**
```javascript
{
  cloudName: "distraction-shop",
  uploadPreset: "product_images", // unsigned preset
  folder: "products",
  clientAllowedFormats: ["jpg", "png", "webp"],
  maxFileSize: 5242880, // 5MB
  maxFiles: 3,
  cropping: true,
  croppingAspectRatio: 1, // square images
  showSkipCropButton: false
}
```

---

#### FR-4: Product Editing and Stock Management
- **Priority:** HIGH
- **Description:** Admin can edit products and update stock quantities
- **Acceptance Criteria:**
  - Edit form pre-populated with existing data
  - Can replace any of the 3 images
  - Can add/remove sizes
  - Can update stock quantities per size
  - Can change category (moves product between pages)
  - Validation same as creation
  - Changes reflect immediately in admin panel
  - Storefront updates within 60 seconds (ISR)

---

#### FR-5: Product Display with 3 Images
- **Priority:** HIGH
- **Description:** Storefront displays products with optimized images
- **Acceptance Criteria:**
  - ProductCard shows image_1 by default
  - Hover shows image_2 (back view)
  - Product detail page shows all 3 images (carousel or grid)
  - Images loaded via Cloudinary CDN (f_auto, q_auto)
  - Next.js Image component for optimization
  - Lazy loading below the fold
  - Responsive images (mobile: 400px, desktop: 800px)

**Image Rendering:**
```jsx
// ProductCard.tsx
<Image
  src={`${product.images.image_1}?f_auto,q_auto,w_400`}
  alt={product.name}
  width={400}
  height={400}
  loading="lazy"
  onMouseEnter={() => setHoverImage(product.images.image_2)}
  onMouseLeave={() => setHoverImage(product.images.image_1)}
/>
```

---

#### FR-6: Size and Stock Management
- **Priority:** HIGH
- **Description:** Products with sizes display dropdown, track stock per size
- **Acceptance Criteria:**
  - Products with sizes: dropdown before "Add to Cart"
  - Out-of-stock sizes disabled (greyed out, not selectable)
  - Products without sizes: direct "Add to Cart" button
  - Stock validation on checkout (prevent overselling)
  - Admin panel shows stock levels per size (color-coded: green >10, yellow 5-10, red <5)

**Stock Display Logic:**
```typescript
// Size dropdown item
{
  label: "M",
  stock: 3,
  available: true,
  displayText: "M (Only 3 left)" // if stock < 5
}

// Out of stock
{
  label: "L",
  stock: 0,
  available: false,
  displayText: "L (Sold out)"
}
```

---

### 5.3 Shopping Cart and Checkout

#### FR-7: Cart Persistence and Management
- **Priority:** CRITICAL
- **Description:** Cart persists across sessions in localStorage
- **Acceptance Criteria:**
  - Cart stored in localStorage (key: `distraction-cart`)
  - Cart icon shows item count badge
  - Cart modal/drawer shows items with images, size, price
  - Quantity controls (+/- buttons)
  - Remove item button
  - Subtotal calculation
  - "Free shipping in Malaysia" displayed
  - Cart survives page refresh and browser close/reopen

**Cart Data Structure:**
```typescript
// localStorage: distraction-cart
{
  items: [
    {
      productId: "prod_xxx",
      priceId: "price_xxx",
      name: "Trainspotting Long Sleeve",
      price: 20000, // cents
      size: "M", // null if no size
      quantity: 1,
      image: "https://res.cloudinary.com/.../front.jpg"
    }
  ],
  lastUpdated: "2025-10-12T10:30:00Z"
}
```

---

#### FR-8: Stripe Checkout Integration
- **Priority:** CRITICAL
- **Description:** Secure checkout via Stripe Checkout
- **Acceptance Criteria:**
  - "Checkout" button creates Stripe Checkout Session
  - Redirects to Stripe-hosted checkout page
  - Checkout supports: Credit/debit cards, FPX (Malaysian bank transfer)
  - Shipping address restricted to Malaysia only
  - Success: Redirect to `/success?session_id=xxx`
  - Cancel: Redirect to `/cart` (cart preserved)
  - Order details include size metadata

**Checkout Session Config:**
```typescript
{
  mode: 'payment',
  payment_method_types: ['card', 'fpx'],
  line_items: [
    {
      price_data: {
        currency: 'myr',
        product_data: {
          name: 'Trainspotting Long Sleeve - Size M',
          images: [cloudinaryUrl],
          metadata: { size: 'M' }
        },
        unit_amount: 20000
      },
      quantity: 1
    }
  ],
  shipping_address_collection: {
    allowed_countries: ['MY']
  },
  shipping_options: [
    {
      shipping_rate_data: {
        display_name: 'Free Shipping',
        type: 'fixed_amount',
        fixed_amount: { amount: 0, currency: 'myr' }
      }
    }
  ],
  success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/cart`
}
```

---

#### FR-9: Webhook Event Processing
- **Priority:** HIGH
- **Description:** Process Stripe webhook events securely
- **Acceptance Criteria:**
  - Webhook endpoint `/api/stripe/webhook` configured in Stripe Dashboard
  - Signature verification (STRIPE_WEBHOOK_SECRET)
  - Handle `checkout.session.completed` event
  - Log order details to Vercel logs
  - Optional: Send order confirmation email (Resend)
  - Respond 200 OK to Stripe (acknowledge receipt)

**Webhook Event Handler:**
```typescript
const event = stripe.webhooks.constructEvent(
  req.body,
  req.headers['stripe-signature'],
  process.env.STRIPE_WEBHOOK_SECRET
);

if (event.type === 'checkout.session.completed') {
  const session = event.data.object;

  console.log('Order completed:', {
    sessionId: session.id,
    customer: session.customer_details.email,
    total: session.amount_total,
    items: session.line_items
  });

  // Optional: Send email
  await resend.emails.send({
    to: session.customer_details.email,
    subject: 'Order Confirmation - Distraction Shop',
    html: renderOrderConfirmationEmail(session)
  });
}
```

---

### 5.4 Admin Panel (Role: Admin + Superadmin)

#### FR-10: Admin Dashboard
- **Priority:** HIGH
- **Description:** Admin panel for product management
- **Acceptance Criteria:**
  - Protected route `/admin` (JWT required)
  - Redirects to login if not authenticated
  - Sidebar navigation: Products, Images, Logout
  - Product list with filters (category, search)
  - Quick actions: Edit, Delete, Duplicate
  - Responsive layout (works on tablet, desktop)

**Admin Panel Layout:**
```
┌────────────────────────────────────────────────────┐
│  [LOGO]  Distraction Admin Panel    [User] [Logout]│
├────────┬───────────────────────────────────────────┤
│        │  Products (Home) - 15 items               │
│ • Home │  ┌────────────────────────────────────┐  │
│ • Shop │  │ [+ Add Product]  [Search: ___]     │  │
│ • Pre  │  └────────────────────────────────────┘  │
│ • Skate│                                           │
│        │  ┌─────────────────────────────────────┐ │
│ Images │  │ [Image] Trainspotting Long Sleeve   │ │
│        │  │ RM 200 | Sizes: S(10), M(0), L(5)   │ │
│ Logout │  │ [Edit] [Delete]                     │ │
│        │  └─────────────────────────────────────┘ │
│        │  ┌─────────────────────────────────────┐ │
│        │  │ [Image] Distraction Mug             │ │
│        │  │ RM 50 | No sizes | Stock: 20        │ │
│        │  │ [Edit] [Delete]                     │ │
│        │  └─────────────────────────────────────┘ │
└────────┴───────────────────────────────────────────┘
```

---

#### FR-11: Product Creation Form
- **Priority:** CRITICAL
- **Description:** Form to create products without Stripe Dashboard
- **Acceptance Criteria:**
  - Modal or full-page form
  - Cloudinary Upload Widget for 3 images (opens on "Upload Images" button)
  - Image previews after upload
  - All fields validated (real-time with Zod)
  - Dynamic size fields (Add Size button, Remove Size button)
  - Submit creates product via `/api/admin/products`
  - Loading state during submission
  - Success: Close form, refresh product list, show toast
  - Error: Display error message, keep form open

**Form Validation Rules:**
```typescript
const productSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  price: z.number().min(1).max(100000),
  category: z.enum(['home', 'skate_shop', 'preloved']),
  images: z.object({
    image_1: z.string().url(),
    image_2: z.string().url(),
    image_3: z.string().url()
  }),
  sizes: z.array(
    z.object({
      size: z.string().min(1),
      stock: z.number().min(0).max(9999)
    })
  ).optional()
});
```

---

### 5.5 Superadmin Panel (Role: Superadmin Only)

#### FR-12: Order Management
- **Priority:** MEDIUM
- **Description:** View and manage orders from Stripe
- **Acceptance Criteria:**
  - Orders fetched from Stripe API on page load
  - Display: Order ID, Customer email, Total, Status, Date
  - Expandable rows show full order details (items, shipping address)
  - Search by customer email or order ID
  - Filter by date range, status (paid, failed)
  - Export to CSV button
  - Pagination (50 orders per page)

**Order List Display:**
```
┌─────────────────────────────────────────────────────────┐
│ Orders (150 total)  [Search: ___] [Export CSV]         │
├─────────────────────────────────────────────────────────┤
│ ID         Customer           Total    Status   Date    │
├─────────────────────────────────────────────────────────┤
│ cs_xxx     john@example.com   RM 200   Paid     Oct 12 │
│ [▼] Items: Trainspotting Long Sleeve (M) × 1           │
│     Ship to: 123 Main St, Kuala Lumpur, 50000          │
├─────────────────────────────────────────────────────────┤
│ cs_yyy     jane@example.com   RM 50    Paid     Oct 11 │
│ [▶]                                                     │
└─────────────────────────────────────────────────────────┘
```

---

#### FR-13: User Management
- **Priority:** MEDIUM
- **Description:** Create and manage admin users
- **Acceptance Criteria:**
  - List all admin users (email, role, created date, last login)
  - "Create Admin" button opens form
  - Form fields: email, password (min 8 chars)
  - New admins have role = 'admin' (cannot create superadmin)
  - Delete admin button (with confirmation modal)
  - Cannot delete yourself
  - Cannot delete other superadmins

**User List:**
```
┌───────────────────────────────────────────────────┐
│ Admin Users (5)  [+ Create Admin]                │
├───────────────────────────────────────────────────┤
│ Email              Role        Last Login  Action│
├───────────────────────────────────────────────────┤
│ you@example.com    superadmin  Oct 12     [You] │
│ admin@example.com  admin       Oct 10     [Del] │
│ staff@example.com  admin       Never      [Del] │
└───────────────────────────────────────────────────┘
```

---

#### FR-14: Shop Settings
- **Priority:** LOW
- **Description:** Configure shop-wide settings
- **Acceptance Criteria:**
  - Edit shop schedule (weekly hours)
  - Emergency closure toggle (overrides schedule)
  - Edit contact email for notifications
  - Edit terms and policies (Terms page content)
  - Save settings (stores in Vercel Edge Config or environment variables)

---

### 5.6 Navigation and Pages

#### FR-15: Main Navigation
- **Priority:** HIGH
- **Description:** Consistent header navigation across storefront
- **Acceptance Criteria:**
  - Header component on all pages (except landing/entry)
  - Logo top-left (links to homepage)
  - Nav links: Home, Distraction SHOP, Preloved, Skate Shop, Terms, Contact
  - "Preloved" and "Skate Shop" show "Coming Soon" page/modal
  - Search icon (future feature, not v1.0)
  - Cart icon with item count badge
  - Responsive: Mobile hamburger menu
  - Sticky header on scroll

---

#### FR-16: Homepage with Video
- **Priority:** HIGH
- **Description:** Main landing page with promo video
- **Acceptance Criteria:**
  - Mug promo video at top (autoplay, muted, loop)
  - Video fallback: Poster image if autoplay blocked
  - Scroll down to product grid (category: home)
  - Product grid: 4 columns desktop, 2 tablet, 1 mobile
  - Graffiti font headings
  - White background

---

#### FR-17: Terms and Contact Pages
- **Priority:** MEDIUM
- **Description:** Static pages for policies and contact
- **Acceptance Criteria:**
  - Terms page: Return policy, Shipping policy (static content)
  - Contact page: Form with name, email, message
  - Contact form submits to `/api/contact`
  - Contact form sends email via Resend
  - Success/error messages
  - Rate limiting (5 submissions per email per hour)

---

## 6. Non-Functional Requirements

### 6.1 Performance

#### NFR-1: Page Load Time
- **Target:** < 3 seconds First Contentful Paint (FCP) on 4G
- **Measurement:** Lighthouse CI on every deploy
- **Strategy:**
  - Next.js App Router with automatic code splitting
  - ISR for product pages (60-second revalidation)
  - Static generation for Terms page
  - Cloudinary automatic image optimization
  - Bundle size < 200KB gzipped

#### NFR-2: Lighthouse Scores
- **Targets:**
  - Performance: > 90
  - Accessibility: > 95
  - Best Practices: > 90
  - SEO: > 90

#### NFR-3: Image Optimization
- **Requirements:**
  - All images served via Cloudinary CDN
  - Automatic format conversion (WebP/AVIF)
  - Responsive images (srcset for mobile/desktop)
  - Lazy loading below the fold
  - Max image size: 150KB optimized (from 500KB original)

---

### 6.2 Security

#### NFR-4: Authentication Security
- **Requirements:**
  - Passwords hashed with bcrypt (cost factor: 12)
  - JWT tokens in httpOnly cookies (cannot be accessed by JavaScript)
  - CSRF protection (SameSite: strict)
  - Token expiration: 7 days
  - Session cleanup: Delete expired sessions daily

#### NFR-5: API Security
- **Requirements:**
  - All Stripe API calls server-side only (secret keys never in client)
  - Webhook signature verification (Stripe webhook secret)
  - Rate limiting: 100 requests per IP per minute (Vercel Edge Middleware)
  - Input validation: Zod schemas on all API routes
  - No sensitive data in error messages (production)

#### NFR-6: Role-Based Access Control
- **Requirements:**
  - Middleware enforces role checks on protected routes
  - Admin cannot access superadmin routes (403 Forbidden)
  - JWT includes role claim (verified on every request)
  - Audit log: Track who created/deleted products (future enhancement)

---

### 6.3 Scalability

#### NFR-7: Free Tier Limits
- **Vercel:**
  - Bandwidth: 100GB/month (free tier)
  - Serverless function executions: 100GB-hours/month
  - Build minutes: 6,000/month
- **Cloudinary:**
  - Storage: 25GB
  - Bandwidth: 25GB/month
  - Transformations: 25,000/month
- **Railway:**
  - Database: 512MB storage
  - Bandwidth: 5GB/month
  - Uptime: 500 hours/month

**Scaling Plan:**
- Monitor Vercel Analytics for bandwidth usage
- If exceeding free tier:
  - Vercel Pro: $20/month (1TB bandwidth)
  - Cloudinary Advanced: $99/month (if >25GB bandwidth)
  - Railway Starter: $5/month (if >512MB DB)

#### NFR-8: Database Performance
- **Requirements:**
  - User table: Index on email (login queries)
  - Session table: Index on userId and tokenHash
  - Compound index on userId + expiresAt (cleanup queries)
  - Connection pooling: Max 10 connections (Railway free tier)

---

### 6.4 Reliability

#### NFR-9: Uptime
- **Target:** 99.9% uptime (Vercel SLA)
- **Monitoring:**
  - Vercel Analytics (built-in)
  - External uptime monitoring (UptimeRobot free tier)
  - Alert on downtime > 5 minutes

#### NFR-10: Error Handling
- **Requirements:**
  - All API routes wrapped in try-catch
  - User-friendly error messages (no stack traces in production)
  - React Error Boundaries for UI errors
  - Automatic retry for transient Stripe API errors (exponential backoff)
  - Fallback UI for failed image loads

#### NFR-11: Data Integrity
- **Requirements:**
  - Stripe is source of truth for products and orders
  - No product data duplication in database
  - Webhook idempotency (log event IDs, prevent duplicate processing)
  - Cart validation on checkout (check stock before creating Stripe session)

---

### 6.5 Maintainability

#### NFR-12: Code Quality
- **Standards:**
  - TypeScript strict mode enabled
  - ESLint with recommended rules + Next.js rules
  - Prettier for consistent formatting
  - Pre-commit hooks (lint + typecheck)
  - Component structure: Atomic design principles

#### NFR-13: Documentation
- **Required Docs:**
  - README.md: Setup instructions, environment variables, deployment
  - DEVELOPMENT_LOG.md: Change history (per project CLAUDE.md rules)
  - API_DOCS.md: API endpoint specifications (auto-generated from OpenAPI)
  - DEPLOYMENT.md: Deployment checklist and rollback procedures

---

## 7. User Stories

### Epic 1: Shop Access

**US-1.1:** As a customer, I want to see if the shop is open before browsing, so I know when I can purchase.
- **AC:** Landing page shows maintenance door if closed
- **AC:** Entry door with hover unlock effect if open
- **AC:** Status based on configured schedule

**US-1.2:** As a shop owner, I want to schedule shop hours, so the shop automatically opens/closes.
- **AC:** Superadmin can set weekly schedule in settings
- **AC:** Superadmin can toggle emergency closure
- **AC:** Changes take effect immediately

---

### Epic 2: Product Management (Admin)

**US-2.1:** As an admin, I want to add products without Stripe Dashboard access, so I can manage inventory independently.
- **AC:** Admin panel has "Add Product" form
- **AC:** Upload 3 images via Cloudinary widget
- **AC:** Set name, price, description, category, sizes, stock
- **AC:** Product appears on storefront within 60 seconds

**US-2.2:** As an admin, I want to edit products, so I can update prices and stock.
- **AC:** Edit form pre-filled with existing data
- **AC:** Can update any field including images
- **AC:** Changes save to Stripe metadata
- **AC:** Storefront updates automatically

**US-2.3:** As an admin, I want to delete products, so I can remove discontinued items.
- **AC:** Delete button with confirmation modal
- **AC:** Product removed from Stripe
- **AC:** Product removed from storefront immediately

---

### Epic 3: Shopping (Customer)

**US-3.1:** As a customer, I want to browse products with clear images, so I can see what I'm buying.
- **AC:** Product card shows front image
- **AC:** Hover shows back image
- **AC:** Product detail shows all 3 images
- **AC:** Images load quickly (Cloudinary CDN)

**US-3.2:** As a customer, I want to select my size before adding to cart, so I get the right fit.
- **AC:** Size dropdown appears if product has sizes
- **AC:** Out-of-stock sizes disabled
- **AC:** Selected size shown in cart

**US-3.3:** As a customer, I want my cart to persist, so I can continue shopping later.
- **AC:** Cart stored in localStorage
- **AC:** Cart survives page refresh
- **AC:** Cart icon shows item count

**US-3.4:** As a customer, I want a secure checkout, so my payment is safe.
- **AC:** Stripe Checkout hosted page
- **AC:** Supports cards and FPX
- **AC:** Shipping restricted to Malaysia
- **AC:** Order confirmation on success

---

### Epic 4: Order Management (Superadmin)

**US-4.1:** As a superadmin, I want to view all orders, so I can fulfill them.
- **AC:** Orders page fetches from Stripe API
- **AC:** Shows customer email, items, total, status
- **AC:** Search and filter by date, status
- **AC:** Export to CSV

**US-4.2:** As a superadmin, I want to create admin accounts, so others can help manage products.
- **AC:** User management page
- **AC:** Create admin form (email, password)
- **AC:** Admin has limited access (no orders, no settings)
- **AC:** Can delete admin accounts

---

## 8. Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Next.js 14 project setup with TypeScript
- [ ] Tailwind CSS configuration
- [ ] Database setup (Railway PostgreSQL + Prisma)
- [ ] Environment variables configuration
- [ ] Git repository and branch strategy

### Phase 2: Authentication (Week 1-2)
- [ ] User schema and migrations
- [ ] NextAuth.js configuration
- [ ] Login page UI
- [ ] JWT middleware for protected routes
- [ ] Role-based access control

### Phase 3: Admin Panel - Product Management (Week 2-3)
- [ ] Admin dashboard layout
- [ ] Cloudinary integration and upload widget
- [ ] Product creation form
- [ ] Product list with filters
- [ ] Product edit and delete functionality
- [ ] API routes: `/api/admin/products/*`

### Phase 4: Storefront (Week 3-4)
- [ ] Landing page (entry/maintenance)
- [ ] Shop status API (`/api/shop/status`)
- [ ] Homepage with video and product grid
- [ ] Product card component (3 images, hover effect)
- [ ] Product detail page
- [ ] Navigation header and footer

### Phase 5: Shopping Cart (Week 4)
- [ ] Cart context and localStorage
- [ ] Add to cart functionality
- [ ] Cart modal/drawer UI
- [ ] Size selector component
- [ ] Stock validation

### Phase 6: Checkout (Week 5)
- [ ] Stripe Checkout Session creation
- [ ] Checkout API route (`/api/checkout/create`)
- [ ] Webhook endpoint (`/api/stripe/webhook`)
- [ ] Success page
- [ ] Order confirmation email (Resend)

### Phase 7: Superadmin Features (Week 5-6)
- [ ] Order management page
- [ ] Fetch orders from Stripe API
- [ ] User management (create/delete admins)
- [ ] Shop settings (schedule configuration)
- [ ] Analytics dashboard (future)

### Phase 8: Polish and Testing (Week 6-7)
- [ ] Responsive design testing (mobile, tablet, desktop)
- [ ] Lighthouse performance optimization
- [ ] E2E tests (Playwright)
- [ ] Security audit (dependency scan, XSS, CSRF)
- [ ] Error handling and user feedback
- [ ] Documentation (README, API docs)

### Phase 9: Deployment (Week 7)
- [ ] Vercel production deployment
- [ ] Domain configuration (distractionshop.com)
- [ ] Stripe webhook configuration (production)
- [ ] Environment variables setup (production)
- [ ] SSL verification
- [ ] Final testing in production

---

## 9. Deployment Strategy

### 9.1 Development Environment

**Setup:**
```bash
# Clone repository
git clone https://github.com/yourorg/distraction-shop-v2.0.git
cd distraction-shop-v2.0

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Setup database
npx prisma migrate dev
npx prisma generate

# Seed superadmin user
pnpm run seed

# Start development server
pnpm dev
```

**Environment Variables (.env.local):**
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/distraction_dev"

# Stripe (Test Mode)
STRIPE_SECRET_KEY="sk_test_xxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="distraction-shop"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="product_images"
CLOUDINARY_API_KEY="xxx"
CLOUDINARY_API_SECRET="xxx"

# Email
RESEND_API_KEY="re_xxx"

# Auth
NEXTAUTH_SECRET="generate-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_URL="http://localhost:3000"
NODE_ENV="development"
```

---

### 9.2 Production Deployment (Vercel)

**Prerequisites:**
- Domain: distractionshop.com (DNS configured)
- Stripe Production account
- Railway Production database
- Cloudinary Production account

**Deployment Steps:**

1. **Push to GitHub main branch**
   ```bash
   git push origin main
   ```

2. **Vercel automatically deploys**
   - Build command: `pnpm build`
   - Output directory: `.next`
   - Deployment time: ~2-3 minutes

3. **Configure Environment Variables in Vercel Dashboard**
   ```env
   DATABASE_URL="postgresql://..." (Railway production URL)
   STRIPE_SECRET_KEY="sk_live_xxx"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_xxx"
   STRIPE_WEBHOOK_SECRET="whsec_xxx"
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="distraction-shop"
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="product_images"
   CLOUDINARY_API_KEY="xxx"
   CLOUDINARY_API_SECRET="xxx"
   RESEND_API_KEY="re_xxx"
   NEXTAUTH_SECRET="production-secret"
   NEXTAUTH_URL="https://distractionshop.com"
   NEXT_PUBLIC_URL="https://distractionshop.com"
   NODE_ENV="production"
   ```

4. **Configure Stripe Webhook (Production)**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://distractionshop.com/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`
   - Copy webhook secret to Vercel environment variables

5. **Run Database Migrations**
   ```bash
   # Locally (connected to production DB)
   DATABASE_URL="production-url" npx prisma migrate deploy

   # Seed superadmin (one-time)
   DATABASE_URL="production-url" pnpm run seed:prod
   ```

6. **Verify Deployment**
   - [ ] Homepage loads (https://distractionshop.com)
   - [ ] Login works (/auth/login)
   - [ ] Admin panel accessible (/admin)
   - [ ] Test product creation
   - [ ] Test checkout with Stripe test card
   - [ ] Webhook receives events (check Vercel logs)

---

### 9.3 Rollback Strategy

**Instant Rollback (Vercel Dashboard):**
1. Navigate to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "Promote to Production"
4. Rollback complete in ~30 seconds

**Git-Based Rollback:**
```bash
# Find previous commit
git log --oneline

# Revert to previous commit
git revert HEAD

# Or hard reset (use with caution)
git reset --hard <previous-commit-hash>
git push --force origin main
```

---

### 9.4 Monitoring and Alerts

**Vercel Analytics:**
- Real User Monitoring (RUM)
- Web Vitals tracking
- Error tracking
- Function logs (30-day retention)

**UptimeRobot (Free):**
- Monitor homepage every 5 minutes
- Alert via email if downtime > 5 minutes

**Stripe Dashboard:**
- Payment monitoring
- Failed payment alerts
- Webhook event logs

---

## 10. Testing Strategy

### 10.1 Unit Tests (Vitest)

**Coverage Targets:**
- Utilities: 90%
- API route handlers: 80%
- Components: 70%

**Example Test:**
```typescript
// lib/stripe/createProduct.test.ts
import { describe, it, expect, vi } from 'vitest';
import { createProduct } from './createProduct';

describe('createProduct', () => {
  it('should create product with 3 images in metadata', async () => {
    const mockStripe = vi.fn();
    const result = await createProduct({
      name: 'Test Product',
      price: 10000,
      images: { image_1: 'url1', image_2: 'url2', image_3: 'url3' },
      category: 'home'
    });

    expect(result.metadata.image_1).toBe('url1');
    expect(result.metadata.image_2).toBe('url2');
    expect(result.metadata.image_3).toBe('url3');
  });
});
```

---

### 10.2 E2E Tests (Playwright)

**Critical User Flows:**
1. **Customer Checkout Flow**
   - Land on homepage
   - Browse products
   - Select size
   - Add to cart
   - Proceed to checkout
   - Complete payment (Stripe test mode)
   - Verify order confirmation

2. **Admin Product Creation Flow**
   - Login as admin
   - Navigate to admin panel
   - Create new product with 3 images
   - Verify product appears in storefront

3. **Superadmin Order Management Flow**
   - Login as superadmin
   - View orders page
   - Search for specific order
   - Verify order details

**Example E2E Test:**
```typescript
// e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test('complete checkout flow', async ({ page }) => {
  // Navigate to homepage
  await page.goto('/');

  // Add product to cart
  await page.click('text=Trainspotting Long Sleeve');
  await page.selectOption('select[name="size"]', 'M');
  await page.click('text=Add to Cart');

  // Verify cart badge
  await expect(page.locator('.cart-badge')).toHaveText('1');

  // Proceed to checkout
  await page.click('.cart-icon');
  await page.click('text=Checkout');

  // Stripe Checkout page loads
  await expect(page).toHaveURL(/checkout.stripe.com/);

  // Fill payment details (test mode)
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="cardExpiry"]', '12/34');
  await page.fill('[name="cardCvc"]', '123');

  // Submit payment
  await page.click('text=Pay');

  // Redirected to success page
  await expect(page).toHaveURL(/\/success/);
  await expect(page.locator('h1')).toContainText('Order Confirmed');
});
```

---

### 10.3 Manual Testing Checklist

**Pre-Launch:**
- [ ] Shop open/closed status works (test different times)
- [ ] Entry door hover effect smooth
- [ ] All navigation links work
- [ ] Products display with 3 images
- [ ] Image hover effect works
- [ ] Size selector shows/hides correctly
- [ ] Out-of-stock sizes disabled
- [ ] Add to cart updates badge
- [ ] Cart persists after refresh
- [ ] Cart modal shows correct items
- [ ] Quantity controls work
- [ ] Remove item works
- [ ] Checkout redirects to Stripe
- [ ] Payment succeeds (test card)
- [ ] Webhook receives event (check logs)
- [ ] Success page shows order details
- [ ] Admin login works
- [ ] Admin can create product
- [ ] Cloudinary upload works
- [ ] Product appears on storefront
- [ ] Admin can edit product
- [ ] Admin can delete product
- [ ] Superadmin can view orders
- [ ] Superadmin can create admin user
- [ ] Superadmin can delete admin user
- [ ] Mobile responsive (iOS Safari, Android Chrome)
- [ ] Tablet responsive (iPad)
- [ ] Desktop (Chrome, Firefox, Safari)

---

## 11. Cost Analysis

### 11.1 Development Phase (Free)

```
Vercel:             $0/month (Free tier)
Railway:            $0/month (Free tier: 512MB DB)
Cloudinary:         $0/month (Free tier: 25GB bandwidth)
Stripe:             $0/month (Pay per transaction only)
Resend:             $0/month (Free tier: 3,000 emails/month)
──────────────────────────────
Total:              $0/month
```

---

### 11.2 Production Phase (Low Traffic)

**Assumptions:**
- 1,000 visitors/month
- 50 orders/month
- 50 products × 3 images = 150 images
- 10 admin users

```
Vercel:             $0/month (< 100GB bandwidth)
Railway:            $0/month (< 512MB DB, < 500 hours uptime)
Cloudinary:         $0/month (< 25GB bandwidth)
Stripe:             ~$75/month (50 orders × RM200 avg × 2.9% + RM1.50)
Resend:             $0/month (< 3,000 emails/month)
──────────────────────────────
Total:              ~$75/month (only Stripe transaction fees)
```

---

### 11.3 Production Phase (Scaling)

**Assumptions:**
- 10,000 visitors/month
- 500 orders/month
- 200 products × 3 images = 600 images
- 20 admin users

```
Vercel Pro:         $20/month (> 100GB bandwidth)
Railway Starter:    $5/month (> 512MB DB or > 500 hours)
Cloudinary:         $0/month (still < 25GB with optimization)
Stripe:             ~$750/month (500 orders × RM200 avg × 2.9% + RM1.50)
Resend:             $0/month (< 3,000 emails/month)
──────────────────────────────
Total:              ~$775/month (scales with revenue)
```

**Revenue to Cost Ratio:**
- 500 orders × RM200 = RM100,000 revenue
- RM775 costs = 0.77% of revenue
- Highly profitable at scale

---

## 12. Security Checklist

### 12.1 Pre-Launch Security Audit

**Authentication:**
- [ ] Passwords hashed with bcrypt (cost: 12)
- [ ] JWT in httpOnly cookies (not localStorage)
- [ ] CSRF protection (SameSite: strict)
- [ ] Session expiration enforced
- [ ] Password reset flow (future)

**API Security:**
- [ ] All Stripe API calls server-side only
- [ ] Webhook signature verification
- [ ] Rate limiting on all endpoints
- [ ] Input validation (Zod schemas)
- [ ] No sensitive data in error messages

**Database:**
- [ ] No SQL injection (Prisma parameterized queries)
- [ ] Database connection over SSL
- [ ] Environment variables not committed to Git
- [ ] Database backups enabled (Railway automatic)

**Frontend:**
- [ ] No XSS vulnerabilities (React auto-escapes)
- [ ] CSP headers configured
- [ ] Secure cookies (httpOnly, secure, sameSite)
- [ ] No sensitive data in localStorage

**Dependencies:**
- [ ] Run `npm audit` (no high/critical vulnerabilities)
- [ ] Dependabot enabled (automatic security updates)
- [ ] Regular dependency updates

---

## 13. Glossary

**ISR (Incremental Static Regeneration):** Next.js feature that updates static pages on-demand after initial build.

**Cloudinary:** Image CDN and management platform with automatic optimization (WebP, AVIF, resizing).

**JWT (JSON Web Token):** Secure token format for authentication, stored in httpOnly cookies.

**Stripe Checkout:** Hosted payment page provided by Stripe (handles PCI compliance).

**Webhook:** HTTP callback that sends real-time event data (e.g., payment confirmation).

**Role-Based Access Control (RBAC):** Authorization system where permissions are assigned to roles (admin, superadmin).

**httpOnly Cookie:** Cookie that cannot be accessed by JavaScript (prevents XSS attacks).

**Prisma:** Type-safe ORM (Object-Relational Mapping) for database operations.

**Zod:** TypeScript-first schema validation library.

**Edge Middleware:** Next.js middleware that runs on Vercel Edge Network (faster than serverless functions).

---

## 14. Appendices

### Appendix A: Stripe Product Metadata Schema

```typescript
{
  // Images (Cloudinary URLs)
  image_1: "https://res.cloudinary.com/.../front.jpg",
  image_2: "https://res.cloudinary.com/.../back.jpg",
  image_3: "https://res.cloudinary.com/.../alt.jpg",

  // Category
  unit_label: "home" | "skate_shop" | "preloved",

  // Sizes and Stock (dynamic, can have size_1 to size_N)
  size_1: "S",
  size_1_stock: "10",
  size_2: "M",
  size_2_stock: "15",
  size_3: "L",
  size_3_stock: "5",

  // Optional: Additional metadata
  featured: "true" | "false",
  new_arrival: "true" | "false"
}
```

---

### Appendix B: Environment Variables Reference

**Development (.env.local):**
```env
DATABASE_URL="postgresql://localhost:5432/distraction_dev"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="distraction-shop"
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="product_images"
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
RESEND_API_KEY="re_..."
NEXTAUTH_SECRET="random-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_URL="http://localhost:3000"
NODE_ENV="development"
```

**Production (Vercel Dashboard):**
- Same keys, but with production values (sk_live_, pk_live_, etc.)

---

### Appendix C: Database Seeding

**Create Superadmin User:**
```typescript
// scripts/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seed() {
  const passwordHash = await bcrypt.hash('your-secure-password', 12);

  await prisma.user.upsert({
    where: { email: 'superadmin@distractionshop.com' },
    update: {},
    create: {
      email: 'superadmin@distractionshop.com',
      passwordHash,
      role: 'superadmin'
    }
  });

  console.log('Superadmin user created');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run Seed:**
```bash
pnpm run seed
```

---

## Document Revision History

| Version | Date       | Author | Changes                                      |
|---------|------------|--------|----------------------------------------------|
| 1.0.0   | 2025-10-12 | Claude | Initial requirements document                |
| 2.0.0   | 2025-10-12 | Claude | Complete rewrite with secure backend, admin panel, Cloudinary |

---

**END OF REQUIREMENTS DOCUMENT**

**Next Steps:**
1. ✅ Review and approve this requirements document
2. Initialize Next.js 14 project with TypeScript
3. Setup Railway PostgreSQL database and Prisma
4. Configure Cloudinary account and upload preset
5. Begin Phase 1: Foundation and Authentication
6. Estimated timeline: 7-8 weeks to MVP launch

**Critical Path Items:**
- Week 1: Authentication system (blocks all protected features)
- Week 2-3: Admin panel (blocks product management)
- Week 4: Storefront (blocks customer purchases)
- Week 5: Checkout (blocks revenue)
- Week 6-7: Superadmin + Testing (blocks launch)
