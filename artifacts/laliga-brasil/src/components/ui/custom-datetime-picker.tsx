import React, { useState, useEffect } from "react";
import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";

interface CustomDateTimePickerProps {
  value?: string | null;
  onChange: (isoString: string) => void;
  label?: string;
}

export function CustomDateTimePicker({ value, onChange, label }: CustomDateTimePickerProps) {
  const now = value && isValid(parseISO(value)) ? parseISO(value) : new Date();
  
  const [day, setDay] = useState(format(now, "dd"));
  const [month, setMonth] = useState(format(now, "MM"));
  const [year, setYear] = useState(format(now, "yyyy"));
  const [hour, setHour] = useState(format(now, "HH"));
  const [minute, setMinute] = useState(format(now, "mm"));

  useEffect(() => {
    try {
      const dateStr = `${year}-${month}-${day}T${hour}:${minute}:00.000-03:00`; // BRT approximation
      const parsed = new Date(dateStr);
      if (isValid(parsed)) {
        onChange(parsed.toISOString());
      }
    } catch (e) {
      // invalid date construction, ignore
    }
  }, [day, month, year, hour, minute]);

  // Generate options
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() + i).toString());
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const selectClass = "bg-input text-foreground border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none cursor-pointer";

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</label>}
      <div className="flex flex-wrap gap-4 items-center bg-card p-4 rounded-xl border border-border/50">
        
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <div className="flex gap-2">
            <select value={day} onChange={e => setDay(e.target.value)} className={selectClass}>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <span className="text-muted-foreground self-center">/</span>
            <select value={month} onChange={e => setMonth(e.target.value)} className={selectClass}>
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="text-muted-foreground self-center">/</span>
            <select value={year} onChange={e => setYear(e.target.value)} className={selectClass}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="w-px h-8 bg-border hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <div className="flex gap-2 items-center">
            <select value={hour} onChange={e => setHour(e.target.value)} className={selectClass}>
              {hours.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
            <span className="text-muted-foreground font-bold">:</span>
            <select value={minute} onChange={e => setMinute(e.target.value)} className={selectClass}>
              {minutes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <span className="text-xs text-muted-foreground ml-2">BRT</span>
          </div>
        </div>

      </div>
    </div>
  );
}
