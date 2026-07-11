// Workers placeholder: Dedicated to background job runner instances
// TODO: Set up worker consumer pools using BullMQ or custom task queue polling
export const workersConfig = {
  activePoolSize: 5,
  pollingIntervalMs: 1000
};
