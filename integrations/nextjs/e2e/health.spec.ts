import { test, expect } from "@playwright/test";

test("homepage returns an HTML response without server failure", async ({ request }) => {
  const response = await request.get("/");
  expect(response.status()).toBeLessThan(500);
  expect(response.headers()["content-type"] ?? "").toContain("text/html");
});
