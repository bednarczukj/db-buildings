# E2E Test Fixtures

This directory contains custom Playwright fixtures for reusable test setup.

## Available Fixtures

### `authenticated-fixture.ts`

Provides an authenticated page context for tests that require authentication.

**Usage:**

```typescript
import { test, expect } from "../fixtures/authenticated-fixture";

test("should access protected page", async ({ authenticatedPage }) => {
  // authenticatedPage is already logged in
  await authenticatedPage.goto("/buildings");

  const heading = authenticatedPage.locator("h1").first();
  await expect(heading).toBeVisible();
});
```

**Provides:**

- `authenticatedPage` - A page that is already authenticated with test credentials
- `testUser` - Object containing test user credentials ({ email, password })

## Creating Custom Fixtures

Follow this pattern to create new fixtures:

```typescript
import { test as base } from "@playwright/test";

type CustomFixtures = {
  myFixture: string;
};

export const test = base.extend<CustomFixtures>({
  myFixture: async ({}, use) => {
    // Setup code here
    const value = "some setup value";

    // Use the fixture
    await use(value);

    // Teardown code here (optional)
  },
});

export { expect } from "@playwright/test";
```

## Best Practices

1. **Isolate fixtures** - Each fixture should be independent and reusable
2. **Auto-wait** - Use Playwright's auto-wait features in fixtures
3. **Cleanup** - Always clean up resources in fixture teardown
4. **Documentation** - Add JSDoc comments to explain fixture behavior
