# Cookplan

Cookplan is a meal-planning application for managing recipes, planning meals, and generating shopping lists. It has an Angular frontend and a Python API backed by SQLite.

## Project structure

```text
.
├── backend/                 # Python API, database models, and Dockerfile
├── frontend/                # Angular application and multi-stage Dockerfile
│   └── src/app/              # Components, services, models, and routes
├── docker-compose.yml        # Development stack
└── docker-compose-prod.yml   # Production stack
```

## Run locally

To run the full application with Docker Compose:

```bash
docker compose up --build
```

The frontend is available at `http://localhost:9999`; the API is exposed at `http://localhost:8123`.

To install and build the frontend directly:

```bash
cd frontend
npm install
npm run build
```

The production frontend build is written to `frontend/dist/frontend/browser`.

## Build production images

From the repository root, set an image version and build both production images:

```bash
VERSION=1.1.1
docker build ./backend -f backend/Dockerfile --tag cookplan-backend:$VERSION
docker build ./frontend -f frontend/Dockerfile --target production --tag cookplan-frontend:$VERSION
```

The frontend production image serves the Angular build with Nginx. The backend image runs the API with Uvicorn.
