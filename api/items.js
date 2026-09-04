import { checkAuth, getSupabase, getUserId } from './_lib.js';

// POST   /api/items  { name, category }                 — add an item to a section
// PATCH  /api/items  { id | name [, category], purchased } — mark an item bought/missing
// DELETE /api/items  { id | name [, category] }         — remove an item (archives it, like the app's clear)
//
// "category" is the section name (e.g. "מקרר"); "category_id" also works.
//
// Every mutation also appends to the purchase_events log (see
// supabase/migrations/20260904000000_purchase_events.sql). Logging is
// best-effort: a failed insert (e.g. migration not run yet) is logged to the
// console and never changes the endpoint's response.
export default async function handler(req, res) {
  if (!checkAuth(req, res)) return;

  try {
    const supabase = getSupabase();
    const userId = await getUserId(supabase);

    if (req.method === 'POST') return await addItem(req, res, supabase, userId);
    if (req.method === 'PATCH') return await updateItem(req, res, supabase, userId);
    if (req.method === 'DELETE') return await deleteItem(req, res, supabase, userId);
    res.status(405).json({ error: 'method not allowed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

async function logEvent(supabase, userId, { itemName, category, eventType, countDelta = null }) {
  try {
    const { error } = await supabase.from('purchase_events').insert([{
      user_id: userId,
      item_name: itemName,
      category,
      event_type: eventType,
      count_delta: countDelta,
    }]);
    if (error) console.error('purchase_events insert failed:', error.message);
  } catch (err) {
    console.error('purchase_events insert failed:', err.message);
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
    await logEvent(supabase, userId, {
      itemName: name,
      category: cat.name,
      eventType: 'added',
      countDelta: 1,
    });
    return res.status(200).json({ id: match.id, name, category: cat.name, restored: true, count });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('shopping_list')
    .insert([{ item_name: name, category_id: cat.id, user_id: userId, count: 1 }])
    .select('id')
    .single();
  if (insertError) throw insertError;
  await logEvent(supabase, userId, {
    itemName: name,
    category: cat.name,
    eventType: 'added',
    countDelta: 1,
  });
  res.status(201).json({ id: inserted.id, name, category: cat.name, restored: false, count: 1 });
}

async function resolveItemId(req, res, supabase, userId) {
  const { id, name } = req.body || {};
  if (id) return id;
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'id or name is required' });
    return null;
  }
  let query = supabase
    .from('shopping_list')
    .select('id')
    .eq('user_id', userId)
    .is('archived_at', null)
    .eq('item_name', name.trim());
  if (req.body.category || req.body.category_id) {
    const cat = await resolveCategory(supabase, userId, req.body);
    if (!cat) {
      res.status(404).json({ error: 'category not found' });
      return null;
    }
    query = query.eq('category_id', cat.id);
  }
  const { data, error } = await query.limit(2);
  if (error) throw error;
  if (data.length === 0) {
    res.status(404).json({ error: 'item not found' });
    return null;
  }
  if (data.length > 1) {
    res.status(409).json({ error: 'multiple items match; pass id or category' });
    return null;
  }
  return data[0].id;
}

// Fetch the row (name + section) so the purchase log can record what happened.
async function fetchItemForLog(supabase, userId, itemId) {
  const { data: item, error } = await supabase
    .from('shopping_list')
    .select('item_name, category_id')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  let category = null;
  if (item.category_id) {
    const { data: cat } = await supabase
      .from('categories')
      .select('name')
      .eq('id', item.category_id)
      .limit(1);
    category = cat && cat[0] ? cat[0].name : null;
  }
  return { itemName: item.item_name, category };
}

async function updateItem(req, res, supabase, userId) {
  const { purchased } = req.body || {};
  if (typeof purchased !== 'boolean') {
    return res.status(400).json({ error: 'purchased (boolean) is required' });
  }

  const itemId = await resolveItemId(req, res, supabase, userId);
  if (!itemId) return;

  const { itemName, category } = await fetchItemForLog(supabase, userId, itemId);

  const { error: updateError } = await supabase
    .from('shopping_list')
    .update({ is_purchased: purchased })
    .eq('id', itemId)
    .eq('user_id', userId);
  if (updateError) throw updateError;
  await logEvent(supabase, userId, {
    itemName,
    category,
    eventType: purchased ? 'marked_bought' : 'marked_missing',
  });
  res.status(200).json({ id: itemId, purchased });
}

// DELETE removes an item the same way the app's clear does: it archives the row
// (archived_at), so it disappears from the default list but stays in history
// (GET /api/list?include=archived) and can be restored by re-adding it.
async function deleteItem(req, res, supabase, userId) {
  const itemId = await resolveItemId(req, res, supabase, userId);
  if (!itemId) return;

  const { itemName, category } = await fetchItemForLog(supabase, userId, itemId);

  const { error: updateError } = await supabase
    .from('shopping_list')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', userId);
  if (updateError) throw updateError;
  await logEvent(supabase, userId, {
    itemName,
    category,
    eventType: 'deleted',
  });
  res.status(200).json({ id: itemId, archived: true });
}
