export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  
  if (url.startsWith("/api/")) {
    const saved = localStorage.getItem("vega_crm_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.sessionToken) {
          init = init || {};
          const headers = new Headers(init.headers || {});
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${parsed.sessionToken}`);
          }
          init.headers = headers;
        }
      } catch (e) {
        console.error("Error parsing user session for fetch interceptor:", e);
      }
    }
  }
  return window.fetch(input, init);
}
