# F8 Slackbot Microservice Migration Guide

## Overview

This guide explains how to migrate from the monolithic Formul8 platform to the new f8-slackbot microservice while maintaining the same URLs and functionality.

## Migration Benefits

- ✅ **Same URLs** - No changes needed in Slack app configuration
- ✅ **Independent Scaling** - Slackbot can scale independently
- ✅ **Fault Isolation** - Slackbot issues don't affect other services
- ✅ **Easier Maintenance** - Dedicated codebase for Slack functionality
- ✅ **Better Performance** - Optimized specifically for Slack interactions

## URL Compatibility

The microservice maintains the exact same URL structure:

| Endpoint | Original URL | New URL | Status |
|----------|-------------|---------|---------|
| Health Check | `GET /health` | `GET /health` | ✅ Same |
| Slack Events | `POST /api/slack/events` | `POST /api/slack/events` | ✅ Same |
| Slack Commands | `POST /api/slack/commands` | `POST /api/slack/commands` | ✅ Same |
| Ask F8 | `POST /api/slack/ask-f8` | `POST /api/slack/ask-f8` | ✅ Same |

## Migration Steps

### Step 1: Deploy F8 Slackbot Microservice

1. **Clone the f8-slackbot repository**
   ```bash
   git clone <f8-slackbot-repo-url>
   cd f8-slackbot
   ```

2. **Set environment variables**
   ```bash
   export SLACK_BOT_TOKEN="xoxb-your-bot-token"
   export SLACK_SIGNING_SECRET="your-signing-secret"
   export PLATFORM_GATEWAY_URL="https://platform-gateway-url.awsapprunner.com"
   ```

3. **Deploy to AWS App Runner**
   ```bash
   ./deploy.sh
   ```

4. **Note the new service URL**
   The deployment will output the new service URL (e.g., `https://f8-slackbot-xyz.awsapprunner.com`)

### Step 2: Update Slack App Configuration

1. **Go to your Slack App settings** (https://api.slack.com/apps)
2. **Update Event Subscriptions**
   - Event Request URL: `https://f8-slackbot-xyz.awsapprunner.com/api/slack/events`
3. **Update Slash Commands**
   - Request URL: `https://f8-slackbot-xyz.awsapprunner.com/api/slack/commands`
4. **Update Interactive Components** (if using)
   - Request URL: `https://f8-slackbot-xyz.awsapprunner.com/api/slack/ask-f8`

### Step 3: Update Platform Gateway (Optional)

If you want to route Slack requests through the platform gateway:

1. **Add slackbot routing to platform gateway**
   ```typescript
   // In platform gateway
   app.post('/api/slack/*', (req, res) => {
     // Proxy to slackbot microservice
     const slackbotUrl = process.env.SLACKBOT_SERVICE_URL;
     // Forward request to slackbot service
   });
   ```

2. **Set environment variable**
   ```bash
   export SLACKBOT_SERVICE_URL="https://f8-slackbot-xyz.awsapprunner.com"
   ```

### Step 4: Remove Slackbot from Main Platform

1. **Remove Slack endpoints from main server**
   ```typescript
   // Remove these from src/server.ts:
   // - /api/slack/events
   // - /api/slack/commands  
   // - /api/slack/ask-f8
   ```

2. **Remove Slack-related dependencies**
   ```bash
   npm uninstall @slack/bolt
   ```

3. **Update documentation**
   - Remove Slack endpoints from API documentation
   - Update architecture diagrams

### Step 5: Test Migration

1. **Test health endpoint**
   ```bash
   curl https://f8-slackbot-xyz.awsapprunner.com/health
   ```

2. **Test Slack events** (in Slack)
   - Mention the bot: `@f8bot hello`
   - Use slash command: `/f8 tell me about cannabis regulations`

3. **Test Ask F8 endpoint**
   ```bash
   curl -X POST https://f8-slackbot-xyz.awsapprunner.com/api/slack/ask-f8 \
     -H "Content-Type: application/json" \
     -d '{"question": "What are cannabis regulations?", "channel": "#test", "user": "test"}'
   ```

## Rollback Plan

If issues occur, you can quickly rollback:

1. **Revert Slack app configuration** to original URLs
2. **Redeploy main platform** with Slackbot endpoints restored
3. **Scale down slackbot service** to 0 instances

## Environment Variables

### F8 Slackbot Microservice

```env
# Required
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret

# Optional (preferred)
PLATFORM_GATEWAY_URL=https://platform-gateway-url.awsapprunner.com

# Optional (fallback)
COMPLIANCE_AGENT_URL=https://compliance-agent-url.awsapprunner.com
FORMULATION_AGENT_URL=https://formulation-agent-url.awsapprunner.com
# ... other agent URLs
```

### Platform Gateway (if routing through it)

```env
SLACKBOT_SERVICE_URL=https://f8-slackbot-xyz.awsapprunner.com
```

## Monitoring

### Health Checks

- **Slackbot Service**: `GET https://f8-slackbot-xyz.awsapprunner.com/health`
- **Platform Gateway**: `GET https://platform-gateway-url.awsapprunner.com/health`

### CloudWatch Metrics

Monitor these metrics in AWS CloudWatch:
- Request count
- Response time
- Error rate
- CPU utilization
- Memory utilization

### Logs

- **Slackbot logs**: CloudWatch Logs for f8-slackbot service
- **Platform logs**: CloudWatch Logs for platform gateway

## Troubleshooting

### Common Issues

1. **Slack signature verification fails**
   - Check `SLACK_SIGNING_SECRET` is correct
   - Verify request timestamp is within 5 minutes

2. **Agent routing fails**
   - Check `PLATFORM_GATEWAY_URL` is correct
   - Verify platform gateway is healthy
   - Check individual agent URLs if using direct routing

3. **Health check fails**
   - Check service is running
   - Verify port 3000 is exposed
   - Check CloudWatch logs for errors

### Debug Commands

```bash
# Check service status
aws apprunner describe-service --service-arn <service-arn>

# View logs
aws logs tail /aws/apprunner/f8-slackbot --follow

# Test endpoints
curl -v https://f8-slackbot-xyz.awsapprunner.com/health
```

## Support

For issues or questions:
1. Check CloudWatch logs
2. Verify environment variables
3. Test individual endpoints
4. Contact F8AI development team

## Next Steps

After successful migration:
1. Monitor performance and error rates
2. Optimize scaling settings based on usage
3. Add additional Slack features (modals, buttons, etc.)
4. Implement advanced monitoring and alerting