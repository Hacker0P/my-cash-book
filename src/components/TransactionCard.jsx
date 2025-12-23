import React from 'react';
import { format } from 'date-fns';
import { ArrowDownLeft, ArrowUpRight, Edit2, Trash2 } from 'lucide-react';
import { OUT_CATEGORIES, IN_CATEGORIES } from '../constants';
import { TRANSLATIONS } from '../translations';

export function TransactionCard({ transaction, lang = 'en', onLongPress, onEdit, onDelete }) {
  const isIn = transaction.type === 'IN';
  const t = TRANSLATIONS[lang];
  
  // Find category if exists
  const categoryList = isIn ? IN_CATEGORIES : OUT_CATEGORIES;
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
  const catLabel = categoryItem ? (t[categoryItem.id] || categoryItem.label) : null;
  const displayText = transaction.note || catLabel || (isIn ? t.received : t.paid);

  // Long Press Logic
  const longPressTimer = React.useRef(null);
  const isLongPress = React.useRef(false);

  const startPress = () => {
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (onLongPress) {
         // Vibrate if available (Navigator.vibrate is standard web API)
         if (navigator.vibrate) navigator.vibrate(10);
         onLongPress(transaction);
      }
    }, 500); // 500ms threshold
  };

  const cancelPress = (e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    // If it was a long press, prevent default click behavior if needed
    if (isLongPress.current && e.cancelable) {
       e.preventDefault(); 
    }
  };

  // Swipe Logic
  const [swipeOffset, setSwipeOffset] = React.useState(0);
  const touchStart = React.useRef(null);

  const onTouchStart = (e) => {
    touchStart.current = e.targetTouches[0].clientX;
    startPress();
  };

  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const currentTouch = e.targetTouches[0].clientX;
    const diff = currentTouch - touchStart.current;
    
    // Only allow swiping left (negative diff)
    if (diff < 0) {
       // Limit swipe to -150px
       const newOffset = Math.max(diff, -150);
       setSwipeOffset(newOffset);
       // Prevent scroll if swiping sideways
       if (Math.abs(diff) > 10) e.preventDefault();
       cancelPress(e); // Cancel long press if swiping
    }
  };

  const onTouchEnd = () => {
    if (swipeOffset < -75) {
       // Snap open
       setSwipeOffset(-140);
    } else {
       // Snap close
       setSwipeOffset(0);
    }
    touchStart.current = null;
    cancelPress({ cancelable: false }); // Cleanup
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
         onMouseDown={startPress}
         onMouseUp={cancelPress}
         onMouseLeave={() => { cancelPress(); setSwipeOffset(0); }} // Auto close on leave for mouse users
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
