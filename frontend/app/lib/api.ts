// app/lib/api.ts
export async function apiFetch(
  url: string,
  token: string | null,
  options: RequestInit = {}
) {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Hard auth failure – stop infinite loops
    throw new Error("AUTH_EXPIRED");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API error");
  }

  return res.json();
}