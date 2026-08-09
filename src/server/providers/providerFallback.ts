/**
 * Universal AI Provider Fallback Engine
 *
 * Single reusable orchestrator used by every AI generation operation.
 * Runs providers sequentially: catches failures, categorises them, logs
 * timing + outcome, and continues through the chain until one succeeds
 * or every provider fails.
 *
 * Never logs API keys or secrets.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type FailureCategory =
  | 'QUOTA_EXHAUSTED'
  | 'RATE_LIMITED'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'INVALID_KEY'
  | 'MODEL_UNAVAILABLE'
  | 'NO_RESULT'
  | 'PARSE_ERROR';

export interface ProviderAttemptLog {
  /** Provider display name */
  provider: string;
  /** Operation name e.g. 'script', 'image', 'voice', 'prompt-intelligence' */
  operation: string;
  startedAt: string;        // ISO 8601
  elapsedMs: number;
  success: boolean;
  failureCategory?: FailureCategory;
  /** Sanitised message — never contains key values */
  failureMessage?: string;
  /** true when another provider will be tried after this failure */
  fallbackContinued: boolean;
}

export interface FallbackProvider<T> {
  name: string;
  /** Per-provider timeout override. Falls back to defaultTimeoutMs. */
  timeoutMs?: number;
  /**
   * The work unit. Throw (or return a rejected Promise) on any failure.
   * Returning undefined / null is also treated as NO_RESULT.
   */
  run: () => Promise<T | undefined | null>;
}

export interface FallbackResult<T> {
  result: T;
  providerUsed: string;
  attempts: ProviderAttemptLog[];
}

export class AllProvidersFailedError extends Error {
  readonly attempts: ProviderAttemptLog[];
  constructor(operation: string, attempts: ProviderAttemptLog[]) {
    const chain = attempts
      .map((a) => `${a.provider}:${a.failureCategory ?? 'FAILED'}`)
      .join(' → ');
    super(`[${operation}] All providers failed. Chain: ${chain}`);
    this.name = 'AllProvidersFailedError';
    this.attempts = attempts;
  }
}

// ── Shared in-memory circular log (last 200 entries) ─────────────────────────

const MAX_LOG = 200;
const _attemptLog: ProviderAttemptLog[] = [];

export function getRecentAttempts(limit = 50): ProviderAttemptLog[] {
  return _attemptLog.slice(-Math.min(limit, MAX_LOG));
}

export function clearAttemptLog(): void {
  _attemptLog.length = 0;
}

function _push(entry: ProviderAttemptLog): void {
  if (_attemptLog.length >= MAX_LOG) _attemptLog.splice(0, 1);
  _attemptLog.push(entry);
}

// ── Failure categorisation ────────────────────────────────────────────────────

export function categorizeError(err: unknown): FailureCategory {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (
    msg.includes('timed out') ||
    msg.includes('timeout') ||
    msg.includes('aborted') ||
    msg.includes('abort')
  ) return 'TIMEOUT';
  if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes(' 429')) return 'RATE_LIMITED';
  if (
    msg.includes('quota') ||
    msg.includes('resource_exhausted') ||
    msg.includes('billing') ||
    msg.includes('exceeded')
  ) return 'QUOTA_EXHAUSTED';
  if (
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('invalid api key') ||
    msg.includes('unauthorized') ||
    msg.includes('authentication') ||
    msg.includes('api key')
  ) return 'INVALID_KEY';
  if (
    msg.includes('503') ||
    msg.includes('service unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound') ||
    msg.includes('network')
  ) return 'SERVICE_UNAVAILABLE';
  if (
    msg.includes('model') &&
    (msg.includes('not found') || msg.includes('unavailable') || msg.includes('deprecated'))
  ) return 'MODEL_UNAVAILABLE';
  if (
    msg.includes('parse') ||
    msg.includes('json') ||
    msg.includes('syntax') ||
    msg.includes('unexpected token')
  ) return 'PARSE_ERROR';
  if (
    msg.includes('no result') ||
    msg.includes('empty response') ||
    msg.includes('no images') ||
    msg.includes('no content')
  ) return 'NO_RESULT';
  return 'API_ERROR';
}

/** Strip long alphanumeric blobs that could be key values. */
function _sanitize(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.replace(/[A-Za-z0-9_\-]{32,}/g, '[REDACTED]').substring(0, 300);
}

// ── Core engine ───────────────────────────────────────────────────────────────

/**
 * Run an ordered list of providers, returning the first success.
 *
 * @param operation  Human-readable operation name for logs (e.g. 'script')
 * @param providers  Ordered list; last-resort providers (always-succeed) go last
 * @param defaultTimeoutMs  Applied to any provider that doesn't set its own
 */
export async function runWithFallback<T>(
  operation: string,
  providers: FallbackProvider<T>[],
  defaultTimeoutMs = 30_000
): Promise<FallbackResult<T>> {
  if (providers.length === 0) {
    throw new AllProvidersFailedError(operation, []);
  }

  const sessionAttempts: ProviderAttemptLog[] = [];

  for (let i = 0; i < providers.length; i++) {
    const prov = providers[i];
    const ms = prov.timeoutMs ?? defaultTimeoutMs;
    const isLast = i === providers.length - 1;
    const startedAt = new Date().toISOString();
    const t0 = Date.now();

    try {
      const value = await Promise.race([
        prov.run(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Provider ${prov.name} timed out after ${ms}ms`)),
            ms
          )
        )
      ]);

      if (value === undefined || value === null) {
        throw new Error(`No result returned by provider ${prov.name}`);
      }

      const elapsedMs = Date.now() - t0;
      const entry: ProviderAttemptLog = {
        provider: prov.name,
        operation,
        startedAt,
        elapsedMs,
        success: true,
        fallbackContinued: false
      };
      sessionAttempts.push(entry);
      _push(entry);
      console.info(`[Fallback:${operation}] ✓ ${prov.name} succeeded in ${elapsedMs}ms`);

      return { result: value as T, providerUsed: prov.name, attempts: sessionAttempts };
    } catch (err: unknown) {
      const elapsedMs = Date.now() - t0;
      const failureCategory = categorizeError(err);
      const failureMessage = _sanitize(err);
      const fallbackContinued = !isLast;

      const entry: ProviderAttemptLog = {
        provider: prov.name,
        operation,
        startedAt,
        elapsedMs,
        success: false,
        failureCategory,
        failureMessage,
        fallbackContinued
      };
      sessionAttempts.push(entry);
      _push(entry);

      console.warn(
        `[Fallback:${operation}] ✗ ${prov.name} failed [${failureCategory}] in ${elapsedMs}ms.` +
        (fallbackContinued ? ' Trying next provider…' : ' No more providers.')
      );
    }
  }

  throw new AllProvidersFailedError(operation, sessionAttempts);
}

/**
 * Convenience: enforce a per-call timeout and log the attempt for a single
 * provider that already has its own downstream fallback.
 * Throws on failure/timeout so the caller's existing fallback runs normally.
 */
export async function runProviderWithTimeout<T>(
  providerName: string,
  operation: string,
  run: () => Promise<T>,
  timeoutMs = 30_000
): Promise<T> {
  const fb = await runWithFallback<T>(
    operation,
    [{ name: providerName, timeoutMs, run }],
    timeoutMs
  );
  return fb.result;
}
