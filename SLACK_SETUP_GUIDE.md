# F8 Slackbot - Slack Integration Setup Guide

## Overview

The F8 Slackbot now includes **real Slack integration** that posts agent responses directly to your Slack workspace channels.

## ✅ What's New

- **Real-time Slack posting**: Responses are posted back to Slack channels
- **Threaded conversations**: Maintains conversation context in threads
- **Rich formatting**: Uses Slack blocks for beautiful message formatting
- **Agent attribution**: Shows which F8 agent responded
- **Error handling**: Gracefully handles Slack API errors

## 🔧 Setup Instructions

### Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it "F8 Agent" or similar
4. Select your workspace

### Step 2: Configure Bot Permissions

Under **OAuth & Permissions**, add these Bot Token Scopes:

Required scopes:
- `chat:write` - Post messages to channels
- `chat:write.public` - Post to channels without joining
- `channels:read` - View basic channel information
- `app_mentions:read` - Listen for @mentions
- `im:history` - View messages in direct messages
- `im:read` - View basic information about direct messages

### Step 3: Install App to Workspace

1. Go to **OAuth & Permissions**
2. Click "Install to Workspace"
3. Authorize the app
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Step 4: Get Signing Secret

1. Go to **Basic Information**
2. Under **App Credentials**, copy the **Signing Secret**

### Step 5: Configure Environment Variables

Create a `.env` file in the f8-slackbot directory:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-actual-bot-token-here
SLACK_SIGNING_SECRET=your-actual-signing-secret-here

# Platform Gateway URL
PLATFORM_GATEWAY_URL=https://f8.syzygyx.com

# OpenRouter API (if using OpenRouter for agent responses)
OPENROUTER_API_KEY=your-openrouter-key-here
```

### Step 6: Enable Event Subscriptions

1. Go to **Event Subscriptions** in your Slack app
2. Turn on **Enable Events**
3. Set Request URL to: `https://your-slackbot-url.com/api/slack/events`
   - Replace with your actual deployed URL
   - Slack will verify the URL is working

4. Subscribe to **Bot Events**:
   - `app_mention` - When someone @mentions the bot
   - `message.channels` - Messages in channels the bot is in
   - `message.im` - Direct messages to the bot

5. Click "Save Changes"

### Step 7: Enable Slash Commands (Optional)

1. Go to **Slash Commands**
2. Create a new command:
   - Command: `/f8`
   - Request URL: `https://your-slackbot-url.com/api/slack/commands`
   - Short Description: "Ask F8 AI agents a question"
   - Usage Hint: "[your question]"

### Step 8: Deploy the Service

Deploy to your preferred platform:

**AWS App Runner:**
```bash
npm run build
# Follow AWS App Runner deployment instructions
# Make sure to set environment variables in App Runner configuration
```

**Local Testing:**
```bash
npm run dev
# Use ngrok or similar to expose local server to internet
# ngrok http 3000
```

## 📡 How It Works

### Message Flow

```
User posts in Slack
       ↓
Slack sends event to F8 Slackbot
       ↓
F8 Slackbot processes question
       ↓
Routes to appropriate F8 agent
       ↓
Agent generates response
       ↓
F8 Slackbot posts response back to Slack
       ↓
User sees response in channel/thread
```

### Example Interaction

**User in #agents channel:**
```
@F8 How do I set up compliance tracking for my cannabis facility?
```

**F8 responds:**
```
📋 For compliance tracking in a cannabis facility, you'll want to implement:

1. **Master Control Records (MCR)** - Track all production batches
2. **Regular Testing** - Schedule COA (Certificate of Analysis) testing
3. **Inventory Management** - Real-time seed-to-sale tracking
4. **Documentation System** - Maintain all required state forms
5. **Audit Trail** - Log all changes to critical records

🤖 Agent: compliance | ⚡ Response Time: 245ms
```

## 🧪 Testing

### Test the Health Endpoint

```bash
curl https://your-slackbot-url.com/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "F8 Slackbot Microservice",
  "version": "1.0.0"
}
```

### Test Slack Event Processing

Post a message in a channel where the bot is invited and @mention it:
```
@F8 test message
```

Check the logs to see:
1. Event received
2. Agent routing
3. Response generated
4. Message posted to Slack

## 🔍 Troubleshooting

### Bot doesn't respond

**Check:**
1. Bot is invited to the channel (`/invite @F8`)
2. Environment variables are set correctly
3. Slack Event Subscriptions URL is verified
4. Check service logs for errors

### "Slack posting disabled" error

**Solution:**
- Make sure `SLACK_BOT_TOKEN` is set in environment variables
- Verify token starts with `xoxb-`
- Reinstall app to workspace if token is invalid

### Events received but no response posted

**Check:**
1. Service logs for Slack API errors
2. Bot has `chat:write` permission
3. Bot is in the channel (or has `chat:write.public`)
4. Check Slack API rate limits

### Signature verification fails

**Solution:**
- Verify `SLACK_SIGNING_SECRET` matches your app's signing secret
- Check for trailing spaces or newlines in the secret
- Regenerate signing secret if necessary

## 📊 Monitoring

### Key Metrics to Watch

1. **Event Processing Time** - Should be < 1s
2. **Slack API Success Rate** - Should be > 99%
3. **Agent Response Time** - Varies by agent
4. **Error Rate** - Should be < 1%

### Logs to Monitor

```bash
# Successful event processing
"Slack event processed successfully"

# Response posted
"Response posted to Slack channel"

# Errors
"Failed to post to Slack"
"Failed to process Slack event"
```

## 🎯 Best Practices

1. **Use Threads** - Keep conversations organized
2. **Rate Limiting** - Implement request queuing for high volume
3. **Error Messages** - Send helpful error messages to users
4. **Logging** - Log all interactions for debugging
5. **Monitoring** - Set up alerts for failures

## 🚀 Next Steps

Once configured:

1. Invite the bot to your `#agents` or test channel
2. @mention it with a question
3. Watch it respond in real-time!
4. Configure for your specific use case
5. Set up monitoring and alerts

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SLACK_BOT_TOKEN` | Yes | Bot OAuth token (xoxb-...) |
| `SLACK_SIGNING_SECRET` | Yes | For verifying Slack requests |
| `PLATFORM_GATEWAY_URL` | Yes | F8 gateway URL for routing |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (production/development) |
| `OPENROUTER_API_KEY` | Maybe | For OpenRouter-based agents |

## 🆘 Support

For issues or questions:
1. Check service logs
2. Review Slack App Event Subscriptions
3. Verify all permissions are granted
4. Test with `/health` endpoint first

---

**Happy Slacking with F8! 🤖✨**

