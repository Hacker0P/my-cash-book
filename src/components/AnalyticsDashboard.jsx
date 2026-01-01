import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowLeft, PieChart, TrendingUp, TrendingDown, Calendar, 
  ArrowUpRight, ArrowDownLeft, BarChart3, ChevronRight, 
  Activity, Percent, ArrowUp, ArrowDown, Clock, CalendarDays,
  Target, Zap, Filter, RefreshCw, LayoutGrid, List,
  DollarSign, Award, AlertCircle, Info, Download, Share2, Wallet
} from 'lucide-react';
import { 
  format, startOfMonth, endOfMonth, startOfYear, endOfYear, 
  subMonths, subYears, isWithinInterval, subDays, eachDayOfInterval, 
  isSameDay, differenceInDays, eachMonthOfInterval, getDay, 
  getHours, startOfWeek, endOfWeek, parseISO, isAfter, isBefore
} from 'date-fns';
import { IN_CATEGORIES, OUT_CATEGORIES } from '../constants';
import { TransactionCard } from './TransactionCard';

/* -------------------------------------------------------------------------- */
/*                                  CONSTANTS                                 */
/* -------------------------------------------------------------------------- */

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'categories', label: 'Categories', icon: PieChart },
  { id: 'time', label: 'Time Analysis', icon: Clock },
  { id: 'insights', label: 'Insights', icon: Zap },
];

/* -------------------------------------------------------------------------- */
/*                               HELPER FUNCTIONS                             */
/* -------------------------------------------------------------------------- */

const calculateMean = (numbers) => numbers.reduce((a, b) => a + b, 0) / (numbers.length || 1);

// Haptic helper
const vibrate = () => {
   if (navigator.vibrate) navigator.vibrate(10);
};

// Date range calculation
const getDateRange = (filter) => {
  const now = new Date();
  switch (filter) {
    case 'week': return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month': return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'quarter': return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    case 'year': return { start: startOfYear(now), end: endOfYear(now) };
    case 'all': return { start: new Date(0), end: now }; 
    default: return { start: startOfMonth(now), end: endOfMonth(now) };
  }
};

const getPreviousDateRange = (filter) => {
  const now = new Date();
  switch (filter) {
    case 'week': return { start: startOfWeek(subDays(now, 7), { weekStartsOn: 1 }), end: endOfWeek(subDays(now, 7), { weekStartsOn: 1 }) };
    case 'month': return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case 'quarter': return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(subMonths(now, 3)) }; 
    case 'year': return { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) };
    default: return { start: new Date(0), end: new Date(0) };
  }
};

/* -------------------------------------------------------------------------- */
/*                            SUB-COMPONENTS                                  */
/* -------------------------------------------------------------------------- */

