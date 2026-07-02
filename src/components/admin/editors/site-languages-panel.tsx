"use client";

import { useMemo, useState } from "react";

import type { SiteInfo } from "@/lib/data";
import { LOCALE_CATALOG } from "@/lib/locale-catalog";
import {
  addLocaleToSite,
  getAddableLocales,
  getDefaultLocaleCode,
  getEnabledLocales,
  getTranslatableLocaleCodes,
  removeLocaleFromSite,
} from "@/lib/site-locales";
import { AdminBadge, AdminSection } from "../ui";

type Props = {
  data: SiteInfo;
  onChange: (data: SiteInfo) => void;
  onTranslated: (site: SiteInfo) => void | Promise<void>;
  readOnly?: boolean;
};

export function SiteLanguagesPanel({ data, onChange, onTranslated, readOnly }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pickCode, setPickCode] = useState("");

  const defaultLocale = getDefaultLocaleCode(data);
  const enabled = getEnabledLocales(data);
  const addable = useMemo(() => getAddableLocales(data), [data]);
  const translatable = getTranslatableLocaleCodes(data);

  const updatedAt = data.translationsUpdatedAt
    ? new Date(data.translationsUpdatedAt).toLocaleString()
    : null;

  const translateLocales = async (locales: string[], label: string) => {
    if (locales.length === 0) return;
    setBusy(label);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/admin/translate-site", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locales }),
      });
      const body = (await res.json()) as {
        error?: string;
        translations?: SiteInfo["translations"];
        translationsUpdatedAt?: string;
      };

      if (!res.ok) throw new Error(body.error ?? "Translation failed");

      await onTranslated({
        ...data,
        translations: body.translations,
        translationsUpdatedAt: body.translationsUpdatedAt,
      });
      setMessage(`AI translations saved for: ${locales.join(", ")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Translation failed");
    } finally {
      setBusy(null);
    }
  };

  const handleAddLanguage = () => {
    if (!pickCode) return;
    onChange(addLocaleToSite(data, pickCode));
    setPickCode("");
    setMessage(`Added ${pickCode.toUpperCase()}. Save changes, then generate AI translation.`);
    setError("");
  };

  const handleRemove = (code: string) => {
    if (!window.confirm(`Remove ${code.toUpperCase()} from the site language switcher?`)) return;
    onChange(removeLocaleFromSite(data, code));
  };

  return (
    <AdminSection
      title="Languages"
      description="Add languages for the public switcher. English is the source — Groq AI generates hero/about text for each added language."
    >
      <div className="space-y-3">
        {enabled.map((locale) => {
          const isDefault = locale.code === defaultLocale;
          const ready = Boolean(data.translations?.[locale.code]?.role);
          return (
            <div
              key={locale.code}
              className="admin-subcard flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="text-lg" aria-hidden>
                  {locale.flag}
                </span>
                <div>
                  <p className="font-medium text-foreground">
                    {locale.nativeName}{" "}
                    <span className="text-xs text-muted-foreground">({locale.code})</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{locale.label}</p>
                </div>
                {isDefault ? (
                  <AdminBadge tone="warning">Source</AdminBadge>
                ) : ready ? (
                  <AdminBadge tone="success">AI ready</AdminBadge>
                ) : (
                  <AdminBadge tone="muted">Needs AI</AdminBadge>
                )}
              </div>

              {!isDefault ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={Boolean(busy) || readOnly}
                    className="admin-btn admin-btn-ghost text-xs"
                    onClick={() => void translateLocales([locale.code], locale.code)}
                  >
                    {busy === locale.code ? "Translating…" : "Generate AI"}
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busy) || readOnly}
                    className="admin-btn admin-btn-danger text-xs"
                    onClick={() => handleRemove(locale.code)}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {updatedAt ? (
        <p className="mt-3 text-xs text-muted-foreground">Last AI run: {updatedAt}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <label className="admin-field min-w-[14rem] flex-1">
          <span className="admin-label">Add language</span>
          <select
            value={pickCode}
            disabled={readOnly || addable.length === 0}
            className="admin-input"
            onChange={(e) => setPickCode(e.target.value)}
          >
            <option value="">
              {addable.length === 0 ? "All catalog languages added" : "Select a language…"}
            </option>
            {addable.map((entry) => (
              <option key={entry.code} value={entry.code}>
                {entry.flag} {entry.label} — {entry.nativeName}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={!pickCode || readOnly}
          className="admin-btn admin-btn-primary"
          onClick={handleAddLanguage}
        >
          Add language
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy) || readOnly || translatable.length === 0}
          className="admin-btn admin-btn-primary"
          onClick={() => void translateLocales(translatable, "all")}
        >
          {busy === "all" ? "Translating all…" : "Generate AI for all languages"}
        </button>
      </div>

      <p className="mt-3 text-sm text-muted-foreground">
        After adding a language, click <strong>Save changes</strong>, then generate AI. UI buttons
        (nav, etc.) use English labels until a dedicated messages file exists; your portfolio content
        is fully translated.
      </p>

      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer">Available in catalog ({LOCALE_CATALOG.length})</summary>
        <p className="mt-2">
          {LOCALE_CATALOG.map((entry) => entry.code).join(", ")}
        </p>
      </details>

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </AdminSection>
  );
}
