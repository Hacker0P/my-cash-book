import React from 'react';
import { Delete } from 'lucide-react';

export function Keypad({ onKeyPress, onDelete }) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <div className="grid grid-cols-3 gap-3">
      {keys.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(10);
            onKeyPress(key);
          }}
          className="h-16 text-3xl font-medium rounded-2xl bg-slate-50 text-slate-900 border border-slate-200 shadow-sm hover:bg-white hover:border-slate-300 hover:shadow-md active:scale-95 active:bg-slate-100 transition-all outline-none focus:ring-2 focus:ring-slate-400"
        >
          {key}
        </button>
      ))}
      <button
        type="button"
        onClick={() => {
          if (navigator.vibrate) navigator.vibrate(10);
          onDelete();
        }}
        className="h-16 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-sm hover:bg-rose-100 hover:border-rose-200 hover:shadow-md active:scale-95 transition-all outline-none focus:ring-2 focus:ring-rose-400"
      >
        <Delete size={32} />
      </button>
    </div>
  );
}
