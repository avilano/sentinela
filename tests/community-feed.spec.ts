import { test, expect } from '../src/fixtures/base.fixture';

test.describe('Creator Community Feed & Discussion Spaces @smoke @community @a11y', () => {
  test.beforeEach(async ({ authedApi }) => {
    await authedApi('/test/reset', { method: 'POST' }).catch(() => {});
  });

  test('authenticated member can publish a community post and view passes WCAG 2.1 AA @smoke @community @a11y', async ({
    page,
    checkA11y,
  }) => {
    await page.goto('/#/community');
    await page.getByTestId('nav-community').click();

    // 1. Accessibility audit on Community Feed view
    await checkA11y('#view-community');

    // 2. Publish a new community discussion post
    await page.getByTestId('post-title').fill('Automated Release Verification Guide');
    await page
      .getByRole('textbox', { name: 'Share something with your community...' })
      .fill('Validating shift-left Playwright fixtures and webhook contracts.');
    await page.getByTestId('publish-post').click();

    // 3. Verify the new post renders at the top of the community feed
    const feedItem = page
      .getByTestId('feed-item')
      .filter({ hasText: 'Automated Release Verification Guide' });
    await expect(feedItem).toBeVisible();
  });
});
