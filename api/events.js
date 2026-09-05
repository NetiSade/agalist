import { resolveAuth, getSupabase } from './_lib.js';

// GET /api/events — the purchase log, newest first.
// Every POST/PATCH/DELETE on /api/items appends here.
//
// Query params:
//   ?limit=N        — max rows (default 100, capped at 500)
//   ?event_type=T   — filter: added | marked_bought | marked_missing | deleted
//   ?since=ISO      — only events after this timestamp
//
// Requires the purchase_events table — see
// supabase/migrations/20260904000000_purchase_events.sql.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  try {
    const supabase = getSupabase();
    const userId = await resolveAuth(req, res, supabase);
    if (!userId) return;

    const parsed = parseInt(req.query.limit, 10);
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 500) : 100;
    const eventType = (req.query.event_type || '').trim();
    const since = (req.query.since || '').trim();

    let query = supabase
      .from('purchase_events')
      .select('id, item_name, category, event_type, count_delta, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (eventType) query = query.eq('event_type', eventType);
    if (since) query = query.gt('created_at', since);

    const { data, error } = await query;
    if (error) throw error;

    res.status(200).json({ events: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
