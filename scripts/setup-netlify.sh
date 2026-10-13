#!/bin/bash
# ============================================================================
# Kings Bud Grow Assistant — Netlify + Supabase one-command setup
# ============================================================================
# This script automates the entire deployment process for Netlify:
#   1. Installs dependencies (including @netlify/plugin-nextjs)
#   2. Collects Supabase credentials
#   3. Creates .env.local for local dev
#   4. Deploys to Netlify using Netlify CLI
#
# Usage:
#   chmod +x scripts/setup-netlify.sh
#   ./scripts/setup-netlify.sh
# ============================================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}🌿 Kings Bud Grow Assistant — Netlify Setup${NC}"
echo "============================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Install from https://nodejs.org"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"

# Step 1: Install dependencies
echo ""
echo -e "${BLUE}📦 Step 1/4: Installing dependencies...${NC}"
npm install
echo -e "${GREEN}  ✅ Dependencies installed${NC}"

# Step 2: Install Netlify CLI
echo ""
echo -e "${BLUE}📦 Step 2/4: Checking Netlify CLI...${NC}"
if ! command -v netlify &> /dev/null; then
    echo "   Installing Netlify CLI globally..."
    npm install -g netlify-cli
    echo -e "${GREEN}  ✅ Netlify CLI installed${NC}"
else
    echo -e "${GREEN}  ✅ Netlify CLI already installed${NC}"
fi

# Step 3: Collect Supabase credentials
echo ""
echo -e "${BLUE}🔧 Step 3/4: Supabase credentials${NC}"
echo ""
echo "   Get these from: supabase.com → your project → Project Settings → API"
echo ""
read -p "   Paste your Supabase Project URL (https://xxxxx.supabase.co): " SUPABASE_URL
read -p "   Paste your Supabase anon public key (eyJ...): " SUPABASE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ Both values are required."
    exit 1
fi

# Create .env.local for local dev
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_KEY
EOF
echo ""
echo -e "${GREEN}  ✅ .env.local created${NC}"

# Step 4: Deploy to Netlify
echo ""
echo -e "${BLUE}🚀 Step 4/4: Deploying to Netlify...${NC}"
echo ""
echo "   Netlify CLI will:"
echo "   1. Ask you to log in (opens browser)"
echo "   2. Ask for a site name (press Enter for random)"
echo "   3. Build + deploy (~2 minutes)"
echo ""

# Set env vars for the build
export NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_KEY"

# Deploy
netlify deploy --build --prod

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🎉 DEPLOYED TO NETLIFY!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════${NC}"
echo ""
echo "NEXT STEPS:"
echo ""
echo "  1. Run the SQL schema:"
echo "     Go to Supabase → SQL Editor → paste supabase/schema.sql → Run"
echo ""
echo "  2. Set auth redirect URLs:"
echo "     Supabase → Authentication → URL Configuration"
echo "     Set Site URL = your Netlify URL (printed above)"
echo "     Add Redirect URLs: your-netlify-url + your-netlify-url/#/reset-password"
echo ""
echo "  3. Add env vars in Netlify dashboard:"
echo "     Netlify → your site → Site settings → Environment variables"
echo "     Add NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "     Then: Deploys → Trigger deploy"
echo ""
echo "  4. Register the owner account:"
echo "     Visit your live URL → Get started → email: Kingsbud2k25@gmail.com"
echo ""
echo -e "${GREEN}🌿 Your Kings Bud Grow Assistant is now LIVE on Netlify!${NC}"
echo -e "${GREEN}   Multi-device sync works automatically via Supabase Realtime.${NC}"
