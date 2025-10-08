# F8 Slackbot - Quick Start

## 🚀 Repository Created Successfully!

**GitHub Repository**: https://github.com/F8ai/f8-slackbot

## Quick Setup

### 1. Clone the Repository
```bash
git clone https://github.com/F8ai/f8-slackbot.git
cd f8-slackbot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Environment Variables
```bash
cp .env.example .env
# Edit .env with your values:
# SLACK_BOT_TOKEN=xoxb-your-bot-token
# SLACK_SIGNING_SECRET=your-signing-secret
# PLATFORM_GATEWAY_URL=https://your-platform-gateway-url.awsapprunner.com
```

### 4. Deploy to AWS App Runner
```bash
# Set environment variables
export SLACK_BOT_TOKEN="xoxb-your-bot-token"
export SLACK_SIGNING_SECRET="your-signing-secret"
export PLATFORM_GATEWAY_URL="https://your-platform-gateway-url.awsapprunner.com"

# Deploy
./deploy.sh
```

### 5. Test the Deployment
```bash
# Test locally
npm run dev
node test.js

# Test deployed service
SLACKBOT_URL=https://your-slackbot-url.awsapprunner.com node test.js
```

## 📋 Next Steps

1. **Update Slack App Configuration** with the new service URL
2. **Test all endpoints** using the test script
3. **Monitor the deployment** in AWS App Runner console
4. **Update platform gateway** to route through slackbot service (optional)

## 📚 Documentation

- [README.md](./README.md) - Complete service documentation
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Migration from monolith
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - Deployment overview

## 🆘 Support

- Check CloudWatch logs for issues
- Run the test script to verify functionality
- Review the migration guide for troubleshooting

---

**Status**: ✅ Ready for deployment  
**Repository**: https://github.com/F8ai/f8-slackbot  
**URL Compatibility**: ✅ Maintained