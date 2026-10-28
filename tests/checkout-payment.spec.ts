import { test, expect } from '../src/fixtures/base.fixture';
import { ToolshopPage } from '../src/pages/toolshop.page';

test.describe('Checkout & Stripe Payment Webhooks @smoke @pay @api', () => {
  test.beforeEach(async ({ authedApi }) => {
    // Fast API reset (<20ms) before each payment test
    await authedApi('/test/reset', { method: 'POST' }).catch(() => {});
  });

  test('customer can complete end-to-end multi-step checkout with pre-injected auth @smoke @pay', async ({
    page,
    checkA11y,
  }) => {
    const toolshop = new ToolshopPage(page);
    await toolshop.gotoCatalog();

    await toolshop.openProductByName('Cordless Drill 20V');
    await toolshop.addCurrentProductToCart(1);
    await expect(toolshop.cartQtyBadge).toHaveText('1');

    await toolshop.completeCheckoutWithBankTransfer();
    await expect(toolshop.paymentSuccessBanner).toBeVisible();
    await expect(toolshop.paymentSuccessBanner).toContainText('Payment was successful');

    // Verify checkout confirmation view meets WCAG 2.1 AA
    await checkA11y('#view-checkout');
  });

  test('signed Stripe webhook (customer.subscription.created) upgrades customer tier to pro @pay @api', async ({
    sendStripeWebhook,
    authedApi,
  }) => {
    // 1. Send signed Stripe webhook event
    const webhookRes = await sendStripeWebhook({
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_sentinela_pro_001',
          customer_email: 'customer@practicesoftwaretesting.com',
          plan: 'pro_creator_tier',
          status: 'active',
        },
      },
    });
    expect(webhookRes.status()).toBe(200);
    const webhookBody = await webhookRes.json();
    expect(webhookBody.received).toBe(true);

    // 2. Verify user profile reflects upgraded `pro` subscription via API
    const profileRes = await authedApi('/users/me');
    expect(profileRes.status()).toBe(200);
    const profile = await profileRes.json();
    expect(profile.subscription_tier).toBe('pro');
  });

  test('tampered Stripe webhook signature is rejected with HTTP 400 @pay @api', async ({
    sendStripeWebhook,
  }) => {
    const tamperedRes = await sendStripeWebhook(
      {
        type: 'customer.subscription.created',
        data: {
          object: {
            customer_email: 'customer@practicesoftwaretesting.com',
          },
        },
      },
      { invalidSignature: true }
    );

    expect(tamperedRes.status()).toBe(400);
  });
});
