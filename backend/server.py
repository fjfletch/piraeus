"""FastAPI server entry point for uvicorn."""

from src.dynamic_tools.api.app import app

# This allows uvicorn to import and run the app
# Usage: uvicorn server:app --host 0.0.0.0 --port 8001
