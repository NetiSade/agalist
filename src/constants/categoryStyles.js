import {
  Apple,
  Beef,
  Package,
  Wheat,
  Sparkles,
  Droplets,
  Milk,
  Wine,
  Tag,
  Carrot,
  Fish,
  Egg,
  Coffee,
  Candy,
  Baby,
  Banana,
  Cherry,
  Grape,
  Citrus,
  Salad,
  Sandwich,
  Pizza,
  Croissant,
  Cookie,
  CakeSlice,
  IceCreamCone,
  CupSoda,
  Beer,
  Ham,
  Drumstick,
  Soup,
  Popcorn,
  Snowflake,
  Nut,
  Leaf,
  Utensils,
  PawPrint,
  Pill,
  Bath,
  Shirt,
  Flower2,
  Lightbulb,
  Gift
} from 'lucide-react';

// Tailwind requires literal class strings in code, so this map lives here;
// the DB stores only the color key and the icon name.
export const COLOR_STYLES = {
  emerald: { bg: "bg-emerald-50 text-emerald-800 border-emerald-100", text: "text-emerald-800", border: "border-emerald-150", badge: "bg-emerald-100/80 text-emerald-800", buttonBg: "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white", iconColor: "text-emerald-600", hoverBg: "hover:bg-emerald-50/30", swatch: "bg-emerald-500" },
  rose:    { bg: "bg-rose-50 text-rose-800 border-rose-100", text: "text-rose-800", border: "border-rose-150", badge: "bg-rose-100/80 text-rose-800", buttonBg: "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white", iconColor: "text-rose-600", hoverBg: "hover:bg-rose-50/30", swatch: "bg-rose-500" },
  amber:   { bg: "bg-amber-50 text-amber-800 border-amber-100", text: "text-amber-800", border: "border-amber-150", badge: "bg-amber-100/80 text-amber-800", buttonBg: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white", iconColor: "text-amber-600", hoverBg: "hover:bg-amber-50/30", swatch: "bg-amber-500" },
  orange:  { bg: "bg-orange-50 text-orange-800 border-orange-100", text: "text-orange-800", border: "border-orange-150", badge: "bg-orange-100/80 text-orange-800", buttonBg: "bg-orange-600 hover:bg-orange-700 active:bg-orange-800 text-white", iconColor: "text-orange-600", hoverBg: "hover:bg-orange-50/30", swatch: "bg-orange-500" },
  sky:     { bg: "bg-sky-50 text-sky-800 border-sky-100", text: "text-sky-800", border: "border-sky-150", badge: "bg-sky-100/80 text-sky-800", buttonBg: "bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white", iconColor: "text-sky-600", hoverBg: "hover:bg-sky-50/30", swatch: "bg-sky-500" },
  teal:    { bg: "bg-teal-50 text-teal-800 border-teal-100", text: "text-teal-800", border: "border-teal-150", badge: "bg-teal-100/80 text-teal-800", buttonBg: "bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white", iconColor: "text-teal-600", hoverBg: "hover:bg-teal-50/30", swatch: "bg-teal-500" },
  indigo:  { bg: "bg-indigo-50 text-indigo-800 border-indigo-100", text: "text-indigo-800", border: "border-indigo-150", badge: "bg-indigo-100/80 text-indigo-800", buttonBg: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white", iconColor: "text-indigo-600", hoverBg: "hover:bg-indigo-50/30", swatch: "bg-indigo-500" },
  purple:  { bg: "bg-purple-50 text-purple-800 border-purple-100", text: "text-purple-800", border: "border-purple-150", badge: "bg-purple-100/80 text-purple-800", buttonBg: "bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white", iconColor: "text-purple-600", hoverBg: "hover:bg-purple-50/30", swatch: "bg-purple-500" },
  pink:    { bg: "bg-pink-50 text-pink-800 border-pink-100", text: "text-pink-800", border: "border-pink-150", badge: "bg-pink-100/80 text-pink-800", buttonBg: "bg-pink-600 hover:bg-pink-700 active:bg-pink-800 text-white", iconColor: "text-pink-600", hoverBg: "hover:bg-pink-50/30", swatch: "bg-pink-500" },
  slate:   { bg: "bg-slate-50 text-slate-700 border-slate-100", text: "text-slate-700", border: "border-slate-150", badge: "bg-slate-100/80 text-slate-700", buttonBg: "bg-slate-600 hover:bg-slate-700 active:bg-slate-800 text-white", iconColor: "text-slate-500", hoverBg: "hover:bg-slate-50/30", swatch: "bg-slate-500" }
};

export const CATEGORY_ICONS = {
  // Fruits & vegetables
  Apple,
  Banana,
  Cherry,
  Grape,
  Citrus,
  Carrot,
  Salad,
  Leaf,
  // Protein & dairy
  Beef,
  Fish,
  Egg,
  Ham,
  Drumstick,
  Milk,
  // Bread, pantry & prepared food
  Wheat,
  Croissant,
  Sandwich,
  Pizza,
  Soup,
  Nut,
  Package,
  Utensils,
  // Snacks & sweets
  Candy,
  Cookie,
  CakeSlice,
  IceCreamCone,
  Popcorn,
  // Drinks
  Coffee,
  CupSoda,
  Wine,
  Beer,
  // Frozen
  Snowflake,
  // Household & personal care
  Sparkles,
  Droplets,
  Bath,
  Pill,
  Shirt,
  Lightbulb,
  // Other
  Baby,
  PawPrint,
  Flower2,
  Gift,
  Tag
};

export const COLOR_KEYS = Object.keys(COLOR_STYLES);
export const ICON_KEYS = Object.keys(CATEGORY_ICONS);

// Unknown DB values fall back safely to slate/Tag instead of crashing
export function getCategoryStyle(category) {
  return {
    ...(COLOR_STYLES[category?.color] ?? COLOR_STYLES.slate),
    Icon: CATEGORY_ICONS[category?.icon] ?? Tag
  };
}
