import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Selecionar...",
  className = "",
  disabled = false,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 bg-background border border-border hover:border-primary/60 rounded-lg px-3 py-2.5 text-sm text-white transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.icon}
          <span className={selected ? "" : "text-muted-foreground"}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-2xl py-1 max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-muted-foreground italic">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-start justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-primary/15 transition-colors ${
                  opt.value === value
                    ? "bg-primary/10 text-primary"
                    : "text-gray-200"
                }`}
              >
                <span className="flex items-start gap-2 truncate min-w-0 flex-1">
                  {opt.icon && (
                    <span className="flex-shrink-0 mt-0.5">{opt.icon}</span>
                  )}
                  <span className="flex flex-col min-w-0">
                    <span className="truncate">{opt.label}</span>
                    {opt.hint && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        {opt.hint}
                      </span>
                    )}
                  </span>
                </span>
                {opt.value === value && (
                  <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
