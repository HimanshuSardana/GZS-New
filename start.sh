#!/bin/bash
set -e

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║       GzoneSphere Dev Stack Startup        ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found. Install Node 20+"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 not found. Install Python 3.11+"; exit 1; }
command -v go >/dev/null 2>&1 || { echo "❌ Go not found. Install Go 1.21+"; exit 1; }

echo "✅ Prerequisites OK"
echo ""
echo "Starting services..."
echo "  → Frontend  : http://localhost:5173"
echo "  → Core API  : http://localhost:8000  (docs: /docs)"
echo "  → CMS API   : http://localhost:8081"
echo "  → Core Stats: http://localhost:8000/health"
echo "  → CMS Stats : http://localhost:8081/stats/ui"
echo ""

npm run dev:all
