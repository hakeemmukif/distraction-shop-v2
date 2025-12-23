# Code Review: Distraction Shop v2

**Review Date:** 2025-12-23
**Reviewer:** Claude (Automated Code Review)
**Codebase:** Next.js 15 E-commerce Platform

---

## Executive Summary

Overall, this is a **well-structured e-commerce application** with good separation of concerns, proper authentication patterns, and solid TypeScript usage. However, there are several areas requiring attention ranging from **critical security issues** to minor code quality improvements.

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Security | 1 | 3 | 2 | 1 |
| Bug Potential | 0 | 2 | 3 | 2 |
| Performance | 0 | 1 | 2 | 1 |
| Code Quality | 0 | 0 | 4 | 5 |
| **Total** | **1** | **6** | **11** | **9** |

---

## Critical Issues

### 1. Hardcoded Fallback JWT Secret (CRITICAL)

**File:** `src/lib/auth/jwt.ts:3`

```typescript
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret';
```

**Issue:** A hardcoded fallback secret allows authentication bypass if the environment variable is not set. In production, if `NEXTAUTH_SECRET` is missing, all tokens would be signed with `'development-secret'`, which is publicly visible in the source code.

**Recommendation:**
```typescript
const JWT_SECRET = process.env.NEXTAUTH_SECRET;
if (!JWT_SECRET) {
  throw new Error('NEXTAUTH_SECRET must be defined in environment variables');
}
```

---

## High Priority Issues

### 2. Inconsistent Prisma Import Path (HIGH - Bug)

**File:** `src/app/api/stripe/webhook/route.ts:3`

```typescript
import { prisma } from '@/lib/db';
```

**Issue:** This import uses `@/lib/db` while all other files use `@/lib/prisma`. The file `@/lib/db` may not exist, which would cause a runtime error.

**Recommendation:** Change to:
```typescript
import { prisma } from '@/lib/prisma';
```

---

### 3. Missing Input Validation in Checkout (HIGH - Security)

**File:** `src/app/api/checkout/route.ts:43`

```typescript
const body: CheckoutRequest = await request.json();
```

**Issue:** The checkout endpoint uses TypeScript interfaces for type safety but doesn't use Zod schema validation like the login and product creation endpoints. This inconsistency could allow malformed data through.

**Recommendation:** Add Zod schema validation:
```typescript
const checkoutSchema = z.object({
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    price: z.number().positive(),
    size: z.string(),
    quantity: z.number().int().positive(),
    image: z.string().url(),
  })).min(1),
  customer: z.object({
    email: z.string().email(),
    name: z.string().min(1),
    phone: z.string(),
  }),
  shipping: z.object({...}),
});
```

---

### 4. Race Condition in Stock Decrement (HIGH - Bug)

**File:** `src/app/api/stripe/webhook/route.ts:14-50`

```typescript
async function decrementProductStock(productId: string, size: string, quantity: number) {
  const product = await stripe.products.retrieve(productId);
  // ...
  const currentStock = parseInt(product.metadata[stockKey] || '0');
  const newStock = Math.max(0, currentStock - quantity);
  await stripe.products.update(productId, {...});
}
```

**Issue:** There's a race condition between reading the current stock and updating it. If two orders process simultaneously, both could read the same stock value and decrement incorrectly.

**Recommendation:** Use Stripe's conditional update or implement a locking mechanism:
```typescript
// Option 1: Use idempotency keys
// Option 2: Use database locks with transaction
// Option 3: Verify stock hasn't changed before update
```

---

### 5. Unused `error` Variable in JWT Verification (HIGH - Code Quality)

**File:** `src/lib/auth/jwt.ts:18-24`

