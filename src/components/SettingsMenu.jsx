import React, { useState, useEffect } from 'react';
import { X, User, Globe, Shield, Download, FileJson, Check, ChevronRight, AlertTriangle, Info, Trash2, LogOut, Wallet, BarChart3, Settings, Sun, Moon } from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { db } from '../db';

// Haptic helper
const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(10);
};

export function SettingsMenu({ onClose, lang, onLanguageChange, onOpenAnalytics }) {
  const t = { ...TRANSLATIONS['en'], ...TRANSLATIONS[lang] };
  const [localName, setLocalName] = useState(() => localStorage.getItem('cashbook_username') || '');
  const [scrolled, setScrolled] = useState(false);

  // Prevent background scrolling when menu is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleScroll = (e) => {
    setScrolled(e.target.scrollTop > 10);
  };

  const handleNameChange = (e) => {
    setLocalName(e.target.value);
  };

  const handleSave = () => {
    vibrate();
    localStorage.setItem('cashbook_username', localName);
    window.dispatchEvent(new Event('storage')); 
    onClose();
  };

  const handleExport = async () => {
    vibrate();
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
    vibrate();
    if (confirm(t.confirmReset)) {
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
        className="w-[85%] max-w-[320px] h-full bg-slate-50 shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col relative z-10 transition-colors"
      >
        {/* Header (Matches App.jsx & Analytics) */}
        <div className={`sticky top-0 z-20 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/60' : 'bg-transparent'}`}>
            {!scrolled && <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 opacity-100 -z-10" />}
            
            <div className="p-6 pt-12 pb-4 flex justify-between items-start">
            <div>
                 <div className="flex items-center gap-2 text-emerald-600 mb-1">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-emerald-100">
                        <Settings size={20} strokeWidth={2.5} />
                    </div>
                 </div>
                 <h2 className="text-xl font-black text-slate-900 tracking-tight mt-3">{t.settings}</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{t.preferences}</p>
            </div>
            <button 
                onClick={() => { vibrate(); onClose(); }}
                aria-label="Close Settings"
                className="p-2 bg-white/50 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
            >
                <X size={20} className="text-slate-600" />
            </button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32" onScroll={handleScroll}>
          


          {/* Section: Profile */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                <User size={14} />
                {t.profile}
             </div>
             <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-200/60 focus-within:ring-4 focus-within:ring-emerald-500/10 focus-within:border-emerald-500 transition-all">
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
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                <Globe size={14} />
                {t.changeLanguage}
             </div>
             <div className="grid grid-cols-1 gap-3">
               {[
                 { code: 'en', label: t.english, sub: t.defaultLang },
                 { code: 'bn', label: t.bengali, sub: 'বাংলা' }
               ].map((opt) => (
                 <button
                   key={opt.code}
                   onClick={() => { vibrate(); onLanguageChange(opt.code); }}
                   className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all active:scale-[0.98] ${
                     lang === opt.code 
                       ? 'bg-emerald-50/50 border-emerald-500 shadow-sm ring-1 ring-emerald-500' 
                       : 'bg-white border-slate-200/60 hover:border-slate-300 shadow-sm'
                   }`}
                 >
                   <div className="flex flex-col items-start">
                      <span className={`font-bold text-base ${lang === opt.code ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">{opt.sub}</span>
                   </div>
                   {lang === opt.code && (
                     <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                       <Check size={14} strokeWidth={4} />
                     </div>
                   )}
                 </button>
               ))}
             </div>
          </div>

          {/* Section: Analytics */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                 <BarChart3 size={14} />
                 {t.financialInsights}
             </div>
             <div className="bg-white p-1 rounded-2xl border border-slate-200/60 shadow-sm">
                <button 
                  onClick={() => {
                     vibrate();
                     onOpenAnalytics();
                     onClose();
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                      <BarChart3 size={20} />
                    </div>
                    <div className="text-left">
                       <div className="font-bold text-slate-900 text-sm">{t.viewAnalytics}</div>
                       <div className="text-xs text-slate-400 font-medium">{t.deepInsights}</div>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </button>
             </div>
          </div>

          {/* Section: Backup & Data */}
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
             <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">
                 <FileJson size={14} />
                 Backup & Data
             </div>
             <div className="bg-white p-1 rounded-2xl border border-slate-200/60 shadow-sm">
                <button 
                  onClick={handleExport}
                  className="w-full flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-white group-hover:shadow-sm transition-all">
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
          <div className="space-y-3 pt-6 border-t border-slate-200/60 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
             <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider ml-1">
                 <AlertTriangle size={14} />
                 {t.dangerZone}
             </div>
             <button 
               onClick={handleReset}
               className="w-full flex items-center justify-between p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-100 active:scale-[0.98] transition-all group"
             >
                <span className="font-bold flex items-center gap-3">
                   <div className="p-2 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                        <Trash2 size={18} />
                   </div>
                    {t.resetData}
                </span>
                <ChevronRight size={18} className="opacity-50" />
             </button>
          </div>
          
           {/* Section: App Info */}
           <div className="flex flex-col items-center justify-center text-slate-400 py-6 animate-in fade-in duration-700 delay-300">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl mb-3 flex items-center justify-center shadow-inner">
                 <div className="font-black text-slate-300 text-xl">CB</div>
              </div>
              <p className="font-bold text-xs uppercase tracking-widest text-slate-300">{t.appTitle}</p>
              <p className="text-[10px] font-medium opacity-50">v1.2.0 • {t.premiumEdition}</p>
           </div>

        </div>

        {/* Footer actions */}
        <div className="bg-white/80 backdrop-blur-md p-6 border-t border-slate-100 sticky bottom-0 z-10">
           <button 
             onClick={handleSave}
             className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-lg hover:bg-slate-800 active:scale-[0.95] transition-all shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2"
           >
             {t.save}
             <ChevronRight size={20} className="opacity-50" />
           </button>
        </div>

      </div>
    </div>
  );
}