const StatCard = ({ label, value, subValues, icon: Icon, color = 'emerald', trend, delay = 0 }) => (
  <div className={`bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden animate-in slide-in-from-bottom-[20px] duration-500`} style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 text-${color}-600`}>
        <Icon size={20} />
      </div>
      {trend && (
        <div className={`px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${trend.isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {trend.isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
          {Math.abs(trend.value).toFixed(1)}%
        </div>
      )}
    </div>
    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
    <div className="text-3xl font-black text-slate-900 tracking-tight mb-2 ">{value}</div>
    {subValues && (
      <div className="flex gap-3 text-xs font-medium text-slate-500 border-t border-slate-50 pt-3 mt-3">
        {subValues.map((sv, idx) => (
          <div key={idx} className="flex items-center gap-1">
             <div className={`w-1.5 h-1.5 rounded-full ${sv.color}`} />
             <span>{sv.label}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const SectionHeader = ({ title, subtitle, icon: Icon, action }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-2.5">
      {Icon && <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><Icon size={16} /></div>}
      <div>
        <h3 className="font-bold text-slate-900 text-base tracking-tight">{title}</h3>
        {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function AnalyticsDashboard({ transactions, onClose, t }) {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState('overview');
  const [timeFilter, setTimeFilter] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  
  // Detect Scroll
  const handleScroll = (e) => {
     setScrolled(e.target.scrollTop > 10);
  };

  // --- Derived Data Calculation ---
  const analysis = useMemo(() => {
    // 1. Ranges
    const range = getDateRange(timeFilter);
    const prevRange = getPreviousDateRange(timeFilter);

    // 2. Data Slicing
    const currentTxns = transactions.filter(t => isWithinInterval(t.date, range));
    const prevTxns = transactions.filter(t => isWithinInterval(t.date, prevRange));

    // 3. Totals
    const totalIn = currentTxns.filter(t => t.type === 'IN').reduce((a, b) => a + b.amount, 0);
    const totalOut = currentTxns.filter(t => t.type === 'OUT').reduce((a, b) => a + b.amount, 0);
    const prevTotalIn = prevTxns.filter(t => t.type === 'IN').reduce((a, b) => a + b.amount, 0);
    const prevTotalOut = prevTxns.filter(t => t.type === 'OUT').reduce((a, b) => a + b.amount, 0);

    const netFlow = totalIn - totalOut;
    const savingsRate = totalIn > 0 ? (netFlow / totalIn) * 100 : 0;

    // 4. Comparison Percentages
    const incomeGrowth = prevTotalIn > 0 ? ((totalIn - prevTotalIn) / prevTotalIn) * 100 : 0;
    const expenseGrowth = prevTotalOut > 0 ? ((totalOut - prevTotalOut) / prevTotalOut) * 100 : 0;

    // 5. Daily Analysis
    const days = Math.max(1, differenceInDays(new Date() < range.end ? new Date() : range.end, range.start) + 1);
    const dailyAvgSpend = totalOut / days;
    const dailyAvgIncome = totalIn / days;

    // 6. Transaction Stats
    const amountsOut = currentTxns.filter(t => t.type === 'OUT').map(t => t.amount);
    const maxTxn = amountsOut.length ? Math.max(...amountsOut) : 0;
    const minTxn = amountsOut.length ? Math.min(...amountsOut) : 0;
    const avgTxn = calculateMean(amountsOut);
    const countTxn = amountsOut.length;

    // 7. Time Analysis (Heatmap Prep)
    const hourCounts = new Array(24).fill(0);
    const weekDayCounts = new Array(7).fill(0);
    currentTxns.forEach(txn => {
       const hour = getHours(txn.date);
       const day = getDay(txn.date); // 0 = Sun
       hourCounts[hour] += txn.amount;
       weekDayCounts[day] += txn.amount;
    });

    // 8. Category Breakdown
    const getCatStats = (type) => {
       const stats = {};
       const list = type === 'IN' ? IN_CATEGORIES : OUT_CATEGORIES;
       currentTxns.filter(t => t.type === type).forEach(t => {
          stats[t.category] = (stats[t.category] || 0) + t.amount;
       });
       return Object.entries(stats).map(([id, amount]) => {
          const def = list.find(c => c.id === id);
          return {
             id,
             label: def ? (t[id] || def.label) : id,
             icon: def?.icon,
             amount,
             percentage: (type === 'IN' ? totalIn : totalOut) > 0 ? (amount / (type === 'IN' ? totalIn : totalOut)) * 100 : 0
          };
       }).sort((a,b) => b.amount - a.amount);
    };

    const expenseCategories = getCatStats('OUT');
    const incomeCategories = getCatStats('IN');

    // 9. Cumulative Chart Data (Burn-down trend)
    const cumulativeData = (() => {
       const dates = eachDayOfInterval({ start: range.start, end: new Date() < range.end ? new Date() : range.end });
       let runningTotal = 0;
       return dates.map(date => {
          const daysTxns = currentTxns.filter(t => isSameDay(t.date, date) && t.type === 'OUT');
          const daySum = daysTxns.reduce((a,b) => a + b.amount, 0);
          runningTotal += daySum;
          return { date, value: runningTotal, daySum };
       });
    })();

    return {
       range,
       totalIn, totalOut, netFlow, savingsRate,
       prevTotalIn, prevTotalOut, incomeGrowth, expenseGrowth,
       dailyAvgSpend, dailyAvgIncome,
       maxTxn, minTxn, avgTxn, countTxn,
       hourCounts, weekDayCounts,
       expenseCategories, incomeCategories,
       currentTxns, cumulativeData
    };

  }, [transactions, timeFilter, t]);


  // --- Render Functions for Tabs ---

  const renderOverview = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
       
       {/* 1. Master Scorecards */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatCard 
             label="Total Expense"
             value={`₹${analysis.totalOut.toLocaleString('en-IN')}`}
             trend={{ isPositive: analysis.expenseGrowth > 0, value: analysis.expenseGrowth }}
             subValues={[
                { label: `₹${Math.round(analysis.dailyAvgSpend)} daily avg`, color: 'bg-emerald-500' }
             ]}
             icon={ArrowUpRight}
             color="rose"
             delay={0}
          />
          <StatCard 
             label="Net Flow"
             value={`₹${analysis.netFlow.toLocaleString('en-IN')}`}
             subValues={[
                { label: `${analysis.savingsRate.toFixed(1)}% savings`, color: analysis.netFlow >= 0 ? 'bg-emerald-500' : 'bg-rose-500' }
             ]}
             icon={Wallet}
             color={analysis.netFlow >= 0 ? 'emerald' : 'rose'}
             delay={100}
          />
       </div>

       {/* 2. Quick Activity Heatmap (Last 14 Days) */}
       <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <SectionHeader title={t.spendingHeatmap} subtitle={t.last2Weeks} icon={Activity} />
          <div className="grid grid-cols-7 gap-2">
             {analysis.cumulativeData.slice(-14).map((day, idx) => {
                const intensity = Math.min(day.daySum / (analysis.dailyAvgSpend * 2), 1); // Cap at 2x average
                return (
                   <div key={idx} className="flex flex-col items-center gap-1">
                      <div 
                         className="w-full aspect-square rounded-[4px] transition-all duration-500"
                         style={{ 
                            backgroundColor: `rgba(16, 185, 129, ${0.1 + (intensity * 0.9)})`, // Emerald scale
                            transform: `scale(${0.8 + (intensity * 0.2)})`
                         }}
                      />
                      <span className="text-[9px] font-bold text-slate-300">{format(day.date, 'EEE')}</span>
                   </div>
                );
             })}
          </div>
       </div>

       {/* 3. Top Categories Preview */}
       <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
          <SectionHeader 
             title={t.topCategories} 
             subtitle={t.expenseBreakdown} 
             icon={PieChart}
             action={<button onClick={() => { vibrate(); setActiveTab('categories'); }} className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">{t.viewAll}</button>}
          />
          <div className="space-y-4">
             {analysis.expenseCategories.slice(0, 4).map((cat, idx) => (
                <div key={cat.id} className="relative">
                   <div className="flex items-center justify-between mb-1.5 relative z-10">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-lg bg-slate-50 text-slate-500`}>
                            {cat.icon && <cat.icon size={16} />}
                         </div>
                         <span className="font-bold text-slate-700 text-sm">{cat.label}</span>
                      </div>
                      <div className="text-right">
                         <div className="font-bold text-slate-900">₹{cat.amount.toLocaleString('en-IN')}</div>
                      </div>
                   </div>
                   {/* Progress Bar Background */}
                   <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${cat.percentage}%` }} />
                   </div>
                </div>
             ))}
          </div>
       </div>
    </div>
  );

  const renderTrends = () => (
     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
        
        {/* 1. Cumulative Spending Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
           <SectionHeader title={t.burnRate} subtitle={t.cumulativeSpending} icon={TrendingUp} />
           <div className="h-48 flex items-end gap-1 relative pt-4">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                 <div className="border-t border-slate-900 w-full" />
                 <div className="border-t border-slate-900 w-full" />
                 <div className="border-t border-slate-900 w-full" />
              </div>
              
              {analysis.cumulativeData.map((point, idx) => {
                 const height = (point.value / analysis.totalOut) * 100;
                 return (
                    <div key={idx} className="flex-1 flex flex-col justify-end group h-full relative">
                       <div 
                          className="w-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors rounded-t-sm" 
                          style={{ height: `${height}%` }}
                       />
                       {/* Tooltip */}
                       <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap pointer-events-none">
                          ₹{point.value.toLocaleString('en-IN')}
                          <div className="opacity-70 text-[9px] font-normal">{format(point.date, 'dd MMM')}</div>
                       </div>
                    </div>
                 );
              })}
           </div>
           <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-300 uppercase">
              <span>{t.start}</span>
              <span>{t.now}</span>
           </div>
        </div>

        {/* 2. Frequency Stats */}
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{t.avgTransaction}</div>
              <div className="text-xl font-black text-slate-900">₹{Math.round(analysis.avgTxn).toLocaleString('en-IN')}</div>
              <div className="text-slate-400 text-[10px] mt-1 font-medium">{analysis.countTxn} {t.total}</div>
           </div>
           
           <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{t.largestPurchase}</div>
              <div className="text-xl font-black text-slate-900">₹{analysis.maxTxn.toLocaleString('en-IN')}</div>
           </div>
        </div>

     </div>
  );

  const renderTimeAnalysis = () => (
     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
        
        {/* 1. Weekly Pattern */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
           <SectionHeader title={t.weeklyRhythm} subtitle={t.spendingByDay} icon={CalendarDays} />
           <div className="flex items-end justify-between h-40 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                 const amount = analysis.weekDayCounts[idx];
                 const max = Math.max(...analysis.weekDayCounts, 1);
                 const height = (amount / max) * 100;
                 return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-2">
                       <div className="w-full relative flex-1 flex items-end bg-slate-50 rounded-lg overflow-hidden group">
                          <div 
                             className="w-full bg-emerald-400 group-hover:bg-emerald-500 transition-all duration-500 rounded-t-lg"
                             style={{ height: `${height}%` }} 
                          />
                          <div className="absolute bottom-0 left-0 right-0 top-0 flex items-end justify-center pb-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[9px] font-bold text-slate-900 bg-white/80 px-1 rounded">₹{(amount/1000).toFixed(0)}k</span>
                          </div>
                       </div>
                       <span className={`text-[10px] font-bold ${amount > 0 ? 'text-slate-600' : 'text-slate-300'}`}>{day}</span>
                    </div>
                 );
              })}
           </div>
        </div>

        {/* 2. Daily Pattern (Hourly) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
           <SectionHeader title={t.hourlyActivity} subtitle={t.peakHours} icon={Clock} />
           <div className="flex items-end justify-between h-32 gap-0.5">
              {analysis.hourCounts.map((amount, idx) => {
                 const max = Math.max(...analysis.hourCounts, 1);
                 const height = Math.max((amount / max) * 100, 5); // Min 5% height
                 return (
                    <div key={idx} className="flex-1 flex flex-col justify-end group relative h-full">
                       <div 
                          className={`w-full rounded-t-sm transition-all ${amount > 0 ? 'bg-indigo-400 group-hover:bg-indigo-600' : 'bg-slate-100'}`}
                          style={{ height: `${height}%` }}
                       />
                       {idx % 6 === 0 && (
                          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-300">
                             {idx}h
                          </div>
                       )}
                    </div>
                 );
              })}
           </div>
           <div className="h-4" /> {/* Spacer for labels */}
        </div>

     </div>
  );

  const renderInsights = () => (
     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-2xl text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
           <Zap size={140} className="absolute -right-6 -bottom-6 text-white/10 rotate-12" />
           <div className="relative z-10">
              <h3 className="text-2xl font-black mb-1">{t.smartAnalysis}</h3>
              <p className="text-emerald-100 text-sm font-medium mb-6">{t.aiDrivenPatterns}</p>
              
              <div className="space-y-3">
                 {/* Insight 1: Spending Trend */}
                 <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-start gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                       <TrendingUp size={18} />
                    </div>
                    <div>
                       <div className="font-bold text-sm text-white">{t.spendingVelocity}</div>
                       <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                           {t.spendingVelocityText.replace('{amount}', Math.round(analysis.dailyAvgSpend))}
                        </p>
                    </div>
                 </div>

                 {/* Insight 2: Top Category Dominance */}
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 flex items-start gap-3">
                     <div className="p-2 bg-white/20 rounded-lg">
                        <PieChart size={18} />
                     </div>
                     <div>
                        <div className="font-bold text-sm text-white">{t.concentration}</div>
                        <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                           {t.concentrationText
                              .replace('{percent}', analysis.expenseCategories[0]?.percentage.toFixed(0))
                              .replace('{category}', analysis.expenseCategories[0]?.label)
                           }
                        </p>
                     </div>
                  </div>

              </div>
           </div>
        </div>
     </div>
  );

  // State for Category View Toggle
  const [categoryView, setCategoryView] = useState('expenses'); // 'expenses' | 'income'

  const renderCategories = () => {
    const categoriesToShow = categoryView === 'income' ? analysis.incomeCategories : analysis.expenseCategories;
    const isIncome = categoryView === 'income';

    return (
     <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm flex gap-1 mb-2">
           <button 
             onClick={() => { vibrate(); setCategoryView('expenses'); }}
             className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-center transition-all ${!isIncome ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Expenses
           </button>
           <button 
             onClick={() => { vibrate(); setCategoryView('income'); }}
             className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-center transition-all ${isIncome ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Income
           </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
           {categoriesToShow.length > 0 ? (
             categoriesToShow.map(cat => (
              <div 
                 key={cat.id} 
                 onClick={() => { vibrate(); setSelectedCategory(cat); }}
                 className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer group"
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                       {cat.icon && <cat.icon size={20} />}
                    </div>
                    <div>
                       <div className="font-bold text-slate-900 text-sm">{cat.label}</div>
                       <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${cat.percentage}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{cat.percentage.toFixed(0)}%</span>
                       </div>
                    </div>
                 </div>
                 <div className="text-right">
                    <div className="font-black text-slate-900 text-sm">₹{cat.amount.toLocaleString('en-IN')}</div>
                    <div className={`text-[10px] font-bold flex items-center justify-end gap-1 ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                       Details <ChevronRight size={10} />
                    </div>
                 </div>
              </div>
             ))
           ) : (
             <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest">
                No {isIncome ? 'Income' : 'Expense'} Data
             </div>
           )}
        </div>
     </div>
  );
  };

  // --- Main Layout ---

  // Drill Down Full Screen Overlay
  if (selectedCategory) {
     const catTxns = analysis.currentTxns.filter(t => t.category === selectedCategory.id).sort((a,b) => b.date - a.date);
     return (
        <div className="flex flex-col h-full bg-slate-50 animate-in slide-in-from-right duration-300">
           <div className="bg-white p-4 pt-12 border-b border-slate-100 flex items-center gap-4 sticky top-0 z-30 shadow-sm">
             <button onClick={() => { vibrate(); setSelectedCategory(null); }} className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
               <ArrowLeft size={24} className="text-slate-700" />
             </button>
             <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{selectedCategory.label}</h2>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction History</div>
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 text-center">
                 <div className="text-3xl font-black text-slate-900">₹{selectedCategory.amount.toLocaleString('en-IN')}</div>
                 <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Total Selected Period</div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                 {catTxns.map((t, i) => (
                    <div key={t.id} className={i !== catTxns.length -1 ? "border-b border-slate-100" : ""}>
                       <TransactionCard transaction={t} lang={'en'} />
                    </div>
                 ))}
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 relative animate-in slide-in-from-bottom duration-300">
      
      {/* 1. Refined Header (Matches App.jsx) */}
      <div className={`sticky top-0 z-20 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200/60' : 'bg-transparent'}`}>
         {/* Green Gradient Top Bar */}
         {!scrolled && <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-50 opacity-100 -z-10" />}
         
         <div className="p-4 pt-10 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
               <button onClick={() => { vibrate(); onClose(); }} className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors text-slate-700 active:scale-90">
                  <ArrowLeft size={22} />
               </button>
               <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">{t.financialInsights}</h2>
                  <p className={`text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5 ${scrolled ? 'opacity-0 h-0 hidden' : 'opacity-100'}`}>{t.analyticsSuite}</p>
               </div>
            </div>
            {/* Time Filter Pills */}
            <div className="flex bg-white/50 backdrop-blur-sm border border-slate-200/50 p-0.5 rounded-lg">
                {['month', 'year', 'all'].map(pid => (
                   <button 
                      key={pid}
                      onClick={() => { vibrate(); setTimeFilter(pid); }}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${timeFilter === pid ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                      {pid}
                   </button>
                ))}
            </div>
         </div>

         {/* Navigation Tabs (Scrollable) */}
         <div className="px-4 flex gap-6 overflow-x-auto no-scrollbar pb-0">
            {TABS.map(tab => {
               const Icon = tab.icon;
               const isActive = activeTab === tab.id;
               return (
                  <button 
                     key={tab.id}
                     onClick={() => { vibrate(); setActiveTab(tab.id); }}
                     className={`flex items-center gap-2 pb-3 whitespace-nowrap transition-all border-b-2 ${isActive ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                     <Icon size={18} className={isActive ? "stroke-[2.5px]" : "stroke-2"} />
                     <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? "text-slate-900" : ""}`}>{tab.label}</span>
                  </button>
               );
            })}
         </div>
      </div>

      {/* 2. Main Content Area */}
      <div 
         className="flex-1 overflow-y-auto p-4 pb-32 scroll-smooth"
         onScroll={handleScroll}
      >
         {activeTab === 'overview' && renderOverview()}
         {activeTab === 'trends' && renderTrends()}
         {activeTab === 'time' && renderTimeAnalysis()}
         {activeTab === 'insights' && renderInsights()}
         {activeTab === 'categories' && renderCategories()}
      </div>

    </div>
  );
}