```typescript
export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

**Issue:** The `error` variable is caught but not logged, making debugging authentication issues difficult.

**Recommendation:**
```typescript
catch (error) {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('JWT verification failed:', error);
  }
  return null;
}
```

---

### 6. Missing Error Handling for JSON Parse in Webhook (HIGH - Bug)

**File:** `src/app/api/stripe/webhook/route.ts:95`

```typescript
const items = JSON.parse(session.metadata?.items || '[]');
```

**Issue:** If `session.metadata?.items` contains invalid JSON, this will throw an unhandled exception and return a 500 error to Stripe, causing webhook retries.

**Recommendation:**
```typescript
let items;
try {
  items = JSON.parse(session.metadata?.items || '[]');
} catch (parseError) {
  console.error('Failed to parse items from metadata:', parseError);
  items = [];
}
```

---

### 7. No Rate Limiting on Authentication Endpoints (HIGH - Security)

**File:** `src/app/api/auth/login/route.ts`

**Issue:** The login endpoint has no rate limiting, making it vulnerable to brute-force attacks.

**Recommendation:** Implement rate limiting using:
- Next.js middleware with IP tracking
- Redis-based rate limiting
- Vercel's built-in rate limiting

---

## Medium Priority Issues

### 8. Missing Cloudinary Remote Pattern (MEDIUM - Bug)

**File:** `next.config.ts:4-19`

```typescript
remotePatterns: [
  { hostname: 'images.unsplash.com' },
  { hostname: 'via.placeholder.com' },
],
```

**Issue:** The application uses Cloudinary for image uploads (`next-cloudinary` package), but Cloudinary hostnames are not in the `remotePatterns`. This will cause image optimization to fail for uploaded products.

**Recommendation:** Add Cloudinary patterns:
```typescript
{
  protocol: 'https',
  hostname: 'res.cloudinary.com',
  port: '',
  pathname: '/**',
},
```

---

### 9. Inefficient Product Fetching (MEDIUM - Performance)

**File:** `src/app/api/products/route.ts:24-68`

```typescript
const products = await Promise.all(
  stripeProducts.data
    .filter((product) => product.metadata.unit_label === category)
    .map(async (product) => {
      const priceData = await stripe.prices.retrieve(priceId);
      // ...
    })
);
```

**Issue:** For each product, a separate API call is made to retrieve price data. This creates N+1 query pattern.

**Recommendation:** Use Stripe's expand feature or fetch prices in bulk:
```typescript
const stripeProducts = await stripe.products.list({
  active: true,
  limit: limit,
  expand: ['data.default_price'],
});
```

---

### 10. Potential Memory Leak in Cart LocalStorage (MEDIUM - Performance)

**File:** `src/contexts/CartContext.tsx:39-42`

```typescript
useEffect(() => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}, [cart]);
```

**Issue:** The cart is saved to localStorage on every state change, even for identical data. This could cause excessive I/O operations.

**Recommendation:** Add a debounce or comparison check:
```typescript
useEffect(() => {
  const savedCart = localStorage.getItem(CART_STORAGE_KEY);
  if (savedCart !== JSON.stringify(cart)) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }
}, [cart]);
```

---

### 11. Missing HTTP Method Handlers (MEDIUM - Security)

**File:** Multiple API routes

**Issue:** Most API routes only implement POST or GET but don't explicitly reject other HTTP methods. Next.js will return 405 automatically, but explicit handling provides better control.

**Recommendation:** Add method validation or use Next.js route segment config:
```typescript
export const runtime = 'edge'; // or 'nodejs'
export const dynamic = 'force-dynamic';
```

---

### 12. Insecure Order Number Generation (MEDIUM - Security)

**File:** `src/app/api/stripe/webhook/route.ts:7-11`

```typescript
function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
```

**Issue:** `Math.random()` is not cryptographically secure and order numbers could potentially be predicted.

**Recommendation:**
```typescript
import { randomBytes } from 'crypto';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}
```

---

### 13. Missing CSRF Protection (MEDIUM - Security)

**Files:** All mutation API endpoints

**Issue:** While SameSite cookies provide some protection, there's no explicit CSRF token validation for state-changing operations.

**Recommendation:** For sensitive operations, implement CSRF tokens or use the Origin/Referer header validation.

---

### 14. Unused next-auth Dependency (MEDIUM - Maintenance)

**File:** `package.json:31`

```json
"next-auth": "^5.0.0-beta.29",
```

**Issue:** The project uses custom JWT authentication but has `next-auth` as a dependency. This beta package is unused and adds unnecessary bundle size.

**Recommendation:** Remove if not planned for use:
```bash
npm uninstall next-auth
```

---

## Low Priority Issues

### 15. Commented Code in Production (LOW - Code Quality)

**File:** `src/components/storefront/Header.tsx:44-55, 150-163`

```typescript
{/* <Link href="/terms" ...>Terms</Link>
    <Link href="/contact" ...>Contact</Link> */}
```

**Issue:** Commented-out navigation links should either be removed or properly feature-flagged.

**Recommendation:** Use feature flags or remove commented code:
```typescript
{process.env.NEXT_PUBLIC_SHOW_TERMS && (
  <Link href="/terms">Terms</Link>
)}
```

---

### 16. Missing TypeScript Strict Mode (LOW - Type Safety)

**File:** `tsconfig.json`

**Issue:** TypeScript's strict mode settings could be enhanced for better type safety.

**Recommendation:** Add these compiler options:
```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

