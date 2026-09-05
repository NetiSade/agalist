import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

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

function safeEqual(a, b) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

// Resolve the caller to a Supabase user id. Two bearer-token paths:
//
// 1. End users: `Authorization: Bearer <Supabase access token>` - the JWT a
//    signed-in user gets from supabase-js (signInWithPassword, etc.). Verified
//    server-side with auth.getUser(); the user id comes from the verified
//    token, never from the request. This is what makes the API multi-user.
//
// 2. Owner automation: `Authorization: Bearer <AGALIST_API_TOKEN>` - a static
//    token for the deployment owner's own scripts. It maps to exactly one
//    account: the UUID in AGALIST_OWNER_USER_ID. It cannot act as any other user,
//    and no endpoint accepts a user_id from the caller.
//
// Returns the user id, or null after writing an error response.
export async function resolveAuth(req, res, supabase) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
  if (!token) {
    res.status(401).json({ error: 'missing bearer token' });
    return null;
  }

  const ownerToken = process.env.AGALIST_API_TOKEN;
  if (ownerToken && safeEqual(token, ownerToken)) {
    const ownerId = process.env.AGALIST_OWNER_USER_ID;
    if (!ownerId) {
      res.status(500).json({ error: 'AGALIST_OWNER_USER_ID is not configured' });
      return null;
    }
    return ownerId;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: 'invalid or expired token' });
    return null;
  }
  return data.user.id;
}
