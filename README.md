# Distributed Job Scheduler (DJS) Platform

A production-grade, enterprise-ready control plane and distributed job scheduling platform scafolding inspired by BullMQ Dashboard, Temporal, RabbitMQ, and AWS Batch. It features a complete React + TypeScript dashboard, full REST APIs, PostgreSQL data persistence via Prisma ORM, Zod request schemas, JWT-controlled authentication boundaries, and a transaction-safe worker execution engine with automated stale-node recovery.

## Tech Stack

*   **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, Framer Motion, Lucide Icons, React Router DOM
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Zod, JWT, bcryptjs
*   **Containers**: Docker, Docker Compose

## Features

1.  **Multi-Tenant Organization Spaces**: Logical namespaces/projects to partition queues, API credentials, and executions.
2.  **Concurrency-Constrained Broker Queues**: Custom queue parameters managing thread concurrency boundaries, retry policies, and pause controls.
3.  **Job Execution Pipeline**: Supports Immediate, Delayed, Scheduled, and Batch job operations with execution durations and console logs tracing.
4.  **Distributed Worker Daemon Engine**: Background pollers that atomically claim tasks using row locking (`$transaction` queries) to avoid duplicate runs and enforce queue concurrency.
5.  **Heartbeat Stale-Node Recovery**: Automatically detects offline nodes (heartbeat stale > 30s) and safely re-enqueues abandoned jobs.
6.  **Telemetry Health Metrics**: Real-time logs and Recharts visualization monitoring success rates, worker CPU/RAM, and failure logs.

## Directory Structure

```
Distributed-Job-Scheduler/
├── package.json
├── README.md
├── DESIGN_DECISIONS.md
├── DEPLOYMENT.md
├── docker-compose.yml
├── backend/
│   ├── prisma/
│   │   └── schema.prisma (User, Org, Project, Queue, Job, Executions, Logs, Workers)
│   ├── src/
│   │   ├── config/ (Environment config, Swagger schemas)
│   │   ├── controllers/ (Auth, Project, Queue, Job, Worker controllers)
│   │   ├── services/ (Auth, Project, Queue, Job, Worker, Telemetry services)
│   │   ├── repositories/ (DB interface queries via Prisma ORM client)
│   │   ├── middlewares/ (JWT authentication, express error handling)
│   │   ├── validators/ (Zod schema checking rules)
│   │   ├── workers/ (WorkerEngine loop daemon)
│   │   ├── scheduler/ (Stale worker recovery scheduler)
│   │   ├── utils/ (Retry calculations, uuid helpers)
│   │   └── index.ts (Server bootstrapping and signal triggers)
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/ (Sidebar, Top Navbar, Layout Shell, UI elements, DataTable)
    │   ├── context/ (ThemeContext light/dark control)
    │   ├── pages/ (Login, Signup, Dashboard, Spaces, Queues, Jobs, Workers, Health, Settings)
    │   ├── store/ (Zustand state managers: Auth, Project, Queue, Job, Worker, Settings)
    │   ├── App.tsx (React Router routing maps)
    │   ├── main.tsx (App wrapper bootstrapping QueryClient, Theme, and Toast Providers)
    │   └── index.css (Tailwind rules and theme HSL configurations)
    ├── tsconfig.json
    ├── Dockerfile
    └── package.json
```

## Getting Started

### Prerequisites

*   Node.js (v18+)
*   PostgreSQL Database
*   Docker (Optional, for containerized run)

### Installation

Clone the repository and install all dependencies in the workspace root:

```bash
npm install
npm run install:all
```

### Environment Configuration

Create a `.env` file in the `backend/` directory:

```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/scheduler?schema=public"
JWT_SECRET="djs_control_plane_dev_jwt_secret_key"
NODE_ENV="development"
```

### Database Migration

To run migrations and generate the Prisma Client:

```bash
cd backend
npx prisma db push
npx prisma generate
```

### Running the Application

In the root folder, run:

```bash
# Run both Frontend and Backend concurrently
npm run dev

# Or run separately
npm run dev:backend
npm run dev:frontend
```

*   **Frontend Panel**: [http://localhost:3000](http://localhost:3000)
*   **Control Plane API**: [http://localhost:4000](http://localhost:4000)
