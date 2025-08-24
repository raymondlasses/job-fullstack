export async function proxyFetch(path, { method='GET', body, query } = {}) {
  const url = new URL(process.env.BACKEND_BASE_URL + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    }
  }

  console.log(`[proxyFetch] ${method} ${url.toString()}`);

  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  console.log(`[proxyFetch] ← ${res.status} ${url.pathname}${url.search}`);
  return { ok: res.ok, status: res.status, data };
}

