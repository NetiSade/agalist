import { checkAuth, getSupabase, getUserId } from './_lib.js';

// POST   /api/items  { name, category }                 — add an item to a section
// PATCH  /api/items  { id | name [, category], purchased } — mark an item bought/missing
//
// "category" is the section name (e.g. "מקרר"); "category_id" also works.
export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;

  try {
    const supabase = getSupabase();
    const userId = await getUserId(supabase);

    if (req.method === 'POST') return await addItem(req, res, supabase, userId);
    if (req.method === 'PATCH') return await updateItem(req, res, supabase, userId);
    res.status(405).json({ error: 'method not allowed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function resolveCategory(supabase, userId, body) {
  const { category, category_id } = body || {};
  if (!category && !category_id) return null;
  let query = supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', userId)
    .is('archived_at', null);
  query = category_id ? query.eq('id', category_id) : query.eq('name', category.trim());
  const { data, error } = await query.limit(1);
  if (error) throw error;
  return data[0] || null;
}

async function addItem(req, res, supabase, userId) {
  const name = (req.body?.name || '').trim();
  if (!name) return res.status(400).json({ error: 'name is required' });

  const cat = await resolveCategory(supabase, userId, req.body);
  if (!cat) return res.status(404).json({ error: 'category not found' });

  // Same rule as the app: if the same name already exists in the section (even
  // archived) — restore it, bump the count and mark it unpurchased. Otherwise insert.
  const { data: existing, error } = await supabase
    .from('shopping_list')
    .select('*')
    .eq('category_id', cat.id)
    .eq('item_name', name);
  if (error) throw error;

  const match = existing && (existing.find(r => r.archived_at === null) || existing[0]);
  if (match) {
    const count = (match.count ?? 1) + 1;
    const { error: updateError } = await supabase
      .from('shopping_list')
      .update({ count, is_purchased: false, archived_at: null })
      .eq('id', match.id);
    if (updateError) throw updateError;
    return res.status(200).json({ id: match.id, name, category: cat.name, restored: true, count });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('shopping_list')
    .insert([{ item_name: name, category_id: cat.id, user_id: userId, count: 1 }])
    .select('id')
    .single();
  if (insertError) throw insertError;
  res.status(201).json({ id: inserted.id, name, category: cat.name, restored: false, count: 1 });
}

async function updateItem(req, res, supabase, userId) {
  const { id, name, purchased } = req.body || {};
  if (typeof purchased !== 'boolean') {
    return res.status(400).json({ error: 'purchased (boolean) is required' });
  }

  let itemId = id;
  if (!itemId) {
    if (!name || !name.trim()) return res.status(400).json({ error: 'id or name is required' });
    let query = supabase
      .from('shopping_list')
      .select('id')
      .eq('user_id', userId)
      .is('archived_at', null)
      .eq('item_name', name.trim());
    if (req.body.category || req.body.category_id) {
      const cat = await resolveCategory(supabase, userId, req.body);
      if (!cat) return res.status(404).json({ error: 'category not found' });
      query = query.eq('category_id', cat.id);
    }
    const { data, error } = await query.limit(2);
    if (error) throw error;
    if (data.length === 0) return res.status(404).json({ error: 'item not found' });
    if (data.length > 1) return res.status(409).json({ error: 'multiple items match; pass id or category' });
    itemId = data[0].id;
  }

  const { error: updateError } = await supabase
    .from('shopping_list')
    .update({ is_purchased: purchased })
    .eq('id', itemId)
    .eq('user_id', userId);
  if (updateError) throw updateError;
  res.status(200).json({ id: itemId, purchased });
}
