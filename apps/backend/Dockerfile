FROM ghcr.io/astral-sh/uv:latest AS uv_bin
FROM python:3.12-slim

ARG UID=1000
ARG GID=1000

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_LINK_MODE=copy \
    PATH="/opt/venv/bin:$PATH"

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=uv_bin /uv /uvx /usr/local/bin/

RUN groupadd -g ${GID} atajaderos \
    && useradd -u ${UID} -g ${GID} -m -s /bin/bash atajaderos

WORKDIR /app

COPY pyproject.toml uv.lock* ./
RUN mkdir -p /opt/venv /app/uploads && chown -R ${UID}:${GID} /opt/venv /app

USER ${UID}:${GID}

RUN if [ -f uv.lock ]; then uv sync --frozen --no-install-project; else uv sync --no-install-project; fi

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
