import { checkAuth, getSupabase, getUserId } from './_lib.js';

// GET /api/list — every active section with its items and their states.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'method not allowed' });
  if (!checkAuth(req, res)) return;

  try {
    const supabase = getSupabase();
    const userId = await getUserId(supabase);

    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('id, name, sort_order, is_protected')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (catError) throw catError;

    const { data: items, error: itemError } = await supabase
      .from('shopping_list')
      .select('id, item_name, category_id, is_purchased, count')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true });
    if (itemError) throw itemError;

    // Same convention as the app: the protected default ("אחר") is pinned to the bottom.
    const sorted = categories.slice().sort((a, b) => (a.is_protected ? 1 : 0) - (b.is_protected ? 1 : 0));

    res.status(200).json({
      sections: sorted.map(cat => ({
        id: cat.id,
        name: cat.name,
        items: items
          .filter(item => item.category_id === cat.id)
          .map(item => ({
            id: item.id,
            name: item.item_name,
            purchased: item.is_purchased,
            count: item.count ?? 1,
          })),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