---

### 17. Console.log Statements in Production (LOW - Code Quality)

**Files:** `src/app/api/stripe/webhook/route.ts` and others

**Issue:** Multiple `console.log` and `console.error` statements exist. While useful for debugging, they should be replaced with a proper logging solution.

**Recommendation:** Use a structured logging library or conditional logging:
```typescript
const logger = {
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_LOGS) {
      console.log(...args);
    }
  },
  // ...
};
```

---

### 18. Hardcoded Currency (LOW - Maintainability)

**Files:** Multiple files

```typescript
currency: 'myr',
currency: 'MYR',
```

**Issue:** Currency is hardcoded in multiple places. Should be centralized.

**Recommendation:** Create a constants file:
```typescript
// src/lib/constants.ts
export const CURRENCY = 'MYR';
export const CURRENCY_SYMBOL = 'RM';
```

---

### 19. Missing API Response Type Definitions (LOW - Type Safety)

**Files:** All API routes

**Issue:** API routes return `NextResponse.json()` without explicit return type annotations, reducing type safety for consumers.

**Recommendation:** Define response types:
```typescript
type LoginResponse = { user: { id: string; email: string; role: string } };
type LoginErrorResponse = { error: string; details?: unknown };

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse | LoginErrorResponse>> {
  // ...
}
```

---

### 20. Missing Environment Variable Validation (LOW - Reliability)

**File:** Various

**Issue:** Environment variables are accessed directly without centralized validation at startup.

**Recommendation:** Create an environment validation module:
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  // ...
});

export const env = envSchema.parse(process.env);
```

---

### 21. Missing Error Boundaries (LOW - UX)

**Issue:** No React error boundaries are implemented for graceful error handling in the UI.

**Recommendation:** Add error.tsx files for route segments.

---

### 22. Unused resend Package (LOW - Maintenance)

**File:** `package.json:37`

```json
"resend": "^6.2.0",
```

**Issue:** The `resend` package is installed but not used anywhere in the codebase. The comment in webhook indicates emails are handled by Stripe.

**Recommendation:** Remove if not planned for use, or implement email notifications.

---

### 23. Session Model Unused (LOW - Architecture)

**File:** `prisma/schema.prisma:44-56`

```prisma
model Session {
  // ...
}
```

**Issue:** The Session model exists in the schema but the application uses stateless JWT tokens. Sessions are never created or used.

**Recommendation:** Either remove the Session model or implement session-based auth for enhanced security (ability to revoke sessions).

---

## Architecture Observations

### Positive Patterns

1. **Good separation of concerns** - Clear division between components, API routes, and lib utilities
2. **Proper Prisma singleton pattern** - Prevents connection pool exhaustion in development
3. **Consistent error handling** - Most routes follow the same try/catch pattern with Zod validation
4. **Security-first cookie configuration** - httpOnly, secure, SameSite strict
5. **Role-based access control** - Clean implementation with middleware
6. **Good TypeScript usage** - Proper interfaces and type annotations

### Areas for Improvement

1. **Testing coverage** - Playwright is set up but test files are minimal
2. **API documentation** - No OpenAPI/Swagger documentation
3. **Logging infrastructure** - Console logs instead of structured logging
4. **Monitoring** - No error tracking (Sentry, etc.) integration visible
5. **Caching strategy** - No caching layer for Stripe API responses

---

## Recommended Next Steps

### Immediate (Before Production)

1. ✅ Fix the hardcoded JWT secret fallback
2. ✅ Fix the incorrect Prisma import path
3. ✅ Add Cloudinary to Next.js image remote patterns
4. ✅ Add input validation to checkout endpoint

### Short-term

1. Implement rate limiting on auth endpoints
2. Add proper logging infrastructure
3. Add error boundaries to React components
4. Remove unused dependencies (next-auth, resend)

### Medium-term

1. Implement comprehensive test coverage
2. Add API documentation
3. Set up error monitoring (Sentry or similar)
4. Consider implementing session-based auth for security

---

## Conclusion

The Distraction Shop v2 codebase demonstrates solid engineering practices overall. The critical and high-priority issues identified should be addressed before production deployment, particularly the JWT secret fallback and the Prisma import issue. The medium and low-priority items can be addressed incrementally as part of ongoing maintenance.

The architecture is clean and maintainable, with room for enhancement in testing, documentation, and observability.
