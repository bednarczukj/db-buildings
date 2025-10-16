# Testing Quick Start Guide

## 🚀 Quick Commands

```bash
# Unit Tests
npm test                    # Watch mode
npm run test:ui            # UI mode (recommended)
npm run test:coverage      # With coverage

# E2E Tests  
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui        # UI mode (recommended)
npm run test:e2e:debug     # Debug mode

# Generate E2E Tests
npm run test:e2e:codegen   # Record interactions
```

## 📝 Creating Your First Unit Test

```typescript
// src/lib/myFeature.test.ts
import { describe, it, expect } from 'vitest';
import { myFunction } from './myFeature';

describe('myFunction', () => {
  it('should do something', () => {
    expect(myFunction(input)).toBe(expected);
  });
});
```

## 📝 Creating Your First E2E Test

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test('should perform action', async ({ page }) => {
  await page.goto('/');
  await page.click('button');
  await expect(page.locator('.result')).toBeVisible();
});
```

## 🎯 Testing Guidelines

### Unit Tests (Vitest)
- Place in same directory as code: `feature.ts` → `feature.test.ts`
- Or in `src/test/` for shared utilities
- Mock external dependencies
- Test public interfaces, not internals
- Use Testing Library for React components

### E2E Tests (Playwright)
- Place in `e2e/` directory
- Use Page Object Model for complex pages
- Test critical user journeys
- Use fixtures for authentication
- Prefer user-facing selectors

## 🔧 Configuration Files

- **Unit Tests**: `vitest.config.ts` + `src/test/setup.ts`
- **E2E Tests**: `playwright.config.ts`
- **Environment**: `.env.test` (copy to `.env.test.local`)

## 📊 Coverage Reports

After running `npm run test:coverage`:
```bash
open coverage/index.html
```

## 🐛 Debugging

### Vitest
```typescript
test.only('focus on this test', () => {
  // Your test
});
```

### Playwright
```bash
npm run test:e2e:debug      # Step through tests
```

## 📚 Full Documentation

See `README.testing.md` for comprehensive guide.

## ✅ Verification

Run these to verify setup:
```bash
npm run test:run            # Should pass 10 tests
npm run test:e2e           # May fail until server setup
```

