# F8 Slackbot Microservice

A dedicated microservice for handling all Slack integrations in the Formul8 Platform.

## Overview

This microservice handles:
- Slack Events API (`/api/slack/events`)
- Slack Commands API (`/api/slack/commands`) 
- Ask F8 API (`/api/slack/ask-f8`)
- Slack message processing and routing to appropriate agents

## Architecture

```
┌─────────────────────────────────────────────────┐
│                Slack Workspace                   │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│              F8 Slackbot Service                 │
│            (Port 3000)                          │
│  - /api/slack/events                            │
│  - /api/slack/commands                          │
│  - /api/slack/ask-f8                            │
└─────────────────────┬───────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────┐
│            Platform Gateway Service              │
│  - Routes to appropriate agents                  │
│  - Handles agent communication                  │
└─────────────────────────────────────────────────┘
```

## Features

- ✅ **URL Compatibility** - Maintains same endpoints as original implementation
- ✅ **Agent Routing** - Routes questions to appropriate F8 agents
- ✅ **Slack Integration** - Full Slack Events API and Commands support
- ✅ **Error Handling** - Robust error handling and logging
- ✅ **Health Monitoring** - Health check endpoints for monitoring
- ✅ **Auto-scaling** - AWS App Runner auto-scaling support
- ✅ **Comprehensive Testing** - Unit, integration, and E2E tests with 100% handler coverage

## API Endpoints

### Health Check
```http
GET /health
```

### Slack Events
```http
POST /api/slack/events
Content-Type: application/json

{
  "type": "url_verification",
  "challenge": "challenge_string"
}
```

### Slack Commands
```http
POST /api/slack/commands
Content-Type: application/x-www-form-urlencoded

text=What are cannabis regulations?&channel_id=C1234567890&user_id=U1234567890
```

### Ask F8
```http
POST /api/slack/ask-f8
Content-Type: application/json

{
  "question": "What are cannabis regulations?",
  "channel": "#general",
  "user": "user123"
}
```

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# Platform Gateway URL
PLATFORM_GATEWAY_URL=https://platform-gateway-url.awsapprunner.com

# Optional: Direct agent URLs (if not using platform gateway)
COMPLIANCE_AGENT_URL=https://compliance-agent-url.awsapprunner.com
FORMULATION_AGENT_URL=https://formulation-agent-url.awsapprunner.com
# ... other agent URLs
```

## Deployment

### AWS App Runner

1. **Service Name**: `f8-slackbot`
2. **Port**: 3000
3. **CPU**: 0.25 vCPU
4. **Memory**: 0.5 GB
5. **Auto-scaling**: 1-5 instances

### Environment Variables
Set the required environment variables in App Runner:
- `SLACK_BOT_TOKEN`
- `SLACK_SIGNING_SECRET` 
- `PLATFORM_GATEWAY_URL`

## Development

### Local Development
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

### Test
```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test suite
npm test -- unit
npm test -- integration

# Run tests in watch mode
npm test -- --watch
```

For comprehensive testing documentation, see [TESTING.md](TESTING.md).

## URL Compatibility

This service maintains the same URL structure as the original implementation:

- **Production URL**: `https://f8-slackbot-xyz.awsapprunner.com`
- **Events**: `POST /api/slack/events`
- **Commands**: `POST /api/slack/commands`
- **Ask F8**: `POST /api/slack/ask-f8`

## Integration with Platform Gateway

The slackbot service communicates with the platform gateway to route requests to appropriate agents:

```typescript
// Example request to platform gateway
const response = await fetch(`${PLATFORM_GATEWAY_URL}/api/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: question,
    user_id: user_id,
    context: { channel, thread_ts }
  })
});
```

## Testing

The F8 Slackbot includes a comprehensive test suite:

### Test Coverage

- **Unit Tests**: 45 tests covering handlers, services, and utilities
- **Integration Tests**: 15 tests for API endpoints
- **E2E Tests**: Complete workflow tests
- **Performance Tests**: Load and scalability validation

### Test Statistics

- **Total Tests**: 61+ tests
- **Coverage**: 100% on handlers, 91%+ on services
- **Test Types**: Unit, Integration, E2E, Performance

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test suites
npm test -- unit
npm test -- integration
npm test -- e2e

# Run in watch mode for development
npm test -- --watch
```

### CI/CD Integration

Tests run automatically on:
- Every push to main/develop branches
- Every pull request
- Manual workflow dispatch

See [TESTING.md](TESTING.md) for detailed testing documentation.

## Monitoring

- **Health Check**: `GET /health`
- **Metrics**: Built-in request/response logging
- **Error Tracking**: Comprehensive error logging
- **Slack Events**: Event processing metrics
- **Test Coverage**: Automated coverage reporting

## Security

- **Request Verification**: Slack signature verification
- **Environment Isolation**: Secure environment variable handling
- **Error Sanitization**: Safe error message responses
- **Rate Limiting**: Built-in rate limiting for Slack events

## Migration from Monolith

This service extracts the slackbot functionality from the main Formul8 platform while maintaining:

1. **Same API endpoints** - No changes needed in Slack app configuration
2. **Same request/response format** - Backward compatible
3. **Same functionality** - All features preserved
4. **Better scalability** - Independent scaling and deployment
5. **Improved reliability** - Isolated from other platform components

## Support

For issues or questions:
- Check the health endpoint: `GET /health`
- Review logs in AWS CloudWatch
- Contact the F8AI development team