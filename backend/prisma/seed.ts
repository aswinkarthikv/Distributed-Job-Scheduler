import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seeder] Cleaning existing tables...');
  await prisma.jobLog.deleteMany({});
  await prisma.jobExecution.deleteMany({});
  await prisma.deadLetterJob.deleteMany({});
  await prisma.scheduledJob.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.queue.deleteMany({});
  await prisma.retryPolicy.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.workerHeartbeat.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.organization.deleteMany({});

  console.log('[Seeder] Creating Organizations...');
  const org1 = await prisma.organization.create({ data: { name: 'Acme Operations' } });
  const org2 = await prisma.organization.create({ data: { name: 'Dev Corp' } });

  console.log('[Seeder] Creating Users...');
  const passHash = await bcrypt.hash('password123', 10);
  
  await prisma.user.createMany({
    data: [
      { name: 'Alice Smith', email: 'alice@acme.com', passwordHash: passHash, organizationId: org1.id },
      { name: 'Bob Johnson', email: 'bob@acme.com', passwordHash: passHash, organizationId: org1.id },
      { name: 'Charlie Brown', email: 'charlie@acme.com', passwordHash: passHash, organizationId: org1.id },
      { name: 'David Miller', email: 'david@devcorp.com', passwordHash: passHash, organizationId: org2.id },
      { name: 'Emma Wilson', email: 'emma@devcorp.com', passwordHash: passHash, organizationId: org2.id }
    ]
  });

  console.log('[Seeder] Creating Projects...');
  const proj1 = await prisma.project.create({ data: { name: 'Billing Sync', description: 'Stripe sync & invoice generators', organizationId: org1.id } });
  const proj2 = await prisma.project.create({ data: { name: 'ETL Pipeline', description: 'Data warehouse batch synchronization', organizationId: org1.id } });
  const proj3 = await prisma.project.create({ data: { name: 'Log Ingestor', description: 'Application log parser', organizationId: org1.id } });
  const proj4 = await prisma.project.create({ data: { name: 'Dev Ops Portal', description: 'Internal tool provisioning task queues', organizationId: org2.id } });

  console.log('[Seeder] Creating Retry Policies...');
  const policy1 = await prisma.retryPolicy.create({ data: { attempts: 3, backoffFactor: 2, delay: 1000 } });
  const policy2 = await prisma.retryPolicy.create({ data: { attempts: 5, backoffFactor: 3, delay: 5000 } });
  const policy3 = await prisma.retryPolicy.create({ data: { attempts: 4, backoffFactor: 2, delay: 2000 } });
  const policy4 = await prisma.retryPolicy.create({ data: { attempts: 3, backoffFactor: 1, delay: 1000 } });

  console.log('[Seeder] Creating Queues...');
  const q1 = await prisma.queue.create({
    data: { name: 'high-priority-billing', concurrency: 10, priority: 'critical', projectId: proj1.id, retryPolicyId: policy1.id }
  });
  const q2 = await prisma.queue.create({
    data: { name: 'invoice-pdf-generation', concurrency: 4, priority: 'high', projectId: proj1.id, retryPolicyId: policy3.id }
  });
  const q3 = await prisma.queue.create({
    data: { name: 'database-sync-etl', concurrency: 2, priority: 'normal', projectId: proj2.id, retryPolicyId: policy2.id }
  });
  const q4 = await prisma.queue.create({
    data: { name: 'analytics-aggregator', concurrency: 5, priority: 'normal', projectId: proj2.id, retryPolicyId: policy4.id }
  });
  const q5 = await prisma.queue.create({
    data: { name: 'syslog-streams', concurrency: 20, priority: 'low', projectId: proj3.id }
  });
  const q6 = await prisma.queue.create({
    data: { name: 'error-alerts-hook', concurrency: 5, priority: 'high', projectId: proj3.id }
  });
  const q7 = await prisma.queue.create({
    data: { name: 'cloud-provision-infra', concurrency: 2, priority: 'critical', projectId: proj4.id }
  });
  const q8 = await prisma.queue.create({
    data: { name: 'cleanup-task-queues', concurrency: 1, priority: 'low', projectId: proj4.id }
  });
  const q9 = await prisma.queue.create({
    data: { name: 'notification-email-blasts', concurrency: 15, priority: 'normal', projectId: proj1.id }
  });
  const q10 = await prisma.queue.create({
    data: { name: 'audit-log-archive', concurrency: 2, priority: 'low', projectId: proj1.id }
  });

  console.log('[Seeder] Creating Workers and Heartbeats...');
  const workersData = [
    { name: 'eu-west-worker-node-1', status: 'online', cpuUsage: 12.5, memoryUsage: 45.2 },
    { name: 'eu-west-worker-node-2', status: 'busy', cpuUsage: 85.3, memoryUsage: 78.1 },
    { name: 'us-east-worker-node-1', status: 'online', cpuUsage: 8.1, memoryUsage: 35.4 },
    { name: 'us-east-worker-node-2', status: 'busy', cpuUsage: 92.4, memoryUsage: 94.8 },
    { name: 'ap-south-worker-node-1', status: 'offline', cpuUsage: 0.0, memoryUsage: 0.0 }
  ];

  const workers: any[] = [];
  for (const wd of workersData) {
    const w = await prisma.worker.create({
      data: {
        name: wd.name,
        status: wd.status,
        cpuUsage: wd.cpuUsage,
        memoryUsage: wd.memoryUsage,
        lastHeartbeat: new Date()
      }
    });
    workers.push(w);

    // Create heartbeat history entries
    await prisma.workerHeartbeat.createMany({
      data: [
        { workerId: w.id, cpuUsage: wd.cpuUsage * 0.9, memoryUsage: wd.memoryUsage * 0.95, timestamp: new Date(Date.now() - 60000) },
        { workerId: w.id, cpuUsage: wd.cpuUsage, memoryUsage: wd.memoryUsage, timestamp: new Date() }
      ]
    });
  }

  console.log('[Seeder] Seeding 200 Jobs...');
  const statuses = ['completed', 'queued', 'running', 'scheduled', 'cancelled'];
  
  // Seed Completed Jobs (approx 150)
  for (let i = 1; i <= 150; i++) {
    const queue = i % 2 === 0 ? q1 : q3;
    const project = queue.projectId === proj1.id ? proj1 : proj2;
    const worker = workers[i % 4];

    const job = await prisma.job.create({
      data: {
        name: `Billing Transaction Task #${1000 + i}`,
        type: 'immediate',
        status: 'completed',
        payload: JSON.stringify({ txnId: `ch_${Math.floor(Math.random() * 100000)}`, amount: i * 10 }),
        result: JSON.stringify({ success: true, processedTimeMs: 120 + Math.random() * 300 }),
        attempts: 1,
        maxAttempts: 3,
        priority: i % 5,
        queueId: queue.id,
        projectId: project.id,
        workerId: worker.id,
        startedAt: new Date(Date.now() - 3600000 * 2),
        completedAt: new Date(Date.now() - 3600000 * 2 + 1500)
      }
    });

    await prisma.jobLog.create({
      data: { jobId: job.id, message: 'Received transaction request payload.' }
    });
    await prisma.jobLog.create({
      data: { jobId: job.id, message: 'Processing complete. Payment sync committed.' }
    });

    await prisma.jobExecution.create({
      data: {
        jobId: job.id,
        workerId: worker.id,
        attempt: 1,
        status: 'completed',
        startedAt: new Date(Date.now() - 3600000 * 2),
        finishedAt: new Date(Date.now() - 3600000 * 2 + 1500),
        duration: 1500
      }
    });
  }

  // Seed Queued/Running/Scheduled/Cancelled Jobs (approx 25)
  for (let i = 1; i <= 25; i++) {
    const status = statuses[i % statuses.length];
    const queue = q2;
    const worker = status === 'running' ? workers[1] : null;

    const job = await prisma.job.create({
      data: {
        name: `Invoice PDF Renderer #${2000 + i}`,
        type: status === 'scheduled' ? 'scheduled' : 'immediate',
        status,
        payload: JSON.stringify({ invoiceId: `inv_${2000 + i}` }),
        priority: 2,
        queueId: queue.id,
        projectId: proj1.id,
        workerId: worker?.id || null,
        runAt: status === 'scheduled' ? new Date(Date.now() + 3600000) : null,
        startedAt: status === 'running' ? new Date() : null
      }
    });

    await prisma.jobLog.create({
      data: { jobId: job.id, message: `Job registered in queue: ${queue.name}.` }
    });

    if (status === 'running') {
      await prisma.jobExecution.create({
        data: {
          jobId: job.id,
          workerId: worker!.id,
          attempt: 1,
          status: 'running',
          startedAt: new Date()
        }
      });
    }
  }

  console.log('[Seeder] Seeding 20 Failed/Retrying Jobs...');
  for (let i = 1; i <= 20; i++) {
    const isRetrying = i % 2 === 0;
    const queue = q3;

    const job = await prisma.job.create({
      data: {
        name: `Database Ingestion Sync Error #${3000 + i}`,
        type: 'immediate',
        status: isRetrying ? 'scheduled' : 'failed',
        payload: JSON.stringify({ dbTarget: 'analytics_logs', batchSize: 5000 }),
        error: 'DatabaseConnectionError: Timed out waiting for connection pool lease.',
        attempts: isRetrying ? 2 : 3,
        maxAttempts: 5,
        priority: 1,
        queueId: queue.id,
        projectId: proj2.id,
        runAt: isRetrying ? new Date(Date.now() + 60000) : null,
        failedAt: !isRetrying ? new Date() : null
      }
    });

    await prisma.jobLog.create({
      data: { jobId: job.id, message: 'Ingestion task started.', level: 'info' }
    });
    await prisma.jobLog.create({
      data: { jobId: job.id, message: 'Connection lease failed. Retrying...', level: 'warn' }
    });

    await prisma.jobExecution.create({
      data: {
        jobId: job.id,
        attempt: 1,
        status: 'failed',
        error: 'DatabaseConnectionError: Connection timeout.',
        startedAt: new Date(Date.now() - 10000),
        finishedAt: new Date(),
        duration: 3000
      }
    });
  }

  console.log('[Seeder] Seeding 5 Dead Letter Queue entries...');
  for (let i = 1; i <= 5; i++) {
    const queue = q4;

    const job = await prisma.job.create({
      data: {
        name: `Critical Data Sync Crash #${4000 + i}`,
        type: 'immediate',
        status: 'dead_letter',
        payload: JSON.stringify({ syncKey: `corrupt_block_${i}` }),
        error: 'FatalParsingError: Corrupted file headers matching partition block.',
        attempts: 3,
        maxAttempts: 3,
        priority: 0,
        queueId: queue.id,
        projectId: proj2.id,
        failedAt: new Date()
      }
    });

    await prisma.jobLog.create({
      data: { jobId: job.id, message: 'Execution thread spawned.', level: 'info' }
    });
    await prisma.jobLog.create({
      data: { jobId: job.id, message: 'Fatal crash stack trace: Invalid file headers.', level: 'error' }
    });
    await prisma.jobLog.create({
      data: { jobId: job.id, message: 'Exhausted all retry loops. Moving to DLQ.', level: 'error' }
    });

    await prisma.deadLetterJob.create({
      data: {
        jobId: job.id,
        error: 'FatalParsingError: Corrupted file headers.'
      }
    });

    await prisma.jobExecution.create({
      data: {
        jobId: job.id,
        attempt: 3,
        status: 'dead_letter',
        error: 'FatalParsingError',
        startedAt: new Date(Date.now() - 5000),
        finishedAt: new Date(),
        duration: 2000
      }
    });
  }

  console.log('[Seeder] Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('[Seeder] Error executing seeder:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
