import { z } from 'zod';

// Authentication Schema Validation
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  orgName: z.string().min(2, 'Organization name must be at least 2 characters')
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Project CRUD schemas
export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional()
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').optional(),
  description: z.string().optional()
});

// Queue CRUD schemas
export const CreateQueueSchema = z.object({
  name: z.string().min(2, 'Queue name must be at least 2 characters'),
  concurrency: z.number().int().min(1).default(5),
  priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  paused: z.boolean().default(false),
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  retryPolicy: z.object({
    attempts: z.number().int().min(1).default(3),
    backoffFactor: z.number().int().min(1).default(2),
    delay: z.number().int().min(0).default(1000)
  }).optional()
});

export const UpdateQueueSchema = z.object({
  name: z.string().min(2, 'Queue name must be at least 2 characters').optional(),
  concurrency: z.number().int().min(1).optional(),
  priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  paused: z.boolean().optional(),
  retryPolicy: z.object({
    attempts: z.number().int().min(1),
    backoffFactor: z.number().int().min(1),
    delay: z.number().int().min(0)
  }).optional()
});

// Job creation schema
export const CreateJobSchema = z.object({
  name: z.string().min(2, 'Job name must be at least 2 characters'),
  type: z.enum(['immediate', 'delayed', 'scheduled', 'recurring', 'batch']).default('immediate'),
  payload: z.record(z.any()).default({}),
  priority: z.number().int().default(0),
  delay: z.number().int().nonnegative().default(0), // in milliseconds
  cron: z.string().optional(),
  runAt: z.string().datetime().optional(),
  maxAttempts: z.number().int().min(1).default(3),
  queueId: z.string().uuid('Queue ID must be a valid UUID'),
  projectId: z.string().uuid('Project ID must be a valid UUID'),
  batchId: z.string().uuid().optional(),
  batchJobs: z.array(
    z.object({
      name: z.string(),
      payload: z.record(z.any()).default({})
    })
  ).optional()
});

// Job update schema
export const UpdateJobSchema = z.object({
  status: z.enum([
    'queued',
    'scheduled',
    'claimed',
    'running',
    'completed',
    'failed',
    'retrying',
    'dead_letter',
    'cancelled'
  ]).optional(),
  priority: z.number().int().optional(),
  delay: z.number().int().nonnegative().optional(),
  cron: z.string().optional(),
  maxAttempts: z.number().int().min(1).optional()
});

// Job list filters schema
export const JobQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  queueId: z.string().uuid().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.string().transform(val => parseInt(val) || 1).default('1'),
  limit: z.string().transform(val => parseInt(val) || 10).default('10'),
  fromDate: z.string().datetime().optional(),
  toDate: z.string().datetime().optional()
});

// Request body validator Express middleware
export function validateBody(schema: z.ZodType<any, any, any>) {
  return async (req: any, res: any, next: any) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}

// Request query validator Express middleware
export function validateQuery(schema: z.ZodType<any, any, any>) {
  return async (req: any, res: any, next: any) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      next(error);
    }
  };
}
