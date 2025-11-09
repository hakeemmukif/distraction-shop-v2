import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete Checkout Flow
 *
 * This test covers the entire checkout journey:
 * 1. Navigate to product page
 * 2. Add item to cart
 * 3. Proceed to checkout
 * 4. Complete Stripe payment with test card
 * 5. Verify order success
 */

// Using real Stripe product: Distraction Hoodie (has sizes S, M, L, XL with stock)
const TEST_PRODUCT_ID = process.env.TEST_PRODUCT_ID || 'prod_TIwelwgXeF3ScJ';

const TEST_CUSTOMER = {
  email: 'test@example.com',
  name: 'Test Customer',
  phone: '+60123456789',
};

const TEST_SHIPPING = {
  name: 'Test Recipient',
  phone: '+60987654321',
  addressLine1: '123 Test Street',
  addressLine2: 'Unit 4B',
  city: 'Kuala Lumpur',
  state: 'Wilayah Persekutuan',
  postalCode: '50000',
};

const STRIPE_TEST_CARD = {
  number: '4242424242424242',
  expiry: '1234',
  cvc: '123',
  zip: '12345',
};

test.describe('Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to shop page and clear cart
    await page.goto('/home');
    await page.evaluate(() => localStorage.clear());
  });

  test('should complete full checkout with Stripe payment', async ({ page }) => {
    // Increase timeout for this E2E test (includes Stripe payment processing)
    test.setTimeout(90000); // 90 seconds for full checkout flow

    // Step 1: Navigate to product page
    await test.step('Navigate to product', async () => {
      await page.goto(`/products/${TEST_PRODUCT_ID}`);
    });

    // Step 2: Wait for product to load (size auto-selected)
    await test.step('Wait for product to load', async () => {
      // Wait for page to load and product data to be fetched
      await page.waitForLoadState('networkidle');

      // Wait for product title to appear (indicates data loaded)
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

      // Wait for the Add to Cart button to appear with correct text
      // The product page auto-selects first available size, so button should say "Add to Cart"
      await expect(page.locator('button:has-text("Add to Cart")').first()).toBeVisible({ timeout: 10000 });
    });

    // Step 3: Add to cart
    await test.step('Add item to cart', async () => {
      const addToCartButton = page.locator('button:has-text("Add to Cart")');
      await expect(addToCartButton).toBeEnabled();
      await addToCartButton.click();

      // Wait a bit for cart update
      await page.waitForTimeout(500);
    });

    // Step 4: Verify cart badge shows count
    await test.step('Verify cart badge updates', async () => {
      const cartBadge = page.locator('a[href="/cart"] span, button:has-text("1")').first();
      await expect(cartBadge).toBeVisible();
    });

    // Step 5: Open cart drawer
    await test.step('Open cart drawer', async () => {
      const cartButton = page.locator('button svg').first(); // Cart icon
      await cartButton.click();

      // Wait for cart drawer to appear
      await expect(page.locator('text=Shopping Cart')).toBeVisible();
    });

    // Step 6: Verify item in cart
    await test.step('Verify item appears in cart', async () => {
      // Verify cart drawer shows subtotal (indicates items in cart)
      await expect(page.locator('text=Subtotal')).toBeVisible();
      await expect(page.locator('text=Total')).toBeVisible();
    });

    // Step 7: Proceed to checkout
    await test.step('Click proceed to checkout', async () => {
      const checkoutButton = page.locator('button:has-text("Proceed to Checkout")');
      await expect(checkoutButton).toBeVisible();
      await checkoutButton.click();

      // Wait for checkout page
      await expect(page).toHaveURL(/\/checkout/);
    });

    // Step 8: Fill in customer and shipping information
    await test.step('Fill checkout form', async () => {
      await page.fill('input[name="email"]', TEST_CUSTOMER.email);
      await page.fill('input[name="name"]', TEST_CUSTOMER.name);
      await page.fill('input[name="phone"]', TEST_CUSTOMER.phone);
      await page.fill('input[name="addressLine1"]', TEST_SHIPPING.addressLine1);
      await page.fill('input[name="addressLine2"]', TEST_SHIPPING.addressLine2);
      await page.fill('input[name="city"]', TEST_SHIPPING.city);
      await page.fill('input[name="state"]', TEST_SHIPPING.state);
      await page.fill('input[name="postalCode"]', TEST_SHIPPING.postalCode);
    });

    // Step 10: Submit checkout form
    await test.step('Submit checkout form', async () => {
      const submitButton = page.locator('button:has-text("Proceed to Payment")');
      await expect(submitButton).toBeEnabled();
      await submitButton.click();

      // Wait for redirect to Stripe
      await page.waitForURL(/checkout.stripe.com/, { timeout: 10000 });
    });

    // Step 11: Complete Stripe payment
    await test.step('Complete Stripe payment', async () => {
      // Wait for Stripe page to load
      await expect(page.locator('text=Payment method')).toBeVisible({ timeout: 10000 });

      // Click on the Card payment method radio button
      // Use force: true to bypass any overlapping elements
      const cardRadio = page.locator('input[type="radio"][value="card"]').first();
      await cardRadio.click({ force: true });

      // Wait for card form to expand
      await page.waitForTimeout(2000);

      // Fill in card details - these are regular input fields, not iframes
      // Card number field
      await page.locator('input[placeholder*="1234"]').first().fill(STRIPE_TEST_CARD.number);

      // Expiry date field (MM / YY)
      await page.locator('input[placeholder*="MM"]').first().fill(STRIPE_TEST_CARD.expiry);

      // CVC field
      await page.locator('input[placeholder="CVC"]').first().fill(STRIPE_TEST_CARD.cvc);

      // Cardholder name field (REQUIRED)
      await page.locator('input[placeholder*="Full name on card"]').first().fill('Test Customer');

      // Wait a moment for Stripe to validate
      await page.waitForTimeout(1000);

      // Submit payment
      const payButton = page.locator('button:has-text("Pay")').first();
      await expect(payButton).toBeEnabled({ timeout: 5000 });
      await payButton.click();

      // Wait for payment processing and redirect
      await page.waitForURL(/\/success/, { timeout: 30000 });
    });

    // Step 12: Verify success page
    await test.step('Verify order success', async () => {
      await expect(page).toHaveURL(/\/success/);
      await expect(page.locator('text=Order Successful')).toBeVisible();
      await expect(page.locator('text=Thank you for your purchase')).toBeVisible();
    });

    // Step 13: Verify cart is cleared
    await test.step('Verify cart is cleared', async () => {
      // Navigate to home
      await page.goto('/');

      // Cart badge should not be visible or should show 0
      const cartBadge = page.locator('a[href="/cart"] span').first();
      await expect(cartBadge).not.toBeVisible();
    });
  });

  test('should validate empty cart before checkout', async ({ page }) => {
    // Try to go to checkout with empty cart
    await page.goto('/checkout');

    // Checkout page should show error when submitting with empty cart
    const submitButton = page.locator('button:has-text("Proceed to Payment")').first();
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();

      // Should show validation error about invalid cart items
      await expect(page.locator('text=Invalid cart items').or(page.locator('text=error'))).toBeVisible({ timeout: 3000 });
    }
  });

  test('should update cart quantity', async ({ page }) => {
    // Navigate to product and add to cart
    await page.goto(`/products/${TEST_PRODUCT_ID}`);

    // Select size if available
    const sizeButton = page.locator('button:has-text("S"), button:has-text("M")').first();
    if (await sizeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sizeButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await sizeButton.click();
    }

    // Add to cart
    await page.locator('button:has-text("Add to Cart")').click();
    await page.waitForTimeout(500);

    // Open cart drawer
    await page.locator('button svg').first().click();
    await expect(page.locator('text=Shopping Cart')).toBeVisible();

    // Find and click increase quantity button
    const increaseButton = page.locator('button:has-text("+")').first();
    if (await increaseButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await increaseButton.click();

      // Verify quantity increased
      await page.waitForTimeout(500);
      const cartBadge = page.locator('button span').first();
      await expect(cartBadge).toHaveText('2');
    }
  });

  test('should remove item from cart', async ({ page }) => {
    // Navigate to product and add to cart
    await page.goto(`/products/${TEST_PRODUCT_ID}`);

    // Select size if available
    const sizeButton = page.locator('button:has-text("S"), button:has-text("M")').first();
    if (await sizeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sizeButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await sizeButton.click();
    }

    // Add to cart
    await page.locator('button:has-text("Add to Cart")').click();
    await page.waitForTimeout(500);

    // Open cart drawer
    await page.locator('button svg').first().click();
    await expect(page.locator('text=Shopping Cart')).toBeVisible();

    // Find and click remove button
    const removeButton = page.locator('button:has-text("Remove"), button[aria-label="Remove"]').first();
    await removeButton.click();

    // Verify cart is empty
    await page.waitForTimeout(500);
    await expect(page.locator('text=Your cart is empty')).toBeVisible();
  });
});
