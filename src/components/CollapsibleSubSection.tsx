import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSubSection({ title, summary, defaultOpen = false, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-700/50 rounded-lg overflow-hidden shadow-md shadow-black/10">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/40 hover:bg-gray-700/40 hover:shadow-md hover:shadow-black/15 transition-all duration-200 text-left"
      >
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <div className="flex items-center gap-2 shrink-0">
          {!isOpen && summary && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {summary}
            </span>
          )}
          <span className="text-gray-500 text-xs" aria-hidden="true">
            {isOpen ? '\u25BE' : '\u25B8'}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-900/30 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
