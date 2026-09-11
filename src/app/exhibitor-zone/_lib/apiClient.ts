import { showErrorAlert, showSuccessAlert } from "./alerts";

const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4010/api"}/exhibitor-zone`;

export interface FieldError {
  field: string;
  message: string;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: FieldError[];

  constructor(message: string, status: number, fieldErrors?: FieldError[]) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export interface RequestOptions extends RequestInit {
  /** Skip the automatic success/error SweetAlert toast for this call (e.g. silent background cleanup). */
  silent?: boolean;
  /** Override the toast message shown on success instead of the API response's `message`. */
  successMessage?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { silent, successMessage, ...fetchOptions } = options;
  const method = (fetchOptions.method || "GET").toUpperCase();
  const isMutation = method !== "GET" && method !== "HEAD";

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers: fetchOptions.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...fetchOptions
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message = body.message || "Something went wrong. Please try again.";
    if (isMutation && !silent) showErrorAlert(message);
    throw new ApiError(message, res.status, body.errors);
  }

  if (isMutation && !silent) {
    showSuccessAlert(successMessage || body.message || "Done successfully.");
  }

  return body as T;
}

// Like api.post, but for endpoints that return a raw binary body (e.g. a
// rendered PDF) instead of JSON — bypasses request()'s res.json() parsing
// and the success/error toast, since a live preview call isn't a user
// mutation worth toasting.
async function postForBlob(path: string, data?: unknown): Promise<Blob> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data ?? {})
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.message || "Something went wrong. Please try again.", res.status, body.errors);
  }
  return res.blob();
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, opts),
  post: <T>(path: string, data?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "POST", body: data instanceof FormData ? data : JSON.stringify(data ?? {}), ...opts }),
  patch: <T>(path: string, data?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data ?? {}), ...opts }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>(path, { method: "DELETE", ...opts }),
  fileUrl: (path: string) => `${API_BASE}${path}`,
  postForBlob
};
