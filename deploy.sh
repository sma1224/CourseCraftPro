#!/bin/bash

# Course Creation Suite - Production Deployment Script
# This script helps deploy your app to various platforms

echo "🚀 Course Creation Suite - Deployment Helper"
echo "============================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to deploy to Docker
deploy_docker() {
    echo "🐳 Deploying with Docker..."
    
    if ! command_exists docker; then
        echo "❌ Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Build and run with docker-compose
    echo "Building and starting containers..."
    docker-compose up --build -d
    
    echo "✅ Docker deployment completed!"
    echo "Your app should be running at: http://localhost:5000"
    echo "To stop: docker-compose down"
}

# Function to deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    
    if ! command_exists vercel; then
        echo "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    echo "Starting Vercel deployment..."
    vercel --prod
    
    echo "✅ Vercel deployment completed!"
}

# Function to build for production
build_production() {
    echo "🏗️  Building for production..."
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Build the application
    echo "Building application..."
    npm run build
    
    echo "✅ Production build completed!"
    echo "You can now deploy the built files manually or use pm2:"
    echo "  pm2 start dist/index.js --name course-creation-suite"
}

# Function to setup environment
setup_environment() {
    echo "⚙️  Setting up environment variables..."
    
    if [ ! -f ".env" ]; then
        echo "Creating .env file..."
        cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/course_creation_suite

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Environment
NODE_ENV=production
EOF
        echo "✅ .env file created! Please edit it with your actual values."
    else
        echo "✅ .env file already exists."
    fi
}

# Main menu
echo ""
echo "What would you like to do?"
echo "1) Build for production (manual deployment)"
echo "2) Deploy with Docker"
echo "3) Deploy to Vercel"
echo "4) Setup environment variables"
echo "5) Show deployment requirements"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        build_production
        ;;
    2)
        deploy_docker
        ;;
    3)
        deploy_vercel
        ;;
    4)
        setup_environment
        ;;
    5)
        echo "📋 Deployment Requirements:"
        echo "- Node.js 18+ (for all platforms)"
        echo "- PostgreSQL database"
        echo "- OpenAI API key"
        echo "- Environment variables configured"
        echo ""
        echo "💡 Recommended platforms:"
        echo "- Vercel (easiest for full-stack apps)"
        echo "- Railway (includes database)"
        echo "- DigitalOcean App Platform"
        echo "- Docker (any VPS)"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac