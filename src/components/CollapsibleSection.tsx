import { useState, type ReactNode } from 'react';
import { ChevronIcon } from './ChevronIcon';

interface Props {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ title, summary, defaultOpen = true, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-100/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700/40 rounded-xl overflow-hidden shadow-lg shadow-gray-300/30 dark:shadow-black/20">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="group w-full flex items-center justify-between px-4 py-3 hover:bg-gray-200/50 dark:hover:bg-gray-700/30 hover:shadow-lg hover:shadow-gray-300/40 dark:hover:shadow-black/25 transition-all duration-200 text-left"
      >
        <div>
          <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </h2>
          {isOpen && summary && (
            <span className="text-xs text-gray-300 dark:text-gray-600 font-normal normal-case tracking-normal">
              {summary}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isOpen && summary && (
            <span className="text-sm text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
              {summary}
            </span>
          )}
          <ChevronIcon open={isOpen} className="text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200" />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
