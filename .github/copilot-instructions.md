# Copilot Instructions

## Project Overview

Legacy application modernization assessment tool. A single-container web application with Vue.js/TypeScript frontend and a Node.js/TypeScript backend using SQLite for persistence.

## Tech Stack

- **Frontend**: Vue 3 (Composition API) with TypeScript, Vue CLI, PrimeVue components
- **Backend**: Node.js with TypeScript, Express REST API
- **Database**: SQLite via `better-sqlite3`, file stored at `/data/modernization.db`
- **Container**: Single Linux Docker container
- **Data volume**: `/data` directory mapped from host

## Architecture

### Data Flow

1. Assessment HTML files are placed in `/data/assessments/` on the host
2. Backend loads/refreshes assessments into SQLite on startup or via API trigger
3. Frontend fetches data via API; may cache in-memory for rendering/drag-drop
4. User changes are committed async immediately (optimistic UI pattern)

### Data Model

Four core entities in SQLite:
- `Application` — includes `properties` and `drivers` as schemaless JSON columns
- `AppType`, `AppProperty`, `ModDriver` — configuration entities, seeded at launch

Properties and drivers are added at runtime via the Setup UI. See `spec.md` for full schema.

### API Design

- RESTful routes: `/api/applications`, `/api/app-types`, `/api/app-properties`, `/api/mod-drivers`
- Individual resource updates only (no bulk operations)
- No API versioning (frontend and backend always deployed together)

### Frontend Structure

Tab-based full-screen layout with PrimeVue components:
- **Applications**: List view of all applications
- **Data Collection**: Table for entering AppProperty values per application
- **Value Assessment**: Drag-and-drop for applying ModDrivers to applications
- **Quadrant**: Placeholder for future visualization
- **Setup**: CRUD for AppType, AppProperty, ModDriver configuration

### Backend Structure

Simple approach: routes with inline SQLite calls (no service/repository layers). Refactor if complexity warrants it.

## Conventions

- No authentication required (local-only application)
- No localStorage or persisted client state
- SQLite file created on first launch; no migration system needed
- Assessment file parsing has placeholders (format TBD)

## Development Notes

When implementing, use separate agents/sessions for:
1. Backend + data model implementation
2. Frontend development
