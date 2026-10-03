import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
};
const WEBHOOK_RE = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });

  const auth = req.headers.get('Authorization') ?? '';
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ success: false, error: 'Unauthorized' }, 401);

  const raw = await req.text();
  if (raw.length > 20000) return json({ success: false, error: 'Payload too large' }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return json({ success: false, error: 'Bad JSON' }, 400); }

  // webhook URL comes from the caller's own row (RLS) — never from the request body
  const { data: hook } = await supabase.from('user_webhooks').select('webhook_url').eq('user_id', user.id).maybeSingle();
  const url = hook?.webhook_url;
  if (!url || !WEBHOOK_RE.test(url)) return json({ success: false, error: 'No valid webhook configured' }, 400);

  const payload = body?.payload;
  if (!payload || typeof payload !== 'object') return json({ success: false, error: 'Invalid payload' }, 400);
  const safe = { username: String(payload.username ?? 'SkinAddon').slice(0, 80), content: payload.content ? String(payload.content).slice(0, 2000) : undefined,
    embeds: Array.isArray(payload.embeds) ? payload.embeds.slice(0, 3) : undefined, allowed_mentions: { parse: [] } };

  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(safe) });
  if (!r.ok) return json({ success: false, status: r.status, error: 'Discord rejected request' }, 502);
  return json({ success: true });
});
