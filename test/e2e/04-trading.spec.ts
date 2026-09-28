import { test, expect, type Page } from "@playwright/test";

function money(text: string | null): number {
  return Number(text!.replace(/[^0-9.-]/g, ""));
}

async function trade(page: Page, ticker: string, quantity: string, side: "buy" | "sell") {
  await page.getByTestId("trade-ticker").fill(ticker);
  await page.getByTestId("trade-quantity").fill(quantity);
  await page.getByTestId(`trade-${side}`).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("price-NVDA")).toHaveText(/\d/);
});

test("buy shares: cash decreases and position appears", async ({ page }) => {
  const cash = page.getByTestId("cash-balance");
  await expect(cash).toHaveText(/\d/);
  const before = money(await cash.textContent());

  await trade(page, "NVDA", "2", "buy");

  await expect(page.getByTestId("position-row-NVDA")).toBeVisible();
  await expect.poll(async () => money(await cash.textContent())).toBeLessThan(before);
});

test("sell shares: cash increases and position disappears", async ({ page }) => {
  const cash = page.getByTestId("cash-balance");
  await expect(cash).toHaveText(/\d/);
  const initial = money(await cash.textContent());
  await trade(page, "MSFT", "1", "buy");
  const row = page.getByTestId("position-row-MSFT");
  await expect(row).toBeVisible();
  await expect.poll(async () => money(await cash.textContent())).toBeLessThan(initial);
  const before = money(await cash.textContent());

  await trade(page, "MSFT", "1", "sell");

  await expect(row).toHaveCount(0);
  await expect.poll(async () => money(await cash.textContent())).toBeGreaterThan(before);
});

test("failed trade shows an error", async ({ page }) => {
  await trade(page, "AMZN", "1000000", "buy");
  await expect(page.getByTestId("trade-error")).toContainText(/insufficient cash/i);
});
