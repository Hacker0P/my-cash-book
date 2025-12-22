import React, { useState, useEffect } from 'react';
import { X, User, Globe, Shield, Download, FileJson, Check, ChevronRight, AlertTriangle, Info, Trash2, LogOut, Wallet } from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { db } from '../db';

export function SettingsMenu({ onClose, lang, onLanguageChange }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['en'];
  const [localName, setLocalName] = useState(() => localStorage.getItem('cashbook_username') || '');

  // Prevent background scrolling when menu is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  const handleReset = async () => {
    if (confirm("WARNING: This will delete ALL your transaction data permanently. Are you sure?")) {
      await db.transactions.clear();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={onClose}
        className="absolute inset-0 z-0" 
      />
      
      {/* Sidebar Drawer */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-[85%] max-w-[320px] h-full bg-slate-50 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col relative z-10"
      >
        {/* Header */}
        <div className="bg-white p-6 pt-12 pb-6 border-b border-slate-100 flex justify-between items-center">
          <div>
             <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <Wallet size={24} strokeWidth={2.5} />
                <span className="font-black text-xl tracking-tight text-slate-900">My Cash Book</span>
             </div>
             <p className="text-xs font-medium text-slate-400 pl-8">Settings & Preferences</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors active:scale-95"
          >
            <X size={20} className="text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Section: Profile */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
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
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
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

          {/* Section: Backup & Data */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                 <FileJson size={14} />
                 Backup & Data
             </div>
             <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-white group-hover:shadow-sm transition-all">
                      <Download size={20} />
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-slate-700 text-sm">{t.backup}</div>
                      <div className="text-xs text-slate-400 font-medium">{t.export}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300" />
                </button>
             </div>
          </div>

          {/* Section: Danger Zone */}
          <div className="space-y-4 pt-4 border-t border-slate-200/60">
             <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider ml-1">
                 <AlertTriangle size={14} />
                 Danger Zone
             </div>
             <button 
               onClick={handleReset}
               className="w-full flex items-center justify-between p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100 active:scale-[0.98] transition-all"
             >
                <span className="font-bold flex items-center gap-2">
                   <Trash2 size={18} />
                   Reset App Data
                </span>
                <ChevronRight size={18} className="opacity-50" />
             </button>
          </div>
          
           {/* Section: App Info */}
           <div className="flex flex-col items-center justify-center text-slate-400 py-6">
              <div className="w-12 h-12 bg-slate-200 rounded-xl mb-3 flex items-center justify-center">
                 <div className="font-black text-slate-300 text-xl">CB</div>
              </div>
              <p className="font-bold text-xs uppercase tracking-widest">My Cash Book</p>
              <p className="text-[10px] font-medium opacity-70">v1.1.0 • PWA Enabled</p>
           </div>

        </div>

        {/* Footer actions */}
        <div className="bg-white p-6 border-t border-slate-100 sticky bottom-0 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
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

