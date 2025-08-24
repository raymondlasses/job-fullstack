import { proxyFetch } from '@/lib/proxyFetch';
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = {};
  searchParams.forEach((v, k) => { query[k] = v; });

  if (query.filter_text && !query.filter) {
    query.filter = query.filter_text;
  }

  const r = await proxyFetch(process.env.RESULTS_PAGED_PATH || '/results/paged', { query });
  return Response.json(r.data, { status: r.ok ? 200 : r.status });
}
