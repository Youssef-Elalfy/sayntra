import type { Locale } from "@/components/providers";
import { localeTag } from "./format";
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public errors: Record<string, string[]> = {},
  ) {
    super(message);
  }
}
const origin = process.env.NEXT_PUBLIC_API_URL || "";
let csrf: Promise<void> | undefined;
async function initializeCsrf() {
  const response = await fetch(`${origin}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (response.status !== 204)
    throw new ApiError(
      response.status,
      "Could not establish a secure session.",
    );
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method || "GET";
  if (!["GET", "HEAD"].includes(method)) {
    if (!csrf)
      csrf = initializeCsrf().catch((error) => {
        csrf = undefined;
        throw error;
      });
    await csrf;
  }
  const token =
    typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith("XSRF-TOKEN="))
          ?.slice(11)
      : undefined;
  let response: Response;
  try {
    response = await fetch(`${origin}/api/v1${path}`, {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(options.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        "Accept-Language":
          typeof document !== "undefined"
            ? document.documentElement.lang
            : "en",
        ...(token ? { "X-XSRF-TOKEN": decodeURIComponent(token) } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach SAYNTRA. Check your connection and try again.",
    );
  }
  if (
    response.status !== 204 &&
    !response.headers.get("content-type")?.includes("application/json")
  )
    throw new ApiError(
      502,
      "The API returned an unexpected response. Please try again.",
    );
  const data =
    response.status === 204
      ? {}
      : await response.json().catch(() => {
          throw new ApiError(502, "The API response could not be read.");
        });
  if (!response.ok) {
    if (response.status === 419) csrf = undefined;
    throw new ApiError(
      response.status,
      data.message || "The request could not be completed.",
      data.errors,
    );
  }
  return data as T;
}
export const post = <T>(path: string, data: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(data) });
export const patch = <T>(path: string, data: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(data) });
export const mutationKey = () => crypto.randomUUID();
export function money(minor: number, language: Locale = "en", currency = "EGP") {
  return new Intl.NumberFormat(localeTag(language), {
    style: "currency",
    currency,
  }).format(minor / 100);
}
