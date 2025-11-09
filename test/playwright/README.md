# Playwright E2E Tests

End-to-end tests for the Distraction Shop checkout flow using Playwright.

## Setup

1. Install Playwright browsers (if not already installed):
```bash
npx playwright install chromium
```

2. **Create a test product in Stripe Dashboard**:
   - Go to https://dashboard.stripe.com/test/products
   - Click "Add product"
   - Fill in details (name, price, etc.)
   - Add at least one size with stock (e.g., "S" with stock: 10)
   - Save and copy the product ID (starts with `prod_`)

3. Update the test with your Stripe product ID:
   - Open `test/playwright/checkout.spec.ts`
   - Replace `YOUR_STRIPE_PRODUCT_ID_HERE` on line 14 with your actual product ID
   - Or set as environment variable:
   ```bash
   export TEST_PRODUCT_ID="prod_YOUR_ACTUAL_ID"
   ```

## Running Tests

### Prerequisites
- App must be running on `localhost:3000` (or Playwright will start it automatically)
- Stripe webhook listener should be running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Database must be accessible

### Test Commands

Run all tests (headless):
```bash
npm run test:e2e
```

Run tests with UI mode (interactive):
```bash
npm run test:e2e:ui
```

Run tests in headed mode (see browser):
```bash
npm run test:e2e:headed
```

Debug mode (step through tests):
```bash
npm run test:e2e:debug
```

## Test Coverage

### Main Checkout Flow Test
**File**: `checkout.spec.ts`

Complete end-to-end checkout test covering:

1. Navigate to product page by ID
2. Select product size
3. Add item to cart
4. Verify cart badge updates
5. Open cart drawer
6. Verify item appears in cart
7. Proceed to checkout
8. Fill customer information
9. Fill shipping address
10. Submit checkout form
11. Complete Stripe payment with test card (4242 4242 4242 4242)
12. Verify redirect to success page
13. Verify cart is cleared

### Additional Tests

- **Empty cart validation**: Ensures checkout page handles empty cart correctly
- **Cart quantity update**: Tests increasing item quantity in cart
- **Remove from cart**: Tests removing items from cart

## Stripe Test Card Details

The tests use Stripe's test card numbers:

- **Card Number**: 4242 4242 4242 4242
- **Expiry**: Any future date (e.g., 12/34)
- **CVC**: Any 3 digits (e.g., 123)
- **ZIP**: Any 5 digits (e.g., 12345)

These are standard Stripe test cards that will always succeed in test mode.

## Configuration

**File**: `playwright.config.ts` (root directory)

Key settings:
- Base URL: `http://localhost:3000`
- Test directory: `./test/playwright`
- Browser: Chromium (Desktop Chrome)
- Screenshots: On failure
- Videos: On failure
- Traces: On first retry

## Troubleshooting

### Test fails at Stripe payment step
- Ensure Stripe is in test mode
- Verify webhook listener is running
- Check that product exists in Stripe

### Test fails at cart update
- Clear browser cache/localStorage
- Ensure app is running on localhost:3000
- Check console for JavaScript errors

### Timeout errors
- Increase timeout in playwright.config.ts
- Ensure network connection is stable
- Check if app is running slow locally

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

This will open a detailed report showing:
- Test results
- Screenshots of failures
- Videos of test runs (if enabled)
- Trace files for debugging
