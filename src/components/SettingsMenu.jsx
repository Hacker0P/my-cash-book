import React, { useState } from 'react';
import { X, User, Globe, Shield, Download, FileJson, Check, ChevronRight } from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { db } from '../db';

export function SettingsMenu({ onClose, lang, onLanguageChange }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const [localName, setLocalName] = useState(() => localStorage.getItem('cashbook_username') || '');

  const handleNameChange = (e) => {
    setLocalName(e.target.value);
  };

  const handleSave = () => {
    localStorage.setItem('cashbook_username', localName);
    window.dispatchEvent(new Event('storage')); 
    onClose();
  };

  const handleExport = async () => {
    try {
      const allTransactions = await db.transactions.toArray();
      const dataStr = JSON.stringify(allTransactions, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `cashbook_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed", err);
      alert("Export failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-50 rounded-t-3xl sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Header */}
        <div className="bg-white p-6 sticky top-0 z-10 border-b border-slate-100 flex justify-between items-center rounded-t-3xl sm:rounded-t-3xl">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{t.settings}</h2>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors active:scale-95"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-8 pb-24">
          
          {/* Section: Profile */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
                <User size={14} />
                {t.profile}
             </div>
             <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all">
                <input
                  type="text"
                  value={localName}
                  onChange={handleNameChange}
                  placeholder={t.yourName}
                  className="w-full bg-transparent p-4 rounded-xl outline-none font-bold text-lg text-slate-900 placeholder:text-slate-300"
                />
             </div>
          </div>

          {/* Section: Language */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
                <Globe size={14} />
                {t.changeLanguage}
             </div>
             <div className="grid grid-cols-1 gap-3">
               {[
                 { code: 'en', label: 'English', sub: 'Default' },
                 { code: 'bn', label: 'বাংলা (Bengali)', sub: 'বাংলা' }
               ].map((opt) => (
                 <button
                   key={opt.code}
                   onClick={() => onLanguageChange(opt.code)}
                   className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                     lang === opt.code 
                       ? 'bg-blue-50/50 border-blue-500 shadow-sm' 
                       : 'bg-white border-transparent hover:border-slate-200 shadow-sm'
                   }`}
                 >
                   <div className="flex flex-col items-start">
                      <span className={`font-bold text-base ${lang === opt.code ? 'text-blue-700' : 'text-slate-700'}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{opt.sub}</span>
                   </div>
                   {lang === opt.code && (
                     <div className="bg-blue-500 text-white p-1 rounded-full">
                       <Check size={14} strokeWidth={4} />
                     </div>
                   )}
                 </button>
               ))}
             </div>
          </div>

          {/* Section: Data Privacy */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider ml-1">
                 <Shield size={14} />
                 {t.dataPrivacy}
             </div>
             <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-100/50 shadow-sm relative overflow-hidden group">
                 {/* Decorative background icon */}
                 <Shield className="absolute -right-4 -bottom-4 text-emerald-100 opacity-50 rotate-12 transition-transform group-hover:scale-110" size={80} />
                 
                 <div className="relative z-10">
                    <p className="font-medium text-emerald-800 leading-relaxed mb-4">
                       {t.privacyMsg}. 
                       <span className="opacity-70 text-sm block mt-1">Data is stored locally on this device.</span>
                    </p>
                    <button 
                      onClick={handleExport}
                      className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-emerald-800 font-bold text-sm shadow-sm border border-emerald-100 hover:bg-white transition-colors"
                    >
                      <Download size={16} />
                      {t.backup} ({t.export})
                    </button>
                 </div>
             </div>
          </div>

        </div>

        {/* Footer actions */}
        <div className="bg-white p-6 border-t border-slate-100 sticky bottom-0 z-10 rounded-b-3xl sm:rounded-b-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
           <button 
             onClick={handleSave}
             className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 active:scale-[0.98] transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
           >
             {t.save}
             <ChevronRight size={20} className="opacity-50" />
           </button>
        </div>

      </div>
    </div>
  );
}
