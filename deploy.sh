#!/bin/bash

echo "🚀 Rechnungs-Generator Deployment Script"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Environment checks passed"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build the application
echo "🏗️  Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "🎉 Your application is ready for deployment!"
    echo ""
    echo "Next steps:"
    echo "1. Set up a PostgreSQL database (recommended: Neon.tech)"
    echo "2. Deploy to Vercel, Railway, or Netlify"
    echo "3. Configure environment variables"
    echo "4. Run database migrations"
    echo ""
    echo "See QUICK_DEPLOY.md for detailed instructions."
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi
