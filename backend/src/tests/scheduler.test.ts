import { calculateRetryDelay } from '../utils/retry';
import { RegisterSchema, LoginSchema, CreateProjectSchema, CreateQueueSchema } from '../validators';

describe('Distributed Job Scheduler Core Tests', () => {
  
  describe('Retry Backoff Calculations', () => {
    test('Fixed Delay Calculation', () => {
      const delay = calculateRetryDelay('fixed', 1000, 3);
      expect(delay).toBe(1000);
    });

    test('Linear Backoff Calculation', () => {
      const delay1 = calculateRetryDelay('linear', 1000, 1);
      const delay2 = calculateRetryDelay('linear', 1000, 3);
      expect(delay1).toBe(1000);
      expect(delay2).toBe(3000);
    });

    test('Exponential Backoff Calculation', () => {
      const delay1 = calculateRetryDelay('exponential', 1000, 1, 2);
      const delay2 = calculateRetryDelay('exponential', 1000, 3, 2);
      expect(delay1).toBe(1000);
      expect(delay2).toBe(4000); // 1000 * 2^(3-1) = 4000
    });
  });

  describe('Zod Validations Schemas', () => {
    test('User Register Schema validates invalid emails', () => {
      const result = RegisterSchema.safeParse({
        name: 'Developer',
        email: 'invalid-email',
        password: '123',
        orgName: 'Acme'
      });
      expect(result.success).toBe(false);
    });

    test('User Login Schema verifies required password', () => {
      const result = LoginSchema.safeParse({
        email: 'dev@enterprise.io',
        password: ''
      });
      expect(result.success).toBe(false);
    });

    test('Create Project Schema rejects short names', () => {
      const result = CreateProjectSchema.safeParse({
        name: 'a',
        description: 'short name'
      });
      expect(result.success).toBe(false);
    });

    test('Create Queue Schema requires valid UUID for projectId', () => {
      const result = CreateQueueSchema.safeParse({
        name: 'my-queue',
        concurrency: 5,
        priority: 'normal',
        paused: false,
        projectId: 'invalid-uuid'
      });
      expect(result.success).toBe(false);
    });
  });
});
