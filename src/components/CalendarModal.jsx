import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';

export function CalendarModal({ selectedDate, onClose, onSelect }) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(selectedDate || new Date()));

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex items-center justify-between text-white">
           <h2 className="text-xl font-bold tracking-wide pl-2">
             {format(currentMonth, 'MMMM yyyy')}
           </h2>
           <div className="flex gap-1">
             <button onClick={handlePrevMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
               <ChevronLeft size={24} />
             </button>
             <button onClick={handleNextMonth} className="p-2 hover:bg-white/10 rounded-full transition-colors">
               <ChevronRight size={24} />
             </button>
             <button onClick={onClose} className="p-2 hover:bg-rose-500/20 hover:text-rose-300 rounded-full transition-colors ml-2">
               <X size={24} />
             </button>
           </div>
        </div>

        {/* Days Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
               const isSelected = isSameDay(day, selectedDate);
               const isCurrentMonth = isSameMonth(day, currentMonth);
               const isTodayDate = isToday(day);

               return (
                 <button
                   key={day.toISOString()}
                   onClick={() => {
                     onSelect(day);
                     onClose();
                   }}
                   className={`
                     h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all relative
                     ${!isCurrentMonth ? 'text-slate-300' : 'text-slate-700'}
                     ${isSelected ? 'bg-slate-900 text-white shadow-md scale-105 font-bold z-10' : 'hover:bg-slate-100'}
                     ${isTodayDate && !isSelected ? 'ring-1 ring-slate-900/20 bg-slate-50 font-bold text-slate-900' : ''}
                   `}
                 >
                   {format(day, 'd')}
                   {isTodayDate && !isSelected && (
                     <div className="absolute bottom-1.5 w-1 h-1 bg-slate-400 rounded-full"></div>
                   )}
                 </button>
               );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
           <button 
             onClick={() => {
               onSelect(new Date());
               onClose();
             }}
             className="text-sm font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wide px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
           >
             Jump to Today
           </button>
        </div>
      </div>
    </div>
  );
}
