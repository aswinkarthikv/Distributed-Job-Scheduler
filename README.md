# ⚡ Distributed Job Scheduler (DJS) Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-blue.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2015-blue.svg)](https://www.postgresql.org)
[![Prisma ORM](https://img.shields.io/badge/ORM-Prisma-2D3748.svg)](https://www.prisma.io)
[![Vite + React](https://img.shields.io/badge/frontend-Vite%20%7C%20React%2018%20%7C%20TS-646CFF.svg)](https://vitejs.dev)
[![Express.js](https://img.shields.io/badge/backend-Express%20v4-lightgrey.svg)](https://expressjs.com)
[![Docker Compose](https://img.shields.io/badge/container-Docker%20Compose-0db7ed.svg)](https://www.docker.com)
[![GitHub Actions CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF.svg)](https://github.com/features/actions)

An enterprise-ready, transaction-safe **Distributed Job Scheduling Platform & Control Plane** inspired by BullMQ, Temporal, and AWS Batch. Features a sleek, modern React + TypeScript dark-themed console, Zod request validations, JWT authorization, and a distributed worker engine utilizing PostgreSQL row-locking transactions (`SELECT ... FOR UPDATE` via Prisma) to guarantee atomic task execution.

---

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph Client Space
        FE[React Vite Console - Port 3000]
    end

    subgraph Control Plane
        BE[Express API Router - Port 4000]
        RecMon[Stale-Node Recovery Monitor]
    end

    subgraph Data Store
        DB[(PostgreSQL - Port 5432)]
    end

    subgraph Distributed Daemons
        W1[Worker Engine Daemon 1]
        W2[Worker Engine Daemon 2]
    end

    FE -->|HTTP / JSON + JWT| BE
    BE -->|Prisma ORM Client| DB
    RecMon -->|Re-enqueue offline nodes| DB
    W1 -->|Atomic SELECT FOR UPDATE| DB
    W2 -->|Atomic SELECT FOR UPDATE| DB
```

---

## 🚀 Key Features

*   **Multi-Tenant Organization Isolation**: Logically partitions projects, queues, API keys, and job logs under strict tenant scopes.
*   **Concurrency-Constrained Queues**: Allows configuration of custom concurrency limits, priorities, and retry policies on individual queues.
*   **Distributed Worker Engine**: Multi-node background worker daemons that claim queued tasks atomically, utilizing row-level database transactions to prevent duplicate processing.
*   **Dead Letter Queue (DLQ)**: Failed tasks exceeding retry limits are automatically routed to the DLQ and can be retried directly from the console with a single click.
*   **Active Telemetry & Analytics Dashboard**: Live metrics rendering processed jobs throughput timeline, average worker CPU/Memory usage, and real-time logs.
*   **Automatic Stale-Node Recovery**: Recovery scheduler monitors worker node heartbeats and re-enqueues jobs if a worker goes offline for > 30 seconds.

---

## 💻 Local Quickstart

Follow these steps to run the complete platform locally on your machine.

### 1. Prerequisites
Ensure you have the following installed:
*   [Node.js](https://nodejs.org) (v18.0.0 or higher)
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL database)

### 2. Installation
Clone the repository and install dependencies in the workspace root, backend, and frontend folders:
```bash
# Install root development packages
npm install

# Install both backend and frontend dependencies
npm run install:all
```

### 3. Environment Variables Setup
Create a `.env` file in the `backend/` directory:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/scheduler?schema=public"
JWT_SECRET="djs_control_plane_dev_jwt_secret_key"
NODE_ENV="development"
```

### 4. Database Setup (Docker Compose)
Spins up a local PostgreSQL 15 container in the background:
```bash
docker compose up -d
```

### 5. Run Migrations & Seed Database
Build the Prisma client, migrate schemas, and seed initial test values into the database:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ..
```

### 6. Spin Up the Development Servers
In the project root directory, launch both the frontend (Port 3000) and backend (Port 4000) concurrently:
```bash
npm run dev
```

---

## 🔑 Login Credentials

The database seeder is pre-populated with active projects, queues, workers, and metrics under the **Acme Operations** organization. Use these credentials to sign in:

*   **Email Address**: `alice@acme.com`
*   **Password**: `password123`

---

## 🌐 Production Deployment

This project is configured for split-architecture production deployment:

### 1. Backend Service (Render / Railway / Fly.io)
Deploy the `backend/` directory to a cloud provider:
1.  Connect your database to a managed PostgreSQL database.
2.  Set environment variables:
    *   `DATABASE_URL`: Your production connection string.
    *   `JWT_SECRET`: A secure random secret key.
    *   `NODE_ENV`: `production`
3.  Set the startup command:
    ```bash
    npm run build && npx prisma db push && npm start
    ```

### 2. Frontend Static Site (GitHub Pages)
The repository contains an automated GitHub Actions CI/CD script (`.github/workflows/deploy.yml`) that builds and deploys your React dashboard directly to the `gh-pages` branch.

#### Configuration Steps:
1.  Go to your GitHub repository **Settings** -> **Secrets and variables** -> **Actions**.
2.  Create a new repository secret:
    *   **Name**: `VITE_API_URL`
    *   **Value**: `https://your-production-backend-url.com`
3.  Push your changes to the `main` branch. This triggers the GitHub Actions workflow to build the application.
4.  Once the workflow completes, navigate to **Settings** -> **Pages**:
    *   Under **Build and deployment**, select **Deploy from a branch**.
    *   Set the branch to `gh-pages` and save.
5.  Your professional dashboard console is now live at:
    `https://<your-username>.github.io/Distributed-Job-Scheduler/`
