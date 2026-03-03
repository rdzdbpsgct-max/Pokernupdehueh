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
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/50 hover:bg-gray-800/80 transition-colors text-left"
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
        <div className="p-4 bg-gray-900/30">
          {children}
        </div>
      )}
    </div>
  );
}
