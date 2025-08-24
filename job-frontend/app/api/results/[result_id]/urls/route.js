import { proxyFetch } from '@/lib/proxyFetch';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { result_id } = params;
  const { searchParams } = new URL(req.url);
  const query = {};
  searchParams.forEach((v, k) => { query[k] = v; });

  const path = `/results/${encodeURIComponent(result_id)}/urls`;
  const r = await proxyFetch(path, { query });
  return Response.json(r.data, { status: r.ok ? 200 : r.status });
}

