"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

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
}: {
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  onBlur?: () => void;
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
    />
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
