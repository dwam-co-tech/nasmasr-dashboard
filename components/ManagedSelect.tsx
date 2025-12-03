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
  placeholder: string;
  getCount?: (value: string) => number;
  className?: string;
}

export default function ManagedSelect({
  options,
  value,
  onChange,
  placeholder,
  getCount,
  className,
}: ManagedSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current) return;
      const t = e.target as Node;
      if (!ref.current.contains(t)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const normalizedOptions: ManagedSelectOption[] = options.map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  const selectedOption = normalizedOptions.find(o => o.value === value);
  const displayValue = selectedOption ? selectedOption.label : value;

  return (
    <div className={`managed-select ${className || ''}`} ref={ref}>
      <button
        type="button"
        className="managed-select-toggle"
        onClick={() => setOpen((p) => !p)}
      >
        <span className={`managed-select-value ${value ? 'filled' : ''}`}>
          {value ? displayValue : placeholder}
        </span>
        <span className={`managed-select-caret ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="managed-select-menu">
          <div
            className={`managed-select-item ${value === '' ? 'selected' : ''}`}
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
          >
            <span className="managed-select-text">{placeholder}</span>
          </div>
          {normalizedOptions.map((opt) => (
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
