// Utils placeholder: Logger, UUID, dates, hashing helpers
export function generateUuid(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
