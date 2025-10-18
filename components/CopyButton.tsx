
import React, { useState, useCallback } from 'react';
import { ClipboardIcon, CheckIcon } from './icons';

interface CopyButtonProps {
  textToCopy: string;
  className?: string;
  children?: React.ReactNode;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, className, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [textToCopy]);

  const baseClasses = "flex items-center space-x-2 text-sm font-semibold transition-all duration-200 ease-in-out rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const defaultClasses = "bg-golden/20 text-golden-dark hover:bg-golden/30 focus:ring-golden";
  const copiedClasses = "bg-emerald-500 text-white focus:ring-emerald-500";

  return (
    <button onClick={handleCopy} className={`${baseClasses} ${copied ? copiedClasses : defaultClasses} ${className}`}>
      {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
      <span>{copied ? 'Copiado!' : children || 'Copiar'}</span>
    </button>
  );
};
