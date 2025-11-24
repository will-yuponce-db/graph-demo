#!/bin/bash

# Script to run all linting, formatting, and tests
# Run this before committing or creating a PR

set -e  # Exit on error

echo "🚀 Running all checks..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Frontend checks
echo -e "${BLUE}📦 Frontend Checks${NC}"
echo "-------------------"

echo "1️⃣  Checking frontend linting..."
if npm run lint; then
    echo -e "${GREEN}✓ Frontend linting passed${NC}"
else
    echo -e "${RED}✗ Frontend linting failed${NC}"
    exit 1
fi
echo ""

echo "2️⃣  Checking frontend formatting..."
if npm run format:check; then
    echo -e "${GREEN}✓ Frontend formatting passed${NC}"
else
    echo -e "${RED}✗ Frontend formatting failed - run 'npm run format' to fix${NC}"
    exit 1
fi
echo ""

echo "3️⃣  Running frontend tests..."
if npm run test:run; then
    echo -e "${GREEN}✓ Frontend tests passed${NC}"
else
    echo -e "${RED}✗ Frontend tests failed${NC}"
    exit 1
fi
echo ""

# Backend checks
echo -e "${BLUE}📦 Backend Checks${NC}"
echo "-------------------"

echo "4️⃣  Checking backend linting..."
if (cd backend && npm run lint); then
    echo -e "${GREEN}✓ Backend linting passed${NC}"
else
    echo -e "${RED}✗ Backend linting failed${NC}"
    exit 1
fi
echo ""

echo "5️⃣  Running backend tests..."
if (cd backend && npm test); then
    echo -e "${GREEN}✓ Backend tests passed${NC}"
else
    echo -e "${RED}✗ Backend tests failed${NC}"
    exit 1
fi
echo ""

# Build check
echo -e "${BLUE}🔨 Build Check${NC}"
echo "-------------------"

echo "6️⃣  Building frontend..."
if npm run build; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ All checks passed!${NC}"
echo "================================"
echo ""
echo "Your code is ready to commit! 🎉"

