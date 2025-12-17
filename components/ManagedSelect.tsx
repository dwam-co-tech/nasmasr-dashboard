'use client';

import { useState, useEffect, useRef } from 'react';

export interface ManagedSelectOption {
  value: string;
  label: string;
}

interface ManagedSelectProps {
  options: (string | ManagedSelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  getCount?: (value: string) => number;
  className?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
}

export default function ManagedSelect({
  options,
  value,
  onChange,
  placeholder,
  getCount,
  className,
  searchable,
  searchPlaceholder,
}: ManagedSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current) return;
      const t = e.target as Node;
      if (!ref.current.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => {
        try { inputRef.current?.focus(); } catch {}
      }, 0);
    }
    if (!open) setQuery('');
  }, [open, searchable]);

  const normalizedOptions: ManagedSelectOption[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  const filteredOptions: ManagedSelectOption[] = (searchable && query.trim().length > 0)
    ? normalizedOptions.filter(o => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : normalizedOptions;

  const selectedOption = normalizedOptions.find(o => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : value;
  const placeholderText = typeof placeholder === 'string' ? placeholder : '';

  return (
    <div className={`managed-select ${className || ''}`} ref={ref}>
      <button
        type="button"
        className="managed-select-toggle"
        onClick={() => setOpen((p) => !p)}
      >
        <span className={`managed-select-value ${value ? 'filled' : ''}`}>
          {value ? displayValue : placeholderText}
        </span>
        <span className={`managed-select-caret ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="managed-select-menu">
          {searchable && (
            <div className="managed-select-search">
              <input
                ref={inputRef}
                type="text"
                className="managed-select-search-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder || 'ابحث...'}
              />
            </div>
          )}
          {placeholderText && (
            <div
              className={`managed-select-item ${value === '' ? 'selected' : ''}`}
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              <span className="managed-select-text">{placeholderText}</span>
            </div>
          )}
          {filteredOptions.map((opt) => (
            <div
              key={opt.value}
              className={`managed-select-item ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              <span className="managed-select-text">{opt.label}</span>
              {getCount && (
                <span className="managed-select-badge">{getCount(opt.value)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
