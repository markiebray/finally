import { test, expect, type Page } from "@playwright/test";

const MOCK_REPLY = "Hello from FinAlly (mock mode)";

function userMessage(page: Page, text: string) {
  return page.locator('[data-testid="chat-message"][data-role="user"]').filter({ hasText: text });
}

/** Send a uniquely tagged message and return locators for it and the reply that follows it. */
async function sendChat(page: Page, command: string) {
  const text = `${command} (ref ${Date.now()})`;
  await page.getByTestId("chat-input").fill(text);
  await page.getByTestId("chat-send").click();
  const sent = userMessage(page, text);
  const reply = sent.locator('xpath=following-sibling::*[@data-testid="chat-message"][1]');
  return { text, sent, reply };
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("chat replies with the mock greeting", async ({ page }) => {
  const { sent, reply } = await sendChat(page, "hello there");
  await expect(sent).toBeVisible();
  await expect(reply).toHaveAttribute("data-role", "assistant");
  await expect(reply).toContainText(MOCK_REPLY);
});

test("chat executes a trade and shows it inline", async ({ page }) => {
  await expect(page.getByTestId("price-GOOGL")).toHaveText(/\d/);
  const { reply } = await sendChat(page, "buy 1 GOOGL");
  await expect(reply).toContainText("Done (mock): buy 1 GOOGL");
  await expect(reply.getByTestId("chat-actions")).toContainText("BUY 1 GOOGL");
  await expect(page.getByTestId("position-row-GOOGL")).toBeVisible();
});

test("chat adds a ticker to the watchlist", async ({ page }) => {
  await sendChat(page, "add SHOP");
  await expect(page.getByTestId("watchlist-row-SHOP")).toBeVisible();
  await sendChat(page, "remove SHOP");
  await expect(page.getByTestId("watchlist-row-SHOP")).toHaveCount(0);
});

test("chat history survives a page reload", async ({ page }) => {
  const { text, reply } = await sendChat(page, "remember me");
  await expect(reply).toContainText(MOCK_REPLY);

  await page.reload();
  await expect(userMessage(page, text)).toBeVisible();
  await expect(reply).toContainText(MOCK_REPLY);
});

test("failed chat trade shows the error and the page survives a reload", async ({ page }) => {
  const { reply } = await sendChat(page, "sell 100000 NFLX");
  await expect(reply.getByTestId("chat-actions")).toContainText(/insufficient shares/i);

  await page.reload();
  await expect(page.getByTestId("watchlist-row-NFLX")).toBeVisible();
  await expect(reply.getByTestId("chat-actions")).toContainText(/insufficient shares/i);
});
