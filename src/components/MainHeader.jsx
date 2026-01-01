import React from 'react';
import { Wallet, Menu, Download, Calendar as CalendarIcon } from 'lucide-react';

export function MainHeader({ 
  isScrolled, 
  userName, 
  t, 
  balance, 
  onOpenMenu, 
  isInstallable, 
  onInstall, 
  onExportPDF, 
  onOpenCalendar,
  children,
  className
}) {
  return (
    <div className={`sticky top-0 z-10 transition-all duration-300 ${isScrolled ? 'backdrop-blur-xl shadow-lg border-b border-white/10' : ''} ${className}`}>
      {/* Background Gradient - Always present now */}
      <div className={`absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 -z-10 transition-opacity duration-300 ${isScrolled ? 'opacity-95' : 'opacity-100'}`} />
      
      <div className={`transition-all duration-300 px-6 ${isScrolled ? 'py-4' : 'pt-12 pb-6'}`}>
        
        {/* Top Row: Menu & Actions */}
        <div className="flex justify-between items-start mb-6">
           <button 
             onClick={onOpenMenu}
             aria-label="Open Menu"
             className="p-2 rounded-full transition-colors active:scale-95 bg-white/10 hover:bg-white/20 text-white"
           >
             <Menu size={24} strokeWidth={isScrolled ? 2 : 2.5} />
           </button>

           <div className="flex gap-2">
             {isInstallable && (
               <button 
                  onClick={onInstall}
                  className="px-3 py-1.5 rounded-full bg-emerald-400 text-emerald-950 font-bold text-xs hover:bg-emerald-300 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in"
               >
                  {t.installApp}
               </button>
             )}
             
             <div className="flex gap-2 text-white">
                <button 
                   onClick={onExportPDF}
                   aria-label="Export PDF"
                   className="p-2 rounded-xl transition-all active:scale-95 bg-white/10 hover:bg-white/20"
                >
                   <Download size={20} />
                </button>
                <button 
                   onClick={onOpenCalendar}
                   aria-label="Open Calendar"
                   className="p-2 rounded-xl transition-all active:scale-95 bg-white/10 hover:bg-white/20"
                >
                   <CalendarIcon size={20} />
                </button>
             </div>
           </div>
        </div>

        {/* Branding & Balance Section */}
        <div className="relative">
           {/* Greeting (Fades out on scroll) */}
           <div className={`transition-all duration-300 ${isScrolled ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 h-auto'}`}>
             {userName ? (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <span className="block text-emerald-100 text-sm font-medium mb-1">
                    {new Date().getHours() < 12 ? t.goodMorning : new Date().getHours() < 18 ? t.goodAfternoon : t.goodEvening}
                  </span>
                  <span className="text-3xl font-black tracking-tight text-white block mb-6">{userName}</span>
                </div>
             ) : (
                <div className="flex items-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                  <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl text-white border border-white/20 shadow-lg">
                    <Wallet size={24} />
                  </div>
                  <span className="text-2xl font-black tracking-tight text-white">{t.appTitle}</span>
                </div>
             )}
           </div>

           {/* Balance Card (Transforms on scroll) */}
           <div className={`transition-all duration-500 origin-left ${isScrolled ? 'scale-75 -translate-y-1' : 'scale-100 translate-y-0'}`}>
              <div className={`glass-card ${!isScrolled ? 'bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-3xl shadow-2xl' : ''}`}>
                 <div className={`text-sm font-bold uppercase tracking-widest mb-1 ${isScrolled ? 'text-emerald-200' : 'text-emerald-100'}`}>
                     {t.netBalance}
                 </div>
                 <div className="text-4xl font-black tracking-tighter text-white drop-shadow-sm">
                    ₹{balance.toLocaleString('en-IN')}
                 </div>
              </div>
           </div>
        </div>

        {/* Dynamic Content (Tabs/Filters) */}
        <div className="mt-6">
           {children}
        </div>

      </div>
    </div>
  );
}
