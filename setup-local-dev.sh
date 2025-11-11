#!/bin/bash
# Setup script for local development

echo "🔧 Setting up local development environment..."
echo ""

# Create .env.local for local backend
cat > .env.local << EOF
# Local Development - Use local backend
BACKEND_URL=http://localhost:8000
EOF

echo "✅ Created .env.local with local backend URL"
echo ""
echo "📝 To switch back to AWS:"
echo "   Delete .env.local or run: rm .env.local"
echo ""
echo "🚀 Next steps:"
echo "   1. Start backend:  cd backend && ./start_server.sh"
echo "   2. Start frontend: npm run dev"
echo ""


