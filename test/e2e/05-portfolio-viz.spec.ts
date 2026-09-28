import { test, expect } from "@playwright/test";

test("heatmap shows a held position and P&L chart renders", async ({ page, request }) => {
  const res = await request.post("/api/portfolio/trade", { data: { ticker: "META", quantity: 1, side: "buy" } });
  expect(res.status()).toBe(200);

  await page.goto("/");
  const heatmap = page.getByTestId("heatmap");
  await expect(heatmap).toBeVisible();
  await expect(heatmap).toContainText("META");

  const pnl = page.getByTestId("pnl-chart");
  await expect(pnl).toBeVisible();
  await expect(pnl.locator("canvas, svg").first()).toBeVisible();
});
