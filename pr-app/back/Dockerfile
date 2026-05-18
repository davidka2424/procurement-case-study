# syntax=docker/dockerfile:1.7
# Build with uv. https://docs.astral.sh/uv/guides/integration/docker/
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:${PATH}"

# Cache-friendly: only re-runs when deps change.
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --no-install-project --no-dev

# Now bring in the source and install the project itself.
COPY app ./app
RUN --mount=type=cache,target=/root/.cache/uv uv sync --no-dev

EXPOSE 8001

# Default command — compose overrides this for init-db / seed-users.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
