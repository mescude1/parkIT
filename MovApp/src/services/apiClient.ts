import Storage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/config";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const method = options.method ?? "GET";

  if (__DEV__) {
    console.log(`[API] ${method} ${url}`);
  }

  const token = await Storage.getItem("access_token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> ?? {}),
  };

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkError: unknown) {
    const msg = networkError instanceof Error ? networkError.message : String(networkError);
    if (__DEV__) {
      console.error(`[API] Network error: ${method} ${url} →`, msg);
    }
    throw new Error(`Network error: ${method} ${url}\n${msg}`);
  }

  if (__DEV__) {
    const finalUrl = response.url;
    if (finalUrl && finalUrl !== url) {
      console.warn(`[API] Redirected: ${url} → ${finalUrl}`);
      console.warn(`[API] POST→GET conversion likely occurred (301/302 redirect)`);
    }
    console.log(`[API] ${response.status} ${method} ${url}`);
  }

  if (!response.ok) {
    const rawText = await response.text().catch(() => "");
    let message = `HTTP ${response.status} on ${method} ${url}`;
    try {
      const body = JSON.parse(rawText) as {
        message?: string;
        errors?: Array<Record<string, string>>;
      };
      if (body.message) message = body.message;
      // Append field-level validation errors (422 responses)
      if (body.errors?.length) {
        const fieldMessages = body.errors
          .flatMap((e) => Object.values(e))
          .join(", ");
        message = `${message}: ${fieldMessages}`;
      }
      if (__DEV__) {
        console.error(`[API] Error body:`, body);
      }
    } catch {
      if (__DEV__) {
        console.error(`[API] Non-JSON error body:`, rawText.slice(0, 300));
      }
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "DELETE",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
};
