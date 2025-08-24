import { proxyFetch } from '@/lib/proxyFetch';
export const dynamic = "force-dynamic";

export async function POST(req) {
  const payload = await req.json();
  const r = await proxyFetch('/jobs/os', { method:'POST', body: payload });
  return Response.json(r.data, { status: r.ok ? 200 : r.status });
}

