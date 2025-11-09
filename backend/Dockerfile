FROM python:3.12-slim

WORKDIR /app

# Install system dependencies and uv
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies (including dev) using uv
RUN uv sync --dev

# Copy application code
COPY . .

# Expose port for API service
EXPOSE 8000

# Default command - run API service using uv run
CMD ["uv", "run", "python", "-m", "uvicorn", "dynamic_tools.api.app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

