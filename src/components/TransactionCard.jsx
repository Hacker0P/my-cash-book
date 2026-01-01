import React from 'react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Edit2, Trash2 } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { TRANSLATIONS } from '../translations';

export function TransactionCard({ transaction, lang = 'en', onLongPress, onEdit, onDelete }) {
  const isIn = transaction.type === 'IN';
  const t = TRANSLATIONS[lang];
  const { getCategories } = useCategories();
  
  // Find category from merged list (includes custom ones)
  const categoryList = getCategories(transaction.type);
  const categoryItem = transaction.category 
    ? categoryList.find(c => c.id === transaction.category)
    : null;

  const CategoryIcon = categoryItem?.icon;
  
  const displayIcon = CategoryIcon ? (
      <CategoryIcon size={20} />
  ) : (
      isIn ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />
  );

  // Translate category label if present, else default
  // For custom categories, label is direct string. For built-ins, look up translation.
  const catLabel = categoryItem 
      ? (categoryItem.isCustom ? categoryItem.label : (t[categoryItem.id] || categoryItem.label)) 
      : null;
  const displayText = transaction.note || catLabel || (isIn ? t.received : t.paid);

  // Swipe Logic
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const touchStart = React.useRef(null);
  const startOffset = React.useRef(0);

  const onTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
    startOffset.current = swipeOffset;
  };

  const onTouchMove = (e) => {
    if (touchStart.current === null) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart.current;
    
    // Calculate potential new offset based on startOffset
    const newOffset = Math.min(0, Math.max(-140, startOffset.current + diff));

    // Only prevent default if we are actively swiping horizontally
    if (Math.abs(diff) > 10) {
        if ((startOffset.current === 0 && diff < 0) || (startOffset.current === -140 && diff > 0) || (newOffset !== 0 && newOffset !== -140)) {
             e.preventDefault();
        }
    }
    
    setSwipeOffset(newOffset);
  };

  const onTouchEnd = () => {
    if (swipeOffset < -70) {
       // Snap open
       setSwipeOffset(-140);
    } else {
       // Snap close
       setSwipeOffset(0);
    }
    touchStart.current = null;
  };

  return (
    <div className="relative overflow-hidden group">
       {/* Background Actions */}
       <div className="absolute inset-y-0 right-0 flex w-[140px]">
          <button 
             onClick={(e) => {
                e.preventDefault();
                if (onEdit) onEdit(transaction);
                setSwipeOffset(0); // Reset after click
             }}
             className="flex-1 bg-indigo-500 text-white flex items-center justify-center font-bold"
          >
             <Edit2 size={20} />
          </button>
          <button 
             onClick={(e) => {
                e.preventDefault();
                if (navigator.vibrate) navigator.vibrate(10);
                if (onDelete) onDelete(transaction);
                setSwipeOffset(0);
             }}
             className="flex-1 bg-rose-500 text-white flex items-center justify-center font-bold rounded-r-xl"
          >
             <Trash2 size={20} />
          </button>
       </div>

       {/* Main Card Content */}
       <div 
         onMouseLeave={() => { setSwipeOffset(0); }} // Auto close on leave for mouse users
         onTouchStart={onTouchStart}
         onTouchEnd={onTouchEnd}
         onTouchMove={onTouchMove}
         onContextMenu={(e) => e.preventDefault()}
         style={{ transform: `translateX(${swipeOffset}px)` }}
         className="flex items-center justify-between p-4 hover:bg-slate-50 active:bg-slate-100 transition-transform duration-200 ease-out rounded-xl cursor-default relative bg-white z-10 select-none"
       >
         <div className="flex items-center gap-4">
           <div className={`p-3.5 rounded-2xl flex items-center justify-center shadow-sm ring-1 ring-inset transition-colors ${
             isIn 
                ? 'bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover:bg-emerald-100 group-hover:ring-emerald-200' 
                : 'bg-rose-50 text-rose-600 ring-rose-100 group-hover:bg-rose-100 group-hover:ring-rose-200'
           }`}>
             {displayIcon}
           </div>
           <div>
             <div className="font-bold text-slate-900 text-[15px] leading-tight mb-0.5">{displayText}</div>
             <div className="text-xs text-slate-400 font-medium">{format(transaction.date, 'h:mm a')}</div>
           </div>
         </div>
         <div className={`font-black text-[17px] tracking-tight ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
           {isIn ? '+' : '-'} ₹{transaction.amount.toLocaleString('en-IN')}
         </div>
       </div>
    </div>
  );
}
