import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

export interface DropdownOption<T = string> {
  id: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  flag?: string;
  badge?: string;
  colorHex?: string;
}

interface CustomDropdownProps<T = string> {
  id?: string;
  label?: React.ReactNode;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  enableSearch?: boolean;
  searchPlaceholder?: string;
  colorPreview?: string;
  dropUp?: boolean;
}

export function CustomDropdown<T extends string | number = string>({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option...',
  className = '',
  disabled = false,
  enableSearch = false,
  searchPlaceholder = 'Search...',
  colorPreview,
  dropUp = false
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Find currently selected option
  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  // Close dropdown on outside click/pointerdown or escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePointer = (event: PointerEvent | MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    // Use pointerdown or mousedown + touchstart to catch outside taps safely
    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && enableSearch && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
      }, 50);
      return () => clearTimeout(timer);
    } else if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen, enableSearch]);

  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      opt.label.toLowerCase().includes(term) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(term)) ||
      (opt.id && String(opt.id).toLowerCase().includes(term))
    );
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: T, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full text-left select-none ${className}`} ref={dropdownRef}>
      {label && <div className="mb-1">{label}</div>}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={placeholder}
        className={`w-full h-10 flex items-center justify-between gap-2 bg-slate-900/90 dark:bg-slate-900/90 light:bg-white border ${
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/25 shadow-md shadow-indigo-500/10' : 'border-slate-800 dark:border-slate-800 light:border-slate-300'
        } hover:border-indigo-500/60 rounded-xl px-3.5 text-xs font-semibold text-slate-100 dark:text-slate-100 light:text-slate-900 outline-none transition-all duration-200 cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {colorPreview ? (
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
              style={{ backgroundColor: colorPreview }}
            />
          ) : selectedOption?.colorHex ? (
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
              style={{ backgroundColor: selectedOption.colorHex }}
            />
          ) : null}

          {selectedOption?.flag && <span className="text-sm shrink-0 leading-none">{selectedOption.flag}</span>}
          {selectedOption?.icon && <span className="shrink-0 text-slate-400">{selectedOption.icon}</span>}

          <span className="truncate text-xs font-semibold">
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          {selectedOption?.badge && (
            <span className="text-[9px] bg-indigo-500/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-700 font-bold px-1.5 py-0.5 rounded-md border border-indigo-500/30 shrink-0 uppercase tracking-wider">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Floating Options Menu Overlay */}
      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className={`absolute left-0 right-0 z-[9999] ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 max-h-60 flex flex-col`}
          style={{ minWidth: '100%' }}
        >
          {/* Optional Search Input */}
          {enableSearch && (
            <div className="p-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 shrink-0 bg-slate-950/60">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  placeholder={searchPlaceholder}
                  className="w-full bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-100 dark:text-slate-100 light:text-slate-900 placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto p-1 space-y-0.5 divide-y divide-slate-800/20 max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-500">No matching options</div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.id === value;
                return (
                  <button
                    key={String(opt.id)}
                    type="button"
                    onClick={(e) => handleSelect(opt.id, e)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-indigo-600/20 text-indigo-300 dark:text-indigo-300 light:text-indigo-900 font-bold'
                        : 'text-slate-200 dark:text-slate-200 light:text-slate-800 hover:bg-slate-800/80 dark:hover:bg-slate-800/80 light:hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {opt.colorHex ? (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow-sm"
                          style={{ backgroundColor: opt.colorHex }}
                        />
                      ) : null}

                      {opt.flag && <span className="text-sm shrink-0">{opt.flag}</span>}
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}

                      <div className="truncate">
                        <div className="truncate font-medium">{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-normal truncate">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
