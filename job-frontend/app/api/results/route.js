import { proxyFetch } from '@/lib/proxyFetch';
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = {};
  searchParams.forEach((v, k) => { query[k] = v; });

  const r = await proxyFetch(process.env.RESULTS_PATH || '/results', { query });
  return Response.json(r.data, { status: r.ok ? 200 : r.status });
}

