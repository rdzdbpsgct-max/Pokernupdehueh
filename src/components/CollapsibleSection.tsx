import { useState, type ReactNode } from 'react';

interface Props {
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({ title, summary, defaultOpen = true, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="bg-gray-800/30 border border-gray-700/50 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800/50 transition-colors text-left"
      >
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
          {title}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          {!isOpen && summary && (
            <span className="text-sm text-gray-500 truncate max-w-[200px]">
              {summary}
            </span>
          )}
          <span className="text-gray-500 text-xs" aria-hidden="true">
            {isOpen ? '\u25BE' : '\u25B8'}
          </span>
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}
