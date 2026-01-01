import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { IN_CATEGORIES, OUT_CATEGORIES } from '../constants';
import * as Icons from 'lucide-react';

// Map of available icons for custom categories (subset of all Lucide icons)
export const AVAILABLE_ICONS = [
  'Briefcase', 'Package', 'Building', 'Home', 'Banknote', 'Gift', 
  'CreditCard', 'ShoppingBag', 'User', 'Coffee', 'Car', 'Users', 
  'Zap', 'Smartphone', 'HeartPulse', 'GraduationCap', 'Plane', 
  'Clapperboard', 'Dumbbell', 'Gamepad', 'Music', 'Video', 'Book',
  'Camera', 'Headphones', 'Laptop', 'Watch', 'Utensils', 'Truck',
  'Hammer', 'Wrench', 'Palette', 'Smile', 'Star', 'Heart', 'Sun'
];

export function useCategories() {
  const customCategories = useLiveQuery(() => db.categories.toArray()) || [];

  // Helper to merge defaults with custom
  const getCategories = (type) => {
    const defaults = type === 'IN' ? IN_CATEGORIES : OUT_CATEGORIES;
    const custom = customCategories
      .filter(c => c.type === type)
      .map(c => ({
        ...c,
        isCustom: true,
        // Dynamically resolving the icon component from string name
        icon: Icons[c.icon] || Icons.HelpCircle 
      }));
    
    return [...defaults, ...custom];
  };

  const addCategory = async (type, label, iconName) => {
    await db.categories.add({
      type,
      label,
      icon: iconName
    });
  };

  const deleteCategory = async (id) => {
    await db.categories.delete(id);
  };

  return {
    getCategories,
    addCategory,
    deleteCategory,
    AVAILABLE_ICONS
  };
}
