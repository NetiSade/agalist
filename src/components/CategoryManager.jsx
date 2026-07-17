import { useState, useEffect } from 'react';
import { Settings, X, ChevronUp, ChevronDown, Pencil, Trash2, Plus, Check, Loader2 } from 'lucide-react';
import { COLOR_STYLES, COLOR_KEYS, CATEGORY_ICONS, ICON_KEYS, getCategoryStyle } from '../constants/categoryStyles.js';

function CategoryEditor({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? 'slate');
  const [icon, setIcon] = useState(initial?.icon ?? 'Tag');
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    const result = await onSave(name, color, icon);
    setSaving(false);
    if (result?.error) setError(result.error);
  };

  return (
    <div className="p-3 space-y-3 bg-slate-50/60 rounded-xl border border-slate-100">
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
          placeholder="שם הקטגוריה"
          autoFocus
          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-300 focus:border-slate-300 text-slate-800 placeholder:text-slate-400 transition-all"
        />
        {error && (
          <p className="text-xs text-rose-600 font-medium mt-1.5">{error}</p>
        )}
      </div>

      {/* Color picker */}
      <div className="flex flex-wrap gap-2">
        {COLOR_KEYS.map(key => (
          <button
            key={key}
            type="button"
            onClick={() => setColor(key)}
            className={`w-7 h-7 rounded-full ${COLOR_STYLES[key].swatch} transition-all cursor-pointer flex items-center justify-center ${color === key ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}`}
            aria-label={`צבע ${key}`}
          >
            {color === key && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
          </button>
        ))}
      </div>

      {/* Icon picker */}
      <div className="flex flex-wrap gap-1.5">
        {ICON_KEYS.map(key => {
          const IconOption = CATEGORY_ICONS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${icon === key
                ? `${COLOR_STYLES[color].bg} ${COLOR_STYLES[color].iconColor} border-slate-300`
                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}
              aria-label={`אייקון ${key}`}
            >
              <IconOption className="w-4.5 h-4.5" />
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer active:scale-[0.99] disabled:opacity-60 ${COLOR_STYLES[color].buttonBg}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>שמירה</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

export default function CategoryManager({
  categories,
  onClose,
  addCategory,
  updateCategory,
  deleteCategory,
  moveCategory
}) {
  const [editingId, setEditingId] = useState(null); // category id | 'new' | null
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    await deleteCategory(id);
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      {/* Bottom sheet */}
      <div
        dir="rtl"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[70] bg-white rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxHeight: '85dvh' }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-white/90 shadow-2xs">
              <Settings className="w-4.5 h-4.5 text-slate-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-slate-700">ניהול קטגוריות</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">הוספה, עריכה, סידור ומחיקה</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-lg transition-all cursor-pointer"
            aria-label="סגור"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Category rows */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-1.5">
          {categories.map((category, index) => {
            const { Icon, ...style } = getCategoryStyle(category);

            if (editingId === category.id) {
              return (
                <CategoryEditor
                  key={category.id}
                  initial={category}
                  onSave={async (name, color, icon) => {
                    const result = await updateCategory(category.id, name, color, icon);
                    if (!result?.error) setEditingId(null);
                    return result;
                  }}
                  onCancel={() => setEditingId(null)}
                />
              );
            }

            return (
              <div
                key={category.id}
                className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-100 rounded-xl"
              >
                <div className={`p-1.5 rounded-lg ${style.bg}`}>
                  <Icon className={`w-4.5 h-4.5 ${style.iconColor}`} />
                </div>
                <span className="flex-1 text-[15px] font-medium text-slate-800 truncate">
                  {category.name}
                </span>

                {confirmDeleteId === category.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500 font-medium">
                      הפריטים יועברו ל"אחר". למחוק?
                    </span>
                    <button
                      onClick={() => handleDelete(category.id)}
                      disabled={deletingId === category.id}
                      className="px-2 py-1 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all cursor-pointer disabled:opacity-60"
                    >
                      {deletingId === category.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'מחיקה'}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                    >
                      ביטול
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5">
                    {/* The protected default is pinned to the bottom — no reordering */}
                    {!category.is_protected && (
                      <>
                        <button
                          onClick={() => moveCategory(category.id, 'up')}
                          disabled={index === 0}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-25 disabled:cursor-default"
                          aria-label="הזז למעלה"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveCategory(category.id, 'down')}
                          disabled={index === categories.length - 1 || categories[index + 1]?.is_protected}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer disabled:opacity-25 disabled:cursor-default"
                          aria-label="הזז למטה"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setEditingId(category.id)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                      aria-label="ערוך קטגוריה"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!category.is_protected && (
                      <button
                        onClick={() => setConfirmDeleteId(category.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        aria-label="מחק קטגוריה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add new category */}
          {editingId === 'new' ? (
            <CategoryEditor
              onSave={async (name, color, icon) => {
                const result = await addCategory(name, color, icon);
                if (!result?.error) setEditingId(null);
                return result;
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <button
              onClick={() => setEditingId('new')}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>הוספת קטגוריה</span>
            </button>
          )}

          <div className="pb-[max(0.25rem,env(safe-area-inset-bottom))]" />
        </div>
      </div>
    </>
  );
}
