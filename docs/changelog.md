# Changelog

Todos los cambios notables de **Atajaderos Formosa (AI LAB Misión: Código Formosa · Equipo 6 UTN)** serán documentados en este archivo.
El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y versionado semántico.

## [Unreleased]
### Added
- Monorepo 100 % dockerizado conforme a `07_Entrega_Tecnica_Software.pdf`: `apps/backend/` (Python 3.12 + `uv` + FastAPI + SQLAlchemy 2.0 + Alembic + `psycopg` + Pydantic v2 + `pytest` + Ruff), `apps/frontend/` (Bun + React 18 + Vite 6 + TypeScript + Tailwind CSS v4 + Leaflet + Heroicons) y `postgres` (PostgreSQL 18 + PostGIS 3.7).
- Endpoint `GET /api/health` con declaración de prototipo, autenticación JWT (`POST /api/auth/login`, `GET /api/auth/me`), perfiles demo (`inspector@atajaderos.ar`, `referente@atajaderos.ar`) y `<PrototypeBanner />` visible en toda pantalla.
- Ecosistema agéntico multiherramienta adaptado a GitHub Issues, Docker, FastAPI/pytest/Ruff y React/Bun/TypeScript (`AGENTS.md`, `CLAUDE.md`, `.opencode/agents/`, `.agents/rules/`, `.agents/skills/`, `.claude/commands/`, `docs/specs/`, `scripts/tunnel.sh`).
