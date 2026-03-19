# Technical Decisions Log

This document captures architectural and design decisions for this project. Update as decisions are made.

---

## Stack Decisions

| Area | Decision | Notes |
|------|----------|-------|
| Backend runtime | Node.js with TypeScript | Consistency with frontend |
| Backend framework | Express | Standard REST API |
| SQLite driver | `better-sqlite3` | Sync API, good performance |
| Frontend framework | Vue 3 (Composition API) | Modern Vue |
| Frontend tooling | Vue CLI | Standard build tooling |
| Component library | PrimeVue | Rich component set |

## Architecture Decisions

### Client State Model
- **Decision**: No persisted client state (localStorage, etc.)
- **Allowed**: In-memory caching for rendering and drag-drop interactions
- **Required**: All changes must be committed to backend async immediately

### JSON Columns (properties, drivers)
- **Decision**: Schemaless
- **Rationale**: Properties and drivers are added at runtime via Setup UI
- **Seeding**: Initial values seeded at application launch

### API Design
- **Style**: RESTful resource routes
- **Updates**: Individual resource updates only (no bulk operations)
- **Versioning**: None (frontend and backend always deployed together)

### Database Lifecycle
- **Creation**: SQLite file created on first launch if missing
- **Migrations**: None needed (short-lived data files, schema stable)
- **Location**: `/data/modernization.db`

### Assessment File Parsing
- **Status**: Deferred (no sample files available yet)
- **Approach**: Placeholders in code; Application schema per spec, mapping added later

### Backend Structure
- **Decision**: Simple (routes with inline SQLite calls)
- **Rationale**: Avoid premature optimization; can refactor to layered structure if needed

---

## Change Log

| Date | Decision |
|------|----------|
| 2026-03-19 | Initial stack and architecture decisions documented |
| 2026-03-19 | Backend structure: simple routes with inline DB calls |
