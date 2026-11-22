import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
  prefilled?: boolean;
  confirmed?: boolean;
  onConfirm?: () => void;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  prefilled = false,
  confirmed = false,
  onConfirm,
  className = '',
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isPrefilledUnconfirmed = prefilled && !confirmed;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <label className="label-field mb-0 text-xs font-semibold text-ivory-300">{label}</label>
          {isPrefilledUnconfirmed && onConfirm && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
              className="inline-flex items-center gap-1 rounded-md border border-amber-400 bg-amber-100/90 px-2 py-0.5 text-[11px] font-bold text-amber-900 transition hover:bg-amber-200"
              title="Tap to confirm prefilled value"
            >
              <Check className="h-3 w-3 text-amber-800" />
              <span>Confirm</span>
            </button>
          )}
          {prefilled && confirmed && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
              <Check className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex min-h-[50px] w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
          isPrefilledUnconfirmed
            ? 'border-amber-400 bg-amber-50/70 text-amber-950 ring-1 ring-amber-300/50'
            : isOpen
            ? 'border-gold-400 bg-ink-900 ring-4 ring-gold-400/10'
            : 'border-ivory-50/15 bg-ink-900 hover:border-gold-400/40 text-ivory-50 shadow-soft'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="min-w-0 flex-1">
          {selectedOption ? (
            <div>
              <span className="block truncate text-sm font-semibold text-ivory-50">
                {selectedOption.label}
              </span>
              {selectedOption.sublabel && (
                <span className="block truncate text-[11px] text-ivory-400">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-ivory-500">{placeholder}</span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {selectedOption?.badge && (
            <span className="rounded-full bg-clinic-50 px-2 py-0.5 text-[10px] font-bold text-gold-500">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-ivory-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-gold-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Custom Dropdown Menu (No ugly mobile browser native popup) */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-ivory-50/15 bg-ink-900 p-1.5 shadow-lift backdrop-blur-xl animate-fade-in [scrollbar-width:thin]">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  if (onConfirm) onConfirm();
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition ${
                  isSelected
                    ? 'bg-gold-500 text-ink-900 font-semibold shadow-soft'
                    : 'text-ivory-50 hover:bg-ink-800'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${isSelected ? 'font-bold text-ink-900' : 'font-medium'}`}>
                    {opt.label}
                  </div>
                  {opt.sublabel && (
                    <div
                      className={`text-xs ${
                        isSelected ? 'text-ink-900/80' : 'text-ivory-400'
                      }`}
                    >
                      {opt.sublabel}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {opt.badge && !isSelected && (
                    <span className="rounded-full bg-clinic-50 px-2 py-0.5 text-[10px] font-semibold text-gold-500">
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="h-4 w-4 text-ink-900 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
