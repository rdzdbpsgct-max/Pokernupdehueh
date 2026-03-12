import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from '../i18n';
import type { Language } from '../i18n/translations';
import { BottomSheet } from './BottomSheet';
import { ChevronIcon } from './ChevronIcon';
import {
  helpSections,
  faqEntries,
  shortcutEntries,
  filterSections,
  filterFaq,
} from '../domain/helpContent';
import type { HelpSection, FaqEntry } from '../domain/helpContent';

type Tab = 'guide' | 'faq' | 'shortcuts';
type TFn = (key: string, params?: Record<string, string | number>) => string;

interface Props {
  onClose: () => void;
}

export function HelpCenter({ onClose }: Props) {
  const { t, language } = useTranslation();
  const [tab, setTab] = useState<Tab>('guide');
  const [query, setQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredSections = useMemo(
    () => filterSections(helpSections, query, language as Language),
    [query, language],
  );

  const filteredFaq = useMemo(
    () => filterFaq(faqEntries, query, language as Language),
    [query, language],
  );

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setExpandedSection(null);
    setExpandedFaq(null);
  }, []);

  const toggleSection = useCallback((id: string) => {
    setExpandedSection((prev) => (prev === id ? null : id));
  }, []);

  const toggleFaq = useCallback((idx: number) => {
    const key = String(idx);
    setExpandedFaq((prev) => (prev === key ? null : key));
  }, []);

  const hasResults = tab === 'guide' ? filteredSections.length > 0 : filteredFaq.length > 0;

  return (
    <BottomSheet onClose={onClose} ariaLabelledBy="help-title" maxWidth="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700/40">
        <h2 id="help-title" className="text-lg font-bold text-gray-900 dark:text-white">
          {t('help.title' as Parameters<typeof t>[0])}
        </h2>
        <button
          onClick={onClose}
          className="px-3 py-1.5 bg-gray-100/80 dark:bg-gray-800/60 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700/40"
        >
          {t('help.close' as Parameters<typeof t>[0])}
        </button>
      </div>

      {/* Search */}
      {tab !== 'shortcuts' && (
        <div className="px-5 pt-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder={t('help.search' as Parameters<typeof t>[0])}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/60 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 transition-shadow"
              style={{ boxShadow: 'none' }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-ring)'; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700/40 px-5 mt-2">
        {(['guide', 'faq', 'shortcuts'] as const).map((t_) => {
          const labelKey = t_ === 'guide' ? 'help.guideTab' : t_ === 'faq' ? 'help.faqTab' : 'help.shortcutsTab';
          const isActive = tab === t_;
          return (
            <button
              key={t_}
              onClick={() => { setTab(t_); setQuery(''); setExpandedSection(null); setExpandedFaq(null); }}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? ''
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
              style={isActive ? { borderColor: 'var(--accent-500)', color: 'var(--accent-text)' } : undefined}
            >
              {t(labelKey as Parameters<typeof t>[0])}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {tab === 'guide' && (
          <>
            {filteredSections.map((section) => (
              <SectionAccordion
                key={section.id}
                section={section}
                language={language as Language}
                expanded={expandedSection === section.id}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
            {!hasResults && query && <NoResults query={query} t={t as TFn} />}
          </>
        )}

        {tab === 'faq' && (
          <>
            {filteredFaq.map((entry, idx) => (
              <FaqAccordion
                key={idx}
                entry={entry}
                language={language as Language}
                expanded={expandedFaq === String(idx)}
                onToggle={() => toggleFaq(idx)}
              />
            ))}
            {!hasResults && query && <NoResults query={query} t={t as TFn} />}
          </>
        )}

        {tab === 'shortcuts' && <ShortcutsTable language={language as Language} t={t as TFn} />}
      </div>
    </BottomSheet>
  );
}

// --- Sub-components ---

function SectionAccordion({
  section,
  language,
  expanded,
  onToggle,
}: {
  section: HelpSection;
  language: Language;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/40 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/30 transition-all duration-200 text-left"
      >
        <span className="text-xl leading-none">{section.icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            {section.title[language]}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
            {section.description[language]}
          </span>
        </div>
        <ChevronIcon
          open={expanded}
          className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {section.items.map((item, i) => (
            <div key={i} className="pl-9">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {item.title[language]}
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                {item.body[language]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FaqAccordion({
  entry,
  language,
  expanded,
  onToggle,
}: {
  entry: FaqEntry;
  language: Language;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/40 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100/80 dark:hover:bg-gray-700/30 transition-all duration-200 text-left"
      >
        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
          {entry.question[language]}
        </span>
        <ChevronIcon
          open={expanded}
          className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300"
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-fade-in">
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {entry.answer[language]}
          </p>
        </div>
      )}
    </div>
  );
}

function ShortcutsTable({ language, t }: { language: Language; t: TFn }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700/40">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100/80 dark:bg-gray-800/60">
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">
              {t('help.shortcutKey')}
            </th>
            <th className="px-4 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">
              {t('help.shortcutAction')}
            </th>
          </tr>
        </thead>
        <tbody>
          {shortcutEntries.map((entry) => (
            <tr key={entry.key} className="border-t border-gray-200 dark:border-gray-700/40">
              <td className="px-4 py-2.5">
                <kbd className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded px-2 py-0.5 font-mono text-xs">
                  {entry.key}
                </kbd>
              </td>
              <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                {entry.label[language]}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NoResults({ query, t }: { query: string; t: TFn }) {
  return (
    <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
      {t('help.noResults', { q: query })}
    </div>
  );
}
