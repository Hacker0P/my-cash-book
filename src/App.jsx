import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Layout } from './components/Layout';
import { TransactionCard } from './components/TransactionCard';
import { TransactionForm } from './components/TransactionForm';
import { CalendarModal } from './components/CalendarModal';
import { SettingsMenu } from './components/SettingsMenu';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { 
  Plus, Minus, Wallet, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, BarChart3, Languages, Menu, 
  Download, ArrowRight, Edit2, Trash2, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { 
  format, isToday, isYesterday, isSameDay, subDays, addDays,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval,
  startOfYear, endOfYear, parseISO
} from 'date-fns';
import { TRANSLATIONS } from './translations';
import { generatePDF } from './utils/pdfGenerator';

function App() {
  const [activeModal, setActiveModal] = useState(null); // 'IN' | 'OUT' | null
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week' | 'month' | 'year' | 'custom'
  const [customRange, setCustomRange] = useState({ start: subDays(new Date(), 30), end: new Date() });
  const [datePickerTarget, setDatePickerTarget] = useState('main'); // 'main' | 'start' | 'end'
  const [actionSheetTarget, setActionSheetTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  
  // Language State (default to null to show selection screen first time)
  // Language State (default to null to show selection screen first time)
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('cashbook_lang');
    // Ensure saved language is valid, else force reselections
    return (saved && TRANSLATIONS[saved]) ? saved : null;
  });
  const [showMenu, setShowMenu] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('cashbook_username') || '');

  // Update username if changed in other components (via storage event or re-render)
  useEffect(() => {
     const updateName = () => {
         const savedName = localStorage.getItem('cashbook_username');
         if (savedName) setUserName(savedName);
     };

     // Initial load
     updateName();
     
     // Listen for updates (ours or other tabs)
     window.addEventListener('storage', updateName);
     return () => window.removeEventListener('storage', updateName);
  }, [showMenu]); // Also refresh when menu closes/opens just in case

  // PWA Install Prompt Logic
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const t = TRANSLATIONS[language] || TRANSLATIONS['en'] || {};

  const setLang = (lang) => {
    setLanguage(lang);
    localStorage.setItem('cashbook_lang', lang);
  };
  
  const resetLanguage = () => {
    setLanguage(null);
    setShowMenu(false);
  };

  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());

  // Calculate Global Balance
  const globalBalance = transactions?.reduce((acc, curr) => {
    return curr.type === 'IN' ? acc + curr.amount : acc - curr.amount;
  }, 0) || 0;

  // Auto-switch to today on visibility change if day changed
  useEffect(() => {
     const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
           const now = new Date();
           if (viewMode === 'day' && !isSameDay(now, selectedDate)) {
               setSelectedDate(now);
           }
        }
     };
     document.addEventListener('visibilitychange', handleVisibilityChange);
     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [viewMode, selectedDate]);


  const handleSave = async (transaction) => {
    // If updating existing
    if (transaction.id) {
       await db.transactions.put(transaction);
       setActiveModal(null);
       setEditTarget(null);
       return;
    }

    // New transaction
    await db.transactions.add(transaction);
    if (isToday(transaction.date)) {
        setSelectedDate(new Date());
    }
  };
  
  const handleDelete = async (id = null) => {
     const targetId = id || actionSheetTarget?.id;
     if (targetId) {
        await db.transactions.delete(targetId);
        setActionSheetTarget(null);
     }
  };

  const handleEdit = (transaction = null) => {
    const target = transaction || actionSheetTarget;
    if (target) {
        setEditTarget(target);
        setActiveModal(target.type);
        setActionSheetTarget(null);
    }
  };

  // --- Date Range Logic ---
  let rangeStart = selectedDate;
  let rangeEnd = selectedDate;
  let label = '';

  if (viewMode === 'day') {
    rangeStart = selectedDate;
    rangeEnd = selectedDate;
    label = isToday(selectedDate) ? 'Today' : (isYesterday(selectedDate) ? 'Yesterday' : format(selectedDate, 'dd MMM'));
  } else if (viewMode === 'week') {
    rangeStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    rangeEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    label = `${format(rangeStart, 'dd MMM')} - ${format(rangeEnd, 'dd MMM')}`;
  } else if (viewMode === 'month') {
    rangeStart = startOfMonth(selectedDate);
    rangeEnd = endOfMonth(selectedDate);
    label = format(selectedDate, 'MMMM yyyy');
  } else if (viewMode === 'year') {
    rangeStart = startOfYear(selectedDate);
    rangeEnd = endOfYear(selectedDate);
    label = format(selectedDate, 'yyyy');
  } else if (viewMode === 'custom') {
    rangeStart = customRange.start;
    rangeEnd = customRange.end;
    label = `${format(rangeStart, 'dd MMM')} - ${format(rangeEnd, 'dd MMM')}`;
  }

  // Filter Transactions
  const filteredTransactions = transactions?.filter(t => {
     if (viewMode === 'day') return isSameDay(t.date, selectedDate);
     return isWithinInterval(t.date, { start: rangeStart, end: rangeEnd });
  }) || [];
  
  const totalIn = filteredTransactions
    .filter(t => t.type === 'IN')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalOut = filteredTransactions
    .filter(t => t.type === 'OUT')
    .reduce((acc, t) => acc + t.amount, 0);

  const netBalance = totalIn - totalOut;
  const maxVal = Math.max(totalIn, totalOut, 1); // Avoid div by zero

  // Group transactions by Date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const dateKey = format(transaction.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(transaction);
    return groups;
  }, {});

  const sortedGroupKeys = Object.keys(groupedTransactions).sort((a, b) => new Date(b) - new Date(a));

  if (!language) {
    return (
      <Layout className="justify-center items-center bg-slate-900 text-white">
        <div className="w-full max-w-sm p-6 text-center">
          <div className="mb-8 flex justify-center">
            <div className="p-4 bg-white/10 rounded-full">
              <Languages size={48} />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-8">Select Language</h1>
          
          <div className="space-y-4">
            <button 
              onClick={() => setLang('en')}
              className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-colors"
            >
              English
            </button>
            <button 
              onClick={() => setLang('bn')}
              className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
            >
              বাংলা (Bengali)
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header / Dashboard */}
      <header className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-10 shadow-2xl ring-1 ring-white/10 transition-all duration-300 ease-in-out ${isScrolled ? 'p-4 pb-24' : 'p-6 pb-32'}`}>
        <div className="flex items-center justify-between mb-4 transition-all">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setShowMenu(true)}
               className="p-2.5 -ml-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all active:scale-95 text-white/90"
             >
               <Menu size={24} />
             </button>
             <div>
               {userName ? (
                  <div className={`flex flex-col transition-all duration-300 ${isScrolled ? 'opacity-0 h-0 w-0 overflow-hidden' : 'opacity-100'}`}>
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      {new Date().getHours() < 12 ? 'Good Morning,' : new Date().getHours() < 18 ? 'Good Afternoon,' : 'Good Evening,'}
                    </span>
                    <span className="text-xl font-black tracking-tight text-white mb-0.5">{userName}</span>
                  </div>
               ) : (
                  <div className="font-bold tracking-tight text-lg flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400">
                      <Wallet size={16} />
                    </div>
                    {t.appTitle}
                  </div>
               )}
               {/* Scrolled State Title (Always shows App Name when scrolled) */}
               <div className={`font-bold tracking-tight text-lg flex items-center gap-2 transition-all duration-300 absolute left-14 top-5 ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                  {t.appTitle}
               </div>
             </div>
          </div>
          
          <div className="flex gap-3">
            {/* Install App Trigger (PWA) */}
            {installPrompt && (
              <button 
                 onClick={handleInstallClick}
                 className="px-3 py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-400 border border-emerald-400 transition-all active:scale-95 shadow-lg shadow-emerald-500/20 animate-in fade-in zoom-in duration-300"
              >
                 Install App
              </button>
            )}

            {/* PDF Export */}
            <button 
               onClick={() => generatePDF(filteredTransactions, label, { totalIn, totalOut, netBalance }, t, userName)}
               className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all active:scale-95 text-white/80"
               title={t.exportPDF}
            >
               <Download size={20} />
            </button>

            {/* Calendar Trigger */}
            <button 
               onClick={() => {
                 setDatePickerTarget('main');
                 setShowCalendar(true);
               }}
               className={`p-2.5 rounded-xl transition-all active:scale-95 border ${showCalendar ? 'bg-white text-slate-900 border-white' : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20 text-white/80'}`}
            >
               <CalendarIcon size={20} />
            </button>
          </div>
        </div>
        
        {/* Collapsible Global Balance */}
        <div className={`transition-all duration-500 ease-spring flex flex-col items-center relative overflow-hidden ${isScrolled ? 'max-h-0 opacity-0 mb-2' : 'max-h-40 opacity-100 mb-8'}`}>
           {/* Decorative Glow */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full pointer-events-none"></div>
           
           <div className="relative z-10 text-center">
             <div className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wider">{t.netBalance}</div>
             <div className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
               ₹{globalBalance.toLocaleString('en-IN')}
             </div>
           </div>
        </div>

        {/* View Toggles Segmented Control */}
        <div className="flex justify-center bg-slate-950/50 p-1.5 rounded-2xl mb-8 w-fit mx-auto overflow-x-auto max-w-full border border-white/5 backdrop-blur-sm">
           {['day', 'week', 'month', 'year', 'custom'].map(mode => (
             <button
               key={mode}
               onClick={() => setViewMode(mode)}
               className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                 viewMode === mode 
                   ? 'bg-white text-slate-900 shadow-lg shadow-black/10 scale-100' 
                   : 'text-slate-400 hover:text-white hover:bg-white/5 scale-95 hover:scale-100'
               }`}
             >
               {t[mode] || mode}
             </button>
           ))}
        </div>

        {/* Custom Range Logic */}
        {viewMode === 'custom' && (
          <div className="flex justify-center gap-2 mb-6 items-center animate-in fade-in slide-in-from-top-2">
             <button 
               onClick={() => { setDatePickerTarget('start'); setShowCalendar(true); }}
               className="bg-white/10 px-4 py-2 rounded-xl text-sm text-white font-medium border border-white/10 hover:bg-white/20 transition-colors"
             >
               {format(customRange.start, 'dd MMM yyyy')}
             </button>
             <ArrowRight size={16} className="text-white/30" />
             <button 
               onClick={() => { setDatePickerTarget('end'); setShowCalendar(true); }}
               className="bg-white/10 px-4 py-2 rounded-xl text-sm text-white font-medium border border-white/10 hover:bg-white/20 transition-colors"
             >
               {format(customRange.end, 'dd MMM yyyy')}
             </button>
          </div>
        )}

        {/* Date Navigation */}
        {viewMode === 'day' && (
          <div className="flex justify-center gap-2 mb-6 animate-in fade-in slide-in-from-top-2">
             <button 
               onClick={() => setSelectedDate(new Date())}
               className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all ${
                 isToday(selectedDate) 
                   ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                   : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'
               }`}
             >
               {t.today}
             </button>
          </div>
        )}

        {/* Visual Summary (Bars) */}
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
           {/* IN Card */}
           <div className="bg-emerald-500/20 backdrop-blur-md rounded-3xl p-5 border border-emerald-500/20 relative overflow-hidden shadow-sm">
              <div className="absolute -right-2 -top-2 opacity-20 text-emerald-300 rotate-12">
                 <ArrowDownLeft size={64} />
              </div>
              <div className="relative z-10">
                <div className="text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 opacity-90">{t.totalIn}</div>
                <div className="text-2xl font-black text-white tracking-tight">₹{totalIn.toLocaleString('en-IN')}</div>
              </div>
           </div>

           {/* OUT Card */}
           <div className="bg-rose-500/20 backdrop-blur-md rounded-3xl p-5 border border-rose-500/20 relative overflow-hidden shadow-sm">
              <div className="absolute -right-2 -top-2 opacity-20 text-rose-300 rotate-12">
                 <ArrowUpRight size={64} />
              </div>
              <div className="relative z-10">
                <div className="text-rose-300 text-xs font-bold uppercase tracking-wider mb-2 opacity-90">{t.totalOut}</div>
                <div className="text-2xl font-black text-white tracking-tight">₹{totalOut.toLocaleString('en-IN')}</div>
              </div>
           </div>
        </div>
      </header>

      {/* Transactions List */}
      <main 
        onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 20)}
        className="flex-1 overflow-y-auto pb-24 bg-slate-50 -mt-8 rounded-t-3xl relative z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] pt-6 px-2 transition-transform"
      >
        {filteredTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 opacity-60">
            <div className="w-16 h-16 bg-slate-200 rounded-full mb-4 animate-pulse"></div>
            <p className="text-lg font-medium">No records for {label}</p>
          </div>
        ) : (
          <div className="space-y-6 pb-4">
             {sortedGroupKeys.map(dateKey => {
               const dayTransactions = groupedTransactions[dateKey];
               const dayIn = dayTransactions.filter(t => t.type === 'IN').reduce((acc, c) => acc + c.amount, 0);
               const dayOut = dayTransactions.filter(t => t.type === 'OUT').reduce((acc, c) => acc + c.amount, 0);
               const isTodayKey = dateKey === format(new Date(), 'yyyy-MM-dd');
               
               return (
                 <div key={dateKey} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 py-2 px-4 mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100/50">
                     <div className="flex items-center gap-2">
                       {isTodayKey && <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px]">TODAY</span>}
                       <span>{format(parseISO(dateKey), 'dd MMM yyyy')}</span>
                     </div>
                     <div className="flex gap-3">
                       {dayIn > 0 && <span className="text-emerald-600">+₹{dayIn.toLocaleString('en-IN')}</span>}
                       {dayOut > 0 && <span className="text-rose-600">-₹{dayOut.toLocaleString('en-IN')}</span>}
                     </div>
                   </div>
                   
                   <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden mx-1">
                      {dayTransactions.map((t, idx) => (
                        <div key={t.id} className={idx !== dayTransactions.length - 1 ? "border-b border-slate-100" : ""}>
                          <TransactionCard 
                            transaction={t} 
                            lang={language} 
                            onLongPress={setActionSheetTarget}
                            onEdit={() => handleEdit(t)}
                            onDelete={() => handleDelete(t.id)}
                          />
                        </div>
                      ))}
                   </div>
                 </div>
               );
             })}
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4 px-6 z-40 max-w-md mx-auto pointer-events-none">
        <button
          onClick={() => {
             if (navigator.vibrate) navigator.vibrate(10);
             setEditTarget(null);
             setActiveModal('IN');
          }}
          className="pointer-events-auto flex-1 bg-emerald-600 text-white py-4 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-transform hover:brightness-110"
        >
          <Plus size={24} />
          <span>IN</span>
        </button>
        <button
          onClick={() => {
             if (navigator.vibrate) navigator.vibrate(10);
             setEditTarget(null);
             setActiveModal('OUT');
          }}
          className="pointer-events-auto flex-1 bg-rose-600 text-white py-4 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-transform hover:brightness-110"
        >
          <Minus size={24} />
          <span>OUT</span>
        </button>
      </div>

      {/* Action Sheet Modal */}
      {actionSheetTarget && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActionSheetTarget(null)}>
           <div className="w-full max-w-md bg-white rounded-t-3xl p-6 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
              <h3 className="text-center font-bold text-lg mb-6 text-slate-800">
                 Manage Transaction
                 <div className="text-sm font-normal text-slate-400 mt-1">
                    {actionSheetTarget.type === 'IN' ? 'Received' : 'Paid'} ₹{actionSheetTarget.amount} • {format(actionSheetTarget.date, 'dd MMM yyyy')}
                 </div>
              </h3>
              
              <div className="space-y-3">
                 <button 
                   onClick={handleEdit}
                   className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-lg active:scale-95 transition-transform"
                 >
                    <Edit2 size={22} />
                    Edit Amount/Note
                 </button>
                 <button 
                   onClick={handleDelete}
                   className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 font-bold text-lg active:scale-95 transition-transform"
                 >
                    <Trash2 size={22} />
                    Delete Entry
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modals */}
      {activeModal && (
        <TransactionForm
          type={activeModal}
          initialData={editTarget}
          onClose={() => {
             setActiveModal(null);
             setEditTarget(null);
          }}
          onSave={handleSave}
        />
      )}

      {showCalendar && (
        <CalendarModal
          selectedDate={datePickerTarget === 'main' ? selectedDate : (datePickerTarget === 'start' ? customRange.start : customRange.end)}
          onClose={() => setShowCalendar(false)}
          onSelect={(date) => {
            if (datePickerTarget === 'main') setSelectedDate(date);
            else if (datePickerTarget === 'start') setCustomRange(prev => ({ ...prev, start: date }));
            else if (datePickerTarget === 'end') setCustomRange(prev => ({ ...prev, end: date }));
            setShowCalendar(false);
          }}
        />
      )}

      {showMenu && (
        <SettingsMenu
           lang={language}
           onClose={() => setShowMenu(false)}
           onLanguageChange={setLang}
           onOpenAnalytics={() => setShowAnalytics(true)}
        />
      )}

      {showAnalytics && (
         <div className="fixed inset-0 z-[60] bg-white">
            <AnalyticsDashboard 
               transactions={transactions} 
               onClose={() => setShowAnalytics(false)}
               t={t}
            />
         </div>
      )}
    </Layout>
  );
}

export default App;
