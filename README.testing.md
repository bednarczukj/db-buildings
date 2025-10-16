# Testing Guide

This project uses Vitest for unit tests and Playwright for E2E tests, following modern testing best practices.

## Tech Stack

- **Vitest** - Fast unit test framework with native ESM support
- **React Testing Library** - Testing React components with user-centric queries
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **Playwright** - Reliable E2E testing with Chromium
- **Supertest** - HTTP assertion library for API tests
- **TestContainers** - Docker containers for integration tests

## Unit Tests (Vitest)

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests once
npm run test:run

# Run tests in watch mode with file filter
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

Tests should be placed in `**/*.test.ts` or `**/*.spec.ts` files.

**Example basic test:**

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFunction', () => {
  it('should return expected value', () => {
    expect(myFunction(2, 3)).toBe(5);
  });
});
```

**Example React component test:**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('MyComponent', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Best Practices

1. **Use descriptive test names** - Test names should describe what they test
2. **Follow Arrange-Act-Assert** - Structure tests clearly
3. **Mock external dependencies** - Use `vi.mock()` for imports
4. **Test user behavior, not implementation** - Focus on what users see/do
5. **Use Testing Library queries** - Prefer `getByRole` and `getByLabelText`
6. **Avoid testing library internals** - Test the public interface

### Configuration

- Configuration: `vitest.config.ts`
- Setup file: `src/test/setup.ts`
- Coverage thresholds: 70% (configurable in `vitest.config.ts`)

## E2E Tests (Playwright)

### Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen

# Show test report
npm run test:e2e:report
```

### Writing Tests

Tests should be placed in the `e2e/` directory with `.spec.ts` extension.

**Example basic E2E test:**

```typescript
import { test, expect } from '@playwright/test';

test('should load homepage', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Expected Title/);
});
```

**Example with Page Object Model:**

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './page-objects/LoginPage';

test('should login successfully', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('user@example.com', 'password');
  
  await expect(page).toHaveURL('/dashboard');
});
```

### Best Practices

1. **Use Page Object Model** - Encapsulate page interactions
2. **Use browser contexts** - Isolate test environments
3. **Prefer user-facing selectors** - Use roles, labels, and test IDs
4. **Wait for elements properly** - Use `await expect()` with auto-wait
5. **Leverage trace viewer** - Debug failures with traces
6. **Use visual regression** - Test with `expect(page).toHaveScreenshot()`
7. **Implement proper hooks** - Setup/teardown with `beforeEach`/`afterEach`
8. **Run tests in parallel** - Playwright runs tests in parallel by default

### Configuration

- Configuration: `playwright.config.ts`
- Page Objects: `e2e/page-objects/`
- Fixtures: `e2e/fixtures/`
- Global setup: `e2e/global-setup.ts`
- Global teardown: `e2e/global-teardown.ts`

## Test Environment

### Environment Variables

Copy `.env.test` to `.env.test.local` and configure:

```bash
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPassword123!
BASE_URL=http://localhost:4321
```

### Test Database

For integration tests, consider using:
- A separate Supabase project for testing
- TestContainers for isolated PostgreSQL instances
- In-memory databases for faster tests

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:run
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Debugging Tests

### Vitest

- Use `test.only()` to run a single test
- Use `test.skip()` to skip a test
- Add `console.log()` or `debugger` statements
- Run with `--inspect` flag for Node debugging

### Playwright

- Use `test.only()` to run a single test
- Use `test.skip()` to skip a test
- Run with `--debug` flag to use the inspector
- Use `await page.pause()` to pause execution
- Check trace files in `test-results/` directory

## Coverage

Coverage reports are generated in the `coverage/` directory:
- HTML report: `coverage/index.html`
- LCOV format: `coverage/lcov.info`

View coverage with:

```bash
npm run test:coverage
open coverage/index.html
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

