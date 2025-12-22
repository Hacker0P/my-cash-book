import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Keypad } from './Keypad';
import { OUT_CATEGORIES, IN_CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';

export function TransactionForm({ type, onClose, onSave, lang = 'en', initialData = null }) {
  const [amount, setAmount] = useState(initialData ? initialData.amount.toString() : '');
  const [note, setNote] = useState(initialData?.note || '');
  const [category, setCategory] = useState(initialData?.category || null);
  const [showNoteInput, setShowNoteInput] = useState(!!initialData?.note);

  const t = TRANSLATIONS[lang];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount) return;
    onSave({
      id: initialData?.id, // Preserve ID if editing
      type,
      amount: parseFloat(amount),
      category,
      note,
      date: initialData?.date || new Date() // Keep original date if editing, else new
    });
    onClose();
  };

  const handleKeyPress = (key) => {
    if (amount.includes('.') && key === '.') return;
    if (amount.length > 7) return; // Prevent too large numbers
    setAmount(prev => prev + key);
  };

  const handleDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const isIn = type === 'IN';
  const colorClass = isIn ? 'text-emerald-600' : 'text-rose-600';
  const bgClass = isIn ? 'bg-emerald-600' : 'bg-rose-600';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-2xl font-bold ${colorClass}`}>
            {isIn ? t.receiveCash : t.payCash}
          </h2>
          <button onClick={onClose} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
             <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 text-center">Amount</div>
             <div className={`w-full text-5xl font-black py-8 px-4 rounded-3xl bg-slate-50 text-center border transition-all ${
                 isIn ? 'border-emerald-200 text-emerald-600 bg-emerald-50/30' : 'border-rose-200 text-rose-600 bg-rose-50/30'
               }`}>
               <span className="text-3xl opacity-40 absolute left-8 top-1/2 pt-3 -translate-y-1/2 font-medium">₹</span>
               {amount || '0'}
             </div>
          </div>

          {/* Categories for IN & OUT */}
          <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2 ml-1">Category</div>
              <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 no-scrollbar scroll-smooth">
              {(isIn ? IN_CATEGORIES : OUT_CATEGORIES).map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id === category ? null : cat.id)}
                    className={`flex flex-col items-center gap-2 min-w-[80px] p-3 rounded-2xl border transition-all active:scale-95 ${
                      category === cat.id 
                        ? (isIn ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200' : 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-200') + ' shadow-sm' 
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className={`p-2 rounded-full ${category === cat.id ? (isIn ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700') : 'bg-slate-100 text-slate-500'}`}>
                        <cat.icon size={24} />
                    </div>
                    <span className="text-xs font-bold tracking-tight text-center leading-tight whitespace-normal max-w-[80px]">{t[cat.id] || cat.label}</span>
                  </button>
                ))}
              </div>
          </div>

          <div className="py-2">
            <Keypad onKeyPress={handleKeyPress} onDelete={handleDelete} />
          </div>

          {!showNoteInput ? (
            <button
               type="button"
               onClick={() => setShowNoteInput(true)}
               className="w-full text-center text-slate-400 font-bold text-sm tracking-wide uppercase py-3 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors dashed-border"
            >
              {t.addNote}
            </button>
          ) : (
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              autoFocus
              className="w-full text-lg p-4 rounded-xl bg-slate-50 border-2 border-slate-200 focus:border-slate-400 focus:outline-none transition-all"
            />
          )}

          <button
            type="submit"
            disabled={!amount}
            className={`w-full py-5 rounded-3xl text-white text-2xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${bgClass} ${!amount ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:brightness-110 hover:shadow-2xl hover:-translate-y-1'}`}
          >
            <Check size={32} />
            {t.save}
          </button>
        </form>
      </div>
    </div>
  );
}
