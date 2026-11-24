import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && <label className="label-field">{label}</label>}

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((v) => !v)}
        className={`flex min-h-[46px] w-full items-center justify-between gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition ${
          isOpen
            ? 'border-gold-400 bg-ink-900 ring-4 ring-gold-400/15'
            : 'border-ivory-50/15 bg-ink-900 text-ivory-50 shadow-soft hover:border-gold-400/45'
        } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      >
        <div className="min-w-0 flex-1">
          {selectedOption ? (
            <>
              <span className="block truncate text-xs font-semibold text-ivory-50 sm:text-sm">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="block truncate text-[11px] text-ivory-400">
                  {selectedOption.sublabel}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-ivory-500 sm:text-sm">{placeholder}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {selectedOption?.badge && (
            <span className="rounded-full bg-clinic-50 px-2 py-0.5 text-[10px] font-bold text-gold-600">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-ivory-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-gold-500' : ''
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="animate-fade-in absolute left-0 right-0 top-full z-50 mt-1.5 max-h-64 overflow-y-auto rounded-2xl border border-ivory-50/12 bg-ink-900 p-1.5 shadow-lift">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2 text-left transition ${
                  isSelected
                    ? 'bg-ivory-50 text-ink-900 shadow-soft'
                    : 'text-ivory-50 hover:bg-ink-850'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`text-xs sm:text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                    {opt.label}
                  </div>
                  {opt.sublabel && (
                    <div className={`text-[11px] ${isSelected ? 'text-ink-900/75' : 'text-ivory-400'}`}>
                      {opt.sublabel}
                    </div>
                  )}
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-gold-300" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
