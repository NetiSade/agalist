import { useState, useEffect, useRef } from 'react';
import { 
  Apple, 
  Beef, 
  Package, 
  Sparkles, 
  Milk, 
  Wine, 
  Plus, 
  Trash2, 
  RotateCcw, 
  X, 
  CheckCircle2, 
  Circle,
  ShoppingBag,
  Info,
  Check
} from 'lucide-react';

const CATEGORIES_ORDER = [
  "פירות וירקות",
  "בשר ודגים",
  "מזווה",
  "חומרי ניקוי",
  "מוצרי חלב",
  "יין ואלכוהול"
];

const CATEGORY_STYLES = {
  "פירות וירקות": {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-150",
    badge: "bg-emerald-100/80 text-emerald-800",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white",
    iconColor: "text-emerald-600",
    hoverBg: "hover:bg-emerald-50/30",
    icon: Apple
  },
  "בשר ודגים": {
    bg: "bg-rose-50 text-rose-800 border-rose-100",
    text: "text-rose-800",
    border: "border-rose-150",
    badge: "bg-rose-100/80 text-rose-800",
    buttonBg: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white",
    iconColor: "text-rose-600",
    hoverBg: "hover:bg-rose-50/30",
    icon: Beef
  },
  "מזווה": {
    bg: "bg-amber-50 text-amber-800 border-amber-100",
    text: "text-amber-800",
    border: "border-amber-150",
    badge: "bg-amber-100/80 text-amber-800",
    buttonBg: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white",
    iconColor: "text-amber-600",
    hoverBg: "hover:bg-amber-50/30",
    icon: Package
  },
  "חומרי ניקוי": {
    bg: "bg-sky-50 text-sky-800 border-sky-100",
    text: "text-sky-800",
    border: "border-sky-150",
    badge: "bg-sky-100/80 text-sky-800",
    buttonBg: "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white",
    iconColor: "text-sky-600",
    hoverBg: "hover:bg-sky-50/30",
    icon: Sparkles
  },
  "מוצרי חלב": {
    bg: "bg-indigo-50 text-indigo-800 border-indigo-100",
    text: "text-indigo-800",
    border: "border-indigo-150",
    badge: "bg-indigo-100/80 text-indigo-800",
    buttonBg: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white",
    iconColor: "text-indigo-600",
    hoverBg: "hover:bg-indigo-50/30",
    icon: Milk
  },
  "יין ואלכוהול": {
    bg: "bg-purple-50 text-purple-800 border-purple-100",
    text: "text-purple-800",
    border: "border-purple-150",
    badge: "bg-purple-100/80 text-purple-800",
    buttonBg: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white",
    iconColor: "text-purple-600",
    hoverBg: "hover:bg-purple-50/30",
    icon: Wine
  }
};

const INITIAL_ITEMS = [
  { id: '1', name: 'עגבניות שרי', category: 'פירות וירקות', isPurchased: false },
  { id: '2', name: 'מלפפונים', category: 'פירות וירקות', isPurchased: false },
  { id: '3', name: 'בננות צהובות', category: 'פירות וירקות', isPurchased: true },
  { id: '4', name: 'חזה עוף טרי', category: 'בשר ודגים', isPurchased: false },
  { id: '5', name: 'פילה סלמון', category: 'בשר ודגים', isPurchased: false },
  { id: '6', name: 'שמן זית', category: 'מזווה', isPurchased: true },
  { id: '7', name: 'אורז בסמטי', category: 'מזווה', isPurchased: false },
  { id: '8', name: 'טבליות למדיח', category: 'חומרי ניקוי', isPurchased: true },
  { id: '9', name: 'נוזל כלים', category: 'חומרי ניקוי', isPurchased: false },
  { id: '10', name: 'חלב 3%', category: 'מוצרי חלב', isPurchased: false },
  { id: '11', name: 'גבינה צהובה', category: 'מוצרי חלב', isPurchased: false },
  { id: '12', name: 'יוגורט יווני', category: 'מוצרי חלב', isPurchased: true },
  { id: '13', name: 'יין אדום יבש', category: 'יין ואלכוהול', isPurchased: false }
];

function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('family-shopping-list');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [activeAddCategory, setActiveAddCategory] = useState(null);
  const [newItemName, setNewItemName] = useState('');
  
  const inputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('family-shopping-list', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (activeAddCategory && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeAddCategory]);

  const togglePurchased = (id) => {
    setItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, isPurchased: !item.isPurchased } : item
      )
    );
  };

  const handleAddItem = (categoryName) => {
    if (!newItemName.trim()) return;
    const newItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: categoryName,
      isPurchased: false
    };
    setItems(prevItems => [...prevItems, newItem]);
    setNewItemName('');
    setActiveAddCategory(null);
  };

  const deleteItem = (id) => {
    setItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const clearPurchased = () => {
    setItems(prevItems => prevItems.filter(item => !item.isPurchased));
  };

  const resetToDefault = () => {
    if (window.confirm('האם אתה בטוח שברצונך לאפס את הרשימה לפריטי ברירת המחדל?')) {
      setItems(INITIAL_ITEMS);
      setActiveAddCategory(null);
      setNewItemName('');
    }
  };

  // Stats calculation
  const totalItemsCount = items.length;
  const purchasedItemsCount = items.filter(item => item.isPurchased).length;
  const missingItemsCount = totalItemsCount - purchasedItemsCount;
  const progressPercent = totalItemsCount > 0 ? Math.round((purchasedItemsCount / totalItemsCount) * 100) : 0;

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
                {missingItemsCount === 0 && totalItemsCount > 0 ? (
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
                onClick={resetToDefault}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all border border-slate-150 cursor-pointer"
                title="איפוס פריטי מחדל"
              >
                <RotateCcw className="w-4 h-4" />
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
          
          {CATEGORIES_ORDER.map(categoryName => {
            const style = CATEGORY_STYLES[categoryName];
            const Icon = style.icon;
            
            const categoryItems = items.filter(item => item.category === categoryName);
            const missingItems = categoryItems.filter(item => !item.isPurchased);
            const purchasedItems = categoryItems.filter(item => item.isPurchased);
            
            const totalCount = categoryItems.length;
            const missingCount = missingItems.length;
            const isAdding = activeAddCategory === categoryName;

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
                    onClick={() => {
                      if (isAdding) {
                        setActiveAddCategory(null);
                        setNewItemName('');
                      } else {
                        setActiveAddCategory(categoryName);
                        setNewItemName('');
                      }
                    }}
                    className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                      isAdding 
                        ? 'bg-slate-800 text-white border-slate-800 rotate-45 shadow-sm' 
                        : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-3xs active:scale-95'
                    }`}
                    aria-label={isAdding ? "ביטול הוספה" : "הוסף פריט קטגוריה"}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Inline Add Input Field */}
                {isAdding && (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddItem(categoryName);
                    }}
                    className="p-3 bg-slate-50/50 border-b border-slate-100 flex gap-2 items-center animate-fadeIn"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder={`הקלד פריט ל${categoryName}...`}
                      className="flex-1 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-350 focus:border-slate-350 text-slate-800 placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!newItemName.trim()}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer active:scale-95 ${
                        newItemName.trim() 
                          ? style.buttonBg 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed border-transparent'
                      }`}
                    >
                      שמירה
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAddCategory(null);
                        setNewItemName('');
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all"
                      aria-label="ביטול"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                )}

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

      </div>
    </div>
  );
}

export default App;
