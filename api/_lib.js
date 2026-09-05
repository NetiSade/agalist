import { createClient } from '@supabase/supabase-js';

// Shared helpers for the agalist API routes.
// Files under api/ prefixed with "_" are not routed as endpoints.

export function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error('SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set');
  }
  // The service role bypasses RLS, so every query here filters by user_id explicitly.
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

// Resolve the caller to a Supabase user id.
//
// `Authorization: Bearer <Supabase access token>` - the JWT a signed-in user
// gets from supabase-js (signInWithPassword, or an access token refreshed from
// a stored refresh token). Verified server-side with auth.getUser(); the user
// id comes from the verified token, never from the request. Every query then
// filters by that user id, so each caller only ever touches their own list.
//
// There is deliberately no static/superuser token: no credential exists that
// could expose anyone else's list.
//
// Returns the user id, or null after writing an error response.
export async function resolveAuth(req, res, supabase) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) {
    res.status(401).json({ error: 'missing bearer token' });
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'invalid or expired token' });
    return null;
  }
  return data.user.id;
}
