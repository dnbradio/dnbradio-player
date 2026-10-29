export const http = {
  async get(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = response.headers.get("content-type")?.includes("json")
      ? await response.json()
      : await response.text();
    return { data };
  },
};
