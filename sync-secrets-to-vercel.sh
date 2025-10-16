#!/bin/bash

# Script to sync GitHub Secrets to Vercel Environment Variables
# This uses GitHub CLI to retrieve secrets and Vercel CLI to set them

set -e

echo "🔄 Syncing GitHub Secrets to Vercel..."
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI is not installed${NC}"
    echo "Install it with: npm install -g vercel"
    exit 1
fi

# List of secrets to sync
SECRETS=(
    "SLACK_BOT_TOKEN"
    "SLACK_SIGNING_SECRET"
    "OPENROUTER_API_KEY"
    "PLATFORM_GATEWAY_URL"
)

echo -e "${YELLOW}📋 Secrets to sync:${NC}"
for secret in "${SECRETS[@]}"; do
    echo "   - $secret"
done
echo ""

# Function to sync a secret
sync_secret() {
    local secret_name=$1
    
    echo -e "${YELLOW}Syncing ${secret_name}...${NC}"
    
    # Get the secret value from GitHub
    # Note: GitHub Secrets API doesn't allow reading values directly
    # This will prompt the user or use stored credentials
    
    # Instead, let's use the GitHub Actions approach
    echo -e "${YELLOW}⚠️  GitHub Secrets cannot be read directly via CLI for security reasons${NC}"
    echo -e "${YELLOW}Please enter the value for ${secret_name}:${NC}"
    
    # Add to Vercel
    vercel env add "$secret_name" production
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ ${secret_name} synced to Vercel${NC}"
    else
        echo -e "${RED}❌ Failed to sync ${secret_name}${NC}"
    fi
    echo ""
}

# Sync each secret
for secret in "${SECRETS[@]}"; do
    sync_secret "$secret"
done

echo -e "${GREEN}✅ Secret sync complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Redeploy to apply the new environment variables: vercel --prod"
echo "2. Verify deployment: vercel logs"
echo "3. Test the endpoints"

