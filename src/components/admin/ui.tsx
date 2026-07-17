"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

export function AdminSection({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <div>
          <h2 className="admin-card-title">{title}</h2>
          {description ? <p className="admin-card-desc">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="admin-card-body">{children}</div>
    </section>
  );
}

export function AdminField({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`admin-field ${className}`}>
      <span className="admin-label">{label}</span>
      {children}
      {hint ? <span className="admin-hint">{hint}</span> : null}
    </label>
  );
}

export function AdminInput({
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  onBlur,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: () => void;
  min?: string;
  max?: string;
}) {
  return (
    <input
      type={type}
      className="admin-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      min={min}
      max={max}
    />
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function monthValue(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function monthYear(value?: string): number | null {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return null;
  return Number(value.slice(0, 4));
}

export function AdminMonthPicker({
  value,
  onChange,
  disabled,
  min,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  min?: string;
  max?: string;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentValue = monthValue(currentYear, currentMonth);
  const initialYear = monthYear(value) ?? monthYear(max) ?? currentYear;
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(initialYear);
  const rootRef = useRef<HTMLDivElement>(null);
  const minYear = monthYear(min);
  const maxYear = monthYear(max);

  useEffect(() => {
    if (open) setViewYear(monthYear(value) ?? monthYear(max) ?? currentYear);
  }, [currentYear, max, open, value]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const selectedMonth = value ? `${MONTH_NAMES[Number(value.slice(5, 7)) - 1]} ${value.slice(0, 4)}` : "Select month";
  const canUseCurrent = (!min || currentValue >= min) && (!max || currentValue <= max);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        className="admin-input flex min-h-10 items-center justify-between gap-3 text-start"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{selectedMonth}</span>
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute start-0 top-[calc(100%+0.4rem)] z-40 w-[min(20rem,calc(100vw-3rem))] rounded-xl border border-primary/25 bg-card p-3 shadow-[0_18px_55px_rgba(0,0,0,0.4)]"
          role="dialog"
          aria-label="Choose month"
        >
          <div className="mb-3 flex items-center justify-between rounded-lg bg-primary/10 px-2 py-1.5">
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary/15 hover:text-primary disabled:opacity-30"
              disabled={minYear !== null && viewYear <= minYear}
              onClick={() => setViewYear((year) => year - 1)}
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold tabular-nums text-foreground">{viewYear}</span>
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary/15 hover:text-primary disabled:opacity-30"
              disabled={maxYear !== null && viewYear >= maxYear}
              onClick={() => setViewYear((year) => year + 1)}
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {MONTH_NAMES.map((month, monthIndex) => {
              const option = monthValue(viewYear, monthIndex);
              const unavailable = Boolean((min && option < min) || (max && option > max));
              const selected = option === value;
              const current = option === currentValue;

              return (
                <button
                  key={month}
                  type="button"
                  disabled={unavailable}
                  className={`relative rounded-lg px-2 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-25 ${
                    selected
                      ? "bg-primary font-semibold text-primary-foreground shadow-[0_5px_18px_hsl(var(--primary)/0.3)]"
                      : "text-foreground hover:bg-primary/15 hover:text-primary"
                  }`}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  {month.slice(0, 3)}
                  {current && !selected ? (
                    <span className="absolute bottom-1 start-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              disabled={!canUseCurrent}
              className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-30"
              onClick={() => {
                onChange(currentValue);
                setOpen(false);
              }}
            >
              This month
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function dateValue(year: number, monthIndex: number, day: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function AdminDateTimePicker({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const now = new Date();
  const selectedDate = /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";
  const selectedTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) ? value.slice(11, 16) : "12:00";
  const selectedYear = selectedDate ? Number(selectedDate.slice(0, 4)) : now.getFullYear();
  const selectedMonth = selectedDate ? Number(selectedDate.slice(5, 7)) - 1 : now.getMonth();
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear);
  const [viewMonth, setViewMonth] = useState(selectedMonth);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setViewYear(selectedYear);
    setViewMonth(selectedMonth);
  }, [open, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const displayValue = selectedDate
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(`${selectedDate}T${selectedTime}`))
    : "Select date and time";

  const moveMonth = (offset: number) => {
    const next = new Date(viewYear, viewMonth + offset, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const updateTime = (time: string) => {
    const date = selectedDate || dateValue(now.getFullYear(), now.getMonth(), now.getDate());
    onChange(`${date}T${time}`);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        className="admin-input flex min-h-10 items-center justify-between gap-3 text-start"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={selectedDate ? "text-foreground" : "text-muted-foreground"}>
          {displayValue}
        </span>
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden />
      </button>

      {open ? (
        <div
          className="absolute start-0 top-[calc(100%+0.4rem)] z-40 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-primary/25 bg-card p-3 shadow-[0_18px_55px_rgba(0,0,0,0.4)]"
          role="dialog"
          aria-label="Choose date and time"
        >
          <div className="mb-3 flex items-center justify-between rounded-lg bg-primary/10 px-2 py-1.5">
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
              onClick={() => moveMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-semibold text-foreground">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-primary/15 hover:text-primary"
              onClick={() => moveMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase text-muted-foreground">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <span key={`empty-${index}`} aria-hidden />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map((day) => {
              const option = dateValue(viewYear, viewMonth, day);
              const selected = option === selectedDate;
              const today = option === dateValue(now.getFullYear(), now.getMonth(), now.getDate());

              return (
                <button
                  key={option}
                  type="button"
                  className={`relative aspect-square rounded-lg text-xs transition ${
                    selected
                      ? "bg-primary font-semibold text-primary-foreground shadow-[0_5px_18px_hsl(var(--primary)/0.3)]"
                      : "text-foreground hover:bg-primary/15 hover:text-primary"
                  }`}
                  onClick={() => onChange(`${option}T${selectedTime}`)}
                >
                  {day}
                  {today && !selected ? (
                    <span className="absolute bottom-1 start-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
            <span className="text-xs font-medium text-muted-foreground">Time</span>
            <input
              type="time"
              value={selectedTime}
              onChange={(event) => updateTime(event.target.value)}
              className="admin-input max-w-36"
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
            >
              Clear
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
                onClick={() => {
                  const today = dateValue(now.getFullYear(), now.getMonth(), now.getDate());
                  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
                  onChange(`${today}T${time}`);
                }}
              >
                Now
              </button>
              <button
                type="button"
                className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary-glow"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminTextarea({
  value,
  onChange,
  rows = 4,
  placeholder,
  disabled,
  mono,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  disabled?: boolean;
  mono?: boolean;
  onBlur?: () => void;
}) {
  return (
    <textarea
      className={`admin-input admin-textarea-inline ${mono ? "font-mono text-xs" : ""}`}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export function AdminSelect({
  value,
  onChange,
  options,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <select
      className="admin-input admin-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function AdminCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="admin-checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span>{label}</span>
    </label>
  );
}

export function AdminBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "muted";
}) {
  return <span className={`admin-badge admin-badge-${tone}`}>{children}</span>;
}

export function AdminButton({
  children,
  onClick,
  variant = "secondary",
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      className={`admin-btn admin-btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function AdminEmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="admin-empty">
      <p className="font-medium text-foreground">{title}</p>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function linesToArray(text: string): string[] {
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function arrayToLines(items: string[]): string {
  return items.join("\n");
}

export function commaToArray(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function arrayToComma(items: string[]): string {
  return items.join(", ");
}

/** Comma-separated list — keeps raw text while typing; parses on blur. */
export function CommaListInput({
  items,
  onChange,
  disabled,
  rows = 4,
  multiline = true,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
  rows?: number;
  multiline?: boolean;
}) {
  const itemsKey = JSON.stringify(items);
  const [draft, setDraft] = useState(() => arrayToComma(items));

  useEffect(() => {
    setDraft(arrayToComma(items));
  }, [itemsKey]);

  const commit = () => onChange(commaToArray(draft));

  if (multiline) {
    return (
      <AdminTextarea
        value={draft}
        onChange={setDraft}
        onBlur={commit}
        rows={rows}
        disabled={disabled}
      />
    );
  }

  return (
    <AdminInput value={draft} onChange={setDraft} onBlur={commit} disabled={disabled} />
  );
}

/** One item per line — keeps raw text while typing; parses on blur. */
export function LinesListInput({
  items,
  onChange,
  disabled,
  rows = 4,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  disabled?: boolean;
  rows?: number;
}) {
  const itemsKey = JSON.stringify(items);
  const [draft, setDraft] = useState(() => arrayToLines(items));

  useEffect(() => {
    setDraft(arrayToLines(items));
  }, [itemsKey]);

  const commit = () => onChange(linesToArray(draft));

  return (
    <AdminTextarea
      value={draft}
      onChange={setDraft}
      onBlur={commit}
      rows={rows}
      disabled={disabled}
    />
  );
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
