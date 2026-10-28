import { test, expect } from '../src/fixtures/base.fixture';
import { ToolshopPage } from '../src/pages/toolshop.page';

test.describe('Toolshop Product Catalog & Accessibility @smoke @a11y', () => {
  test('customer can search products, sort catalog, and pass WCAG 2.1 AA audit @smoke @a11y', async ({
    page,
    checkA11y,
  }) => {
    const toolshop = new ToolshopPage(page);
    await toolshop.gotoCatalog();

    // 1. Run WCAG 2.1 AA Accessibility Gate on main catalog view
    await checkA11y('main');

    // 2. Search for a specific tool
    await toolshop.searchForProduct('Thor Hammer');
    await expect(toolshop.catalogProductNames).toHaveCount(1);
    await expect(toolshop.catalogProductNames.first()).toContainText('Thor Hammer');

    // 3. Reset search and verify full catalog returns
    await toolshop.searchResetBtn.click();
    await expect(toolshop.catalogProductNames).toHaveCount(4);
  });

  test('customer can inspect product details and add multiple units to cart @smoke', async ({
    page,
    checkA11y,
  }) => {
    const toolshop = new ToolshopPage(page);
    await toolshop.gotoCatalog();

    await toolshop.openProductByName('Combination Pliers');
    await checkA11y('#view-detail');

    await toolshop.addCurrentProductToCart(2);
    await expect(toolshop.cartQtyBadge).toHaveText('2');
  });
});
