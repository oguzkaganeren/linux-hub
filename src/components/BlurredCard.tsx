import React, { ReactNode } from 'react';

interface BlurredCardProps {
  children: ReactNode;
  className?: string;
  // FIX: Updated onClick prop type to accept a React.MouseEvent.
  // The previous type `() => void` was too restrictive for event handlers
  // that need access to the event object, such as for `e.stopPropagation()`.
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const BlurredCard: React.FC<BlurredCardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white/30 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-2xl shadow-lg transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
};

export default BlurredCard;
