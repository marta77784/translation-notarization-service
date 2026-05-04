/**
 * Thrown for failures that should not be retried — bad payload, unsupported
 * format, scanned PDF, LLM auth/config errors, etc. The worker discards the
 * job on `failed` so BullMQ stops consuming attempts.
 */
export class PermanentError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'PermanentError';
  }
}

/**
 * Thrown for failures that may succeed on retry — LLM 429/5xx, network
 * errors, transient infrastructure problems. BullMQ retries with exponential
 * backoff per the worker config.
 */
export class TransientError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'TransientError';
  }
}
