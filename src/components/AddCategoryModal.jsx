import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import * as Icons from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { AVAILABLE_ICONS } from '../constants'; // Added import

export function AddCategoryModal({ type, onClose, onSave, lang = 'en' }) {
  const [label, setLabel] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Stars'); // Default icon
  
  const t = TRANSLATIONS[lang];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (label.trim()) {
      onSave(type, label.trim(), selectedIcon);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-lg font-bold text-slate-800">
             {t.newCategory} ({type === 'IN' ? t.income : t.expense})
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar pb-6">
           {/* Label Input */}
           <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t.categoryName}</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Freelance, Gym"
                autoFocus
                className="w-full p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:outline-none transition-all font-bold text-slate-800"
              />
           </div>

           {/* Icon Picker */}
           <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{t.selectIcon}</label>
              <div className="grid grid-cols-5 gap-3">
                 {AVAILABLE_ICONS.map(iconName => {
                    const IconComponent = Icons[iconName];
                    const isSelected = selectedIcon === iconName;
                    return (
                       <button
                          key={iconName}
                          type="button"
                          onClick={() => setSelectedIcon(iconName)}
                          className={`aspect-square rounded-xl flex items-center justify-center transition-all ${
                             isSelected 
                                ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                                : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-white hover:border-slate-300'
                          }`}
                       >
                          <IconComponent size={24} strokeWidth={isSelected ? 2.5 : 2} />
                       </button>
                    );
                 })}
              </div>
           </div>

           <button
             type="submit"
             disabled={!label.trim()}
             className={`w-full py-4 rounded-2xl text-white text-lg font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all shrink-0 mt-auto bg-indigo-600 ${!label.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700 hover:shadow-xl'}`}
           >
             <Check size={24} />
             {t.createCategory}
           </button>
        </form>
      </div>
    </div>
  );
}
