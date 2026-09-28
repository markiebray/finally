import { test, expect } from "@playwright/test";

const DEFAULT_TICKERS = ["AAPL", "GOOGL", "MSFT", "AMZN", "TSLA", "NVDA", "META", "JPM", "V", "NFLX"];

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("shows the 10 default tickers", async ({ page }) => {
  for (const ticker of DEFAULT_TICKERS) {
    await expect(page.getByTestId(`watchlist-row-${ticker}`)).toBeVisible();
  }
  await expect(page.locator('[data-testid^="watchlist-row-"]')).toHaveCount(10);
});

test("shows $10,000 cash on a fresh database", async ({ page }) => {
  await expect(page.getByTestId("cash-balance")).toContainText(/10,000/);
});

test("prices stream and connection is live", async ({ page }) => {
  const price = page.getByTestId("price-AAPL");
  await expect(price).toHaveText(/\d+\.\d{2}/);
  const first = await price.textContent();
  await expect(price).not.toHaveText(first!, { timeout: 10_000 });
  await expect(page.getByTestId("connection-status")).toHaveAttribute("data-status", "connected");
});
