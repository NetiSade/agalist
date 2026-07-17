import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase.js';

const DUPLICATE_NAME_ERROR = 'כבר קיימת קטגוריה בשם הזה';

export function useCategories(user) {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const seededRef = useRef(false);

  const fetchCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      setLoadingCategories(false);
      return null;
    }

    // The protected default ("אחר") is always pinned to the bottom,
    // regardless of sort_order (stable sort keeps server order otherwise)
    const sorted = (data || []).slice().sort(
      (a, b) => (a.is_protected ? 1 : 0) - (b.is_protected ? 1 : 0)
    );
    setCategories(sorted);
    setLoadingCategories(false);
    return sorted;
  }, []);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      const data = await fetchCategories();
      // Users that predate the signup trigger — seed defaults via RPC (idempotent)
      if (data && data.length === 0 && !seededRef.current) {
        seededRef.current = true;
        const { error } = await supabase.rpc('seed_default_categories');
        if (error) {
          console.error('Error seeding default categories:', error);
        } else {
          await fetchCategories();
        }
      }
    };

    init();

    const channel = supabase
      .channel('realtime_categories')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter: `user_id=eq.${user.id}` },
        () => fetchCategories()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchCategories]);

  const isDuplicateName = (name, excludeId = null) =>
    categories.some(c => c.id !== excludeId && c.name === name);

  const addCategory = async (rawName, color, icon) => {
    const name = (rawName || '').trim();
    if (!name) return { error: 'יש להזין שם קטגוריה' };
    if (isDuplicateName(name)) return { error: DUPLICATE_NAME_ERROR };

    const maxOrder = categories.reduce((max, c) => Math.max(max, c.sort_order), -1);
    const { error } = await supabase.from('categories').insert([{
      name,
      color,
      icon,
      sort_order: maxOrder + 1,
      user_id: user.id
    }]);

    if (error) {
      console.error('Error adding category:', error);
      return { error: error.code === '23505' ? DUPLICATE_NAME_ERROR : 'שגיאה בהוספת הקטגוריה' };
    }
    await fetchCategories();
    return {};
  };

  const updateCategory = async (id, rawName, color, icon) => {
    const name = (rawName || '').trim();
    if (!name) return { error: 'יש להזין שם קטגוריה' };
    if (isDuplicateName(name, id)) return { error: DUPLICATE_NAME_ERROR };

    const { error } = await supabase
      .from('categories')
      .update({ name, color, icon })
      .eq('id', id);

    if (error) {
      console.error('Error updating category:', error);
      return { error: error.code === '23505' ? DUPLICATE_NAME_ERROR : 'שגיאה בעדכון הקטגוריה' };
    }
    await fetchCategories();
    return {};
  };

  const deleteCategory = async (id) => {
    // Atomic RPC: moves the category's items to the protected default, then archives it
    const { error } = await supabase.rpc('delete_category', { cat_id: id });
    if (error) {
      console.error('Error deleting category:', error);
      return { error: 'שגיאה במחיקת הקטגוריה' };
    }
    await fetchCategories();
    return {};
  };

  const moveCategory = async (id, direction) => {
    const index = categories.findIndex(c => c.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= categories.length) return;

    const current = categories[index];
    const target = categories[targetIndex];

    // The protected default is pinned to the bottom — never move it or move past it
    if (current.is_protected || target.is_protected) return;

    // Optimistic swap in state before persisting
    setCategories(prev => {
      const next = [...prev];
      next[index] = { ...target, sort_order: current.sort_order };
      next[targetIndex] = { ...current, sort_order: target.sort_order };
      return next;
    });

    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.from('categories').update({ sort_order: target.sort_order }).eq('id', current.id),
      supabase.from('categories').update({ sort_order: current.sort_order }).eq('id', target.id)
    ]);

    if (e1 || e2) {
      console.error('Error reordering categories:', e1 || e2);
      await fetchCategories();
    }
  };

  return {
    categories,
    loadingCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    moveCategory
  };
}
