import { useState } from 'react';
import { Check, ChevronDown, Users } from 'lucide-react';
import type { Language } from '../App';

interface SwitchableChild {
  id: string;
  name: string;
  className?: string;
  schoolId?: string;
}

interface ChildSwitcherProps {
  children: SwitchableChild[];
  selectedId: string;
  onSelect: (id: string) => void;
  schoolNames: Record<string, string>;
  language: Language;
}

const T = {
  nl: {
    viewing: 'Je bekijkt nu de gegevens van',
    switchTo: (name: string) => `Tik om te wisselen naar ${name}`,
    switchAny: 'Tik om een ander kind te kiezen',
    pick: 'Kies een kind',
  },
  tr: {
    viewing: 'Şu anda şu çocuğun bilgilerini görüyorsunuz',
    switchTo: (name: string) => `${name} için dokunun`,
    switchAny: 'Başka bir çocuk seçmek için dokunun',
    pick: 'Bir çocuk seçin',
  },
};

// Shown only to parents with more than one child. The row of equal-looking
// name pills this replaced never said *which* child the page below was about —
// you had to notice which pill was filled in. This states it in words, and the
// action it offers is the one thing you'd want next: switch to the other child.
export default function ChildSwitcher({
  children,
  selectedId,
  onSelect,
  schoolNames,
  language,
}: ChildSwitcherProps) {
  const text = T[language];
  const [open, setOpen] = useState(false);

  if (children.length < 2) return null;

  const selected = children.find((c) => c.id === selectedId) || children[0];
  const others = children.filter((c) => c.id !== selected.id);
  // With exactly one other child there is nothing to choose between — tapping
  // just swaps. A list would be three taps to do what one can.
  const isToggle = others.length === 1;

  const subtitle = (c: SwitchableChild) =>
    [c.className, c.schoolId ? schoolNames[c.schoolId] : null].filter(Boolean).join(' · ');

  const initial = (name: string) => name.trim().charAt(0).toUpperCase();

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => (isToggle ? onSelect(others[0].id) : setOpen((v) => !v))}
        aria-expanded={isToggle ? undefined : open}
        className="flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 text-left transition active:scale-[0.99]"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-base font-bold text-white shadow-sm">
          {initial(selected.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium uppercase tracking-wide text-emerald-700/70">
            {text.viewing}
          </span>
          <span className="block truncate text-base font-bold leading-tight text-gray-800">
            {selected.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-xs font-medium text-emerald-700">
            <Users className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {isToggle ? text.switchTo(others[0].name) : text.switchAny}
            </span>
          </span>
        </span>
        {!isToggle && (
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-emerald-600 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {open && !isToggle && (
        <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <p className="px-4 pt-3 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
            {text.pick}
          </p>
          {children.map((child) => {
            const isCurrent = child.id === selected.id;
            return (
              <button
                key={child.id}
                type="button"
                onClick={() => {
                  onSelect(child.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-gray-50 ${
                  isCurrent ? 'bg-emerald-50/60' : ''
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isCurrent ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {initial(child.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-800">{child.name}</span>
                  {subtitle(child) && (
                    <span className="block truncate text-xs text-gray-400">{subtitle(child)}</span>
                  )}
                </span>
                {isCurrent && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
