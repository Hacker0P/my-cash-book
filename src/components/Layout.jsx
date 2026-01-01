import React from 'react';
import clsx from 'clsx';

export function Layout({ children, className }) {
  return (
    <div className="h-[100dvh] w-full bg-slate-200 flex justify-center overflow-hidden">
      <div className={clsx("w-full max-w-md h-full bg-slate-50 flex flex-col relative shadow-2xl overflow-hidden [transform:translateZ(0)]", className)}>
        {children}
      </div>
    </div>
  );
}
