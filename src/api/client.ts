import { getPreferenceValues } from "@raycast/api";

const BASE_URL = "https://api.mymind.com";
const USER_AGENT = "raycast-mymind/2.0.0";

interface ApiPreferences {
  apiToken?: string;
}

export class MyMindApiError extends Error {
  readonly status: number;
  readonly type?: string;
  readonly detail?: string;

  constructor(message: string, status: number, type?: string, detail?: string) {
    super(message);
    this.name = "MyMindApiError";
    this.status = status;
    this.type = type;
    this.detail = detail;
  }

  get isUnauthorized(): boolean {
    return this.status === 401 || this.status === 403;
  }
}

type QueryValue = string | number | boolean | undefined | null;

interface RequestOptions {
  query?: Record<string, QueryValue | QueryValue[]>;
  body?: unknown;
  contentType?: string;
  accept?: string;
  signal?: AbortSignal;
}

function getApiToken(): string {
  const { apiToken } = getPreferenceValues<ApiPreferences>();
  if (!apiToken) {
    throw new MyMindApiError("Missing API token. Set it in extension preferences.", 401);
  }
  return apiToken;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(path, BASE_URL);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const v of value) {
          if (v !== undefined && v !== null) url.searchParams.append(key, String(v));
        }
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function parseError(response: Response): Promise<MyMindApiError> {
  const fallback = `HTTP ${response.status} ${response.statusText}`;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/problem+json")) {
    return new MyMindApiError(fallback, response.status);
  }
  try {
    const problem = (await response.json()) as {
      type?: string;
      title?: string;
      detail?: string;
    };
    const message = problem.detail ?? problem.title ?? fallback;
    return new MyMindApiError(message, response.status, problem.type, problem.detail);
  } catch {
    return new MyMindApiError(fallback, response.status);
  }
}

async function request(method: string, path: string, opts: RequestOptions = {}): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiToken()}`,
    "User-Agent": USER_AGENT,
  };
  if (opts.accept) headers["Accept"] = opts.accept;

  let body: BodyInit | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    if (opts.body instanceof FormData) {
      body = opts.body;
    } else if (typeof opts.body === "string") {
      body = opts.body;
      headers["Content-Type"] = opts.contentType ?? "text/plain";
    } else if (opts.body instanceof ArrayBuffer || ArrayBuffer.isView(opts.body)) {
      body = opts.body as BodyInit;
      headers["Content-Type"] = opts.contentType ?? "application/octet-stream";
    } else {
      body = JSON.stringify(opts.body);
      headers["Content-Type"] = opts.contentType ?? "application/json";
    }
  }

  const response = await fetch(buildUrl(path, opts.query), {
    method,
    headers,
    body,
    signal: opts.signal,
  });

  if (!response.ok) {
    throw await parseError(response);
  }
  return response;
}

async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export const api = {
  async get<T>(path: string, opts?: RequestOptions): Promise<T> {
    const response = await request("GET", path, opts);
    return readJson<T>(response);
  },
  async getRaw(path: string, opts?: RequestOptions): Promise<Response> {
    return request("GET", path, opts);
  },
  async post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    const response = await request("POST", path, { ...opts, body });
    return readJson<T>(response);
  },
  async patch<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    const response = await request("PATCH", path, { ...opts, body });
    return readJson<T>(response);
  },
  async put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    const response = await request("PUT", path, { ...opts, body });
    return readJson<T>(response);
  },
  async delete(path: string, opts?: RequestOptions): Promise<void> {
    await request("DELETE", path, opts);
  },
};
