#!/bin/bash

echo "🔗 Setting up GitHub Connection for AWS App Runner"
echo "================================================="

# Configuration
AWS_REGION="us-east-1"
CONNECTION_NAME="f8-slackbot-github"

echo "📋 This script will help you set up a GitHub connection for App Runner"
echo ""
echo "Steps:"
echo "1. Go to AWS App Runner Console: https://console.aws.amazon.com/apprunner/"
echo "2. Click 'Connections' in the left sidebar"
echo "3. Click 'Create connection'"
echo "4. Choose 'GitHub' as the source"
echo "5. Click 'Connect to GitHub'"
echo "6. Authorize AWS App Runner in your GitHub account"
echo "7. Give it a name like: $CONNECTION_NAME"
echo "8. Click 'Create'"
echo ""
echo "After creating the connection, run:"
echo "aws apprunner list-connections --region $AWS_REGION"
echo ""
echo "Then update the deploy-github.sh script with the connection ARN"
echo ""

# Check if connection already exists
echo "🔍 Checking for existing connections..."
CONNECTION_ARN=$(aws apprunner list-connections --query "ConnectionSummaryList[?ConnectionName=='$CONNECTION_NAME'].ConnectionArn" --output text --region $AWS_REGION)

if [ -n "$CONNECTION_ARN" ]; then
    echo "✅ Connection already exists: $CONNECTION_ARN"
    echo "You can use this ARN in your deployment scripts"
else
    echo "❌ No connection found. Please create one using the steps above."
fi