#!/bin/bash

echo "🚀 F8 Slackbot Microservice Deployment"
echo "======================================"

# Configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY="f8-slackbot"
APP_RUNNER_SERVICE="f8-slackbot"

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
echo "   ECR Repository: $ECR_REPOSITORY"
echo "   App Runner Service: $APP_RUNNER_SERVICE"
echo "   Platform Gateway: ${PLATFORM_GATEWAY_URL:-'Not set'}"
echo ""

# Build and push Docker image
echo "🔨 Building and pushing Docker image..."

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Login to ECR
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Create ECR repository if it doesn't exist
echo "📦 Creating ECR repository if needed..."
aws ecr describe-repositories --repository-names $ECR_REPOSITORY --region $AWS_REGION 2>/dev/null || \
aws ecr create-repository --repository-name $ECR_REPOSITORY --region $AWS_REGION

# Build and push image
IMAGE_TAG="latest"
FULL_IMAGE_NAME="$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG"

echo "🏗️  Building Docker image..."
docker build -t $FULL_IMAGE_NAME .

echo "📤 Pushing image to ECR..."
docker push $FULL_IMAGE_NAME

# Deploy to App Runner
echo "🚀 Deploying to App Runner..."

# Check if service exists
SERVICE_ARN=$(aws apprunner list-services --query "ServiceSummaryList[?ServiceName=='$APP_RUNNER_SERVICE'].ServiceArn" --output text)

if [ -z "$SERVICE_ARN" ]; then
    echo "🆕 Creating new App Runner service..."
    aws apprunner create-service \
        --service-name $APP_RUNNER_SERVICE \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$FULL_IMAGE_NAME\",
                \"ImageConfiguration\": {
                    \"RuntimeEnvironmentVariables\": {
                        \"NODE_ENV\": \"production\",
                        \"PORT\": \"3000\",
                        \"LOG_LEVEL\": \"info\",
                        \"SLACK_BOT_TOKEN\": \"$SLACK_BOT_TOKEN\",
                        \"SLACK_SIGNING_SECRET\": \"$SLACK_SIGNING_SECRET\",
                        \"PLATFORM_GATEWAY_URL\": \"$PLATFORM_GATEWAY_URL\"
                    },
                    \"Port\": \"3000\"
                },
                \"ImageRepositoryType\": \"ECR\"
            },
            \"AutoDeploymentsEnabled\": true
        }" \
        --instance-configuration '{
            "Cpu": "0.25 vCPU",
            "Memory": "0.5 GB"
        }' \
        --region $AWS_REGION
else
    echo "🔄 Updating existing App Runner service..."
    aws apprunner update-service \
        --service-arn $SERVICE_ARN \
        --source-configuration "{
            \"ImageRepository\": {
                \"ImageIdentifier\": \"$FULL_IMAGE_NAME\",
                \"ImageConfiguration\": {
                    \"RuntimeEnvironmentVariables\": {
                        \"NODE_ENV\": \"production\",
                        \"PORT\": \"3000\",
                        \"LOG_LEVEL\": \"info\",
                        \"SLACK_BOT_TOKEN\": \"$SLACK_BOT_TOKEN\",
                        \"SLACK_SIGNING_SECRET\": \"$SLACK_SIGNING_SECRET\",
                        \"PLATFORM_GATEWAY_URL\": \"$PLATFORM_GATEWAY_URL\"
                    },
                    \"Port\": \"3000\"
                },
                \"ImageRepositoryType\": \"ECR\"
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
else
    echo "❌ Health check failed!"
    echo "   Service URL: $SERVICE_URL"
    echo "   Check AWS App Runner console for details"
    exit 1
fi