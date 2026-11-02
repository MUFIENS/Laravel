import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
    value: string | number;
    label: string;
    description?: string;
    badge?: string;
    icon?: React.ReactNode;
}

interface CustomSelectProps {
    id?: string;
    name?: string;
    value: string | number;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    className?: string;
    required?: boolean;
    'aria-label'?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    id,
    name,
    value,
    onChange,
    options,
    placeholder = '-- Pilih Opsi --',
    disabled = false,
    error,
    className = '',
    required = false,
    'aria-label': ariaLabel,
}) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selectedOption = options.find((opt) => String(opt.value) === String(value));

    // Handle outside click to close dropdown
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setHighlightedIndex(-1);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleOutsideClick);
        }

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen]);

    // Scroll highlighted item into view if navigating with keyboard
    useEffect(() => {
        if (isOpen && highlightedIndex >= 0 && listRef.current) {
            const listItems = listRef.current.querySelectorAll('[role="option"]');
            if (listItems[highlightedIndex]) {
                (listItems[highlightedIndex] as HTMLElement).scrollIntoView({
                    block: 'nearest',
                });
            }
        }
    }, [highlightedIndex, isOpen]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
                const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
                setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < options.length) {
                    const opt = options[highlightedIndex];
                    onChange(String(opt.value));
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                }
                break;
            case 'Escape':
            case 'Tab':
                setIsOpen(false);
                setHighlightedIndex(-1);
                break;
            default:
                break;
        }
    };

    const handleSelectOption = (opt: SelectOption) => {
        onChange(String(opt.value));
        setIsOpen(false);
        setHighlightedIndex(-1);
    };

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            {/* Hidden native input for HTML form integration if name is given */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={value}
                    required={required}
                />
            )}

            {/* Trigger Button: Styled with white border and soft off-white background in light mode (matching Gambar 2), dark in dark mode */}
            <button
                type="button"
                id={selectId}
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen((prev) => !prev);
                        if (!isOpen) {
                            const currentIndex = options.findIndex((opt) => String(opt.value) === String(value));
                            setHighlightedIndex(currentIndex >= 0 ? currentIndex : 0);
                        }
                    }
                }}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={`${selectId}-listbox`}
                aria-label={ariaLabel}
                className={`custom-select-trigger group flex h-11 w-full items-center justify-between rounded-xl border px-3.5 text-left text-xs transition-all duration-200 outline-none ${
                    disabled
                        ? 'cursor-not-allowed border-white bg-[#F8F9FA] text-neutral-400 dark:border-[#262626] dark:bg-[#121212] dark:text-[#525252]'
                        : error
                        ? 'border-rose-500/80 bg-[#F8F9FA] text-neutral-800 dark:border-rose-500/80 dark:bg-[#1a1a1a] dark:text-neutral-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : isOpen
                        ? 'border-orange-500 bg-[#F8F9FA] text-neutral-800 ring-1 ring-orange-500 dark:border-orange-500 dark:bg-[#1a1a1a] dark:text-neutral-200'
                        : 'border-white bg-[#F8F9FA] text-neutral-800 shadow-xs hover:border-neutral-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 dark:border-[#262626] dark:bg-[#1a1a1a] dark:text-neutral-200 dark:shadow-none dark:hover:border-[#383838]'
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {selectedOption?.icon && (
                        <span className="shrink-0 text-orange-500 dark:text-orange-400">
                            {selectedOption.icon}
                        </span>
                    )}
                    <span
                        className={`truncate ${
                            selectedOption
                                ? 'custom-select-value font-medium text-neutral-800 dark:text-neutral-200'
                                : 'custom-select-placeholder text-[#9CA3AF] dark:text-neutral-500'
                        }`}
                    >
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>

                <ChevronDown
                    className={`custom-select-chevron size-4 shrink-0 text-[#9CA3AF] dark:text-neutral-400 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-orange-500' : 'group-hover:text-neutral-600 dark:group-hover:text-neutral-300'
                    }`}
                />
            </button>

            {/* Floating Menu / Options Panel */}
            {isOpen && (
                <div
                    id={`${selectId}-listbox`}
                    role="listbox"
                    aria-label={placeholder}
                    className="custom-select-dropdown absolute z-50 mt-1.5 w-full rounded-xl border border-white bg-white py-1.5 shadow-2xl shadow-black/15 backdrop-blur-md transition-all duration-150 animate-in fade-in-0 zoom-in-95 dark:border-neutral-800 dark:bg-[#141414] dark:shadow-black/70"
                >
                    <ul
                        ref={listRef}
                        className="max-h-60 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800"
                    >
                        {options.length === 0 ? (
                            <li className="px-4 py-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
                                Tidak ada opsi tersedia
                            </li>
                        ) : (
                            options.map((opt, index) => {
                                const isSelected = String(opt.value) === String(value);
                                const isHighlighted = index === highlightedIndex;

                                return (
                                    <li
                                        key={opt.value}
                                        role="option"
                                        aria-selected={isSelected}
                                        onClick={() => handleSelectOption(opt)}
                                        onMouseEnter={() => setHighlightedIndex(index)}
                                        className={`custom-select-option group mx-1 my-0.5 flex cursor-pointer items-center justify-between rounded-lg px-4 py-2.5 text-xs transition-colors duration-150 ${
                                            isSelected
                                                ? 'custom-select-option-selected bg-orange-500/10 font-semibold text-orange-600 dark:text-orange-400'
                                                : isHighlighted
                                                ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white'
                                                : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            {opt.icon && (
                                                <span className="shrink-0">
                                                    {opt.icon}
                                                </span>
                                            )}
                                            <div className="flex flex-col">
                                                <span className="truncate">{opt.label}</span>
                                                {opt.description && (
                                                    <span className="text-[10px] text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-400">
                                                        {opt.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <Check className="size-4 shrink-0 text-orange-500 dark:text-orange-400" />
                                        )}
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CustomSelect;
