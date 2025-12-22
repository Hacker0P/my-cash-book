import React from 'react';
import clsx from 'clsx';

export function Layout({ children, className }) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center">
      <div className={clsx("w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative", className)}>
        {children}
      </div>
    </div>
  );
}
