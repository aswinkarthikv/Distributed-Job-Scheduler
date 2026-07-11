# Deployment & Production Run Guide

This document describes how to deploy the Distributed Job Scheduler (DJS) Platform to various targets.

## 1. Local Containerized Run (Docker Compose)

### Dockerfile Setups
The repository contains `Dockerfile` files in `backend/` and `frontend/` to build optimized, secure images.

To launch the entire platform along with a PostgreSQL instance in one command:

```bash
docker-compose up --build
```

Accessing the dashboard:
*   **Web Console**: [http://localhost:80](http://localhost:80)
*   **Express API**: [http://localhost:4000/api/status](http://localhost:4000/api/status)

## 2. Cloud Platforms Deployment

### Render / Railway / Fly.io

You can host DJS on cloud providers using the configuration parameters below:

#### Database Setup
1.  Deploy a managed PostgreSQL database.
2.  Obtain the connection URL (e.g. `postgresql://...`).

#### Control Plane API (Backend Service)
1.  Create a web service pointing to the `backend/` folder.
2.  Set environment variables:
    *   `DATABASE_URL`: Connection string to your PostgreSQL instance.
    *   `JWT_SECRET`: Random hash string.
    *   `PORT`: `4000` (or dynamic binding port).
3.  Set the start command:
    ```bash
    npm run build && npx prisma db push && npm start
    ```

#### Web Dashboard (Frontend Service)
1.  Create a static/web service pointing to the `frontend/` folder.
2.  Vite is configured to proxy API requests to `/api`. When hosting on cloud services, update the production environment variables to point directly to the backend URL or configure an Nginx proxy pass.
