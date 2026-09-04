import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

// Shared helpers for the agalist API routes.
// Files under api/ prefixed with "_" are not routed as endpoints.

export function checkAuth(req, res) {
  const expected = process.env.AGALIST_API_TOKEN;
  if (!expected) {
    res.status(500).json({ error: 'AGALIST_API_TOKEN is not configured' });
    return false;
  }
  const header = req.headers.authorization || '';
  const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  // The service role bypasses RLS, so every query here filters by user_id explicitly.
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// The list belongs to a single account; resolve its auth user id per request.
export async function getUserId(supabase) {
  const email = process.env.AGALIST_USER_EMAIL;
  if (!email) {
    throw new Error('AGALIST_USER_EMAIL is not configured (required - set it in the Vercel project env vars, no fallback account)');
  }
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (error) throw error;
  const user = data.users.find(u => u.email === email);
  if (!user) throw new Error(`no auth user with email ${email}`);
  return user.id;
}
