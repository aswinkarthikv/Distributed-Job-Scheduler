export type BackoffType = 'fixed' | 'linear' | 'exponential';

/**
 * Calculates retry delay based on the backoff policy type, delay factor, and current attempt.
 * @param type The retry policy backoff factor type
 * @param initialDelay Initial delay in milliseconds
 * @param attempt The current attempt count (1-indexed)
 * @param factor The multiplier factor (e.g. exponential scaling multiplier)
 * @returns Delay duration in milliseconds
 */
export function calculateRetryDelay(
  type: BackoffType | string,
  initialDelay: number,
  attempt: number,
  factor: number = 2
): number {
  if (attempt <= 1) return initialDelay;

  switch (type.toLowerCase()) {
    case 'linear':
      return initialDelay * attempt;
    case 'exponential':
      return initialDelay * Math.pow(factor, attempt - 1);
    case 'fixed':
    default:
      return initialDelay;
  }
}
export default calculateRetryDelay;
