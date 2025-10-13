# Testing Guide for F8 Slackbot Microservice

This document provides comprehensive information about testing the F8 Slackbot Microservice.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Performance Tests](#performance-tests)
- [Writing New Tests](#writing-new-tests)
- [Continuous Integration](#continuous-integration)

## Overview

The F8 Slackbot has a comprehensive test suite covering:
- Unit tests for handlers, services, and utilities
- Integration tests for API endpoints
- Performance/load tests for scalability validation
- Error handling and edge case tests

## Test Structure

```
src/__tests__/
├── unit/
│   ├── handlers/
│   │   ├── slack-events.test.ts       # Tests for Slack event processing
│   │   ├── slack-commands.test.ts     # Tests for Slack commands
│   │   └── ask-f8.test.ts             # Tests for Ask F8 handler
│   ├── services/
│   │   └── agent-router.test.ts       # Tests for agent routing logic
│   └── utils/
│       └── slack-verification.test.ts # Tests for Slack signature verification
├── integration/
│   └── api-endpoints.test.ts          # Integration tests for all API endpoints
└── performance/
    └── load-test.ts                   # Load and performance tests
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
npm test -- slack-events.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Verbose Output

```bash
npm test -- --verbose
```

## Test Coverage

The test suite provides comprehensive coverage across all critical components:

### Unit Test Coverage

- **Slack Events Handler** (9 tests)
  - App mention event processing
  - Message event processing
  - Bot message filtering
  - Error handling
  - Edge cases (empty text, missing fields)

- **Slack Commands Handler** (7 tests)
  - Command processing with usage tracking
  - Error responses
  - Context passing
  - Long text handling

- **Ask F8 Handler** (8 tests)
  - Request processing
  - Agent routing
  - Error handling
  - Special character handling

- **Agent Router Service** (12 tests)
  - Platform gateway routing
  - Direct agent routing
  - Keyword-based routing for all agent types
  - Fallback mechanisms
  - Error handling

- **Slack Verification** (9 tests)
  - Signature validation
  - Timestamp validation
  - Timing-safe comparison
  - Edge cases and security tests

### Integration Test Coverage

- **API Endpoints** (15 tests)
  - Health check endpoint
  - Slack Events API
  - Slack Commands API
  - Ask F8 API
  - Error handling (404, 400, 401, 500)
  - Security headers (CORS, Helmet)

### Performance Test Coverage

- Load testing for concurrent requests
- Response time consistency
- Memory leak detection
- Rate limiting validation
- Sustained load testing

## Unit Tests

Unit tests are located in `src/__tests__/unit/` and test individual functions and modules in isolation.

### Example: Testing Slack Event Handler

```typescript
import { processSlackEvent } from '../../../handlers/slack-events.js';
import { routeToAgent } from '../../../services/agent-router.js';

jest.mock('../../../services/agent-router.js');

it('should process app_mention event successfully', async () => {
  const mockEvent = {
    type: 'app_mention',
    text: '<@U1234567890> What are cannabis regulations?',
    channel: 'C1234567890',
    user: 'U9876543210',
  };

  mockRouteToAgent.mockResolvedValue({
    success: true,
    message: 'Cannabis regulations vary...',
  });

  const result = await processSlackEvent(mockEvent);
  
  expect(result.success).toBe(true);
});
```

### Running Unit Tests Only

```bash
npm test -- unit
```

## Integration Tests

Integration tests are located in `src/__tests__/integration/` and test the interaction between components and API endpoints.

### Example: Testing API Endpoint

```typescript
import request from 'supertest';
import { app } from '../../server';

it('should handle URL verification', async () => {
  const response = await request(app)
    .post('/api/slack/events')
    .set('X-Slack-Signature', 'v0=test_signature')
    .set('X-Slack-Request-Timestamp', timestamp)
    .send({
      type: 'url_verification',
      challenge: 'test_challenge_123'
    })
    .expect(200);

  expect(response.body.challenge).toBe('test_challenge_123');
});
```

### Running Integration Tests Only

```bash
npm test -- integration
```

## Performance Tests

Performance tests validate the system's behavior under load and are located in `src/__tests__/performance/`.

**Note**: Performance tests are disabled by default (using `.skip`) and should be run in a dedicated performance testing environment.

### Enabling Performance Tests

Remove the `.skip` from test descriptions:

```typescript
// Change from:
describe.skip('Health Endpoint Load Tests', () => {

// To:
describe('Health Endpoint Load Tests', () => {
```

### Running Performance Tests

```bash
# Set the service URL
export SLACKBOT_URL=https://your-service-url.com

# Run tests
npm test -- performance
```

### Performance Test Scenarios

1. **Concurrent Request Handling**
   - 100 concurrent health check requests
   - 500 concurrent health check requests
   - 50 concurrent event requests

2. **Sustained Load**
   - Multiple rounds of requests
   - Response time degradation monitoring

3. **Memory Management**
   - Memory leak detection
   - Resource cleanup validation

4. **Response Time Consistency**
   - Average, median, p95, p99 metrics
   - Performance assertions

## Writing New Tests

### Test File Naming Convention

- Unit tests: `*.test.ts`
- Integration tests: `*.test.ts`
- Location: Place tests near the code they test, under `__tests__/`

### Test Structure

```typescript
import { functionToTest } from '../path/to/module';

// Mock dependencies
jest.mock('../path/to/dependency');

describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  describe('functionToTest', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = await functionToTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });

    it('should handle errors gracefully', async () => {
      // Test error cases
    });
  });
});
```

### Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Isolation**: Mock external dependencies
3. **Coverage**: Test happy paths, error cases, and edge cases
4. **Assertions**: Be specific about expected behavior
5. **Cleanup**: Clear mocks between tests
6. **Async/Await**: Use async/await for asynchronous tests

### Example Test Template

```typescript
describe('New Feature', () => {
  it('should handle normal operation', async () => {
    // Test implementation
  });

  it('should handle invalid input', async () => {
    // Test error handling
  });

  it('should handle edge cases', async () => {
    // Test edge cases
  });
});
```

## Continuous Integration

Tests run automatically in CI/CD pipelines:

### GitHub Actions

Tests run on:
- Every push to main branch
- Every pull request
- Manual workflow dispatch

### Test Requirements

All tests must pass before:
- Merging pull requests
- Deploying to production
- Creating releases

### Coverage Requirements

- Minimum coverage: 80% overall
- Critical paths: 100% coverage
- New code: Must include tests

## Debugging Tests

### Run Tests with Debug Output

```bash
# Enable verbose logging
DEBUG=* npm test

# Run single test file with logging
npm test -- --testNamePattern="specific test name" --verbose
```

### Common Issues

1. **Mock Not Working**
   - Ensure mocks are defined before imports
   - Use `jest.clearAllMocks()` in `beforeEach`

2. **Async Test Timeout**
   - Increase timeout: `jest.setTimeout(30000)`
   - Check for unresolved promises

3. **Environment Variables**
   - Set test environment variables in `beforeEach`
   - Restore original values in `afterAll`

## Test Data Management

### Mock Data

Create reusable mock data in separate files:

```typescript
// __tests__/fixtures/slack-events.ts
export const mockAppMentionEvent = {
  type: 'app_mention',
  text: '<@U1234567890> test question',
  channel: 'C1234567890',
  user: 'U9876543210',
  ts: '1234567890.123456'
};
```

### Environment Setup

```typescript
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
  process.env.SLACK_SIGNING_SECRET = 'test_secret';
});

afterAll(() => {
  process.env = originalEnv;
});
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [TypeScript Jest Configuration](https://jestjs.io/docs/getting-started#via-ts-jest)

## Support

For questions about testing:
1. Review existing test examples
2. Check Jest documentation
3. Contact the F8AI development team

---

**Last Updated**: 2025-10-13  
**Test Suite Version**: 1.0.0  
**Total Tests**: 61 unit/integration + performance tests
