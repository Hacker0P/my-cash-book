import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { Layout } from './components/Layout';
import { TransactionCard } from './components/TransactionCard';
import { TransactionForm } from './components/TransactionForm';
import { CalendarModal } from './components/CalendarModal';
import { SettingsMenu } from './components/SettingsMenu';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { MainHeader } from './components/MainHeader';
import { usePWA } from './hooks/usePWA';

import { 
  Plus, Minus, Languages, ArrowRight, Edit2, Trash2, ArrowDownLeft, ArrowUpRight, Calendar as CalendarIcon
} from 'lucide-react';
import { 
  format, isToday, isYesterday, isSameDay, subDays,
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval,
  startOfYear, endOfYear, parseISO
} from 'date-fns';
import { TRANSLATIONS } from './translations';
import { generatePDF } from './utils/pdfGenerator';

function App() {
  const [activeModal, setActiveModal] = useState(null); 
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); 
  const [customRange, setCustomRange] = useState({ start: subDays(new Date(), 30), end: new Date() });
  const [datePickerTarget, setDatePickerTarget] = useState('main'); 
  const [actionSheetTarget, setActionSheetTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('cashbook_lang');
    return (saved && TRANSLATIONS[saved]) ? saved : null;
  });
  
  const [showMenu, setShowMenu] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [userName, setUserName] = useState(() => localStorage.getItem('cashbook_username') || '');
  const [isScrolled, setIsScrolled] = useState(false);

  // Hook: PWA
  const { isInstallable, install } = usePWA();

  // Listen for Username updates
  useEffect(() => {
     const updateName = () => {
         const savedName = localStorage.getItem('cashbook_username');
         if (savedName) setUserName(savedName);
     };
     updateName();
     window.addEventListener('storage', updateName);
     return () => window.removeEventListener('storage', updateName);
  }, [showMenu]);





  const t = TRANSLATIONS[language] || TRANSLATIONS['en'] || {};

  const setLang = (lang) => {
    setLanguage(lang);
    localStorage.setItem('cashbook_lang', lang);
  };
  
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray());



  // Auto-switch to today
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
    if (transaction.id) {
       await db.transactions.put(transaction);
       setActiveModal(null);
       setEditTarget(null);
       return;
    }
    await db.transactions.add(transaction);
    if (isToday(transaction.date)) setSelectedDate(new Date());
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

  const filteredTransactions = transactions?.filter(t => {
     if (viewMode === 'day') return isSameDay(t.date, selectedDate);
     return isWithinInterval(t.date, { start: rangeStart, end: rangeEnd });
  }) || [];
  
  const totalIn = filteredTransactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0);
  const totalOut = filteredTransactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIn - totalOut;

  // Group transactions by Date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const dateKey = format(transaction.date, 'yyyy-MM-dd');
    if (!groups[dateKey]) groups[dateKey] = [];
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
            <button onClick={() => setLang('en')} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-colors">English</button>
            <button onClick={() => setLang('bn')} className="w-full py-4 bg-white/10 border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors">বাংলা (Bengali)</button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="relative h-full flex flex-col">
        {/* Fixed Header Layer */}
        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
          <MainHeader 
             isScrolled={isScrolled}
             userName={userName}
             t={t}
             balance={netBalance}
             onOpenMenu={() => setShowMenu(true)}
             isInstallable={isInstallable}
             onInstall={install}
             onExportPDF={() => generatePDF(filteredTransactions, label, { totalIn, totalOut, netBalance }, t, userName)}
             onOpenCalendar={() => { setDatePickerTarget('main'); setShowCalendar(true); }}
             onOpenFilters={() => { /* Placeholder */ }}
             className="pointer-events-auto"
          >
             {/* Children: View Toggles & Custom Range UI */}
             <div className="space-y-6">
                {/* Toggles */}
                <div className="flex justify-center bg-slate-950/50 p-1.5 rounded-2xl w-fit mx-auto overflow-x-auto max-w-full border border-white/5 backdrop-blur-sm pointer-events-auto">
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
    
                {/* Custom Range */}
                {viewMode === 'custom' && (
                  <div className="flex justify-center gap-2 items-center animate-in fade-in slide-in-from-top-2 pointer-events-auto">
                     <button onClick={() => { setDatePickerTarget('start'); setShowCalendar(true); }} className="bg-white/10 px-4 py-2 rounded-xl text-sm text-white font-medium border border-white/10 hover:bg-white/20 transition-colors">
                       {format(customRange.start, 'dd MMM yyyy')}
                     </button>
                     <ArrowRight size={16} className="text-white/30" />
                     <button onClick={() => { setDatePickerTarget('end'); setShowCalendar(true); }} className="bg-white/10 px-4 py-2 rounded-xl text-sm text-white font-medium border border-white/10 hover:bg-white/20 transition-colors">
                       {format(customRange.end, 'dd MMM yyyy')}
                     </button>
                  </div>
                )}
    
                {/* Day Nav */}
                {viewMode === 'day' && (
                  <div className="flex justify-center gap-2 animate-in fade-in slide-in-from-top-2 pointer-events-auto">
                     <button 
                       onClick={() => { setDatePickerTarget('main'); setShowCalendar(true); }}
                       className="bg-white/10 px-5 py-2 rounded-full text-xs font-bold text-white border border-white/10 hover:bg-white/20 transition-colors flex items-center gap-2"
                     >
                       <CalendarIcon size={14} className="opacity-70" />
                       {format(selectedDate, 'dd MMM yyyy')}
                     </button>
                     
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
                
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4 pb-8 pointer-events-none">
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-1 -translate-y-1">
                         <ArrowDownLeft size={48} className="text-emerald-400" />
                      </div>
                      <div className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">{t.totalIn}</div>
                      <div className="text-2xl font-black text-white tracking-tight drop-shadow-sm">₹{totalIn.toLocaleString('en-IN')}</div>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-rose-500/30 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-10 transform translate-x-1 -translate-y-1">
                         <ArrowUpRight size={48} className="text-rose-400" />
                      </div>
                      <div className="text-rose-100 text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">{t.totalOut}</div>
                      <div className="text-2xl font-black text-white tracking-tight drop-shadow-sm">₹{totalOut.toLocaleString('en-IN')}</div>
                   </div>
                </div>
             </div>
          </MainHeader>
        </div>

        {/* Scrollable Content Layer */}
        <main 
           onScroll={(e) => setIsScrolled(e.currentTarget.scrollTop > 50)}
           className="flex-1 overflow-y-auto w-full relative z-20 pt-[420px] pb-24 px-0 no-scrollbar pointer-events-none"
        >
          <div className="bg-slate-50 min-h-[500px] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pt-6 px-2 relative -mt-4 ring-1 ring-black/5 pointer-events-auto">
         
         {/* Pull indicator */}
         <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 opacity-50" />
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
      </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center gap-4 px-6 z-40 max-w-md mx-auto pointer-events-none">
        <button
          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setEditTarget(null); setActiveModal('IN'); }}
          className="pointer-events-auto flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-all hover:brightness-110 border-t border-white/20 active:shadow-sm"
        >
          <Plus size={24} strokeWidth={3} /> <span className="tracking-wide">IN</span>
        </button>
        <button
          onClick={() => { if (navigator.vibrate) navigator.vibrate(10); setEditTarget(null); setActiveModal('OUT'); }}
          className="pointer-events-auto flex-1 bg-gradient-to-r from-rose-500 to-rose-600 text-white py-4 rounded-2xl shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-all hover:brightness-110 border-t border-white/20 active:shadow-sm"
        >
          <Minus size={24} strokeWidth={3} /> <span className="tracking-wide">OUT</span>
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
                 <button onClick={handleEdit} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-50 text-indigo-600 font-bold text-lg active:scale-95 transition-transform">
                    <Edit2 size={22} /> Edit Amount/Note
                 </button>
                 <button onClick={handleDelete} className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 font-bold text-lg active:scale-95 transition-transform">
                    <Trash2 size={22} /> Delete Entry
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
          onClose={() => { setActiveModal(null); setEditTarget(null); }}
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
            <AnalyticsDashboard transactions={transactions} onClose={() => setShowAnalytics(false)} t={t} />
         </div>
      )}
      </div>
    </Layout>
  );
}

export default App;
