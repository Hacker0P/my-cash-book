import React from 'react';
import clsx from 'clsx';

export function Layout({ children, className }) {
  return (
    <div className="min-h-[100dvh] bg-slate-100 flex justify-center transition-colors duration-300">
      <div className={clsx("w-full max-w-md bg-white min-h-[100dvh] shadow-xl flex flex-col relative pb-[env(safe-area-inset-bottom)] transition-colors duration-300", className)}>
        {children}
      </div>
    </div>
  );
}
