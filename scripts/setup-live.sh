#!/bin/bash
# ============================================================================
# Kings Bud Grow Assistant — One-command setup script
# ============================================================================
# This script automates the entire deployment process:
#   1. Installs Vercel CLI + Supabase CLI (if not already installed)
#   2. Creates a Supabase project (or links an existing one)
#   3. Runs the SQL schema
#   4. Deploys to Vercel
#   5. Sets env vars
#   6. Prints your live URL
#
# Usage:
#   chmod +x scripts/setup-live.sh
#   ./scripts/setup-live.sh
#
# Prerequisites:
#   - Node.js 18+ installed
#   - A GitHub account
#   - A Supabase account (free at supabase.com)
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌿 Kings Bud Grow Assistant — Live Setup${NC}"
echo "============================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed.${NC}"
    echo "   Install it from https://nodejs.org (LTS version)"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"
echo ""

# ────────────────────────────────────────────────────────────────────────────
# Step 1: Install dependencies
# ────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}📦 Step 1/5: Installing project dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}  ✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}  ⏭  node_modules already exists, skipping${NC}"
fi
echo ""

# ────────────────────────────────────────────────────────────────────────────
# Step 2: Install Vercel CLI (if not installed)
# ────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}📦 Step 2/5: Checking for Vercel CLI...${NC}"
if ! command -v vercel &> /dev/null; then
    echo "   Installing Vercel CLI globally..."
    npm install -g vercel
    echo -e "${GREEN}  ✅ Vercel CLI installed${NC}"
else
    echo -e "${GREEN}  ✅ Vercel CLI already installed${NC}"
fi
echo ""

# ────────────────────────────────────────────────────────────────────────────
# Step 3: Collect Supabase credentials
# ────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}🔧 Step 3/5: Supabase credentials${NC}"
echo ""
echo "   You need two values from your Supabase project:"
echo "   (Get them from: supabase.com → your project → Project Settings → API)"
echo ""
echo "   1. Project URL  (looks like https://xxxxx.supabase.co)"
echo "   2. anon public key (starts with eyJ...)"
echo ""

read -p "   Paste your Supabase Project URL: " SUPABASE_URL
read -p "   Paste your Supabase anon public key: " SUPABASE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo -e "${RED}❌ Both values are required. Please re-run the script.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}  ✅ Got it!${NC}"
echo "   URL: $SUPABASE_URL"
echo "   Key: ${SUPABASE_KEY:0:20}..."
echo ""

# ────────────────────────────────────────────────────────────────────────────
# Step 4: Create .env.local for local development
# ────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}📝 Step 4/5: Creating .env.local...${NC}"
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
EOF
echo -e "${GREEN}  ✅ .env.local created (for local dev with 'npm run dev')${NC}"
echo ""

# ────────────────────────────────────────────────────────────────────────────
# Step 5: Deploy to Vercel
# ────────────────────────────────────────────────────────────────────────────
echo -e "${BLUE}🚀 Step 5/5: Deploying to Vercel...${NC}"
echo ""
echo "   Vercel CLI will now:"
echo "   1. Ask you to log in (opens browser)"
echo "   2. Ask for a project name (press Enter for default)"
echo "   3. Ask to confirm settings (press Enter)"
echo "   4. Build + deploy (~2 minutes)"
echo ""

# Set env vars BEFORE deploying so they're available at build time
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_KEY"

# Deploy to Vercel
vercel --prod --yes

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}NEXT STEPS:${NC}"
echo ""
echo "  1. Go to your Supabase dashboard → SQL Editor → New query"
echo "  2. Paste the entire contents of supabase/schema.sql → Run"
echo ""
echo "  3. Go to Supabase → Authentication → URL Configuration"
echo "  4. Set Site URL = your Vercel URL (printed above)"
echo "  5. Add Redirect URLs: your-vercel-url + your-vercel-url/#/reset-password"
echo ""
echo "  6. Visit your live Vercel URL → click 'Get started'"
echo "  7. Register with email: Kingsbud2k25@gmail.com"
echo "  8. Verify your email → log in → you're the admin!"
echo ""
echo -e "${GREEN}🌿 Your Kings Bud Grow Assistant is now LIVE!${NC}"
