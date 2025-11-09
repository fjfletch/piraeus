"""Vercel serverless function handler."""

# This file is required for Vercel deployment
# It imports the FastAPI app and exposes it for serverless execution

import sys
from pathlib import Path

# Add the src directory to the path so imports work
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir / "src"))

from dynamic_tools.api.app import app

# Vercel will use this app instance
# No uvicorn.run() needed - Vercel handles that

