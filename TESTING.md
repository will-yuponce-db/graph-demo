# Testing & Linting Guide

This document provides comprehensive information about testing and linting in the Graph Demo project.

## Table of Contents

- [Frontend Testing](#frontend-testing)
- [Backend Testing](#backend-testing)
- [Linting](#linting)
- [Code Formatting](#code-formatting)
- [Running Tests in CI/CD](#running-tests-in-cicd)

## Frontend Testing

The frontend uses **Vitest** with **React Testing Library** for testing.

### Setup

Testing dependencies are already installed:

- `vitest` - Test runner
- `@testing-library/react` - React testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - Custom matchers
- `jsdom` - DOM implementation
- `@vitest/ui` - UI for test visualization
- `@vitest/coverage-v8` - Code coverage

### Running Frontend Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

Tests are located in `__tests__` directories next to the code they test:

```
src/
  components/
    __tests__/
      ThemeToggle.test.tsx
      NodePalette.test.tsx
  hooks/
    __tests__/
      useGraphEditor.test.ts
  types/
    __tests__/
      graph.test.ts
  services/
    __tests__/
      graphApi.test.ts
```

### Writing Frontend Tests

Example component test:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<MyComponent onClick={onClick} />);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

## Backend Testing

The backend uses **Jest** with **Supertest** for API testing.

### Setup

Testing dependencies are already installed:

- `jest` - Test runner
- `supertest` - HTTP assertion library

### Running Backend Tests

```bash
cd backend

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

Backend tests are located in the `__tests__` directory:

```
backend/
  __tests__/
    database.test.js
    server.test.js
```

### Writing Backend Tests

Example API test:

```javascript
const request = require('supertest');
const app = require('../server');

describe('GET /api/graph', () => {
  it('returns graph data', async () => {
    const response = await request(app).get('/api/graph').expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toHaveProperty('nodes');
    expect(response.body.data).toHaveProperty('edges');
  });
});
```

## Linting

### Frontend Linting

The frontend uses **ESLint** with TypeScript support.

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

Configuration: `eslint.config.js`

### Backend Linting

The backend uses **ESLint** for Node.js.

```bash
cd backend

# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

Configuration: `backend/.eslintrc.js`

## Code Formatting

The project uses **Prettier** for consistent code formatting.

### Running Prettier

```bash
# Format all files
npm run format

# Check formatting without making changes
npm run format:check
```

### Prettier Configuration

Configuration: `.prettierrc`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### Git Hooks

The project uses **Husky** and **lint-staged** to automatically format and lint code before commits.

When you commit, the following will run automatically:

- ESLint will fix any auto-fixable issues
- Prettier will format the code
- Only staged files will be processed

## Coverage Reports

### Frontend Coverage

After running `npm run test:coverage`, view the coverage report:

```bash
# Open HTML coverage report
open coverage/index.html
```

Coverage is configured to exclude:

- `node_modules/`
- `src/test/`
- `*.d.ts` files
- `*.config.*` files
- Mock data files
- `dist/` directory

### Backend Coverage

After running `npm run test:coverage` in the backend directory:

```bash
cd backend
open coverage/lcov-report/index.html
```

## Best Practices

### Testing

1. **Write tests for**:
   - All new features
   - Bug fixes (to prevent regressions)
   - Complex business logic
   - User interactions
   - API endpoints

2. **Test Structure**:
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests independent
   - Mock external dependencies

3. **Coverage Goals**:
   - Aim for >80% code coverage
   - Focus on critical paths
   - Don't just chase numbers

### Linting

1. **Fix issues before committing**:

   ```bash
   npm run lint:fix
   npm run format
   ```

2. **Use editor integration**:
   - Install ESLint and Prettier extensions
   - Enable format on save
   - See errors in real-time

3. **Don't disable rules without reason**:
   - Document why a rule is disabled
   - Use inline comments sparingly

## Troubleshooting

### Tests failing?

1. Clear cache:

   ```bash
   # Frontend
   npm run test -- --clearCache

   # Backend
   cd backend && npm test -- --clearCache
   ```

2. Update snapshots (if using):
   ```bash
   npm run test -- -u
   ```

### Linting errors?

1. Auto-fix what you can:

   ```bash
   npm run lint:fix
   ```

2. Check Prettier formatting:

   ```bash
   npm run format
   ```

3. If conflicts between ESLint and Prettier, Prettier wins
   (handled by configuration)

## Running All Checks

Before pushing code, run all checks:

```bash
# Frontend
npm run lint
npm run format:check
npm run test:run

# Backend
cd backend
npm run lint
npm test
```

## CI/CD Integration

All tests and linting checks should run in your CI/CD pipeline:

1. Install dependencies
2. Run linters
3. Run tests
4. Generate coverage reports
5. Upload coverage to services (Codecov, Coveralls, etc.)

Example GitHub Actions workflow is provided in `.github/workflows/test.yml`.
