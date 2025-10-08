#!/bin/bash

echo "🚀 F8 Slackbot Microservice Deployment (GitHub Integration)"
echo "=========================================================="

# Configuration
AWS_REGION="us-east-1"
APP_RUNNER_SERVICE="f8-slackbot"
GITHUB_REPO="https://github.com/f8ai/f8-slackbot"

# Check if required environment variables are set
if [ -z "$SLACK_BOT_TOKEN" ]; then
    echo "❌ SLACK_BOT_TOKEN environment variable is required"
    exit 1
fi

if [ -z "$SLACK_SIGNING_SECRET" ]; then
    echo "❌ SLACK_SIGNING_SECRET environment variable is required"
    exit 1
fi

if [ -z "$PLATFORM_GATEWAY_URL" ]; then
    echo "⚠️  PLATFORM_GATEWAY_URL not set, will use direct agent routing"
fi

echo "📋 Configuration:"
echo "   AWS Region: $AWS_REGION"
echo "   App Runner Service: $APP_RUNNER_SERVICE"
echo "   GitHub Repository: $GITHUB_REPO"
echo "   Platform Gateway: ${PLATFORM_GATEWAY_URL:-'Not set'}"
echo ""

# Deploy to App Runner using GitHub integration
echo "🚀 Deploying to App Runner with GitHub integration..."

# Check if service exists
SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceArn" --output text)

if [ -z "$SERVICE_ARN" ]; then
    echo "🆕 Creating new App Runner service with GitHub source..."
    aws apprunner create-service \
        --service-name $APP_RUNNER_SERVICE \
        --source-configuration "{
            \"CodeRepository\": {
                \"RepositoryUrl\": \"$GITHUB_REPO\",
                \"SourceCodeVersion\": {
                    \"Type\": \"BRANCH\",
                    \"Value\": \"main\"
                },
                \"CodeConfiguration\": {
                    \"ConfigurationSource\": \"REPOSITORY\",
                    \"CodeConfigurationValues\": {
                        \"Runtime\": \"NODEJS_18\",
                        \"BuildCommand\": \"npm run build\",
                        \"StartCommand\": \"npm start\",
                        \"RuntimeEnvironmentVariables\": {
                            \"NODE_ENV\": \"production\",
                            \"PORT\": \"3000\",
                            \"LOG_LEVEL\": \"info\",
                            \"SLACK_BOT_TOKEN\": \"$SLACK_BOT_TOKEN\",
                            \"SLACK_SIGNING_SECRET\": \"$SLACK_SIGNING_SECRET\",
                            \"PLATFORM_GATEWAY_URL\": \"$PLATFORM_GATEWAY_URL\"
                        }
                    }
                }
            },
            \"AutoDeploymentsEnabled\": true
        }" \
        --instance-configuration '{
            "Cpu": "0.25 vCPU",
            "Memory": "0.5 GB"
        }' \
        --region $AWS_REGION
else
    echo "🔄 Updating existing App Runner service with GitHub source..."
    aws apprunner update-service \
        --service-arn $SERVICE_ARN \
        --source-configuration "{
            \"CodeRepository\": {
                \"RepositoryUrl\": \"$GITHUB_REPO\",
                \"SourceCodeVersion\": {
                    \"Type\": \"BRANCH\",
                    \"Value\": \"main\"
                },
                \"CodeConfiguration\": {
                    \"ConfigurationSource\": \"REPOSITORY\",
                    \"CodeConfigurationValues\": {
                        \"Runtime\": \"NODEJS_18\",
                        \"BuildCommand\": \"npm run build\",
                        \"StartCommand\": \"npm start\",
                        \"RuntimeEnvironmentVariables\": {
                            \"NODE_ENV\": \"production\",
                            \"PORT\": \"3000\",
                            \"LOG_LEVEL\": \"info\",
                            \"SLACK_BOT_TOKEN\": \"$SLACK_BOT_TOKEN\",
                            \"SLACK_SIGNING_SECRET\": \"$SLACK_SIGNING_SECRET\",
                            \"PLATFORM_GATEWAY_URL\": \"$PLATFORM_GATEWAY_URL\"
                        }
                    }
                }
            },
            \"AutoDeploymentsEnabled\": true
        }" \
        --region $AWS_REGION
fi

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
sleep 60

# Get service URL
SERVICE_URL=$(aws apprunner describe-service --service-arn $SERVICE_ARN --query "Service.ServiceUrl" --output text 2>/dev/null || \
aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceUrl" --output text)

# Test deployment
echo "🧪 Testing deployment..."
if curl -f "$SERVICE_URL/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    echo ""
    echo "🎉 F8 Slackbot deployed successfully!"
    echo "🌐 Service URL: $SERVICE_URL"
    echo ""
    echo "📝 Update your Slack app configuration with:"
    echo "   Events URL: $SERVICE_URL/api/slack/events"
    echo "   Slash Command URL: $SERVICE_URL/api/slack/commands"
    echo "   Interactive Components URL: $SERVICE_URL/api/slack/ask-f8"
    echo ""
    echo "🔧 Environment Variables Set:"
    echo "   ✅ SLACK_BOT_TOKEN"
    echo "   ✅ SLACK_SIGNING_SECRET"
    echo "   ${PLATFORM_GATEWAY_URL:+✅ PLATFORM_GATEWAY_URL}"
    echo "   ${PLATFORM_GATEWAY_URL:-⚠️  PLATFORM_GATEWAY_URL (not set - using direct routing)}"
    echo ""
    echo "🚀 Benefits of GitHub Integration:"
    echo "   ✅ No ECR needed - direct from GitHub"
    echo "   ✅ Automatic deployments on push to main"
    echo "   ✅ Faster deployment process"
    echo "   ✅ Simpler configuration"
else
    echo "❌ Health check failed!"
    echo "   Service URL: $SERVICE_URL"
    echo "   Check AWS App Runner console for details"
    exit 1
fi