FROM oven/bun:1-debian

ARG UID=1000
ARG GID=1000

WORKDIR /app

RUN if ! getent group ${GID} >/dev/null 2>&1; then groupadd -g ${GID} atajaderos; fi \
    && if ! id -u ${UID} >/dev/null 2>&1; then useradd -u ${UID} -g ${GID} -m -s /bin/bash atajaderos; fi \
    && mkdir -p /app/node_modules \
    && chown -R ${UID}:${GID} /app

COPY --chown=${UID}:${GID} package.json bun.lock* ./

USER ${UID}:${GID}

RUN if [ -f bun.lock ]; then bun install --frozen-lockfile; else bun install; fi

EXPOSE 5173

CMD ["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
