import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase.js';
import { useAuth } from './AuthContext.jsx';
import AuthPage from './AuthPage.jsx';
import {
  Apple,
  Beef,
  Package,
  Sparkles,
  Milk,
  Wine,
  Plus,
  Trash2,
  X,
  ShoppingBag,
  Check,
  LogOut,
  Loader2,
  Droplets,
  Tag,
  Wheat,
  Search
} from 'lucide-react';

const CATEGORIES_ORDER = [
  "פירות וירקות",
  "בשר, עוף, דגים",
  "מזווה",
  "לחם ומאפים",
  "חומרי ניקוי",
  "היגיינה",
  "מוצרי חלב",
  "יין ואלכוהול",
  "אחר"
];

const CATEGORY_STYLES = {
  "פירות וירקות": { bg: "bg-emerald-50 text-emerald-800 border-emerald-100", text: "text-emerald-800", border: "border-emerald-150", badge: "bg-emerald-100/80 text-emerald-800", buttonBg: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white", iconColor: "text-emerald-600", hoverBg: "hover:bg-emerald-50/30", icon: Apple },
  "בשר, עוף, דגים": { bg: "bg-rose-50 text-rose-800 border-rose-100", text: "text-rose-800", border: "border-rose-150", badge: "bg-rose-100/80 text-rose-800", buttonBg: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white", iconColor: "text-rose-600", hoverBg: "hover:bg-rose-50/30", icon: Beef },
  "מזווה": { bg: "bg-amber-50 text-amber-800 border-amber-100", text: "text-amber-800", border: "border-amber-150", badge: "bg-amber-100/80 text-amber-800", buttonBg: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white", iconColor: "text-amber-600", hoverBg: "hover:bg-amber-50/30", icon: Package },
  "לחם ומאפים": { bg: "bg-orange-50 text-orange-800 border-orange-100", text: "text-orange-800", border: "border-orange-150", badge: "bg-orange-100/80 text-orange-800", buttonBg: "bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white", iconColor: "text-orange-600", hoverBg: "hover:bg-orange-50/30", icon: Wheat },
  "חומרי ניקוי": { bg: "bg-sky-50 text-sky-800 border-sky-100", text: "text-sky-800", border: "border-sky-150", badge: "bg-sky-100/80 text-sky-800", buttonBg: "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white", iconColor: "text-sky-600", hoverBg: "hover:bg-sky-50/30", icon: Sparkles },
  "היגיינה": { bg: "bg-teal-50 text-teal-800 border-teal-100", text: "text-teal-800", border: "border-teal-150", badge: "bg-teal-100/80 text-teal-800", buttonBg: "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white", iconColor: "text-teal-600", hoverBg: "hover:bg-teal-50/30", icon: Droplets },
  "מוצרי חלב": { bg: "bg-indigo-50 text-indigo-800 border-indigo-100", text: "text-indigo-800", border: "border-indigo-150", badge: "bg-indigo-100/80 text-indigo-800", buttonBg: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white", iconColor: "text-indigo-600", hoverBg: "hover:bg-indigo-50/30", icon: Milk },
  "יין ואלכוהול": { bg: "bg-purple-50 text-purple-800 border-purple-100", text: "text-purple-800", border: "border-purple-150", badge: "bg-purple-100/80 text-purple-800", buttonBg: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white", iconColor: "text-purple-600", hoverBg: "hover:bg-purple-50/30", icon: Wine },
  "אחר": { bg: "bg-slate-50 text-slate-700 border-slate-100", text: "text-slate-700", border: "border-slate-150", badge: "bg-slate-100/80 text-slate-700", buttonBg: "bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white", iconColor: "text-slate-500", hoverBg: "hover:bg-slate-50/30", icon: Tag }
};

// Shimmer placeholder shown on first load while items are fetched
function CategorySkeleton({ rows = 3 }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-slate-100/80 flex items-center justify-between bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg shimmer" />
          <div className="w-24 h-3.5 rounded-full shimmer" />
          <div className="w-12 h-4 rounded-full shimmer" />
        </div>
        <div className="w-7 h-7 rounded-xl shimmer" />
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-100/70">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 px-4 py-3.5">
            <div className="w-6.5 h-6.5 rounded-full shimmer flex-shrink-0" />
            <div
              className="h-3.5 rounded-full shimmer"
              style={{ width: `${55 - i * 12}%` }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function ShoppingList({ signOut, user }) {
  // State is initially empty, waiting for Supabase
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add-item modal state
  const [addModalCategory, setAddModalCategory] = useState(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Visual-viewport tracking so the sheet sits above the mobile keyboard
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  const inputRef = useRef(null);

  // 1. Fetching Data & Setting up Realtime Subscription
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('shopping_list')
        .select('*')
        .is('archived_at', null)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching items:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // מיפוי השדות של מסד הנתונים למבנה שה-UI שלך מצפה לו
        const formattedItems = data.map(row => ({
          id: row.id,
          name: row.item_name,
          category: row.category,
          isPurchased: row.is_purchased,
          count: row.count ?? 1
        }));
        setItems(formattedItems);
      }
      setLoading(false);
    };

    // קריאה ראשונית בעליית הקומפוננטה
    fetchItems();

    // האזנה לעדכונים בזמן אמת
    const channel = supabase
      .channel('realtime_shopping_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list' }, () => {
        fetchItems(); // רענון הרשימה בכל שינוי במסד
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 2. Add-item modal helpers
  const openAddModal = (categoryName) => {
    setQuery('');
    setSuggestions([]);
    setAddModalCategory(categoryName);
  };

  const closeAddModal = () => {
    setAddModalCategory(null);
    setQuery('');
    setSuggestions([]);
    setKeyboardInset(0);
    setViewportHeight(0);
  };

  // פוקוס אוטומטי על אינפוט החיפוש בפתיחת החלון
  useEffect(() => {
    if (addModalCategory && inputRef.current) {
      inputRef.current.focus();
    }
  }, [addModalCategory]);

  // סגירה ב-Escape
  useEffect(() => {
    if (!addModalCategory) return;
    const onKey = (e) => { if (e.key === 'Escape') closeAddModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addModalCategory]);

  // מעקב אחרי ה-visual viewport כדי שהחלון יישב מעל המקלדת במובייל
  useEffect(() => {
    if (!addModalCategory) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      // המרחק שהמקלדת "אוכלת" מתחתית מסך הפריסה
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      setKeyboardInset(inset);
      setViewportHeight(vv.height);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, [addModalCategory]);

  // טעינת הצעות פופולריות לקטגוריה הפתוחה (סכום ה-count על פני כל ההיסטוריה)
  useEffect(() => {
    if (!addModalCategory) return;
    let cancelled = false;

    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      const { data, error } = await supabase
        .from('shopping_list')
        .select('item_name, count')
        .eq('category', addModalCategory);

      if (cancelled) return;
      if (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setLoadingSuggestions(false);
        return;
      }

      // צבירה לפי שם פריט (אחרי trim) וסיכום ה-count = פופולריות
      const popularityByName = new Map();
      (data || []).forEach(row => {
        const name = (row.item_name || '').trim();
        if (!name) return;
        popularityByName.set(name, (popularityByName.get(name) || 0) + (row.count ?? 1));
      });

      const sorted = [...popularityByName.entries()]
        .map(([name, popularity]) => ({ name, popularity }))
        .sort((a, b) => b.popularity - a.popularity || a.name.localeCompare(b.name, 'he'));

      setSuggestions(sorted);
      setLoadingSuggestions(false);
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [addModalCategory]);

  // 3. Database Mutations
  const togglePurchased = async (id) => {
    const itemToToggle = items.find(item => item.id === id);
    if (!itemToToggle) return;

    // עדכון אופטימי ב-UI לתגובה מהירה (לפני שהשרת עונה)
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
      )
    );

    // עדכון במסד הנתונים
    await supabase
      .from('shopping_list')
      .update({ is_purchased: !itemToToggle.isPurchased })
      .eq('id', id);
  };

  // הוספת פריט: אם קיים כבר פריט באותו שם וקטגוריה (כולל פריטים בארכיון) –
  // משחזרים אותו, מעלים את ה-count ומסמנים כלא-נקנה. אחרת יוצרים שורה חדשה.
  const addItem = async (categoryName, rawName) => {
    const name = (rawName || '').trim();
    if (!name) return;

    const { data: existing, error } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('category', categoryName)
      .eq('item_name', name);

    if (error) {
      console.error('Error looking up existing item:', error);
      return;
    }

    // מעדיפים שורה פעילה; אחרת משחזרים שורה מהארכיון
    const match = existing && (existing.find(r => r.archived_at === null) || existing[0]);

    if (match) {
      await supabase
        .from('shopping_list')
        .update({
          count: (match.count ?? 1) + 1,
          is_purchased: false,
          archived_at: null
        })
        .eq('id', match.id);
    } else {
      await supabase.from('shopping_list').insert([{
        item_name: name,
        category: categoryName,
        user_id: user.id,
        count: 1
      }]);
    }
  };

  // הוספה מתוך החלון – נשארים פתוחים כדי לאפשר הוספת כמה פריטים ברצף
  const addFromModal = async (name) => {
    const categoryName = addModalCategory;
    await addItem(categoryName, name);
    setQuery('');
    if (inputRef.current) inputRef.current.focus();
  };

  const deleteItem = async (id) => {
    // עדכון אופטימי (הסרה מה-UI מיד)
    setItems(prevItems => prevItems.filter(item => item.id !== id));

    // שמירה בבסיס הנתונים עם חותמת ארכיון (לא מוחקים!)
    await supabase
      .from('shopping_list')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id);
  };

  const clearPurchased = async () => {
    // שמירה בבסיס הנתונים עם חותמת ארכיון במקום מחיקה
    await supabase
      .from('shopping_list')
      .update({ archived_at: new Date().toISOString() })
      .eq('is_purchased', true)
      .is('archived_at', null);
  };

  // Stats calculation
  const totalItemsCount = items.length;
  const purchasedItemsCount = items.filter(item => item.isPurchased).length;
  const missingItemsCount = totalItemsCount - purchasedItemsCount;
  const progressPercent = totalItemsCount > 0 ? Math.round((purchasedItemsCount / totalItemsCount) * 100) : 0;

  // Derived data for the open add-modal
  const trimmedQuery = query.trim();
  // Items still unchecked on the active list — those are already "needed", so don't suggest them.
  // Purchased (checked) items remain suggestable (tapping re-adds and marks them unpurchased).
  const uncheckedNamesInCategory = new Set(
    items
      .filter(item => item.category === addModalCategory && !item.isPurchased)
      .map(item => (item.name || '').trim())
  );
  const availableSuggestions = suggestions.filter(s => !uncheckedNamesInCategory.has(s.name));
  const filteredSuggestions = trimmedQuery
    ? availableSuggestions.filter(s => s.name.includes(trimmedQuery))
    : availableSuggestions;
  const queryMatchesExisting = suggestions.some(s => s.name === trimmedQuery);
  const modalStyle = addModalCategory ? CATEGORY_STYLES[addModalCategory] : null;

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 font-sans flex justify-center">
      {/* Centered container representing a mobile device on larger screens, full screen on mobile */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative border-x border-slate-100">

        {/* Sticky Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 px-5 py-4 shadow-xs">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Agalist
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {loading ? (
                  <span className="text-slate-400">טוען רשימה...</span>
                ) : missingItemsCount === 0 && totalItemsCount > 0 ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                     הכול מוכן! 🌟 כל הפריטים נקנו
                  </span>
                ) : (
                  <span>
                    נותרו {missingItemsCount} פריטים לקנות (נקנו {purchasedItemsCount} מתוך {totalItemsCount})
                  </span>
                )}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              {purchasedItemsCount > 0 && (
                <button
                  onClick={clearPurchased}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center gap-1 border border-rose-100 cursor-pointer"
                  title="נקה פריטים שנקנו"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">נקה</span>
                </button>
              )}
              <button
                id="sign-out-btn"
                onClick={signOut}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                title="יציאה"
                aria-label="יציאה מהחשבון"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {totalItemsCount > 0 && (
            <div className="mt-3.5 flex items-center gap-3">
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-slate-600">
                {progressPercent}%
              </span>
            </div>
          )}
        </header>

        {/* Categories & Items Scroll View */}
        <main className="flex-1 px-4 py-5 space-y-5 overflow-y-auto pb-12">

          {loading ? (
            <>
              <CategorySkeleton rows={3} />
              <CategorySkeleton rows={2} />
              <CategorySkeleton rows={4} />
              <CategorySkeleton rows={2} />
            </>
          ) : CATEGORIES_ORDER.map(categoryName => {
            const style = CATEGORY_STYLES[categoryName];
            const Icon = style.icon;

            const categoryItems = items.filter(item => item.category === categoryName);
            const missingItems = categoryItems.filter(item => !item.isPurchased);
            const purchasedItems = categoryItems.filter(item => item.isPurchased);

            const totalCount = categoryItems.length;
            const missingCount = missingItems.length;

            return (
              <section
                key={categoryName}
                className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden transition-all hover:shadow-sm"
              >
                {/* Category Header */}
                <div className={`px-4 py-3.5 border-b flex items-center justify-between transition-colors ${style.bg} border-slate-100/80`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg bg-white/90 shadow-2xs text-slate-700`}>
                      <Icon className={`w-4.5 h-4.5 ${style.iconColor}`} />
                    </div>
                    <h2 className={`text-[15px] font-bold ${style.text}`}>
                      {categoryName}
                    </h2>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold shadow-3xs ${style.badge}`}>
                      {missingCount} חסרים
                    </span>
                  </div>

                  <button
                    onClick={() => openAddModal(categoryName)}
                    className="p-1.5 rounded-xl border bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-3xs active:scale-95 transition-all cursor-pointer"
                    aria-label="הוסף פריט לקטגוריה"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Item Rows */}
                <div className="divide-y divide-slate-100/70">

                  {/* Missing Items */}
                  {missingItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => togglePurchased(item.id)}
                      className={`flex items-center justify-between px-4 py-3.5 transition-colors cursor-pointer group select-none ${style.hoverBg}`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Custom Touch Circle */}
                        <div
                          className="w-6.5 h-6.5 rounded-full border-2 border-slate-300 hover:border-slate-400 flex items-center justify-center transition-all bg-white flex-shrink-0"
                        >
                          <div className="w-3.5 h-3.5 rounded-full bg-slate-300 opacity-0 group-hover:opacity-25 transition-opacity"></div>
                        </div>
                        <span className="text-[15px] font-medium text-slate-800 truncate">
                          {item.name}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="מחק פריט"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Purchased Items */}
                  {purchasedItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => togglePurchased(item.id)}
                      className="flex items-center justify-between px-4 py-3.5 bg-slate-50/40 transition-colors cursor-pointer group select-none"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Custom Checked Circle */}
                        <div
                          className="w-6.5 h-6.5 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center transition-all flex-shrink-0"
                        >
                          <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                        </div>
                        <span className="text-[15px] text-slate-400 line-through truncate font-medium">
                          {item.name}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer opacity-100 sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="מחק פריט"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Empty state within category */}
                  {(totalCount === 0 || missingCount === 0) && (
                    <div className="px-4 py-4.5 text-center bg-slate-50/20 flex items-center justify-center gap-2">
                      <span className="text-xs font-semibold text-slate-400/80 tracking-wide bg-slate-100/80 border border-slate-200/30 px-3 py-1 rounded-full">
                        אין פריטים חסרים
                      </span>
                    </div>
                  )}

                </div>
              </section>
            );
          })}
        </main>

        {/* Footer Brand Info */}
        <footer className="py-4 border-t border-slate-100/60 bg-slate-50/50 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Agalist • מעוצב עבור מובייל 📱
          </p>
        </footer>

        {/* Add-item Modal */}
        {addModalCategory && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-fadeIn"
              onClick={closeAddModal}
            />
            {/* Bottom sheet — pinned above the mobile keyboard via visualViewport */}
            <div
              dir="rtl"
              className="fixed left-1/2 -translate-x-1/2 w-full max-w-md z-[70] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-sheetUp transition-[bottom,max-height] duration-200 ease-out"
              style={{
                bottom: keyboardInset,
                maxHeight: keyboardInset > 0 && viewportHeight
                  ? `${viewportHeight}px`
                  : '85dvh'
              }}
            >
              {/* Modal Header */}
              <div className={`px-5 py-4 border-b border-slate-100 flex items-center justify-between ${modalStyle.bg}`}>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-white/90 shadow-2xs">
                    {(() => { const I = modalStyle.icon; return <I className={`w-4.5 h-4.5 ${modalStyle.iconColor}`} />; })()}
                  </div>
                  <div>
                    <h3 className={`text-[15px] font-bold ${modalStyle.text}`}>הוספה ל{addModalCategory}</h3>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">בחר מההצעות או הקלד פריט חדש</p>
                  </div>
                </div>
                <button
                  onClick={closeAddModal}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-all cursor-pointer"
                  aria-label="סגור"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Search / Add input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (trimmedQuery) addFromModal(trimmedQuery);
                }}
                className="p-3 border-b border-slate-100"
              >
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`חיפוש או הוספת פריט ל${addModalCategory}...`}
                    className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-300 focus:border-slate-300 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </form>

              {/* Suggestions list */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {loadingSuggestions ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Add brand-new item that isn't among the suggestions */}
                    {trimmedQuery && !queryMatchesExisting && (
                      <button
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => addFromModal(trimmedQuery)}
                        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer active:scale-[0.99] ${modalStyle.buttonBg}`}
                      >
                        <Plus className="w-4 h-4" />
                        <span>הוספת "{trimmedQuery}"</span>
                      </button>
                    )}

                    {filteredSuggestions.map(s => (
                      <button
                        key={s.name}
                        onPointerDown={(e) => e.preventDefault()}
                        onClick={() => addFromModal(s.name)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-all cursor-pointer active:scale-[0.99] group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-white">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-[15px] font-medium text-slate-800 truncate">{s.name}</span>
                        </div>
                      </button>
                    ))}

                    {filteredSuggestions.length === 0 && !trimmedQuery && (
                      <div className="text-center py-10 px-4">
                        <p className="text-sm text-slate-400 font-medium">אין עדיין הצעות בקטגוריה זו</p>
                        <p className="text-xs text-slate-300 mt-1">הקלד למעלה כדי להוסיף פריט חדש</p>
                      </div>
                    )}

                    {filteredSuggestions.length === 0 && trimmedQuery && queryMatchesExisting && (
                      <div className="text-center py-6">
                        <p className="text-xs text-slate-300">אין תוצאות נוספות</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

function App() {
  const { session, signOut } = useAuth();

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return <ShoppingList signOut={signOut} user={session.user} />;
}

export default App;
