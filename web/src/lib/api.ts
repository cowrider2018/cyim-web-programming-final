export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level messages from the server's Zod validation, keyed by path. */
  get fieldErrors(): Record<string, string> {
    if (!Array.isArray(this.details)) return {};
    const entries = this.details.flatMap((issue) =>
      issue && typeof issue === 'object' && 'path' in issue && 'message' in issue
        ? [[String(issue.path), String(issue.message)] as const]
        : [],
    );
    return Object.fromEntries(entries);
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * The GitHub Pages build has no server to call, so it answers requests in the
 * page instead — same services, same schemas, SQLite compiled to WASM. Vite
 * replaces this with a literal and drops the branch, so a normal build neither
 * bundles nor loads the demo stack.
 */
const DEMO = import.meta.env.VITE_DEMO === 'true';

/** Turns a status and payload into the result callers expect, or throws. */
function unwrap<T>(status: number, payload: unknown): T {
  if (status === 204) return undefined as T;

  if (status < 200 || status >= 300) {
    const error = (payload as ApiErrorBody | null)?.error;
    throw new ApiError(
      status,
      error?.code ?? 'UNKNOWN',
      error?.message ?? `Request failed with status ${status}`,
      error?.details,
    );
  }

  return payload as T;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const method = rest.method ?? 'GET';

  if (DEMO) {
    const { handleDemoRequest } = await import('../demo/router');
    const result = await handleDemoRequest(method, `/api${path}`, body);
    return unwrap<T>(result.status, result.body);
  }

  const response = await fetch(`/api${path}`, {
    ...rest,
    // The session is an httpOnly cookie, so every request must carry credentials.
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) return undefined as T;

  return unwrap<T>(response.status, await response.json().catch(() => null));
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};

/** Builds a query string, dropping empty values so URLs stay clean. */
export function qs(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const result = search.toString();
  return result ? `?${result}` : '';
}
