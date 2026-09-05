import { resolveAuth, getSupabase } from './_lib.js';

// GET /api/list — every active section with its items and their states.
// Purchased items are included with purchased: true until they are cleared in the app.
// Pass ?include=archived to also return cleared items, each flagged archived: true.
//
// Items always carry their timestamp columns. The select is '*' and the known
// timestamp names are passed through only when the row actually has them, so a
// schema that later adds updated_at / purchased_at exposes them automatically.

const TIMESTAMP_FIELDS = ['created_at', 'updated_at', 'purchased_at', 'archived_at'];

function timestamps(row) {
  const out = {};
  for (const key of TIMESTAMP_FIELDS) {
    if (key in row) out[key] = row[key];
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  try {
    const supabase = getSupabase();
    const userId = await resolveAuth(req, res, supabase);
    if (!userId) return;
    const includeArchived = String(req.query.include || '').split(',').includes('archived');

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, sort_order, is_protected, created_at')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (catError) throw catError;

    let itemsQuery = supabase
      .from('shopping_list')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (!includeArchived) itemsQuery = itemsQuery.is('archived_at', null);
    const { data: items, error: itemError } = await itemsQuery;
    if (itemError) throw itemError;

    // Same convention as the app: the protected default ("אחר") is pinned to the bottom.
    const sorted = categories.slice().sort((a, b) => (a.is_protected ? 1 : 0) - (b.is_protected ? 1 : 0));

    res.status(200).json({
      sections: sorted.map(cat => ({
        id: cat.id,
        name: cat.name,
        created_at: cat.created_at,
        items: items
          .filter(item => item.category_id === cat.id)
          .map(item => ({
            id: item.id,
            name: item.item_name,
            purchased: item.is_purchased,
            count: item.count ?? 1,
            ...timestamps(item),
            ...(includeArchived ? { archived: item.archived_at !== null } : {}),
          })),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
