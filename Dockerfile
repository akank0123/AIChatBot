FROM python:3.10-slim

WORKDIR /app

# Install uv
RUN pip install uv --quiet

# Copy dependency files first (Docker layer caching — only reinstalls if these change)
COPY pyproject.toml ./

# Install production dependencies only
RUN uv sync --no-dev

# Copy source code
COPY backend/ ./backend/
COPY ai/      ./ai/
COPY .env     ./.env

# Expose port
EXPOSE 8000

CMD ["uv", "run", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
