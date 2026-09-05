# Style Guide

Clarity over brevity. Small functions. No unused code. Money as Decimal / string, never float.

## Naming

| Item | Convention |
|------|------------|
| Python | snake_case |
| React components | PascalCase |
| React hooks | useCamelCase |
| Constants | UPPER_SNAKE_CASE |

## Format

Python: 4 spaces. TypeScript: 2 spaces. UTF-8.

## Errors

Raise HTTPException with Spanish `detail` on the API. Surface `role="alert"` in the UI. Do not leak stack traces.

## Tests

Allocation logic is unit-tested without a database. Frontend presentation tests use Testing Library.
