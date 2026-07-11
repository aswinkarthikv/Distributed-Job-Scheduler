import { EventEmitter } from 'events';

// Events placeholder: Node event emitters or Redis pub/sub for pub/sub decoupling
export const systemEvents = new EventEmitter();

systemEvents.on('job.failed', (job) => {
  console.log(`[Event Handler] Job ${job.id} failed. Checking retry policy...`);
});
