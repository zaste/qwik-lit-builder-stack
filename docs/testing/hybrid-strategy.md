# Hybrid Testing Strategy Guide

## 🛡️ Schema-First Validation

Use schemas for all input validation:

```typescript
import { validate } from '~/schemas';

const result = validate.user(userData);
if (!result.success) {
  return ResultHelpers.error(result.error);
}
// User is guaranteed valid here
```

## 🎯 Result Types for Error Handling

Replace try/catch with Result types:

```typescript
import { ResultHelpers } from '~/lib/result';

const result = await ResultHelpers.wrap(async () => {
  return await apiCall();
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## 🧪 Strategic Testing Patterns

### WHEN/THEN Test Naming
```typescript
test('WHEN user submits invalid email THEN validation error is returned', () => {
  // Test implementation
});
```

### Test Fixtures
```typescript
import { createMockUser } from '~/test/fixtures';

const user = createMockUser({ email: 'custom@example.com' });
```

### Error-First Testing
```typescript
// Test failure cases first
test('WHEN invalid data provided THEN error is returned', () => {
  // Error case
});

test('WHEN valid data provided THEN success result is returned', () => {
  // Success case  
});
```
