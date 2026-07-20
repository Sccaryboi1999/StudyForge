import { expect, test } from "@playwright/test";

test("demo guide to quiz, score, review, and missed practice", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Try the demo" }).first().click();
  await expect(page.getByLabel("Study guide title")).toHaveValue("Introduction to Computer Networking");
  await page.getByRole("button", { name: /Review material/ }).click();
  await expect(page.getByRole("heading", { name: "Review extracted content" })).toBeVisible();
  await page.getByRole("button", { name: /Choose quiz settings/ }).click();
  await page.getByRole("button", { name: /Generate quiz/ }).click();
  await expect(page.getByText(/Question 1 of/)).toBeVisible({ timeout: 20_000 });
  for (let i = 0; i < 10; i++) {
    const choice = page.locator(".answer-card").first();
    const written = page.locator("#written-answer");
    if (await choice.isVisible()) await choice.click();
    else await written.fill("I am not sure");
    const check = page.getByRole("button", { name: "Check answer" });
    if (await check.isVisible()) await check.click();
    if (i < 9) await page.getByRole("button", { name: /Next/ }).first().click();
    else await page.getByRole("button", { name: "Finish quiz" }).first().click();
  }
  await expect(page.getByText("Quiz complete")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Understand every question." })).toBeVisible();
  await page.getByRole("button", { name: /Practice missed/ }).first().click();
  await expect(page.getByText(/Question 1 of/)).toBeVisible();
});
